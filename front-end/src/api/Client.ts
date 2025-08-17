import Cookies from "js-cookie"; // npm install js-cookie
import { userAPI } from "./rootApi";
import type { GoogleCredentialResponse } from "@react-oauth/google";

interface FormData {
  username: string;
  email: string;
  password: string;
}

interface FormLogin {
  email: string;
  password: string;
}

// REQUEST INTERCEPTOR - Add auth token to requests
userAPI.interceptors.request.use(
  (config) => {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const register = async (formData: FormData) => {
  const response = await userAPI.post("/users/sign-up", formData);
  console.log(response);
  return response;
};

export const login = async (loginData: FormLogin) => {
  const response = await userAPI.post("/users/login", loginData);
  return response;
};

export const loginUserGoogle = async (
  credentialResponse: GoogleCredentialResponse
) => {
  const token = credentialResponse.credential;
  console.log(token);
  const response = await userAPI.post(
    "/users/auth/google-auth",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response;
};

interface payloadUser {
  username: string;
  email: string;
  password?: string;
  avatar: string;
  cover: string;
}
export const saveUserProfile = async (userId: number, payload: payloadUser) => {
  const result = await userAPI.patch(`/users/${userId}`, payload);
  return result;
};

export const uploadAvtarUser = async (file: File) => {
  const formData = new FormData();
  formData.append("source", file);
  const result = await userAPI.post("/users/upload-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return result;
};

export const uploadCoverUser = async (file: File) => {
  const formData = new FormData();
  formData.append("source", file);
  const result = await userAPI.post("/users/upload-cover", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return result;
};

export const fetchProfile = async (username: string) => {
  const response = await userAPI.get(`/users/profile/${username}`);
  return response;
};

export const updateProfile = async (profile: {
  username?: string;
  email?: string;
  password?: string;
  avatar?: string;
  cover?: string;
  description?: string;
}) => {
  try {
    // Filter out undefined values
    const payload = Object.fromEntries(
      Object.entries(profile).filter(([, value]) => value !== undefined)
    );

    const response = await userAPI.patch("/users/edit-profile", payload);
    return response.data;
  } catch (err) {
    console.error("Failed to update profile:", err);
    throw err; // optional: rethrow for handling at call site
  }
};

export const sendOTPEmail = async (email: string) => {
  const response = await userAPI.post("/users/OTP/email/send", { email });
  return response;
};

export const verifyOTPEmail = async (email: string, otp: number) => {
  const response = await userAPI.post("/users/OTP/email/verify", {
    email,
    otp,
  });
  return response;
};

export const changePassword = async (password: string, credential: string) => {
  const response = await userAPI.patch(
    "/users/change-password",
    {
      newPassword: password,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credential}`,
      },
    }
  );
  return response;
};

export const getUserStat = async (username: string) => {
  const response = await userAPI.get(`/users/stats?username=${username}`);
  return response;
};

export const getPostsByUsername = async (username: string) => {
  const response = await userAPI.get(`/posts/username/${username}`);
  return response;
};

export const getProfileByUsername = async (username: string) => {
  const response = await userAPI.get(`/users/profile/${username}`);
  return response;
};
