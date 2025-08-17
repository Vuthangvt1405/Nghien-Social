import type { ProfileData } from "./profile";

export interface AccountSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  component;
  badge?: number;
}

export interface AccountLayoutProps {
  profileData: ProfileData;
  sections: AccountSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  onProfileUpdate: (data: Partial<ProfileData>) => void;
}
