CREATE TABLE form_g_remarks (
  inspection_id INTEGER PRIMARY KEY REFERENCES form_g_inspections(id) ON DELETE CASCADE,
  sp_remarks_part_b   TEXT,
  cons_remarks_part_b TEXT,
  sp_remarks_part_c   TEXT,
  cons_remarks_part_c TEXT,
  sp_remarks_part_d   TEXT,
  cons_remarks_part_d TEXT
);