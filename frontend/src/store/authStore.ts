import { create } from "zustand";
import type { User } from "../types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;

  setSession: (
    user: User,
    accessToken: string
  ) => void;

  restoreSession: () => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,

  setSession: (user, accessToken) => {
    localStorage.setItem(
      "sepsisguardian_user",
      JSON.stringify(user)
    );

    localStorage.setItem(
      "sepsisguardian_access_token",
      accessToken
    );

    set({
      user,
      accessToken,
    });
  },

  restoreSession: () => {
    try {
      const storedUser =
        localStorage.getItem(
          "sepsisguardian_user"
        );

      const storedToken =
        localStorage.getItem(
          "sepsisguardian_access_token"
        );

      if (
        storedUser &&
        storedToken
      ) {
        const user: User =
          JSON.parse(storedUser);

        set({
          user,
          accessToken: storedToken,
        });
      }
    } catch (error) {
      console.error(
        "Failed to restore session:",
        error
      );

      localStorage.removeItem(
        "sepsisguardian_user"
      );

      localStorage.removeItem(
        "sepsisguardian_access_token"
      );

      set({
        user: null,
        accessToken: null,
      });
    }
  },

  logout: () => {
    localStorage.removeItem(
      "sepsisguardian_user"
    );

    localStorage.removeItem(
      "sepsisguardian_access_token"
    );

    set({
      user: null,
      accessToken: null,
    });
  },
}));