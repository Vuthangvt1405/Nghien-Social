import apiService from "./apiService";
import type { GoogleCredentialResponse } from "@react-oauth/google";
import type { ProfileData, User } from "./types";
import Cookies from "js-cookie";

// Định nghĩa một kiểu dữ liệu chung cho các response trả về user
interface UpdateResponse {
  message: string;
  user?: User; // Dùng cho updateUser
  payload?: User; // Dùng cho uploadAvatar/uploadCover
}

interface FormData {
  username: string;
  email: string;
  password: string;
}

interface FormLogin {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  user: {
    token: string;
  };
}

interface GoogleLoginResponse {
  message?: string;
  user?: User;
  token?: string;
}

class UserService {
  register(formData: FormData) {
    return apiService.post("/users/sign-up", formData);
  }

  login(loginData: FormLogin) {
    return apiService.post<LoginResponse>("/users/login", loginData);
  }

  loginUserGoogle(credentialResponse: GoogleCredentialResponse) {
    const token = credentialResponse.credential;
    return apiService.post<GoogleLoginResponse>(
      "/users/auth/google-auth",
      {},
      {
        headers: {
          "X-Google-Token": token,
        },
      }
    );
  }

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("source", file);
    const response = await apiService.post<UpdateResponse>(
      "/users/upload-avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const user = response.data.payload;
    if (!user || !user.token) {
      throw new Error(
        "Avatar upload response did not include user data or token."
      );
    }

    Cookies.set("authToken", user.token, {
      expires: 7,
      secure: true,
      sameSite: "strict",
    });
    const { ...userData } = user;
    return userData;
  }

  async uploadCover(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("source", file);
    const response = await apiService.post<UpdateResponse>(
      "/users/upload-cover",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const user = response.data.payload;
    if (!user || !user.token) {
      throw new Error(
        "Cover upload response did not include user data or token."
      );
    }

    Cookies.set("authToken", user.token, {
      expires: 7,
      secure: true,
      sameSite: "strict",
    });
    const { ...userData } = user;
    return userData;
  }

  fetchProfile(username: string) {
    return apiService.get(`/users/profile/${username}`);
  }

  async updateProfile(profile: {
    username?: string;
    password?: string;
    description?: string;
  }): Promise<User> {
    const payload = Object.fromEntries(
      Object.entries(profile).filter(
        ([, value]) => value !== undefined && value !== ""
      )
    );
    const response = await apiService.patch<UpdateResponse>(
      "/users/edit-profile",
      payload
    );

    const user = response.data.user;
    if (!user || !user.token) {
      throw new Error(
        "Update profile response did not include user data or token."
      );
    }

    Cookies.set("authToken", user.token, {
      expires: 7,
      secure: true,
      sameSite: "strict",
    });
    const { ...userData } = user;
    return userData;
  }

  sendOTPEmail(email: string) {
    return apiService.post("/users/OTP/email/send", { email });
  }

  verifyOTPEmail(email: string, otp: number) {
    return apiService.post("/users/OTP/email/verify", { email, otp });
  }

  changePassword(oldPassword: string, password: string) {
    return apiService.patch(
      "/users/change-password",
      {
        newPassword: password,
        oldPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("authToken")}`,
        },
      }
    );
  }

  getUserStat(username: string) {
    return apiService.get(`/users/stats?username=${username}`);
  }

  getProfileByUsername(username: string) {
    return apiService.get<ProfileData>(
      `/users/profile/${encodeURIComponent(username)}`
    );
  }
}

export default new UserService();
