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
 * SuperSimplePlayer - A very basic video player that uses browser's native video element
 * with minimal customization. This should work reliably in most browsers.
 */
const SuperSimplePlayer: React.FC<SuperSimplePlayerProps> = ({
  clipInfo,
  script,
  onPlayPauseToggle
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  
  // Just one video ref
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Segments in order
  const segments: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance']; 
  
  // Get current video path
  const videoSrc = 
    currentSegment === 'trump1' ? `/static${clipInfo.trump1Video}` :
    currentSegment === 'zelensky' ? `/static${clipInfo.zelenskyVideo}` :
    currentSegment === 'trump2' ? `/static${clipInfo.trump2Video}` :
    `/static${clipInfo.vanceVideo}`;
  
  // When segment changes, load the new video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Set up a one-time event listener for when video is ready
    const handleCanPlay = () => {
      console.log(`Video ${currentSegment} is ready to play`);
      
      // Try to autoplay when first loaded
      if (!isPlaying) {
        try {
          video.play().then(() => {
            console.log("Started playing automatically");
            setIsPlaying(true);
            if (onPlayPauseToggle) onPlayPauseToggle(true);
          }).catch(err => {
            console.error("Could not autoplay:", err);
          });
        } catch (err) {
          console.error("Error attempting to play:", err);
        }
      }
      
      // Remove the listener after it fires once
      video.removeEventListener('canplay', handleCanPlay);
    };
    
    // Handle video ending = go to next segment
    const handleEnded = () => {
      console.log(`Video for ${currentSegment} ended`);
      
      // Find the index of current segment
      const currentIndex = segments.indexOf(currentSegment);
      
      // If there's a next segment, play it
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
    
    // Set event listeners
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    
    // Cleanup
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentSegment, isPlaying, onPlayPauseToggle, segments]);
  
  // Toggle play/pause
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      console.log(`Playing video: ${currentSegment}`);
      video.play().then(() => {
        setIsPlaying(true);
        if (onPlayPauseToggle) onPlayPauseToggle(true);
      }).catch(err => {
        console.error("Could not play:", err);
      });
    } else {
      console.log(`Pausing video: ${currentSegment}`);
      video.pause();
      setIsPlaying(false);
      if (onPlayPauseToggle) onPlayPauseToggle(false);
    }
  };
  
  return (
    <div className="bg-dark rounded-lg overflow-hidden shadow-lg relative">
      <div className="relative pt-[56.25%]">
        {/* Simple video element */}
        <video 
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          preload="auto"
          onClick={togglePlayPause}
        />
        
        {/* Play button overlay */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10"
            onClick={togglePlayPause}
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
          <p className="text-white font-medium text-lg text-center">
            {script[currentSegment]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperSimplePlayer;