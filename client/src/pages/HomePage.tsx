import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RotForm from "@/components/RotForm";
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
      {/* Hero Section */}
      <div className="mb-16 mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0 md:max-w-xl">
            <h1 className="text-6xl md:text-7xl font-heading tracking-tight mb-6 text-dark leading-none">
              WELCOME TO
              <br />
              <span className="flex items-center">
                <span className="bg-primary text-white px-2 py-1 mr-1">ROT</span>
                .CLUB
              </span>
            </h1>
            <p className="text-xl mb-6 text-dark/80">
              Have something to say? We'll make political cartoons from it.
            </p>
          </div>
          
          <div className="w-full md:w-auto bg-card rounded-md p-6 shadow-sm">
            <h2 className="text-2xl font-heading text-dark mb-4">
              Generate a Rot
            </h2>
            
            <input 
              type="text"
              placeholder="Type anything..."
              className="w-full p-3 bg-background border border-border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            
            <button 
              className="w-full bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary/90 transition-colors"
              onClick={() => setLocation('/')}
            >
              GENERATE
            </button>
            
            <div className="mt-4 text-sm text-dark/60 flex justify-between">
              <span>0 / 1 rots generated</span>
              <span>0%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Card */}
      <div className="bg-card p-5 rounded-md shadow-sm mb-12">
        <div className="flex items-center">
          <span className="text-xl font-heading mr-2">Total Rots Generated:</span>
          <span className="text-2xl font-bold">0</span>
        </div>
      </div>
      
      {/* Popular Rots Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-heading mb-6">Recently Generated</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : popularRots && popularRots.length > 0 ? (
          <RotGrid remixes={popularRots as Remix[]} />
        ) : (
          <div className="text-center py-12 bg-card rounded-md">
            <h3 className="text-xl font-heading text-dark mb-2">
              No rots generated yet
            </h3>
            <p className="text-dark/60">
              Try generating some rots above!
            </p>
          </div>
        )}
      </div>
      
      {/* Footer Banner */}
      <div className="bg-accent py-3 px-4 text-center font-bold text-dark mt-12 -mx-4 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          BUILT WITH ❤️ • BUILT WITH ❤️ • BUILT WITH ❤️ • BUILT WITH ❤️ • BUILT WITH ❤️ • BUILT WITH ❤️ • BUILT WITH ❤️
        </div>
      </div>
    </div>
  );
};

export default HomePage;
