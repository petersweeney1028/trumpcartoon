import React, { useState, useRef, useEffect } from "react";
import { ClipInfo } from "@shared/schema";

interface UltraSimplePlayerProps {
  clipInfo: ClipInfo;
  script: {
    trump1: string;
    zelensky: string;
    trump2: string;
    vance: string;
  };
  onPlayPauseToggle?: (isPlaying: boolean) => void;
}

type CharacterSegment = 'trump1' | 'zelensky' | 'trump2' | 'vance';

/**
 * UltraSimplePlayer - An extremely simplified player with a single-responsibility approach
 * to avoid browser autoplay restrictions and ensure proper synchronization
 */
const UltraSimplePlayer: React.FC<UltraSimplePlayerProps> = ({
  clipInfo,
  script,
  onPlayPauseToggle
}) => {
  // Core state
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  
  // Media refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Segment order
  const segments: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance'];
  
  // Create proper paths for media files
  const getStaticPath = (path: string) => {
    if (path.startsWith('/clips/') || path.startsWith('/voices/')) {
      return `/static${path}`;
    }
    if (path.startsWith('/static/')) return path;
    return path;
  };
  
  // Get current media paths based on segment
  const videoSrc = getStaticPath(
    currentSegment === 'trump1' ? clipInfo.trump1Video :
    currentSegment === 'zelensky' ? clipInfo.zelenskyVideo :
    currentSegment === 'trump2' ? clipInfo.trump2Video :
    clipInfo.vanceVideo
  );
  
  const audioSrc = getStaticPath(
    currentSegment === 'trump1' ? clipInfo.trump1Audio :
    currentSegment === 'zelensky' ? clipInfo.zelenskyAudio :
    currentSegment === 'trump2' ? clipInfo.trump2Audio :
    clipInfo.vanceAudio
  );
  
  // Handle media loading
  useEffect(() => {
    // Reset loading state when segment changes
    setIsLoading(true);
    setLoadedCount(0);
    
    // Log that we're loading new media
    console.log(`Loading segment: ${currentSegment}`);
    console.log(`Video source: ${videoSrc}`);
    console.log(`Audio source: ${audioSrc}`);
    
    // Reset any prior playback
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Player was playing before segment change, resume after loading
    if (isPlaying) {
      setIsPlaying(false);
    }
  }, [currentSegment, videoSrc, audioSrc]);
  
  // Handle media loaded events
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    const handleVideoLoaded = () => {
      console.log(`Video loaded for ${currentSegment}`);
      setLoadedCount(prev => prev + 1);
    };
    
    const handleAudioLoaded = () => {
      console.log(`Audio loaded for ${currentSegment}`);
      setLoadedCount(prev => prev + 1);
    };
    
    // Listen for loaded events
    video.addEventListener('loadeddata', handleVideoLoaded);
    audio.addEventListener('loadeddata', handleAudioLoaded);
    
    return () => {
      video.removeEventListener('loadeddata', handleVideoLoaded);
      audio.removeEventListener('loadeddata', handleAudioLoaded);
    };
  }, [currentSegment]);
  
  // Determine when both media are loaded
  useEffect(() => {
    if (loadedCount >= 2) {
      console.log(`Both video and audio loaded for ${currentSegment}`);
      setIsLoading(false);
    }
  }, [loadedCount, currentSegment]);
  
  // Handle audio ended event to move to next segment
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleAudioEnded = () => {
      console.log(`Audio for ${currentSegment} ended`);
      
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
    
    audio.addEventListener('ended', handleAudioEnded);
    
    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [currentSegment, segments, onPlayPauseToggle]);
  
  // Manage play state changes
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio || isLoading) return;
    
    const playMedia = async () => {
      try {
        console.log('Starting playback...');
        console.log(`Video readyState=${video.readyState}, paused=${video.paused}`);
        console.log(`Audio readyState=${audio.readyState}, paused=${audio.paused}`);
        
        // Ensure both are reset to start
        video.currentTime = 0;
        audio.currentTime = 0;
        
        // Important: Start video first (it's muted so no autoplay restriction)
        await video.play();
        console.log('Video started successfully');
        
        // Now start audio
        await audio.play();
        console.log('Audio started successfully');
        
        // Update parent component
        if (onPlayPauseToggle) onPlayPauseToggle(true);
      } catch (err) {
        console.error('Error starting playback:', err);
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      }
    };
    
    if (isPlaying) {
      playMedia();
    } else {
      // Pause both
      video.pause();
      audio.pause();
      if (onPlayPauseToggle) onPlayPauseToggle(false);
    }
  }, [isPlaying, isLoading, onPlayPauseToggle]);
  
  // Handle play button click
  const handlePlayButtonClick = () => {
    // Record user interaction for autoplay policy
    if (!hasUserInteracted) {
      console.log('User interaction recorded');
      setHasUserInteracted(true);
    }
    
    // Toggle play state
    console.log(`Toggling play state from ${isPlaying ? 'playing' : 'paused'} to ${!isPlaying ? 'playing' : 'paused'}`);
    setIsPlaying(!isPlaying);
  };
  
  return (
    <div className="bg-dark rounded-lg overflow-hidden shadow-lg relative">
      <div className="relative pt-[56.25%]">
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white mt-4">Loading media...</p>
            </div>
          </div>
        )}
        
        {/* Video element - always muted */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          muted={true} // Always muted to avoid autoplay restrictions
          loop={false}
          playsInline
          preload="metadata"
          onClick={handlePlayButtonClick}
          style={{ opacity: isLoading ? 0 : 1 }}
        />
        
        {/* Hidden audio element - carries the sound */}
        <audio 
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
          style={{ display: 'none' }}
        />
        
        {/* Play button overlay */}
        {(!isPlaying && !isLoading) && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10"
            onClick={handlePlayButtonClick}
          >
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
          </div>
        )}
        
        {/* Pause button overlay */}
        {(isPlaying && !isLoading) && (
          <div 
            className="absolute top-0 right-0 p-3 z-10"
            onClick={handlePlayButtonClick}
          >
            <button
              className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
              aria-label="Pause video"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                />
              </svg>
            </button>
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

export default UltraSimplePlayer;