import { useState } from "react";
import { Button } from "@/components/ui/button";
import SignInModal from "@/components/sign-in-modal";
import DeskScene from "@/components/desk-scene";
import {
  ArrowRight,
  BookText,
  LucideBookOpen,
  Brain,
  Database,
  GitCompare,
  MessageSquare,
  Sparkles,
  Search,
  Layers,
  BarChart,
} from "lucide-react";

export default function Landing() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-indigo-500" />
          <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600">
            BookRAG
          </span>
        </div>
        <Button
          onClick={() => setIsSignInOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 transition duration-300 font-medium"
          size="lg"
        >
          Get Started
        </Button>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 py-24 md:py-32 z-5">
        {/* Background Effect */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-3xl opacity-30" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl opacity-30" />
        
        {/* 3D Scene */}
        <div className="absolute inset-0 z-0 opacity-70 transform scale-110 -translate-y-4">
          <DeskScene />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-900/50 border border-indigo-700 mb-8 text-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
              Advanced document analysis with large language models
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight bg-gradient-to-br from-white via-indigo-200 to-purple-400 text-transparent bg-clip-text leading-tight">
              Unlock deeper insights from your documents
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mb-12 leading-relaxed">
              Upload PDFs and TXT files, customize chunking strategies, and
              explore different retrieval methods with BookMind's advanced RAG
              platform.
            </p>

            <Button
              onClick={() => setIsSignInOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-lg px-8 py-7 rounded-full shadow-lg shadow-indigo-900/30 transition duration-300"
              size="lg"
            >
              Start For Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="flex items-center gap-1 mt-6 text-gray-400 text-sm">
              <Sparkles className="h-4 w-4 mr-1 text-indigo-500" />
              No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative bg-gradient-to-b from-black to-indigo-950/30 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Advanced <span className="text-indigo-400">RAG</span> Features
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Powerful tools to experiment with and optimize retrieval-augmented
              generation strategies
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookText className="h-8 w-8 text-indigo-400" />}
              title="Multiple Document Formats"
              description="Upload PDFs, TXT files or import directly from Google Drive."
            />
            <FeatureCard
              icon={<Layers className="h-8 w-8 text-indigo-400" />}
              title="Flexible Chunking Options"
              description="Experiment with overlapping, semantic, or size-based chunking."
            />
            <FeatureCard
              icon={<Brain className="h-8 w-8 text-indigo-400" />}
              title="Knowledge Graph Creation"
              description="Automatically generate and visualize knowledge graphs from your content."
            />
            <FeatureCard
              icon={<GitCompare className="h-8 w-8 text-indigo-400" />}
              title="Strategy Comparison"
              description="Compare traditional vs graph-based RAG approaches side by side."
            />
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8 text-indigo-400" />}
              title="AI Chat Interface"
              description="Query your documents through a conversational AI interface."
            />
            <FeatureCard
              icon={<BarChart className="h-8 w-8 text-indigo-400" />}
              title="Performance Analytics"
              description="Rate and analyze quality metrics across different configurations."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              How It <span className="text-indigo-400">Works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Three simple steps to get started with BookMind
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-12 max-w-5xl mx-auto relative">
            {/* Line connecting steps */}
            <div className="hidden md:block absolute top-24 left-24 right-24 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 z-0"></div>

            <StepCard
              number={1}
              icon={<LucideBookOpen className="h-6 w-6" />}
              title="Upload Document"
              description="Upload PDF or TXT files from your device or import directly from Google Drive."
            />
            <StepCard
              number={2}
              icon={<Layers className="h-6 w-6" />}
              title="Configure Settings"
              description="Select your chunking strategy, embedding options, and vector store settings."
            />
            <StepCard
              number={3}
              icon={<Search className="h-6 w-6" />}
              title="Query & Analyze"
              description="Use the chat interface to ask questions and compare different RAG approaches."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full filter blur-3xl opacity-30"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
              Ready to transform your document analysis?
            </h2>
            <p className="text-xl mb-12 text-gray-300 max-w-2xl mx-auto">
              Join now and start exploring your documents with cutting-edge RAG
              techniques
            </p>
            <Button
              onClick={() => setIsSignInOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-lg px-10 py-7 rounded-full shadow-lg shadow-indigo-900/30"
              size="lg"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <Brain className="h-6 w-6 text-indigo-500" />
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600">
                BookRAG
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} BookMind Explorer. All rights
              reserved.
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-8 rounded-2xl border border-gray-800 hover:border-indigo-900/50 hover:shadow-lg hover:shadow-indigo-900/10 transition-all duration-300 group h-full">
      <div className="mb-5 p-3 bg-indigo-950/50 inline-block rounded-xl border border-indigo-900/50 group-hover:bg-indigo-900/30 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-indigo-300 transition-all duration-300">
        {title}
      </h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center relative z-10 flex-1">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center mb-6 text-2xl font-bold shadow-lg shadow-indigo-900/20">
        {number}
      </div>
      <div className="p-3 bg-indigo-900/20 rounded-xl border border-indigo-800/40 inline-flex mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-400 max-w-xs">{description}</p>
    </div>
  );
}
