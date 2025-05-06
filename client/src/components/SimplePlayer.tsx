import React, { useState, useRef, useEffect } from 'react';
import type { ClipInfo } from '@shared/schema';

interface SimplePlayerProps {
  clipInfo: ClipInfo;
  script: {
    trump1: string;
    zelensky: string;
    trump2: string;
    vance: string;
  };
  onPlayPauseToggle?: (isPlaying: boolean) => void;
  autoPlay?: boolean;
}

type CharacterSegment = 'trump1' | 'zelensky' | 'trump2' | 'vance';

const SimplePlayer: React.FC<SimplePlayerProps> = ({
  clipInfo,
  script,
  onPlayPauseToggle,
  autoPlay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  
  // Refs for media elements
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Simple order of segments
  const segments: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance'];
  
  // Get current video source
  const videoSrc = 
    currentSegment === 'trump1' ? `/static${clipInfo.trump1Video}` :
    currentSegment === 'zelensky' ? `/static${clipInfo.zelenskyVideo}` :
    currentSegment === 'trump2' ? `/static${clipInfo.trump2Video}` :
    `/static${clipInfo.vanceVideo}`;
  
  const audioSrc = 
    currentSegment === 'trump1' ? `/static${clipInfo.trump1Audio}` :
    currentSegment === 'zelensky' ? `/static${clipInfo.zelenskyAudio}` :
    currentSegment === 'trump2' ? `/static${clipInfo.trump2Audio}` :
    `/static${clipInfo.vanceAudio}`;
  
  // Handle video loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    setIsLoading(true);
    
    // Log loading
    console.log(`Loading segment: ${currentSegment}`);
    console.log(`Video source: ${videoSrc}`);
    
    const handleCanPlay = () => {
      console.log(`Video can play for ${currentSegment}`);
      setIsLoading(false);
      
      // If autoplay is enabled and not already playing, start playback
      if (autoPlay && !isPlaying) {
        console.log("Trying to autoplay...");
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Autoplay successful");
              setIsPlaying(true);
              if (onPlayPauseToggle) onPlayPauseToggle(true);
            })
            .catch(error => {
              console.error("Autoplay failed:", error);
              // Don't change isPlaying state - user will need to click
            });
        }
      }
    };
    
    const handleEnded = () => {
      console.log(`Video for ${currentSegment} ended`);
      
      // Find next segment index
      const currentIndex = segments.indexOf(currentSegment);
      if (currentIndex >= 0 && currentIndex < segments.length - 1) {
        // Move to next segment
        const nextSegment = segments[currentIndex + 1];
        console.log(`Moving to next segment: ${nextSegment}`);
        setCurrentSegment(nextSegment);
      } else {
        // End of sequence
        console.log('End of sequence reached');
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      }
    };
    
    // Set up event listeners
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    
    // Clean up
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentSegment, videoSrc, autoPlay, isPlaying, onPlayPauseToggle, segments]);
  
  // Manage play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying && !isLoading) {
      console.log(`Playing video: ${currentSegment}`);
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing video:", error);
          setIsPlaying(false);
        });
      }
    } else if (!isPlaying && !isLoading) {
      console.log(`Pausing video: ${currentSegment}`);
      video.pause();
    }
  }, [isPlaying, isLoading, currentSegment]);
  
  const handlePlayPauseClick = () => {
    console.log(`Toggling play state from ${isPlaying ? 'playing' : 'paused'} to ${!isPlaying ? 'playing' : 'paused'}`);
    setIsPlaying(!isPlaying);
    if (onPlayPauseToggle) onPlayPauseToggle(!isPlaying);
  };
  
  return (
    <div className="bg-dark rounded-lg overflow-hidden shadow-lg relative">
      <div className="relative pt-[56.25%]">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white mt-4">Loading segment...</p>
            </div>
          </div>
        )}
        
        {/* Video element */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          preload="auto"
          playsInline
          style={{ opacity: isLoading ? 0 : 1 }}
        />
        
        {/* Audio element (hidden) */}
        <audio 
          src={audioSrc} 
          style={{ display: 'none' }} 
        />
        
        {/* Play/pause button */}
        {!isLoading && (
          <div 
            className={`absolute inset-0 flex items-center justify-center z-10 ${isPlaying ? 'bg-transparent' : 'bg-black bg-opacity-30'}`}
            onClick={handlePlayPauseClick}
          >
            {!isPlaying && (
              <button
                className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors"
                aria-label="Play video"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-12 h-12 text-dark"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20">
          <p className="text-white font-medium text-lg text-center">
            {script[currentSegment]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimplePlayer;