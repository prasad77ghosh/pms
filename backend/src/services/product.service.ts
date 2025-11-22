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

    // Base query with filters
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

    // Sorting
    let orderBy = "ORDER BY p.price ASC";
    if (sort === "price_desc") orderBy = "ORDER BY p.price DESC";

    // Final paginated query
    const finalQuery = `
      ${baseQuery}
      ${orderBy}
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    const result = await db.query(finalQuery, params);

    // Count query for total items (same filters, no limit/offset)
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1 = 1${search ? ` AND (to_tsvector('simple', p.name) @@ plainto_tsquery('simple', $1) OR c.name ILIKE $2)` : ''}${category ? ` AND c.id = $${search ? 3 : 1}` : ''}
    `;
    const countParams: any[] = [];
    if (search) {
      countParams.push(search);
      countParams.push(`%${search}%`);
    }
    if (category) {
      countParams.push(category);
    }
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    return {
      page,
      limit,
      total,
      products: result.rows,
    };
  }

  static async updateProduct(id: string, updates: UpdateProductData) {
    const { name, price, image_url, category_id } = updates;

    // Check if product exists
    const productCheck = await db.query(`SELECT id FROM products WHERE id = $1`, [
      id,
    ]);

    if (productCheck.rows.length === 0) {
      throw new NotFound("Product not found");
    }

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (price !== undefined) {
      fields.push(`price = $${paramIndex}`);
      values.push(price);
      paramIndex++;
    }

    if (image_url !== undefined) {
      fields.push(`image_url = $${paramIndex}`);
      values.push(image_url);
      paramIndex++;
    }

    if (category_id !== undefined) {
      // Verify category exists if being updated
      const categoryCheck = await db.query(
        `SELECT id FROM categories WHERE id = $1`,
        [category_id]
      );
      if (categoryCheck.rows.length === 0) {
        throw new NotFound("Category not found");
      }

      fields.push(`category_id = $${paramIndex}`);
      values.push(category_id);
      paramIndex++;
    }

    if (fields.length === 0) {
      return productCheck.rows[0]; // No updates
    }

    values.push(id);
    const query = `
      UPDATE products 
      SET ${fields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await db.query(query, values);
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
