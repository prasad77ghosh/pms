import { body, param, query } from "express-validator";

export const CategoryValidator = {
  
  createValidation: [
    body("name")
      .notEmpty().withMessage("Category name is required")
      .isString().withMessage("Category name must be a string")
  ],

  updateValidation: [
    param("id").isUUID().withMessage("Invalid category ID"),

    body("name")
      .optional()
      .isString()
      .withMessage("Category name must be a string"),
  ],

  getOneValidation: [
    param("id").isUUID().withMessage("Invalid category ID")
  ],

  deleteValidation: [
    param("id").isUUID().withMessage("Invalid category ID")
  ],

  listValidation: [
    query("page").optional().isNumeric(),
    query("limit").optional().isNumeric(),
    query("search").optional().isString(),
  ],
};
