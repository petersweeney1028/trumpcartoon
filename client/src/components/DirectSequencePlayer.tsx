import React, { useState, useRef, useEffect, useCallback } from "react";
import { ClipInfo } from "@shared/schema";

interface DirectSequencePlayerProps {
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

const DirectSequencePlayer: React.FC<DirectSequencePlayerProps> = ({
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
  
  // Media references
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{[key in CharacterSegment]: HTMLVideoElement | null}>({
    trump1: null,
    zelensky: null,
    trump2: null,
    vance: null
  });
  
  const audioRefs = useRef<{[key in CharacterSegment]: HTMLAudioElement | null}>({
    trump1: null,
    zelensky: null,
    trump2: null,
    vance: null
  });
  
  // Timing information
  const segmentInfoRef = useRef<{
    sequence: CharacterSegment[];
    durations: {[key in CharacterSegment]: number};
    totalDuration: number;
    boundaries: {[key in CharacterSegment]: {start: number; end: number}};
    loadedSegments: {[key in CharacterSegment]: boolean};
  }>({
    sequence: ['trump1', 'zelensky', 'trump2', 'vance'],
    durations: {
      trump1: 0,
      zelensky: 0,
      trump2: 0,
      vance: 0
    },
    totalDuration: 0,
    boundaries: {
      trump1: {start: 0, end: 0},
      zelensky: {start: 0, end: 0},
      trump2: {start: 0, end: 0},
      vance: {start: 0, end: 0}
    },
    loadedSegments: {
      trump1: false,
      zelensky: false,
      trump2: false,
      vance: false
    }
  });
  
  // Playback timer
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  // Create proper paths for resources
  const getStaticPath = (path: string) => {
    if (path.startsWith('/clips/') || path.startsWith('/voices/')) {
      return `/static${path}`;
    }
    if (path.startsWith('/static/')) return path;
    return path;
  };
  
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
  
  // Handle audio loaded event
  const handleAudioLoaded = useCallback((segment: CharacterSegment) => {
    const audio = audioRefs.current[segment];
    if (!audio) return;
    
    console.log(`Audio loaded for ${segment}, duration:`, audio.duration);
    
    segmentInfoRef.current.durations[segment] = audio.duration;
    segmentInfoRef.current.loadedSegments[segment] = true;
    
    // Check if all segments are loaded
    const allLoaded = Object.values(segmentInfoRef.current.loadedSegments).every(loaded => loaded);
    
    if (allLoaded) {
      console.log("All audio segments loaded. Calculating boundaries...");
      
      // Calculate segment boundaries
      let totalTime = 0;
      const { sequence, durations, boundaries } = segmentInfoRef.current;
      
      sequence.forEach(segment => {
        const duration = durations[segment];
        boundaries[segment] = {
          start: totalTime,
          end: totalTime + duration
        };
        totalTime += duration;
      });
      
      segmentInfoRef.current.totalDuration = totalTime;
      
      console.log("Segment boundaries:", boundaries);
      console.log("Total duration:", totalTime);
      
      setLoading(false);
      
      // Auto-play if enabled
      if (autoPlay) {
        setTimeout(() => {
          playSegment('trump1', 0);
        }, 100);
      }
    }
  }, [autoPlay]);
  
  // Get the current segment based on time
  const getSegmentForTime = useCallback((time: number): CharacterSegment => {
    const { sequence, boundaries, totalDuration } = segmentInfoRef.current;
    
    if (time <= 0) return sequence[0];
    if (time >= totalDuration) return sequence[sequence.length - 1];
    
    for (const segment of sequence) {
      const { start, end } = boundaries[segment];
      if (time >= start && time < end) {
        return segment;
      }
    }
    
    return sequence[0]; // Fallback to first segment
  }, []);
  
  // Play a specific segment
  const playSegment = useCallback((segment: CharacterSegment, offset: number = 0) => {
    console.log(`Playing segment ${segment} at offset ${offset}`);
    
    // First stop any current playback
    stopAllPlayback();
    
    // Update current segment
    setCurrentSegment(segment);
    
    // Start playback for the segment
    const video = videoRefs.current[segment];
    const audio = audioRefs.current[segment];
    
    if (!video || !audio) {
      console.error(`Missing media elements for ${segment}`);
      return;
    }
    
    try {
      // Reset video to beginning and loop it
      video.currentTime = 0;
      video.loop = true;
      
      // Set audio time to the requested offset
      audio.currentTime = offset;
      audio.muted = isMuted;
      
      // Play both elements
      const videoPromise = video.play();
      const audioPromise = audio.play();
      
      // Handle autoplay restrictions
      Promise.all([videoPromise, audioPromise])
        .then(() => {
          console.log(`${segment} playback started successfully`);
          // Set player state to playing
          setIsPlaying(true);
          if (onPlayPauseToggle) onPlayPauseToggle(true);
          
          // Set up timer for segment transitions
          startTimeRef.current = Date.now() - (offset * 1000);
          pausedTimeRef.current = 0;
          startPlaybackTimer();
        })
        .catch(error => {
          console.error('Error starting playback:', error);
          setIsPlaying(false);
          if (onPlayPauseToggle) onPlayPauseToggle(false);
        });
    } catch (error) {
      console.error('Error in playSegment:', error);
    }
  }, [isMuted, onPlayPauseToggle]);
  
  // Stop all playback
  const stopAllPlayback = useCallback(() => {
    const { sequence } = segmentInfoRef.current;
    
    sequence.forEach(segment => {
      const video = videoRefs.current[segment];
      const audio = audioRefs.current[segment];
      
      if (video) {
        video.pause();
      }
      
      if (audio) {
        audio.pause();
      }
    });
    
    // Clear any active timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (loading) return;
    
    if (isPlaying) {
      // Pause current playback
      stopAllPlayback();
      
      // Store time when paused
      pausedTimeRef.current = getCurrentPlaybackTime();
      
      setIsPlaying(false);
      if (onPlayPauseToggle) onPlayPauseToggle(false);
    } else {
      // Resume playback from paused position
      const currentTime = pausedTimeRef.current;
      const segment = getSegmentForTime(currentTime);
      const { start } = segmentInfoRef.current.boundaries[segment];
      const segmentOffset = currentTime - start;
      
      playSegment(segment, segmentOffset);
    }
  }, [isPlaying, loading, getSegmentForTime, playSegment, onPlayPauseToggle]);
  
  // Toggle mute state
  const toggleMute = useCallback(() => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    // Apply to all audio elements
    segmentInfoRef.current.sequence.forEach(segment => {
      const audio = audioRefs.current[segment];
      if (audio) {
        audio.muted = newMuteState;
      }
    });
  }, [isMuted]);
  
  // Skip to a specific segment
  const skipToSegment = useCallback((index: number) => {
    if (loading) return;
    
    const { sequence } = segmentInfoRef.current;
    if (index < 0 || index >= sequence.length) return;
    
    const segment = sequence[index];
    const { start } = segmentInfoRef.current.boundaries[segment];
    
    // If playing, start the new segment
    if (isPlaying) {
      playSegment(segment, 0);
    } else {
      // Just update the position without playing
      setCurrentSegment(segment);
      pausedTimeRef.current = start;
      updateProgressBar();
    }
  }, [loading, isPlaying, playSegment]);
  
  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (loading) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const { totalDuration } = segmentInfoRef.current;
    const newTime = clickPosition * totalDuration;
    
    const segment = getSegmentForTime(newTime);
    const { start } = segmentInfoRef.current.boundaries[segment];
    const segmentOffset = newTime - start;
    
    if (isPlaying) {
      playSegment(segment, segmentOffset);
    } else {
      // Just update the position without playing
      setCurrentSegment(segment);
      pausedTimeRef.current = newTime;
      updateProgressBar();
    }
  }, [loading, isPlaying, getSegmentForTime, playSegment]);
  
  // Get current playback time
  const getCurrentPlaybackTime = useCallback(() => {
    if (!isPlaying) {
      return pausedTimeRef.current;
    }
    
    const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
    return elapsedSeconds;
  }, [isPlaying]);
  
  // Update progress bar
  const updateProgressBar = useCallback(() => {
    const currentTime = getCurrentPlaybackTime();
    const { totalDuration } = segmentInfoRef.current;
    
    if (totalDuration > 0) {
      const percentage = Math.min(100, (currentTime / totalDuration) * 100);
      setProgress(percentage);
    }
  }, [getCurrentPlaybackTime]);
  
  // Start playback timer for segment transitions
  const startPlaybackTimer = useCallback(() => {
    // First clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    const checkForSegmentTransition = () => {
      if (!isPlaying) return;
      
      const currentTime = getCurrentPlaybackTime();
      const { totalDuration, boundaries } = segmentInfoRef.current;
      
      // Update progress
      updateProgressBar();
      
      // Check if playback has ended
      if (currentTime >= totalDuration) {
        console.log('Playback complete');
        stopAllPlayback();
        setIsPlaying(false);
        pausedTimeRef.current = 0;
        if (onPlayPauseToggle) onPlayPauseToggle(false);
        return;
      }
      
      // Check if we need to switch to next segment
      const newSegment = getSegmentForTime(currentTime);
      
      if (newSegment !== currentSegment) {
        console.log(`Transitioning from ${currentSegment} to ${newSegment} at time ${currentTime}`);
        const { start } = boundaries[newSegment];
        const segmentOffset = currentTime - start;
        
        // Switch to the new segment
        playSegment(newSegment, segmentOffset);
        return; // The playSegment call will start a new timer
      }
      
      // Continue checking every 100ms
      timerRef.current = window.setTimeout(checkForSegmentTransition, 100);
    };
    
    // Start the timer
    timerRef.current = window.setTimeout(checkForSegmentTransition, 100);
  }, [isPlaying, currentSegment, getCurrentPlaybackTime, getSegmentForTime, updateProgressBar, playSegment, stopAllPlayback, onPlayPauseToggle]);
  
  // Start/stop timer based on playback state
  useEffect(() => {
    if (isPlaying && !loading) {
      startPlaybackTimer();
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, loading, startPlaybackTimer]);
  
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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllPlayback();
    };
  }, [stopAllPlayback]);
  
  // Current caption based on segment
  const currentCaption = script[currentSegment];
  const currentTime = getCurrentPlaybackTime();
  const totalDuration = segmentInfoRef.current.totalDuration;
  
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
        
        {/* Video Players stacked on top of each other */}
        <div className="absolute inset-0">
          {segmentInfoRef.current.sequence.map(segment => (
            <video
              key={segment}
              ref={(el) => { videoRefs.current[segment] = el; }}
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
              onClick={togglePlayPause}
            />
          ))}
        </div>
        
        {/* Play button overlay (visible when paused) */}
        {!isPlaying && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
            <button
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors"
              onClick={togglePlayPause}
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
                {segmentInfoRef.current.sequence.map((segment, index) => (
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
        {segmentInfoRef.current.sequence.map(segment => (
          <audio 
            key={`audio-${segment}`}
            ref={(el) => { audioRefs.current[segment] = el; }}
            src={audioPaths[segment]}
            preload="auto"
            muted={isMuted}
            style={{ display: 'none' }}
            onLoadedData={() => handleAudioLoaded(segment)}
            onEnded={() => console.log(`Audio ended for ${segment}`)}
            onError={(e) => console.error(`Error loading ${segment} audio:`, e)}
          />
        ))}
      </div>
    </div>
  );
};

export default DirectSequencePlayer;