import React, { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export type AlertVariant = "success" | "danger" | "warning" | "info";

export type AlertProps = {
  message: string;
  variant?: AlertVariant;
  duration?: number;
  onClose?: () => void;
  className?: string;
  fixed?: boolean;
};

const variantStyles: Record<AlertVariant, string> = {
  success: "bg-green-100 text-green-800 border-green-300",
  danger: "bg-red-100 text-red-800 border-red-300",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  info: "bg-blue-100 text-blue-800 border-blue-300",
};

const AlertMessage: React.FC<AlertProps> = ({
  message,
  variant = "success",
  duration = 6000,
  onClose,
  className = "",
  fixed = true,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  const positionClasses = fixed ? "fixed top-4 right-4 z-50" : "relative w-full mb-4";

  return (
    <div
      className={cn(
        positionClasses,
        "max-w-sm rounded px-4 py-3 text-sm shadow-md border flex justify-between items-center",
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <span>{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        className="ml-4 text-lg font-bold leading-none focus:outline-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default AlertMessage;
