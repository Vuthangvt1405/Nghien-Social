import React, { useRef } from "react";

interface ClickableImageProps {
  src: string | null;
  alt: string;
  className?: string;
  overlayContent?: React.ReactNode;
  onImageChange: (file: File) => void;
  accept?: string;
  isRounded?: true; // Thêm prop để xử lý rounded
  isAvatar?: boolean;
}

const ClickableImage: React.FC<ClickableImageProps> = ({
  src,
  alt,
  className = "",
  overlayContent,
  onImageChange,
  accept = "image/*",
  isRounded = true, // Default false
  isAvatar = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageChange(file);
    }
  };

  return (
    <div
      className={` cursor-pointer group 
        `}
      onClick={handleClick}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {/* Image */}
      <img
        src={src || "/default-placeholder.png"}
        alt={alt}
        className={`transition-all duration-300 group-hover:brightness-75 ${className}`}
      />
      {/* Overlay hiển thị khi hover */}
      <div
        className={`
        absolute inset-0 flex items-center justify-center 
        transition-opacity duration-300 bg-black bg-opacity-40 
        opacity-0 group-hover:opacity-100 pointer-events-none
        ${isRounded && isAvatar ? "rounded-full" : ""}
      `}
      >
        {overlayContent || (
          <div className="text-center text-white pointer-events-none">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm font-medium">Click to change</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClickableImage;
