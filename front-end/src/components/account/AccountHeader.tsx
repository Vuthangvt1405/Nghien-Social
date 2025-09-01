import React from "react";
import type { ProfileData } from "../../api/types";
import ClickableImage from "./ClickableImage";
import images from "../../constants";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../api/Client";

interface AccountHeaderProps {
  profileData: ProfileData;
  onCoverChange: (file: File) => void;
  onAvatarChange: (file: File) => void;
  isEditable?: boolean;
  username?: string;
}

const AccountHeader: React.FC<AccountHeaderProps> = ({
  profileData,
  onCoverChange,
  onAvatarChange,
  isEditable = false,
  username,
}) => {
  const { data: statsData } = useQuery({
    queryKey: ["userStat", username],
    queryFn: () => userService.getUserStat(username!).then((res) => res.data),
    enabled: !!username,
  });

  return (
    <div className="relative mb-6 overflow-hidden bg-white rounded-lg shadow-lg">
      {/* Cover Image Section */}
      <div className="relative h-48 md:h-64">
        {isEditable ? (
          <ClickableImage
            src={profileData.cover || images.coverDefault}
            alt="Cover"
            className="object-cover w-full h-[16rem] "
            onImageChange={onCoverChange}
            isAvatar={false}
          />
        ) : (
          <img
            src={profileData.cover || images.coverDefault}
            alt="Cover"
            className="object-cover w-full h-full"
          />
        )}
      </div>

      {/* Profile Info Section */}
      <div className="relative">
        {/* Avatar */}
        <div className="absolute -top-16 left-6">
          <div className="relative">
            {isEditable ? (
              <ClickableImage
                src={profileData.avatar}
                alt="Avatar"
                className="object-cover w-32 h-32 border-4 border-white rounded-full shadow-lg"
                onImageChange={onAvatarChange}
                overlayContent={
                  <div className="flex items-center justify-center w-full h-full text-center text-white rounded-full">
                    <div>
                      <svg
                        className="w-6 h-6 mx-auto mb-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <p className="text-xs font-medium">Edit</p>
                    </div>
                  </div>
                }
              />
            ) : (
              <div>
                <img
                  src={profileData.avatar || images.avatarDemo}
                  alt="Avatar"
                  className="object-cover w-32 h-32 border-4 border-white rounded-full shadow-lg"
                />
              </div>
            )}

            {/* Online Status Badge */}
            <div className="absolute w-6 h-6 bg-green-500 border-2 border-white rounded-full bottom-2 right-2"></div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="px-4 pt-20 pb-4 bg-white ">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-1 text-3xl font-bold text-gray-900">
                {profileData.username}
              </h1>
              <p className="mb-2 text-gray-600">u/{profileData.username}</p>
              <p className="text-sm text-gray-500">{profileData.email}</p>
              <p>{profileData.description}</p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6 mt-4 md:mt-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {statsData?.post_count ?? 0}
                </div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {statsData?.follower_count ?? 0}
                </div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {statsData?.following_count ?? 0}
                </div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountHeader;
