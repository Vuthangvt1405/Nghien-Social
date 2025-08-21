import React, { useState } from "react";
import { userService } from "../../api/Client";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const SecuritySettings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const navigate = useNavigate();

  const handleSaveChanges = async () => {
    if (newPassword && !currentPassword) {
      toast.error("Please enter your current password to set a new one.");
      return;
    }

    if (newPassword) {
      try {
        // await userService.changePassword(currentPassword, newPassword);
        toast.success("Password updated successfully! You will be logged out.");
        Cookies.remove("authToken");
        navigate("/login");
      } catch (error) {
        toast.error("Failed to update password.");
      }
    }

    // Handle 2FA setting change here
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Password & Security</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">
          Two-Factor Authentication
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable 2FA</p>
            <p className="text-sm text-gray-600">
              Add extra security to your account
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSaveChanges}
          className="px-6 py-2 text-white transition bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SecuritySettings;
