import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsIcon, Star, StarHalf, StarOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { EmbeddingSettings } from '@shared/schema';

interface SettingsCardProps {
  settings: EmbeddingSettings;
  onSelect: (settings: EmbeddingSettings) => void;
  onRate: (id: string, rating: number) => void;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ settings, onSelect, onRate }) => {
  const displayName = settings.name || `Settings ${settings.id.substring(0, 5)}`;
  
  // Render stars based on rating
  const renderStars = () => {
    const stars = [];
    const rating = settings.rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(
          <Star 
            key={i} 
            className="h-5 w-5 text-yellow-500 cursor-pointer" 
            onClick={() => onRate(settings.id, i)}
            data-testid={`star-${i}`}
            fill="currentColor"
          />
        );
      } else {
        stars.push(
          <StarOff 
            key={i} 
            className="h-5 w-5 text-gray-400 cursor-pointer" 
            onClick={() => onRate(settings.id, i)}
            data-testid={`star-${i}`}
          />
        );
      }
    }
    
    return stars;
  };
  
  return (
    <Card className="min-w-[250px] max-w-[250px] bg-card/60 backdrop-blur-sm border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{displayName}</CardTitle>
        <CardDescription className="text-xs">
          {settings.description || `Created ${new Date(settings.created_at).toLocaleDateString()}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-xs pb-2">
        <div className="flex justify-between mb-1">
          <span>Chunk size:</span>
          <span className="font-medium">{settings.chunk_size}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Overlap:</span>
          <span className="font-medium">{settings.overlap}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Cleaner:</span>
          <span className="font-medium">{settings.cleaner}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Strategy:</span>
          <span className="font-medium">{settings.strategy}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Model:</span>
          <span className="font-medium">{settings.model}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <div className="flex justify-center w-full">
          {renderStars()}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => onSelect(settings)}
        >
          Select
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function SettingsCarousel() {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const queryClient = useQueryClient();
  
  // Fetch all embedding settings
  const { data: settings = [], isLoading, error } = useQuery({
    queryKey: ['/api/embedding-settings'],
    select: (data: EmbeddingSettings[]) => {
      // Sort by rating (descending) then by creation date (newest first)
      return [...data].sort((a, b) => {
        if (b.rating !== a.rating) {
          return (b.rating || 0) - (a.rating || 0);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
  });
  
  // Mutation for rating a setting
  const ratingMutation = useMutation({
    mutationFn: async ({ id, rating }: { id: string, rating: number }) => {
      return apiRequest(
        'POST',
        `/api/embedding-settings/${id}/rate`,
        { rating }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/embedding-settings'] });
    }
  });
  
  const handleSelectSettings = (selectedSettings: EmbeddingSettings) => {
    // Logic to apply these settings to the current workflow
    console.log('Selected settings:', selectedSettings);
    // You would typically dispatch an action or call a handler passed from a parent component
  };
  
  const handleRateSettings = (id: string, rating: number) => {
    ratingMutation.mutate({ id, rating });
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(settings.length / itemsPerPage);
  const paginatedSettings = settings.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  
  const nextPage = () => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  };
  
  const prevPage = () => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  };
  
  if (isLoading) {
    return (
      <div className="w-full p-4 flex justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 rounded-full bg-primary/20"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-2 rounded bg-primary/20"></div>
            <div className="h-2 rounded bg-primary/20"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full p-4 text-center text-destructive">
        Error loading settings
      </div>
    );
  }
  
  if (settings.length === 0) {
    return (
      <div className="w-full p-4 flex justify-center">
        <Card className="w-full bg-card/60 backdrop-blur-sm">
          <CardContent className="pt-6 pb-4 text-center">
            <SettingsIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">No settings configurations yet.</p>
            <p className="text-xs text-muted-foreground">
              After creating vector stores, they'll appear here for rating and reuse.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="w-full p-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Ranked Settings</h3>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={prevPage}
            disabled={settings.length <= itemsPerPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs">
            {currentPage + 1}/{totalPages}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={nextPage}
            disabled={settings.length <= itemsPerPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 max-w-full scrollbar-hide">
        {paginatedSettings.map(setting => (
          <SettingsCard 
            key={setting.id} 
            settings={setting} 
            onSelect={handleSelectSettings}
            onRate={handleRateSettings}
          />
        ))}
      </div>
    </div>
  );
}