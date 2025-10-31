import React from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <div className={`bg-background border-t border-border ${className}`}>
      {}
      <div className="px-4 py-2 text-xs text-muted-foreground">Ready</div>
    </div>
  );
};

export default Footer;
