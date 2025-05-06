import React, { useState, useRef, useEffect } from 'react';
import type { ClipInfo } from '@shared/schema';

interface MinimalPlayerProps {
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

// Browser restrictions often require a user interaction before media can autoplay
// This flag helps us track whether the user has interacted with the page
let userHasInteracted = false;

// Listen for any user interaction at the document level
document.addEventListener('click', () => {
  userHasInteracted = true;
}, { once: true });

/**
 * MinimalPlayer - The absolute simplest implementation possible
 * Uses only video element with direct attributes and minimal JavaScript
 */
const MinimalPlayer: React.FC<MinimalPlayerProps> = ({
  clipInfo,
  script,
  onPlayPauseToggle
}) => {
  // Simple state
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Segments in sequence
  const segments: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance'];
  
  // Current sources
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
  
  // Track loading state
  const [mediaReady, setMediaReady] = useState({ video: false, audio: false });
  
  // Reset loading state when segment changes
  useEffect(() => {
    setMediaReady({ video: false, audio: false });
    
    // Explicitly pause and reset both media elements
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
  }, [currentSegment]);
  
  // Set up event listeners for loading
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    // One-time event handlers to detect when media is ready
    const handleVideoReady = () => {
      console.log(`Video for ${currentSegment} ready`);
      setMediaReady(prev => ({ ...prev, video: true }));
    };
    
    const handleAudioReady = () => {
      console.log(`Audio for ${currentSegment} ready`);
      setMediaReady(prev => ({ ...prev, audio: true }));
    };
    
    // Track "can play" events for both media elements
    const videoEvents = ['canplay', 'canplaythrough', 'loadeddata'];
    const audioEvents = ['canplay', 'canplaythrough', 'loadeddata'];
    
    // Add all event listeners
    videoEvents.forEach(event => {
      video.addEventListener(event, handleVideoReady, { once: true });
    });
    
    audioEvents.forEach(event => {
      audio.addEventListener(event, handleAudioReady, { once: true });
    });
    
    // Set up logic for when current segment ends
    const handleAudioEnded = () => {
      const currentIndex = segments.indexOf(currentSegment);
      
      if (currentIndex < segments.length - 1) {
        // Stop both current media elements
        video.pause();
        audio.pause();
        
        // Move to next segment
        setCurrentSegment(segments[currentIndex + 1]);
      } else {
        // End of all segments
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      }
    };
    
    // Add ended listener
    audio.addEventListener('ended', handleAudioEnded);
    
    // Clean up all event listeners
    return () => {
      videoEvents.forEach(event => {
        video.removeEventListener(event, handleVideoReady);
      });
      
      audioEvents.forEach(event => {
        audio.removeEventListener(event, handleAudioReady);
      });
      
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [currentSegment, segments, onPlayPauseToggle]);
  
  // State to track if this is the first segment (needs user interaction)
  const [needsInitialPlay, setNeedsInitialPlay] = useState(true);

  // Start playback when both media elements are ready
  useEffect(() => {
    // Only proceed if both elements are ready
    if (!mediaReady.video || !mediaReady.audio) return;
    
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    console.log(`Both media ready for ${currentSegment}, starting playback (hasInteracted: ${userHasInteracted}, needsInitialPlay: ${needsInitialPlay})`);
    
    // Function to synchronize playback
    const playMedia = async () => {
      try {
        // Reset positions to ensure sync
        video.currentTime = 0;
        audio.currentTime = 0;
        
        // Check if this is not the first segment (auto-transition) or if user has interacted
        const canAutoplay = !needsInitialPlay || userHasInteracted;
        
        if (canAutoplay) {
          // For subsequent segments we can try autoplay
          console.log(`Attempting to play ${currentSegment} automatically`);
          
          // Play video first (it's muted so no autoplay restrictions)
          await video.play();
          
          // Then quickly play audio to stay in sync
          await audio.play();
          
          // Update UI state
          setIsPlaying(true);
          if (onPlayPauseToggle) onPlayPauseToggle(true);
          
          // Remember that we've played the first segment
          if (needsInitialPlay) {
            setNeedsInitialPlay(false);
          }
        } else {
          console.log('Waiting for user interaction before playing first segment');
          // First segment needs user interaction - we'll wait for the play button click
          setIsPlaying(false);
          if (onPlayPauseToggle) onPlayPauseToggle(false);
        }
      } catch (err) {
        console.error('Failed to play media:', err);
        
        // If we can't autoplay, show play button
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      }
    };
    
    // Start playback
    playMedia();
    
  }, [mediaReady, currentSegment, onPlayPauseToggle, needsInitialPlay]);
  
  // Handle manual play/pause
  const togglePlayPause = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    // Mark that user has interacted with the player
    userHasInteracted = true;
    
    if (isPlaying) {
      // Pause both media elements
      video.pause();
      audio.pause();
      setIsPlaying(false);
      if (onPlayPauseToggle) onPlayPauseToggle(false);
    } else {
      // Set that initial play no longer needed (user has manually played)
      setNeedsInitialPlay(false);
      
      // Reset positions to ensure sync
      video.currentTime = 0;
      audio.currentTime = 0;
      
      // Play video first (it's muted so no autoplay restrictions)
      video.play()
        .then(() => {
          // Then play audio to stay in sync
          return audio.play();
        })
        .then(() => {
          console.log(`User initiated playback of ${currentSegment}`);
          setIsPlaying(true);
          if (onPlayPauseToggle) onPlayPauseToggle(true);
        })
        .catch(err => {
          console.error('Error playing media after user interaction:', err);
          // This is a more serious error since user has interacted
          alert('Could not play media. Please check if your device supports audio playback.');
        });
    }
  };
  
  // Calculate if media is currently loading
  const isLoading = !mediaReady.video || !mediaReady.audio;
  
  return (
    <div className="bg-dark rounded-lg overflow-hidden shadow-lg relative">
      <div className="relative pt-[56.25%]">
        {/* Video element */}
        <video 
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          preload="auto"
          muted={true} // Mute since audio comes from audio element
          onClick={togglePlayPause}
          style={{ opacity: isLoading ? 0.5 : 1 }}
        />
        
        {/* Hidden audio element */}
        <audio 
          ref={audioRef}
          src={audioSrc}
          preload="auto"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white text-sm mt-2">Loading {currentSegment}...</p>
            </div>
          </div>
        )}
        
        {/* Play button - only show when not loading and not playing */}
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
        
        {/* Pause button - only show when playing and not loading */}
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
            {script[currentSegment]}
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-10">
          <div 
            className="h-full bg-primary" 
            style={{ 
              width: `${(segments.indexOf(currentSegment) / (segments.length-1)) * 100}%`,
              transition: 'width 0.5s ease-out'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MinimalPlayer;