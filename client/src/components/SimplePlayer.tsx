import React, { useState, useRef, useEffect } from "react";
import { ClipInfo } from "@shared/schema";

interface SimplePlayerProps {
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

const SimplePlayer = ({
  clipInfo,
  script,
  onPlayPauseToggle,
  autoPlay = false
}: SimplePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentCaption, setCurrentCaption] = useState(script.trump1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get sequence of characters and their start times
  // Use longer durations to match audio file lengths
  const sequence = [
    { character: 'trump1', start: 0, caption: script.trump1 },
    { character: 'zelensky', start: 7, caption: script.zelensky },
    { character: 'trump2', start: 14, caption: script.trump2 },
    { character: 'vance', start: 21, caption: script.vance }
  ];
  
  // Total duration of all segments
  const totalDuration = 28; // Ensure we have enough time for all segments
  
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
  
  // Use the original video path
  const videoUrl = getStaticPath(clipInfo.trump1Video);
  
  // Set caption based on current time
  useEffect(() => {
    if (currentTime <= 0) {
      setCurrentCaption(script.trump1);
      return;
    }
    
    for (let i = sequence.length - 1; i >= 0; i--) {
      if (currentTime >= sequence[i].start) {
        setCurrentCaption(sequence[i].caption);
        break;
      }
    }
  }, [currentTime]);
  
  // Play/pause video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.play().catch(err => {
        console.error('Error playing video:', err);
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      });
    } else {
      video.pause();
    }
    
    if (onPlayPauseToggle) {
      onPlayPauseToggle(isPlaying);
    }
  }, [isPlaying, onPlayPauseToggle]);
  
  // Create refs for audio elements
  const trump1AudioRef = useRef<HTMLAudioElement>(null);
  const zelenskyAudioRef = useRef<HTMLAudioElement>(null);
  const trump2AudioRef = useRef<HTMLAudioElement>(null);
  const vanceAudioRef = useRef<HTMLAudioElement>(null);
  
  // Audio source paths
  const audioSources = {
    trump1: getStaticPath(clipInfo.trump1Audio),
    zelensky: getStaticPath(clipInfo.zelenskyAudio),
    trump2: getStaticPath(clipInfo.trump2Audio),
    vance: getStaticPath(clipInfo.vanceAudio),
  };
  
  // Get current segment based on time
  const getCurrentSegment = (time: number): { character: string, index: number } => {
    for (let i = sequence.length - 1; i >= 0; i--) {
      if (time >= sequence[i].start) {
        return { character: sequence[i].character, index: i };
      }
    }
    return { character: sequence[0].character, index: 0 };
  };
  
  // Track video time and progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Make sure duration is set correctly
    setDuration(totalDuration);
    
    const handleTimeUpdate = () => {
      // If we reach the video end, loop it to continue playing
      if (video.currentTime >= video.duration - 0.1) {
        video.currentTime = 0;
      }
      
      // Use our custom time tracking
      setCurrentTime(prev => {
        const newTime = prev + 0.1; // Increment by a small amount each update
        
        // Reset when we reach total duration
        if (newTime >= totalDuration) {
          setIsPlaying(false);
          if (onPlayPauseToggle) onPlayPauseToggle(false);
          return 0;
        }
        
        // Get current segment
        const { character } = getCurrentSegment(newTime);
        
        // Potentially start playing appropriate audio
        if (Math.floor(prev) !== Math.floor(newTime)) {
          // At each whole second boundary, check if we need to switch audio
          const audioRefs = {
            trump1: trump1AudioRef,
            zelensky: zelenskyAudioRef,
            trump2: trump2AudioRef,
            vance: vanceAudioRef
          };
          
          // Get current segment
          const currentSegRef = audioRefs[character as keyof typeof audioRefs];
          
          // Try to play this segment's audio
          if (currentSegRef?.current && !isMuted) {
            Object.values(audioRefs).forEach(ref => {
              if (ref && ref !== currentSegRef && ref.current) {
                ref.current.pause();
              }
            });
            
            if (currentSegRef.current.paused) {
              currentSegRef.current.currentTime = 0;
              currentSegRef.current.play().catch(e => {
                console.error(`Error playing ${character} audio:`, e);
              });
            }
          }
        }
        
        return newTime;
      });
      
      // Calculate progress based on our total duration
      setProgress((currentTime / totalDuration) * 100);
    };
    
    // Simulate timeupdate with our own interval for more precise control
    let intervalId: number;
    if (isPlaying) {
      intervalId = window.setInterval(handleTimeUpdate, 100);
    }
    
    const handleEnded = () => {
      // Don't end playback when video ends, we'll handle that ourselves
      if (video.currentTime >= video.duration - 0.1) {
        video.currentTime = 0;
        video.play().catch(err => console.error('Error looping video:', err));
      }
    };
    
    video.addEventListener('ended', handleEnded);
    
    return () => {
      if (intervalId) clearInterval(intervalId);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying, currentTime, totalDuration, isMuted, onPlayPauseToggle]);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    // Toggle mute state
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Mute/unmute video
    if (videoRef.current) {
      videoRef.current.muted = newMutedState;
    }
    
    // Mute/unmute all audio elements
    [trump1AudioRef, zelenskyAudioRef, trump2AudioRef, vanceAudioRef].forEach(ref => {
      if (ref.current) {
        ref.current.muted = newMutedState;
      }
    });
    
    // If we're unmuting and playing, try to start the appropriate audio
    if (!newMutedState && isPlaying) {
      const { character } = getCurrentSegment(currentTime);
      const audioRefs = {
        trump1: trump1AudioRef,
        zelensky: zelenskyAudioRef,
        trump2: trump2AudioRef,
        vance: vanceAudioRef
      };
      
      const currentAudioRef = audioRefs[character as keyof typeof audioRefs];
      if (currentAudioRef?.current) {
        // Try to play the current segment's audio
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.play().catch(err => {
          console.error(`Error playing ${character} audio after unmute:`, err);
        });
      }
    }
  };
  
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    
    // Use our total duration, not video duration
    const newTime = clickPosition * totalDuration;
    
    setCurrentTime(newTime);
    
    // Update video position proportionally
    if (videoRef.current) {
      // Map our custom timeline to video time
      const videoPosition = (newTime % videoRef.current.duration) || 0;
      videoRef.current.currentTime = videoPosition;
    }
  };
  
  const skipToSegment = (index: number) => {
    if (!videoRef.current) return;
    if (index < 0 || index >= sequence.length) return;
    
    // Set our custom time to the segment start
    const newTime = sequence[index].start;
    setCurrentTime(newTime); 
    setCurrentCaption(sequence[index].caption);
    
    // Map this to video position
    if (videoRef.current) {
      // Loop video if needed
      const videoPos = newTime % videoRef.current.duration; 
      videoRef.current.currentTime = videoPos;
    }
    
    // If we're playing, make sure we're still playing
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('Error playing video after skip:', err);
      });
    }
  };
  
  return (
    <div
      ref={containerRef}
      className="bg-dark rounded-lg overflow-hidden shadow-lg relative"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
    >
      <div className="relative pt-[56.25%]">
        {/* Video Player */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          onClick={togglePlayPause}
          playsInline
          crossOrigin="anonymous"
          muted={isMuted}
          preload="auto"
          onError={(e) => console.error('Video load error:', e)}
        />
        
        {/* Play button overlay (visible when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
            <button
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors"
              onClick={togglePlayPause}
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
                    key={segment.character}
                    className={`w-6 h-1 rounded-full cursor-pointer ${
                      currentCaption === segment.caption ? 'bg-primary' : 'bg-white/30'
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
        <audio 
          ref={trump1AudioRef}
          src={audioSources.trump1}
          preload="auto"
          muted={isMuted}
          style={{ display: 'none' }}
          onError={(e) => console.error('Trump1 audio load error:', e)}
        />
        <audio 
          ref={zelenskyAudioRef}
          src={audioSources.zelensky}
          preload="auto"
          muted={isMuted}
          style={{ display: 'none' }}
          onError={(e) => console.error('Zelensky audio load error:', e)}
        />
        <audio 
          ref={trump2AudioRef}
          src={audioSources.trump2}
          preload="auto"
          muted={isMuted}
          style={{ display: 'none' }}
          onError={(e) => console.error('Trump2 audio load error:', e)}
        />
        <audio 
          ref={vanceAudioRef}
          src={audioSources.vance}
          preload="auto"
          muted={isMuted}
          style={{ display: 'none' }}
          onError={(e) => console.error('Vance audio load error:', e)}
        />
      </div>
    </div>
  );
};

export default SimplePlayer;