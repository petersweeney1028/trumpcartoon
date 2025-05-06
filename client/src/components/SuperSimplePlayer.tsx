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
  
  // Object to track loaded media by segment name
  const [loadedSegments, setLoadedSegments] = useState<Record<CharacterSegment, boolean>>({
    trump1: false,
    zelensky: false,
    trump2: false,
    vance: false
  });
  
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
  
  // Preload all segment media
  useEffect(() => {
    // One-time setup to preload all media files
    const preloadAllSegments = async () => {
      const preloadMedia = (segmentName: CharacterSegment) => {
        return new Promise<void>((resolve) => {
          const segVideo = document.createElement('video');
          const segAudio = document.createElement('audio');
          
          // Get correct paths for this segment
          const vSrc = segmentName === 'trump1' ? `/static${clipInfo.trump1Video}` :
                      segmentName === 'zelensky' ? `/static${clipInfo.zelenskyVideo}` :
                      segmentName === 'trump2' ? `/static${clipInfo.trump2Video}` :
                      `/static${clipInfo.vanceVideo}`;
          
          const aSrc = segmentName === 'trump1' ? `/static${clipInfo.trump1Audio}` :
                      segmentName === 'zelensky' ? `/static${clipInfo.zelenskyAudio}` :
                      segmentName === 'trump2' ? `/static${clipInfo.trump2Audio}` :
                      `/static${clipInfo.vanceAudio}`;
          
          // Set sources
          segVideo.src = vSrc;
          segAudio.src = aSrc;
          
          // Add event listeners
          let videoLoaded = false;
          let audioLoaded = false;
          
          const checkAllLoaded = () => {
            if (videoLoaded && audioLoaded) {
              console.log(`Preloaded segment: ${segmentName}`);
              setLoadedSegments(prev => ({...prev, [segmentName]: true}));
              resolve();
            }
          };
          
          segVideo.addEventListener('canplaythrough', () => {
            videoLoaded = true;
            checkAllLoaded();
          });
          
          segAudio.addEventListener('canplaythrough', () => {
            audioLoaded = true;
            checkAllLoaded();
          });
          
          // Start loading
          segVideo.load();
          segAudio.load();
          
          // Set timeout to resolve anyway after 5 seconds to prevent hanging
          setTimeout(() => {
            if (!videoLoaded || !audioLoaded) {
              console.warn(`Timeout preloading ${segmentName}, continuing anyway`);
              setLoadedSegments(prev => ({...prev, [segmentName]: true}));
              resolve();
            }
          }, 5000);
        });
      };
      
      // Preload all segments in parallel
      try {
        await Promise.all(segments.map(segment => preloadMedia(segment)));
        console.log("All segments preloaded");
      } catch (error) {
        console.error("Error preloading segments:", error);
      }
    };
    
    preloadAllSegments();
  }, [clipInfo]); // Only run once on component mount
  
  // Handle media loading events for current segment
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
    
    // Check if already loaded
    if (video.readyState >= 3) handleVideoCanPlay();
    if (audio.readyState >= 3) handleAudioCanPlay();
    
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
      
      // Auto-play when media is loaded
      startPlayback();
    }
  }, [loadedMedia, currentSegment]);
  
  // Handle media ended to go to next segment - use BOTH audio and video ended for redundancy
  useEffect(() => {
    const audio = audioRef.current;
    const video = videoRef.current;
    
    if (!audio || !video) return;
    
    // Flag to track if we've already moved to the next segment (prevent double transitions)
    let transitionInProgress = false;
    
    const moveToNextSegment = () => {
      // Prevent double transitions
      if (transitionInProgress) return;
      transitionInProgress = true;
      
      console.log(`Media for ${currentSegment} ended`);
      
      // Find the index of current segment
      const currentIndex = segments.indexOf(currentSegment);
      
      // If there's a next segment, load it
      if (currentIndex >= 0 && currentIndex < segments.length - 1) {
        const nextSegment = segments[currentIndex + 1];
        console.log(`Moving to next segment: ${nextSegment}`);
        
        // Verify the segment is preloaded before transitioning
        if (loadedSegments[nextSegment]) {
          setCurrentSegment(nextSegment);
        } else {
          console.log(`Waiting for ${nextSegment} to preload...`);
          
          // Set a timeout in case preloading is taking too long
          const timeoutId = setTimeout(() => {
            console.log(`Timeout waiting for ${nextSegment} preload, moving anyway`);
            setCurrentSegment(nextSegment);
          }, 1000);
          
          // Wait for preload to complete
          const checkPreloadInterval = setInterval(() => {
            if (loadedSegments[nextSegment]) {
              clearTimeout(timeoutId);
              clearInterval(checkPreloadInterval);
              setCurrentSegment(nextSegment);
            }
          }, 100);
        }
      } else {
        // End of sequence
        console.log('End of sequence reached');
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      }
    };
    
    // Set up event listeners for both audio and video (for redundancy)
    const handleAudioEnded = () => {
      console.log(`Audio for ${currentSegment} ended`);
      moveToNextSegment();
    };
    
    const handleVideoEnded = () => {
      console.log(`Video for ${currentSegment} ended`);
      
      // Only use video ending as trigger if audio hasn't already ended
      // This redundancy helps with segments where audio might not play properly
      if (!audio.ended) {
        console.warn(`Audio didn't end but video did for ${currentSegment} - using video end as trigger`);
        moveToNextSegment();
      }
    };
    
    // Set up event listeners for both
    audio.addEventListener('ended', handleAudioEnded);
    video.addEventListener('ended', handleVideoEnded);
    
    // Also set up a timeout as last-resort fallback (in case both ended events don't fire)
    const safetyTimeout = setTimeout(() => {
      // Check if neither has reported ending but both should be done
      if (!audio.ended && !video.ended && !audio.paused && !video.paused) {
        // Calculate if we've gone past the expected duration
        const expectedDuration = audio.duration || video.duration || 0;
        const currentTime = audio.currentTime || video.currentTime || 0;
        
        if (expectedDuration > 0 && currentTime >= expectedDuration - 0.5) {
          console.warn(`Timeout triggered transition for ${currentSegment}`);
          moveToNextSegment();
        }
      }
    }, 15000); // 15 seconds as max segment length safety
    
    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
      video.removeEventListener('ended', handleVideoEnded);
      clearTimeout(safetyTimeout);
    };
  }, [currentSegment, segments, onPlayPauseToggle, loadedSegments]);
  
  // Start playback of both video and audio with fallback mechanisms
  const startPlayback = async () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio || isLoading) return;
    
    try {
      console.log(`Starting playback of ${currentSegment}`);
      
      // Reset both to start
      video.currentTime = 0;
      audio.currentTime = 0;
      
      // Set up automatic retry for problematic segments (particularly Vance)
      let retryCount = 0;
      const maxRetries = 3;
      
      // Wrap play attempts in a function to enable retrying
      const attemptPlayback = async (): Promise<boolean> => {
        try {
          // Create a promise that resolves when the media is playing or rejects on error
          const videoPlayPromise = video.play();
          
          // Start audio right after video (no need to await video - they should start together)
          const audioPlayPromise = audio.play();
          
          // Wait for both to start
          await Promise.all([videoPlayPromise, audioPlayPromise]);
          
          console.log(`Both video and audio for ${currentSegment} started successfully`);
          return true;
        } catch (err) {
          console.warn(`Attempt ${retryCount + 1} failed for ${currentSegment}:`, err);
          
          // Special handling for autoplay restrictions
          if (err instanceof DOMException && err.name === "NotAllowedError") {
            console.warn("Autoplay prevented by browser policy. Trying muted playback first...");
            
            try {
              // First ensure video is muted (should be already, but just in case)
              video.muted = true;
              
              // Try to play video first
              await video.play();
              
              // Then unmute and play audio
              try {
                await audio.play();
                console.log("Successfully started playback after autoplay workaround");
                return true;
              } catch (audioErr) {
                console.error("Audio still failed after video started:", audioErr);
                return false;
              }
            } catch (muteErr) {
              console.error("Even muted video playback failed:", muteErr);
              return false;
            }
          }
          
          // For other errors, retry if we haven't reached max retries
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying playback attempt ${retryCount}/${maxRetries}`);
            
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 300));
            return await attemptPlayback();
          }
          
          return false;
        }
      };
      
      // Attempt playback with retry support
      const playbackSucceeded = await attemptPlayback();
      
      if (playbackSucceeded) {
        // Successfully playing both video and audio
        setIsPlaying(true);
        if (onPlayPauseToggle) onPlayPauseToggle(true);
      } else {
        console.error(`Failed to play ${currentSegment} after ${maxRetries} attempts`);
        
        // Try to continue to next segment if we're having problems with the current one
        if (currentSegment !== segments[segments.length - 1]) {
          console.log("Skipping problematic segment");
          const currentIndex = segments.indexOf(currentSegment);
          const nextSegment = segments[currentIndex + 1];
          setCurrentSegment(nextSegment);
        } else {
          pausePlayback();
        }
      }
    } catch (err) {
      console.error("Unexpected error in playback:", err);
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