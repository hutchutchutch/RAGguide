import { useState, useEffect } from "react";
import { useRagPipeline } from "@/hooks/use-rag-pipeline";
import { useBookContext } from "@/contexts/book-context";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Entity {
  name: string;
  type: 'person' | 'place' | 'object' | 'concept';
}

export default function ChunkLabeler() {
  const { currentChunk } = useRagPipeline();
  const { selectedBook } = useBookContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [newEntity, setNewEntity] = useState("");
  const [entityType, setEntityType] = useState<Entity['type']>("person");
  const [keyConcept, setKeyConcept] = useState("");

  // Simulate entity extraction when chunk changes
  useEffect(() => {
    if (currentChunk) {
      // This would normally be done with NLP, here we just reset for demo
      setEntities([]);
      setKeyConcept("");
    }
  }, [currentChunk]);

  const addEntity = () => {
    if (!newEntity.trim()) return;
    
    const entity: Entity = {
      name: newEntity.trim(),
      type: entityType,
    };
    
    setEntities([...entities, entity]);
    setNewEntity("");
  };

  const removeEntity = (index: number) => {
    const updatedEntities = [...entities];
    updatedEntities.splice(index, 1);
    setEntities(updatedEntities);
  };

  const handleCreateNodeFromChunk = async () => {
    if (!selectedBook || !currentChunk) {
      toast({
        title: "Error",
        description: "No book or chunk selected",
        variant: "destructive",
      });
      return;
    }

    if (entities.length === 0 && !keyConcept) {
      toast({
        title: "Warning",
        description: "Please add at least one entity or key concept",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create nodes for entities if they exist
      for (const entity of entities) {
        const nodeData = {
          book_id: selectedBook.id,
          label: entity.name,
          type: entity.type,
          description: `Entity extracted from chunk ${currentChunk.chunk_index + 1}`,
        };
        
        const node = await apiRequest("POST", "/api/nodes", nodeData);
        
        // Create node-chunk association
        if (node && currentChunk.id) {
          await apiRequest("POST", "/api/node-chunks", {
            node_id: node.id,
            chunk_id: currentChunk.id,
          });
        }
      }
      
      // Create node for key concept if it exists
      if (keyConcept) {
        const conceptNodeData = {
          book_id: selectedBook.id,
          label: keyConcept,
          type: "concept",
          description: `Key concept from chunk ${currentChunk.chunk_index + 1}`,
        };
        
        const conceptNode = await apiRequest("POST", "/api/nodes", conceptNodeData);
        
        // Create node-chunk association
        if (conceptNode && currentChunk.id) {
          await apiRequest("POST", "/api/node-chunks", {
            node_id: conceptNode.id,
            chunk_id: currentChunk.id,
          });
        }
      }
      
      toast({
        title: "Success",
        description: "Nodes created from chunk",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/books/${selectedBook.id}/nodes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${selectedBook.id}/knowledge-graph`] });
      
      // Reset form
      setEntities([]);
      setKeyConcept("");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create nodes from chunk",
        variant: "destructive",
      });
    }
  };

  // Helper function to get badge color based on entity type
  const getEntityColor = (type: Entity['type']) => {
    switch (type) {
      case 'person':
        return 'bg-primary-100 text-primary-700';
      case 'place':
        return 'bg-secondary-100 text-secondary-700';
      case 'object':
        return 'bg-green-100 text-green-700';
      case 'concept':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <>
      <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-3">Chunk Labeler</h3>
      
      {currentChunk ? (
        <div className="bg-white border border-neutral-200 rounded-md mb-4">
          <div className="border-b border-neutral-200 px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">Current Chunk</span>
            <span className="text-xs text-neutral-500">
              {currentChunk.page_number ? `Page ${currentChunk.page_number}` : "Page unknown"}
            </span>
          </div>
          
          <div className="p-3 bg-neutral-50 text-sm max-h-[200px] overflow-auto">
            <div className="code-block text-neutral-800 whitespace-pre-wrap font-mono text-xs">
              {currentChunk.text}
            </div>
          </div>
          
          <div className="p-3">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Entity Recognition</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {entities.map((entity, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className={`inline-flex items-center px-2 py-1 rounded-md ${getEntityColor(entity.type)}`}
                  >
                    {entity.name}
                    <button 
                      className="ml-1 text-neutral-500 hover:text-neutral-700" 
                      title="Remove entity"
                      onClick={() => removeEntity(index)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                
                <div className="flex gap-1">
                  <select 
                    className="px-2 py-1 rounded-md border border-neutral-300 text-xs"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as Entity['type'])}
                  >
                    <option value="person">Person</option>
                    <option value="place">Place</option>
                    <option value="object">Object</option>
                    <option value="concept">Concept</option>
                  </select>
                  <Input
                    placeholder="Add entity..."
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8"
                    onClick={addEntity}
                    disabled={!newEntity.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Key Concepts</label>
              <Input 
                placeholder="Add key concept..." 
                value={keyConcept}
                onChange={(e) => setKeyConcept(e.target.value)}
                className="text-sm"
              />
            </div>
            
            <Button 
              className="w-full bg-secondary-500 hover:bg-secondary-600 text-white"
              onClick={handleCreateNodeFromChunk}
              disabled={!selectedBook || !currentChunk || (entities.length === 0 && !keyConcept)}
            >
              Create Node from Chunk
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-neutral-500 text-sm">
              No chunk selected. Please process a book and select a chunk to label.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
