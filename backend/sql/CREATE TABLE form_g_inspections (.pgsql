CREATE TABLE form_g_inspections (
  id SERIAL PRIMARY KEY,
  parent_rec_id INTEGER,
  inspection_date DATE,
  reference_no TEXT,
  package_id TEXT,
  district_id TEXT,
  road_id TEXT,
  chainage TEXT,
  structure_code TEXT,
  gps_easting TEXT,
  gps_northing TEXT,

  parking_position TEXT,
  access_condition TEXT,
  potential_hazard TEXT,

  barrier_distress TEXT, barrier_critical TEXT, barrier_closed TEXT,
  gantry_beam_distress TEXT, gantry_beam_critical TEXT, gantry_beam_closed TEXT,
  gantry_column_distress TEXT, gantry_column_critical TEXT, gantry_column_closed TEXT,
  footings_distress TEXT, footings_critical TEXT, footings_closed TEXT,
  anchor_mortar_distress TEXT, anchor_mortar_critical TEXT, anchor_mortar_closed TEXT,
  maintenance_access_distress TEXT, maintenance_access_critical TEXT, maintenance_access_closed TEXT,
  static_signs_distress TEXT, static_signs_critical TEXT, static_signs_closed TEXT,
  vms_distress TEXT, vms_critical TEXT, vms_closed TEXT,

  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);