import React, { useState } from 'react';

export const TECHHAVEN_LOGO_SRC = `${import.meta.env.BASE_URL}assets/aistudio/TechHaven_Power_Logo_d926db08.png`;

interface BrandLogoProps {
  variant?: 'header' | 'drawer' | 'footer';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'header',
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const imgSizeClass =
    variant === 'drawer'
      ? 'h-7 w-auto'
      : variant === 'footer'
        ? 'h-8 sm:h-9 w-auto'
        : 'h-7 sm:h-8 md:h-9 w-auto';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-[#0B0F19] px-2 py-1 sm:px-2.5 sm:py-1 ring-1 ring-slate-900/10 dark:ring-white/10 shadow-sm dark:shadow-none transition-colors shrink-0 ${className}`}
    >
      {imgFailed ? (
        <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-white px-1">
          <span className="text-[#F97316]">Tech</span>Haven
        </span>
      ) : (
        <img
          src={TECHHAVEN_LOGO_SRC}
          alt="TechHaven"
          width={2103}
          height={748}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className={`${imgSizeClass} object-contain rounded-md select-none block`}
        />
      )}
    </span>
  );
};
