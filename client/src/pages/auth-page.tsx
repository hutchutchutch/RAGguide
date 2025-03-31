import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, Layers, GitCompare } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
  const { user } = useAuth();

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/20 rounded-full filter blur-3xl opacity-30"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="flex justify-center mb-6">
            <Brain className="h-12 w-12 text-indigo-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">
            BookMind Explorer
          </h1>
          
          <p className="text-lg text-gray-400 text-center mb-12">
            Sign in to explore advanced document analysis with RAG techniques
          </p>
          
          <Button
            className="w-full h-14 bg-white hover:bg-gray-100 text-black font-medium text-lg mb-6"
            onClick={() => window.location.href = "/api/auth/google"}
          >
            <FcGoogle className="mr-2 h-6 w-6" />
            Continue with Google
          </Button>
          
          <p className="text-center text-sm text-gray-500 mt-8">
            By continuing, you agree to BookMind's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-900 to-purple-900 flex-col items-center justify-center text-white p-10">
        <div className="max-w-md">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Unlock deeper insights from your documents
          </h2>
          <p className="text-lg mb-10 text-gray-200">
            Upload PDF and TXT files, experiment with different RAG strategies, and interact with your content through a powerful AI chat interface.
          </p>
          
          <div className="space-y-6">
            <FeatureItem 
              icon={<BookOpen className="h-5 w-5" />}
              title="Multiple Document Formats"
              description="Upload PDFs, TXT files or import directly from Google Drive."
            />
            
            <FeatureItem 
              icon={<Layers className="h-5 w-5" />}
              title="Flexible Chunking Options"
              description="Experiment with overlapping, semantic, or size-based chunking strategies."
            />
            
            <FeatureItem 
              icon={<Brain className="h-5 w-5" />}
              title="Knowledge Graph Generation"
              description="Create and visualize knowledge graphs from your documents."
            />
            
            <FeatureItem 
              icon={<GitCompare className="h-5 w-5" />}
              title="RAG Strategy Comparison"
              description="Compare traditional vs. graph-based RAG approaches."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start">
      <div className="rounded-full bg-white/10 p-2 mr-4 border border-white/20">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-300">{description}</p>
      </div>
    </div>
  );
}