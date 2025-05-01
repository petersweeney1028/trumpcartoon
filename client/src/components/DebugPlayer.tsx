import { useState, useRef, useEffect } from "react";
import { ClipInfo } from "@shared/schema";

interface DebugPlayerProps {
  clipInfo: ClipInfo;
  script: {
    trump1: string;
    zelensky: string;
    trump2: string;
    vance: string;
  };
}

const DebugPlayer = ({ clipInfo, script }: DebugPlayerProps) => {
  const [videoPlayerState, setVideoPlayerState] = useState<{
    trump1: { videoLoaded: boolean; audioLoaded: boolean };
    zelensky: { videoLoaded: boolean; audioLoaded: boolean };
    trump2: { videoLoaded: boolean; audioLoaded: boolean };
    vance: { videoLoaded: boolean; audioLoaded: boolean };
  }>({
    trump1: { videoLoaded: false, audioLoaded: false },
    zelensky: { videoLoaded: false, audioLoaded: false },
    trump2: { videoLoaded: false, audioLoaded: false },
    vance: { videoLoaded: false, audioLoaded: false },
  });

  // Function to update state when a video or audio is loaded
  const handleMediaLoaded = (
    character: "trump1" | "zelensky" | "trump2" | "vance",
    mediaType: "video" | "audio"
  ) => {
    setVideoPlayerState((prev) => ({
      ...prev,
      [character]: {
        ...prev[character],
        [`${mediaType}Loaded`]: true,
      },
    }));
  };

  // Function to create proper static paths
  const getStaticPath = (path: string) => {
    if (path.startsWith('/static')) return path;
    return `/static${path}`;
  };

  return (
    <div className="p-4 bg-yellow-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Debug Media Player</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {(["trump1", "zelensky", "trump2", "vance"] as const).map((character) => (
          <div 
            key={character} 
            className="border p-3 rounded-lg bg-white"
          >
            <h3 className="font-bold mb-2">{character}</h3>
            <p className="text-sm mb-2">{script[character]}</p>
            
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm">Video:</span>
                <span 
                  className={`text-xs font-semibold ${
                    videoPlayerState[character].videoLoaded 
                      ? "text-green-600" 
                      : "text-red-600"
                  }`}
                >
                  {videoPlayerState[character].videoLoaded ? "LOADED" : "NOT LOADED"}
                </span>
              </div>
              <video 
                src={getStaticPath(clipInfo[`${character}Video`])}
                className="w-full h-24 object-cover bg-gray-100 rounded"
                muted
                onLoadedData={() => handleMediaLoaded(character, "video")}
                onError={(e) => console.error(`Error loading ${character} video:`, e)}
                controls
              />
              <div className="text-xs mt-1 truncate">
                Path: {getStaticPath(clipInfo[`${character}Video`])}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Audio:</span>
                <span 
                  className={`text-xs font-semibold ${
                    videoPlayerState[character].audioLoaded 
                      ? "text-green-600" 
                      : "text-red-600"
                  }`}
                >
                  {videoPlayerState[character].audioLoaded ? "LOADED" : "NOT LOADED"}
                </span>
              </div>
              <audio 
                src={getStaticPath(clipInfo[`${character}Audio`])}
                className="w-full"
                onLoadedData={() => handleMediaLoaded(character, "audio")}
                onError={(e) => console.error(`Error loading ${character} audio:`, e)}
                controls
              />
              <div className="text-xs mt-1 truncate">
                Path: {getStaticPath(clipInfo[`${character}Audio`])}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugPlayer;