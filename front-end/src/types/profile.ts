export interface ProfileData {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  cover: string | null;
  admin: boolean;
  description?: string;
  verified: boolean;
}

export interface ImageUploadProps {
  label: string;
  currentImage: string | null;
  onImageChange: (url: string | null, file?: File) => void;
  className?: string;
  imageClassName?: string;
  accept?: string;
}
