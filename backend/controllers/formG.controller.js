import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../config/db.js';
import { uploadsDir } from '../config/uploads.js';
import { blankToNull, dateOnly, parseId, snake } from '../utils/helpers.js';
import { ITEM_FIELDS, INSERT_COLUMNS } from '../constants/formG.js';

// ---------- Lists and headers ----------

export async function mainListing(req, res) {
  const result = await pool.query(
    `SELECT id, inspection_date::text AS inspection_date, reference_no,
            package_id, district_id, road_id, status
       FROM form_g_inspections ORDER BY id`
  );

  res.json({
    http_status: 'Success.',
    data: result.rows.map((r) => ({
      inspection_date: r.inspection_date ?? '',
      package: r.package_id ?? '',
      district: r.district_id ?? '',
      roadName: r.road_id ?? '',
      reference_no: r.reference_no ?? '',
      recID: String(r.id),
      insRecID: String(r.id),
      status: r.status,
    })),
  });
}

export async function mainListingDetails(req, res) {
  const id = parseId(req.body.recID);
  const result = await pool.query(
    `SELECT inspection_date::text AS inspection_date, reference_no, district_id,
            road_id, chainage, structure_code, gps_easting, gps_northing, status
       FROM form_g_inspections WHERE id = $1`,
    [id]
  );

  res.json({
    http_status: 'Success.',
    data: result.rows.map((r) => ({
      ProjectName: 'TRAMS (local dev)',
      district: r.district_id ?? '',
      road: r.road_id ?? '',
      inspection_date: r.inspection_date ?? '',
      reference_no: r.reference_no ?? '',
      StructureCode: r.structure_code ?? '',
      Chainage: r.chainage ?? '',
      GPS_Easting: r.gps_easting ?? '',
      GPS_Northing: r.gps_northing ?? '',
      status: r.status,
    })),
  });
}

export async function inspectionDetails(req, res) {
  const id = parseId(req.body.recID);
  const result = await pool.query(
    'SELECT * FROM form_g_inspections WHERE id = $1',
    [id]
  );

  res.json({
    http_status: 'Success.',
    data: result.rows.map((r) => ({
      parkingPosition: r.parking_position,
      accessCondition: r.access_condition,
      potentialHazard: r.potential_hazard,
      ...Object.fromEntries(ITEM_FIELDS.map((f) => [f, r[snake(f)]])),
    })),
  });
}

// ---------- Save a new inspection ----------

export async function newInspection(req, res) {
  const b = req.body;

  const values = [
    blankToNull(b.recID), dateOnly(b.inspection_date), blankToNull(b.referenceNo),
    blankToNull(b.packageId), blankToNull(b.districtId), blankToNull(b.roadId),
    blankToNull(b.Chainage), blankToNull(b.StructureCode),
    blankToNull(b.GPS_Easting), blankToNull(b.GPS_Northing),
    blankToNull(b.parkingPosition), blankToNull(b.accessCondition),
    blankToNull(b.potentialHazard),
    ...ITEM_FIELDS.map((f) => blankToNull(b[f])),
  ];

  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const result = await pool.query(
    `INSERT INTO form_g_inspections (${INSERT_COLUMNS.join(', ')})
     VALUES (${placeholders}) RETURNING id`,
    values
  );

  res.json({
    http_status: 'Success.',
    recID: String(result.rows[0].id),
    data: 'Inspection saved.',
  });
}

// ---------- Photos ----------

export async function photoUpload(req, res) {
  const id = parseId(req.body.recID);
  const photoNo = blankToNull(req.body.photoNo);
  const base64 = String(req.body.photo || '').split(',').pop();

  if (id === null || !photoNo || !base64) {
    return res.status(400).json({ http_status: 'Missing recID, photoNo or photo.' });
  }

  const safeNo = photoNo.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `formG_${id}_${safeNo}_${Date.now()}.jpg`;
  await fs.promises.writeFile(path.join(uploadsDir, fileName), Buffer.from(base64, 'base64'));

  await pool.query(
    `INSERT INTO form_g_photos (inspection_id, photo_no, remarks, file_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (inspection_id, photo_no)
     DO UPDATE SET remarks = EXCLUDED.remarks, file_name = EXCLUDED.file_name`,
    [id, photoNo, blankToNull(req.body.remarks), fileName]
  );

  res.json({ http_status: 'Success.', data: 'Photo saved.' });
}

