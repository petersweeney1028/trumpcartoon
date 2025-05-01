import { useState, useRef, useEffect } from "react";
import { ClipInfo } from "@shared/schema";

interface ContinuousPlayerProps {
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

const ContinuousPlayer = ({
  clipInfo,
  script,
  onPlayPauseToggle,
  autoPlay = false
}: ContinuousPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadedSegments, setLoadedSegments] = useState({
    trump1: false,
    zelensky: false,
    trump2: false,
    vance: false
  });
  
  // References to all video and audio elements
  const trump1VideoRef = useRef<HTMLVideoElement>(null);
  const trump1AudioRef = useRef<HTMLAudioElement>(null);
  const zelenskyVideoRef = useRef<HTMLVideoElement>(null);
  const zelenskyAudioRef = useRef<HTMLAudioElement>(null);
  const trump2VideoRef = useRef<HTMLVideoElement>(null);
  const trump2AudioRef = useRef<HTMLAudioElement>(null);
  const vanceVideoRef = useRef<HTMLVideoElement>(null);
  const vanceAudioRef = useRef<HTMLAudioElement>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
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
  
  // Get paths for all media files
  const mediaPaths = {
    trump1: {
      video: getStaticPath(clipInfo.trump1Video),
      audio: getStaticPath(clipInfo.trump1Audio),
      caption: script.trump1
    },
    zelensky: {
      video: getStaticPath(clipInfo.zelenskyVideo),
      audio: getStaticPath(clipInfo.zelenskyAudio),
      caption: script.zelensky
    },
    trump2: {
      video: getStaticPath(clipInfo.trump2Video),
      audio: getStaticPath(clipInfo.trump2Audio),
      caption: script.trump2
    },
    vance: {
      video: getStaticPath(clipInfo.vanceVideo),
      audio: getStaticPath(clipInfo.vanceAudio),
      caption: script.vance
    }
  };
  
  // Sequence of character segments to play
  const sequence: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance'];
  
  // Get current segment information
  const currentClipInfo = mediaPaths[currentSegment];
  
  // Calculate segment durations and boundaries once media is loaded
  const [segmentBoundaries, setSegmentBoundaries] = useState<{
    [key in CharacterSegment]: { start: number; end: number; duration: number }
  }>({
    trump1: { start: 0, end: 0, duration: 0 },
    zelensky: { start: 0, end: 0, duration: 0 },
    trump2: { start: 0, end: 0, duration: 0 },
    vance: { start: 0, end: 0, duration: 0 }
  });
  
  // Preload all media on component mount
  useEffect(() => {
    console.log('ContinuousPlayer mounted with clipInfo:', clipInfo);
    console.log('Script:', script);
    
    // Load all videos and audios
    sequence.forEach(segment => {
      const videoPath = mediaPaths[segment].video;
      const audioPath = mediaPaths[segment].audio;
      console.log(`Preloading ${segment} - video: ${videoPath}, audio: ${audioPath}`);
    });
  }, []);
  
  // Initialize media elements once available
  useEffect(() => {
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
    
    // Once all media elements are loaded, calculate total duration
    let allLoaded = true;
    const durations: {[key in CharacterSegment]: number} = {
      trump1: 0,
      zelensky: 0,
      trump2: 0,
      vance: 0
    };
    
    sequence.forEach(segment => {
      const audioRef = audioRefs[segment].current;
      if (audioRef && audioRef.duration) {
        durations[segment] = audioRef.duration;
      } else {
        allLoaded = false;
      }
    });
    
    if (allLoaded) {
      // Calculate segment boundaries
      let totalTime = 0;
      const boundaries = { ...segmentBoundaries };
      
      sequence.forEach(segment => {
        const duration = durations[segment];
        boundaries[segment] = {
          start: totalTime,
          end: totalTime + duration,
          duration: duration
        };
        totalTime += duration;
      });
      
      setSegmentBoundaries(boundaries);
      setTotalDuration(totalTime);
      console.log('Segment boundaries calculated:', boundaries);
      console.log('Total duration:', totalTime);
    }
  }, [loadedSegments]);
  
  // Handle media loading for each segment
  const handleMediaLoaded = (segment: CharacterSegment) => {
    setLoadedSegments(prev => ({
      ...prev,
      [segment]: true
    }));
    console.log(`${segment} media loaded`);
  };
  
  // Update current segment based on playback time
  useEffect(() => {
    if (totalDuration === 0) return;
    
    for (const segment of sequence) {
      const { start, end } = segmentBoundaries[segment];
      if (currentTime >= start && currentTime < end) {
        if (currentSegment !== segment) {
          setCurrentSegment(segment);
        }
        break;
      }
    }
    
    // Update progress
    setProgress((currentTime / totalDuration) * 100);
  }, [currentTime, totalDuration]);
  
