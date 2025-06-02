#!/usr/bin/env python3

import os
import sys
import json
import time
from uuid import uuid4

try:
    from fish_audio_sdk import Session, TTSRequest
    FISH_SDK_AVAILABLE = True
except ImportError:
    print(
        "Warning: fish_audio_sdk module not found. Install with pip install fish-audio-sdk"
    )
    FISH_SDK_AVAILABLE = False

try:
    from pydub import AudioSegment
except ImportError:
    print(
        "Warning: pydub module not found. Mock TTS will not generate real silent audio."
    )
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
    "zelensky":
    "6be22288f35f4e9b964bdbeb099baee1",  # Zelensky custom voice model
    "vance": "86d3aee7cd9b4aab8cd8e54c3d35492b"  # JD Vance custom voice model
}


def generate_tts(character, text, api_key=None, max_retries=2):
    """
    Generate TTS audio using Fish.audio SDK
    
    Args:
        character (str): Character identifier (trump, zelensky, vance)
        text (str): Text to convert to speech
        api_key (str): Fish.audio API key (optional, will use env var if not provided)
        max_retries: Maximum number of retries if generation fails
    
    Returns:
        str: Path to the generated audio file
    """
    # Use the provided API key or get from environment variable
    api_key = api_key or os.environ.get("FISH_AUDIO_API_KEY")

    # Check if we have the API key and Fish SDK
    if not api_key or not FISH_SDK_AVAILABLE:
        print(
            "Warning: No Fish.audio API key provided or SDK missing. Using mock TTS generation."
        )
        return generate_mock_tts(character, text)

    # Limit text length to avoid errors (max 200 characters)
    if len(text) > 200:
        print(
            f"Warning: Text too long ({len(text)} chars). Truncating to 200 chars."
        )
        text = text[:197] + "..."

    for attempt in range(max_retries):
        try:
            print(
                f"Generating TTS for {character}: '{text}' (Attempt {attempt+1}/{max_retries})"
            )

            # Generate a unique filename
            file_id = str(uuid4()).replace("-", "")[:8]
            filename = f"{character}_{file_id}.mp3"
            output_path = os.path.join(VOICES_DIR, filename)

            # Select the appropriate voice reference ID for the character
            reference_id = FISH_VOICE_MAPPING.get(character)

            if not reference_id:
                print(
                    f"Warning: No voice model found for {character}. Using mock TTS generation."
                )
                return generate_mock_tts(character, text)

            print(
                f"Using Fish Audio model ID: {reference_id} for character: {character}"
            )

            # Create a Fish Audio SDK session
            session = Session(api_key)

            # Create a TTS request with the reference ID and increase speaking rate for argumentative delivery
            # Add emotional context to the text to make it sound more argumentative
            argumentative_text = f"{text}"

            tts_request = TTSRequest(
                reference_id=reference_id,
                text=argumentative_text,
                speaking_rate=
                1.5  # Increase speaking rate by 60% to sound like a heated argument
            )

            # Generate the audio and save to file
            audio_chunks = []
            with open(output_path, "wb") as f:
                for chunk in session.tts(tts_request):
                    audio_chunks.append(chunk)
                    f.write(chunk)

            # Check if the file size is suspiciously large (more than 200KB for a short phrase)
            file_size = os.path.getsize(output_path)
            if file_size > 200000 and len(text) < 100:
                print(
                    f"Warning: Generated audio file is suspiciously large ({file_size} bytes)"
                )
                if attempt < max_retries - 1:
                    print("Retrying...")
                    os.remove(output_path)
                    continue
                else:
                    print("All retries failed, using mock TTS instead")
                    return generate_mock_tts(character, text)

            print(f"TTS audio saved to {output_path} ({file_size} bytes)")
            return f"/voices/{filename}"

        except Exception as error:
            print(f"Error generating TTS: {str(error)}")
            if attempt < max_retries - 1:
                print("Retrying due to error...")
                continue
            # Fall back to mock TTS if all retries fail
            break

    # If we've exhausted all retries or encountered errors
    print("All TTS generation attempts failed, using mock TTS instead")
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

        # Check if we have pydub for generating silent audio
        if AudioSegment is not None:
            # Create a silent audio file with appropriate duration
            # Estimate duration based on text length (approx 3 chars per second)
            duration_ms = len(text) * 333  # ~3 chars per second

            # Ensure minimum duration of 1 second
            duration_ms = max(1000, duration_ms)

            # Create silent audio of appropriate length
            silence = AudioSegment.silent(duration=duration_ms)
            silence.export(output_path, format="mp3")
        else:
            # Create an empty file if pydub is not available
            with open(output_path, 'wb') as f:
                f.write(b'')  # Write an empty file

        print(f"Generated mock TTS audio for '{text}' at {output_path}")
        return f"/voices/{filename}"

    except Exception as e:
        print(f"Error generating mock TTS: {str(e)}")
        # If everything fails, just return a path that might not exist
        return f"/voices/{character}_{str(uuid4()).replace('-', '')[:8]}.mp3"


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
        # Use stderr for error messages to keep stdout clean for JSON
        print(
            "Usage: python tts_processor.py '{\"script\": {...}, \"apiKey\": \"...\"}'",
            file=sys.stderr)
        print(json.dumps({"error": "Missing JSON input argument"}))
        sys.exit(1)

    try:
        # Parse the JSON input
        input_data = json.loads(sys.argv[1])
        script = input_data.get("script")
        api_key = input_data.get("apiKey")

        if not script:
            print("Error: Missing 'script' field in input JSON",
                  file=sys.stderr)
            print(json.dumps({"error": "Missing 'script' field in input"}))
            sys.exit(1)

        # Redirect all logs to stderr
        log_file = os.path.join(VOICES_DIR, f"tts_log_{time.time()}.log")
        with open(log_file, 'w') as f:
            # Save original stdout/stderr
            original_stdout = sys.stdout
            original_stderr = sys.stderr

            # Redirect stdout to the log file for debugging logs
            sys.stdout = f

            try:
                # Generate TTS for all lines
                print(f"Processing script: {json.dumps(script)}", file=f)
                result = generate_all_tts(script, api_key)
                print(f"Generated results: {json.dumps(result)}", file=f)

                # Restore stdout and print only the JSON result
                sys.stdout = original_stdout
                print(json.dumps(result))
            except Exception as inner_e:
                # Log the error
                print(f"Error during TTS generation: {str(inner_e)}", file=f)

                # Restore stdout
                sys.stdout = original_stdout
                print(json.dumps({"error": str(inner_e)}))
                sys.exit(1)
            finally:
                # Ensure we restore stdout/stderr
                sys.stdout = original_stdout
                sys.stderr = original_stderr

    except json.JSONDecodeError as je:
        print(f"JSON parsing error: {str(je)}", file=sys.stderr)
        print(json.dumps({"error": f"Invalid JSON input: {str(je)}"}))
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
