import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ClipInfo } from '@shared/schema';

interface SimpleVideoPlayerProps {
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
 * SimpleVideoPlayer - A completely rewritten player that avoids closure issues
 */
const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  clipInfo,
  script,
  onPlayPauseToggle
}) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Play current scene
  const playCurrentScene = useCallback(async () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;

    console.log('🎬 playCurrentScene called');
    console.log(`Video readyState: ${video.readyState}, Audio readyState: ${audio.readyState}`);
    
    // Only play if both media are fully loaded
    if (video.readyState < 4 || audio.readyState < 4) {
      console.log('⏳ Media not ready, waiting...');
      return;
    }
    
    try {
      setError(null);
      
      // Reset playback position
      video.currentTime = 0;
      audio.currentTime = 0;
      
      console.log('🎵 Starting parallel play calls');
      
      // Start playing both in parallel and await both
      const [videoResult, audioResult] = await Promise.all([
        video.play().catch(err => {
          console.error('Video play failed:', err);
          throw err;
        }),
        audio.play().catch(err => {
          console.error('Audio play failed:', err);
          throw err;
        })
      ]);
      
      setIsPlaying(true);
      onPlayPauseToggle?.(true);
      console.log(`✅ Successfully playing scene ${currentScene}: ${scenes[currentScene].name}`);
      
    } catch (error) {
      console.error('❌ Play failed:', error);
      setIsPlaying(false);
      onPlayPauseToggle?.(false);
      setError('Playback failed. Click to try again.');
    }
  }, [currentScene, scenes, onPlayPauseToggle]);

  // Pause current scene
  const pauseCurrentScene = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (video) video.pause();
    if (audio) audio.pause();
    
    setIsPlaying(false);
    onPlayPauseToggle?.(false);
  }, [onPlayPauseToggle]);

  // Track loading state to prevent multiple simultaneous loads
  const [currentlyLoading, setCurrentlyLoading] = useState<number | null>(null);
  
  // Load a specific scene
  const loadScene = useCallback(async (sceneIndex: number) => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    // Prevent multiple simultaneous loads
    if (currentlyLoading === sceneIndex) return;
    
    setCurrentlyLoading(sceneIndex);
    setIsLoading(true);
    setError(null);
    
    console.log(`Loading scene ${sceneIndex}: ${scenes[sceneIndex].name}`);
    
    try {
      // Pause and clear existing sources to prevent interruption
      video.pause();
      audio.pause();
      
      video.removeAttribute('src');
      audio.removeAttribute('src');
      video.load();
      audio.load();
      
      // Wait for load cycles to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set new sources
      video.src = scenes[sceneIndex].video;
      audio.src = scenes[sceneIndex].audio;
      
      // Force reload with new sources
      video.load();
      audio.load();
      
      // Wait for both to be fully ready (readyState 4 = HAVE_ENOUGH_DATA)
      await Promise.all([
        new Promise(resolve => {
          const checkVideo = () => {
            if (video.readyState >= 4) {
              resolve(true);
            } else {
              video.addEventListener('canplaythrough', resolve, { once: true });
            }
          };
          checkVideo();
        }),
        new Promise(resolve => {
          const checkAudio = () => {
            if (audio.readyState >= 4) {
              resolve(true);
            } else {
              audio.addEventListener('canplaythrough', resolve, { once: true });
            }
          };
          checkAudio();
        })
      ]);
      
      console.log('✅ Both media fully loaded, ready for playback');
      setIsLoading(false);
      setCurrentlyLoading(null);
      
      // Only start playback if user has interacted or transitioning scenes
      if (hasUserInteracted || currentScene > 0) {
        setTimeout(() => playCurrentScene(), 50);
      }
      
    } catch (error) {
      console.error('Error loading media:', error);
      setError('Failed to load media');
      setIsLoading(false);
      setCurrentlyLoading(null);
    }
    
  }, [scenes, currentlyLoading, hasUserInteracted, currentScene, playCurrentScene]);

  // Handle when both video and audio are ready
  const handleMediaReady = useCallback(() => {
    setIsLoading(false);
    
    // Auto-play if user has interacted or if transitioning between scenes
    if (hasUserInteracted || currentScene > 0) {
      // Add a small delay to ensure media is fully ready
      setTimeout(() => {
        playCurrentScene();
      }, 100);
    }
  }, [hasUserInteracted, currentScene, playCurrentScene]);

  // Load scene when currentScene changes
  useEffect(() => {
    loadScene(currentScene);
  }, [currentScene, scenes]);

  // Set up event listeners
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    const handleAudioEnded = () => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
      } else {
        pauseCurrentScene();
      }
    };
    
    audio.addEventListener('ended', handleAudioEnded);
    
    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [currentScene, pauseCurrentScene, scenes.length]);

  // Handle user click to play/pause
  const handleClick = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    
    if (isPlaying) {
      pauseCurrentScene();
    } else {
      playCurrentScene();
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
          muted
          onClick={handleClick}
          style={{ opacity: isLoading ? 0.5 : 1 }}
        />
        
        {/* Audio element */}
        <audio ref={audioRef} />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white text-sm mt-2">Loading {scenes[currentScene].name}...</p>
            </div>
          </div>
        )}
        
        {/* Error display */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-25">
            <div className="bg-red-800 p-4 rounded max-w-md text-center">
              <p className="text-white font-medium">{error}</p>
              <button 
                className="mt-4 bg-white text-red-800 font-bold py-2 px-4 rounded"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {/* Play button */}
        {(!isPlaying && !isLoading && !error) && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10"
            onClick={handleClick}
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
              width: `${(currentScene / (scenes.length - 1)) * 100}%`,
              transition: 'width 0.5s ease-out'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SimpleVideoPlayer;