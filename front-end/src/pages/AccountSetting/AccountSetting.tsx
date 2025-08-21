import { useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import AccountHeader from "../../components/account/AccountHeader";
import AccountNavigation from "../../components/account/AccountNavigation";
import ProfileSettings from "../../components/account/ProfileSettings";
import SecuritySettings from "../../components/account/SecuritySettings";
import UserPostsList from "../../components/account/UserPostsList";
import type { AccountSection } from "../../types/accountSettings";
import { useUserProfile } from "../../hooks/userHooks";

export default function AccountSetting() {
  const { username } = useParams<{ username: string }>();
  const {
    profileData,
    editableData,
    isLoading,
    isError,
    isUploading,
    isOwnProfile,
    handleCoverChange,
    handleAvatarChange,
  } = useUserProfile(username);

  const [activeSection, setActiveSection] = useState<
    "profile" | "security" | string
  >("profile");

  const accountSections: AccountSection[] = [
    { id: "profile", label: "Profile", icon: "", component: ProfileSettings },
    {
      id: "security",
      label: "Security",
      icon: "",
      component: SecuritySettings,
      badge: 1,
    },
  ];

  const ActiveSectionComponent =
    accountSections.find((s) => s.id === activeSection)?.component ??
    ProfileSettings;

  if (!username) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-600">No user specified.</p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-600">Failed to load profile.</p>
        </div>
      </Layout>
    );
  }

  const displayData = isOwnProfile ? editableData : profileData;

  if (!displayData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Profile not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl p-4 mx-auto">
        <AccountHeader
          profileData={displayData}
          onCoverChange={handleCoverChange}
          onAvatarChange={handleAvatarChange}
          isEditable={isOwnProfile}
          username={username}
        />

        {isUploading && isOwnProfile && (
          <div className="p-4 mb-6 rounded-lg bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <span className="text-sm font-medium text-blue-700">
                Uploading image...
              </span>
            </div>
          </div>
        )}

        {isOwnProfile ? (
          <>
            <AccountNavigation
              sections={accountSections}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
            <div className="min-h-[500px]">
              <ActiveSectionComponent profileData={editableData} />
            </div>
          </>
        ) : (
          <UserPostsList username={username} />
        )}
      </div>
    </Layout>
  );
}
