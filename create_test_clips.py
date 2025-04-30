#!/usr/bin/env python3

from moviepy.editor import ColorClip
import os

# Create directory if it doesn't exist
os.makedirs('static/clips', exist_ok=True)

# Create simple colored video clips for each character
clips = [
    ('video_1_trump1.mp4', (255, 0, 0), 6),    # Red for Trump (first line)
    ('video_2_zelensky.mp4', (0, 0, 255), 6),  # Blue for Zelensky
    ('video_3_trump2.mp4', (255, 0, 0), 6),    # Red for Trump (second line)
    ('video_4_jd.mp4', (255, 165, 0), 3)       # Orange for JD Vance
]

for filename, color, duration in clips:
    filepath = os.path.join('static/clips', filename)
    if not os.path.exists(filepath):
        print(f'Creating {filepath}...')
        clip = ColorClip(size=(640, 360), color=color, duration=duration)
        clip.write_videofile(filepath, fps=24, codec='libx264', audio_codec='aac')
        clip.close()
    else:
        print(f'{filepath} already exists, skipping')
