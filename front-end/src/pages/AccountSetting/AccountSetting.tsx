import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Layout from "../../components/Layout";
import AccountHeader from "../../components/account/AccountHeader";
import AccountNavigation from "../../components/account/AccountNavigation";
import ProfileSettings from "../../components/account/ProfileSettings";
import SecuritySettings from "../../components/account/SecuritySettings";
import { setUser, fetchUserProfile } from "../../store/user/userSlice";
import type { AccountSection } from "../../types/accountSettings";
import { updateProfile, uploadCoverUser } from "../../api/Client";
import { uploadAvtarUser } from "../../api/Client";
import type { RootState, AppDispatch } from "../../store/store";
import { useParams } from "react-router-dom";

export default function AccountSetting() {
  const dispatch = useDispatch<AppDispatch>();
  const reduxProfile = useSelector((state: RootState) => state.user);
  const [infoUser, setInfoUser] = useState(reduxProfile);
  const { username } = useParams<{ username: string }>();

  const [activeSection, setActiveSection] = useState<
    "profile" | "security" | string
  >("profile");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(!reduxProfile.email);

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
    dispatch(setUser(infoUser));
    const newProfile = await updateProfile({
      username: infoUser?.username,
      description: infoUser?.description,
    });
    dispatch(setUser(newProfile.user));
    console.log(newProfile.user);
    console.log("Update successfully");
  };

  useEffect(() => {
    if (reduxProfile.isAuthenticated) {
      setInfoUser(reduxProfile);
      setIsLoading(false);
    } else if (!reduxProfile.loading) {
      // If not authenticated and not loading, redirect
      // redirectToLogin(); // This might cause loops, handle with care
    }
  }, [reduxProfile]);

  const createPreviewUrl = (file: File) => URL.createObjectURL(file);

  const handleCoverChange = async (file: File) => {
    if (!infoUser) return;
    setIsUploading(true);
    try {
      const preview = createPreviewUrl(file);
      setInfoUser({ ...infoUser, cover: preview });
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
    if (!infoUser) return;
    setIsUploading(true);
    try {
      const preview = createPreviewUrl(file);
      setInfoUser({ ...infoUser, avatar: preview });
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

  if (!infoUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-600">Failed to load profile. Redirecting...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl p-4 mx-auto">
        <AccountHeader
          profileData={reduxProfile}
          onCoverChange={handleCoverChange}
          onAvatarChange={handleAvatarChange}
          isEditable={true}
          username={username}
        />

        {isUploading && (
          <div className="p-4 mb-6 rounded-lg bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <span className="text-sm font-medium text-blue-700">
                Uploading image...
              </span>
            </div>
          </div>
        )}

        <AccountNavigation
          sections={accountSections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <div className="min-h-[500px]">
          <ActiveSectionComponent
            profileData={infoUser}
            onProfileDataChange={setInfoUser}
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
      </div>
    </Layout>
  );
}
