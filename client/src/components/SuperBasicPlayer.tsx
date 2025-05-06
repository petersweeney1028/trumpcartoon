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
  // Track only the current scene and playing state
  const [currentScene, setCurrentScene] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  // When scene changes, update the video and audio sources
  useEffect(() => {
    setIsLoading(true);
    
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    // Reset media
    video.pause();
    audio.pause();
    
    // Update sources
    video.src = scenes[currentScene].video;
    audio.src = scenes[currentScene].audio;
    
    // Preload media
    video.load();
    audio.load();
    
    // Set up listeners for this scene only
    const handleCanPlay = () => {
      // Check if both video and audio are ready
      if (video.readyState >= 3 && audio.readyState >= 3) {
        setIsLoading(false);
        
        // Auto-play if not the first scene or if already playing
        if (currentScene > 0 || isPlaying) {
          playMedia();
        }
      }
    };
    
    const handleAudioEnded = () => {
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
    video.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('ended', handleAudioEnded);
    
    return () => {
      // Clean up event listeners
      video.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [currentScene, scenes, isPlaying, onPlayPauseToggle]);
  
  // Function to play both media in sync
  const playMedia = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    // Reset to beginning
    video.currentTime = 0;
    audio.currentTime = 0;
    
    // Play video first (muted, so no autoplay restrictions)
    const videoPromise = video.play();
    
    // Then play audio
    videoPromise
      .then(() => audio.play())
      .then(() => {
        setIsPlaying(true);
        if (onPlayPauseToggle) onPlayPauseToggle(true);
      })
      .catch(error => {
        console.error('Error playing media:', error);
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      });
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
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white text-sm mt-2">Loading {scenes[currentScene].name}...</p>
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