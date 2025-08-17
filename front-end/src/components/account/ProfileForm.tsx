import React from "react";
import type { ProfileData } from "../../types/profile";

interface ProfileFormProps {
  profileData: ProfileData;
  onProfileDataChange: (data: Partial<ProfileData>) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profileData,
  onProfileDataChange,
}) => {
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    onProfileDataChange({ [field]: value });
  };

  return (
    <div className="p-8 mt-4 mb-6 overflow-hidden bg-white rounded-lg shadow-lg">
      <div className="pt-6 space-y-4 border-t">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Display Name
          </label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
