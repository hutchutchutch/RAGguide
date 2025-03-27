import { useState } from "react";
import { useBookContext } from "@/contexts/book-context";
import { useKnowledgeGraph } from "@/hooks/use-knowledge-graph";
import { useRagPipeline } from "@/hooks/use-rag-pipeline";
import GraphVisualization from "@/components/graph-visualization";
import NodeCreator from "@/components/node-creator";
import EdgeCreator from "@/components/edge-creator";
import ChunkLabeler from "@/components/chunk-labeler";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface NodeType {
  type: 'person' | 'place' | 'object' | 'concept';
  color: string;
  textColor: string;
}

export default function KnowledgeGraphBuilder() {
  const { selectedBook } = useBookContext();
  const { nodes, edges, isLoading } = useKnowledgeGraph();
  const { currentChunk } = useRagPipeline();
  const { toast } = useToast();
  const [showNodeCreator, setShowNodeCreator] = useState(false);
  const [showEdgeCreator, setShowEdgeCreator] = useState(false);

  const nodeTypes: NodeType[] = [
    { type: 'person', color: 'bg-primary-100', textColor: 'text-primary-700' },
    { type: 'place', color: 'bg-secondary-100', textColor: 'text-secondary-700' },
    { type: 'object', color: 'bg-green-100', textColor: 'text-green-700' },
    { type: 'concept', color: 'bg-orange-100', textColor: 'text-orange-700' },
  ];

  const handleSuggestRelatedChunks = () => {
    toast({
      title: "Suggest Related Chunks",
      description: "This feature will analyze the current chunk and suggest related content",
    });
  };

  return (
    <>
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold mb-3">Knowledge Graph Builder</h2>
        
        {/* Graph Visualization */}
        <div id="graph-container" className="bg-neutral-50 border border-neutral-200 rounded-md p-3 mb-4 min-h-[250px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-[250px]">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          ) : nodes && nodes.length > 0 ? (
            <GraphVisualization nodes={nodes} edges={edges} />
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-neutral-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <path d="M12 17h.01"></path>
              </svg>
              <p className="text-sm">No knowledge graph created yet</p>
              <p className="text-xs mt-1">Create nodes and edges to build your graph</p>
            </div>
          )}
          <div className="text-center text-sm text-neutral-500 mt-2">
            {nodes ? `${nodes.length} nodes, ${edges.length} relationships` : "0 nodes, 0 relationships"}
          </div>
        </div>
        
        <div className="flex space-x-2 mb-4">
          <Button 
            className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white"
            onClick={() => setShowNodeCreator(true)}
            disabled={!selectedBook}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
            Create Node
          </Button>
          <Button 
            variant="outline"
            className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            onClick={() => setShowEdgeCreator(true)}
            disabled={!nodes || nodes.length < 2}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" x2="21" y1="14" y2="3"></line>
            </svg>
            Link Nodes
          </Button>
        </div>
        
        <Button 
          variant="outline"
          className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 mb-2"
          onClick={handleSuggestRelatedChunks}
          disabled={!currentChunk}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
          </svg>
          Suggest Related Chunks
        </Button>
        
        <div className="flex items-center">
          <span className="text-sm text-neutral-500 mr-2">Node Types:</span>
          <div className="flex flex-wrap gap-1 text-xs">
            {nodeTypes.map((nodeType) => (
              <Badge key={nodeType.type} variant="outline" className={`${nodeType.color} ${nodeType.textColor}`}>
                {nodeType.type.charAt(0).toUpperCase() + nodeType.type.slice(1)}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      {/* Chunk Labeler */}
      <div className="flex-1 overflow-auto p-4">
        {showNodeCreator ? (
          <NodeCreator onClose={() => setShowNodeCreator(false)} />
        ) : showEdgeCreator ? (
          <EdgeCreator onClose={() => setShowEdgeCreator(false)} />
        ) : (
          <ChunkLabeler />
        )}
      </div>
    </>
  );
}
