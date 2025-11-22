import { body, param, query } from "express-validator";

export const UserValidator = {
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
