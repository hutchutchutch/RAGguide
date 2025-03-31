import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { FcGoogle } from "react-icons/fc";
import { Loader2, Mail, Lock, Brain } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [, setLocation] = useLocation();
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();
  
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const handleLogin = async (data: LoginValues) => {
    try {
      await login(data.email, data.password);
      onClose();
      setLocation("/dashboard");
    } catch (error) {
      // Error is already handled in the auth context
    }
  };
  
  const handleRegister = async (data: RegisterValues) => {
    try {
      await register(data.name, data.email, data.password);
      registerForm.reset();
      // Switch to login tab
      const loginTab = document.querySelector('[data-state="inactive"][data-value="login"]') as HTMLElement;
      if (loginTab) loginTab.click();
    } catch (error) {
      // Error is already handled in the auth context
    }
  };
  
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#252525] border border-gray-700 text-white">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Brain className="h-10 w-10 text-purple-500" />
          </div>
          <DialogTitle className="text-2xl font-bold text-white">
            Welcome to BookRAG
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Sign in to your account or create a new one
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-[#303030]">
            <TabsTrigger value="login" className="text-white data-[state=active]:bg-[#404040]">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="text-white data-[state=active]:bg-[#404040]">
              Register
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-4 space-y-4">
            <Button 
              onClick={handleGoogleLogin} 
              className="w-full bg-white hover:bg-gray-100 text-black font-medium h-11"
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              Sign in with Google
            </Button>
            
            <div className="flex items-center gap-2 my-4">
              <Separator className="flex-1 bg-gray-700" />
              <span className="text-sm text-gray-400">OR</span>
              <Separator className="flex-1 bg-gray-700" />
            </div>
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            className="bg-[#303030] border-gray-600 text-white pl-10 placeholder:text-gray-500 focus-visible:ring-gray-500"
                            placeholder="name@example.com"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            type="password"
                            className="bg-[#303030] border-gray-600 text-white pl-10 placeholder:text-gray-500 focus-visible:ring-gray-500"
                            placeholder="••••••••"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="register" className="mt-4 space-y-4">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-[#303030] border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-gray-500"
                          placeholder="John Doe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            className="bg-[#303030] border-gray-600 text-white pl-10 placeholder:text-gray-500 focus-visible:ring-gray-500"
                            placeholder="name@example.com"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            type="password"
                            className="bg-[#303030] border-gray-600 text-white pl-10 placeholder:text-gray-500 focus-visible:ring-gray-500"
                            placeholder="••••••••"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            type="password"
                            className="bg-[#303030] border-gray-600 text-white pl-10 placeholder:text-gray-500 focus-visible:ring-gray-500"
                            placeholder="••••••••"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="flex items-center gap-2 my-4">
              <Separator className="flex-1 bg-gray-700" />
              <span className="text-sm text-gray-400">OR</span>
              <Separator className="flex-1 bg-gray-700" />
            </div>
            
            <Button 
              onClick={handleGoogleLogin} 
              className="w-full bg-white hover:bg-gray-100 text-black font-medium h-11"
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              Sign up with Google
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}