export async function listPhoto(req, res) {
  const id = parseId(req.body.recID);
  const result = await pool.query(
    'SELECT photo_no, remarks, file_name FROM form_g_photos WHERE inspection_id = $1 ORDER BY id',
    [id]
  );

  // Build the URL from whatever address the app used, so it works from the emulator too.
  const base = `${req.protocol}://${req.get('host')}`;

  res.json({
    http_status: 'Success.',
    data: result.rows.map((r) => ({
      image: `${base}/uploads/${r.file_name}`,
      photoNo: r.photo_no,
      remarks: r.remarks ?? '',
    })),
  });
}

// ---------- Remarks (Part B / C / D) ----------

export async function saveRemarks(req, res) {
  const b = req.body;
  const id = parseId(b.recID);
  if (id === null) {
    return res.status(400).json({ http_status: 'Missing recID.' });
  }

  await pool.query(
    `INSERT INTO form_g_remarks
       (inspection_id, sp_remarks_part_b, cons_remarks_part_b,
        sp_remarks_part_c, cons_remarks_part_c,
        sp_remarks_part_d, cons_remarks_part_d)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (inspection_id) DO UPDATE SET
       sp_remarks_part_b   = EXCLUDED.sp_remarks_part_b,
       cons_remarks_part_b = EXCLUDED.cons_remarks_part_b,
       sp_remarks_part_c   = EXCLUDED.sp_remarks_part_c,
       cons_remarks_part_c = EXCLUDED.cons_remarks_part_c,
       sp_remarks_part_d   = EXCLUDED.sp_remarks_part_d,
       cons_remarks_part_d = EXCLUDED.cons_remarks_part_d`,
    [
      id,
      blankToNull(b.sp_remarks_partB), blankToNull(b.cons_remarks_partB),
      blankToNull(b.sp_remarks_partC), blankToNull(b.cons_remarks_partC),
      blankToNull(b.sp_remarks_partD), blankToNull(b.cons_remarks_partD),
    ]
  );

  res.json({ http_status: 'Success.', data: 'Remarks saved.' });
}

export async function viewRemarks(req, res) {
  const id = parseId(req.body.recID);
  const result = await pool.query(
    'SELECT * FROM form_g_remarks WHERE inspection_id = $1',
    [id]
  );
  const r = result.rows[0] ?? {};

  // Always return one row (empty strings if nothing saved yet),
  // because the app expects data.first to exist.
  res.json({
    http_status: 'Success.',
    data: [{
      recID: String(id ?? ''),
      sp_remarks_partB: r.sp_remarks_part_b ?? '',
      cons_remarks_partB: r.cons_remarks_part_b ?? '',
      sp_remarks_partC: r.sp_remarks_part_c ?? '',
      cons_remarks_partC: r.cons_remarks_part_c ?? '',
      sp_remarks_partD: r.sp_remarks_part_d ?? '',
      cons_remarks_partD: r.cons_remarks_part_d ?? '',
    }],
  });
}

// ---------- Approval (signature) ----------

export async function saveSignature(req, res) {
  const b = req.body;
  const id = parseId(b.recID);
  if (id === null) {
    return res.status(400).json({ http_status: 'Missing recID.' });
  }

  await pool.query(
    `INSERT INTO form_g_approvals
       (inspection_id, investigation, sp_sign_date, ec_sign_date, sign_agree)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (inspection_id) DO UPDATE SET
       investigation = EXCLUDED.investigation,
       sp_sign_date  = EXCLUDED.sp_sign_date,
       ec_sign_date  = EXCLUDED.ec_sign_date,
       sign_agree    = EXCLUDED.sign_agree`,
    [
      id,
      blankToNull(b.investigation),
      dateOnly(b.sp_sign_date),
      dateOnly(b.ec_sign_date),
      blankToNull(b.sign_agree),
    ]
  );

  res.json({ http_status: 'Success.', data: 'Approval saved.' });
}