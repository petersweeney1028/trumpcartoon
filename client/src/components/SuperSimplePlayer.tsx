import React, { useState, useRef, useEffect } from 'react';
import type { ClipInfo } from '@shared/schema';

interface SuperSimplePlayerProps {
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
 * SuperSimplePlayer - A player that synchronizes separate video and audio elements
 * Since our videos don't have embedded audio tracks, we need to manage separate audio files
 */
const SuperSimplePlayer: React.FC<SuperSimplePlayerProps> = ({
  clipInfo,
  script,
  onPlayPauseToggle
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedMedia, setLoadedMedia] = useState({ video: false, audio: false });
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  
  // References for both video and audio elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Segments in order
  const segments: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance']; 
  
  // Get current media paths
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
  
  // Reset loading state when segment changes
  useEffect(() => {
    setIsLoading(true);
    setLoadedMedia({ video: false, audio: false });
    console.log(`Loading segment: ${currentSegment} (video: ${videoSrc}, audio: ${audioSrc})`);
    
    // Reset playback state if they're already playing
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [currentSegment, videoSrc, audioSrc]);
  
  // Handle media loading events
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    const handleVideoCanPlay = () => {
      console.log(`Video for ${currentSegment} can play`);
      setLoadedMedia(prev => ({ ...prev, video: true }));
    };
    
    const handleAudioCanPlay = () => {
      console.log(`Audio for ${currentSegment} can play`);
      setLoadedMedia(prev => ({ ...prev, audio: true }));
    };
    
    // Set up event listeners for media load
    video.addEventListener('canplay', handleVideoCanPlay);
    audio.addEventListener('canplay', handleAudioCanPlay);
    
    return () => {
      // Clean up event listeners
      video.removeEventListener('canplay', handleVideoCanPlay);
      audio.removeEventListener('canplay', handleAudioCanPlay);
    };
  }, [currentSegment]);
  
  // Track when both media are loaded
  useEffect(() => {
    if (loadedMedia.video && loadedMedia.audio) {
      console.log(`Both video and audio for ${currentSegment} are ready`);
      setIsLoading(false);
      
      // Auto-play when media is loaded for the first time
      if (!isPlaying) {
        startPlayback();
      }
    }
  }, [loadedMedia, currentSegment]);
  
  // Handle audio ended to go to next segment
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleAudioEnded = () => {
      console.log(`Audio for ${currentSegment} ended`);
      
      // Find the index of current segment
      const currentIndex = segments.indexOf(currentSegment);
      
      // If there's a next segment, load it
      if (currentIndex >= 0 && currentIndex < segments.length - 1) {
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
    
    // Set up event listener
    audio.addEventListener('ended', handleAudioEnded);
    
    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [currentSegment, segments, onPlayPauseToggle]);
  
  // Start playback of both video and audio
  const startPlayback = async () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio || isLoading) return;
    
    try {
      console.log(`Starting playback of ${currentSegment}`);
      
      // Reset both to start
      video.currentTime = 0;
      audio.currentTime = 0;
      
      // Start video first (it has no audio, so no autoplay restrictions)
      const videoPromise = video.play();
      
      // Then start audio
      let audioStarted = false;
      
      if (videoPromise !== undefined) {
        await videoPromise;
        
        // Now that video has started, start audio
        try {
          await audio.play();
          audioStarted = true;
          console.log(`Audio for ${currentSegment} started`);
        } catch (audioErr) {
          console.error("Failed to start audio:", audioErr);
        }
      }
      
      if (audioStarted) {
        setIsPlaying(true);
        if (onPlayPauseToggle) onPlayPauseToggle(true);
      } else {
        throw new Error("Could not start audio playback");
      }
    } catch (err) {
      console.error("Error starting media playback:", err);
      pausePlayback();
    }
  };
  
  // Pause both video and audio
  const pausePlayback = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    console.log(`Pausing ${currentSegment}`);
    video.pause();
    audio.pause();
    setIsPlaying(false);
    if (onPlayPauseToggle) onPlayPauseToggle(false);
  };
  
  // Toggle between play and pause
  const togglePlayPause = () => {
    if (isLoading) return;
    
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };
  
  return (
    <div className="bg-dark rounded-lg overflow-hidden shadow-lg relative">
      <div className="relative pt-[56.25%]">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white mt-4">Loading media...</p>
            </div>
          </div>
        )}
        
        {/* Video element */}
        <video 
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          preload="auto"
          muted={true} // Mute video since audio comes from audio element
          onClick={togglePlayPause}
          style={{ opacity: isLoading ? 0 : 1 }}
        />
        
        {/* Hidden audio element */}
        <audio 
          ref={audioRef}
          src={audioSrc}
          preload="auto"
          style={{ display: 'none' }}
        />
        
        {/* Play button overlay */}
        {(!isPlaying && !isLoading) && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10"
            onClick={togglePlayPause}
          >
            <button
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors"
              aria-label="Play media"
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
        
        {/* Pause button */}
        {(isPlaying && !isLoading) && (
          <div 
            className="absolute top-0 right-0 p-3 z-10"
            onClick={togglePlayPause}
          >
            <button
              className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
              aria-label="Pause media"
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

export default SuperSimplePlayer;