import React, { useState } from 'react';
import { Shirt } from 'lucide-react';

interface StoreImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const StoreImage: React.FC<StoreImageProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-zinc-100 text-zinc-500 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Shirt className="w-8 h-8 mb-2 stroke-[1.25] text-zinc-400" />
        <span className="text-xs font-medium text-zinc-600 line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
