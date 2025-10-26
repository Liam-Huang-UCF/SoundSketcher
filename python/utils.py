"""
Utility functions for audio processing
"""

import os
from pathlib import Path
from typing import Optional
import hashlib


def get_file_hash(file_path: str) -> str:
    """Generate MD5 hash of a file"""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def get_file_size_mb(file_path: str) -> float:
    """Get file size in megabytes"""
    return os.path.getsize(file_path) / (1024 * 1024)


def validate_audio_file(file_path: str, allowed_extensions: list) -> tuple[bool, Optional[str]]:
    """
    Validate an audio file
    
    Returns:
        (is_valid, error_message)
    """
    path = Path(file_path)
    
    if not path.exists():
        return False, "File does not exist"
    
    if not path.is_file():
        return False, "Path is not a file"
    
    ext = path.suffix.lower()
    if ext not in allowed_extensions:
        return False, f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
    
    return True, None


def format_duration(seconds: float) -> str:
    """Format duration in seconds to MM:SS"""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"


def cleanup_old_files(directory: Path, max_age_hours: int = 24):
    """
    Remove files older than max_age_hours
    """
    import time
    
    if not directory.exists():
        return
    
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    
    for item in directory.iterdir():
        if item.is_file():
            file_age = current_time - item.stat().st_mtime
            if file_age > max_age_seconds:
                item.unlink()
                print(f"Deleted old file: {item}")
        elif item.is_dir():
            # Recursively clean directories
            cleanup_old_files(item, max_age_hours)
            # Remove empty directories
            if not any(item.iterdir()):
                item.rmdir()
                print(f"Deleted empty directory: {item}")


def ensure_dir(directory: Path):
    """Ensure a directory exists"""
    directory.mkdir(parents=True, exist_ok=True)


def get_audio_duration(file_path: str) -> Optional[float]:
    """
    Get audio duration in seconds using librosa
    Returns None if unable to determine
    """
    try:
        import librosa
        y, sr = librosa.load(file_path, sr=None, duration=1)
        info = librosa.get_duration(path=file_path)
        return info
    except Exception:
        return None
