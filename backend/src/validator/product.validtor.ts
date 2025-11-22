import { body, param, query } from "express-validator";

export const ProductValidator = {
  createValidation: [
    body("name")
      .notEmpty()
      .withMessage("Product name is required")
      .isString()
      .withMessage("Product name must be a string"),

    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isFloat({ gt: 0 })
      .withMessage("Price must be a number greater than 0"),

    body("category_id")
      .notEmpty()
      .withMessage("Category ID is required")
      .isUUID()
      .withMessage("Category ID must be a valid UUID"),

    body("image_url")
      .optional()
      .isString()
      .withMessage("Image URL must be a string"),
  ],

  updateValidation: [
    param("id").isUUID().withMessage("Invalid product ID"),

    body("name").optional().isString().withMessage("Name must be a string"),

    body("price")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Price must be a valid number"),

    body("category_id")
      .optional()
      .isUUID()
      .withMessage("Category ID must be a valid UUID"),

    body("image_url")
      .optional()
      .isString()
      .withMessage("Image URL must be a string"),
  ],

  getOneValidation: [param("id").isUUID().withMessage("Invalid product ID")],

  deleteValidation: [param("id").isUUID().withMessage("Invalid product ID")],

  listValidation: [
    query("page").optional().isNumeric(),
    query("limit").optional().isNumeric(),
    query("search").optional().isString(),
    query("category").optional().isUUID(),
    query("sort")
      .optional()
      .isIn([
        "name_asc",
        "name_desc",
        "price_asc",
        "price_desc",
        "created_at_asc",
        "created_at_desc",
        "category_asc",
        "category_desc",
      ])
      .withMessage(
        "sort must be one of: name_asc, name_desc, price_asc, price_desc, created_at_asc, created_at_desc, category_asc, category_desc"
      ),
  ],
};
