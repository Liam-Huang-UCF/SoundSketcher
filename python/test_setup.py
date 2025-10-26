"""
Simple test script to validate the audio processor setup
Run this to check if all dependencies are installed correctly
"""

import sys

def test_imports():
    """Test if all required libraries can be imported"""
    print("Testing imports...\n")
    
    tests = [
        ("FastAPI", "fastapi"),
        ("Uvicorn", "uvicorn"),
        ("Demucs", "demucs"),
        ("Librosa", "librosa"),
        ("Music21", "music21"),
        ("Pretty MIDI", "pretty_midi"),
        ("NumPy", "numpy"),
        ("SciPy", "scipy"),
    ]
    
    failed = []
    
    for name, module in tests:
        try:
            __import__(module)
            print(f"✓ {name:20s} OK")
        except ImportError as e:
            print(f"✗ {name:20s} FAILED: {e}")
            failed.append(module)
    
    print("\n" + "="*50)
    
    if not failed:
        print("✓ All dependencies installed successfully!")
        print("\nYou can now run the API server:")
        print("  python api_server.py")
        return True
    else:
        print(f"✗ {len(failed)} dependencies missing:")
        for module in failed:
            print(f"  - {module}")
        print("\nPlease install missing dependencies:")
        print("  pip install -r requirements.txt")
        return False


def test_directories():
    """Test if required directories exist"""
    from pathlib import Path
    
    print("\n" + "="*50)
    print("Testing directories...\n")
    
    base_dir = Path(__file__).parent
    required_dirs = ['uploads', 'output', 'input']
    
    for dir_name in required_dirs:
        dir_path = base_dir / dir_name
        dir_path.mkdir(exist_ok=True)
        if dir_path.exists():
            print(f"✓ {dir_name:20s} OK")
        else:
            print(f"✗ {dir_name:20s} FAILED")
    
    print("\n" + "="*50)


def test_audio_processor():
    """Test if the audio processor can be instantiated"""
    print("\nTesting audio processor...\n")
    
    try:
        from audio_processor import AudioProcessor
        processor = AudioProcessor(output_dir="test_output")
        print("✓ AudioProcessor initialized successfully")
        return True
    except Exception as e:
        print(f"✗ AudioProcessor initialization failed: {e}")
        return False


def main():
    print("="*50)
    print("SoundSketch Audio Processor - Setup Validator")
    print("="*50)
    
    # Test imports
    imports_ok = test_imports()
    
    if imports_ok:
        # Test directories
        test_directories()
        
        # Test audio processor
        test_audio_processor()
        
        print("\n" + "="*50)
        print("Setup validation complete!")
        print("\nNext steps:")
        print("1. Start the API server: python api_server.py")
        print("2. Open test_upload.html in your browser")
        print("3. Upload an audio file to test")
        print("="*50)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
