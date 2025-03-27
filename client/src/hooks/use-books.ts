import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book, InsertBook } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useBooks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all books
  const { data: books, isLoading, error } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Upload a new book
  const uploadBook = useMutation({
    mutationFn: async (data: { title: string; file: File }) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("file", data.file);

      return apiRequest("POST", "/api/books", formData) as Promise<Book>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Success",
        description: "Book uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload book",
        variant: "destructive",
      });
    },
  });

  return {
    books,
    isLoading,
    error,
    uploadBook: uploadBook.mutate,
    uploadBookStatus: uploadBook.status,
  };
}
