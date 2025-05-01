import path from "path";
import { promisify } from "util";
import fs from "fs";
import { randomUUID } from "crypto";
import { spawn } from "child_process";

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

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
        // Try to find JSON output in the stdout string
        // Look for the last line that starts with '{' and ends with '}'
        const lines = stdoutData.trim().split('\n');
        let jsonLine = '';
        
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{') && line.endsWith('}')) {
            jsonLine = line;
            break;
          }
        }
        
        if (!jsonLine) {
          throw new Error('No JSON output found in Python script output');
        }
        
        const result = JSON.parse(jsonLine);
        resolve(result);
      } catch (error) {
        console.error('Error parsing Python script output as JSON:', error);
        console.error('Output:', stdoutData);
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
 * Uses Python with moviepy to handle the video processing
 */
export async function createVideo(
  id: string,
  trumpAudio1: string,
  zelenskyAudio: string,
  trumpAudio2: string,
  vanceAudio: string
): Promise<{ videoUrl: string }> {
  try {
    console.log(`Creating video with ID: ${id}`);
    console.log(`Using audio clips: ${trumpAudio1}, ${zelenskyAudio}, ${trumpAudio2}, ${vanceAudio}`);
    
    // Prepare the data for the Python script
    const scriptPath = path.join(process.cwd(), 'server', 'video_processor.py');
    const input = {
      remixId: id,
      audioFiles: {
        trump1: trumpAudio1,
        zelensky: zelenskyAudio,
        trump2: trumpAudio2,
        vance: vanceAudio
      }
    };
    
    // Run the Python video processor script
    const result = await runPythonScript(scriptPath, input);
    
    console.log('Video processing completed:', result);
    
    // Return the path to the generated video
    return {
      videoUrl: result.videoUrl
    };
  } catch (error) {
    console.error("Error creating video:", error);
    throw new Error(`Failed to create video: ${error instanceof Error ? error.message : String(error)}`);
  }
}
