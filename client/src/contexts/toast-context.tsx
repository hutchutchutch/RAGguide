import { createContext, ReactNode, useContext } from "react";
import { useToast as useToastHook } from "@/hooks/use-toast";

type ToastContextType = ReturnType<typeof useToastHook>;

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toastMethods = useToastHook();
  
  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
}