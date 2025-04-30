import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import VideoPlayer from "@/components/VideoPlayer";
import SharePanel from "@/components/SharePanel";
import RemixDetails from "@/components/RemixDetails";
import ScriptDisplay from "@/components/ScriptDisplay";
import RotGrid from "@/components/RotGrid";
import { apiRequest } from "@/lib/queryClient";
import { Remix } from "@shared/schema";

const ScenePage = () => {
  const [, params] = useRoute("/scene/:id");
  const remixId = params?.id || "";
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCaption, setCurrentCaption] = useState("");
  
  // Get remix details
  const { data: remix, isLoading } = useQuery({
    queryKey: [`/api/remixes/${remixId}`],
  });
  
  // Get related remixes
  const { data: relatedRemixes } = useQuery({
    queryKey: ["/api/remixes/related", remixId],
    enabled: !!remix,
  });
  
  // Track view
  useEffect(() => {
    if (remixId) {
      const trackView = async () => {
        try {
          await apiRequest("POST", `/api/remixes/${remixId}/view`, {});
        } catch (error) {
          console.error("Failed to track view:", error);
        }
      };
      
      trackView();
    }
  }, [remixId]);
  
  // Update captions based on playback
  useEffect(() => {
    if (!isPlaying || !remix) return;
    
    let captionTimers: NodeJS.Timeout[] = [];
    
    // Set up timers for captions
    captionTimers.push(
      setTimeout(() => {
        setCurrentCaption(remix.script.trump1);
      }, 0)
    );
    
    captionTimers.push(
      setTimeout(() => {
        setCurrentCaption(remix.script.zelensky);
      }, 8000)
    );
    
    captionTimers.push(
      setTimeout(() => {
        setCurrentCaption(remix.script.trump2);
      }, 14000)
    );
    
    captionTimers.push(
      setTimeout(() => {
        setCurrentCaption(remix.script.vance);
      }, 20000)
    );
    
    return () => {
      captionTimers.forEach(timer => clearTimeout(timer));
    };
  }, [isPlaying, remix]);
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }
  
  if (!remix) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-heading font-bold mb-4">Rot not found</h1>
        <p className="mb-8">The rot you're looking for doesn't exist or may have been removed.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Video Player */}
          <div className="lg:w-7/12">
            <VideoPlayer
              videoUrl={remix.videoUrl}
              currentCaption={currentCaption}
              isPlaying={isPlaying}
              onPlayPauseToggle={setIsPlaying}
            />
            <SharePanel remixId={remix.id} />
          </div>
          
          {/* Right Column: Rot Details */}
          <div className="lg:w-5/12">
            <RemixDetails remix={remix as Remix} />
            <ScriptDisplay script={remix.script} />
          </div>
        </div>
      </div>
      
      {/* More Rots Section */}
      {relatedRemixes && relatedRemixes.length > 0 && (
        <RotGrid
          remixes={relatedRemixes as Remix[]}
          title="Similar Rots"
        />
      )}
    </div>
  );
};

export default ScenePage;
