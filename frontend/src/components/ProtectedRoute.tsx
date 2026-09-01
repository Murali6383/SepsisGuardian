import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuthStore } from "../store/authStore";

import type {
  UserRole,
} from "../types/auth";

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export default function ProtectedRoute({
  roles,
}: ProtectedRouteProps) {

  const user =
    useAuthStore(
      (state) => state.user
    );

  const accessToken =
    useAuthStore(
      (state) => state.accessToken
    );

  if (
    !user ||
    !accessToken
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    roles &&
    !roles.includes(user.role)
  ) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return <Outlet />;
}