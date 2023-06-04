import React from "react";
import { Route, Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  element: React.ReactElement;
  path: string;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  element,
  path,
  redirectTo,
}) => {
  // 检查用户是否已登录，这里应该使用实际的验证逻辑
  const isLoggedIn = false;

  return (
    <Route
      path={path}
      element={
        isLoggedIn ? element : <Navigate to={redirectTo || "/login"} replace />
      }
    />
  );
};
ProtectedRoute.defaultProps = {
  redirectTo: "/login",
};
export default ProtectedRoute;
