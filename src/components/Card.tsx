import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlighted' | 'elevated' | 'subtle';
  pressable?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  pressable = false,
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#0E1712] border border-[#1C2E24] shadow-md',
    highlighted: 'bg-[#0E1712] border-2 border-[#10B981] shadow-xl shadow-emerald-950/20',
    elevated: 'bg-[#15241D] border border-[#1C2E24] shadow-lg',
    subtle: 'bg-[#070C09] border border-[#1C2E24]',
  }[variant];

  const pressableStyles = pressable
    ? 'cursor-pointer hover:border-[#10B981]/60 transition-all duration-200 active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-2xl p-5 ${variantStyles} ${pressableStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
