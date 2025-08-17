import { configureStore } from "@reduxjs/toolkit";
import responsiveSlice from "./responsive/responsiveSlice";
import userSlice from "./user/userSlice";

export const store = configureStore({
  reducer: {
    responsive: responsiveSlice,
    user: userSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
