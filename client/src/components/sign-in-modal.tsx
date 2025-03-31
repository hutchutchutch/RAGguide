import { useLocation } from "wouter";
import { FcGoogle } from "react-icons/fc";
import { Brain } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { loginWithGoogle } = useAuth();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#252525] border border-gray-700 text-white">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="h-12 w-12 text-purple-500" />
          </div>
          <DialogTitle className="text-2xl font-bold text-white mb-2">
            Welcome to BookRAG
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-base">
            Sign in to start exploring your Google Drive documents with advanced
            RAG techniques
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 mb-2">
          <Button
            onClick={loginWithGoogle}
            className="w-full bg-white hover:bg-gray-100 text-black font-medium h-12 text-base"
            size="lg"
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          By continuing, you agree to BookRAG's Terms of Service and Privacy
          Policy
        </p>
      </DialogContent>
    </Dialog>
  );
}
