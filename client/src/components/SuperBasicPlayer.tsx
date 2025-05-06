import React, { useState, useRef, useEffect } from 'react';
import type { ClipInfo } from '@shared/schema';

interface SuperBasicPlayerProps {
  clipInfo: ClipInfo;
  script: {
    trump1: string;
    zelensky: string;
    trump2: string;
    vance: string;
  };
  onPlayPauseToggle?: (isPlaying: boolean) => void;
}

/**
 * SuperBasicPlayer - A bare bones implementation with minimal state
 */
const SuperBasicPlayer: React.FC<SuperBasicPlayerProps> = ({
  clipInfo,
  script,
  onPlayPauseToggle
}) => {
  // Check if the user has already interacted with the page
  // This will help with autoplay restrictions
  const hasUserInteracted = () => {
    try {
      return !!sessionStorage.getItem('userHasInteracted');
    } catch (e) {
      return false;
    }
  };

  // Track only the current scene and playing state
  const [currentScene, setCurrentScene] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInteracted, setUserInteracted] = useState(hasUserInteracted());
  
  // References to media elements 
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Scene definitions - sequence of video/audio pairs
  const scenes = [
    { 
      name: 'trump1',
      video: `/static${clipInfo.trump1Video}`,
      audio: `/static${clipInfo.trump1Audio}`,
      caption: script.trump1
    },
    { 
      name: 'zelensky',
      video: `/static${clipInfo.zelenskyVideo}`,
      audio: `/static${clipInfo.zelenskyAudio}`,
      caption: script.zelensky
    },
    { 
      name: 'trump2',
      video: `/static${clipInfo.trump2Video}`,
      audio: `/static${clipInfo.trump2Audio}`,
      caption: script.trump2
    },
    { 
      name: 'vance',
      video: `/static${clipInfo.vanceVideo}`,
      audio: `/static${clipInfo.vanceAudio}`,
      caption: script.vance
    }
  ];
  
  // Track loading errors
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Log video load error details
  const handleVideoError = (event: any) => {
    const video = event.target;
    console.error('Video load error:', {
      src: video.src,
      error: video.error?.message || 'Unknown error',
      code: video.error?.code,
      networkState: video.networkState,
      readyState: video.readyState
    });
    setLoadError(`Video failed to load (${scenes[currentScene].name})`);
  };
  
  // Log audio load error details 
  const handleAudioError = (event: any) => {
    const audio = event.target;
    console.error('Audio load error:', {
      src: audio.src,
      error: audio.error?.message || 'Unknown error',
      code: audio.error?.code,
      networkState: audio.networkState,
      readyState: audio.readyState
    });
    setLoadError(`Audio failed to load (${scenes[currentScene].name})`);
  };
  
  // When scene changes, update the video and audio sources
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    // Reset media
    video.pause();
    audio.pause();
    
    // Track loading state for both media elements
    let videoReady = false;
    let audioReady = false;
    
    // Helper to check if both media elements are ready
    const checkBothReady = () => {
      if (videoReady && audioReady) {
        setIsLoading(false);
        console.log(`Both video and audio ready for scene ${currentScene}`);
        
        // Auto-play if:
        // 1. Not the first scene (transitioning between scenes) OR
        // 2. Already playing OR
        // 3. User has already interacted with the page
        if (currentScene > 0 || isPlaying || userInteracted) {
          // Add a slight delay to ensure browser is ready for playback
          setTimeout(() => {
            console.log(`Auto-playing scene ${currentScene} (userInteracted: ${userInteracted})`);
            playMedia();
          }, 100);
        }
      }
    };
    
    // Set up listeners for this scene only
    const handleVideoCanPlay = () => {
      console.log(`Video ready for scene ${currentScene}`);
      videoReady = true;
      video.currentTime = 0; // Reset position to beginning
      checkBothReady();
    };
    
    const handleAudioCanPlay = () => {
      console.log(`Audio ready for scene ${currentScene}`);
      audioReady = true;
      audio.currentTime = 0; // Reset position to beginning
      checkBothReady();
    };
    
    const handleAudioEnded = () => {
      console.log(`Scene ${currentScene} ended`);
      // When audio ends, move to next scene
      if (currentScene < scenes.length - 1) {
        setCurrentScene(currentScene + 1);
      } else {
        // End of all scenes
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      }
    };
    
    // Add event listeners
    video.addEventListener('canplaythrough', handleVideoCanPlay);
    video.addEventListener('error', handleVideoError);
    
    audio.addEventListener('canplaythrough', handleAudioCanPlay);
    audio.addEventListener('error', handleAudioError);
    audio.addEventListener('ended', handleAudioEnded);
    
    // Set sources and start loading
    console.log(`Loading scene ${currentScene}:`, scenes[currentScene]);
    video.src = scenes[currentScene].video;
    audio.src = scenes[currentScene].audio;
    
    // Preload media
    video.load();
    audio.load();
    
    // Set a timeout to detect long loading times
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn(`Loading timeout for scene ${currentScene} (still waiting after 8 seconds)`);
      }
    }, 8000);
    
    return () => {
      // Clean up event listeners and timeout
      video.removeEventListener('canplaythrough', handleVideoCanPlay);
      video.removeEventListener('error', handleVideoError);
      
      audio.removeEventListener('canplaythrough', handleAudioCanPlay);
      audio.removeEventListener('error', handleAudioError);
      audio.removeEventListener('ended', handleAudioEnded);
      
      clearTimeout(timeoutId);
    };
  }, [currentScene, scenes, isPlaying, onPlayPauseToggle, userInteracted]);
  
  // Function to play both media in sync
  const playMedia = async () => {
    console.log("Attempting to play media");
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) {
      console.error("Media elements not available");
      return;
    }
    
    try {
      // Make sure we have valid sources
      if (!video.src || !audio.src) {
        console.error("Missing media sources:", { videoSrc: video.src, audioSrc: audio.src });
        setLoadError("Media source missing");
        return;
      }
      
      // Reset to beginning and make sure current time is explicitly 0
      video.currentTime = 0;
      audio.currentTime = 0;
      
      // First try to play both media 
      console.log("Playing video:", video.src);
      let videoPromise = video.play();
      
      console.log("Playing audio:", audio.src);
      let audioPromise;
      
      // Try to start audio playback right away to minimize any delay
      audioPromise = audio.play();
      
      // Wait for both play promises to resolve
      try {
        await videoPromise;
        console.log("Video playback started successfully");
      } catch (videoError) {
        console.error("Video playback failed:", videoError);
        // If video fails, we need to handle autoplay restrictions
        throw videoError;
      }
      
      try {
        await audioPromise;
        console.log("Audio playback started successfully");
      } catch (audioError) {
        console.error("Audio playback failed:", audioError);
        // If first attempt fails due to autoplay restrictions, try again after user interaction
        throw audioError;
      }
      
      // Update state once both are playing
      console.log("Both media playing successfully");
      setIsPlaying(true);
      if (onPlayPauseToggle) onPlayPauseToggle(true);
      
    } catch (error) {
      console.error('Error playing media:', error);
      
      // Check if this is an autoplay restriction error (DOMException with name AbortError)
      const isAutoplayError = error && 
        error instanceof DOMException && 
        (error.name === 'AbortError' || error.name === 'NotAllowedError');
      
      if (isAutoplayError) {
        console.warn("Detected autoplay restriction. User interaction required.");
        // Don't show error - just show play button for user to click
        setIsPlaying(false);
        setIsLoading(false);
        
        // Make sure both are paused
        try {
          video.pause();
          audio.pause();
        } catch (e) {
          // Ignore errors on pause
        }
        
        if (onPlayPauseToggle) onPlayPauseToggle(false);
        return;
      }
      
      // For other errors, show error details
      let errorDetails = "";
      
      if (video.error) {
        errorDetails += `Video: ${video.error.message || video.error.code} `;
      }
      
      if (audio.error) {
        errorDetails += `Audio: ${audio.error.message || audio.error.code}`;
      }
      
      // Show error and pause both media
      setLoadError(`Playback failed: ${errorDetails || (error instanceof Error ? error.message : "unknown error")}`);
      setIsPlaying(false);
      
      try {
        video.pause();
        audio.pause();
      } catch (e) {
        // Ignore errors on pause
      }
      
      if (onPlayPauseToggle) onPlayPauseToggle(false);
    }
  };
  
  // Function to toggle play/pause
  const togglePlayPause = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    if (isPlaying) {
      // Pause both
      video.pause();
      audio.pause();
      setIsPlaying(false);
      if (onPlayPauseToggle) onPlayPauseToggle(false);
    } else {
      // Update our interaction state
      setUserInteracted(true);
      
      // Store a flag in sessionStorage to remember user has clicked
      try {
        sessionStorage.setItem('userHasInteracted', 'true');
      } catch (e) {
        // Ignore storage errors
      }
      
      // Ensure timeouts are cleared so we can start fresh
      setIsLoading(false);
      
      // Reset positions again for good measure
      video.currentTime = 0;
      audio.currentTime = 0;
      
      // Start playback
      playMedia();
    }
  };
  
  return (
    <div className="bg-dark rounded-lg overflow-hidden shadow-lg relative">
      <div className="relative pt-[56.25%]">
        {/* Video element */}
        <video 
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          preload="auto"
          muted={true}
          onClick={togglePlayPause}
          style={{ opacity: isLoading ? 0.5 : 1 }}
        />
        
        {/* Hidden audio element */}
        <audio 
          ref={audioRef}
          preload="auto"
        />
        
        {/* Loading indicator or error */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white text-sm mt-2">Loading {scenes[currentScene].name}...</p>
            </div>
          </div>
        )}
        
        {/* Error display */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-25">
            <div className="bg-red-800 p-4 rounded max-w-md text-center">
              <p className="text-white font-medium">{loadError}</p>
              <p className="text-white text-sm mt-2">
                Please try refreshing the page. If the issue persists, a file may be missing.
              </p>
              <button 
                className="mt-4 bg-white text-red-800 font-bold py-2 px-4 rounded"
                onClick={() => setLoadError(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {/* Play button */}
        {(!isPlaying && !isLoading) && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10"
            onClick={togglePlayPause}
          >
            <button
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg"
              aria-label="Play"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-12 h-12 text-dark"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Pause button */}
        {(isPlaying && !isLoading) && (
          <div 
            className="absolute top-0 right-0 m-3 z-10"
            onClick={togglePlayPause}
          >
            <button
              className="w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center"
              aria-label="Pause"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-white"
              >
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
          </div>
        )}
        
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20">
          <p className="text-white font-medium text-lg text-center">
            {scenes[currentScene].caption}
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-10">
          <div 
            className="h-full bg-primary" 
            style={{ 
              width: `${(currentScene / (scenes.length-1)) * 100}%`,
              transition: 'width 0.5s ease-out'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SuperBasicPlayer;