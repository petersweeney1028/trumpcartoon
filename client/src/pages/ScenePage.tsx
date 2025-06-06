import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import VideoPlayer from "@/components/VideoPlayer";
import SequencePlayer from "@/components/SequencePlayer";
import ContinuousPlayer from "@/components/ContinuousPlayer";
import SimplePlayer from "@/components/SimplePlayer";
import SequenceVideoPlayer from "@/components/SequenceVideoPlayer";
import DirectSequencePlayer from "@/components/DirectSequencePlayer";
import SimpleSequencePlayer from "@/components/SimpleSequencePlayer";
import FixedSequencePlayer from "@/components/FixedSequencePlayer";
import BasicSequencePlayer from "@/components/BasicSequencePlayer";
import UltraSimplePlayer from "@/components/UltraSimplePlayer";
import SuperSimplePlayer from "@/components/SuperSimplePlayer";
import MinimalPlayer from "@/components/MinimalPlayer";
import SuperBasicPlayer from "@/components/SuperBasicPlayer";
import SimpleVideoPlayer from "@/components/SimpleVideoPlayer";
import DebugPlayer from "@/components/DebugPlayer";
import SharePanel from "@/components/SharePanel";
import RemixDetails from "@/components/RemixDetails";
import ScriptDisplay from "@/components/ScriptDisplay";
import RotGrid from "@/components/RotGrid";
import { apiRequest } from "@/lib/queryClient";
import { Remix, ClipInfo } from "@shared/schema";

const ScenePage = () => {
  const [, params] = useRoute("/scene/:id");
  const remixId = params?.id || "";
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCaption, setCurrentCaption] = useState("");
  
  // Get remix details
  const { data: remix, isLoading } = useQuery<Remix>({
    queryKey: [`/api/remixes/${remixId}`],
  });
  
  // Get related remixes
  const { data: relatedRemixes } = useQuery<Remix[]>({
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
  
  // Debug log for remix data
  useEffect(() => {
    if (remix) {
      console.log('Remix from ScenePage:', remix);
    }
  }, [remix]);
  
  // We no longer need caption timing as SequencePlayer handles that internally
  const handlePlayPauseToggle = (playing: boolean) => {
    setIsPlaying(playing);
  };
  
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
            {remix.clipInfo ? (
              <SimpleVideoPlayer
                clipInfo={remix.clipInfo}
                script={remix.script}
                onPlayPauseToggle={handlePlayPauseToggle}
              />
            ) : (
              <VideoPlayer
                videoUrl={remix.videoUrl}
                currentCaption={currentCaption}
                isPlaying={isPlaying}
                onPlayPauseToggle={setIsPlaying}
              />
            )}
            <SharePanel remixId={remix.id.toString()} />
          </div>
          
          {/* Right Column: Rot Details */}
          <div className="lg:w-5/12">
            <RemixDetails remix={remix} />
            <ScriptDisplay script={remix.script} />
          </div>
        </div>
      </div>
      
      {/* More Rots Section */}
      {relatedRemixes && relatedRemixes.length > 0 && (
        <RotGrid
          remixes={relatedRemixes}
          title="Similar Rots"
        />
      )}
    </div>
  );
};

export default ScenePage;
