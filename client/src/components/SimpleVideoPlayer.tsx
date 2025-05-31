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

    try {
      setError(null);
      
      // Make sure both are reset
      video.currentTime = 0;
      audio.currentTime = 0;
      
      // Start playing both
      const videoPromise = video.play();
      const audioPromise = audio.play();
      
      await Promise.all([videoPromise, audioPromise]);
      
      setIsPlaying(true);
      onPlayPauseToggle?.(true);
      console.log(`Playing scene ${currentScene}: ${scenes[currentScene].name}`);
      
    } catch (error) {
      console.warn('Play failed:', error);
      setIsPlaying(false);
      onPlayPauseToggle?.(false);
      
      // Only show error for non-autoplay issues
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (!errorMsg.includes('interrupted') && !errorMsg.includes('AbortError')) {
        setError('Playback failed. Click to try again.');
      }
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

  // Load a specific scene
  const loadScene = useCallback((sceneIndex: number) => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;

    setIsLoading(true);
    setError(null);
    
    // Pause current playback
    pauseCurrentScene();
    
    // Set new sources
    video.src = scenes[sceneIndex].video;
    audio.src = scenes[sceneIndex].audio;
    
    console.log(`Loading scene ${sceneIndex}: ${scenes[sceneIndex].name}`);
    console.log(`Video URL: ${video.src}`);
    console.log(`Audio URL: ${audio.src}`);
    
    // Add detailed event listeners for debugging
    const handleVideoProgress = () => {
      console.log(`Video loading progress - readyState: ${video.readyState}, networkState: ${video.networkState}`);
    };
    
    const handleAudioProgress = () => {
      console.log(`Audio loading progress - readyState: ${audio.readyState}, networkState: ${audio.networkState}`);
    };
    
    const handleVideoLoadStart = () => console.log('Video load started');
    const handleAudioLoadStart = () => console.log('Audio load started');
    const handleVideoLoadedMetadata = () => console.log('Video metadata loaded');
    const handleAudioLoadedMetadata = () => console.log('Audio metadata loaded');
    const handleVideoLoadedData = () => console.log('Video data loaded');
    const handleAudioLoadedData = () => console.log('Audio data loaded');
    const handleVideoCanPlay = () => console.log('Video can start playing');
    const handleAudioCanPlay = () => console.log('Audio can start playing');
    const handleVideoStalled = () => console.log('Video stalled');
    const handleAudioStalled = () => console.log('Audio stalled');
    const handleVideoSuspend = () => console.log('Video suspended');
    const handleAudioSuspend = () => console.log('Audio suspended');
    
    // Error handlers
    const handleVideoError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      console.error('Video error:', {
        error: target.error,
        code: target.error?.code,
        message: target.error?.message,
        src: target.src
      });
      setError(`Video error: ${target.error?.message || 'Unknown error'}`);
    };
    
    const handleAudioError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      console.error('Audio error:', {
        error: target.error,
        code: target.error?.code,
        message: target.error?.message,
        src: target.src
      });
      setError(`Audio error: ${target.error?.message || 'Unknown error'}`);
    };
    
    // Add all the debug listeners
    video.addEventListener('loadstart', handleVideoLoadStart);
    video.addEventListener('loadedmetadata', handleVideoLoadedMetadata);
    video.addEventListener('loadeddata', handleVideoLoadedData);
    video.addEventListener('canplay', handleVideoCanPlay);
    video.addEventListener('progress', handleVideoProgress);
    video.addEventListener('stalled', handleVideoStalled);
    video.addEventListener('suspend', handleVideoSuspend);
    video.addEventListener('error', handleVideoError);
    
    audio.addEventListener('loadstart', handleAudioLoadStart);
    audio.addEventListener('loadedmetadata', handleAudioLoadedMetadata);
    audio.addEventListener('loadeddata', handleAudioLoadedData);
    audio.addEventListener('canplay', handleAudioCanPlay);
    audio.addEventListener('progress', handleAudioProgress);
    audio.addEventListener('stalled', handleAudioStalled);
    audio.addEventListener('suspend', handleAudioSuspend);
    audio.addEventListener('error', handleAudioError);
    
    // Load the media
    video.load();
    audio.load();
    
    // Set a timeout to check if loading gets stuck
    setTimeout(() => {
      console.log(`After 5 seconds - Video readyState: ${video.readyState}, networkState: ${video.networkState}`);
      console.log(`After 5 seconds - Audio readyState: ${audio.readyState}, networkState: ${audio.networkState}`);
      
      if (video.readyState === 0) {
        console.error('Video failed to start loading after 5 seconds');
        setError('Video failed to load - network or format issue');
      }
      if (audio.readyState === 0) {
        console.error('Audio failed to start loading after 5 seconds');
        setError('Audio failed to load - network or format issue');
      }
    }, 5000);
    
  }, [scenes, pauseCurrentScene]);

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

  // Set up event listeners for current scene
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;

    let videoReady = false;
    let audioReady = false;
    
    const checkReady = () => {
      if (videoReady && audioReady) {
        handleMediaReady();
      }
    };
    
    const handleVideoReady = () => {
      videoReady = true;
      checkReady();
    };
    
    const handleAudioReady = () => {
      audioReady = true;
      checkReady();
    };
    
    const handleAudioEnded = () => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
      } else {
        pauseCurrentScene();
      }
    };
    
    video.addEventListener('canplaythrough', handleVideoReady);
    audio.addEventListener('canplaythrough', handleAudioReady);
    audio.addEventListener('ended', handleAudioEnded);
    
    // Load the current scene
    loadScene(currentScene);
    
    return () => {
      video.removeEventListener('canplaythrough', handleVideoReady);
      audio.removeEventListener('canplaythrough', handleAudioReady);
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [currentScene, loadScene, handleMediaReady, pauseCurrentScene, scenes.length]);

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