#!/usr/bin/env python3

import sys
import json
import os
from server.tts_processor import generate_tts

def main():
    """
    Test the TTS generation with a simple phrase for each character
    """
    print("Testing TTS generation with Fish Audio SDK...")
    
    # Get the API key from environment variable
    api_key = os.environ.get("FISH_AUDIO_API_KEY")
    if not api_key:
        print("Error: FISH_AUDIO_API_KEY environment variable not set")
        sys.exit(1)
    
    # Test phrases
    test_phrases = {
        "trump": "Nobody knows testing better than me. I test things beautifully, believe me.",
        "zelensky": "In Ukraine, we fight for freedom and better voice models every day.",
        "vance": "Down in Appalachia, we understand the importance of good text-to-speech."
    }
    
    # Generate TTS for each phrase
    results = {}
    for character, phrase in test_phrases.items():
        print(f"\nGenerating TTS for {character}: '{phrase}'")
        try:
            audio_path = generate_tts(character, phrase, api_key)
            results[character] = audio_path
            print(f"Success! Audio saved to: {audio_path}")
        except Exception as e:
            print(f"Error generating TTS for {character}: {str(e)}")
    
    # Print overall results
    print("\nTTS Generation Results:")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()