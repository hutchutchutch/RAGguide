import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Node, Edge, InsertNode, InsertEdge } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useBookContext } from "@/contexts/book-context";
import { useToast } from "@/hooks/use-toast";

export function useKnowledgeGraph() {
  const { selectedBook } = useBookContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get nodes for the current book
  const {
    data: nodes,
    isLoading: isNodesLoading,
    error: nodesError,
  } = useQuery<Node[]>({
    queryKey: [`/api/books/${selectedBook?.id}/nodes`],
    enabled: !!selectedBook,
  });

  // Get edges for the current book
  const {
    data: edges,
    isLoading: isEdgesLoading,
    error: edgesError,
  } = useQuery<Edge[]>({
    queryKey: [`/api/books/${selectedBook?.id}/edges`],
    enabled: !!selectedBook,
  });

  // Create a new node
  const createNode = useMutation({
    mutationFn: async (node: InsertNode) => {
      return apiRequest("POST", "/api/nodes", node) as Promise<Node>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/books/${selectedBook?.id}/nodes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${selectedBook?.id}/knowledge-graph`] });
      toast({
        title: "Success",
        description: "Node created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create node",
        variant: "destructive",
      });
    },
  });

  // Create a new edge
  const createEdge = useMutation({
    mutationFn: async (edge: InsertEdge) => {
      return apiRequest("POST", "/api/edges", edge) as Promise<Edge>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/books/${selectedBook?.id}/edges`] });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${selectedBook?.id}/knowledge-graph`] });
      toast({
        title: "Success",
        description: "Edge created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create edge",
        variant: "destructive",
      });
    },
  });

  // Get full knowledge graph data
  const {
    data: knowledgeGraph,
    isLoading: isKnowledgeGraphLoading,
    error: knowledgeGraphError,
  } = useQuery<{ nodes: Node[]; edges: Edge[] }>({
    queryKey: [`/api/books/${selectedBook?.id}/knowledge-graph`],
    enabled: !!selectedBook,
  });

  return {
    nodes,
    edges,
    isLoading: isNodesLoading || isEdgesLoading,
    error: nodesError || edgesError,
    createNode: createNode.mutate,
    createEdge: createEdge.mutate,
    knowledgeGraph,
    isKnowledgeGraphLoading,
  };
}
