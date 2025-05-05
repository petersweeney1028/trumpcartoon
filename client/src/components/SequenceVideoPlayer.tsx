import React, { useState, useRef, useEffect, useCallback } from "react";
import { ClipInfo } from "@shared/schema";

interface SequenceVideoPlayerProps {
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

const SequenceVideoPlayer = ({
  clipInfo,
  script,
  onPlayPauseToggle,
  autoPlay = false
}: SequenceVideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const [allMediaLoaded, setAllMediaLoaded] = useState(false);
  
  // Track loaded segments
  const [loadedSegments, setLoadedSegments] = useState({
    trump1: false,
    zelensky: false,
    trump2: false,
    vance: false
  });
  
  // Video and audio refs
  const trump1VideoRef = useRef<HTMLVideoElement>(null);
  const zelenskyVideoRef = useRef<HTMLVideoElement>(null);
  const trump2VideoRef = useRef<HTMLVideoElement>(null);
  const vanceVideoRef = useRef<HTMLVideoElement>(null);
  
  const trump1AudioRef = useRef<HTMLAudioElement>(null);
  const zelenskyAudioRef = useRef<HTMLAudioElement>(null);
  const trump2AudioRef = useRef<HTMLAudioElement>(null);
  const vanceAudioRef = useRef<HTMLAudioElement>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  
  // Create proper paths by prepending /static to the paths
  const getStaticPath = (path: string) => {
    // Handle paths that start with /clips or /voices - add /static prefix
    if (path.startsWith('/clips/') || path.startsWith('/voices/')) {
      return `/static${path}`;
    }
    // Path already has static prefix
    if (path.startsWith('/static/')) return path;
    // Default case - just return as is
    return path;
  };
  
  // Paths for all video and audio files
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
  
  // Store audio durations to calculate segment boundaries
  const [audioDurations, setAudioDurations] = useState({
    trump1: 0,
    zelensky: 0,
    trump2: 0,
    vance: 0
  });
  
  // Segment boundaries and timing information
  const [segmentBoundaries, setSegmentBoundaries] = useState<{
    [key in CharacterSegment]: { start: number; end: number; duration: number }
  }>({
    trump1: { start: 0, end: 0, duration: 0 },
    zelensky: { start: 0, end: 0, duration: 0 },
    trump2: { start: 0, end: 0, duration: 0 },
    vance: { start: 0, end: 0, duration: 0 }
  });
  
  // Sequence of segments to play
  const sequence: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance'];
  
  // Set up media loading handlers
  const handleVideoLoaded = useCallback((segment: CharacterSegment) => {
    console.log(`${segment} video loaded`);
    setLoadedSegments(prev => ({
      ...prev,
      [segment]: true
    }));
  }, []);
  
  const handleAudioLoaded = useCallback((segment: CharacterSegment) => {
    const audioRefs = {
      trump1: trump1AudioRef,
      zelensky: zelenskyAudioRef,
      trump2: trump2AudioRef,
      vance: vanceAudioRef
    };
    
    const audioRef = audioRefs[segment].current;
    if (audioRef) {
      console.log(`${segment} audio loaded, duration: ${audioRef.duration}`);
      setAudioDurations(prev => ({
        ...prev,
        [segment]: audioRef.duration
      }));
    }
  }, []);
  
  // Calculate segment boundaries once all audio is loaded
  useEffect(() => {
    // Don't proceed until all segments are loaded
    const allSegmentsLoaded = Object.values(loadedSegments).every(loaded => loaded);
    if (!allSegmentsLoaded) return;
    
    // Check if all audio durations are available
    const allDurationsAvailable = Object.values(audioDurations).every(duration => duration > 0);
    if (!allDurationsAvailable) return;
    
    console.log("All media loaded. Calculating segment boundaries...");
    
    // Calculate segment boundaries based on audio durations
    let totalTime = 0;
    const boundaries = { ...segmentBoundaries };
    
    sequence.forEach(segment => {
      const duration = audioDurations[segment];
      boundaries[segment] = {
        start: totalTime,
        end: totalTime + duration,
        duration: duration
      };
      totalTime += duration;
    });
    
    setSegmentBoundaries(boundaries);
    setDuration(totalTime);
    setAllMediaLoaded(true);
    setInitializing(false);
    
    console.log("Segment boundaries:", boundaries);
    console.log("Total duration:", totalTime);
    
    // Start autoplay if enabled
    if (autoPlay) {
      // Use small timeout to allow UI to update first
      setTimeout(() => {
        setIsPlaying(true);
        if (onPlayPauseToggle) {
          onPlayPauseToggle(true);
        }
      }, 100);
    }
  }, [loadedSegments, audioDurations, autoPlay, onPlayPauseToggle]);
  
  // Get the current segment based on playback time
  const getSegmentForTime = useCallback((time: number): CharacterSegment => {
    if (time <= 0) return 'trump1';
    if (time >= duration) return 'vance';
    
    for (const segment of sequence) {
      const { start, end } = segmentBoundaries[segment];
      if (time >= start && time < end) {
        return segment;
      }
    }
    
    return 'trump1'; // Default to first segment
  }, [segmentBoundaries, duration, sequence]);
  
  // Update current segment when time changes
  useEffect(() => {
    if (initializing || !allMediaLoaded) return;
    
    const newSegment = getSegmentForTime(currentTime);
    if (newSegment !== currentSegment) {
      console.log(`Switching to segment: ${newSegment} at time ${currentTime}`);
      setCurrentSegment(newSegment);
    }
    
    // Update progress percentage
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  }, [currentTime, getSegmentForTime, currentSegment, duration, initializing, allMediaLoaded]);
  
  // Animation frame for time tracking
  const updatePlayback = useCallback(() => {
    if (!isPlaying || initializing || !allMediaLoaded) return;
    
    setCurrentTime(prevTime => {
      // Update 60 times per second for smooth playback
      const newTime = Math.min(prevTime + (1/60), duration);
      
      // Check if we need to transition to next segment
      const currentSeg = getSegmentForTime(prevTime);
      const nextSeg = getSegmentForTime(newTime);
      
      // Log segment transitions for debugging
      if (currentSeg !== nextSeg) {
        console.log(`Auto-transitioning from ${currentSeg} to ${nextSeg} at time ${newTime}`);
      }
      
      // Check if playback has ended
      if (newTime >= duration) {
        console.log("Playback complete, resetting to beginning");
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
        // Set a small timeout before resetting to avoid race conditions
        setTimeout(() => setCurrentTime(0), 50);
        return prevTime; // Return current time to avoid jump
      }
      
      return newTime;
    });
    
    animationRef.current = requestAnimationFrame(updatePlayback);
  }, [isPlaying, duration, onPlayPauseToggle, initializing, allMediaLoaded, getSegmentForTime]);
  
  // Start/stop animation frame based on playback state
  useEffect(() => {
    if (isPlaying && !initializing && allMediaLoaded) {
      animationRef.current = requestAnimationFrame(updatePlayback);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, updatePlayback, initializing, allMediaLoaded]);
  
  // Handle segment change - manage video and audio elements
  useEffect(() => {
    if (initializing || !allMediaLoaded) return;
    
    const videoRefs = {
      trump1: trump1VideoRef,
      zelensky: zelenskyVideoRef,
      trump2: trump2VideoRef,
      vance: vanceVideoRef
    };
    
    const audioRefs = {
      trump1: trump1AudioRef,
      zelensky: zelenskyAudioRef,
      trump2: trump2AudioRef,
      vance: vanceAudioRef
    };
    
    console.log(`Switching to segment: ${currentSegment} at time ${currentTime}`);
    
    // Pause all audio first to prevent overlap
    sequence.forEach(segment => {
      const audioRef = audioRefs[segment];
      if (audioRef.current && segment !== currentSegment) {
        audioRef.current.pause();
      }
    });
    
    // Hide all videos first
    sequence.forEach(segment => {
      const videoRef = videoRefs[segment];
      if (videoRef.current) {
        if (segment === currentSegment) {
          // Show current segment
          videoRef.current.style.opacity = '1';
          videoRef.current.style.zIndex = '1';
        } else {
          // Hide other segments
          videoRef.current.style.opacity = '0';
          videoRef.current.style.zIndex = '0';
          
          // If we were previously playing, pause all other videos
          if (isPlaying) {
            videoRef.current.pause();
          }
        }
      }
    });
    
    // Handle current segment's video and audio
    const currentVideo = videoRefs[currentSegment].current;
    const currentAudio = audioRefs[currentSegment].current;
    
    if (currentVideo && currentAudio) {
      const { start } = segmentBoundaries[currentSegment];
      const segmentTime = Math.max(0, currentTime - start);
      
      console.log(`Playing ${currentSegment} at segment time ${segmentTime}`);
      
      // First make sure audio is ready
      currentAudio.muted = isMuted;
      currentAudio.currentTime = segmentTime;
      
      // Reset and prepare video
      currentVideo.currentTime = 0; // Always reset video position to start
      currentVideo.loop = true; // Loop video if audio is longer
      
      if (isPlaying) {
        // Create promises for both media elements
        const videoPromise = currentVideo.play()
          .catch(e => console.error(`Error playing ${currentSegment} video:`, e));
        
        const audioPromise = currentAudio.play()
          .catch(e => console.error(`Error playing ${currentSegment} audio:`, e));
        
        // Handle synchronization
        Promise.all([videoPromise, audioPromise])
          .then(() => {
            console.log(`${currentSegment} video and audio playing in sync`);
          })
          .catch(err => {
            console.error('Error synchronizing media:', err);
            
            // Try again with timeout as fallback
            setTimeout(() => {
              if (isPlaying && currentSegment === getSegmentForTime(currentTime)) {
                currentVideo.play().catch(() => {});
                currentAudio.play().catch(() => {});
              }
            }, 100);
          });
      }
    }
  }, [currentSegment, isPlaying, isMuted, currentTime, segmentBoundaries, sequence, initializing, allMediaLoaded, getSegmentForTime]);
  
  // Play/pause toggling
  const togglePlayPause = useCallback(() => {
    if (initializing || !allMediaLoaded) return;
    
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    if (onPlayPauseToggle) {
      onPlayPauseToggle(newPlayingState);
    }
  }, [isPlaying, onPlayPauseToggle, initializing, allMediaLoaded]);
  
  // Mute toggling
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Apply to current audio
    const audioRefs = {
      trump1: trump1AudioRef,
      zelensky: zelenskyAudioRef,
      trump2: trump2AudioRef,
      vance: vanceAudioRef
    };
    
    sequence.forEach(segment => {
      const audioRef = audioRefs[segment];
      if (audioRef.current) {
        audioRef.current.muted = newMutedState;
      }
    });
  }, [isMuted, sequence]);
  
