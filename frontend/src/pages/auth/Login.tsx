import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { loginUser } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import type { UserRole } from "../../types/auth";

export default function Login() {
  const navigate = useNavigate();

  const { setSession } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      console.log("LOGIN REQUEST:", {
        email,
        url: "http://localhost:8000/api/auth/login",
      });

      const response = await loginUser(
        email,
        password
      );

      console.log(
        "LOGIN RESPONSE:",
        response
      );

      /*
       * IMPORTANT:
       * Save user + access token
       * in Zustand + localStorage
       */
      setSession(
        response.user,
        response.access_token
      );

      console.log(
        "USER:",
        response.user
      );

      console.log(
        "ROLE:",
        response.user.role
      );

      const dashboardPath =
        getDashboardPath(
          response.user.role
        );

      console.log(
        "DASHBOARD PATH:",
        dashboardPath
      );

      /*
       * React Router navigation
       */
      navigate(
        dashboardPath,
        {
          replace: true,
        }
      );

    } catch (error: any) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      const backendError =
        error?.response?.data?.detail;

      if (
        typeof backendError ===
        "string"
      ) {
        setError(
          backendError
        );

      } else if (
        Array.isArray(
          backendError
        )
      ) {
        setError(
          backendError
            .map(
              (item: any) =>
                item.msg
            )
            .join(", ")
        );

      } else {
        setError(
          "Unable to sign in. Please check your credentials."
        );
      }

    } finally {
      setLoading(false);
    }
  }

  function getDashboardPath(
    role: UserRole
  ): string {

    switch (role) {

      case "ADMIN":
        return "/admin";

      case "ADMISSION":
        return "/admission";

      case "NURSE":
        return "/nurse";

      case "DOCTOR":
        return "/doctor";

      default:
        return "/login";
    }
  }

  return (
    <main
      className="
        min-h-screen
        bg-black
        flex
        items-center
        justify-center
        p-6
      "
    >

      <div
        className="
          w-full
          max-w-6xl
          overflow-hidden
          rounded-3xl
          border
          border-slate-800
          bg-black
          shadow-2xl
          lg:grid
          lg:grid-cols-2
        "
      >

        {/* ================================= */}
        {/* LEFT PANEL */}
        {/* ================================= */}

        <section
          className="
            hidden
            lg:flex
            flex-col
            justify-between
            p-12
            bg-black
          "
        >

          <div>

            {/* BRAND */}

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white
                "
              >

                <Activity
                  className="
                    h-7
                    w-7
                    text-slate-900
                  "
                />

              </div>

              <div>

                <h1
                  className="
                    text-xl
                    font-bold
                    text-white
                  "
                >
                  SepsisGuardian AI
                </h1>

                <p
                  className="
                    text-sm
                    text-slate-400
                  "
                >
                  Clinical Intelligence Platform
                </p>

              </div>

            </div>


            {/* HERO */}

            <div className="mt-20">

              <p
                className="
                  text-sm
                  font-medium
                  text-slate-400
                "
              >
                INTELLIGENT HEALTHCARE
              </p>

              <h2
                className="
                  mt-4
                  max-w-xl
                  text-4xl
                  font-bold
                  leading-tight
                  text-white
                "
              >
                Early risk intelligence
                for better clinical
                decision support.
              </h2>

              <p
                className="
                  mt-6
                  max-w-lg
                  leading-7
                  text-slate-400
                "
              >
                A secure clinical platform
                for patient monitoring,
                time-series analytics and
                explainable AI.
              </p>

            </div>

          </div>


          {/* SECURITY */}

          <div
            className="
              flex
              items-center
              gap-3
              text-sm
              text-slate-400
            "
          >

            <ShieldCheck
              className="h-5 w-5"
            />

            Secure role-based access

          </div>

        </section>


        {/* ================================= */}
        {/* LOGIN PANEL */}
        {/* ================================= */}

        <section
          className="
            bg-white
            p-8
            sm:p-12
          "
        >

          <div
            className="
              mx-auto
              max-w-md
            "
          >

            {/* MOBILE BRAND */}

            <div
              className="
                mb-10
                flex
                items-center
                gap-3
                lg:hidden
              "
            >

              <Activity
                className="h-7 w-7"
              />

              <div>

                <h1
                  className="
                    font-bold
                    text-slate-900
                  "
                >
                  SepsisGuardian AI
                </h1>

                <p
                  className="
                    text-xs
                    text-slate-500
                  "
                >
                  Clinical Intelligence
                </p>

              </div>

            </div>


            {/* HEADER */}

            <div>

              <p
                className="
                  text-sm
                  font-semibold
                  text-slate-500
                "
              >
                SECURE ACCESS
              </p>

              <h2
                className="
                  mt-2
                  text-3xl
                  font-bold
                  tracking-tight
                  text-slate-900
                "
              >
                Welcome back
              </h2>

              <p
                className="
                  mt-2
                  text-slate-500
                "
              >
                Sign in to access your
                clinical workspace.
              </p>

            </div>


            {/* ERROR */}

            {error && (
              <div
                className="
                  mt-6
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3
                  text-sm
                  text-red-700
                "
              >
                {error}
              </div>
            )}


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                  "
                >
                  Work email
                </label>

                <div className="relative">

                  <Mail
                    className="
                      absolute
                      left-4
                      top-1/2
                      h-5
                      w-5
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="doctor@hospital.com"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      py-3.5
                      pl-12
                      pr-4
                      outline-none
                      transition
                      focus:border-slate-900
                      focus:bg-white
                      focus:ring-4
                      focus:ring-slate-100
                    "
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                  "
                >
                  Password
                </label>

                <div className="relative">

                  <LockKeyhole
                    className="
                      absolute
                      left-4
                      top-1/2
                      h-5
                      w-5
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter your password"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      py-3.5
                      pl-12
                      pr-12
                      outline-none
                      transition
                      focus:border-slate-900
                      focus:bg-white
                      focus:ring-4
                      focus:ring-slate-100
                    "
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                      hover:text-slate-900
                    "
                  >

                    {showPassword ? (
                      <EyeOff
                        size={20}
                      />
                    ) : (
                      <Eye
                        size={20}
                      />
                    )}

                  </button>

                </div>

              </div>


              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  rounded-xl
                  bg-slate-950
                  py-3.5
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                {loading
                  ? "Signing in..."
                  : "Sign in"
                }

              </button>

            </form>


            {/* SECURITY MESSAGE */}

            <div
              className="
                mt-8
                rounded-xl
                bg-slate-50
                p-4
                text-xs
                leading-5
                text-slate-500
              "
            >

              <strong
                className="text-slate-700"
              >
                Authorized access only.
              </strong>

              {" "}

              This clinical research system
              uses role-based access controls.

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}