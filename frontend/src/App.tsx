import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/authStore";

export default function App() {
  const restoreSession =
    useAuthStore(
      (state) => state.restoreSession
    );

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return <AppRoutes />;
}