import Header from "./Header/Header";
import Sidebar from "./SideBar/Sidebar";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { setType } from "../store/responsive/responsiveSlice";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const innerWidth = window.innerWidth;
  const typeDevice = useSelector((state: RootState) => state.responsive);

  const dispatch = useDispatch();

  useEffect(() => {
    if (innerWidth > 1024) {
      dispatch(setType("PC"));
    } else if (innerWidth > 768) {
      dispatch(setType("Tablet"));
    } else {
      dispatch(setType("Mobile"));
    }
  }, [dispatch, innerWidth]);

  return (
    <div className="relative min-h-screen bg-gray-100">
      <Header />
      <div className="flex pt-12">
        {" "}
        {/* Reddit header height ~48px */}
        <Sidebar />
        {/* Main content area - Reddit style */}
        <main
          className={`flex-1 transition-all duration-300 ${
            typeDevice.type === "PC" && typeDevice.isOpen
              ? "ml-64"
              : typeDevice.type === "PC"
              ? "ml-16"
              : "ml-0"
          }`}
        >
          <div className="max-w-full pt-[6%] mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-10 ${
          typeDevice.type === "PC" || !typeDevice.isOpen ? "hidden" : ""
        }`}
        onClick={() => dispatch(setType(typeDevice.type))}
      ></div>
    </div>
  );
};

export default Layout;
