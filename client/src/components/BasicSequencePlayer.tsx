import React, { useState, useRef, useEffect } from "react";
import { ClipInfo } from "@shared/schema";

interface BasicSequencePlayerProps {
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
 * BasicSequencePlayer - An extremely simplified player that focuses solely on playing
 * segments one after another with minimal complexity
 */
const BasicSequencePlayer: React.FC<BasicSequencePlayerProps> = ({
  clipInfo,
  script,
  onPlayPauseToggle
}) => {
  // State
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Segment order
  const segments: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance'];
  const nextSegment: Record<CharacterSegment, CharacterSegment | null> = {
    'trump1': 'zelensky',
    'zelensky': 'trump2',
    'trump2': 'vance',
    'vance': null
  };

  // Create proper paths by prepending /static to the paths
  const getStaticPath = (path: string) => {
    if (path.startsWith('/clips/') || path.startsWith('/voices/')) {
      return `/static${path}`;
    }
    if (path.startsWith('/static/')) return path;
    return path;
  };

  // Get current media paths
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

  // Handle media loaded
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;

    // Wait for both to load
    let videoLoaded = false;
    let audioLoaded = false;
    
    const checkLoaded = () => {
      if (videoLoaded && audioLoaded) {
        console.log(`Both video and audio loaded for ${currentSegment}`);
        setIsLoading(false);
      }
    };
    
    const onVideoLoaded = () => {
      console.log(`Video loaded for ${currentSegment}`);
      videoLoaded = true;
      checkLoaded();
    };
    
    const onAudioLoaded = () => {
      console.log(`Audio loaded for ${currentSegment}`);
      audioLoaded = true;
      checkLoaded();
    };
    
    // Add event listeners
    video.addEventListener('loadeddata', onVideoLoaded);
    audio.addEventListener('loadeddata', onAudioLoaded);
    
    // Handle audio ended - move to next segment
    const onAudioEnded = () => {
      console.log(`Audio for ${currentSegment} ended`);
      
      // Get next segment
      const next = nextSegment[currentSegment];
      
      if (next) {
        console.log(`Moving to next segment: ${next}`);
        
        // Pause current video and audio
        video.pause();
        audio.pause();
        
        // Mark as loading
        setIsLoading(true);
        
        // Switch to next segment
        setCurrentSegment(next);
      } else {
        // End of sequence
        console.log("End of sequence reached");
        video.pause();
        audio.pause();
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      }
    };
    
    audio.addEventListener('ended', onAudioEnded);
    
    // Cleanup
    return () => {
      video.removeEventListener('loadeddata', onVideoLoaded);
      audio.removeEventListener('loadeddata', onAudioLoaded);
      audio.removeEventListener('ended', onAudioEnded);
    };
  }, [currentSegment, onPlayPauseToggle, nextSegment]);
  
  // Handle play/pause toggling
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) {
      console.log('Media elements not ready yet');
      return;
    }
    
    if (isLoading) {
      console.log('Media is still loading, not playing yet');
      return;
    }
    
    console.log(`Play/pause effect running. isPlaying=${isPlaying}, userInteracted=${userInteracted}`);
    
    if (isPlaying) {
      // When toggling to play
      console.log(`Attempting to play segment: ${currentSegment}`);
      console.log(`Video state: readyState=${video.readyState}, paused=${video.paused}`);
      console.log(`Audio state: readyState=${audio.readyState}, paused=${audio.paused}`);
      
      // Reset positions to start of media
      video.currentTime = 0;
      audio.currentTime = 0;
      
      // First, try to start the video (which is muted to avoid autoplay restrictions)
      video.play()
        .then(() => {
          // Video started successfully, now play the audio
          console.log('Video started successfully, now playing audio');
          
          return audio.play().catch(err => {
            console.error('Error playing audio:', err);
            console.error('Audio error name:', err.name);
            console.error('Audio error message:', err.message);
            
            // If audio fails, pause video too
            video.pause();
            
            setIsPlaying(false);
            if (onPlayPauseToggle) onPlayPauseToggle(false);
            
            throw err; // Re-throw to be caught by outer catch
          });
        })
        .then(() => {
          console.log(`Successfully playing ${currentSegment} video and audio in sync`);
        })
        .catch(err => {
          console.error('Error starting playback:', err);
          setIsPlaying(false);
          if (onPlayPauseToggle) onPlayPauseToggle(false);
        });
    } else {
      // When toggling to pause
      console.log(`Pausing segment: ${currentSegment}`);
      video.pause();
      audio.pause();
    }
  }, [isPlaying, isLoading, currentSegment, onPlayPauseToggle, userInteracted]);
  
  // Reset both elements when segment changes
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    // Stop any playing media
    video.pause();
    audio.pause();
    
    // Reset time
    video.currentTime = 0;
    audio.currentTime = 0;
    
    // If was playing, start playing again once loaded
    const wasPlaying = isPlaying;
    setIsPlaying(false);
    
    const onLoaded = () => {
      if (wasPlaying && userInteracted) {
        setIsPlaying(true);
        if (onPlayPauseToggle) onPlayPauseToggle(true);
      }
    };
    
    if (!isLoading) {
      onLoaded();
    }
  }, [currentSegment, isLoading, onPlayPauseToggle, userInteracted]);
  
  // Handle play button click
  const handlePlayClick = () => {
    console.log(`User clicked play button. Current state: ${isPlaying ? 'playing' : 'paused'}`);
    
    if (!userInteracted) {
      console.log('First user interaction detected');
      setUserInteracted(true);
    }
    
    const newPlayState = !isPlaying;
    console.log(`Setting play state to: ${newPlayState ? 'playing' : 'paused'}`);
    
    setIsPlaying(newPlayState);
    if (onPlayPauseToggle) onPlayPauseToggle(newPlayState);
  };
  
  return (
    <div 
      ref={containerRef}
      className="bg-dark rounded-lg overflow-hidden shadow-lg relative"
    >
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
        
        {/* Video - always muted, audio comes from separate audio element */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover z-1"
          muted={true} // Always mute video to avoid autoplay restrictions
          loop={false}
          playsInline
          preload="metadata"
          onClick={handlePlayClick}
          style={{ 
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.2s ease-out'
          }}
        />
        
        {/* Audio - hidden but carries the actual sound */}
        <audio 
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
          style={{ display: 'none' }}
        />
        
        {/* Play button overlay */}
        {!isPlaying && !isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10"
            onClick={handlePlayClick}
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
        
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20">
          <p className="text-white font-medium text-lg text-center">{script[currentSegment]}</p>
        </div>
      </div>
    </div>
  );
};

export default BasicSequencePlayer;