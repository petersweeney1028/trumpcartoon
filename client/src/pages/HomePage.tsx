import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RemixForm from "@/components/RemixForm";
import RotGrid from "@/components/RotGrid";
import { Remix } from "@shared/schema";

const HomePage = () => {
  const [, setLocation] = useLocation();
  
  // Fetch popular rots
  const { data: popularRots, isLoading } = useQuery({
    queryKey: ["/api/remixes/popular"],
    staleTime: 60000, // 1 minute
  });
  
  const handleRotSuccess = (rotId: string) => {
    // Navigate to the newly created rot
    setLocation(`/scene/${rotId}`);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Rot Form Section */}
      <RemixForm onSubmitSuccess={handleRotSuccess} />
      
      {/* Popular Rots Section */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      ) : popularRots && popularRots.length > 0 ? (
        <RotGrid remixes={popularRots as Remix[]} />
      ) : (
        <div className="text-center py-8">
          <h2 className="text-2xl font-heading font-bold text-dark mb-4">
            No rots found
          </h2>
          <p className="text-muted-foreground">
            Be the first to create a rot!
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
