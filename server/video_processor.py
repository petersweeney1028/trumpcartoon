#!/usr/bin/env python3

import os
import sys
import json
import time
import subprocess
import tempfile
import shutil

# We don't need MoviePy anymore since we're using direct ffmpeg commands
MOVIEPY_AVAILABLE = False
# Just define imports to avoid LSP errors, but we won't use them
try:
    import ffmpeg
    FFMPEG_PYTHON_AVAILABLE = True
except ImportError:
    FFMPEG_PYTHON_AVAILABLE = False
    print("Warning: ffmpeg-python module not found, but we'll use direct ffmpeg commands instead.")

# Directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
VIDEOS_DIR = os.path.join(STATIC_DIR, "videos")
VOICES_DIR = os.path.join(STATIC_DIR, "voices")
CLIPS_DIR = os.path.join(STATIC_DIR, "clips")
TEMP_DIR = os.path.join(STATIC_DIR, "temp")

# Ensure all required directories exist
for directory in [VIDEOS_DIR, VOICES_DIR, CLIPS_DIR, TEMP_DIR]:
    os.makedirs(directory, exist_ok=True)

# Fixed video segments
VIDEO_SEGMENTS = {
    "trump1": os.path.join(CLIPS_DIR, "trump1.mp4"),
    "zelensky": os.path.join(CLIPS_DIR, "zelensky.mp4"),
    "trump2": os.path.join(CLIPS_DIR, "trump2.mp4"),
    "vance": os.path.join(CLIPS_DIR, "vance.mp4")
}

def create_video_with_audio(video_path, audio_path, output_path):
    """
    Create a video with audio using direct ffmpeg commands
    """
    try:
        print(f"Creating video with audio. Video: {video_path}, Audio: {audio_path}")
        
        # Use direct ffmpeg command for more reliable results
        cmd = [
            'ffmpeg', '-y',
            '-i', video_path,
            '-i', audio_path,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-shortest',
            output_path
        ]
        
        process = subprocess.run(cmd, 
                                capture_output=True, 
                                text=True,
                                check=True)
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"FFMPEG error: {e.stderr}")
        return False
    except Exception as e:
        print(f"Error creating video with audio: {e}")
        return False

def concat_videos(video_paths, output_path):
    """
    Concatenate multiple videos using ffmpeg concat demuxer
    """
    try:
        # Create a temporary file listing all input videos
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            concat_list_path = f.name
            for video in video_paths:
                f.write(f"file '{os.path.abspath(video)}'\n")
        
        # Concatenate videos with direct ffmpeg command
        cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',  # Needed for absolute paths
            '-i', concat_list_path,
            '-c', 'copy',
            output_path
        ]
        
        process = subprocess.run(cmd, 
                                capture_output=True, 
                                text=True,
                                check=True)
        
        # Remove the temporary file
        os.unlink(concat_list_path)
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"FFMPEG error: {e.stderr}")
        return False
    except Exception as e:
        print(f"Error concatenating videos: {e}")
        return False

