CREATE TABLE form_g_photos (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER NOT NULL REFERENCES form_g_inspections(id) ON DELETE CASCADE,
  photo_no TEXT NOT NULL,
  remarks TEXT,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspection_id, photo_no)
);