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

def get_media_duration(file_path):
    """
    Get the duration of a media file in seconds using ffprobe
    """
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
            '-of', 'csv=p=0', file_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except Exception as e:
        print(f"Error getting duration for {file_path}: {e}")
        return 0

def create_video_with_audio(video_path, audio_path, output_path):
    """
    Create a video with audio using direct ffmpeg commands.
    If audio is longer than video, extend video by holding the last frame.
    """
    try:
        print(f"Creating video with audio. Video: {video_path}, Audio: {audio_path}")
        
        # Get durations of both video and audio
        video_duration = get_media_duration(video_path)
        audio_duration = get_media_duration(audio_path)
        
        print(f"Video duration: {video_duration}s, Audio duration: {audio_duration}s")
        
        if audio_duration > video_duration:
            # Audio is longer, need to extend video by holding last frame
            print(f"Extending video by {audio_duration - video_duration}s to match audio")
            
            # Create extended video that matches audio duration
            cmd = [
                'ffmpeg', '-y',
                '-i', video_path,
                '-i', audio_path,
                '-filter_complex', f'[0:v]tpad=stop_mode=clone:stop_duration={audio_duration - video_duration}[v]',
                '-map', '[v]',
                '-map', '1:a:0',
                '-c:a', 'aac',
                '-c:v', 'libx264',
                '-shortest',
                output_path
            ]
        else:
            # Video is longer or same length, use original approach
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
        # Use stderr for error messages to keep stdout clean for JSON
        print("Usage: python video_processor.py '{\"remixId\": \"123\", \"audioFiles\": {...}}'", file=sys.stderr)
        print(json.dumps({"error": "Missing JSON input argument", "videoUrl": "/videos/remix_error.mp4"}))
        sys.exit(1)
    
    try:
        # Parse the JSON input
        input_data = json.loads(sys.argv[1])
        remix_id = input_data.get("remixId")
        audio_files = input_data.get("audioFiles")
        
        if not remix_id or not audio_files:
            print("Error: Missing required fields in input JSON", file=sys.stderr)
            print(json.dumps({
                "error": "Missing required fields (remixId or audioFiles) in input JSON", 
                "videoUrl": f"/videos/remix_error.mp4"
            }))
            sys.exit(1)
        
        # Setup logging to a file for debugging
        log_file = os.path.join(TEMP_DIR, f"video_processor_{remix_id}.log")
        with open(log_file, 'w') as f:
            # Save original stdout/stderr
            original_stdout = sys.stdout
            original_stderr = sys.stderr
            
            # Redirect stdout to the log file for debugging logs
            sys.stdout = f
            sys.stderr = f
            
            try:
                # Log input data for debugging
                print(f"Processing remix ID: {remix_id}")
                print(f"Audio files: {json.dumps(audio_files, indent=2)}")
                print(f"Using ffmpeg version: {subprocess.getoutput('ffmpeg -version')[:100]}...")
                
                # Process the video
                result = process_video(remix_id, audio_files)
                print(f"Processing complete. Result: {json.dumps(result)}")
                
                # Restore stdout and print only the JSON result
                sys.stdout = original_stdout
                print(json.dumps(result))
            except Exception as inner_e:
                # Log the error
                print(f"Error during processing: {str(inner_e)}")
                
                # Restore stdout
                sys.stdout = original_stdout
                
                # Return an error result with a valid videoUrl fallback
                output_filename = f"remix_{remix_id}.mp4"
                print(json.dumps({
                    "error": str(inner_e),
                    "videoUrl": f"/videos/{output_filename}"
                }))
            finally:
                # Ensure we restore stdout/stderr
                sys.stdout = original_stdout
                sys.stderr = original_stderr
                
    except json.JSONDecodeError as je:
        print(f"JSON parsing error: {str(je)}", file=sys.stderr)
        print(json.dumps({
            "error": f"Invalid JSON input: {str(je)}", 
            "videoUrl": "/videos/remix_error.mp4"
        }))
        sys.exit(1)
    except Exception as e:
        # For outer exceptions where remix_id might not be defined yet
        error_id = "error"
        try:
            if 'remix_id' in locals() and remix_id:
                error_id = remix_id
        except:
            pass
        
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        print(json.dumps({
            "error": str(e),
            "videoUrl": f"/videos/remix_{error_id}.mp4"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()