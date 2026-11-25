import React, { useState } from 'react';
import { Cpu } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
  ...rest
}) => {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 text-slate-500 dark:text-slate-400 p-4 text-center ${className}`}
        role="img"
        aria-label={alt || fallbackLabel || 'Product preview'}
      >
        <Cpu className="w-8 h-8 mb-2 text-[#F97316]/80" />
        <span className="text-xs font-medium line-clamp-2 max-w-[140px]">
          {fallbackLabel || alt || 'TECHHAVEN Hardware'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={className}
      {...rest}
    />
  );
};
