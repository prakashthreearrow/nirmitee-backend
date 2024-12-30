const Response = require("./Response");
const Joi = require("@hapi/joi");
const Helper = require("./Helper");

module.exports = {
  /**
   * @description This function is used to validate User Login fields.
   * @param req
   * @param res
   */
  loginValidation: (req, res, callback) => {
    const schema = Joi.object({
      userName: Joi.string().trim().required(),
      password: Joi.string().trim().required()
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("loginValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate forget password fields.
   * @param req
   * @param res
   */
  forgotPasswordValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().email().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("forgotPasswordValidation", error))
      );
    }
    return callback(true);
  },

  /**
 * @description This function is used to validate user otp verification fields.
 * @param req
 * @param res
 */
  changePasswordValidation: (req, res, callback) => {
    const schema = Joi.object({
      oldPassword: Joi.string()
        .trim()
        .required(),
      password: Joi.string()
        .trim()
        .required(), //.regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("changePasswordValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate user otp verification fields.
   * @param req
   * @param res
   */
  resetPassValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string()
        .pattern(/^([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})$/)
        .required(),
      otp: Joi.string().trim().required(),
      password: Joi.string()
        .trim()
        .min(8)
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/)
        .required(), //.regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("userOtpValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate logout field ID.
   * @param req
   * @param res
   */
  logoutValidation: (req, res, callback) => {
    const schema = Joi.object({
      user_id: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("logoutValidation", error))
      );
    }
    return callback(true);
  },

  /**
   * @description This function is used to validate User status fields.
   * @param req
   * @param res
   */
  userRegistrationValidation: (req, res, callback) => {
    const schema = Joi.object({
      firstName: Joi.string().trim().required(),
      lastName: Joi.string().trim().required(),
      userName: Joi.string().trim().required(),
      email: Joi.string().email().trim().required(),
      password: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("userRegistrationValidation", error))
      );
    }
    return callback(true);
  },

  /**
* @description This function is used to validate verifyEmail field.
* @param req
* @param res
*/
  verifyEmailValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().email().trim().required(),
      otp: Joi.string().trim().max(4).required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("verifyEmailValidation", error))
      );
    }
    return callback(true);
  },

  /**
* @description This function is used to validate resend otp field.
* @param req
* @param res
*/
  resendOtpValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().email().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("resendOtpValidation", error))
      );
    }
    return callback(true);
  },

  /**
* @description This function is used to validate edit profile field.
* @param req
* @param res
*/
  editProfileValidation: (req, res, callback) => {
    const schema = Joi.object({
      firstName: Joi.string().trim().optional(),
      lastName: Joi.string().trim().optional(),
      image: Joi.string().trim().allow("").optional(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("editProfileValidation", error))
      );
    }
    return callback(true);
  },

  /**
 * @description This function is used to validate appointment fields.
 * @param req
 * @param res
 */
  addEditAppointmentValidation: (req, res, callback) => {
    const schema = Joi.object({
      id: Joi.string().trim().optional(),
      title: Joi.string().trim().required(),
      date: Joi.string().trim().required(),
      startTime: Joi.string().trim().required(),
      endTime: Joi.string().trim().required(),
    });
    const { error } = schema.validate(req);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("createAppointmentValidation", error))
      );
    }
    return callback(true);
  },
};
