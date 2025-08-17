import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ResponsiveState {
  type: "PC" | "Mobile" | "Tablet";
  isOpen: boolean;
}

const initialState: ResponsiveState = {
  type: "PC",
  isOpen: true,
};

const responsiveSlice = createSlice({
  name: "responsive",
  initialState,
  reducers: {
    setType: (state, action: PayloadAction<"PC" | "Mobile" | "Tablet">) => {
      state.type = action.payload;
      if (state.type == "Mobile" || state.type == "Tablet") {
        state.isOpen = false;
      } else {
        state.isOpen = true;
      }
    },
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export default responsiveSlice.reducer;
export const { setType, toggleSidebar } = responsiveSlice.actions;
