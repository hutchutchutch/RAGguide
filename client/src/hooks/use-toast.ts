import { useState, useCallback } from "react";

export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

// This is a simple implementation for now
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback(
    ({ title, description, variant = "default" }: Omit<ToastProps, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, title, description, variant };
      
      setToasts((prev) => [...prev, newToast]);
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        dismiss(id);
      }, 5000);
      
      return id;
    },
    []
  );

  const dismiss = useCallback(
    (id: string) => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    },
    []
  );

  return {
    toast,
    dismiss,
    toasts,
  };
}