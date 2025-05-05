import React, { useState, useRef, useEffect, useCallback } from "react";
import { ClipInfo } from "@shared/schema";

interface FixedSequencePlayerProps {
  clipInfo: ClipInfo;
  script: {
    trump1: string;
    zelensky: string;
    trump2: string;
    vance: string;
  };
  onPlayPauseToggle?: (isPlaying: boolean) => void;
  autoPlay?: boolean;
}

type CharacterSegment = 'trump1' | 'zelensky' | 'trump2' | 'vance';

/**
 * FixedSequencePlayer - A fixed and correctly implemented version of the sequence player
 * that properly synchronizes audio and video without playback issues
 */
const FixedSequencePlayer: React.FC<FixedSequencePlayerProps> = ({
  clipInfo,
  script,
  onPlayPauseToggle,
  autoPlay = false
}) => {
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Track loaded media
  const [loadedMedia, setLoadedMedia] = useState({
    trump1: false,
    zelensky: false,
    trump2: false,
    vance: false
  });
  
  // Track media durations
  const [mediaDurations, setMediaDurations] = useState({
    trump1: 0,
    zelensky: 0,
    trump2: 0,
    vance: 0
  });
  
  // Store segment boundaries
  const [segmentBoundaries, setSegmentBoundaries] = useState({
    trump1: { start: 0, end: 0 },
    zelensky: { start: 0, end: 0 },
    trump2: { start: 0, end: 0 },
    vance: { start: 0, end: 0 }
  });
  
  // Media references
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs for media elements
  const videoRefs = {
    trump1: useRef<HTMLVideoElement>(null),
    zelensky: useRef<HTMLVideoElement>(null),
    trump2: useRef<HTMLVideoElement>(null),
    vance: useRef<HTMLVideoElement>(null)
  };
  
  const audioRefs = {
    trump1: useRef<HTMLAudioElement>(null),
    zelensky: useRef<HTMLAudioElement>(null),
    trump2: useRef<HTMLAudioElement>(null),
    vance: useRef<HTMLAudioElement>(null)
  };
  
  // Animation frame ref for smooth progress updates
  const animationFrameRef = useRef<number>();
  
  // Define the sequence order
  const sequence: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance'];
  
  // Create proper paths for resources
  const getStaticPath = (path: string) => {
    if (path.startsWith('/clips/') || path.startsWith('/voices/')) {
      return `/static${path}`;
    }
    if (path.startsWith('/static/')) return path;
    return path;
  };
  
  // Prepare media paths
  const videoPaths = {
    trump1: getStaticPath(clipInfo.trump1Video),
    zelensky: getStaticPath(clipInfo.zelenskyVideo),
    trump2: getStaticPath(clipInfo.trump2Video),
    vance: getStaticPath(clipInfo.vanceVideo)
  };
  
  const audioPaths = {
    trump1: getStaticPath(clipInfo.trump1Audio),
    zelensky: getStaticPath(clipInfo.zelenskyAudio),
    trump2: getStaticPath(clipInfo.trump2Audio),
    vance: getStaticPath(clipInfo.vanceAudio)
  };
  
  // Pause all media elements
  const pauseAllMedia = useCallback(() => {
    sequence.forEach(segment => {
      const video = videoRefs[segment].current;
      const audio = audioRefs[segment].current;
      
      if (video) {
        video.pause();
      }
      
      if (audio) {
        audio.pause();
      }
    });
  }, [sequence]);
  
  // Get the next segment in sequence
  const getNextSegment = useCallback((segment: CharacterSegment): CharacterSegment | null => {
    const currentIndex = sequence.indexOf(segment);
    if (currentIndex < sequence.length - 1) {
      return sequence[currentIndex + 1];
    }
    return null; // No next segment (end of sequence)
  }, [sequence]);
  
  // Play a specific segment
  const playSegment = useCallback((segment: CharacterSegment) => {
    console.log(`Playing segment ${segment}`);
    
    // Pause all media first
    pauseAllMedia();
    
    // Update current segment state
    setCurrentSegment(segment);
    
    // Get media elements
    const video = videoRefs[segment].current;
    const audio = audioRefs[segment].current;
    
    if (!video || !audio) {
      console.error(`Missing media elements for ${segment}`);
      return;
    }
    
    try {
      // Reset positions
      video.currentTime = 0;
      audio.currentTime = 0;
      
      // Ensure video doesn't loop
      video.loop = false;
      
      // Set mute state
      audio.muted = isMuted;
      
      // Play both elements
      Promise.all([
        video.play().catch(e => console.error(`Error playing ${segment} video:`, e)),
        audio.play().catch(e => console.error(`Error playing ${segment} audio:`, e))
      ])
        .then(() => {
          console.log(`${segment} playback started successfully`);
          setIsPlaying(true);
          if (onPlayPauseToggle) onPlayPauseToggle(true);
        })
        .catch(error => {
          console.error('Error starting playback:', error);
          setIsPlaying(false);
          if (onPlayPauseToggle) onPlayPauseToggle(false);
        });
    } catch (error) {
      console.error('Error in playSegment:', error);
    }
  }, [isMuted, onPlayPauseToggle, pauseAllMedia]);
  
  // Handle audio loaded event
  const handleAudioLoaded = useCallback((segment: CharacterSegment) => {
    const audio = audioRefs[segment].current;
    if (!audio) return;
    
    const duration = audio.duration;
    console.log(`Audio loaded for ${segment}, duration:`, duration);
    
    // Update durations state
    setMediaDurations(prev => ({
      ...prev,
      [segment]: duration
    }));
    
    // Mark segment as loaded
    setLoadedMedia(prev => ({
      ...prev,
      [segment]: true
    }));
  }, []);
  
  // Handle video loaded event
  const handleVideoLoaded = useCallback((segment: CharacterSegment) => {
    console.log(`Video loaded for ${segment}`);
  }, []);
  
  // Calculate segment boundaries when all media is loaded
  useEffect(() => {
    // Check if all segments are loaded
    const allLoaded = Object.values(loadedMedia).every(loaded => loaded);
    if (!allLoaded) return;
    
    // Skip if already calculated
    if (totalDuration > 0) return;
    
    console.log("All media loaded. Calculating boundaries...");
    
    // Calculate boundaries and total duration
    let totalTime = 0;
    const boundaries = { ...segmentBoundaries };
    
    sequence.forEach(segment => {
      const duration = mediaDurations[segment];
      boundaries[segment] = {
        start: totalTime,
        end: totalTime + duration
      };
      totalTime += duration;
    });
    
    setSegmentBoundaries(boundaries);
    setTotalDuration(totalTime);
    setLoading(false);
    
    console.log("Segment boundaries:", boundaries);
    console.log("Total duration:", totalTime);
  }, [loadedMedia, mediaDurations, sequence, segmentBoundaries, totalDuration]);
  
  // Update progress bar
  useEffect(() => {
    if (loading || totalDuration === 0) return;
    
    const progressPercentage = (currentTime / totalDuration) * 100;
    setProgress(progressPercentage);
  }, [currentTime, totalDuration, loading]);
  
  // Listen for audio ended events to trigger next segment
  useEffect(() => {
    // Handlers object to store references for cleanup
    const handlers: Record<CharacterSegment, EventListener> = {} as any;
    
    // Create handler function for each segment
    sequence.forEach(segment => {
      const handleEnded = () => {
        console.log(`Audio for ${segment} ended`);
        
        // Get next segment
        const nextSegment = getNextSegment(segment);
        
        if (nextSegment) {
          // Play next segment
          playSegment(nextSegment);
        } else {
          // End of sequence
          console.log("End of sequence reached");
          setIsPlaying(false);
          if (onPlayPauseToggle) onPlayPauseToggle(false);
          setCurrentTime(0);
        }
      };
      
      // Store handler reference
      handlers[segment] = handleEnded;
      
      // Add event listener
      const audio = audioRefs[segment].current;
      if (audio) {
        audio.addEventListener('ended', handleEnded);
      }
    });
    
    // Clean up listeners on unmount
    return () => {
      sequence.forEach(segment => {
        const audio = audioRefs[segment].current;
        if (audio) {
          audio.removeEventListener('ended', handlers[segment]);
        }
      });
    };
  }, [sequence, getNextSegment, playSegment, onPlayPauseToggle]);
  
  // Update current time during playback
  useEffect(() => {
    if (!isPlaying || loading) return;
    
    // Cancel any existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Update function for animation frame
    const updateTime = () => {
      const audio = audioRefs[currentSegment].current;
      
      if (audio) {
        // Calculate global time based on segment start + current audio time
        const segmentStart = segmentBoundaries[currentSegment].start;
        const globalTime = segmentStart + audio.currentTime;
        
        setCurrentTime(globalTime);
      }
      
      // Continue loop
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };
    
    // Start the update loop
    animationFrameRef.current = requestAnimationFrame(updateTime);
    
    // Clean up
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentSegment, segmentBoundaries, loading]);
  
  // Handle autoplay
  useEffect(() => {
    if (autoPlay && !loading && totalDuration > 0) {
      console.log("Starting autoplay");
      const timer = setTimeout(() => {
        playSegment('trump1');
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [autoPlay, loading, totalDuration, playSegment]);
  
  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (loading) return;
    
    if (isPlaying) {
      // Pause playback
      pauseAllMedia();
      setIsPlaying(false);
      if (onPlayPauseToggle) onPlayPauseToggle(false);
    } else {
      // Find current segment based on time
      let segmentToPlay = sequence[0];
      
      for (const segment of sequence) {
        const { start, end } = segmentBoundaries[segment];
        if (currentTime >= start && currentTime < end) {
          segmentToPlay = segment;
          break;
        }
      }
      
      // Calculate offset within segment
      const segmentStart = segmentBoundaries[segmentToPlay].start;
      const segmentOffset = Math.max(0, currentTime - segmentStart);
      
      // Get media elements
      const audio = audioRefs[segmentToPlay].current;
      const video = videoRefs[segmentToPlay].current;
      
      if (audio && video) {
        // Position audio at offset
        audio.currentTime = segmentOffset;
        
        // Start playback
        setCurrentSegment(segmentToPlay);
        
        // Play segment
        Promise.all([
          video.play().catch(e => console.error(`Error playing ${segmentToPlay} video:`, e)),
          audio.play().catch(e => console.error(`Error playing ${segmentToPlay} audio:`, e))
        ])
          .then(() => {
            setIsPlaying(true);
            if (onPlayPauseToggle) onPlayPauseToggle(true);
          })
          .catch(error => {
            console.error('Error resuming playback:', error);
          });
      }
    }
  }, [isPlaying, loading, currentTime, segmentBoundaries, sequence, pauseAllMedia, onPlayPauseToggle]);
  
  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    // Apply to all audio elements
    sequence.forEach(segment => {
      const audio = audioRefs[segment].current;
      if (audio) {
        audio.muted = newMuteState;
      }
    });
  }, [isMuted, sequence]);
  
  // Skip to segment
  const skipToSegment = useCallback((index: number) => {
    if (loading || index < 0 || index >= sequence.length) return;
    
    const segment = sequence[index];
    
    if (isPlaying) {
      playSegment(segment);
    } else {
      setCurrentSegment(segment);
      setCurrentTime(segmentBoundaries[segment].start);
    }
  }, [loading, sequence, isPlaying, playSegment, segmentBoundaries]);
  
  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (loading || totalDuration <= 0) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * totalDuration;
    
    // Find which segment this time belongs to
    let segmentToPlay = sequence[0];
    for (const segment of sequence) {
      const { start, end } = segmentBoundaries[segment];
      if (newTime >= start && newTime < end) {
        segmentToPlay = segment;
        break;
      }
    }
    
    // Calculate offset within segment
    const segmentStart = segmentBoundaries[segmentToPlay].start;
    const segmentOffset = Math.max(0, newTime - segmentStart);
    
    // Update current time
    setCurrentTime(newTime);
    
    // Handle based on play state
    if (isPlaying) {
      // Pause everything
      pauseAllMedia();
      
      // Update segment
      setCurrentSegment(segmentToPlay);
      
      // Get media elements
      const audio = audioRefs[segmentToPlay].current;
      const video = videoRefs[segmentToPlay].current;
      
      if (audio && video) {
        // Position audio at offset
        audio.currentTime = segmentOffset;
        
        // Play
        Promise.all([
          video.play().catch(e => console.error(`Error playing ${segmentToPlay} video:`, e)),
          audio.play().catch(e => console.error(`Error playing ${segmentToPlay} audio:`, e))
        ]);
      }
    } else {
      // Just update segment
      setCurrentSegment(segmentToPlay);
    }
  }, [loading, totalDuration, sequence, segmentBoundaries, isPlaying, pauseAllMedia]);
  
  // Format time display
  const formatTime = useCallback((timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, []);
  
  // Mouse hover for controls
  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, [isPlaying]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pauseAllMedia();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pauseAllMedia]);
  
  // Current caption
  const currentCaption = script[currentSegment];
  
  return (
    <div 
      ref={containerRef}
      className="bg-dark rounded-lg overflow-hidden shadow-lg relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative pt-[56.25%]">
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white mt-4">Loading media...</p>
            </div>
          </div>
        )}
        
        {/* Video elements */}
        <div className="absolute inset-0">
          {sequence.map(segment => (
            <video
              key={segment}
              ref={videoRefs[segment]}
              src={videoPaths[segment]}
              className="absolute inset-0 w-full h-full object-cover"
              muted // Always muted - we use separate audio elements
              loop={false} // Important! No looping
              preload="auto"
              playsInline
              crossOrigin="anonymous"
              style={{ 
                opacity: segment === currentSegment ? 1 : 0,
                zIndex: segment === currentSegment ? 1 : 0,
                transition: 'opacity 0.2s ease-out',
                display: segment === currentSegment ? 'block' : 'none' // Hide non-visible videos
              }}
              onClick={togglePlayPause}
              onLoadedData={() => handleVideoLoaded(segment)}
              onError={(e) => console.error(`Error loading ${segment} video:`, e)}
            />
          ))}
        </div>
        
        {/* Play button overlay */}
        {!isPlaying && !loading && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10"
            onClick={togglePlayPause}
          >
            <button
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors"
              aria-label="Play video"
              disabled={loading}
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
        
        {/* Video controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="flex items-center justify-between text-white mb-2">
            <div className="flex items-center gap-2">
              <button
                className="hover:text-primary transition-colors"
                onClick={togglePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
                disabled={loading}
              >
                {isPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                )}
              </button>
              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-1">
                {sequence.map((segment, index) => (
                  <div
                    key={segment}
                    className={`w-6 h-1 rounded-full cursor-pointer ${
                      currentSegment === segment ? 'bg-primary' : 'bg-white/30'
                    }`}
                    onClick={() => skipToSegment(index)}
                  ></div>
                ))}
              </div>
              <button
                className="hover:text-primary transition-colors"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div
            className="h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Caption */}
          <div className="mt-3 text-center">
            <p className="text-white font-medium text-lg">{currentCaption}</p>
          </div>
        </div>
        
        {/* Hidden audio players for each character */}
        {sequence.map(segment => (
          <audio 
            key={`audio-${segment}`}
            ref={audioRefs[segment]}
            src={audioPaths[segment]}
            preload="metadata" 
            autoPlay={false}
            muted={isMuted}
            style={{ display: 'none' }}
            onLoadedData={() => handleAudioLoaded(segment)}
            onError={(e) => console.error(`Error loading ${segment} audio:`, e)}
          />
        ))}
      </div>
    </div>
  );
};

export default FixedSequencePlayer;