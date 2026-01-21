import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'header'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 pointer-events-auto cursor-pointer"
    
    const variants = {
      default: "bg-primary text-white shadow-md hover:bg-primary/90",
      outline: "border border-gray-200 bg-transparent hover:bg-gray-100",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      ghost: "hover:bg-gray-100",
      header: "bg-light text-dark shadow-md hover:bg-light/90",
    }
    
    const sizes = {
      default: "px-4 py-2",
      sm: "px-3 py-1.5",
      lg: "px-6 py-3",
      icon: "p-2",
    }

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

    return (
      <button
        ref={ref}
        className={combinedClassName}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
