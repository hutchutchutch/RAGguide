import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBookContext } from "@/contexts/book-context";
import { useKnowledgeGraph } from "@/hooks/use-knowledge-graph";
import { insertNodeSchema } from "@shared/schema";
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

interface NodeProperty {
  key: string;
  value: string;
}

const formSchema = insertNodeSchema.extend({
  properties: z.array(
    z.object({
      key: z.string().min(1, "Key is required"),
      value: z.string().min(1, "Value is required"),
    })
  ).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NodeCreatorProps {
  onClose: () => void;
}

export default function NodeCreator({ onClose }: NodeCreatorProps) {
  const { selectedBook } = useBookContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [properties, setProperties] = useState<NodeProperty[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      book_id: selectedBook?.id || "",
      label: "",
      type: "person",
      description: "",
      properties: [],
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
      // Set book_id to ensure it's included
      values.book_id = selectedBook.id;
      
      // Create the node
      await apiRequest("POST", "/api/nodes", values);
      
      toast({
        title: "Success",
        description: `Node "${values.label}" created successfully`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/books/${selectedBook.id}/nodes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${selectedBook.id}/knowledge-graph`] });
      
      // Close the form
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create node",
        variant: "destructive",
      });
    }
  };

  const addProperty = () => {
    setProperties([...properties, { key: "", value: "" }]);
  };

  const updateProperty = (index: number, field: "key" | "value", value: string) => {
    const updatedProperties = [...properties];
    updatedProperties[index][field] = value;
    setProperties(updatedProperties);
    
    // Update form values
    form.setValue("properties", updatedProperties);
  };

  const removeProperty = (index: number) => {
    const updatedProperties = properties.filter((_, i) => i !== index);
    setProperties(updatedProperties);
    
    // Update form values
    form.setValue("properties", updatedProperties);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wider text-neutral-500">Node Creator</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Node Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a node type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="person">Person</SelectItem>
                      <SelectItem value="place">Place</SelectItem>
                      <SelectItem value="object">Object</SelectItem>
                      <SelectItem value="concept">Concept</SelectItem>
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
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Node label..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Short description..." 
                      className="resize-none" 
                      rows={2} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel className="block mb-2">Properties</FormLabel>
              {properties.map((property, index) => (
                <div key={index} className="flex mb-2">
                  <Input
                    placeholder="Key"
                    value={property.key}
                    onChange={(e) => updateProperty(index, "key", e.target.value)}
                    className="flex-1 rounded-r-none"
                  />
                  <Input
                    placeholder="Value"
                    value={property.value}
                    onChange={(e) => updateProperty(index, "value", e.target.value)}
                    className="flex-1 rounded-l-none border-l-0"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => removeProperty(index)}
                    className="ml-1 px-2 text-neutral-500 hover:text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addProperty}
                className="w-full border border-dashed border-neutral-300 text-neutral-500 py-1"
              >
                + Add Property
              </Button>
            </div>
            
            <div className="flex space-x-2 pt-2">
              <Button
                type="submit"
                className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white"
              >
                Create Node
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
