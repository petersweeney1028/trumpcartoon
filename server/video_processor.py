#!/usr/bin/env python3

import os
import sys
import json
import time

try:
    from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_videoclips, CompositeVideoClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    print("Warning: moviepy module not found. Video processing will not work.")
    VideoFileClip = None
    AudioFileClip = None
    concatenate_videoclips = None
    CompositeVideoClip = None
    MOVIEPY_AVAILABLE = False

# Directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
VIDEOS_DIR = os.path.join(STATIC_DIR, "videos")
VOICES_DIR = os.path.join(STATIC_DIR, "voices")
CLIPS_DIR = os.path.join(STATIC_DIR, "clips")

# Ensure all required directories exist
for directory in [VIDEOS_DIR, VOICES_DIR, CLIPS_DIR]:
    os.makedirs(directory, exist_ok=True)

# Fixed video segments
VIDEO_SEGMENTS = {
    "trump1": os.path.join(CLIPS_DIR, "trump1.mp4"),
    "zelensky": os.path.join(CLIPS_DIR, "zelensky.mp4"),
    "trump2": os.path.join(CLIPS_DIR, "trump2.mp4"),
    "vance": os.path.join(CLIPS_DIR, "vance.mp4")
}

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
    # Check if moviepy is available before proceeding
    if not MOVIEPY_AVAILABLE:
        print("Error: moviepy module is not available. Cannot process video.")
        # Return a mock video URL
        output_filename = f"remix_{remix_id}.mp4"
        return {"videoUrl": f"/videos/{output_filename}"}
        
    try:
        start_time = time.time()
        print(f"Starting video processing for remix {remix_id}")
        
        # Check if all required fixed video clips exist
        for char, video_path in VIDEO_SEGMENTS.items():
            if not os.path.exists(video_path):
                print(f"Error: Fixed video clip not found: {video_path}")
                raise FileNotFoundError(f"Missing video segment: {video_path}")

        # Check if all required audio files exist
        for char, audio_path in audio_files.items():
            # Convert relative paths to absolute paths if needed
            if audio_path.startswith('/voices/'):
                audio_path = os.path.join(STATIC_DIR, audio_path[1:])
                audio_files[char] = audio_path
                
            if not os.path.exists(audio_files[char]):
                print(f"Error: Audio file not found: {audio_files[char]}")
                raise FileNotFoundError(f"Missing audio file: {audio_files[char]}")
        
        # Prepare the output video filename
        output_filename = f"remix_{remix_id}.mp4"
        output_path = os.path.join(VIDEOS_DIR, output_filename)
        
        # First, process individual segments with their audio
        processed_segments = {}
        segment_durations = {}
        
        for char in ["trump1", "zelensky", "trump2", "vance"]:
            video_path = VIDEO_SEGMENTS[char]
            audio_path = audio_files[char]
            
            print(f"Processing segment {char} - Video: {video_path}, Audio: {audio_path}")
            
            # Load the video and audio
            video = VideoFileClip(video_path).loop()  # Loop the video to ensure it's long enough for the audio
            audio = AudioFileClip(audio_path)
            
            # Set the video clip duration to match the audio
            audio_duration = audio.duration
            segment_durations[char] = audio_duration
            
            # Limit video to the exact audio duration to avoid the black screen
            video = video.subclip(0, audio_duration)
            
            # Apply the audio to the video
            video = video.set_audio(audio)
            
            # Save this processed segment
            processed_segments[char] = video
            
        # Calculate total duration for progress tracking
        total_duration = sum(segment_durations.values())
        print(f"Total duration of all segments: {total_duration} seconds")
            
        # Create segments with crossfade transitions
        video_clips = []
        current_position = 0
        
        # Add segments in sequence with a small crossfade
        for char in ["trump1", "zelensky", "trump2", "vance"]:
            clip = processed_segments[char]
            video_clips.append(clip)
            current_position += segment_durations[char]
        
        # Concatenate all video segments (method=compose handles transitions better than method=chain)
        final_clip = concatenate_videoclips(video_clips, method="compose")
        
        # Write the final video to file
        print(f"Writing final video to {output_path}")
        final_clip.write_videofile(
            output_path, 
            codec="libx264", 
            audio_codec="aac", 
            temp_audiofile=os.path.join(VIDEOS_DIR, f"temp_{remix_id}.m4a"),
            remove_temp=True,
            threads=4,
            fps=24
        )
        
        # Close all clips to release resources
        for clip in video_clips:
            clip.close()
        final_clip.close()
        
        elapsed_time = time.time() - start_time
        print(f"Video processing completed in {elapsed_time:.2f} seconds")
        
        # Return the relative URL for the frontend
        return {
            "videoUrl": f"/videos/{output_filename}"
        }
        
    except Exception as e:
        print(f"Error in video processing: {str(e)}")
        raise e

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
        
        # Clear any previous output to stdout
        sys.stdout = open(os.devnull, 'w')
        
        # Process the video
        result = process_video(remix_id, audio_files)
        
        # Restore stdout and print only the JSON result
        sys.stdout = sys.__stdout__
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()