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
  const sequence = [
    { character: 'trump1', start: 0, caption: script.trump1 },
    { character: 'zelensky', start: 7, caption: script.zelensky },
    { character: 'trump2', start: 14, caption: script.trump2 },
    { character: 'vance', start: 21, caption: script.vance }
  ];
  
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
  
  // Track video time and progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / (video.duration || 1)) * 100);
    };
    
    const handleDurationChange = () => {
      setDuration(video.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (onPlayPauseToggle) onPlayPauseToggle(false);
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onPlayPauseToggle]);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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
    const newTime = clickPosition * (videoRef.current.duration || 0);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };
  
  const skipToSegment = (index: number) => {
    if (!videoRef.current) return;
    if (index < 0 || index >= sequence.length) return;
    
    videoRef.current.currentTime = sequence[index].start;
    setCurrentCaption(sequence[index].caption);
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
      </div>
    </div>
  );
};

export default SimplePlayer;