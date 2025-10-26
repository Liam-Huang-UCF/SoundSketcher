# 🚀 Quick Start - Testing the Audio to Sheet Music API

## 1. Install Dependencies (One-time setup)

```powershell
cd c:\Code\SoundSketch\python
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

⏱️ **First install: 10-15 minutes** (downloads AI models)

---

## 2. Start the API Server

```powershell
cd c:\Code\SoundSketch\python
.\venv\Scripts\Activate.ps1
python api_server.py
```

✅ Server runs on: **http://localhost:8000**

---

## 3. Test It!

### Option A: Web Interface (Recommended)
1. Open `python/test_upload.html` in your browser
2. Upload an MP3/WAV file
3. Wait 2-5 minutes
4. Download your sheet music!

### Option B: Command Line
```powershell
# Upload
curl -X POST -F "file=@song.mp3" http://localhost:8000/api/convert

# Get status (replace JOB_ID with actual ID from above)
curl http://localhost:8000/api/status/JOB_ID

# Download MusicXML
curl http://localhost:8000/api/download/JOB_ID/musicxml/vocals -o vocals.musicxml
```

---

## 📊 What You Get

For each audio file, you get **4 instrument tracks**:
- 🎤 **Vocals** (voice/lead melody)
- 🥁 **Drums** (percussion)
- 🎸 **Bass** (bass guitar/low frequencies)
- 🎹 **Other** (keyboards, guitars, other instruments)

Each track has:
- `.mid` file (MIDI format)
- `.musicxml` file (sheet music - open in MuseScore, Finale, etc.)

---

## 🔑 API Keys Needed?

**NO! Everything runs locally for FREE!**

- ✅ Demucs (AI separation) - Free, runs on your computer
- ✅ All other tools - Open source

**Cost: $0** (just your computer's resources)

---

## ⏱️ Processing Time

- **Short song (2-3 min):** ~2-3 minutes
- **Full song (4-5 min):** ~5-10 minutes
- **First run:** Add 5 minutes (downloads AI models)

---

## 🧪 Sample Test Files

Place test MP3 files in: `python/input/`

Try with:
- ✅ Songs with clear vocals
- ✅ Songs with multiple instruments
- ❌ Very long files (>10 min) might be slow

---

## 🔗 Integration with Website

From your Next.js frontend, call:

```typescript
// Upload file
const formData = new FormData();
formData.append('file', audioFile);

const response = await fetch('http://localhost:8000/api/convert', {
  method: 'POST',
  body: formData,
});

const { job_id } = await response.json();

// Check status
const status = await fetch(`http://localhost:8000/api/status/${job_id}`);
const result = await status.json();

// Download when complete
if (result.status === 'completed') {
  window.open(`http://localhost:8000/api/download/${job_id}/musicxml/vocals`);
}
```

---

## 🐛 Common Issues

**"Module not found"**
```powershell
pip install -r requirements.txt
```

**"Connection refused"**
- Make sure API server is running
- Check it's on port 8000

**"Out of memory"**
- Try shorter audio files
- Close other apps

---

## 📖 Full Documentation

See `SETUP_GUIDE.md` for complete details!
