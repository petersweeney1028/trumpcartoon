import path from "path";
import { promisify } from "util";
import fs from "fs";
import { access } from "fs/promises";
import { randomUUID } from "crypto";
import { spawn } from "child_process";

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

// File existence check using fs.promises.access instead of deprecated fs.exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Set up the directories to store rendered videos and audio files
const STATIC_DIR = path.join(process.cwd(), "static");
const VIDEOS_DIR = path.join(STATIC_DIR, "videos");
const VOICES_DIR = path.join(STATIC_DIR, "voices");
const CLIPS_DIR = path.join(STATIC_DIR, "clips");

// Create the necessary directories if they don't exist
async function ensureDirectories() {
  try {
    for (const dir of [VIDEOS_DIR, VOICES_DIR, CLIPS_DIR]) {
      await mkdir(dir, { recursive: true });
    }
  } catch (error) {
    console.error("Error creating directories:", error);
  }
}

ensureDirectories();

/**
 * Run a Python script and return its JSON output
 * 
 * @param scriptPath Path to the Python script
 * @param jsonInput JSON input to pass to the script
 * @returns Parsed JSON output from the script
 */
async function runPythonScript(scriptPath: string, jsonInput: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const process = spawn('python3', [scriptPath, JSON.stringify(jsonInput)]);
    
    let stdoutData = '';
    let stderrData = '';
    
    process.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`Python Error: ${data}`);
    });
    
    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`Process exited with code ${code}`);
        console.error(`Error: ${stderrData}`);
        return reject(new Error(`Python script failed with code ${code}: ${stderrData}`));
      }
      
      try {
        // In the improved Python scripts, JSON output is the only output to stdout
        // Just parse the whole stdout as JSON directly
        const trimmedOutput = stdoutData.trim();
        
        // But for backward compatibility, also handle multi-line output where we need to find JSON
        if (!trimmedOutput.startsWith('{') || !trimmedOutput.endsWith('}')) {
          // If the output isn't a simple JSON object, look for a JSON line
          const lines = trimmedOutput.split('\n');
          let jsonLine = '';
          
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
              jsonLine = line;
              break;
            }
          }
          
          if (jsonLine) {
            const result = JSON.parse(jsonLine);
            resolve(result);
            return;
          }
          
          throw new Error('No JSON output found in Python script output');
        }
        
        // Parse the whole output as JSON
        const result = JSON.parse(trimmedOutput);
        
        // Check if there's an error in the result
        if (result.error) {
          console.error(`Python script returned error: ${result.error}`);
          // Still return the result, but log the error
        }
        
        resolve(result);
      } catch (error) {
        console.error('Error parsing Python script output as JSON:', error);
        console.error('Raw stdout:', stdoutData);
        reject(new Error(`Failed to parse Python script output: ${error}`));
      }
    });
  });
}

/**
 * Generate TTS audio for each line in the script using the Fish.audio API
 */
export async function generateTTS(
  script: {
    trump1: string;
    zelensky: string;
    trump2: string;
    vance: string;
  },
  apiKey?: string
): Promise<{
  trump1: string;
  zelensky: string;
  trump2: string;
  vance: string;
}> {
  try {
    console.log('Generating TTS for script:', JSON.stringify(script));
    
    const scriptPath = path.join(process.cwd(), 'server', 'tts_processor.py');
    const input = {
      script,
      apiKey: apiKey || process.env.FISH_AUDIO_API_KEY
    };
    
    // Run the Python TTS generator script
    const result = await runPythonScript(scriptPath, input);
    
    console.log('TTS generation completed:', result);
    
    // Return the paths to the generated audio files
    return {
      trump1: result.trump1,
      zelensky: result.zelensky,
      trump2: result.trump2,
      vance: result.vance
    };
  } catch (error) {
    console.error('Error generating TTS:', error);
    throw new Error(`Failed to generate TTS: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a video by composing the base animation clips with the TTS audio clips
 * 
 * Since we're encountering issues with moviepy video generation, 
 * we'll return the individual video and audio files and handle composition in the frontend
 */
export async function createVideo(
  id: string,
  trumpAudio1: string,
  zelenskyAudio: string,
  trumpAudio2: string,
  vanceAudio: string
): Promise<{ 
  videoUrl: string,
  clipInfo: {
    trump1Video: string,
    trump1Audio: string,
    zelenskyVideo: string,
    zelenskyAudio: string,
    trump2Video: string,
    trump2Audio: string,
    vanceVideo: string,
    vanceAudio: string
  }
}> {
  try {
    console.log(`Creating video info with ID: ${id}`);
    
    // Prepare clip info for both frontend player and video processor
    const clipInfo = {
      trump1Video: '/clips/trump1.mp4',
      trump1Audio: trumpAudio1,
      zelenskyVideo: '/clips/zelensky.mp4',
      zelenskyAudio: zelenskyAudio,
      trump2Video: '/clips/trump2.mp4', 
      trump2Audio: trumpAudio2,
      vanceVideo: '/clips/vance.mp4',
      vanceAudio: vanceAudio
    };
    
    // Now use the Python video processor to create a combined video
    const scriptPath = path.join(process.cwd(), 'server', 'video_processor.py');
    const audioFiles = {
      trump1: path.join(STATIC_DIR, trumpAudio1.slice(1)),  // remove leading slash
      zelensky: path.join(STATIC_DIR, zelenskyAudio.slice(1)),
      trump2: path.join(STATIC_DIR, trumpAudio2.slice(1)),
      vance: path.join(STATIC_DIR, vanceAudio.slice(1))
    };
    
    const input = {
      remixId: id,
      audioFiles: {
        trump1: trumpAudio1,  // Path relative to STATIC_DIR, with leading slash
        zelensky: zelenskyAudio,
        trump2: trumpAudio2,
        vance: vanceAudio
      }
    };
    
    // Create the combined video with our seamless transitions processor
    console.log(`Calling video processor with remix ID: ${id}`);
    const result = await runPythonScript(scriptPath, input);
    
    console.log(`Video generated successfully for remix ${id}: ${result.videoUrl}`);
    
    // Return both the videoUrl (for the combined video) and clipInfo (for the individual clips)
    return {
      videoUrl: result.videoUrl,
      clipInfo: clipInfo
    };
  } catch (error) {
    console.error("Error creating video:", error);
    
    // If video processing fails, still return the clipInfo so frontend can play segments
    const clipInfo = {
      trump1Video: '/clips/trump1.mp4',
      trump1Audio: trumpAudio1,
      zelenskyVideo: '/clips/zelensky.mp4',
      zelenskyAudio: zelenskyAudio,
      trump2Video: '/clips/trump2.mp4', 
      trump2Audio: trumpAudio2,
      vanceVideo: '/clips/vance.mp4',
      vanceAudio: vanceAudio
    };
    
    return {
      videoUrl: `/videos/remix_${id}.mp4`, // Placeholder URL
      clipInfo: clipInfo
    };
  }
}
