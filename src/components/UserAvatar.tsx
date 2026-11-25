import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { AVATAR_PRESETS } from '../data/mockData';
import { getUserInitials } from '../utils/avatar';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  sizeClass?: string;
  textClass?: string;
  roundedClass?: string;
  showCameraButton?: boolean;
  onCameraClick?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  sizeClass = 'w-12 h-12',
  textClass = 'text-base',
  roundedClass = 'rounded-2xl',
  showCameraButton = false,
  onCameraClick,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const cleanSrc = src && src !== '__initials__' ? src : '';
  const preset = AVATAR_PRESETS.find((p) => p.id === cleanSrc);
  const initials = getUserInitials(name);
  const showImage = Boolean(cleanSrc) && !preset && !imgError;

  return (
    <div className={`relative inline-flex shrink-0 ${sizeClass}`}>
      {showImage ? (
        <img
          src={cleanSrc}
          alt={name || 'Customer Avatar'}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`w-full h-full ${roundedClass} object-cover border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-slate-800`}
        />
      ) : (
        <div
          className={`w-full h-full ${roundedClass} bg-gradient-to-br ${
            preset?.bg || 'from-[#F97316] to-amber-500'
          } text-white font-display font-bold ${textClass} flex items-center justify-center shadow-sm select-none`}
        >
          {initials}
        </div>
      )}

      {showCameraButton && onCameraClick && (
        <button
          type="button"
          onClick={onCameraClick}
          aria-label="Change profile photo"
          title="Change profile photo"
          className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/20 text-[#F97316] hover:bg-[#F97316] hover:text-white hover:border-[#F97316] shadow-md flex items-center justify-center transition-colors cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
