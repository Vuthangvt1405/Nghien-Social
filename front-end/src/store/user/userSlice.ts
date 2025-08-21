// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { fetchProfile } from "../../api/Client";
// import { decodeJWT } from "../../utils/Crypto";
// import images from "../../constants";
// import Cookies from "js-cookie";

// export interface UserState {
//   id: string;
//   username: string;
//   email: string;
//   avatar: string;
//   cover: string;
//   admin: boolean;
//   description: string;
//   loading: boolean;
//   error: string | null;
//   isAuthenticated: boolean;
// }

// // Hàm đồng bộ để tải user data từ cookie
// const loadUserFromCookie = (): UserState => {
//   const defaultState: UserState = {
//     id: "",
//     username: "",
//     email: "",
//     avatar: images.avatarDemo,
//     cover: "",
//     admin: false,
//     description: "",
//     loading: false,
//     error: null,
//     isAuthenticated: false,
//   };

//   try {
//     const authToken = Cookies.get("authToken");
//     if (authToken) {
//       const decodedData = decodeJWT(authToken);
//       if (decodedData) {
//         console.log("Khởi tạo user từ cookie thành công:", decodedData);
//         return {
//           ...defaultState,
//           id: decodedData.id || decodedData.sub || "",
//           username: decodedData.username || decodedData.name || "",
//           email: decodedData.email || "",
//           avatar: decodedData.avatar || images.avatarDemo,
//           cover: decodedData.cover || "",
//           admin: decodedData.admin || decodedData.isAdmin || false,
//           description: decodedData.description || "",
//           isAuthenticated: true,
//         };
//       }
//     }
//   } catch (error) {
//     console.error("Lỗi khi tải user từ cookie:", error);
//   }

//   return defaultState;
// };

// // Async thunk để fetch profile, lưu cookie mới, decode và cập nhật Redux
// export const fetchUserProfile = createAsyncThunk(
//   "user/fetchProfile",
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await fetchProfile();
//       console.log("API Response:", response);

//       const newToken = response.data.token || response.data.accessToken;
//       if (newToken) {
//         Cookies.set("authToken", newToken, { expires: 7 });
//         console.log("Token mới đã được lưu vào cookie");

//         const decodedData = decodeJWT(newToken);
//         console.log("Decoded JWT data:", decodedData);

//         if (decodedData) {
//           return {
//             id: decodedData.id || decodedData.sub || "",
//             username: decodedData.username || decodedData.name || "",
//             email: decodedData.email || "",
//             avatar: decodedData.avatar || "",
//             cover: decodedData.cover || "",
//             admin: decodedData.admin || decodedData.isAdmin || false,
//             description: decodedData.description || "",
//           };
//         }
//       }

//       // Fallback nếu không có token hoặc decode thất bại
//       return response.data;
//     } catch (error: unknown) {
//       let errorMessage = "Không thể tải thông tin người dùng";
//       if (error instanceof Error) {
//         errorMessage = error.message;
//       }
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // Initial state được tải trực tiếp từ cookie
// const initialState: UserState = loadUserFromCookie();

// const userSlice = createSlice({
//   name: "user",
//   initialState,
//   reducers: {
//     setUser: (state, action) => {
//       state.id = action.payload.id || "";
//       state.username = action.payload.username || "";
//       state.email = action.payload.email || "";
//       state.avatar = action.payload.avatar || images.avatarDemo;
//       state.cover = action.payload.cover || "";
//       state.admin = action.payload.admin || false;
//       state.description = action.payload.description || "";
//       state.isAuthenticated = true;
//       state.error = null;
//     },
//     clearUser: (state) => {
//       state.id = "";
//       state.username = "";
//       state.email = "";
//       state.avatar = images.avatarDemo;
//       state.cover = "";
//       state.admin = false;
//       state.description = "";
//       state.isAuthenticated = false;
//       state.error = null;
//       Cookies.remove("authToken");
//       Cookies.remove("refreshToken");
//     },
//     syncUserFromCookie: (state) => {
//       const authToken = Cookies.get("authToken");
//       if (authToken) {
//         const decodedData = decodeJWT(authToken);

