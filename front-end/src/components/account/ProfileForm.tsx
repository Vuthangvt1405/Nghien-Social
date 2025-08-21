import React from "react";
import type { ProfileData } from "../../api/types";

interface ProfileFormProps {
  profileData: ProfileData;
  onProfileDataChange: (data: Partial<ProfileData>) => void;
  onSave: (field: keyof ProfileData) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profileData,
  onProfileDataChange,
  onSave,
}) => {
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    onProfileDataChange({ [field]: value });
  };

  return (
    <div className="p-8 mt-4 mb-6 overflow-hidden bg-white rounded-lg shadow-lg">
      <div className="pt-6 space-y-4 border-t">
        <div className="flex items-end gap-4">
          <div className="flex-grow">
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
          <button
            onClick={() => onSave("username")}
            className="px-4 py-2 text-white transition bg-orange-500 rounded-md hover:bg-orange-600"
          >
            Save
          </button>
        </div>

        <div className="flex items-end gap-4">
          <div className="flex-grow">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              readOnly
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
