import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/contexts/toast-context";

// Check if dev mode is enabled
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  loginWithGoogle: () => void;
  loginAsTestUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

function useLogoutMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const logoutMutation = useLogoutMutation();

  // In dev mode, automatically log in as soon as the component mounts
  useEffect(() => {
    if (DEV_MODE && !user) {
      console.log("DEV MODE: Auto-logging in as dev user");
      // Set the mock user data
      const mockUser = {
        id: "dev-user-123",
        username: "devuser",
        email: "dev@example.com",
        avatar_url: null,
        password: null,
        google_id: null,
        google_access_token: null,
        google_refresh_token: null,
        last_login: new Date().toISOString()
      };
      
      // Update the query cache with our mock user
      queryClient.setQueryData(["/api/user"], mockUser);
      
      toast({
        title: "Dev Mode Active",
        description: "You are automatically logged in as a dev user",
      });
    }
  }, [toast]);

  const loginWithGoogle = () => {
    if (DEV_MODE) {
      console.log("DEV MODE: Simulating Google login");
      toast({
        title: "Dev Mode Active",
        description: "Google login simulation successful",
      });
      return;
    }
    
    // Use the absolute URL to ensure proper redirects with custom domains
    const baseUrl = window.location.origin;
    window.location.href = `${baseUrl}/api/auth/google`;
    console.log(`Redirecting to Google OAuth: ${baseUrl}/api/auth/google`);
  };

  const loginAsTestUser = async () => {
    if (DEV_MODE) {
      console.log("DEV MODE: Simulating test user login");
      
      // Set the mock user data
      const mockUser = {
        id: "test-user-456",
        username: "testuser",
        email: "test@example.com",
        avatar_url: null,
        password: null,
        google_id: null,
        google_access_token: null,
        google_refresh_token: null,
        last_login: new Date().toISOString()
      };
      
      // Update the query cache with our mock user
      queryClient.setQueryData(["/api/user"], mockUser);
      
      toast({
        title: "Logged in as test user",
        description: "You now have access to all features",
      });
      return;
    }
    
    try {
      const response = await apiRequest("POST", "/api/test-login");
      queryClient.setQueryData(["/api/user"], response);
      toast({
        title: "Logged in as test user",
        description: "You now have access to all features",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Failed to login as test user",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        logoutMutation,
        loginWithGoogle,
        loginAsTestUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}