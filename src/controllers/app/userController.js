const bcrypt = require("bcrypt");
const moment = require("moment");
const {
  userRegistrationValidation,
  verifyEmailValidation,
  resendOtpValidation,
  editProfileValidation
} = require("../../services/UserValidation");
const Response = require("../../services/Response");
const {
  User
} = require("../../models");
const { newRegistration, resendOtp, makeRandomOTPNumber, AppName } = require("../../services/Helper");
const { MAIL_SUBJECT_MESSAGE_REGISTRATION, USER_MODEL, INACTIVE, INTERNAL_SERVER, BAD_REQUEST, SUCCESS, ACTIVE, FAIL, MAIL_SUBJECT_MESSAGE_RESEND_OTP, PROFILE_PIC, ROLE } = require("../../services/Constants");
const Mailer = require("../../services/Mailer");
const { base64ImageUpload, mediaUrlForS3, removeOldImage } = require("../../services/S3Bucket");

module.exports = {
  /**
   * @description This function is for user registration.
   * @param req
   * @param res
   */
  userRegistration: async (req, res) => {
    try {
      const { firstName, lastName, userName, email, password } = req.body;

      // Validate request parameters
      userRegistrationValidation(req.body, res, async (isValid) => {
        if (!isValid) return;

        // Check if the user already exists
        const existingUser = await User.findOne({ userName });

        if (existingUser) {
          return Response.errorResponseData(
            res,
            res.__("userAlreadyExist"),
            BAD_REQUEST
          );
        }

        // Hash the user's password
        const hashedPassword = await bcrypt.hash(password, 10);

        let newUserObj = {
          firstName,
          lastName,
          userName,
          email,
          password: hashedPassword,
          status: INACTIVE,
          role: ROLE.USER,
        }

        // Create a new user with default status as INACTIVE
        const newUser = await User.create(newUserObj);

        // Generate OTP and expiry time
        const otp = makeRandomOTPNumber(4);
        const otpExpiry = new Date();
        otpExpiry.setMinutes(
          otpExpiry.getMinutes() + USER_MODEL.EMAIL_VERIFY_OTP_EXPIRY_MINUTE
        );

        // Save OTP to the database
        await User.updateOne({ _id: newUser._id }, {
          $set: {
            otp,
            codeExpiry: otpExpiry
          },
        });

        // Prepare email template variables
        const emailData = {
          username: newUser.userName,
          appName: AppName,
          otp,
        };

        // Send verification email
        Mailer.sendMail(
          email,
          MAIL_SUBJECT_MESSAGE_REGISTRATION,
          newRegistration,
          emailData
        );

        // Respond with success
        return Response.successResponseWithoutData(
          res,
          res.__("otpSent"),
          SUCCESS
        );
      });
    } catch (error) {
      // Handle unexpected errors
      console.error("Error in userRegistration:", error.message);
      return Response.errorResponseData(
        res,
        res.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },

  /**
 * @description "This function is to verify email."
 * @param req
 * @param res
 */
  verifyEmail: async (req, res) => {
    try {
      const { otp, email } = req.body;
      // Validate the OTP and email provided in the request
      verifyEmailValidation(req.body, res, async (validate) => {
        if (validate) {
          // Define the query to search for the user by OTP and email
          const findQuery = {
            $and: [
              { otp: { $eq: otp } },
              { email: { $eq: email } },
            ],
          };

          // Search for the user in the database
          const user = await User.findOne(findQuery, { otp_expiry: 1 }).lean();
          console.log("user", user);

          if (user) {
            // Check if the OTP has expired
            const currentTime = new Date();
            const otpExpiryTime = new Date(user.otp_expiry);

            if (currentTime.getTime() > otpExpiryTime.getTime()) {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__("otpExpired"),
                FAIL
              );
            }

            // If OTP is valid and not expired, proceed with email verification
            const currentDateTime = moment().toDate();
            const updateQuery = {
              email: { $eq: email },
            };

            // Update the user's status to active and verified
            await User.updateOne(updateQuery, {
              $set: {
                emailVerify: currentDateTime,
                status: ACTIVE,
                otp_expiry: null, // Clear OTP expiry
              },
            });

            // Respond with success
            return Response.successResponseWithoutData(
              res,
              res.__("emailVerified"),
              SUCCESS
            );
          } else {
            // If no user found with the provided OTP and email
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("invalidOtp"),
              FAIL
            );
          }
        }
      });
    } catch (error) {
      // Handle unexpected errors
      return Response.errorResponseData(res, res.__("internalError"), error);
    }
  },

  /**
* @description "This function is for re-send OTP."
* @param req
* @param res
*/
  resendOtp: async (req, res) => {
    try {
      const { email } = req.body;
      // Validate the request parameters
      resendOtpValidation(req.body, res, async (validate) => {
        if (validate) {
          // Find the user based on the provided email
          let user = await User.findOne({ email: email }, { userName: 1 }).lean();

          if (user) {
            // Generate a new OTP
            const OTP = makeRandomOTPNumber(4);

            // Set OTP expiry time
            const otpExpiry = new Date();
            otpExpiry.setMinutes(otpExpiry.getMinutes() + USER_MODEL.EMAIL_VERIFY_OTP_EXPIRY_MINUTE);

            // Save OTP to the database
            await User.updateOne({ _id: user._id }, {
              $set: {
                otp: OTP,
                codeExpiry: otpExpiry
              },
            });

            // Prepare email data for sending OTP
            const LOCALS = {
              username: user.userName,
              appName: AppName,
              otp: OTP,
            };

            // Send the OTP to the user's email
            await Mailer.sendMail(
              email,
              MAIL_SUBJECT_MESSAGE_RESEND_OTP,
              resendOtp, // Ensure this is the correct template
              LOCALS
            );

            // Return success response
            return Response.successResponseWithoutData(
              res,
              res.__("otpResendToEmail"),
              SUCCESS
            );
          } else {
            // User not found
            return Response.errorResponseWithoutData(
              res,
              res.__("userNotExist"),
              FAIL
            );
          }
        }
      });
    } catch (error) {
      console.error("Error in resendOtp:", error); // Log the error for debugging
      return Response.errorResponseData(res, res.__("internalError"), error);
    }
  },

  /**
 * @description "This function is to get user data."
 * @param req
 * @param res
 */
  getUserDetail: async (req, res) => {
    try {
      const { authUserId } = req;

      // Fetch user details with active status
      const user = await User.findOne({
        _id: authUserId,
        status: ACTIVE,
      }, { firstName: 1, lastName: 1, email: 1, image: 1, role: 1 }).lean();

      if (!user) {
        return Response.errorResponseWithoutData(
          res,
          res.locals.__("userNotFound"),
          BAD_REQUEST
        );
      }
      // Extract only the required keys
      const { _id, firstName, lastName, email, image, role } = user;

      // Prepare the response object
      const userResponse = {
        _id,
        firstName,
        lastName,
        email,
        image: image ? mediaUrlForS3(`${PROFILE_PIC}`,
          authUserId, image,) : "", // Modify image URL
        role
      };

      return Response.successResponseData(
        res,
        userResponse,
        SUCCESS,
        res.locals.__("userDetailsFetched")
      );
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalServerError"),
        INTERNAL_SERVER
      );
    }
  },

  /**
  * @description "This function is used to edit the user's profile, including dynamic key-value updates and image upload."
  * @param {Object} req - Express request object
  * @param {Object} res - Express response object
  */
  editProfile: async (req, res) => {
    try {
      const { firstName, lastName, image } = req.body;
      const { authUserId } = req;
      // Validate all the fields passed in the body
      editProfileValidation(req.body, res, async (validate) => {
        if (validate) {
          const userObj = {};

          // Check and handle image upload if provided
          if (image) {
            const extension = image.split(";")[0].split("/")[1];
            const randomNumber = await makeRandomOTPNumber(5);
            const imageName = `${moment().unix()}${randomNumber}.${extension}`;
            const formattedDate = moment().format("DD-MM-YYYY");
            let userImage = await User.findOne({ _id: authUserId }, { image: 1 }).lean();
            removeOldImage(userImage.image, `${PROFILE_PIC}/${authUserId}`)
            // Upload the image to the specified location
            const profileImage = await base64ImageUpload(
              imageName,
              `${PROFILE_PIC}/${authUserId}`,
              image,
              res
            );

            if (profileImage) {
              userObj.image = imageName;
            }
          }

          // Dynamically add other fields to the user object
          if (firstName) userObj.firstName = firstName;
          if (lastName) userObj.lastName = lastName;

          // Update the user's profile in the database
          await User.updateOne(
            { _id: authUserId },
            {
              $set: userObj,
            }
          );

          return Response.successResponseWithoutData(
            res,
            res.locals.__("profileUpdated"),
            SUCCESS
          );
        }
      });
    } catch (error) {
      return Response.errorResponseData(
        res,
        res.locals.__("internalServerError"),
        INTERNAL_SERVER
      );
    }
  },

};
