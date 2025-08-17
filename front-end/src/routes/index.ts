import type { ComponentType } from "react";
import HomePage from "../pages/HomePage/HomePage";
import Login from "../pages/Login/Login";
import Register from "../pages/Login/Register";
import CreatePost from "../pages/CreatePost/CreatePost";
import DetailPost from "../pages/DetailPost/DetailPost";
import AccountSetting from "../pages/AccountSetting/AccountSetting";
import ForgotPassword from "../pages/Login/ForgotPassword";

interface RouteConfig {
  path: string;
  component: ComponentType;
  children?: Array<RouteConfig>;
}

export const routePage: Array<RouteConfig> = [
  {
    path: "/register",
    component: Register,
  },
  {
    path: "/",
    component: HomePage,
  },
  {
    path: "/login",
    component: Login,
  },
  {
    path: "/createpost",
    component: CreatePost,
  },
  {
    path: "/post/:slug",
    component: DetailPost,
  },
  {
    path: "/info/:username",
    component: AccountSetting,
  },
  {
    path: "/forgot-password",
    component: ForgotPassword,
  },
];
