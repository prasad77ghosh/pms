import { NotFound, Conflict } from "http-errors";
import { db } from "../db/databse";

interface CreateProductData {
  name: string;
  price: number;
  image_url?: string;
  category_id: string;
  created_by: string; // user id
}

interface UpdateProductData {
  name?: string;
  price?: number;
  image_url?: string;
  category_id?: string;
}

export class ProductService {
  static async createProduct(data: CreateProductData) {
    const { name, price, image_url, category_id, created_by } = data;

    const categoryCheck = await db.query(
      `SELECT id FROM categories WHERE id = $1`,
      [category_id]
    );

    if (categoryCheck.rows.length === 0) {
      throw new NotFound("Category not found");
    }

    const insertQuery = `
      INSERT INTO products (name, price, image_url, category_id, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, price, image_url, category_id, created_at;
    `;

    const result = await db.query(insertQuery, [
      name,
      price,
      image_url || null,
      category_id,
      created_by,
    ]);

    return result.rows[0];
  }

  static async getProduct(productId: string) {
    const query = `
      SELECT p.id, p.name, p.price, p.image_url, p.category_id, 
             c.name AS category_name, p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1;
    `;

    const result = await db.query(query, [productId]);

    if (result.rows.length === 0) {
      throw new NotFound("Product not found");
    }

    return result.rows[0];
  }

  static async listProducts({
    page = 1,
    limit = 10,
    search = "",
    category = "",
    sort = "price_asc",
  }: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sort?: "price_asc" | "price_desc";
  }) {
    const offset = (page - 1) * limit;

    let baseQuery = `
    SELECT p.id, p.name, p.price, p.image_url, p.created_at,
           c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1 = 1
  `;

    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      baseQuery += ` 
      AND (
        to_tsvector('simple', p.name) @@ plainto_tsquery('simple', $${paramIndex})
        OR c.name ILIKE $${paramIndex + 1}
      )
    `;

      params.push(search);
      params.push(`%${search}%`);
      paramIndex += 2;
    }

    if (category) {
      baseQuery += ` AND c.id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    let orderBy = "ORDER BY p.price ASC";
    if (sort === "price_desc") orderBy = "ORDER BY p.price DESC";

    const finalQuery = `
    ${baseQuery}
    ${orderBy}
    LIMIT ${limit}
    OFFSET ${offset}
  `;

    const result = await db.query(finalQuery, params);

    return {
      page,
      limit,
      products: result.rows,
    };
  }

  static async updateProduct(productId: string, data: UpdateProductData) {
    const fields = [];
    const values: any[] = [];
    let index = 1;

    for (const key in data) {
      fields.push(`${key} = $${index}`);
      values.push((data as any)[key]);
      index++;
    }

    if (fields.length === 0) return;

    const query = `
      UPDATE products 
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, name, price, image_url, category_id, created_at;
    `;

    values.push(productId);

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFound("Product not found");
    }

    return result.rows[0];
  }

  static async deleteProduct(productId: string) {
    const result = await db.query(
      `DELETE FROM products WHERE id = $1 RETURNING id`,
      [productId]
    );

    if (result.rows.length === 0) {
      throw new NotFound("Product not found");
    }

    return { message: "Product deleted successfully" };
  }
}
