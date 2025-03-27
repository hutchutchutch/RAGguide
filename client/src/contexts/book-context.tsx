import React, { createContext, useContext, useState, ReactNode } from "react";
import { Book } from "@shared/schema";

interface BookContextType {
  selectedBook: Book | null;
  setSelectedBook: (book: Book) => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

interface BookProviderProps {
  children: ReactNode;
}

export function BookProvider({ children }: BookProviderProps) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  return (
    <BookContext.Provider
      value={{
        selectedBook,
        setSelectedBook,
      }}
    >
      {children}
    </BookContext.Provider>
  );
}

export function useBookContext() {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error("useBookContext must be used within a BookProvider");
  }
  return context;
}
