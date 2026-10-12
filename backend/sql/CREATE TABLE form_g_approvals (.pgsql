CREATE TABLE form_g_approvals (
  inspection_id INTEGER PRIMARY KEY REFERENCES form_g_inspections(id) ON DELETE CASCADE,
  investigation TEXT,
  sp_sign_date  DATE,
  ec_sign_date  DATE,
  sign_agree    TEXT
);