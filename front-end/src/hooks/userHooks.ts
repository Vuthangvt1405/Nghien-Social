import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../store/user/userSlice";
import { userService } from "../api/Client";
import type { RootState } from "../store/store";
import type { ProfileData } from "../api/types";

export const useUserProfile = (username?: string) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const loggedInUser = useSelector((state: RootState) => state.user);

  const isOwnProfile = loggedInUser.username === username;

  const {
    data: profileData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile", username],
    queryFn: () =>
      userService.getProfileByUsername(username!).then((res) => res.data),
    enabled: !!username,
  });

  const [editableData, setEditableData] = useState<ProfileData | undefined>(
    profileData
  );
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profileData) {
      setEditableData(profileData);
    }
  }, [profileData]);

  const updateProfileMutation = useMutation({
    mutationFn: (updatedProfile: Partial<ProfileData>) =>
      userService.updateProfile(updatedProfile),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      dispatch(setUser(data.data as Partial<ProfileData>));
      console.log("Update successfully");
    },
  });

  const handleUpdateUserProfile = () => {
    if (!isOwnProfile || !editableData) return;
    updateProfileMutation.mutate({
      username: editableData.username,
      description: editableData.description,
    });
  };

  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => userService.uploadCover(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleCoverChange = (file: File) => {
    if (!editableData) return;
    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    setEditableData({ ...editableData, cover: preview });
    uploadCoverMutation.mutate(file);
  };

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleAvatarChange = (file: File) => {
    if (!editableData) return;
    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    setEditableData({ ...editableData, avatar: preview });
    uploadAvatarMutation.mutate(file);
  };

  return {
    profileData,
    editableData,
    setEditableData,
    isLoading,
    isError,
    isUploading,
    isOwnProfile,
    handleUpdateUserProfile,
    handleCoverChange,
    handleAvatarChange,
  };
};