  // Skip to a specific segment
  const skipToSegment = useCallback((index: number) => {
    if (initializing || !allMediaLoaded || index < 0 || index >= sequence.length) return;
    
    const segment = sequence[index];
    const { start } = segmentBoundaries[segment];
    
    // Set time to the start of the segment
    setCurrentTime(start);
  }, [segmentBoundaries, sequence, initializing, allMediaLoaded]);
  
  // Progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (initializing || !allMediaLoaded || duration <= 0) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    setCurrentTime(newTime);
  }, [duration, initializing, allMediaLoaded]);
  
  // Format time for display
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
  
  // Get current caption
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
        {initializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white mt-4">Loading media...</p>
            </div>
          </div>
        )}
        
        {/* Video Players stacked on top of each other */}
        <div className="absolute inset-0">
          {sequence.map(segment => (
            <video
              key={segment}
              ref={
                segment === 'trump1' ? trump1VideoRef :
                segment === 'zelensky' ? zelenskyVideoRef :
                segment === 'trump2' ? trump2VideoRef : vanceVideoRef
              }
              src={videoPaths[segment]}
              className="absolute inset-0 w-full h-full object-cover"
              muted // We use separate audio elements
              loop // Loop video while audio plays
              preload="auto"
              playsInline
              crossOrigin="anonymous"
              style={{ 
                opacity: segment === currentSegment ? 1 : 0,
                zIndex: segment === currentSegment ? 1 : 0,
                transition: 'opacity 0.2s ease-out' 
              }}
              onLoadedData={() => handleVideoLoaded(segment)}
              onError={(e) => console.error(`Error loading ${segment} video:`, e)}
              onClick={togglePlayPause}
            />
          ))}
        </div>
        
        {/* Play button overlay (visible when paused) */}
        {!isPlaying && !initializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
            <button
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors"
              onClick={togglePlayPause}
              aria-label="Play video"
              disabled={initializing}
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
                disabled={initializing}
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
              <span className="text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
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
            ref={
              segment === 'trump1' ? trump1AudioRef :
              segment === 'zelensky' ? zelenskyAudioRef :
              segment === 'trump2' ? trump2AudioRef : vanceAudioRef
            }
            src={audioPaths[segment]}
            preload="auto"
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

export default SequenceVideoPlayer;