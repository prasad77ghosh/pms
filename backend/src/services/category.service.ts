import { Conflict, NotFound } from "http-errors";
import { db } from "../db/databse";

interface CreateCategoryData {
  name: string;
}

interface UpdateCategoryData {
  name?: string;
}

export class CategoryService {
  static async createCategory({ name }: CreateCategoryData) {
    const existing = await db.query(
      `SELECT id FROM categories WHERE name = $1`,
      [name]
    );

    if (existing.rows.length > 0) {
      throw new Conflict("Category name already exists");
    }

    const insertQuery = `
      INSERT INTO categories (name)
      VALUES ($1)
      RETURNING id, name, created_at, updated_at;
    `;

    const result = await db.query(insertQuery, [name]);
    return result.rows[0];
  }

  static async listCategories({
    page = 1,
    limit = 10,
    search = "",
  }: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const offset = (page - 1) * limit;

    const params: any[] = [];
    let index = 1;

    let baseQuery = `
      SELECT id, name, created_at, updated_at
      FROM categories
      WHERE 1=1
    `;

    if (search) {
      baseQuery += ` AND to_tsvector('simple', name) @@ plainto_tsquery('simple', $${index})`;
      params.push(search);
      index++;
    }

    const finalQuery = `
      ${baseQuery}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const result = await db.query(finalQuery, params);

    // Count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM categories
      WHERE 1=1${search ? ` AND to_tsvector('simple', name) @@ plainto_tsquery('simple', $1)` : ''}
    `;

    const countParams = search ? [search] : [];
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    return {
      page,
      limit,
      total,
      data: result.rows,
    };
  }

  static async getCategory(id: string) {
    const query = `
      SELECT id, name, created_at, updated_at
      FROM categories
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) throw new NotFound("Category not found");

    return result.rows[0];
  }

  static async updateCategory(id: string, data: UpdateCategoryData) {
    const fields = [];
    const values: any[] = [];
    let index = 1;

    for (const key in data) {
      fields.push(`${key} = $${index}`);
      values.push((data as any)[key]);
      index++;
    }

    // update timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE categories
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, name, created_at, updated_at;
    `;

    values.push(id);

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFound("Category not found");
    }

    return result.rows[0];
  }

  static async deleteCategory(id: string) {
    const result = await db.query(
      `DELETE FROM categories WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFound("Category not found");
    }

    return { message: "Category deleted successfully" };
  }
}
