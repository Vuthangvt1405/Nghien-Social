export interface dataPayloadUser {
  id: number | undefined;
  username: string;
  email: string;
  cover?: string;
  avatar?: string;
  admin?: boolean;
  description?: string;
  type: string;
}

export interface dataPayloadRefreshToken {
  id: number | undefined;
}
