#!/usr/bin/env python3

import os
import sys
import json
import time
from uuid import uuid4

try:
    import requests
except ImportError:
    print("Warning: requests module not found. API calls will not work.")
    requests = None

try:
    from pydub import AudioSegment
except ImportError:
    print("Warning: pydub module not found. Mock TTS will not generate real silent audio.")
    AudioSegment = None

# Directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
VOICES_DIR = os.path.join(STATIC_DIR, "voices")

# Ensure voices directory exists
os.makedirs(VOICES_DIR, exist_ok=True)

# Character voice mappings for Fish.audio
# Using the specific voice models provided
FISH_VOICE_MAPPING = {
    "trump": "e58b0d7efca34eb38d5c4985e378abcb",  # Trump custom voice model
    "zelensky": "6be22288f35f4e9b964bdbeb099baee1",  # Zelensky custom voice model
    "vance": "86d3aee7cd9b4aab8cd8e54c3d35492b"  # JD Vance custom voice model
}

def generate_tts(character, text, api_key=None):
    """
    Generate TTS audio using Fish.audio API
    
    Args:
        character (str): Character identifier (trump, zelensky, vance)
        text (str): Text to convert to speech
        api_key (str): Fish.audio API key (optional, will use env var if not provided)
    
    Returns:
        str: Path to the generated audio file
    """
    # Use the provided API key or get from environment variable
    api_key = api_key or os.environ.get("FISH_AUDIO_API_KEY")
    
    if not api_key:
        print("Warning: No Fish.audio API key provided. Using mock TTS generation.")
        return generate_mock_tts(character, text)
    
    try:
        print(f"Generating TTS for {character}: '{text}'")
        
        # Generate a unique filename
        file_id = str(uuid4()).replace("-", "")[:8]
        filename = f"{character}_{file_id}.mp3"
        output_path = os.path.join(VOICES_DIR, filename)
        
        # Select the appropriate voice for the character
        voice_id = FISH_VOICE_MAPPING.get(character, "en_male_neutral")
        
        # Make API request to Fish.audio
        url = "https://api.fish.audio/v1/tts"
        payload = {
            "text": text,
            "voice_id": voice_id
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        print(f"Sending request to Fish.audio API with voice: {voice_id}")
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code != 200:
            print(f"Error from Fish.audio API: {response.status_code} - {response.text}")
            raise Exception(f"Fish.audio API error: {response.text}")
        
        # Save the audio file
        with open(output_path, "wb") as f:
            f.write(response.content)
        
        print(f"TTS audio saved to {output_path}")
        return f"/voices/{filename}"
    
    except Exception as e:
        print(f"Error generating TTS: {str(e)}")
        # Fall back to mock TTS if the real API fails
        return generate_mock_tts(character, text)

def generate_mock_tts(character, text):
    """
    Generate a mock TTS file for testing when no API key is available
    
    Args:
        character (str): Character identifier
        text (str): Text to convert to speech
    
    Returns:
        str: Path to the generated mock audio file
    """
    try:
        # Generate a unique filename
        file_id = str(uuid4()).replace("-", "")[:8]
        filename = f"{character}_{file_id}.mp3"
        output_path = os.path.join(VOICES_DIR, filename)
        
        # Create a silent audio file with appropriate duration
        # Estimate duration based on text length (approx 3 chars per second)
        duration_ms = len(text) * 333  # ~3 chars per second
        
        # Ensure minimum duration of 1 second
        duration_ms = max(1000, duration_ms)
        
        # Create silent audio of appropriate length
        silence = AudioSegment.silent(duration=duration_ms)
        silence.export(output_path, format="mp3")
        
        print(f"Generated mock TTS audio for '{text}' at {output_path}")
        return f"/voices/{filename}"
    
    except Exception as e:
        print(f"Error generating mock TTS: {str(e)}")
        raise e

def generate_all_tts(script, api_key=None):
    """
    Generate TTS for all lines in a script
    
    Args:
        script (dict): Script with lines for each character
            {
                "trump1": "Trump's first line",
                "zelensky": "Zelensky's line",
                "trump2": "Trump's second line",
                "vance": "Vance's line"
            }
        api_key (str): Fish.audio API key (optional)
    
    Returns:
        dict: Paths to all generated audio files
            {
                "trump1": "/voices/trump_123.mp3",
                "zelensky": "/voices/zelensky_456.mp3",
                "trump2": "/voices/trump_789.mp3",
                "vance": "/voices/vance_012.mp3"
            }
    """
    result = {}
    
    # Map the script characters to their corresponding voice character
    char_mapping = {
        "trump1": "trump",
        "zelensky": "zelensky",
        "trump2": "trump",
        "vance": "vance"
    }
    
    for script_char, line in script.items():
        voice_char = char_mapping.get(script_char, script_char)
        result[script_char] = generate_tts(voice_char, line, api_key)
    
    return result

def main():
    """
    Main entry point for the script when called directly.
    Expects a JSON string as the first argument with the following structure:
    {
        "script": {
            "trump1": "Trump's first line",
            "zelensky": "Zelensky's line",
            "trump2": "Trump's second line",
            "vance": "Vance's line"
        },
        "apiKey": "optional-fish-audio-api-key"
    }
    """
    if len(sys.argv) != 2:
        print("Usage: python tts_processor.py '{\"script\": {...}, \"apiKey\": \"...\"}'")
        sys.exit(1)
    
    try:
        # Parse the JSON input
        input_data = json.loads(sys.argv[1])
        script = input_data.get("script")
        api_key = input_data.get("apiKey")
        
        if not script:
            print("Error: Missing 'script' field in input JSON")
            sys.exit(1)
        
        # Generate TTS for all lines
        result = generate_all_tts(script, api_key)
        
        # Output the result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()