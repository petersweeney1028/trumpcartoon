import { useState, useRef, useEffect } from "react";
import { ClipInfo } from "@shared/schema";

interface SequencePlayerProps {
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

const SequencePlayer = ({
  clipInfo,
  script,
  onPlayPauseToggle,
  autoPlay = false
}: SequencePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Log received clip info and script
  useEffect(() => {
    console.log('SequencePlayer mounted with clipInfo:', clipInfo);
    console.log('Script:', script);
  }, []);
  
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
  
  // Map current segment to the appropriate video and audio
  const currentClipInfo = {
    video: getStaticPath(clipInfo[`${currentSegment}Video`]),
    audio: getStaticPath(clipInfo[`${currentSegment}Audio`]),
    caption: script[currentSegment],
  };
  
  // Log the current segment and paths
  useEffect(() => {
    console.log(`Current segment: ${currentSegment}`);
    console.log('Video path:', currentClipInfo.video);
    console.log('Audio path:', currentClipInfo.audio);
  }, [currentSegment]);
  
  // Get the sequence order
  const sequence: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance'];
  
  useEffect(() => {
    // When segment changes, load the new video and audio
    let wasPlaying = isPlaying;
    
    // Pause any ongoing playback first
    if (wasPlaying) {
      pauseMedia();
      // Temporarily set to not playing to avoid multiple plays
      setIsPlaying(false);
    }
    
    // Reset progress when switching segments
    setProgress(0);
    
    console.log(`Switching to segment: ${currentSegment}`);
    
    // Load new sources with a small delay to prevent race conditions
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = currentClipInfo.video;
        videoRef.current.load();
      }
      
      if (audioRef.current) {
        audioRef.current.src = currentClipInfo.audio;
        audioRef.current.load();
      }
      
      // If we were playing, continue playing the new segment after sources are set
      if (wasPlaying) {
        // Add a slight delay to allow media to initialize
        setTimeout(() => {
          // Restore playing state
          setIsPlaying(true);
          // And trigger playback
          playMedia();
        }, 300);
      }
    }, 50);
  }, [currentSegment]);
  
  useEffect(() => {
    if (onPlayPauseToggle) {
      onPlayPauseToggle(isPlaying);
    }
    
    if (isPlaying) {
      playMedia();
    } else {
      pauseMedia();
    }
  }, [isPlaying]);
  
  // Set up listeners for the audio to track progress and detect when to move to next segment
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    
    const handleAudioEnd = () => {
      // Move to the next segment
      const currentIndex = sequence.indexOf(currentSegment);
      if (currentIndex < sequence.length - 1) {
        setCurrentSegment(sequence[currentIndex + 1]);
      } else {
        // End of sequence
        setIsPlaying(false);
        if (onPlayPauseToggle) {
          onPlayPauseToggle(false);
        }
      }
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleAudioEnd);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleAudioEnd);
    };
  }, [currentSegment, onPlayPauseToggle]);
  
  const playMedia = () => {
    if (videoRef.current && audioRef.current) {
      console.log('Playing media:');
      console.log('- Video src:', videoRef.current.src);
      console.log('- Audio src:', audioRef.current.src);
      
      // First, add load event listeners to ensure media is ready
      const videoLoaded = new Promise<void>((resolve, reject) => {
        if (!videoRef.current) return reject('Video ref not available');
        
        const handleLoaded = () => {
          videoRef.current?.removeEventListener('loadeddata', handleLoaded);
          resolve();
        };
        
        // Check if already loaded
        if (videoRef.current.readyState >= 2) {
          resolve();
        } else {
          videoRef.current.addEventListener('loadeddata', handleLoaded);
          // Add a timeout to resolve anyway after 2 seconds to prevent hanging
          setTimeout(resolve, 2000);
        }
      });
      
      const audioLoaded = new Promise<void>((resolve, reject) => {
        if (!audioRef.current) return reject('Audio ref not available');
        
        const handleLoaded = () => {
          audioRef.current?.removeEventListener('loadeddata', handleLoaded);
          resolve();
        };
        
        // Check if already loaded
        if (audioRef.current.readyState >= 2) {
          resolve();
        } else {
          audioRef.current.addEventListener('loadeddata', handleLoaded);
          // Add a timeout to resolve anyway after 2 seconds to prevent hanging
          setTimeout(resolve, 2000);
        }
      });
      
      // Wait for both video and audio to load before playing
      Promise.all([videoLoaded, audioLoaded])
        .then(() => {
          console.log('Both video and audio loaded, starting playback');
          
          // Reset both to beginning
          if (videoRef.current) videoRef.current.currentTime = 0;
          if (audioRef.current) audioRef.current.currentTime = 0;
          
          // Play video first (since it's muted, this shouldn't trigger autoplay restrictions)
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error('Video play error:', err);
            });
          }
          
          // Then play audio with a small delay to sync better
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play().catch(err => {
                console.error('Audio play error:', err);
                // If audio fails to play, try one more time with user interaction
                setIsPlaying(false);
                if (onPlayPauseToggle) {
                  onPlayPauseToggle(false);
                }
              });
            }
          }, 100);
        })
        .catch(error => {
          console.error('Error loading media:', error);
          // Auto-play fallback
          setIsPlaying(false);
          if (onPlayPauseToggle) {
            onPlayPauseToggle(false);
          }
        });
    } else {
      console.error('Video or audio ref is not available');
    }
  };
  
  const pauseMedia = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * (audioRef.current.duration || 0);
    
    if (audioRef.current.duration) {
      audioRef.current.currentTime = newTime;
      setProgress((newTime / audioRef.current.duration) * 100);
    }
  };
  
  // Get current time and duration from audio element
  const currentTime = audioRef.current?.currentTime || 0;
  const duration = audioRef.current?.duration || 0;
  
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
          src={currentClipInfo.video}
          className="absolute inset-0 w-full h-full object-cover"
          onClick={togglePlayPause}
          playsInline
          crossOrigin="anonymous"
          muted // We'll use the separate audio element for sound
          loop // Loop the video clip while the audio plays
          preload="auto" // Ensure video preloads
          onError={(e) => console.error(`Video load error for ${currentSegment}:`, e)}
        />
        
        {/* Hidden Audio Player */}
        <audio 
          ref={audioRef}
          src={currentClipInfo.audio}
          crossOrigin="anonymous"
          muted={isMuted}
          preload="auto" // Ensure audio preloads
          onError={(e) => console.error(`Audio load error for ${currentSegment}:`, e)}
        />
        
        {/* Play button overlay (visible when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
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
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}
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
                    key={segment}
                    className={`w-6 h-1 rounded-full ${currentSegment === segment ? 'bg-primary' : 'bg-white/30'}`}
                    onClick={() => setCurrentSegment(segment)}
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

export default SequencePlayer;