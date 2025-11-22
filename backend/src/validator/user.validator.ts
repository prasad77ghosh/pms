import { body, param, query } from "express-validator";

export const UserValidator = {
    createValidation: [
        body("name")
            .notEmpty()
            .withMessage("Name is required")
            .isString()
            .withMessage("Name must be a string")
            .isLength({ min: 2, max: 150 })
            .withMessage("Name must be between 2 and 150 characters"),

        body("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email must be valid")
            .normalizeEmail(),

        body("password")
            .notEmpty()
            .withMessage("Password is required")
            .isString()
            .withMessage("Password must be a string")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters long"),

        body("role")
            .notEmpty()
            .withMessage("Role is required")
            .isIn(["admin", "user"])
            .withMessage("Role must be either 'admin' or 'user'"),
    ],

    updateValidation: [
        param("id").isUUID().withMessage("Invalid user ID"),

        body("name")
            .optional()
            .isString()
            .withMessage("Name must be a string")
            .isLength({ min: 2, max: 150 })
            .withMessage("Name must be between 2 and 150 characters"),

        body("email")
            .optional()
            .isEmail()
            .withMessage("Email must be valid")
            .normalizeEmail(),

        body("role")
            .optional()
            .isIn(["admin", "user"])
            .withMessage("Role must be either 'admin' or 'user'"),
    ],

    getOneValidation: [param("id").isUUID().withMessage("Invalid user ID")],

    deleteValidation: [param("id").isUUID().withMessage("Invalid user ID")],

    listValidation: [
        query("page").optional().isNumeric().withMessage("Page must be a number"),
        query("limit")
            .optional()
            .isNumeric()
            .withMessage("Limit must be a number"),
        query("search").optional().isString().withMessage("Search must be a string"),
        query("role")
            .optional()
            .isIn(["admin", "user"])
            .withMessage("Role must be either 'admin' or 'user'"),
    ],
};
