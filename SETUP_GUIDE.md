# SoundSketch - Audio to Sheet Music Converter
## Complete Setup & Testing Guide

## 🎯 What This Does

This system converts MP3/WAV audio files into sheet music (MusicXML format) through:
1. **AI-powered instrument separation** (vocals, drums, bass, other instruments)
2. **Audio-to-MIDI conversion** (pitch detection and note extraction)
3. **MIDI-to-MusicXML conversion** (professional sheet music format)

---

## 📋 Prerequisites

- **Python 3.8+** (Python 3.9-3.11 recommended)
- **Windows/Mac/Linux** 
- **2-4GB free RAM**
- **Internet connection** (for initial model download)

---

## 🚀 Quick Start Guide

### Step 1: Install Python Dependencies

Open PowerShell in the `python` directory:

```powershell
cd c:\Code\SoundSketch\python

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install all dependencies
pip install -r requirements.txt
```

**⏱️ First install takes 10-15 minutes** (downloads ~300MB of AI models)

### Step 2: Start the API Server

```powershell
python api_server.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Step 3: Test with the Web Interface

1. Keep the server running
2. Open `python/test_upload.html` in your web browser
3. Upload an MP3 or WAV file
4. Wait 2-5 minutes for processing
5. Download your sheet music files!

---

## 🧪 Testing Without the Full Website

### Option 1: HTML Test Page (Easiest)

Open `python/test_upload.html` in any browser. This provides a complete UI for testing.

### Option 2: Command Line with curl

```powershell
# Upload a file
curl -X POST -F "file=@your_song.mp3" http://localhost:8000/api/convert

# You'll get a response like:
# {"job_id":"abc-123-def","status":"queued","message":"..."}

# Check status (replace JOB_ID with the actual ID)
curl http://localhost:8000/api/status/JOB_ID

# Download MusicXML file
curl http://localhost:8000/api/download/JOB_ID/musicxml/vocals -o vocals.musicxml

# Download MIDI file
curl http://localhost:8000/api/download/JOB_ID/midi/vocals -o vocals.mid
```

### Option 3: Python Script

Create `test_client.py`:

```python
import requests
import time

API_URL = "http://localhost:8000"

# Upload file
with open("your_song.mp3", "rb") as f:
    response = requests.post(f"{API_URL}/api/convert", files={"file": f})
    job = response.json()
    job_id = job["job_id"]
    print(f"Job ID: {job_id}")

# Poll for completion
while True:
    status = requests.get(f"{API_URL}/api/status/{job_id}").json()
    print(f"Status: {status['status']}")
    
    if status["status"] in ["completed", "failed", "completed_with_errors"]:
        break
    
    time.sleep(3)

# Download files
if status["status"] == "completed":
    for file in status["musicxml_files"]:
        instrument = file["instrument"]
        
        # Download MusicXML
        xml_response = requests.get(
            f"{API_URL}/api/download/{job_id}/musicxml/{instrument}"
        )
        with open(f"{instrument}.musicxml", "wb") as f:
            f.write(xml_response.content)
        
        print(f"Downloaded: {instrument}.musicxml")
```

---

## 🔗 Integration with T3 Stack Website

### How It Works When a User Visits the Website:

1. **User uploads audio file** through Next.js frontend
2. **Frontend sends file** to your Next.js API route (`/api/analyze-file/route.ts`)
3. **Next.js API route forwards** the file to Python FastAPI server (`http://localhost:8000/api/convert`)
4. **Python server returns job ID** immediately (non-blocking)
5. **Frontend polls** for status updates (`/api/status/{job_id}`)
6. **When complete**, frontend downloads files and displays them to user

### Sample Next.js Integration

Update your `src/app/api/analyze-file/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward to Python API
    const pythonFormData = new FormData();
    pythonFormData.append('file', file);

    const response = await fetch(`${PYTHON_API_URL}/api/convert`, {
      method: 'POST',
      body: pythonFormData,
    });

    if (!response.ok) {
      throw new Error('Python API error');
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${PYTHON_API_URL}/api/status/${jobId}`);
    const status = await response.json();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
```

---

## 🔑 API Keys & Costs

### ✅ No API Keys Required!

All processing runs **100% locally**:
- **Demucs** - Free, open-source AI from Meta (Facebook)
- **librosa** - Free, open-source audio analysis
- **music21** - Free, open-source music theory library
- **pretty_midi** - Free, open-source MIDI library

**Total Cost: $0** (besides your own compute resources)

---

## 📊 How the API Works

### Architecture Flow:

```
User Browser
    ↓
