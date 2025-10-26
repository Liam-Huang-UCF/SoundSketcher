"""
Configuration settings for the audio processor
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).parent

# Directories
UPLOAD_DIR = BASE_DIR / os.getenv('UPLOAD_DIR', 'uploads')
OUTPUT_DIR = BASE_DIR / os.getenv('OUTPUT_DIR', 'output')
INPUT_DIR = BASE_DIR / 'input'

# File settings
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 100 * 1024 * 1024))  # 100MB default
ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac']

# Audio processing settings
DEMUCS_MODEL = os.getenv('DEMUCS_MODEL', 'htdemucs')  # htdemucs, htdemucs_ft, mdx_extra
SAMPLE_RATE = int(os.getenv('SAMPLE_RATE', 22050))
HOP_LENGTH = int(os.getenv('HOP_LENGTH', 512))

# MIDI settings
DEFAULT_TEMPO = int(os.getenv('DEFAULT_TEMPO', 120))
MIN_NOTE_DURATION = float(os.getenv('MIN_NOTE_DURATION', 0.1))  # seconds
DEFAULT_VELOCITY = int(os.getenv('DEFAULT_VELOCITY', 64))

# API settings
API_HOST = os.getenv('API_HOST', '0.0.0.0')
API_PORT = int(os.getenv('API_PORT', 8000))
API_RELOAD = os.getenv('API_RELOAD', 'true').lower() == 'true'

# CORS settings
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(',')

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Create necessary directories
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
INPUT_DIR.mkdir(exist_ok=True)
