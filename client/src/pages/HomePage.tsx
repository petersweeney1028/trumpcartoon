import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RotForm from "@/components/RotForm";
import RotGrid from "@/components/RotGrid";
import { Remix } from "@shared/schema";
import videoPlaceholderImg from "@assets/image_1746026572673.png";

const HomePage = () => {
  const [, setLocation] = useLocation();
  
  // Fetch popular rots
  const { data: popularRots = [], isLoading } = useQuery<Remix[]>({
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
      <div className="mb-16 mt-4">
        <div className="flex flex-col md:flex-row items-start justify-between">
          <div className="mb-6 md:mb-0 md:max-w-xl">
            <h1 className="text-4xl md:text-5xl font-heading tracking-tight mb-4 text-dark leading-none">
              <span className="flex items-center">
                <span className="bg-primary text-white px-2 py-1 mr-1">ROT</span>
                .CLUB
              </span>
            </h1>
            
            {/* Cartoon Placeholder */}
            <div className="bg-dark rounded-md overflow-hidden mb-6 shadow-lg">
              <img 
                src="/cartoon-placeholder.png" 
                alt="Political cartoon" 
                className="w-full object-cover"
              />
            </div>
          </div>
          
          <div className="w-full md:max-w-xl bg-card rounded-md p-6 shadow-sm">
            <h2 className="text-2xl font-heading text-dark mb-4">
              Generate a Rot
            </h2>
            
            <div className="mb-6">
              <label className="block text-dark font-medium mb-2">What are they arguing about?</label>
              <input 
                type="text"
                placeholder="e.g., who gets the last Pop-Tart"
                className="w-full p-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Trump */}
              <div className="bg-background rounded-md border border-border overflow-hidden">
                <div className="p-3 bg-primary flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary font-bold">T</div>
                  <h3 className="font-heading text-white">TRUMP</h3>
                </div>
                <div className="p-3">
                  <label className="block text-dark text-sm font-medium mb-1">What does Trump care about?</label>
                  <input 
                    type="text"
                    placeholder="e.g., winning"
                    className="w-full p-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              {/* Zelensky */}
              <div className="bg-background rounded-md border border-border overflow-hidden">
                <div className="p-3 bg-blue-500 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-500 font-bold">Z</div>
                  <h3 className="font-heading text-white">ZELENSKY</h3>
                </div>
                <div className="p-3">
                  <label className="block text-dark text-sm font-medium mb-1">What does Zelensky care about?</label>
                  <input 
                    type="text"
                    placeholder="e.g., fairness"
                    className="w-full p-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              {/* JD Vance */}
              <div className="bg-background rounded-md border border-border overflow-hidden">
                <div className="p-3 bg-orange-500 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-500 font-bold">V</div>
                  <h3 className="font-heading text-white">JD VANCE</h3>
                </div>
                <div className="p-3">
                  <label className="block text-dark text-sm font-medium mb-1">What does JD Vance care about?</label>
                  <input 
                    type="text"
                    placeholder="e.g., Ohio values"
                    className="w-full p-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            
            <button 
              className="w-full bg-primary text-white font-bold py-3 px-4 rounded hover:bg-primary/90 transition-colors text-lg"
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
      <div className="bg-card p-5 rounded-md shadow-sm mb-8">
        <div className="flex items-center">
          <span className="text-xl font-heading mr-2">Total Rots Generated:</span>
          <span className="text-2xl font-bold">0</span>
        </div>
      </div>

      {/* Video Preview Section */}
      <div className="mb-12 bg-card p-6 rounded-md shadow-sm">
        <h2 className="text-3xl font-heading mb-6">Preview a Rot</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="bg-dark rounded-md overflow-hidden relative aspect-video shadow-lg">
              <img 
                src={videoPlaceholderImg} 
                alt="Video preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-16 h-16 rounded-full bg-primary/80 hover:bg-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-heading mb-3">Example Rot: Breakfast Debate</h3>
            <div className="space-y-4">
              <div className="p-4 bg-background rounded-md border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">T</div>
                  <p className="font-bold">TRUMP:</p>
                </div>
                <p className="text-dark/80">"Listen, these Pop-Tarts, they're incredible. The best breakfast. Everyone says so. I deserve them all!"</p>
              </div>

              <div className="p-4 bg-background rounded-md border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">Z</div>
                  <p className="font-bold">ZELENSKY:</p>
                </div>
                <p className="text-dark/80">"We must share them equally. No one person can take all the resources."</p>
              </div>

              <div className="p-4 bg-background rounded-md border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">V</div>
                  <p className="font-bold">VANCE:</p>
                </div>
                <p className="text-dark/80">"In Ohio, we value hard work. Whoever woke up earliest should get the Pop-Tarts."</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Popular Rots Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-heading mb-6">Recently Generated</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : popularRots.length > 0 ? (
          <RotGrid remixes={popularRots} />
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