//         if (decodedData) {
//           state.id = decodedData.id || decodedData.sub || "";
//           state.username = decodedData.username || decodedData.name || "";
//           state.email = decodedData.email || "";
//           state.avatar = decodedData.avatar || images.avatarDemo;
//           state.cover = decodedData.cover || "";
//           state.admin = decodedData.admin || decodedData.isAdmin || false;
//           state.description = decodedData.description || "";
//           state.isAuthenticated = true;
//         }
//       }
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchUserProfile.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchUserProfile.fulfilled, (state, action) => {
//         state.loading = false;
//         const userData = action.payload;
//         if (userData) {
//           state.id = userData.id || "";
//           state.username = userData.username || "";
//           state.email = userData.email || "";
//           state.avatar = userData.avatar || images.avatarDemo;
//           state.cover = userData.cover || "";
//           state.admin = userData.admin || false;
//           state.description = userData.description || "";
//           state.isAuthenticated = true;
//         }
//       })
//       .addCase(fetchUserProfile.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload as string;
//         state.isAuthenticated = false;
//       });
//   },
// });

// export const { setUser, clearUser, syncUserFromCookie } = userSlice.actions;
// export default userSlice.reducer;

// userSlice.ts
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { userService } from "../../api/Client";
import Cookies from "js-cookie";
import images from "../../constants";
import { decodeJWT } from "../../utils/Crypto";

export interface UserState {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  cover: string | null;
  admin: boolean;
  description: string;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  verified: boolean;
}

const initialState: UserState = {
  id: 0,
  username: "",
  email: "",
  avatar: images.avatarDemo,
  cover: null,
  admin: false,
  description: "",
  loading: false,
  error: null,
  isAuthenticated: false,
  verified: false,
};

// Lấy trực tiếp profile từ API (không qua cookie / decode)
export const fetchUserProfile = createAsyncThunk<Partial<UserState>>(
  "user/fetchProfile",
  async (_: void, { rejectWithValue }) => {
    try {
      const authToken = Cookies.get("authToken");
      if (!authToken) throw new Error("No auth token found");
      const username = decodeJWT(authToken)?.username;
      const response = await userService.fetchProfile(username);
      console.log("API Response:", response);
      // Giả định server trả về response.data = { id, username, email, avatar, cover, admin, description }
      return response.data as Partial<UserState>;
    } catch (err: unknown) {
      let message = "Không thể tải thông tin người dùng";
      if (err instanceof Error) message = err.message;
      return rejectWithValue(message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Partial<UserState>>) => {
      const u = action.payload;
      if (u.id !== undefined) state.id = u.id;
      if (u.username !== undefined) state.username = u.username;
      if (u.email !== undefined) state.email = u.email;
      if (u.avatar !== undefined) state.avatar = u.avatar;
      if (u.cover !== undefined) state.cover = u.cover;
      if (u.admin !== undefined) state.admin = u.admin;
      if (u.description !== undefined) state.description = u.description;
      if (u.verified !== undefined) state.verified = u.verified;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearUser: (state) => {
      state.id = 0;
      state.username = "";
      state.email = "";
      state.avatar = images.avatarDemo;
      state.cover = "";
      state.admin = false;
      state.description = "";
      state.isAuthenticated = false;
      state.error = null;
    },
    logout: (state) => {
      state.id = 0;
      state.username = "";
      state.email = "";
      state.avatar = images.avatarDemo;
      state.cover = "";
      state.admin = false;
      state.description = "";
      state.isAuthenticated = false;
      state.error = null;
      Cookies.remove("authToken");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserProfile.fulfilled,
        (state, action: PayloadAction<Partial<UserState>>) => {
          state.loading = false;
          const u = action.payload ?? {};
          state.id = u.id as number;
          state.username = u.username ?? "";
          state.email = u.email ?? "";
          state.avatar = u.avatar ?? images.avatarDemo;
          state.cover = u.cover ?? "";
          state.admin = u.admin ?? false;
          state.description = u.description ?? "";
          state.verified = u.verified ?? false;
          state.isAuthenticated = Boolean(u.id || u.username || u.email);
        }
      )
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Fetch profile failed";
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearUser, logout } = userSlice.actions;
export default userSlice.reducer;
