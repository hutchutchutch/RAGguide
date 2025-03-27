import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBookContext } from "@/contexts/book-context";
import { useKnowledgeGraph } from "@/hooks/use-knowledge-graph";
import { insertEdgeSchema } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = insertEdgeSchema.extend({});

type FormValues = z.infer<typeof formSchema>;

interface EdgeCreatorProps {
  onClose: () => void;
}

export default function EdgeCreator({ onClose }: EdgeCreatorProps) {
  const { selectedBook } = useBookContext();
  const { nodes } = useKnowledgeGraph();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      source_node_id: "",
      target_node_id: "",
      label: "",
      explanation: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!selectedBook) {
      toast({
        title: "Error",
        description: "No book selected",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the edge
      await apiRequest("POST", "/api/edges", values);
      
      // Get the source and target nodes for toast message
      const sourceNode = nodes?.find(n => n.id === values.source_node_id);
      const targetNode = nodes?.find(n => n.id === values.target_node_id);
      
      toast({
        title: "Success",
        description: `Relationship created: ${sourceNode?.label || 'Source'} ${values.label} ${targetNode?.label || 'Target'}`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/books/${selectedBook.id}/edges`] });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${selectedBook.id}/knowledge-graph`] });
      
      // Close the form
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create relationship",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wider text-neutral-500">Link Nodes</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="source_node_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Node</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source node" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {nodes?.map(node => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label} ({node.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'is friends with', 'contains', 'works at'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="target_node_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Node</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target node" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {nodes?.map(node => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label} ({node.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain the relationship..." 
                      className="resize-none" 
                      rows={2} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-2 pt-2">
              <Button
                type="submit"
                className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white"
                disabled={!form.formState.isValid}
              >
                Create Relationship
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
