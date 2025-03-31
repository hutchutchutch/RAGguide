import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import SignInModal from "@/components/sign-in-modal";
import { ArrowRight, Book, Brain, Database, GitCompare, MessageSquare } from "lucide-react";

export default function Landing() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Navigation */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-purple-500" />
          <span className="font-bold text-xl">BookRAG</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
          <a href="#how-it-works" className="text-gray-300 hover:text-white transition">How it works</a>
          <Button 
            onClick={() => setIsSignInOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Sign In
          </Button>
        </nav>
        <Button 
          onClick={() => setIsSignInOpen(true)}
          className="md:hidden bg-purple-600 hover:bg-purple-700"
        >
          Sign In
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">
          Advanced Document Analysis with RAG
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mb-10">
          Upload your PDFs and TXT files, experiment with different chunking strategies, and explore 
          the power of Retrieval-Augmented Generation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => setIsSignInOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6"
            size="lg"
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-lg px-8 py-6"
            size="lg"
          >
            Learn More
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#1a1a1a] py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">
            Powerful RAG <span className="text-purple-500">Features</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Book className="h-10 w-10 text-purple-500" />}
              title="Flexible Document Upload"
              description="Upload PDFs and TXT files from your device or import directly from Google Drive."
            />
            <FeatureCard 
              icon={<Database className="h-10 w-10 text-purple-500" />}
              title="Custom Chunking Options"
              description="Experiment with different chunking strategies to optimize retrieval results."
            />
            <FeatureCard 
              icon={<Brain className="h-10 w-10 text-purple-500" />}
              title="Knowledge Graph Generation"
              description="Create and visualize knowledge graphs from your document content."
            />
            <FeatureCard 
              icon={<GitCompare className="h-10 w-10 text-purple-500" />}
              title="RAG Strategy Comparison"
              description="Compare traditional RAG vs GraphRAG approaches to find the best solution."
            />
            <FeatureCard 
              icon={<MessageSquare className="h-10 w-10 text-purple-500" />}
              title="Interactive Chat Interface"
              description="Query your documents through a natural conversation interface."
            />
            <FeatureCard 
              icon={<Database className="h-10 w-10 text-purple-500" />}
              title="Vector Store Insights"
              description="Rate and analyze the quality of different vector store configurations."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">
            How It <span className="text-purple-500">Works</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard 
              number={1}
              title="Upload Your Document"
              description="Upload a PDF or TXT file from your device or import from Google Drive."
            />
            <StepCard 
              number={2}
              title="Configure Chunking"
              description="Choose from various chunking strategies and embedding options."
            />
            <StepCard 
              number={3}
              title="Explore and Compare"
              description="Use the chat interface to query your documents and compare different RAG approaches."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-700 to-purple-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Sign in now to begin exploring your documents with advanced RAG techniques.
          </p>
          <Button 
            onClick={() => setIsSignInOpen(true)}
            className="bg-white text-purple-900 hover:bg-gray-100 text-lg px-8 py-6"
            size="lg"
          >
            Sign In Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6 text-purple-500" />
              <span className="font-bold text-lg">BookRAG</span>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} BookRAG. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
      />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[#252525] p-6 rounded-lg hover:shadow-lg hover:shadow-purple-900/10 transition-all border border-gray-800">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center mb-4 text-2xl font-bold">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}