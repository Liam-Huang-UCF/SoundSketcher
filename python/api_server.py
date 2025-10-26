"""
FastAPI Server for Audio to Sheet Music Conversion
Provides REST API endpoints for the T3 stack frontend
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import shutil
import logging
from pathlib import Path
from datetime import datetime
import json

from audio_processor import AudioProcessor

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SoundSketch Audio to Sheet Music API",
    description="Convert audio files to sheet music (MusicXML) via MIDI",
    version="1.0.0"
)

# CORS configuration for T3 stack integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",
        "https://yourdomain.com"  # Production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "output"
JOBS_DB_FILE = BASE_DIR / "jobs.json"

# Create directories
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Initialize audio processor
processor = AudioProcessor(output_dir=str(OUTPUT_DIR))

# In-memory jobs database (in production, use Redis or a real database)
jobs_db = {}


def load_jobs_db():
    """Load jobs from JSON file"""
    global jobs_db
    if JOBS_DB_FILE.exists():
        with open(JOBS_DB_FILE, 'r') as f:
            jobs_db = json.load(f)


def save_jobs_db():
    """Save jobs to JSON file"""
    with open(JOBS_DB_FILE, 'w') as f:
        json.dump(jobs_db, f, indent=2)


# Load existing jobs on startup
load_jobs_db()


# Pydantic models
class JobStatus(BaseModel):
    job_id: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    musicxml_files: List[dict] = []
    midi_files: List[dict] = []
    errors: List[str] = []


class ConversionResponse(BaseModel):
    job_id: str
    status: str
    message: str


# Background task for processing
def process_audio_background(job_id: str, file_path: str):
    """Background task to process audio file"""
    logger.info(f"Starting background processing for job {job_id}")
    
    try:
        jobs_db[job_id]["status"] = "processing"
        save_jobs_db()
        
        # Process the audio file
        result = processor.process_audio_file(file_path, job_id)
        
        # Update job status
        jobs_db[job_id].update({
            "status": result["status"],
            "musicxml_files": result["musicxml_files"],
            "midi_files": result["midi_files"],
            "errors": result["errors"],
            "completed_at": datetime.now().isoformat()
        })
        
        save_jobs_db()
        logger.info(f"Job {job_id} completed with status: {result['status']}")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {str(e)}")
        jobs_db[job_id].update({
            "status": "failed",
            "errors": [str(e)],
            "completed_at": datetime.now().isoformat()
        })
        save_jobs_db()


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "SoundSketch Audio to Sheet Music API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/api/convert",
            "status": "/api/status/{job_id}",
            "download": "/api/download/{job_id}/{file_type}/{instrument}",
            "jobs": "/api/jobs"
        }
    }


@app.post("/api/convert", response_model=ConversionResponse)
async def convert_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload an audio file and start conversion to sheet music
    
    Args:
        file: Audio file (MP3, WAV, FLAC, etc.)
    
    Returns:
        Job ID for tracking the conversion progress
    """
    # Validate file type
    allowed_extensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Save uploaded file
    upload_path = UPLOAD_DIR / f"{job_id}{file_extension}"
    
    try:
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File uploaded: {upload_path} for job {job_id}")
        
        # Create job entry
        jobs_db[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "filename": file.filename,
            "created_at": datetime.now().isoformat(),
            "completed_at": None,
            "musicxml_files": [],
            "midi_files": [],
            "errors": []
        }
        save_jobs_db()
        
        # Start background processing
        background_tasks.add_task(process_audio_background, job_id, str(upload_path))
        
        return ConversionResponse(
            job_id=job_id,
            status="queued",
            message="Audio file uploaded successfully. Processing started."
        )
        
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/api/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Get the status of a conversion job
    
    Args:
        job_id: The unique job identifier
    
    Returns:
        Job status information
    """
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatus(**jobs_db[job_id])


@app.get("/api/download/{job_id}/{file_type}/{instrument}")
async def download_file(job_id: str, file_type: str, instrument: str):
    """
    Download a generated file (MIDI or MusicXML)
    
    Args:
        job_id: The unique job identifier
        file_type: 'midi' or 'musicxml'
        instrument: Instrument name (vocals, drums, bass, other)
    
    Returns:
        File download
    """
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_db[job_id]
    
    if job["status"] not in ["completed", "completed_with_errors"]:
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    # Find the requested file
    file_list = job.get(f"{file_type}_files", [])
    file_info = next((f for f in file_list if f["instrument"] == instrument), None)
    
    if not file_info:
        raise HTTPException(
            status_code=404,
            detail=f"File not found for instrument: {instrument}"
        )
    
    file_path = Path(file_info["path"])
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    # Determine media type
    media_type = "application/vnd.recordare.musicxml+xml" if file_type == "musicxml" else "audio/midi"
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=f"{instrument}.{file_path.suffix}"
    )


@app.get("/api/jobs")
async def list_jobs(limit: int = 10):
    """
    List recent conversion jobs
    
    Args:
        limit: Maximum number of jobs to return
    
    Returns:
        List of jobs
    """
    # Sort by created_at descending
    sorted_jobs = sorted(
        jobs_db.values(),
        key=lambda x: x["created_at"],
        reverse=True
    )
    
    return {"jobs": sorted_jobs[:limit]}


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job and its associated files
    
    Args:
        job_id: The unique job identifier
    """
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete output files
    job_output_dir = OUTPUT_DIR / job_id
    if job_output_dir.exists():
        shutil.rmtree(job_output_dir)
    
    # Delete uploaded file
    for file in UPLOAD_DIR.glob(f"{job_id}.*"):
        file.unlink()
    
    # Remove from database
    del jobs_db[job_id]
    save_jobs_db()
    
    return {"message": "Job deleted successfully"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disabled auto-reload to prevent crashes
        log_level="info"
    )
