import React, { useState, useEffect } from "react";
import ProfileForm from "./ProfileForm";
import type { ProfileData } from "../../api/types";
import { userService } from "../../api/Client"; // Adjust import path as needed
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/user/userSlice";
import { useNavigate } from "react-router-dom";

interface ProfileSettingsProps {
  profileData: ProfileData;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profileData: initialProfileData,
}) => {
  const [profileData, setProfileData] = useState(initialProfileData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Đồng bộ state với props khi props thay đổi
  useEffect(() => {
    setProfileData(initialProfileData);
  }, [initialProfileData]);

  const onProfileDataChange = (data: Partial<ProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...data }));
  };

  const handleSaveChanges = async (field: keyof ProfileData) => {
    try {
      // Hàm `updateProfile` giờ trả về trực tiếp dữ liệu người dùng đã được cập nhật.
      const updatedUserData = await userService.updateProfile({
        [field]: profileData[field],
      });

      console.log("Profile updated successfully:", updatedUserData);

      // Dispatch action `setUser` để cập nhật Redux state với dữ liệu mới.
      // Cookie đã được cập nhật bên trong hàm của userService.
      dispatch(setUser(updatedUserData));

      toast.success(`${field} updated successfully!`);

      // Nếu username thay đổi, điều hướng đến trang profile mới
      if (field === "username") {
        navigate(`/info/${updatedUserData.username}`);
      }
    } catch (error: any) {
      let errorMessage = `Failed to update ${field}.`;
      // Kiểm tra message lỗi cụ thể từ API
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        // Lấy message lỗi chung
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      console.error(`Update failed for ${field}:`, error);
    }
  };

  // OTP States
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Gửi OTP
  const handleSendOtp = async () => {
    if (!profileData.email) {
      setError("Email is required for verification");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await userService.sendOTPEmail(profileData.email);
      setShowOtpPopup(true);
      setSuccessMessage("OTP đã được gửi đến email của bạn!");
    } catch (err: unknown) {
      console.error("Error sending OTP:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Xác thực OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError("Vui lòng nhập OTP 6 chữ số");
      return;
    }

    if (!profileData.email) {
      setError("Email is required for verification");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await userService.verifyOTPEmail(profileData.email, parseInt(otp));
      setSuccessMessage("Xác thực thành công!");
      setShowOtpPopup(false);
      setOtp("");

      // Update verified status in profile data
      onProfileDataChange({ verify: true });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      console.error("Error verifying OTP:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Đóng popup
  const closePopup = () => {
    setShowOtpPopup(false);
    setOtp("");
    setError("");
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setSuccessMessage("");
    await handleSendOtp();
  };

  return (
    <div className="space-y-6">
      {/* Verification Status */}
      {profileData.verify ? (
        <div className="p-4 mb-6 rounded-lg bg-green-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-5 h-5 bg-green-600 rounded-full">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-700">
              Account verified
            </span>
          </div>
          {successMessage && (
            <div className="mt-2 text-xs text-green-600">{successMessage}</div>
          )}
        </div>
      ) : (
        <div className="p-4 mb-6 rounded-lg bg-yellow-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-5 h-5 border-2 border-yellow-600 rounded-full">
                <svg
                  className="w-3 h-3 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-yellow-700">
                Account not verified
              </span>
            </div>

            <button
              onClick={handleSendOtp}
              disabled={isLoading || !profileData.email}
              className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 border border-yellow-700 rounded-full border-t-transparent animate-spin"></div>
                  Sending...
                </>
              ) : (
                "Verify Now"
              )}
            </button>
          </div>

          {/* Success/Error Messages */}
          {successMessage && !showOtpPopup && (
            <div className="mt-2 text-xs text-green-600">{successMessage}</div>
          )}
          {error && !showOtpPopup && (
            <div className="mt-2 text-xs text-red-600">{error}</div>
          )}

          {/* Email missing warning */}
          {!profileData.email && (
            <div className="mt-2 text-xs text-red-600">
              Please add your email address to enable verification
            </div>
          )}
        </div>
      )}
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Profile Information</h2>
        <ProfileForm
          profileData={profileData}
          onProfileDataChange={onProfileDataChange}
          onSave={handleSaveChanges}
        />
      </div>

      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Bio & Description</h2>
        <textarea
          value={profileData?.description ?? ""}
          onChange={(e) => onProfileDataChange({ description: e.target.value })}
          placeholder="Tell us about yourself..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={() => handleSaveChanges("description")}
            className="px-4 py-2 text-white transition bg-orange-500 rounded-md hover:bg-orange-600"
          >
            Save Description
          </button>
        </div>
      </div>

      {/* OTP Popup */}
      {showOtpPopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-t-lg animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Enter Verification Code
              </h3>
              <button
                onClick={closePopup}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              We've sent a 6-digit code to <strong>{profileData.email}</strong>
            </p>

            <div className="mb-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(value);
                  setError("");
                }}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 text-lg tracking-widest text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 text-sm text-center text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closePopup}
                className="flex-1 px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={isVerifying || otp.length !== 6}
                className="flex items-center justify-center flex-1 gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </button>
            </div>

            <button
              onClick={handleResendOtp}
              disabled={isLoading}
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Resend code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
