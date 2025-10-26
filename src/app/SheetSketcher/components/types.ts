export type JobFileInfo = { instrument: string; path: string };
export type JobStatus = {
  job_id: string;
  status: "queued" | "processing" | "completed" | "completed_with_errors" | "failed";
  created_at: string;
  completed_at?: string | null;
  musicxml_files: JobFileInfo[];
  midi_files: JobFileInfo[];
  errors: string[];
};

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  job?: JobStatus;
};
