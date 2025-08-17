import { useCallback, useState, useEffect } from "react";
import Layout from "../../components/Layout";
import toast from "react-hot-toast";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const OverlayLocked = ({
  value,
  setPasswordPost,
  onSubmit,
  isLoading = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasError, setHasError] = useState(false); // State mặc định là false
  const [attemptCount, setAttemptCount] = useState(0); // Đếm số lần thử
  const [isShaking, setIsShaking] = useState(false); // Animation khi lỗi

  const handleInputChange = useCallback(
    (event) => {
      setPasswordPost(event.target.value);
      // Reset error state khi user bắt đầu nhập lại
      if (hasError) {
        setHasError(false);
      }
    },
    [setPasswordPost, hasError]
  );

  const handlePasswordError = useCallback(() => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);
    setHasError(true);

    // Trigger shake animation
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    // Nếu là lần thứ 2 trở đi thì hiển thị toast
    if (newAttemptCount >= 2) {
      toast.error(`🔐 Mật khẩu không chính xác! (Lần thử ${newAttemptCount})`, {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          color: "#DC2626",
          fontWeight: "500",
        },
        icon: "❌",
      });
    }

    // Reset password field sau khi sai
    setPasswordPost("");
  }, [attemptCount, setPasswordPost]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!isLoading && value.trim()) {
        try {
          // Gọi onSubmit và chờ kết quả
          const result = await onSubmit();

          // Nếu onSubmit trả về false hoặc throw error, nghĩa là mật khẩu sai
          if (result === false) {
            handlePasswordError();
          }
        } catch (error) {
          console.error("Error during password submission:", error);
          // Nếu có lỗi trong quá trình submit
          handlePasswordError();
        }
      }
    },
    [onSubmit, isLoading, value, handlePasswordError]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !isLoading && value.trim()) {
        event.preventDefault();
        handleSubmit(event);
      }
    },
    [handleSubmit, isLoading, value]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Reset states khi component unmount hoặc success
  useEffect(() => {
    return () => {
      setHasError(false);
      setAttemptCount(0);
    };
  }, []);

  return (
    <Layout>
      {/* Reddit-style overlay backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
        <div
          className={`
            w-full max-w-md mx-4 overflow-hidden bg-white shadow-2xl rounded-2xl
            transition-transform duration-300
            ${isShaking ? "animate-shake" : ""}
          `}
        >
          {/* Header section - Reddit style với error state */}
          <div
            className={`
            px-6 py-8 text-center transition-all duration-300
            ${
              hasError
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : "bg-gradient-to-r from-orange-500 to-red-500"
            }
          `}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-white rounded-full bg-opacity-20">
              {hasError ? (
                <ExclamationTriangleIcon className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <LockClosedIcon className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">
              {hasError ? "Access Denied" : "Protected Content"}
            </h2>
            <p className="text-sm text-white text-opacity-90">
              {hasError
                ? `Incorrect password. Attempt ${attemptCount}/${3}`
                : "This post requires a password to view"}
            </p>
          </div>

          {/* Content section */}
          <div className="px-6 py-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheckIcon
                  className={`w-5 h-5 ${
                    hasError ? "text-red-500" : "text-gray-500"
                  }`}
                />
                <label
                  htmlFor="password"
                  className={`text-sm font-medium ${
                    hasError ? "text-red-700" : "text-gray-700"
                  }`}
                >
                  Enter Password
                </label>
              </div>

              {/* Error message */}
              {hasError && (
                <div className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="flex-shrink-0 w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-700">
                      {attemptCount === 1
                        ? "Incorrect password. Please try again."
                        : `Incorrect password. ${attemptCount} attempts made.`}
                    </p>
                  </div>
                  {attemptCount >= 3 && (
                    <p className="mt-1 text-xs text-red-600">
                      Multiple failed attempts detected. Please contact the
                      author.
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password input với error state */}
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={
                      hasError ? "Try again..." : "Enter your password"
                    }
                    className={`
                      w-full px-4 py-3 pr-12 
                      border-2 rounded-xl
                      bg-gray-50 
                      text-gray-900 placeholder-gray-500
                      transition-all duration-200 ease-in-out
                      focus:outline-none focus:bg-white
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        hasError
                          ? "border-red-500 shadow-lg shadow-red-500/20 focus:border-red-600"
                          : isFocused || value
                          ? "border-orange-500 shadow-lg shadow-orange-500/20"
                          : "border-gray-200 hover:border-gray-300"
                      }
                    `}
                    disabled={isLoading}
                    autoFocus
                    autoComplete="current-password"
                    aria-label="Password input"
                    aria-invalid={hasError}
                    aria-describedby={hasError ? "password-error" : undefined}
                  />

                  {/* Show/Hide password button */}
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute p-1 transition-colors transform -translate-y-1/2 rounded-md right-3 top-1/2 hover:bg-gray-100"
                    disabled={isLoading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Submit button với error state */}
                <button
                  type="submit"
                  disabled={isLoading || !value.trim() || attemptCount >= 5}
                  className={`
                    w-full py-3 px-4 rounded-xl font-semibold text-white
                    transition-all duration-200 ease-in-out
                    focus:outline-none focus:ring-4 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      attemptCount >= 5
                        ? "bg-gray-400 cursor-not-allowed"
                        : hasError
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500/30"
                        : !isLoading && value.trim()
                        ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-orange-500/30"
                        : "bg-gray-300 cursor-not-allowed"
                    }
                  `}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : attemptCount >= 5 ? (
                    <div className="flex items-center justify-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                      <span>Too Many Attempts</span>
                    </div>
                  ) : hasError ? (
                    <div className="flex items-center justify-center gap-2">
                      <LockClosedIcon className="w-5 h-5" />
                      <span>Try Again</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <LockClosedIcon className="w-5 h-5" />
                      <span>Unlock Content</span>
                    </div>
                  )}
                </button>
              </form>
            </div>

            {/* Help text với attempt counter */}
            <div className="text-center">
              <p className="text-xs leading-relaxed text-gray-500">
                This content is password protected for privacy and security.
                <br />
                {attemptCount > 0 && attemptCount < 5 && (
                  <span className="font-medium text-orange-600">
                    {5 - attemptCount} attempts remaining.
                  </span>
                )}
                {attemptCount === 0 && "Contact the author if you need access."}
                {attemptCount >= 5 && (
                  <span className="font-medium text-red-600">
                    Maximum attempts reached. Contact the author.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Footer với attempt indicator */}
          <div
            className={`
            px-6 py-4 border-t border-gray-100 transition-colors duration-300
            ${hasError ? "bg-red-50" : "bg-gray-50"}
          `}
          >
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>
                {hasError ? "Access Denied" : "Secured content"}
                {attemptCount > 0 && ` • ${attemptCount} attempts`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </Layout>
  );
};

export default OverlayLocked;
