import { useState, useCallback } from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

// ToastContextValue interface (kept for potential future use)
// interface ToastContextValue {
//   toast: (toast: Omit<Toast, "id">) => void
//   toasts: Toast[]
// }

let toastId = 0
const toastListeners = new Set<(toasts: Toast[]) => void>()
let toasts: Toast[] = []

const addToast = (toast: Omit<Toast, "id">) => {
  const id = String(++toastId)
  const newToast = { ...toast, id }
  toasts = [...toasts, newToast]
  toastListeners.forEach((listener) => listener(toasts))
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    toastListeners.forEach((listener) => listener(toasts))
  }, 3000)
}

export const useToast = () => {
  const [localToasts, setLocalToasts] = useState<Toast[]>(toasts)

  useState(() => {
    const listener = (newToasts: Toast[]) => {
      setLocalToasts(newToasts)
    }
    toastListeners.add(listener)
    return () => {
      toastListeners.delete(listener)
    }
  })

  const toast = useCallback((toastData: Omit<Toast, "id">) => {
    addToast(toastData)
  }, [])

  return { toast, toasts: localToasts }
}

