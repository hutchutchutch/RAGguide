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
    <div className="bg-[#252525] border-b border-gray-700 py-2 mb-4 overflow-hidden">
      <Marquee
        gradient={true}
        gradientColor="#252525"
        gradientWidth={50}
        speed={35}
        pauseOnHover={true}
      >
        <div className="flex space-x-4 px-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="bg-[#303030] hover:bg-[#404040] text-gray-300 hover:text-white px-3 py-1.5 rounded-md text-sm transition-colors duration-200 whitespace-nowrap animated-border"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </Marquee>
    </div>
  );
}