def process_video(remix_id, audio_files):
    """
    Process video for a remix by:
    1. Combining each video segment with its corresponding audio
    2. Concatenating all segments into a single video
    
    Args:
        remix_id (str): Remix ID to use in filenames
        audio_files (dict): Dictionary mapping character to audio file path
            {
                "trump1": "/path/to/trump1.mp3",
                "zelensky": "/path/to/zelensky.mp3",
                "trump2": "/path/to/trump2.mp3",
                "vance": "/path/to/vance.mp3"
            }
    
    Returns:
        dict: Object with output paths
            {
                "videoUrl": "/videos/remix_output_123.mp4"
            }
    """
    try:
        start_time = time.time()
        print(f"Starting video processing for remix {remix_id}")
        
        # Create a temporary directory for this remix
        temp_remix_dir = os.path.join(TEMP_DIR, f"remix_{remix_id}")
        os.makedirs(temp_remix_dir, exist_ok=True)
        
        # Prepare the output video filename
        output_filename = f"remix_{remix_id}.mp4"
        output_path = os.path.join(VIDEOS_DIR, output_filename)
        
        # Convert audio file paths to absolute paths if needed
        for char, audio_path in audio_files.items():
            if audio_path.startswith('/'):
                # Remove leading slash and join with STATIC_DIR
                audio_files[char] = os.path.join(STATIC_DIR, audio_path[1:])
                print(f"Converted audio path: {audio_files[char]}")
            
            # Check if audio file exists
            if not os.path.exists(audio_files[char]):
                print(f"Audio file not found: {audio_files[char]}")
                raise FileNotFoundError(f"Missing audio file: {audio_files[char]}")
        
        # Process each character segment
        segment_videos = []
        sequence = ["trump1", "zelensky", "trump2", "vance"]
        
        for char in sequence:
            video_path = VIDEO_SEGMENTS[char]
            audio_path = audio_files[char]
            
            print(f"Processing segment {char} - Video: {video_path}, Audio: {audio_path}")
            
            # Create output path for this segment
            segment_output = os.path.join(temp_remix_dir, f"{char}_with_audio.mp4")
            
            # Combine video with audio
            if not create_video_with_audio(video_path, audio_path, segment_output):
                print(f"Failed to process segment {char}")
                continue
                
            segment_videos.append(segment_output)
        
        # Concatenate all processed segments
        if len(segment_videos) == len(sequence):
            # All segments processed successfully
            print(f"Concatenating {len(segment_videos)} video segments")
            
            # Concatenate videos
            if concat_videos(segment_videos, output_path):
                print(f"Successfully created combined video at {output_path}")
            else:
                print("Failed to concatenate videos")
                # If concatenation fails, at least copy one of the segments so we return something
                shutil.copy(segment_videos[0], output_path)
        else:
            # Some segments failed, copy the first successful one
            print(f"Not all segments were processed. Using first available segment.")
            if segment_videos:
                shutil.copy(segment_videos[0], output_path)
            else:
                raise Exception("No video segments were successfully processed")
        
        # Clean up temporary files
        try:
            shutil.rmtree(temp_remix_dir)
        except Exception as e:
            print(f"Warning: Failed to clean up temp directory: {str(e)}")
        
        elapsed_time = time.time() - start_time
        print(f"Video processing completed in {elapsed_time:.2f} seconds")
        
        # Return the relative URL for the frontend
        return {
            "videoUrl": f"/videos/{output_filename}"
        }
        
    except Exception as e:
        print(f"Error in video processing: {str(e)}")
        # Create a fallback video URL
        fallback_filename = f"remix_{remix_id}.mp4"
        return {
            "videoUrl": f"/videos/{fallback_filename}",
            "error": str(e)
        }

def main():
    """
    Main entry point for the script when called directly.
    Expects a JSON string as the first argument with the following structure:
    {
        "remixId": "123",
        "audioFiles": {
            "trump1": "/path/to/trump1.mp3",
            "zelensky": "/path/to/zelensky.mp3",
            "trump2": "/path/to/trump2.mp3",
            "vance": "/path/to/vance.mp3"
        }
    }
    """
    if len(sys.argv) != 2:
        print("Usage: python video_processor.py '{\"remixId\": \"123\", \"audioFiles\": {...}}'")
        sys.exit(1)
    
    try:
        # Parse the JSON input
        input_data = json.loads(sys.argv[1])
        remix_id = input_data.get("remixId")
        audio_files = input_data.get("audioFiles")
        
        if not remix_id or not audio_files:
            print("Error: Missing required fields in input JSON")
            sys.exit(1)
        
        # Setup logging to a file for debugging while still outputting JSON to stdout
        log_file = os.path.join(TEMP_DIR, f"video_processor_{remix_id}.log")
        with open(log_file, 'w') as f:
            # Log input data for debugging
            f.write(f"Processing remix ID: {remix_id}\n")
            f.write(f"Audio files: {json.dumps(audio_files, indent=2)}\n")
            f.write(f"Using ffmpeg version: {subprocess.getoutput('ffmpeg -version')[:100]}...\n")
            
            # Redirect stdout to prevent console pollution
            original_stdout = sys.stdout
            sys.stdout = f
            
            try:
                # Process the video
                result = process_video(remix_id, audio_files)
                
                # Restore stdout and print only the JSON result
                sys.stdout = original_stdout
                print(json.dumps(result))
            except Exception as e:
                f.write(f"Error during processing: {str(e)}\n")
                # Restore stdout
                sys.stdout = original_stdout
                # Return an error result with a valid videoUrl fallback
                output_filename = f"remix_{remix_id}.mp4"
                print(json.dumps({
                    "error": str(e),
                    "videoUrl": f"/videos/{output_filename}"
                }))
                
    except Exception as e:
        # For outer exceptions where remix_id might not be defined yet
        error_id = "error"
        try:
            if 'remix_id' in locals() and remix_id:
                error_id = remix_id
        except:
            pass
            
        print(json.dumps({
            "error": str(e),
            "videoUrl": f"/videos/remix_{error_id}.mp4"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()