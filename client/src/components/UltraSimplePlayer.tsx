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
  const autoplayTriggerRef = useRef<HTMLButtonElement>(null);
  
  // Set user interaction to true immediately on component mount
  // This is a better solution than trying to simulate clicks
  useEffect(() => {
    console.log('Component mounted - marking user as having interacted');
    // Instead of trying to click the button, just set the flag directly
    setHasUserInteracted(true);
    
    // Cleanup function for component unmount - prevents memory leaks
    return () => {
      console.log('Component unmounting - cleaning up media');
      
      // Stop any playing media to prevent audio leakage between components
      const video = videoRef.current;
      const audio = audioRef.current;
      
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
      
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
      }
    };
  }, []);
  
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
    
    // When segment changes, we keep track that we're in a transitioning state
    // but don't change isPlaying here - that will be handled in the autoplay logic
    const wasPlaying = isPlaying;
    
    // We'll resume playing in the loadedCount effect
    // Important: Don't reset isPlaying here if it was already true, we'll handle that elsewhere
    // This prevents race conditions and infinite loops
  }, [currentSegment, videoSrc, audioSrc, isPlaying]);
  
  // Handle media loaded events
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    // Reset loaded count when component mounts or segment changes
    setLoadedCount(0);
    
    // Create one-time handlers to avoid duplicate events
    const handleVideoLoaded = () => {
      console.log(`Video loaded for ${currentSegment}`);
      // Using function form to prevent race conditions with multiple events
      setLoadedCount(prev => {
        // Only increment if we haven't already counted this load
        if (prev < 2) return prev + 1;
        return prev;
      });
      // Remove the listener after it fires once
      video.removeEventListener('loadeddata', handleVideoLoaded);
    };
    
    const handleAudioLoaded = () => {
      console.log(`Audio loaded for ${currentSegment}`);
      // Using function form to prevent race conditions with multiple events
      setLoadedCount(prev => {
        // Only increment if we haven't already counted this load
        if (prev < 2) return prev + 1;
        return prev;
      });
      // Remove the listener after it fires once
      audio.removeEventListener('loadeddata', handleAudioLoaded);
    };
    
    // Listen for loaded events
    video.addEventListener('loadeddata', handleVideoLoaded);
    audio.addEventListener('loadeddata', handleAudioLoaded);
    
    // Also check if they're already loaded
    if (video.readyState >= 3) {
      handleVideoLoaded();
    }
    
    if (audio.readyState >= 3) {
      handleAudioLoaded();
    }
    
    return () => {
      // Clean up in case they didn't fire
      video.removeEventListener('loadeddata', handleVideoLoaded);
      audio.removeEventListener('loadeddata', handleAudioLoaded);
    };
  }, [currentSegment]);
  
  // Determine when both media are loaded and autoplay
  useEffect(() => {
    // Only auto-start if we've loaded both media files
    if (loadedCount >= 2) {
      console.log(`Both video and audio loaded for ${currentSegment}`);
      setIsLoading(false);
      
      // For autoplaying subsequent segments after the first one started
      // we need to explicitly restart playback since isPlaying will remain true
      // during transitions
      
      // For first segment autoplay or when player was paused 
      if (!isPlaying) {
        console.log('Auto-starting playback after media loaded (new play state)');
        setHasUserInteracted(true); // Simulate user interaction
        setIsPlaying(true); // Start playback
      } 
      // For subsequent segments when already playing
      else {
        console.log('Auto-resuming playback after segment change (maintaining play state)');
        // Force re-trigger playback by toggling state - works around issue where
        // some browsers won't restart media even when sources change
        setIsPlaying(false);
        // Allow a brief moment for the state update to process
        setTimeout(() => {
          if (videoRef.current && audioRef.current) {
            console.log('Restarting media elements after brief delay');
            setIsPlaying(true);
          }
        }, 50);
      }
    }
  }, [loadedCount, currentSegment, isPlaying]);
  
  // Handle audio ended event to move to next segment
  useEffect(() => {
    const audio = audioRef.current;
    const video = videoRef.current;
    if (!audio || !video) return;
    
    let endedHandlerCalled = false; // Flag to prevent duplicate calls
    
    const handleAudioEnded = () => {
      // Prevent duplicate calls by checking the flag
      if (endedHandlerCalled) return;
      endedHandlerCalled = true;
      
      console.log(`Audio for ${currentSegment} ended`);
      
      // Find next segment index
      const currentIndex = segments.indexOf(currentSegment);
      if (currentIndex >= 0 && currentIndex < segments.length - 1) {
        // Move to next segment
        const nextSegment = segments[currentIndex + 1];
        console.log(`Moving to next segment: ${nextSegment}`);
        
        // Crucial: Stop current media completely
        video.pause();
        audio.pause();
        
        // Keep the flag marked that we're playing
        // This will be used by the loadedCount effect to auto-resume
        // the next segment once it loads
        
        // Update segment - this will trigger media loading for next segment
        setCurrentSegment(nextSegment);
        
        // Reset flag after a brief delay to prevent race conditions
        setTimeout(() => {
          endedHandlerCalled = false;
        }, 100);
      } else {
        // End of sequence
        console.log('End of sequence reached');
        video.pause();
        audio.pause();
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      }
    };
    
    // Add the event listener
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
      {/* Hidden autoplay trigger button - for browser autoplay policy bypass */}
      <button 
        ref={autoplayTriggerRef}
        onClick={handlePlayButtonClick}
        style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
        aria-hidden="true"
      />
      
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