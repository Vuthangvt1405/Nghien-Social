import { Request } from "express";

export interface UserInput {
  userId: number;
  email: string;
  username: string;
  admin: boolean;
  password: string;
  avatar?: string;
  cover?: string;
  description?: string;
  type: string;
}

export interface userResponse {
  id: number;
  name: string;
  email: string;
  password: string;
  avatar: string;
  cover: string;
  token: string;
  refreshToken: string;
}

export interface UserUpdateInput {
  userId: number;
  username: string;
  email: string;
}

export interface RequestExtendUser extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    admin: boolean;
  };
  file?: Express.Multer.File;
}

export interface statObject {
  user_id: number;
  username: string;
  follower_count: number;
  following_count: number;
  post_count: number;
}
