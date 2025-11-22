import { Conflict, NotFound, Unauthorized } from "http-errors";
import { EncryptAndDecryptService } from "../utils/encrtiption.service";
import { JwtService } from "../utils/jwt.service";
import { db } from "../db/databse";

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  // REGISTER -----------------------------
  static async register({ name, email, password }: RegisterData) {
    const userExistQuery = `SELECT id FROM users WHERE email = $1 LIMIT 1`;
    const existingUser = await db.query(userExistQuery, [email]);

    if (existingUser.rows.length > 0) {
      throw new Conflict("A user already exists with this email");
    }

    const encryptedPassword = await new EncryptAndDecryptService().hashPassword(password);

    const insertQuery = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, role, created_at;
    `;

    const result = await db.query(insertQuery, [name, email, encryptedPassword]);
    const user = result.rows[0];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }

  // LOGIN -----------------------------
  static async login({ email, password }: LoginData) {
    const userQuery = `
      SELECT id, name, email, password, role
      FROM users
      WHERE email = $1
      LIMIT 1;
    `;

    const result = await db.query(userQuery, [email]);

    if (result.rows.length === 0) {
      throw new NotFound("User not found");
    }

    const user = result.rows[0];

    const isPasswordValid = await new EncryptAndDecryptService().comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Unauthorized("Invalid credentials");
    }

    const payload = { userId: user.id, email: user.email, role: user.role };

    const jwtService = new JwtService();
    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  }

  // ROTATE TOKENS -----------------------------
  static async rotateTokens(refreshToken: string) {
    const jwtService = new JwtService();

    const decoded = jwtService.verifyRefreshToken(refreshToken);

    const payload = { userId: decoded.userId, email: decoded.email, role: decoded.role };

    const accessToken = jwtService.generateAccessToken(payload);

    return { accessToken };
  }

  // GET PROFILE -----------------------------
  static async getProfile(userId: string) {
    const query = `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = $1;
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new NotFound("User not found");
    }

    return result.rows[0];
  }
}
