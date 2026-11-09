/**
 * TFM SCHEDULER — Composant de Surface Apple Minimal (Inset Grouped Card)
 * Conforme aux jetons stricts :
 * - Surface : #202227
 * - Bordure : #34363B
 * - Texte primaire : #FFFFFF
 * - Texte secondaire : #A1A1AA
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
  const variantStyles = {
    default:
      'bg-[#202227] border border-[#34363B] text-white shadow-sm',
    glass:
      'bg-[#202227]/90 backdrop-blur-xl border border-[#34363B] text-white',
    elevated:
      'bg-[#202227] border border-[#34363B] text-white shadow-md',
    subtle:
      'bg-[#101114] border border-[#34363B] text-white',
  }[variant];

  const interactiveStyles = interactive || onClick
    ? 'cursor-pointer active:scale-[0.99] transition duration-150 hover:border-[#777C84]'
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
