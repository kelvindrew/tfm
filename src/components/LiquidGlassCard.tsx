/**
 * TFM SCHEDULER — Composant de Surface Liquid Glass & Surfaces Minimalistes
 * Conforme au système monochromatique Apple / visionOS
 */

import React from 'react';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'subtle';
  onClick?: () => void;
  interactive?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick,
  interactive = false,
}) => {
  // Styles de surfaces monochromatiques stricts
  const variantStyles = {
    // Surface primaire solide (haute lisibilité, contraste optimal)
    default:
      'bg-white dark:bg-[#18191D] border border-black/[0.06] dark:border-white/[0.08] text-[#18191D] dark:text-[#F4F4F5] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)]',
    
    // Surface Liquid Glass translucide avec flou maîtrisé (utilisée avec parcimonie)
    glass:
      'liquid-glass text-[#18191D] dark:text-[#F4F4F5]',

    // Surface surélevée (utilisée pour la carte maîtresse de rotation)
    elevated:
      'liquid-glass-elevated specular-border text-[#18191D] dark:text-[#F4F4F5]',

    // Surface discrète pour conteneurs secondaires ou éléments imbriqués
    subtle:
      'bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] text-[#18191D] dark:text-[#F4F4F5]',
  }[variant];

  const interactiveStyles = interactive || onClick
    ? 'cursor-pointer active:scale-[0.99] transition duration-150 hover:border-black/15 dark:hover:border-white/20'
    : '';

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl ${variantStyles} ${interactiveStyles} ${className}`}
    >
      {children}
    </div>
  );
};
