import * as React from "react"
import { Dialog, DialogContent } from "./Dialog"
import { Button } from "./Button"
import { X } from "lucide-react"
import { cn } from "../lib/utils"

interface SheetProps {
  children: React.ReactNode
}

const Sheet = ({ children }: SheetProps) => {
  return <>{children}</>
}

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ className, children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, { 
        ...props,
        ref,
      } as any)
    }
    return (
      <button
        ref={ref}
        className={cn("outline-none", className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SheetTrigger.displayName = "SheetTrigger"

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = 'right', open, onOpenChange, children, ...props }, ref) => {
    if (!open) return null

    const sideClasses = {
      top: "inset-x-0 top-0 border-b",
      right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      bottom: "inset-x-0 bottom-0 border-t",
      left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          ref={ref}
          className={cn(
            "fixed z-50 gap-0 bg-white p-0 shadow-lg transition ease-in-out",
            sideClasses[side],
            className
          )}
          {...props}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onOpenChange?.(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
)
SheetContent.displayName = "SheetContent"

export { Sheet, SheetTrigger, SheetContent }

