import React, { useState, useCallback, useEffect } from "react";
import images from "../../constants";
import toast, { Toaster } from "react-hot-toast";
import { loginUserGoogle, register } from "../../api/Client";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  GoogleLogin,
  type GoogleCredentialResponse,
} from "@react-oauth/google";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirm: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

interface ApiError {
  response?: {
    status: number;
    data?: unknown;
  };
  code?: string;
  message?: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    username: false,
    email: false,
    password: false,
    confirm: false,
  });

  const handleSuccessLoginGoogle = async (
    credentialResponse: GoogleCredentialResponse
  ) => {
    try {
      toast.loading("loading your account");
      const data = await loginUserGoogle(credentialResponse);
      setTimeout(() => {}, 1000);
      document.cookie = `authToken=${data}`;
      toast.dismiss();

      window.location.href = `${import.meta.env.VITE_URL_BASE_WEB}/`;
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google login failed");
    }
  };

  const handleErrorLoginGoogle = async () => {
    console.log("failed login");
    toast.error("Failed to login");
  };

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Memoized validation function
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 50) {
      newErrors.username = "Username is too long";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.length > 254) {
      newErrors.email = "Email address is too long";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (formData.password.length > 128) {
      newErrors.password = "Password is too long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirm) {
      newErrors.confirm = "Please confirm your password";
    } else if (formData.password !== formData.confirm) {
      newErrors.confirm = "Passwords do not match";
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

    if (apiError.response?.status === 409) {
      return "User already exists. Please choose a different username or email";
    } else if (apiError.response?.status === 400) {
      return "Invalid registration data. Please check your information";
    } else if (
      typeof apiError.response?.status === "number" &&
      apiError.response.status >= 500
    ) {
      return "Server error. Please try again later";
    } else if (apiError.code === "NETWORK_ERROR" || !navigator.onLine) {
      return "Network error. Please check your connection";
    } else if (apiError.message?.includes("timeout")) {
      return "Request timeout. Please try again";
    }

    return "Registration failed. Please try again";
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Mark all fields as touched
      setTouched({
        username: true,
        email: true,
        password: true,
        confirm: true,
      });

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
        const toastId = toast.loading("Creating your account...");

        const registrationData = { ...formData };
        await register({
          ...registrationData,
          username: registrationData.username.trim(),
          email: registrationData.email.trim(),
        });

        toast.dismiss(toastId);
        toast.success("Account created successfully! Welcome aboard!");
        navigate("/");

        // Handle successful registration (redirect, update context, etc.)
      } catch (error) {
        const errorMessage = handleApiError(error);
        setServerError(errorMessage);
        toast.error(errorMessage);
        console.error("Registration error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, handleApiError, navigate]
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

      return `${baseClass} ${disabledClass} border-gray-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200`;
    },
    [errors, touched, isSubmitting]
  );

  const cookie = Cookies.get("authToken");
  console.log(cookie);

  useEffect(() => {
    if (cookie) {
      navigate("/");
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
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
                Create Account
              </h1>
              <p className="text-sm text-gray-600">
                Join us today and get started in minutes
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

              {/* Username Field */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={isSubmitting}
                  placeholder="Choose a username"
                  className={getInputClass("username")}
                  aria-invalid={
                    errors.username && touched.username ? "true" : "false"
                  }
                  aria-describedby={
                    errors.username && touched.username
                      ? "username-error"
                      : undefined
                  }
                />
                {errors.username && touched.username && (
                  <p
                    id="username-error"
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
                    {errors.username}
                  </p>
                )}
              </div>

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
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    disabled={isSubmitting}
                    placeholder="Create a strong password"
                    className={`${getInputClass("password")} pr-12`}
                    aria-invalid={
                      errors.password && touched.password ? "true" : "false"
                    }
                    aria-describedby={
                      errors.password && touched.password
                        ? "password-error"
                        : "password-help"
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
                {!errors.password && !touched.password && (
                  <p id="password-help" className="text-xs text-gray-500">
                    Must contain at least 6 characters, including uppercase,
                    lowercase, and number
                  </p>
                )}
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="confirm"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    name="confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirm}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    disabled={isSubmitting}
                    placeholder="Confirm your password"
                    className={`${getInputClass("confirm")} pr-12`}
                    aria-invalid={
                      errors.confirm && touched.confirm ? "true" : "false"
                    }
                    aria-describedby={
                      errors.confirm && touched.confirm
                        ? "confirm-error"
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                    className="absolute text-gray-500 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700 focus:outline-none focus:text-gray-700 disabled:opacity-50"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
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
                {errors.confirm && touched.confirm && (
                  <p
                    id="confirm-error"
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
                    {errors.confirm}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-all duration-200 bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
              <div className="translate-x-[18%]">
                <GoogleLogin
                  onSuccess={handleSuccessLoginGoogle}
                  onError={handleErrorLoginGoogle}
                />
              </div>
            </form>

            {/* Additional Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-medium text-green-600 transition-colors duration-200 hover:text-green-500"
                >
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Toaster position="top-center" />
    </div>
  );
};

export default Register;
