export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  cover: string;
  description: string;
  admin: boolean;
  type: string;
  token?: string;
}

export interface ProfileData {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  cover: string | null;
  admin: boolean;
  description?: string;
  verify: boolean;
}

export interface UserState {
  id: number | null;
  username: string | null;
  email: string | null;
  avatar: string | null;
  cover: string | null;
  description: string | null;
  admin: boolean | null;
  type: string | null;
  token: string | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
