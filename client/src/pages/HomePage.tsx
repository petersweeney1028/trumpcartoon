import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RemixForm from "@/components/RemixForm";
import RemixGrid from "@/components/RemixGrid";
import { Remix } from "@shared/schema";

const HomePage = () => {
  const [, setLocation] = useLocation();
  
  // Fetch popular remixes
  const { data: popularRemixes, isLoading } = useQuery({
    queryKey: ["/api/remixes/popular"],
    staleTime: 60000, // 1 minute
  });
  
  const handleRemixSuccess = (remixId: string) => {
    // Navigate to the newly created remix
    setLocation(`/scene/${remixId}`);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Remix Form Section */}
      <RemixForm onSubmitSuccess={handleRemixSuccess} />
      
      {/* Popular Remixes Section */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      ) : popularRemixes && popularRemixes.length > 0 ? (
        <RemixGrid remixes={popularRemixes as Remix[]} />
      ) : (
        <div className="text-center py-8">
          <h2 className="text-2xl font-heading font-bold text-dark mb-4">
            No remixes found
          </h2>
          <p className="text-muted-foreground">
            Be the first to create a remix!
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
