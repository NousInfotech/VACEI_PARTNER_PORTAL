import type { ReactNode } from "react";

interface ShadowCardProps {
  children?: ReactNode;
  className?: string;
  animate?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export const ShadowCard = ({ 
  children, 
  className = "", 
  animate = false, 
  onClick
}: ShadowCardProps) => {
  const hasBg = className.includes("bg-");

  const baseStyles = `${!hasBg ? "bg-white/80" : ""} border border-white/50 rounded-2xl backdrop-blur-md shadow-lg shadow-gray-300/30 transition-all duration-300`;
  const animationStyles = animate ? "animate-slide-in-right" : "";
 
  return (
    <div onClick={onClick} className={`${baseStyles} ${animationStyles} ${className}`}>
      {children}
    </div>
  );
};

export default ShadowCard;
