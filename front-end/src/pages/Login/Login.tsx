import React, { useState, useCallback, useEffect } from "react";
import images from "../../constants";
import toast, { Toaster } from "react-hot-toast";
import * as ClientApi from "../../api/Client";

// Example implementation for ClientApi.login
// This function should send a POST request to your backend login endpoint
// and return a promise with the response (including token if successful).
import Cookies from "js-cookie";
import { Link, useNavigate } from "react-router-dom";
import {
  GoogleLogin,
  type GoogleCredentialResponse,
} from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile, setUser } from "../../store/user/userSlice";
import { type AppDispatch, type RootState } from "../../store/store";

interface FormLogin {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

interface ApiError {
  response?: {
    status: number;
    data?: unknown;
  };
  code?: string;
  message?: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormLogin>({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState<Record<keyof FormLogin, boolean>>({
    email: false,
    password: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  // Memoized validation function
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.length > 254) {
      newErrors.email = "Email address is too long";
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (formData.password.length > 128) {
      newErrors.password = "Password is too long";
    }

    return newErrors;
  }, [formData]);

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear field error when user starts typing
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }

      // Clear server error when user modifies form
      if (serverError) {
        setServerError("");
      }
    },
    [errors, serverError]
  );

  // Handle input blur
  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name } = e.target;

      setTouched((prev) => ({ ...prev, [name]: true }));

      const fieldErrors = validateForm();
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[name as keyof FormErrors],
      }));
    },
    [validateForm]
  );

  // Handle error from API
  const handleApiError = useCallback((error: unknown): string => {
    const apiError = error as ApiError;

    if (apiError.response?.status === 401) {
      return "Invalid email or password";
    } else if (apiError.response?.status === 429) {
      return "Too many login attempts. Please try again later";
    } else if ((apiError.response?.status ?? 0) >= 500) {
      return "Server error. Please try again later";
    } else if (apiError.code === "NETWORK_ERROR" || !navigator.onLine) {
      return "Network error. Please check your connection";
    } else if (apiError.message?.includes("timeout")) {
      return "Request timeout. Please try again";
    }

    return "Login failed. Please try again";
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Mark all fields as touched
      setTouched({ email: true, password: true });

      // Validate form
      const validationErrors = validateForm();
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        toast.error("Please fix the errors in the form");
        return;
      }

      setIsSubmitting(true);
      setServerError("");

      try {
        const result = await ClientApi.userService.login({
          email: formData.email.trim(),
          password: formData.password,
        });

        console.log(result);

        // Lưu token vào cookie
        const token = result.data.user?.token;
        if (token) {
          Cookies.set("authToken", token, { expires: 7 }); // Lưu trong 7 ngày
        }

        // Sau khi đăng nhập, fetch thông tin user để cập nhật Redux
        const userProfile = await dispatch(fetchUserProfile()).unwrap();
        console.log("User profile fetched successfully:", userProfile);

        toast.dismiss(toastId);
        toast.success("Welcome back! Login successful");

        // Chuyển hướng sau khi đăng nhập và fetch thành công
        navigate("/");
      } catch (error) {
        const errorMessage = handleApiError(error);
        setServerError(errorMessage);
        toast.error(errorMessage);
        console.error("Login error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, handleApiError, dispatch, navigate]
  );

  // Get input styling classes
  const getInputClass = useCallback(
    (fieldName: keyof FormErrors) => {
      const baseClass =
        "w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-200 text-sm";
      const disabledClass = isSubmitting ? "opacity-50 cursor-not-allowed" : "";
      const hasError = errors[fieldName] && touched[fieldName];

      if (hasError) {
        return `${baseClass} ${disabledClass} border-red-500 bg-red-50 focus:border-red-600 focus:ring-2 focus:ring-red-200`;
      }

      return `${baseClass} ${disabledClass} border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200`;
    },
    [errors, touched, isSubmitting]
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSuccessLoginGoogle = async (
    credentialResponse: GoogleCredentialResponse
  ) => {
    try {
      console.log("Google login response:", credentialResponse);
      const toastId = toast.loading("Signing in with Google...");
      const result = await ClientApi.userService.loginUserGoogle(
        credentialResponse
      );
      const user = result.data;
      const token = result.data.token || user?.token;

      if (user) {
        console.log(user);
        dispatch(setUser(user));
      }

      if (token) {
        Cookies.set("authToken", token, { expires: 7 });
      }

      toast.dismiss(toastId);
      toast.success("Google login successful!");

      navigate("/");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google login failed");
    }
  };

  const handleErrorLoginGoogle = async () => {
    console.log("failed login");
    toast.error("Failed to login");
  };

  return (
    <div className="height-100vh bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="px-4 pt-6 sm:px-6 lg:px-20">
        <Link to={`${import.meta.env.VITE_URL_BASE_WEB}/`}>
          <img
            src={images.Logo}
            alt="Company Logo"
            className="w-auto h-12 sm:h-16 lg:h-20"
            loading="eager"
          />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="p-6 bg-white shadow-xl rounded-2xl sm:p-8">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                Welcome Back
              </h1>
              <p className="text-sm text-gray-600">
                Please sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Server Error Alert */}
              {serverError && (
                <div
                  className="p-4 border border-red-200 rounded-lg bg-red-50"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm font-medium text-red-700">
                      {serverError}
                    </p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isSubmitting}
                  placeholder="Enter your email address"
                  className={getInputClass("email")}
                  aria-invalid={
                    errors.email && touched.email ? "true" : "false"
                  }
                  aria-describedby={
                    errors.email && touched.email ? "email-error" : undefined
                  }
                />
                {errors.email && touched.email && (
                  <p
                    id="email-error"
                    className="flex items-center gap-1 text-sm text-red-600"
                    role="alert"
                  >
                    <svg
                      className="flex-shrink-0 w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    disabled={isSubmitting}
                    placeholder="Enter your password"
                    className={`${getInputClass("password")} pr-12`}
                    aria-invalid={
                      errors.password && touched.password ? "true" : "false"
                    }
                    aria-describedby={
                      errors.password && touched.password
                        ? "password-error"
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    className="absolute text-gray-500 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700 focus:outline-none focus:text-gray-700 disabled:opacity-50"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p
                    id="password-error"
                    className="flex items-center gap-1 text-sm text-red-600"
                    role="alert"
                  >
                    <svg
                      className="flex-shrink-0 w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
                {/* Google Login Button */}
              </button>
              <div className="translate-x-[18%] ">
                <GoogleLogin
                  onSuccess={handleSuccessLoginGoogle}
                  onError={handleErrorLoginGoogle}
                />
              </div>
            </form>

            {/* Additional Links */}
            <div className="mt-6 space-y-2 text-center">
              <a
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500"
              >
                Forgot your password?
              </a>
              <p className="text-xs text-gray-500">
                Don't have an account?{" "}
                <a
                  href="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Toaster></Toaster>
    </div>
  );
};

export default Login;
