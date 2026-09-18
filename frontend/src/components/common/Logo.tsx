import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  clickable?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  clickable = false,
  className = '',
}) => {
  // Configuración de tamaños para el icono y el texto
  const sizeClasses = {
    sm: {
      icon: 'h-6 w-6',
      text: 'text-lg',
      gap: 'gap-2',
    },
    md: {
      icon: 'h-8 w-8',
      text: 'text-2xl',
      gap: 'gap-2.5',
    },
    lg: {
      icon: 'h-12 w-12',
      text: 'text-4xl',
      gap: 'gap-3.5',
    },
    xl: {
      icon: 'h-16 w-16',
      text: 'text-5xl',
      gap: 'gap-4',
    },
    '2xl': {
      icon: 'h-24 w-24',
      text: 'text-7xl',
      gap: 'gap-6',
    },
  };

  const currentSize = sizeClasses[size];

  const logoContent = (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      {/* Icono de Connectly en SVG Premium */}
      <div className={`${currentSize.icon} shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="connectly-logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          {/* C en forma de bocadillo de chat grueso y curvado (segunda imagen) */}
          <path
            d="M 76,28 
               A 34,34 0 1,0 46,84 
               L 38,95 
               L 54,84 
               A 34,34 0 0,0 76,72 
               A 7,7 0 0,1 66,62
               A 20,20 0 1,1 66,38
               A 7,7 0 0,1 76,28 Z"
            fill="url(#connectly-logo-grad)"
          />
          {/* Círculo interior de chat */}
          <circle cx="48" cy="50" r="13" fill="#e2e8f0" />
          {/* Tres puntos suspensivos */}
          <circle cx="41" cy="50" r="2.2" fill="#0f172a" />
          <circle cx="48" cy="50" r="2.2" fill="#0f172a" />
          <circle cx="55" cy="50" r="2.2" fill="#0f172a" />
        </svg>
      </div>

      {/* Texto de Connectly */}
      {showText && (
        <span className={`logo-text ${currentSize.text} font-bold tracking-tight select-none`}>
          <span className="text-white">Connect</span>
          <span className="text-accent">ly</span>
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link to="/feed" className="inline-block hover:opacity-95 transition-opacity" style={{ textDecoration: 'none', color: 'inherit' }}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};
