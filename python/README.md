# SoundSketch Python Audio Processor

## Overview
This Python backend converts audio files to sheet music through a simple process:
1. **MIDI Conversion** - Converts audio to MIDI format using pitch detection
2. **MusicXML Generation** - Converts MIDI to standard sheet music format

## Installation

### 1. Create a virtual environment (recommended)
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install dependencies
```powershell
pip install -r requirements.txt
```

## Usage

### Running the API Server

```powershell
cd python
python api_server.py
```

The server will start on `http://localhost:8000`

### Testing with the HTML Interface

1. Start the API server (see above)
2. Open `test_upload.html` in your web browser
3. Upload an MP3/WAV file
4. Wait for processing (30 seconds - 2 minutes depending on file length)
5. Download the generated MusicXML and MIDI files

### Testing Programmatically

```python
import requests

# Upload a file
with open('your_audio.mp3', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/api/convert', files=files)
    job_id = response.json()['job_id']

# Check status
status = requests.get(f'http://localhost:8000/api/status/{job_id}')
print(status.json())

# Download MusicXML
response = requests.get(f'http://localhost:8000/api/download/{job_id}/musicxml/vocals')
with open('vocals.musicxml', 'wb') as f:
    f.write(response.content)
```

## API Endpoints

### POST `/api/convert`
Upload an audio file for conversion
- **Body:** `multipart/form-data` with `file` field
- **Returns:** `{ job_id, status, message }`

### GET `/api/status/{job_id}`
Get the status of a conversion job
- **Returns:** Job status and file information

### GET `/api/download/{job_id}/{file_type}/{instrument}`
Download a generated file
- **file_type:** `midi` or `musicxml`
- **instrument:** `vocals`, `drums`, `bass`, or `other`

### GET `/api/jobs`
List recent conversion jobs

### DELETE `/api/jobs/{job_id}`
Delete a job and its files

## Directory Structure

```
python/
├── api_server.py          # FastAPI server
├── audio_processor.py     # Core audio processing logic
├── requirements.txt       # Python dependencies
├── test_upload.html       # Testing interface
├── uploads/               # Uploaded audio files (created automatically)
├── output/                # Generated files (created automatically)
│   └── {job_id}/
│       ├── separated/     # Separated instrument tracks
│       ├── midi/          # MIDI files
│       └── musicxml/      # Sheet music files
└── jobs.json             # Job database (created automatically)
```

## Technologies Used

### Audio Processing
- **librosa** - Audio feature extraction and pitch detection
- **soundfile** - Audio file I/O
- **pydub** - Audio manipulation utilities

### Music Analysis
- **pretty_midi** - MIDI file creation and manipulation
- **music21** - Music theory analysis and MusicXML generation

### API Framework
- **FastAPI** - Modern async Python web framework
- **Uvicorn** - ASGI server

## Configuration

### Environment Variables (optional)
Create a `.env` file in the `python/` directory:

```
OUTPUT_DIR=output
UPLOAD_DIR=uploads
MAX_FILE_SIZE=100000000  # 100MB
```

## Integration with T3 Stack

### From Next.js Frontend

```typescript
// In your Next.js API route or client component
async function convertAudioToSheet(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8000/api/convert', {
    method: 'POST',
    body: formData,
  });

  const { job_id } = await response.json();
  
  // Poll for status
  const checkStatus = async () => {
    const statusResponse = await fetch(`http://localhost:8000/api/status/${job_id}`);
    const status = await statusResponse.json();
    
    if (status.status === 'completed') {
      return status;
    } else if (status.status === 'failed') {
      throw new Error('Conversion failed');
    }
    
    // Continue polling
    await new Promise(resolve => setTimeout(resolve, 2000));
    return checkStatus();
  };

  return await checkStatus();
}
```

## Performance Notes

- **Processing Time:** 2-10 minutes per song depending on length and complexity
- **CPU Usage:** High during source separation (Demucs is compute-intensive)
- **Memory:** ~2-4GB RAM per job
- **GPU Support:** Demucs can use NVIDIA GPUs with CUDA for faster processing

### Enabling GPU Acceleration

If you have an NVIDIA GPU with CUDA:

```powershell
pip uninstall torch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Troubleshooting

### "Module not found" errors
```powershell
pip install -r requirements.txt --upgrade
```

### Demucs fails to download models
Check your internet connection. Models are downloaded on first use.

### Out of memory errors
Reduce the length of input audio or process on a machine with more RAM.

### CORS errors from frontend
Update the `allow_origins` list in `api_server.py` to include your frontend URL.

## API Keys & Costs

**No API keys required!** All processing runs locally:
- ✅ Demucs - Free, open source, runs locally
- ✅ librosa - Free, open source
- ✅ music21 - Free, open source

**Cost:** $0 (besides compute resources)

## Next Steps

1. **Production Deployment:**
   - Use a process manager (PM2, systemd)
   - Add authentication/rate limiting
   - Use PostgreSQL instead of JSON file storage
   - Deploy to cloud (AWS, GCP, Azure)

2. **Enhancements:**
   - Add beat detection for better rhythm quantization
   - Support for more output formats (PDF, MIDI with better quantization)
   - Real-time progress updates via WebSockets
   - Batch processing support

## License

See main project LICENSE file.
