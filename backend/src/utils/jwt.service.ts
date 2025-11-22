import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

export class JwtService {
  private accessSecret: Secret = (process.env.JWT_ACCESS_SECRET ?? "access_secret") as Secret;
  private refreshSecret: Secret = (process.env.JWT_REFRESH_SECRET ?? "refresh_secret") as Secret;

  private readonly accessExpiry = "15d" as const;
  private readonly refreshExpiry = "7d" as const;

  generateAccessToken(payload: object): string {
    const options: SignOptions = { expiresIn: this.accessExpiry };
    return jwt.sign(payload, this.accessSecret, options);
  }

  generateRefreshToken(payload: object): string {
    const options: SignOptions = { expiresIn: this.refreshExpiry };
    return jwt.sign(payload, this.refreshSecret, options);
  }

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, this.accessSecret) as JwtPayload;
  }

  verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, this.refreshSecret) as JwtPayload;
  }
}
