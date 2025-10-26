"""
Audio to Sheet Music Converter
Converts audio files directly to MIDI and MusicXML using music21
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Optional
import numpy as np
import librosa
import soundfile as sf
from music21 import converter, stream, note, chord, meter, tempo, key, instrument
import pretty_midi

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AudioProcessor:
    """Main class for processing audio files into sheet music"""
    
    def __init__(self, output_dir: str = "output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
    def process_audio_file(self, audio_path: str, job_id: str) -> Dict:
        """
        Main pipeline: Audio -> MIDI -> MusicXML
        
        Args:
            audio_path: Path to the input audio file
            job_id: Unique identifier for this processing job
            
        Returns:
            Dictionary with paths to generated files and metadata
        """
        logger.info(f"Starting processing for job {job_id}")
        
        # Create job-specific directory
        job_dir = self.output_dir / job_id
        job_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        midi_dir = job_dir / "midi"
        musicxml_dir = job_dir / "musicxml"
        midi_dir.mkdir(exist_ok=True)
        musicxml_dir.mkdir(exist_ok=True)
        
        result = {
            "job_id": job_id,
            "status": "processing",
            "midi_files": [],
            "musicxml_files": [],
            "errors": []
        }
        
        try:
            # Step 1: Convert audio to MIDI
            logger.info("Step 1: Converting audio to MIDI...")
            midi_path = self.audio_to_midi(audio_path, job_dir, "audio")
            result["midi_files"].append({
                "instrument": "audio",
                "path": str(midi_path)
            })
            
            # Step 2: Convert MIDI to MusicXML
            logger.info("Step 2: Converting MIDI to MusicXML...")
            musicxml_path = self.midi_to_musicxml(midi_path, job_dir, "audio")
            result["musicxml_files"].append({
                "instrument": "audio",
                "path": str(musicxml_path)
            })
            
            result["status"] = "completed"
            logger.info(f"Processing completed for job {job_id}")
            
        except Exception as e:
            result["status"] = "failed"
            result["errors"].append(str(e))
            logger.error(f"Processing failed for job {job_id}: {str(e)}")
        
        return result
    
    def _load_audio_robust(self, audio_path: str, target_sr: int = 22050):
        """
        Load audio file with multiple fallback methods
        Uses pure Python libraries (no FFmpeg required)
        """
        audio_path_obj = Path(audio_path)
        
        # Method 1: Try soundfile directly (best for WAV, FLAC)
        try:
            logger.info(f"Attempting to load audio with soundfile: {audio_path}")
            audio_data, sr = sf.read(audio_path)
            # Convert to mono if stereo
            if len(audio_data.shape) > 1:
                audio_data = np.mean(audio_data, axis=1)
            # Resample if needed
            if sr != target_sr:
                audio_data = librosa.resample(audio_data, orig_sr=sr, target_sr=target_sr)
            logger.info(f"Successfully loaded audio with soundfile: {len(audio_data)} samples at {target_sr}Hz")
            return audio_data, target_sr
        except Exception as e:
            logger.warning(f"soundfile failed: {e}")
        
        # Method 2: Try pydub with pure Python decoders
        try:
            logger.info(f"Attempting to load audio with pydub (pure Python mode): {audio_path}")
            from pydub import AudioSegment
            import io
            
            # Try to use pydub's built-in decoders (works for some formats)
            file_ext = audio_path_obj.suffix.lower().replace('.', '')
            
            # For MP3: try using audioread which supports pure Python MP3 decoding
            if file_ext == 'mp3':
                try:
                    import audioread
                    with audioread.audio_open(audio_path) as f:
                        sr_native = f.samplerate
                        channels = f.channels
                        # Read all frames
                        frames = []
                        for buf in f:
                            frames.append(buf)
                        
                        # Convert to numpy
                        audio_bytes = b''.join(frames)
                        audio_data = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32)
                        audio_data = audio_data / 32768.0  # Normalize
                        
                        # Convert stereo to mono
                        if channels == 2:
                            audio_data = audio_data.reshape(-1, 2).mean(axis=1)
                        
                        # Resample if needed
                        if sr_native != target_sr:
                            audio_data = librosa.resample(audio_data, orig_sr=sr_native, target_sr=target_sr)
                        
                        logger.info(f"Successfully loaded MP3 with audioread: {len(audio_data)} samples at {target_sr}Hz")
                        return audio_data, target_sr
                except ImportError:
                    logger.warning("audioread not installed, cannot decode MP3 without FFmpeg")
                    raise
            else:
                # For other formats, pydub might work without FFmpeg for some formats
                audio = AudioSegment.from_file(audio_path)
                audio = audio.set_channels(1)
                audio = audio.set_frame_rate(target_sr)
                samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
                samples = samples / (2**15)
                logger.info(f"Successfully loaded audio with pydub: {len(samples)} samples at {target_sr}Hz")
                return samples, target_sr
                
        except Exception as e:
            logger.warning(f"pydub failed: {e}")
        
        # Method 3: Try librosa with audioread backend
        try:
            logger.info(f"Attempting to load audio with librosa: {audio_path}")
            y, sr = librosa.load(audio_path, sr=target_sr, mono=True)
            logger.info(f"Successfully loaded audio with librosa: {len(y)} samples at {sr}Hz")
            return y, sr
        except Exception as e:
            logger.error(f"All audio loading methods failed: {type(e).__name__}: {e}")
            import traceback
            logger.error(f"Full traceback:\n{traceback.format_exc()}")
            
            # Provide helpful error message
            file_ext = audio_path_obj.suffix.lower()
            if file_ext in ['.mp3', '.m4a', '.ogg']:
                error_msg = f"Could not decode {file_ext} file. This app works best with WAV files.\n\n" \
                            "To use MP3/M4A/OGG files, you have two options:\n\n" \
                            "Option 1 (Recommended): Install FFmpeg\n" \
                            "  - Windows: choco install ffmpeg\n" \
                            "  - Mac: brew install ffmpeg\n" \
                            "  - Linux: sudo apt-get install ffmpeg\n" \
                            "  Then restart the Python server.\n\n" \
                            "Option 2: Convert your audio to WAV format first\n" \
                            "  - Use Audacity, VLC, or an online converter\n" \
                            "  - WAV files work without any additional setup"
            else:
                error_msg = f"Unsupported audio format: {file_ext}\n" \
                            "Please use WAV, FLAC, or convert to WAV format."
            
            raise Exception(f"Could not load audio file: {audio_path}.\n\n{error_msg}")
    
    def audio_to_midi(self, audio_path: str, output_dir: Path, stem_name: str) -> Path:
        """
        Convert audio to MIDI using pitch detection and onset detection
        
        This uses librosa for pitch tracking and pretty_midi for MIDI creation
        """
        logger.info(f"Converting {stem_name} to MIDI")
        
        # Load audio with multiple fallback methods
        y, sr = self._load_audio_robust(audio_path)
        
        # Create MIDI directory
        midi_dir = output_dir / "midi"
        midi_dir.mkdir(exist_ok=True)
        
        # Create MIDI file
        midi_data = pretty_midi.PrettyMIDI(initial_tempo=120.0)
        
        # Determine instrument based on stem name
        instrument_program = self._get_midi_instrument(stem_name)
        midi_instrument = pretty_midi.Instrument(program=instrument_program)
        
        # Use a more robust pitch detection method
        # Extract fundamental frequency using pyin (probabilistic YIN)
        try:
            f0, voiced_flag, voiced_probs = librosa.pyin(
                y,
                fmin=librosa.note_to_hz('C2'),
                fmax=librosa.note_to_hz('C7'),
                sr=sr,
                frame_length=2048
            )
            
            # Get onset times
            onset_frames = librosa.onset.onset_detect(
                y=y, 
                sr=sr,
                hop_length=512,
                backtrack=True
            )
            onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=512)
            
            # Convert continuous pitch to discrete notes
            notes = self._f0_to_notes(f0, voiced_flag, sr, onset_times)
            
            # Add notes to MIDI
            for note_info in notes:
                if note_info['pitch'] >= 0 and note_info['pitch'] <= 127:
                    note = pretty_midi.Note(
                        velocity=note_info['velocity'],
                        pitch=note_info['pitch'],
                        start=note_info['start'],
                        end=note_info['end']
                    )
                    midi_instrument.notes.append(note)
            
            logger.info(f"Generated {len(midi_instrument.notes)} notes")
            
            # If no notes were detected, create a simple melody from RMS energy
            if len(midi_instrument.notes) == 0:
                logger.warning("No notes detected with pyin, using fallback method")
                notes = self._fallback_note_generation(y, sr)
                for note_info in notes:
                    note = pretty_midi.Note(
                        velocity=note_info['velocity'],
                        pitch=note_info['pitch'],
                        start=note_info['start'],
                        end=note_info['end']
                    )
                    midi_instrument.notes.append(note)
                logger.info(f"Generated {len(midi_instrument.notes)} notes using fallback")
            
        except Exception as e:
            logger.error(f"Error in pitch detection: {e}, using fallback method")
            notes = self._fallback_note_generation(y, sr)
            for note_info in notes:
                note = pretty_midi.Note(
                    velocity=note_info['velocity'],
                    pitch=note_info['pitch'],
                    start=note_info['start'],
                    end=note_info['end']
                )
                midi_instrument.notes.append(note)
        
        # Only add instrument if it has notes
        if len(midi_instrument.notes) == 0:
            logger.warning("No notes generated, creating a simple default note")
            # Add a simple middle C note as fallback
            default_note = pretty_midi.Note(
                velocity=80,
                pitch=60,  # Middle C
                start=0.0,
                end=1.0
            )
            midi_instrument.notes.append(default_note)
        
        midi_data.instruments.append(midi_instrument)
        
        # Save MIDI file
        midi_path = midi_dir / f"{stem_name}.mid"
        
        try:
            # Write using pretty_midi
            midi_data.write(str(midi_path))
            
            # Verify the file was created and has content
            if not midi_path.exists() or midi_path.stat().st_size == 0:
                raise Exception("MIDI file was not created or is empty")
            
            logger.info(f"MIDI file created with {len(midi_instrument.notes)} notes: {midi_path}")
            
        except Exception as e:
            logger.error(f"Error writing MIDI file: {e}")
            # Try alternative method using mido
            self._write_midi_with_mido(midi_instrument.notes, midi_path)
        
        return midi_path
    
    def _write_midi_with_mido(self, notes, midi_path):
        """Fallback MIDI writer using mido library"""
        import mido
        
        logger.info("Using mido as fallback MIDI writer")
        
        # Create a new MIDI file
        mid = mido.MidiFile()
        track = mido.MidiTrack()
        mid.tracks.append(track)
        
        # Set tempo (500000 microseconds per beat = 120 BPM)
        track.append(mido.MetaMessage('set_tempo', tempo=500000))
        
        # Add program change (instrument)
        track.append(mido.Message('program_change', program=0, time=0))
        
        # Convert notes to MIDI messages
        # Sort notes by start time
        sorted_notes = sorted(notes, key=lambda n: n.start)
        
        current_time = 0
        ticks_per_second = mid.ticks_per_beat * 2  # 120 BPM = 2 beats per second
        
        for note in sorted_notes:
            # Calculate delta time in ticks
            note_start_ticks = int(note.start * ticks_per_second)
            delta_time = note_start_ticks - current_time
            
            # Note on
            track.append(mido.Message('note_on', 
                                     note=note.pitch, 
                                     velocity=note.velocity, 
                                     time=delta_time))
            
            # Calculate note duration in ticks
            duration_ticks = int((note.end - note.start) * ticks_per_second)
            
            # Note off
            track.append(mido.Message('note_off', 
                                     note=note.pitch, 
                                     velocity=0, 
                                     time=duration_ticks))
            
            current_time = note_start_ticks + duration_ticks
        
        # End of track
        track.append(mido.MetaMessage('end_of_track', time=0))
        
        # Save the file
        mid.save(str(midi_path))
        logger.info(f"MIDI file created with mido: {midi_path}")
    
    def _f0_to_notes(self, f0, voiced_flag, sr, onset_times, hop_length=512):
        """Convert F0 contour to discrete notes"""
        notes = []
        times = librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=hop_length)
        
        # Find continuous voiced segments
        i = 0
        while i < len(f0):
            # Skip unvoiced frames
            if not voiced_flag[i] or np.isnan(f0[i]):
                i += 1
                continue
            
            # Start of a note
            start_idx = i
            pitches = []
            
            # Collect all frames of this note
            while i < len(f0) and voiced_flag[i] and not np.isnan(f0[i]):
                pitches.append(f0[i])
                i += 1
            
            if len(pitches) > 0:
                # Use median pitch
                median_pitch_hz = np.median(pitches)
                midi_note = int(np.round(librosa.hz_to_midi(median_pitch_hz)))
                
                # Clamp to valid range
                midi_note = max(21, min(108, midi_note))  # A0 to C8
                
                start_time = times[start_idx]
                end_time = times[min(i, len(times) - 1)]
                duration = end_time - start_time
                
                # Only add notes with reasonable duration
                if duration >= 0.05:  # At least 50ms
                    notes.append({
                        'pitch': midi_note,
                        'start': start_time,
                        'end': end_time,
                        'velocity': 80
                    })
        
        return notes
    
    def _fallback_note_generation(self, y, sr):
        """Generate notes based on spectral peaks when pitch detection fails"""
        notes = []
        
        # Use onset detection
        onset_frames = librosa.onset.onset_detect(
            y=y, 
            sr=sr,
            hop_length=512,
            backtrack=True
        )
        onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=512)
        
        # Get spectral centroids as a proxy for pitch
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=512)[0]
        
        # Create notes from onsets
        for i in range(len(onset_times) - 1):
            start_time = onset_times[i]
            end_time = onset_times[i + 1]
            
            # Get frame index
            frame_idx = int(start_time * sr / 512)
            if frame_idx >= len(spectral_centroids):
                continue
            
            # Estimate pitch from spectral centroid
            centroid = spectral_centroids[frame_idx]
            # Map spectral centroid to MIDI note (rough approximation)
            midi_note = int(np.clip(librosa.hz_to_midi(centroid / 2), 36, 84))
            
            duration = end_time - start_time
            if duration >= 0.1 and duration <= 4.0:  # Reasonable note duration
                notes.append({
                    'pitch': midi_note,
                    'start': start_time,
                    'end': end_time,
                    'velocity': 70
                })
        
        return notes
    
    def _get_midi_instrument(self, stem_name: str) -> int:
        """Map stem name to MIDI instrument program number"""
        instrument_map = {
            'vocals': 52,  # Choir Aahs
            'drums': 0,    # Acoustic Grand Piano (percussion on channel 10)
            'bass': 33,    # Acoustic Bass
            'other': 0,    # Acoustic Grand Piano
            'piano': 0,
            'guitar': 24,
            'strings': 48
        }
        return instrument_map.get(stem_name.lower(), 0)
    
    def midi_to_musicxml(self, midi_path: Path, output_dir: Path, stem_name: str) -> Path:
        """
        Convert MIDI to MusicXML using music21
        
        MusicXML is the standard format for sheet music notation
        """
        logger.info(f"Converting {stem_name} MIDI to MusicXML")
        
        try:
            # Verify MIDI file exists and has content
            if not midi_path.exists():
                raise FileNotFoundError(f"MIDI file not found: {midi_path}")
            
            file_size = midi_path.stat().st_size
            logger.info(f"MIDI file size: {file_size} bytes")
            
            if file_size == 0:
                raise ValueError("MIDI file is empty")
            
            # Parse MIDI file with music21
            logger.info(f"Parsing MIDI file: {midi_path}")
            score = converter.parse(str(midi_path))
            
            if score is None:
                raise ValueError("Failed to parse MIDI file")
            
            # Add metadata
            if score.metadata is None:
                score.metadata = stream.Metadata()
            score.metadata.title = f"{stem_name.capitalize()} Part"
            score.metadata.composer = "Generated by SoundSketch"
            
            # Analyze and add key signature
            try:
                analyzed_key = score.analyze('key')
                score.insert(0, analyzed_key)
            except Exception as e:
                logger.warning(f"Key analysis failed: {e}, using C major")
                score.insert(0, key.Key('C'))
            
            # Add time signature if not present
            if not score.flatten().getElementsByClass(meter.TimeSignature):
                score.insert(0, meter.TimeSignature('4/4'))
            
            # Add tempo marking
            if not score.flatten().getElementsByClass(tempo.MetronomeMark):
                score.insert(0, tempo.MetronomeMark(number=120))
            
            # Create MusicXML directory
            musicxml_dir = output_dir / "musicxml"
            musicxml_dir.mkdir(exist_ok=True)
            
            # Save as MusicXML
            musicxml_path = musicxml_dir / f"{stem_name}.musicxml"
            logger.info(f"Writing MusicXML to: {musicxml_path}")
            score.write('musicxml', fp=str(musicxml_path))
            
            # Verify output file was created
            if not musicxml_path.exists():
                raise FileNotFoundError("MusicXML file was not created")
            
            logger.info(f"MusicXML file created successfully: {musicxml_path}")
            return musicxml_path
            
        except Exception as e:
            logger.error(f"Error converting MIDI to MusicXML: {e}")
            logger.error(f"MIDI file path: {midi_path}")
            logger.error(f"MIDI file exists: {midi_path.exists()}")
            if midi_path.exists():
                logger.error(f"MIDI file size: {midi_path.stat().st_size}")
            raise Exception(f"Failed to convert MIDI to MusicXML: {str(e)}")


def test_processor():
    """Test function for local development"""
    processor = AudioProcessor(output_dir="test_output")
    
    # Test with a sample file
    test_file = "input/test_audio.mp3"
    if os.path.exists(test_file):
        result = processor.process_audio_file(test_file, "test_job_001")
        print("\n=== Processing Result ===")
        print(f"Status: {result['status']}")
        print(f"MIDI files generated: {len(result['midi_files'])}")
        print(f"MusicXML files generated: {len(result['musicxml_files'])}")
        
        for xml_file in result['musicxml_files']:
            print(f"  - {xml_file['instrument']}: {xml_file['path']}")
    else:
        print(f"Test file not found: {test_file}")
        print("Please place an MP3 file at python/input/test_audio.mp3")


if __name__ == "__main__":
    test_processor()