  // Handle play/pause for all media elements
  const playAllMedia = () => {
    // Play the current segment's video and audio
    const segmentToPlay = currentSegment;
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
    
    // If playing from beginning
    if (currentTime === 0) {
      // Reset all videos to the beginning
      sequence.forEach(seg => {
        if (videoRefs[seg].current) videoRefs[seg].current.currentTime = 0;
        if (audioRefs[seg].current) audioRefs[seg].current.currentTime = 0;
      });
    }
    
    // Show only the current segment's video
    sequence.forEach(seg => {
      if (videoRefs[seg].current) {
        const video = videoRefs[seg].current;
        if (seg === segmentToPlay) {
          video.style.opacity = '1';
          video.style.zIndex = '1';
          
          const { start } = segmentBoundaries[seg];
          const segmentTime = currentTime - start;
          video.currentTime = segmentTime;
          
          video.play().catch(err => {
            console.error(`Error playing ${seg} video:`, err);
          });
        } else {
          video.style.opacity = '0';
          video.style.zIndex = '0';
          video.pause();
        }
      }
      
      if (audioRefs[seg].current) {
        const audio = audioRefs[seg].current;
        if (seg === segmentToPlay) {
          const { start } = segmentBoundaries[seg];
          const segmentTime = currentTime - start;
          audio.currentTime = segmentTime;
          
          audio.play().catch(err => {
            console.error(`Error playing ${seg} audio:`, err);
          });
        } else {
          audio.pause();
        }
      }
    });
  };
  
  const pauseAllMedia = () => {
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
    
    sequence.forEach(seg => {
      if (videoRefs[seg].current) videoRefs[seg].current.pause();
      if (audioRefs[seg].current) audioRefs[seg].current.pause();
    });
  };
  
  // Update time tracking
  useEffect(() => {
    let requestId: number;
    let lastTime = performance.now();
    
    const updateTime = () => {
      if (!isPlaying) return;
      
      const now = performance.now();
      const delta = (now - lastTime) / 1000; // seconds
      lastTime = now;
      
      // Update current time
      setCurrentTime(time => {
        const newTime = Math.min(time + delta, totalDuration);
        
        // Check if we've reached the end
        if (newTime >= totalDuration) {
          setIsPlaying(false);
          if (onPlayPauseToggle) onPlayPauseToggle(false);
          return totalDuration;
        }
        
        return newTime;
      });
      
      requestId = requestAnimationFrame(updateTime);
    };
    
    if (isPlaying) {
      lastTime = performance.now();
      requestId = requestAnimationFrame(updateTime);
    }
    
    return () => {
      if (requestId) cancelAnimationFrame(requestId);
    };
  }, [isPlaying, totalDuration]);
  
  // Handle play/pause toggling
  useEffect(() => {
    if (onPlayPauseToggle) {
      onPlayPauseToggle(isPlaying);
    }
    
    if (isPlaying) {
      playAllMedia();
    } else {
      pauseAllMedia();
    }
  }, [isPlaying]);
  
  // Handle segment change
  useEffect(() => {
    // Don't proceed if we don't have duration info yet
    if (totalDuration === 0) return;
    
    if (isPlaying) {
      playAllMedia();
    }
  }, [currentSegment]);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    const audioRefs = {
      trump1: trump1AudioRef,
      zelensky: zelenskyAudioRef,
      trump2: trump2AudioRef,
      vance: vanceAudioRef
    };
    
    setIsMuted(!isMuted);
    
    sequence.forEach(seg => {
      if (audioRefs[seg].current) {
        audioRefs[seg].current.muted = !isMuted;
      }
    });
  };
  
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalDuration === 0) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * totalDuration;
    
    setCurrentTime(newTime);
    
    // Find which segment this time belongs to
    for (const segment of sequence) {
      const { start, end } = segmentBoundaries[segment];
      if (newTime >= start && newTime < end) {
        setCurrentSegment(segment);
        break;
      }
    }
    
    if (isPlaying) {
      playAllMedia();
    }
  };
  
  const skipToSegment = (segment: CharacterSegment) => {
    if (totalDuration === 0) return;
    
    const { start } = segmentBoundaries[segment];
    setCurrentTime(start);
    setCurrentSegment(segment);
    
    if (isPlaying) {
      playAllMedia();
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
        {/* All Video Players stacked on top of each other */}
        <div className="absolute inset-0">
          {sequence.map((segment, index) => (
            <div key={segment} className="absolute inset-0" style={{ zIndex: currentSegment === segment ? 1 : 0 }}>
              <video
                ref={segment === 'trump1' ? trump1VideoRef : 
                     segment === 'zelensky' ? zelenskyVideoRef :
                     segment === 'trump2' ? trump2VideoRef : vanceVideoRef}
                src={mediaPaths[segment].video}
                className="w-full h-full object-cover"
                muted // We'll use the separate audio element for sound
                loop // Loop the video clip while the audio plays
                style={{ 
                  opacity: currentSegment === segment ? 1 : 0,
                  transition: 'opacity 0.2s ease-out'
                }}
                onLoadedData={() => handleMediaLoaded(segment)}
                onClick={togglePlayPause}
                playsInline
                crossOrigin="anonymous"
              />
            </div>
          ))}
        </div>
        
        {/* Hidden Audio Players */}
        {sequence.map((segment) => (
          <audio 
            key={segment}
            ref={segment === 'trump1' ? trump1AudioRef : 
                 segment === 'zelensky' ? zelenskyAudioRef :
                 segment === 'trump2' ? trump2AudioRef : vanceAudioRef}
            src={mediaPaths[segment].audio}
            crossOrigin="anonymous"
            muted={isMuted}
            onLoadedData={() => handleMediaLoaded(segment)}
            style={{ display: 'none' }}
          />
        ))}
        
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
              <span className="text-sm">{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-1">
                {sequence.map((segment) => (
                  <div 
                    key={segment}
                    className={`w-6 h-1 rounded-full ${currentSegment === segment ? 'bg-primary' : 'bg-white/30'}`}
                    onClick={() => skipToSegment(segment)}
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
            <p className="text-white font-medium text-lg">{currentClipInfo.caption}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContinuousPlayer;