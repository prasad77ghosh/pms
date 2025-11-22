import { NotFound, Conflict } from "http-errors";
import { db } from "../db/databse";

interface UpdateUserData {
    name?: string;
    email?: string;
    role?: "admin" | "user";
}

export class UserService {
    /**
     * Get a single user by ID
     */
    static async getUser(userId: string) {
        const query = `
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

        const result = await db.query(query, [userId]);

        if (result.rows.length === 0) {
            throw new NotFound("User not found");
        }

        return result.rows[0];
    }

    /**
     * List all users with pagination and search
     */
    static async listUsers({
        page = 1,
        limit = 10,
        search = "",
        role = "",
    }: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
    }) {
        const offset = (page - 1) * limit;

        let baseQuery = `
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      WHERE 1=1
    `;

        const params: any[] = [];
        let paramIndex = 1;

        if (search) {
            baseQuery += ` AND (
        to_tsvector('simple', name) @@ plainto_tsquery('simple', $${paramIndex})
        OR email ILIKE $${paramIndex + 1}
      )`;
            params.push(search);
            params.push(`%${search}%`);
            paramIndex += 2;
        }

        if (role) {
            baseQuery += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        const finalQuery = `
      ${baseQuery}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

        const result = await db.query(finalQuery, params);

        return {
            page,
            limit,
            data: result.rows,
        };
    }

    /**
     * Update a user
     */
    static async updateUser(userId: string, data: UpdateUserData) {
        // Check if email is being updated and if it already exists
        if (data.email) {
            const emailCheck = await db.query(
                `SELECT id FROM users WHERE email = $1 AND id != $2`,
                [data.email, userId]
            );

            if (emailCheck.rows.length > 0) {
                throw new Conflict("Email already exists");
            }
        }

        const fields = [];
        const values: any[] = [];
        let index = 1;

        for (const key in data) {
            fields.push(`${key} = $${index}`);
            values.push((data as any)[key]);
            index++;
        }

        if (fields.length === 0) return;

        // Add updated_at timestamp
        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, name, email, role, created_at, updated_at;
    `;

        values.push(userId);

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            throw new NotFound("User not found");
        }

        return result.rows[0];
    }

    /**
     * Delete a user
     */
    static async deleteUser(userId: string) {
        const result = await db.query(
            `DELETE FROM users WHERE id = $1 RETURNING id`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw new NotFound("User not found");
        }

        return { message: "User deleted successfully" };
    }
}
