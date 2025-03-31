"use client";

import { cn } from "@/lib/utils";
import { BookOpen, BookText, Brain, Database } from "lucide-react";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <BookOpen className="size-4 text-indigo-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-indigo-500",
  titleClassName = "text-indigo-500",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 border-indigo-900/40 bg-gray-900/80 backdrop-blur-sm px-4 py-3 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-black after:to-transparent after:content-[''] hover:border-indigo-500/50 hover:bg-gray-800/90 [&>*]:flex [&>*]:items-center [&>*]:gap-2 shadow-lg",
        className
      )}
    >
      <div>
        <span className={cn("relative inline-block rounded-full bg-indigo-950 p-1", iconClassName)}>
          {icon}
        </span>
        <p className={cn("text-lg font-medium", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-lg text-gray-300">{description}</p>
      <p className="text-gray-500">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards = [
    {
      icon: <BookText className="size-4 text-indigo-300" />,
      title: "PDF Processing",
      description: "Advanced chunking strategies",
      date: "Text-based embeddings",
      iconClassName: "bg-indigo-950",
      titleClassName: "text-indigo-400",
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-black/50 grayscale-[30%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Brain className="size-4 text-purple-300" />,
      title: "Knowledge Graph",
      description: "Semantic connections",
      date: "Concept visualization",
      iconClassName: "bg-purple-950",
      titleClassName: "text-purple-400",
      className: "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-black/50 grayscale-[30%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Database className="size-4 text-blue-300" />,
      title: "Vector Store",
      description: "Optimized retrieval",
      date: "pgvector powered",
      iconClassName: "bg-blue-950",
      titleClassName: "text-blue-400",
      className: "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-black/50 grayscale-[30%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}