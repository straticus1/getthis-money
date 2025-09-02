import React from 'react';

const Logo = ({ variant = 'primary', size = 'medium', className = '' }) => {
  const getLogoSrc = () => {
    switch (variant) {
      case 'white':
        return '/images/logo/logo-white.png';
      case 'dark':
        return '/images/logo/logo-dark.png';
      case 'solana':
        return '/images/logo/logo-solana-token.svg';
      default:
        return '/images/logo/logo-primary.png';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'h-6';
      case 'large':
        return 'h-12';
      default:
        return 'h-8';
    }
  };

  return (
    <img
      src={getLogoSrc()}
      alt="GetThis.Money"
      className={`${getSizeClass()} w-auto transition-transform duration-300 hover:scale-105 ${className}`}
    />
  );
};

export default Logo;
