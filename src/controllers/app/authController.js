const Transformer = require("object-transformer");
const bcrypt = require("bcrypt");
const Response = require("../../services/Response");
const { ACTIVE, FAIL, BAD_REQUEST, SUCCESS, INTERNAL_SERVER, MAIL_SUBJECT_FORGET_PASSWORD, USER_MODEL } = require("../../services/Constants");
const { AppName, forgotTemplate, makeRandomOTPNumber } = require("../../services/Helper");
const Mailer = require("../../services/Mailer");
const {
  loginValidation,
  logoutValidation,
  forgotPasswordValidation,
  resetPassValidation,
  changePasswordValidation,
} = require("../../services/UserValidation");
const { Login } = require("../../transformers/user/userAuthTransformer");
const { User } = require("../../models");
const { issueUser } = require("../../services/User_jwtToken");

module.exports = {
  /**
   * @description "This function is for User-Login."
   * @param req
   * @param res
   */
  login: async (req, res) => {
    try {
      const { userName, password } = req.body; // Rename to a common identifier

      // Validate the input parameters
      loginValidation(req.body, res, async (validate) => {
        if (!validate) return;

        // Find user by email or username (case-insensitive)
        const user = await User.findOne(
          {
            $or: [
              { email: userName.trim().toLowerCase() }, // Match email
              { userName: userName.trim().toLowerCase() }, // Match username
            ],
          },
          { emailVerify: 1, status: 1, password: 1, role: 1 } // Only fetch required fields
        ).lean();

        if (!user) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("userNameOrEmailNotExist"), // Updated error message
            FAIL
          );
        }

        if (!user.emailVerify) {
          let data = {
            emailVerify: user.emailVerify,
          };
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("emailNotVerified"),
            BAD_REQUEST,
            data
          );
        }

        if (user.status !== ACTIVE) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("accountIsInactive"),
            FAIL
          );
        }

        // Compare provided password with stored hashed password
        const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
        if (!isPasswordValid) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("emailPasswordNotMatch"),
            BAD_REQUEST
          );
        }

        // Generate a token with 24-hour expiration
        const userExpTime = Date.now() + 24 * 60 * 60 * 1000;
        const payload = {
          id: user._id,
          role: user.role,
          exp: userExpTime,
        };
        const token = issueUser(payload);

        // Update the user's token in the database
        await User.updateOne({ _id: user._id }, { $set: { token } });

        // Prepare response metadata
        const meta = { token };

        // Return success response
        return Response.successResponseData(
          res,
          new Transformer.Single(user, Login).parse(),
          SUCCESS,
          res.locals.__("loginSuccess"),
          meta
        );
      });
    } catch (error) {
      console.error("Login Error:", error);
      return Response.errorResponseData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  },


  /**
   * @description This function is for Forgot Password of user.
   * @param req
   * @param res
   */
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Validate request parameters
      forgotPasswordValidation(req.body, res, async (isValid) => {
        if (!isValid) return;

        // Check if user exists
        const user = await User.findOne({ email }, { name: 1, status: 1 }).lean();
        if (!user) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("emailNotExists"),
            FAIL
          );
        }

        // Check if the user's account is active
        if (user.status !== ACTIVE) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("accountIsInactive"),
            FAIL
          );
        }

        // Generate OTP and expiry time
        const otp = makeRandomOTPNumber(4);
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + USER_MODEL.EMAIL_VERIFY_OTP_EXPIRY_MINUTE);

        // Update user with OTP and expiry time
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              otp,
              codeExpiry: expiryTime,
            },
          }
        );

        // Send OTP email
        const mailLocals = {
          appName: AppName,
          otp,
        };

        await Mailer.sendMail(
          email,
          MAIL_SUBJECT_FORGET_PASSWORD,
          forgotTemplate,
          mailLocals
        );

        // Return success response
        return Response.successResponseData(
          res,
          otp,
          SUCCESS,
          res.locals.__("forgotPasswordEmailSendSuccess")
        );
      });
    } catch (error) {
      // Handle unexpected errors
      return Response.errorResponseData(
        res,
        error.message,
        INTERNAL_SERVER
      );
    }
  },

  /**
   * @description This function is for reset Password of user with otp verification.
   * @param req
   * @param res
   */
  resetPassword: async (req, res) => {
    try {
      const { email, otp, password } = req.body;
      resetPassValidation(req.body, res, async (isValid) => {
        if (!isValid) return;

        // Fetch user details based on email and OTP
        const user = await User.findOne(
          { email, otp },
          { otp: 1, email: 1, codeExpiry: 1, password: 1 }
        ).lean();

        if (!user || user.email !== email) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("emailNotExist"),
            BAD_REQUEST
          );
        }

        // Validate OTP
        if (user.otp !== otp) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("invalidOtp"),
            BAD_REQUEST
          );
        }

        // Check if OTP is expired
        if (user.codeExpiry.getTime() < Date.now()) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("otpExpired"),
            BAD_REQUEST
          );
        }

        // Check if the new password matches the old password
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("oldPasswordNotAllowed"),
            BAD_REQUEST
          );
        }

        // Update the user's password
        const hashedPassword = bcrypt.hashSync(password, 10);
        await User.findByIdAndUpdate(user._id, {
          $set: { password: hashedPassword, codeExpiry: null },
        });

        return Response.successResponseWithoutData(
          res,
          res.locals.__("passwordResetSuccessfully"),
          SUCCESS
        );
      });
    } catch (error) {
      return Response.errorResponseData(res, error.message, INTERNAL_SERVER);
    }
  },

  /**
   * @description Handles user password change functionality.
   * @param  req - Express request object containing user input and authentication details.
   * @param  res - Express response object for sending responses.
   */
  changePassword: async (req, res) => {
    try {
      const { authUserId } = req; // Authenticated user's ID
      const { oldPassword, password } = req.body;

      // Validate the input parameters
      changePasswordValidation(req.body, res, async (isValid) => {
        if (!isValid) return;

        // Retrieve the user's current password from the database
        const user = await User.findOne({ _id: authUserId }, { password: 1 });
        if (!user) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("userNotExist"),
            BAD_REQUEST
          );
        }

        // Verify the old password
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("oldPasswordIncorrect."),
            BAD_REQUEST
          );
        }

        // Hash the new password and update the database
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
          { _id: authUserId },
          {
            $set: {
              password: hashedPassword,
              passwordText: password, // Optional: Store plain text for specific needs
            },
          }
        );

        // Respond with a success message
        return Response.successResponseWithoutData(
          res,
          res.locals.__("passwordChangedSuccessfully."),
          SUCCESS
        );
      });
    } catch (error) {
      // Handle unexpected errors
      return Response.errorResponseData(
        res,
        res.locals.__("internalError."),
        INTERNAL_SERVER
      );
    }
  },

  /**
   * @description "This function is to logout user."
   * @param req
   * @param res
   */
  logout: async (req, res) => {
    try {
      const { user_id } = req.body;
      logoutValidation(req.body, res, async (validate) => {
        if (validate) {
          await User.updateOne(
            { userName: user_id },
            {
              $set: {
                token: null
              },
            }
          );

          return Response.successResponseWithoutData(
            res,
            res.locals.__("logout"),
            SUCCESS
          );
        }
      });
    } catch (error) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("internalError"),
        INTERNAL_SERVER
      );
    }
  }
};
