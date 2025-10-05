import React from 'react';
import { UserIcon } from './icons';

interface ProfilePhotoProps {
  photoUrl: string;
  alt: string;
  className?: string;
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({ photoUrl, alt, className = '' }) => {
  // Check if photoUrl is a valid non-empty string. Handles null, undefined, and empty strings.
  const hasPhoto = photoUrl && typeof photoUrl === 'string' && photoUrl.trim() !== '';

  if (hasPhoto) {
    return <img src={photoUrl} alt={alt} className={className} />;
  }

  // Fallback to UserIcon
  return (
    <div className={`flex items-center justify-center bg-slate-200 text-slate-400 ${className}`}>
      <UserIcon className="w-3/5 h-3/5" />
    </div>
  );
};

export default ProfilePhoto;
