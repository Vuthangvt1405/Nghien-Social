import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/Layout";
import AccountHeader from "../../components/account/AccountHeader";
import AccountNavigation from "../../components/account/AccountNavigation";
import ProfileSettings from "../../components/account/ProfileSettings";
import SecuritySettings from "../../components/account/SecuritySettings";
import UserPostsList from "../../components/account/UserPostsList";
import { setUser, fetchUserProfile } from "../../store/user/userSlice";
import type { AccountSection } from "../../types/accountSettings";
import {
  updateProfile,
  uploadCoverUser,
  uploadAvtarUser,
  getProfileByUsername,
} from "../../api/Client";
import type { RootState, AppDispatch } from "../../store/store";

export default function AccountSetting() {
  const dispatch = useDispatch<AppDispatch>();
  const { username } = useParams<{ username: string }>();
  const loggedInUser = useSelector((state: RootState) => state.user);

  const {
    data: profileData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getProfileByUsername(username!).then((res) => res.data),
    enabled: !!username,
  });

  console.log("Profile Data:", profileData);

  const [editableData, setEditableData] = useState(profileData);
  const [activeSection, setActiveSection] = useState<
    "profile" | "security" | string
  >("profile");
  const [isUploading, setIsUploading] = useState(false);

  const isOwnProfile = loggedInUser.username === username;

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

  const handleSubmtUpdateUserProfile = async () => {
    if (!isOwnProfile) return;
    dispatch(setUser(editableData));
    const newProfile = await updateProfile({
      username: editableData?.username,
      description: editableData?.description,
    });
    dispatch(setUser(newProfile.user));
    console.log("Update successfully");
  };

  useEffect(() => {
    if (profileData) {
      setEditableData(profileData);
    }
  }, [profileData]);

  const createPreviewUrl = (file: File) => URL.createObjectURL(file);

  const handleCoverChange = async (file: File) => {
    if (!editableData) return;
    setIsUploading(true);
    try {
      const preview = createPreviewUrl(file);
      setEditableData({ ...editableData, cover: preview });
      const res = await uploadCoverUser(file);
      if (res.data?.cover) {
        dispatch(fetchUserProfile());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!editableData) return;
    setIsUploading(true);
    try {
      const preview = createPreviewUrl(file);
      setEditableData({ ...editableData, avatar: preview });
      const res = await uploadAvtarUser(file);
      if (res.data?.payload.avatar) {
        dispatch(fetchUserProfile());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

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
              <ActiveSectionComponent
                profileData={editableData}
                onProfileDataChange={setEditableData}
              />
            </div>
            <div className="fixed z-50 bottom-6 right-6">
              <button
                onClick={handleSubmtUpdateUserProfile}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-3 text-white transition bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 disabled:opacity-50"
              >
                <span>💾</span>Save Changes
              </button>
            </div>
          </>
        ) : (
          <UserPostsList username={username} />
        )}
      </div>
    </Layout>
  );
}
