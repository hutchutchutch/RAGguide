import React from 'react';
import Marquee from 'react-fast-marquee';

interface SuggestionMarqueeProps {
  onSuggestionClick: (suggestion: string) => void;
}

export default function SuggestionMarquee({ onSuggestionClick }: SuggestionMarqueeProps) {
  // Define sample suggestions for the marquee
  const suggestions = [
    "What are the main themes in this book?",
    "Summarize the plot of this book",
    "Who are the main characters?",
    "What is the historical context of this story?",
    "Explain the concept of RAG in context of this book",
    "Can you extract key relationships between characters?",
    "What figurative language is used in chapter 3?",
    "How does the author develop the protagonist?",
    "Compare the writing style to similar works",
    "Find all mentions of specific locations",
    "Analyze the book's narrative structure",
    "What metaphors are used throughout the text?",
    "When was this book published?",
    "Who influenced the author's writing style?",
    "What are the critical reviews of this book?",
  ];

  return (
    <div className="mb-6 overflow-hidden">
      <div className="relative max-w-4xl mx-auto py-2 bg-[#1A1A1A]">
        {/* Left fade effect */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, #1A1A1A 10%, rgba(26, 26, 26, 0.8) 50%, rgba(26, 26, 26, 0) 100%)',
          }}
        ></div>
        
        {/* Right fade effect */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, #1A1A1A 10%, rgba(26, 26, 26, 0.8) 50%, rgba(26, 26, 26, 0) 100%)',
          }}
        ></div>
        
        <Marquee
          gradient={false}
          speed={35}
          pauseOnHover={true}
          className="py-3"
        >
          <div className="flex space-x-6 px-8">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="bg-[#303030] hover:bg-[#404040] text-gray-300 hover:text-white px-4 py-2 rounded-md text-sm transition-colors duration-200 whitespace-nowrap shadow-md animated-border"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </Marquee>
      </div>
    </div>
  );
}