import { useEffect } from "react";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { routePage } from "./routes";
import { Routes, Route } from "react-router-dom";
import type { ReactElement, ComponentType } from "react";
import { fetchUserProfile } from "./store/user/userSlice";
import { type AppDispatch } from "./store/store";
import "./App.css";

interface RouteConfig {
  path: string;
  component: ComponentType; // Thêm <any> để rõ ràng hơn
  children?: Array<RouteConfig>;
}

const App = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);

  const renderRoute = (routeList: Array<RouteConfig>): ReactElement[] => {
    return routeList.map((route: RouteConfig, index: number) => {
      const Component = route.component;
      const path = route.path;

      return (
        <Route key={index} path={path} element={<Component />}>
          {route.children &&
            route.children.length > 0 &&
            renderRoute(route.children)}
        </Route>
      );
    });
  };

  return (
    <div>
      <Routes>{renderRoute(routePage)}</Routes>
    </div>
  );
};

export default App;
