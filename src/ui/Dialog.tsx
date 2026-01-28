import * as React from "react"

import { cn } from "../lib/utils"

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => onOpenChange?.(false)}
            />
            {children}
        </div>
    );
};

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
    ({ className, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "relative z-50 w-full max-w-lg rounded-xl bg-white p-6 shadow-lg sm:rounded-2xl border border-gray-100",
                "animate-in fade-in-0 zoom-in-95 duration-200",
                className
            )}
            {...props}
        >
            {/* We can access onOpenChange from context if we implemented one, 
          but for simplicity we might rely on the parent Dialog wrapper's backdrop click 
          or explicit close buttons inside. 
      */}
            {/* A close button could be added here if we had context */}
            {children}
        </div>
    )
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight text-gray-900",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

export { Dialog, DialogContent, DialogHeader, DialogTitle }
