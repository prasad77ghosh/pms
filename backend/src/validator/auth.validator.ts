import { body, cookie } from "express-validator";
import { NotAcceptable } from "http-errors";

export const AuthControllerValidator = {
  // 🔹 REGISTER VALIDATION
  registerValidation: [
    body("name")
      .notEmpty()
      .withMessage("name is required")
      .bail()
      .isString()
      .withMessage("name must be a string"),

    body("email")
      .notEmpty()
      .withMessage("email is required")
      .bail()
      .isEmail()
      .withMessage("email must be a valid email address"),

    body("password")
      .notEmpty()
      .withMessage("password is required")
      .bail()
      .isLength({ min: 8 })
      .withMessage("password must be at least 8 characters long"),
    // Uncomment below for strong password policy
    // .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/)
    // .withMessage("password must contain one uppercase letter, one lowercase letter, one number, and one special character"),

    body("confirmPassword")
      .notEmpty()
      .withMessage("confirmPassword is required")
      .bail()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new NotAcceptable("Password and confirmPassword do not match");
        }
        return true;
      }),
  ],

  // 🔹 LOGIN VALIDATION
  loginValidation: [
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .bail()
      .isEmail()
      .withMessage("email must be valid"),

    body("password")
      .notEmpty()
      .withMessage("password is required")
      .bail()
      .isString()
      .withMessage("password must be a string"),
  ],

  // 🔹 REFRESH TOKEN VALIDATION
  refreshValidation: [
    cookie("refresh_token")
      .notEmpty()
      .withMessage("Refresh token cookie is missing")
      .bail()
      .isString()
      .withMessage("Refresh token must be a string"),
  ],

  // 🔹 LOGOUT VALIDATION (optional)
  logoutValidation: [
    cookie("access_token")
      .optional()
      .isString()
      .withMessage("Access token must be a string"),
    cookie("refresh_token")
      .optional()
      .isString()
      .withMessage("Refresh token must be a string"),
  ],
};
