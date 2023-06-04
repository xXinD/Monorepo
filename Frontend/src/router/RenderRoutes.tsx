import React from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const RenderRoutes: React.FC<{ routes: any[] }> = ({ routes }) => (
  <Routes>
    {routes.map((route) => {
      if (route.children) {
        return (
          <Route
            key={route.path}
            path={route.path}
            element={(
              <>
                <route.component />
                <RenderRoutes routes={route.children} />
              </>
            )}
          />
        );
      }

      // 根据 isProtected 属性使用 Route 或 ProtectedRoute 组件
      return route.isProtected ? (
        <ProtectedRoute
          key={route.path}
          path={route.path}
          element={<route.component />}
          redirectTo={route.redirectTo}
        />
      ) : (
        <Route
          key={route.path}
          path={route.path}
          element={<route.component />}
        />
      );
    })}
  </Routes>
);

export default RenderRoutes;
