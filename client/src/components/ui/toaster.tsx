import { useToast } from "@/contexts/toast-context";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px]">
      {toasts && toasts.map((toast) => (
        <div
          key={toast.id}
          className={`mb-2 flex w-full cursor-pointer items-center justify-between rounded-md ${
            toast.variant === "destructive"
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          } px-6 py-4 shadow-lg`}
          onClick={() => dismiss(toast.id)}
        >
          <div className="grid gap-1">
            {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
            {toast.description && <div className="text-xs opacity-90">{toast.description}</div>}
          </div>
          <X className="h-4 w-4 opacity-70" />
        </div>
      ))}
    </div>
  );
}