Next.js Frontend (Port 3000)
    ↓
Next.js API Route (/api/analyze-file)
    ↓
Python FastAPI Server (Port 8000)
    ↓
Audio Processor
    ├→ Demucs (separate instruments)
    ├→ librosa (pitch detection)
    ├→ pretty_midi (create MIDI)
    └→ music21 (generate MusicXML)
    ↓
Return job_id → Poll for status → Download files
```

### API Endpoints:

| Endpoint                                     | Method | Purpose                           |
| -------------------------------------------- | ------ | --------------------------------- |
| `/api/convert`                               | POST   | Upload audio file, returns job_id |
| `/api/status/{job_id}`                       | GET    | Check processing status           |
| `/api/download/{job_id}/{type}/{instrument}` | GET    | Download result file              |
| `/api/jobs`                                  | GET    | List all jobs                     |
| `/health`                                    | GET    | Server health check               |

---

## 🎵 Technology Stack

### Python Libraries:

1. **Demucs (4.0.1)**
   - Meta's state-of-the-art source separation
   - Uses hybrid transformer architecture
   - Separates: vocals, drums, bass, other
   - CPU & GPU support

2. **music21 (9.1.0)**
   - Comprehensive music analysis toolkit
   - MusicXML generation
   - Key/time signature detection
   - Music theory operations

3. **librosa (0.10.1)**
   - Audio feature extraction
   - Pitch detection (piptrack algorithm)
   - Onset detection (note timing)
   - Tempo/beat tracking

4. **pretty_midi (0.2.10)**
   - MIDI file creation
   - Note manipulation
   - Instrument mapping

5. **FastAPI (0.104.1)**
   - Modern async web framework
   - Automatic API documentation
   - Type safety with Pydantic

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Processing settings
DEMUCS_MODEL=htdemucs        # Best quality model
SAMPLE_RATE=22050            # Audio sample rate
MIN_NOTE_DURATION=0.1        # Minimum note length

# API settings
API_PORT=8000
CORS_ORIGINS=http://localhost:3000

# File limits
MAX_FILE_SIZE=100000000      # 100MB
```

---

## 🐛 Troubleshooting

### "No module named 'demucs'"
```powershell
pip install -r requirements.txt --upgrade
```

### "Connection refused" when testing
Make sure the API server is running on port 8000

### "Out of memory" errors
- Process shorter audio files
- Use a machine with more RAM
- Close other applications

### CORS errors from frontend
Update `CORS_ORIGINS` in `.env` or `api_server.py`

### Slow processing
- First run downloads AI models (one-time)
- Enable GPU acceleration for faster processing
- Expected: 2-10 minutes per song

---

## 🚀 Performance

- **Processing time:** 2-10 minutes per song (depends on length)
- **CPU usage:** High during separation (100% on 4+ cores)
- **Memory:** 2-4GB per job
- **Disk space:** ~50MB per processed song

### GPU Acceleration (Optional)

For NVIDIA GPUs with CUDA:

```powershell
pip uninstall torch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

This can reduce processing time by 3-5x.

---

## 📁 Output Files

After processing, you'll get:

```
output/
└── {job_id}/
    ├── separated/
    │   └── htdemucs/{song_name}/
    │       ├── vocals.wav
    │       ├── drums.wav
    │       ├── bass.wav
    │       └── other.wav
    ├── midi/
    │   ├── vocals.mid
    │   ├── drums.mid
    │   ├── bass.mid
    │   └── other.mid
    └── musicxml/
        ├── vocals.musicxml
        ├── drums.musicxml
        ├── bass.musicxml
        └── other.musicxml
```

### Opening MusicXML Files:

- **MuseScore** (Free) - https://musescore.org
- **Finale**
- **Sibelius**
- **Dorico**

---

## 🎯 Next Steps

1. **Test locally** with the HTML interface
2. **Integrate** with your T3 stack frontend
3. **Deploy** to production server
4. **Add features** like batch processing, real-time updates

---

## 📞 Support

For issues or questions:
1. Check the logs in the terminal
2. Review the `jobs.json` file for job details
3. Test with the HTML interface first
4. Check CORS settings if integrating with frontend

---

## 📄 License

See main project LICENSE file.
