import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import images from "../../constants";
import toast, { Toaster } from "react-hot-toast";
import { userService } from "../../api/Client";
import Cookies from "js-cookie";
import { Link, useNavigate } from "react-router-dom";

interface EmailFormData {
  email: string;
}

interface OTPFormData {
  otp: string;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  code?: string;
  message?: string;
}

type Step = "email" | "otp" | "password";

const ForgotPassword: React.FC = () => {
  // State management
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [emailData, setEmailData] = useState<EmailFormData>({ email: "" });
  const [otpData, setOTPData] = useState<OTPFormData>({ otp: "" });
  const [credential, setCredential] = useState<string>("");
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    newPassword: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>("");
  const [countdown, setCountdown] = useState(0);
  const [otpLimitCountdown, setOtpLimitCountdown] = useState(0); // New state for OTP limit
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Refs for timer management
  const currentToastId = useRef<string | null>(null);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const otpLimitTimer = useRef<NodeJS.Timeout | null>(null); // New timer for OTP limit

  const navigate = useNavigate();

  // Toast management utilities
  const dismissCurrentToast = useCallback(() => {
    if (currentToastId.current) {
      toast.dismiss(currentToastId.current);
      currentToastId.current = null;
    }
  }, []);

  const showToast = useCallback(
    (type: "loading" | "success" | "error", message: string, options?) => {
      dismissCurrentToast();

      switch (type) {
        case "loading":
          currentToastId.current = toast.loading(message, options);
          break;
        case "success":
          currentToastId.current = toast.success(message, options);
          break;
        case "error":
          currentToastId.current = toast.error(message, options);
          break;
      }

      return currentToastId.current;
    },
    [dismissCurrentToast]
  );

  // Parse OTP limit error and extract expiry time
  const parseOTPLimitError = useCallback((errorMessage: string): number => {
    // Extract time pattern like "17:53:41"
    const timeMatch = errorMessage.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (!timeMatch) return 0;

    const [, hours, minutes, seconds] = timeMatch;
    const now = new Date();
    const expiryTime = new Date();

    expiryTime.setHours(parseInt(hours));
    expiryTime.setMinutes(parseInt(minutes));
    expiryTime.setSeconds(parseInt(seconds));

    // If the time is earlier than current time, it's probably tomorrow
    if (expiryTime.getTime() < now.getTime()) {
      expiryTime.setDate(expiryTime.getDate() + 1);
    }

    const diffInSeconds = Math.floor(
      (expiryTime.getTime() - now.getTime()) / 1000
    );
    return Math.max(0, diffInSeconds);
  }, []);

  // Validation functions with memoization
  const validators = useMemo(
    () => ({
      email: (email: string): string | undefined => {
        if (!email.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
          return "Please enter a valid email address";
        if (email.length > 254) return "Email address is too long";
        return undefined;
      },

      otp: (otp: string): string | undefined => {
        if (!otp.trim()) return "OTP code is required";
        if (!/^\d{6}$/.test(otp.trim())) return "OTP must be 6 digits";
        return undefined;
      },

      password: (password: string): string | undefined => {
        if (!password.trim()) return "Password is required";
        if (password.length < 6)
          return "Password must be at least 6 characters";
        if (password.length > 128) return "Password is too long";
        return undefined;
      },

      confirmPassword: (
        confirmPassword: string,
        password: string
      ): string | undefined => {
        if (!confirmPassword.trim()) return "Please confirm your password";
        if (confirmPassword !== password) return "Passwords do not match";
        return undefined;
      },
    }),
    []
  );

  // Optimized input change handler
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      // Clear previous errors and server errors
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      setServerError("");

      // Update state based on current step
      switch (currentStep) {
        case "email":
          setEmailData((prev) => ({ ...prev, [name]: value }));
          break;
        case "otp": {
          // Only allow numbers for OTP and limit to 6 digits
          const numericValue = value.replace(/\D/g, "").slice(0, 6);
          setOTPData((prev) => ({ ...prev, [name]: numericValue }));
          break;
        }
        case "password":
          setPasswordData((prev) => ({ ...prev, [name]: value }));
          break;
      }
    },
    [currentStep]
  );

  // Optimized blur handler
  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setTouched((prev) => ({ ...prev, [name]: true }));

      let error: string | undefined;

      switch (name) {
        case "email":
          error = validators.email(value);
          break;
        case "otp":
          error = validators.otp(value);
          break;
        case "newPassword":
          error = validators.password(value);
          break;
        case "confirmPassword":
          error = validators.confirmPassword(value, passwordData.newPassword);
          break;
      }

      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validators, passwordData.newPassword]
  );

  // Enhanced API error handler
  const handleApiError = useCallback(
    (error: unknown): string => {
      const apiError = error as ApiError;

      // Check for specific error messages from server
      if (apiError.response?.data?.message) {
        return apiError.response.data.error as string;
      }

      if (apiError.response?.data?.error) {
        const errorMessage = apiError.response.data.error;

        // Check if it's an OTP limit error
        if (
          errorMessage.includes("đã đạt giới hạn") &&
          errorMessage.includes("OTP")
        ) {
          const limitTime = parseOTPLimitError(errorMessage);
          if (limitTime > 0) {
            setOtpLimitCountdown(limitTime);
          }
        }

        return errorMessage;
      }

      // Handle specific HTTP status codes
      switch (apiError.response?.status) {
        case 400:
          return "Invalid request. Please check your information";
        case 401:
          return "Unauthorized request";
        case 404:
          return "Email address not found";
        case 429:
          return "Too many requests. Please try again later";
        case 500:
        case 502:
        case 503:
        case 504:
          return "Server error. Please try again later";
        default:
          break;
      }

      // Handle network errors
      if (apiError.code === "NETWORK_ERROR" || !navigator.onLine) {
        return "Network error. Please check your connection";
      }

      if (apiError.message?.includes("timeout")) {
        return "Request timeout. Please try again";
      }

      return "An unexpected error occurred. Please try again";
    },
    [parseOTPLimitError]
  );

  // Regular countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownTimer.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (countdownTimer.current) {
        clearTimeout(countdownTimer.current);
        countdownTimer.current = null;
      }
    };
  }, [countdown]);

  // OTP limit countdown timer
  useEffect(() => {
    if (otpLimitCountdown > 0) {
      otpLimitTimer.current = setTimeout(() => {
        setOtpLimitCountdown((prev) => prev - 1);
      }, 1000);
    } else if (otpLimitCountdown === 0 && otpLimitTimer.current) {
      // Reset server error when limit countdown ends
      setServerError("");
    }

    return () => {
      if (otpLimitTimer.current) {
        clearTimeout(otpLimitTimer.current);
        otpLimitTimer.current = null;
      }
    };
  }, [otpLimitCountdown]);

  // Format countdown time
  const formatCountdown = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Enhanced form submission handlers
  const handleSendOTP = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Check OTP limit
      if (otpLimitCountdown > 0) {
        showToast(
          "error",
          `Please wait ${formatCountdown(
            otpLimitCountdown
          )} before trying again`
        );
        return;
      }

      // Validate email
      setTouched({ email: true });
      const emailError = validators.email(emailData.email);

      if (emailError) {
        setErrors({ email: emailError });
        showToast("error", "Please fix the errors in the form");
        return;
      }

      setIsSubmitting(true);
      setServerError("");

      try {
        showToast("loading", "Sending OTP code...");

        await userService.sendOTPEmail(emailData.email.trim());

        showToast("success", "OTP code sent to your email!", {
          duration: 4000,
        });

        setCurrentStep("otp");
        setCountdown(60);

        // Clear previous OTP data
        setOTPData({ otp: "" });
        setTouched({});
        setErrors({});
      } catch (error) {
        const errorMessage = handleApiError(error);
        setServerError(errorMessage);
        showToast("error", errorMessage);
        console.error("Send OTP error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      emailData.email,
      handleApiError,
      showToast,
      otpLimitCountdown,
      formatCountdown,
      validators,
    ]
  );

  const handleVerifyOTP = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate OTP
      setTouched({ otp: true });
      const otpError = validators.otp(otpData.otp);

      if (otpError) {
        setErrors({ otp: otpError });
        showToast("error", "Please enter a valid 6-digit OTP");
        return;
      }

      setIsSubmitting(true);
      setServerError("");

      try {
        showToast("loading", "Verifying OTP...");

        const response = await userService.verifyOTPEmail(
          emailData.email.trim(),
          parseInt(otpData.otp)
        );

        const data = response.data as { credential: string };
        setCredential(data.credential);

        showToast("success", "OTP verified successfully!", { duration: 3000 });

        setCurrentStep("password");

        // Clear previous password data
        setPasswordData({ newPassword: "", confirmPassword: "" });
        setTouched({});
        setErrors({});
      } catch (error) {
        const errorMessage = handleApiError(error);
        setServerError(errorMessage);
        showToast("error", errorMessage);
        console.error("Verify OTP error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [otpData.otp, emailData.email, validators, handleApiError, showToast]
  );

  const handleChangePassword = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate passwords
      setTouched({ newPassword: true, confirmPassword: true });

      const passwordError = validators.password(passwordData.newPassword);
      const confirmPasswordError = validators.confirmPassword(
        passwordData.confirmPassword,
        passwordData.newPassword
      );

      const newErrors: FormErrors = {};
      if (passwordError) newErrors.newPassword = passwordError;
      if (confirmPasswordError)
        newErrors.confirmPassword = confirmPasswordError;

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        showToast("error", "Please fix the errors in the form");
        return;
      }

      setIsSubmitting(true);
      setServerError("");

      try {
        showToast("loading", "Changing password...");

        await userService.changePassword(passwordData.newPassword, credential);

        showToast("success", "Password changed successfully!", {
          duration: 3000,
        });

        // Auto redirect after success
        setTimeout(() => {
          dismissCurrentToast();
          showToast("success", "Redirecting to login...");

          setTimeout(() => {
            navigate("/login");
          }, 1500);
        }, 2000);
      } catch (error) {
        const errorMessage = handleApiError(error);
        setServerError(errorMessage);
        showToast("error", errorMessage);
        console.error("Change password error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      passwordData,
      validators,
      handleApiError,
      showToast,
      dismissCurrentToast,
      navigate,
      credential,
    ]
  );

  // Enhanced resend OTP with OTP limit check
  const handleResendOTP = useCallback(async () => {
    if (countdown > 0 || isSubmitting || otpLimitCountdown > 0) return;

    setIsSubmitting(true);
    setServerError("");

    try {
      showToast("loading", "Resending OTP...");

      await userService.sendOTPEmail(emailData.email.trim());

      showToast("success", "New OTP code sent!", { duration: 4000 });
      setCountdown(60);

      // Clear current OTP input
      setOTPData({ otp: "" });
      setErrors((prev) => ({ ...prev, otp: undefined }));
    } catch (error) {
      const errorMessage = handleApiError(error);
      setServerError(errorMessage);
      showToast("error", errorMessage);
      console.error("Resend OTP error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    emailData.email,
    handleApiError,
    showToast,
    countdown,
    isSubmitting,
    otpLimitCountdown,
  ]);

  // Optimized input styling with memoization
  const getInputClass = useCallback(
    (fieldName: string, hasError: boolean = false) => {
      const baseClass =
        "w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-200 text-sm";
      const disabledClass = isSubmitting ? "opacity-50 cursor-not-allowed" : "";

      const focusClass = hasError
        ? "border-red-500 bg-red-50 focus:border-red-600 focus:ring-2 focus:ring-red-200"
        : "border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-400";

      return `${baseClass} ${disabledClass} ${focusClass}`;
    },
    [isSubmitting]
  );

  // Step configuration for better maintainability
  const stepConfig = useMemo(
    () => ({
      email: {
        title: "Reset Password",
        subtitle: "Enter your email to receive a 6-digit OTP code",
        icon: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      },
      otp: {
        title: "Enter OTP Code",
        subtitle: `We've sent a 6-digit code to ${emailData.email}`,
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
      },
      password: {
        title: "Set New Password",
        subtitle: "Create a strong password for your account",
        icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      },
    }),
    [emailData.email]
  );

  // Check authentication status
  const authToken = Cookies.get("authToken");

  useEffect(() => {
    if (authToken) {
      navigate("/");
    }
  }, [authToken, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dismissCurrentToast();
      if (countdownTimer.current) {
        clearTimeout(countdownTimer.current);
      }
      if (otpLimitTimer.current) {
        clearTimeout(otpLimitTimer.current);
      }
    };
  }, [dismissCurrentToast]);

  // Keyboard shortcuts for better UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setServerError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentStepConfig = stepConfig[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="px-4 pt-6 sm:px-6 lg:px-20">
        <Link
          to={`${import.meta.env.VITE_URL_BASE_WEB}/`}
          className="inline-block transition-opacity duration-200 hover:opacity-80"
        >
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
            {/* Progress Indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {["email", "otp", "password"].map((step, index) => {
                  const stepNum = index + 1;
                  const isCompleted =
                    (step === "email" && currentStep !== "email") ||
                    (step === "otp" && currentStep === "password");
                  const isCurrent = step === currentStep;

                  return (
                    <React.Fragment key={step}>
                      <div className="flex items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-all duration-300 ${
                            isCurrent
                              ? "bg-blue-600 border-blue-600 text-white scale-110"
                              : isCompleted
                              ? "bg-green-600 border-green-600 text-white"
                              : "bg-gray-300 border-gray-300 text-gray-600"
                          }`}
                        >
                          {isCompleted ? "✓" : stepNum}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-600 capitalize">
                          {step === "otp" ? "OTP" : step}
                        </span>
                      </div>
                      {index < 2 && (
                        <div
                          className={`w-8 h-0.5 transition-all duration-300 ${
                            isCompleted ? "bg-green-600" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Header */}
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-4">
                <div
                  className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${currentStepConfig.iconBg}`}
                >
                  <svg
                    className={`w-8 h-8 ${currentStepConfig.iconColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={currentStepConfig.icon}
                    />
                  </svg>
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                {currentStepConfig.title}
              </h1>
              <p className="text-sm text-gray-600">
                {currentStepConfig.subtitle}
              </p>
            </div>

            {/* OTP Limit Alert */}
            {otpLimitCountdown > 0 && (
              <div
                className="p-4 mb-6 border border-yellow-200 rounded-lg bg-yellow-50 animate-fade-in"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      OTP Request Limit Reached
                    </p>
                    <p className="mt-1 text-sm text-yellow-700">
                      Please wait{" "}
                      <span className="font-mono font-semibold">
                        {formatCountdown(otpLimitCountdown)}
                      </span>{" "}
                      before requesting a new OTP code.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Server Error Alert */}
            {serverError && otpLimitCountdown === 0 && (
              <div
                className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50 animate-fade-in"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-700">
                      {serverError}
                    </p>
                    <button
                      onClick={() => setServerError("")}
                      className="mt-1 text-xs text-red-600 underline hover:text-red-500"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Form Content */}
            <div className="transition-all duration-300">
              {currentStep === "email" && (
                <form onSubmit={handleSendOTP} className="space-y-6" noValidate>
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={emailData.email}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        disabled={isSubmitting || otpLimitCountdown > 0}
                        placeholder="Enter your email address"
                        className={`${getInputClass(
                          "email",
                          !!(errors.email && touched.email)
                        )} pl-12`}
                        aria-invalid={
                          errors.email && touched.email ? "true" : "false"
                        }
                        aria-describedby={
                          errors.email && touched.email
                            ? "email-error"
                            : undefined
                        }
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                    {errors.email && touched.email && (
                      <p
                        id="email-error"
                        className="flex items-center gap-1 text-sm text-red-600 animate-fade-in"
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

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !emailData.email.trim() ||
                      otpLimitCountdown > 0
                    }
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
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
                        Sending OTP...
                      </>
                    ) : otpLimitCountdown > 0 ? (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Wait {formatCountdown(otpLimitCountdown)}
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        Send OTP Code
                      </>
                    )}
                  </button>
                </form>
              )}

              {currentStep === "otp" && (
                <form
                  onSubmit={handleVerifyOTP}
                  className="space-y-6"
                  noValidate
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="otp"
                      className="block text-sm font-medium text-gray-700"
                    >
                      6-Digit OTP Code
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      value={otpData.otp}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      disabled={isSubmitting}
                      placeholder="000000"
                      className={`${getInputClass(
                        "otp",
                        !!(errors.otp && touched.otp)
                      )} text-center text-2xl font-mono tracking-widest`}
                      aria-invalid={
                        errors.otp && touched.otp ? "true" : "false"
                      }
                      aria-describedby={
                        errors.otp && touched.otp ? "otp-error" : undefined
                      }
                    />
                    {errors.otp && touched.otp && (
                      <p
                        id="otp-error"
                        className="flex items-center gap-1 text-sm text-red-600 animate-fade-in"
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
                        {errors.otp}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || otpData.otp.length !== 6}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
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
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP Code"
                    )}
                  </button>

                  {/* Enhanced Resend OTP Section */}
                  <div className="text-center">
                    <p className="mb-3 text-sm text-gray-600">
                      Didn't receive the code?
                    </p>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={
                        countdown > 0 || isSubmitting || otpLimitCountdown > 0
                      }
                      className="text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        otpLimitCountdown > 0
                          ? `Wait ${formatCountdown(
                              otpLimitCountdown
                            )} before resending`
                          : undefined
                      }
                    >
                      {otpLimitCountdown > 0
                        ? `Wait ${formatCountdown(otpLimitCountdown)}`
                        : countdown > 0
                        ? `Resend in ${countdown}s`
                        : "Resend Code"}
                    </button>
                  </div>
                </form>
              )}

              {currentStep === "password" && (
                <form
                  onSubmit={handleChangePassword}
                  className="space-y-6"
                  noValidate
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={passwordData.newPassword}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        disabled={isSubmitting}
                        placeholder="Enter your new password"
                        className={`${getInputClass(
                          "newPassword",
                          !!(errors.newPassword && touched.newPassword)
                        )} pr-12`}
                        aria-invalid={
                          errors.newPassword && touched.newPassword
                            ? "true"
                            : "false"
                        }
                        aria-describedby={
                          errors.newPassword && touched.newPassword
                            ? "newPassword-error"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                        className="absolute text-gray-500 transition-colors duration-200 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700 focus:outline-none focus:text-gray-700 disabled:opacity-50"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {showPassword ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                            />
                          ) : (
                            <>
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
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                    {errors.newPassword && touched.newPassword && (
                      <p
                        id="newPassword-error"
                        className="flex items-center gap-1 text-sm text-red-600 animate-fade-in"
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
                        {errors.newPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={passwordData.confirmPassword}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        disabled={isSubmitting}
                        placeholder="Confirm your new password"
                        className={`${getInputClass(
                          "confirmPassword",
                          !!(errors.confirmPassword && touched.confirmPassword)
                        )} pr-12`}
                        aria-invalid={
                          errors.confirmPassword && touched.confirmPassword
                            ? "true"
                            : "false"
                        }
                        aria-describedby={
                          errors.confirmPassword && touched.confirmPassword
                            ? "confirmPassword-error"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={isSubmitting}
                        className="absolute text-gray-500 transition-colors duration-200 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700 focus:outline-none focus:text-gray-700 disabled:opacity-50"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {showConfirmPassword ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                            />
                          ) : (
                            <>
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
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                    {errors.confirmPassword && touched.confirmPassword && (
                      <p
                        id="confirmPassword-error"
                        className="flex items-center gap-1 text-sm text-red-600 animate-fade-in"
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
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !passwordData.newPassword.trim() ||
                      !passwordData.confirmPassword.trim() ||
                      passwordData.newPassword !== passwordData.confirmPassword
                    }
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
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
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Change Password
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-blue-600 transition-all duration-200 transform hover:text-blue-500 hover:scale-105"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            maxWidth: "500px",
          },
          success: {
            style: {
              background: "#10B981",
              color: "white",
            },
          },
          error: {
            style: {
              background: "#EF4444",
              color: "white",
            },
          },
        }}
      />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
