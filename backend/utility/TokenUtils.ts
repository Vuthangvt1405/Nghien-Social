import jwt from "jsonwebtoken";
import { dataPayloadUser, dataPayloadRefreshToken } from "../dto";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class Token {
  static generateToken(payload: dataPayloadUser): string {
    const secret: string = process.env.JWT_SECRET as string;
    let expire: string = process.env.JWT_SECRET_EXPIRES_IN as string;
    const sign: string = jwt.sign(payload, secret, {
      expiresIn: expire,
    } as jwt.SignOptions);
    return sign;
  }

  static generateRefreshToken(payload: dataPayloadRefreshToken): string {
    const secret = process.env.JWT_REFRESH_SECRET as string;
    let expire = process.env.JWT_REFRESH_SECRET_EXPIRES_IN as string;
    const sign: string = jwt.sign(payload, secret, {
      expiresIn: expire,
    } as jwt.SignOptions);
    return sign;
  }

  static verifyToken = (token: string) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      if (typeof decoded === "string") {
        return null;
      }
      return decoded;
    } catch (error) {
      return null;
    }
  };

  static verifyRefreshToken = (token: string) => {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET as string
      );
      if (typeof decoded === "string") {
        return null;
      }
      return decoded;
    } catch (error) {
      return null;
    }
  };

  static verifyGoogleToken = async (token: string): Promise<any> => {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return null;
      }
      return {
        userId: payload.sub,
        email: payload.email,
        avatar: payload.picture,
        cover: "",
        admin: 0,
        username: payload.name,
      };
    } catch (error) {
      return null;
    }
  };
}
