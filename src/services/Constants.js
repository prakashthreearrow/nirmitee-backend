module.exports = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  PAGE_NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER: 500,
  NOT_ACCEPTABLE: 406,
  DATA_CONFLICT: 409,
  CREATED: 201,
  FAIL: 400,
  ACTIVE: "1",
  INACTIVE: "0",
  DELETE: "2",
  PER_PAGE: 10,
  ROLE: {
    USER: 1,
    DOCTOR: 2,
  },
  USER_MODEL: {
    EMAIL_VERIFY_OTP_EXPIRY_MINUTE: 10,
  },
  MAIL_SUBJECT_MESSAGE_REGISTRATION:
    "Welcome to Our Platform - Registration Successful",
  MAIL_SUBJECT_MESSAGE_RESEND_OTP: "New OTP for verification",
  MAIL_SUBJECT_FORGET_PASSWORD: "Password Reset Request",
  VERIFY_EMAIL: "Verify your email.",
  S3_ENABLE: "true",
  PROFILE_PIC: "profilePicture"
};
