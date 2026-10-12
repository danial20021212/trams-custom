import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// import 'dotenv/config';
// import express from 'express';
// import pg from 'pg';
// import cors from 'cors';
// import multer from 'multer';

// import fs from 'node:fs';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const ITEMS = [
//   'barrier', 'gantryBeam', 'gantryColumn', 'footings',
//   'anchorMortar', 'maintenanceAccess', 'staticSigns', 'vms',
// ];

// // ['barrierDistress', 'barrierCritical', 'barrierClosed', 'gantryBeamDistress', ...] = 24 names
// const ITEM_FIELDS = ITEMS.flatMap((item) =>
//   ['Distress', 'Critical', 'Closed'].map((suffix) => item + suffix)
// );

// // 'gantryBeamCritical' -> 'gantry_beam_critical'
// const snake = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

// // The app sends '' for "not filled in". Store that as NULL instead.
// const blankToNull = (v) => {
//   if (v === undefined || v === null) return null;
//   const s = String(v).trim();
//   return s === '' ? null : s;
// };

// // The app sends "2026-10-11T16:04:24.560". Keep only "2026-10-11".
// const dateOnly = (v) => {
//   const s = blankToNull(v);
//   return s ? s.slice(0, 10) : null;
// };

// const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// const app = express();

// app.use(cors());
// app.use(multer({ limits: { fieldSize: 25 * 1024 * 1024 } }).none());

// const uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads');
// fs.mkdirSync(uploadsDir, { recursive: true });
// app.use('/uploads', express.static(uploadsDir));

// app.get('/health', (req, res) => {
//   res.json({ ok: true });
// });

// app.get('/db-test', async (req, res) => {
//   const result = await pool.query('SELECT NOW() AS time');
//   res.json(result.rows[0]);
// });

// app.post('/site/Api_formGMainListingDetailsToken', async (req, res) => {
//   const id = parseInt(req.body.recID, 10);

//   const result = await pool.query(
//     `SELECT inspection_date::text AS inspection_date, reference_no, district_id,
//             road_id, chainage, structure_code, gps_easting, gps_northing, status
//        FROM form_g_inspections WHERE id = $1`,
//     [id]
//   );

//   res.json({
//     http_status: 'Success.',
//     data: result.rows.map((r) => ({
//       ProjectName: 'TRAMS (local dev)',
//       district: r.district_id ?? '',
//       road: r.road_id ?? '',
//       inspection_date: r.inspection_date ?? '',
//       reference_no: r.reference_no ?? '',
//       StructureCode: r.structure_code ?? '',
//       Chainage: r.chainage ?? '',
//       GPS_Easting: r.gps_easting ?? '',
//       GPS_Northing: r.gps_northing ?? '',
//       status: r.status,
//     })),
//   });
// });

// app.post('/site/Api_formGInspectionDetailsToken', async (req, res) => {
//   const id = parseInt(req.body.recID, 10);

//   const result = await pool.query(
//     'SELECT * FROM form_g_inspections WHERE id = $1',
//     [id]
//   );

//   res.json({
//     http_status: 'Success.',
//     data: result.rows.map((r) => ({
//       parkingPosition: r.parking_position,
//       accessCondition: r.access_condition,
//       potentialHazard: r.potential_hazard,
//       ...Object.fromEntries(ITEM_FIELDS.map((f) => [f, r[snake(f)]])),
//     })),
//   });
// });

// const COLUMNS = [
//   'parent_rec_id', 'inspection_date', 'reference_no', 'package_id',
//   'district_id', 'road_id', 'chainage', 'structure_code',
//   'gps_easting', 'gps_northing',
//   'parking_position', 'access_condition', 'potential_hazard',
//   ...ITEM_FIELDS.map(snake),
// ];

// app.post('/site/Api_formGnewInspectionToken', async (req, res) => {
//   const b = req.body;

//   const values = [
//     blankToNull(b.recID), dateOnly(b.inspection_date), blankToNull(b.referenceNo),
//     blankToNull(b.packageId), blankToNull(b.districtId), blankToNull(b.roadId),
//     blankToNull(b.Chainage), blankToNull(b.StructureCode),
//     blankToNull(b.GPS_Easting), blankToNull(b.GPS_Northing),
//     blankToNull(b.parkingPosition), blankToNull(b.accessCondition),
//     blankToNull(b.potentialHazard),
//     ...ITEM_FIELDS.map((f) => blankToNull(b[f])),
//   ];

//   const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

//   const result = await pool.query(
//     `INSERT INTO form_g_inspections (${COLUMNS.join(', ')})
//      VALUES (${placeholders}) RETURNING id`,
//     values
//   );

//   console.log("success for Api_formGnewInspectionToken")

//   res.json({
//     http_status: 'Success.',
//     recID: String(result.rows[0].id),
//     data: 'Inspection saved.',
//   });

// });


// app.post('/site/Api_formGphotoUploadToken', async (req, res) => {
//   const id = parseInt(req.body.recID, 10);
//   const photoNo = blankToNull(req.body.photoNo);
//   const base64 = String(req.body.photo || '').split(',').pop();

//   if (!Number.isInteger(id) || !photoNo || !base64) {
//     return res.status(400).json({ http_status: 'Missing recID, photoNo or photo.' });
//   }

//   const safeNo = photoNo.replace(/[^a-zA-Z0-9_-]/g, '');
//   const fileName = `formG_${id}_${safeNo}_${Date.now()}.jpg`;
//   await fs.promises.writeFile(path.join(uploadsDir, fileName), Buffer.from(base64, 'base64'));

//   await pool.query(
//     `INSERT INTO form_g_photos (inspection_id, photo_no, remarks, file_name)
//      VALUES ($1, $2, $3, $4)
//      ON CONFLICT (inspection_id, photo_no)
//      DO UPDATE SET remarks = EXCLUDED.remarks, file_name = EXCLUDED.file_name`,
//     [id, photoNo, blankToNull(req.body.remarks), fileName]
//   );

//   res.json({ http_status: 'Success.', data: 'Photo saved.' });
// });

// app.post('/site/Api_formGlistPhotoToken', async (req, res) => {
//   const id = parseInt(req.body.recID, 10);
//   const result = await pool.query(
//     'SELECT photo_no, remarks, file_name FROM form_g_photos WHERE inspection_id = $1 ORDER BY id',
//     [id]
//   );

//   // Build the URL from whatever address the app used, so it also works from the emulator.
//   const base = `${req.protocol}://${req.get('host')}`;

//   res.json({
//     http_status: 'Success.',
//     data: result.rows.map((r) => ({
//       image: `${base}/uploads/${r.file_name}`,
//       photoNo: r.photo_no,
//       remarks: r.remarks ?? '',
//     })),
//   });
// });



// // Save Part B / C / D remarks (SP and Cons) for one inspection.
// app.post('/site/Api_formGremarksToken', async (req, res) => {
//   const b = req.body;
//   const id = parseInt(b.recID, 10);
//   if (!Number.isInteger(id)) {
//     return res.status(400).json({ http_status: 'Missing recID.' });
//   }

//   await pool.query(
//     `INSERT INTO form_g_remarks
//        (inspection_id, sp_remarks_part_b, cons_remarks_part_b,
//         sp_remarks_part_c, cons_remarks_part_c,
//         sp_remarks_part_d, cons_remarks_part_d)
//      VALUES ($1, $2, $3, $4, $5, $6, $7)
//      ON CONFLICT (inspection_id) DO UPDATE SET
//        sp_remarks_part_b   = EXCLUDED.sp_remarks_part_b,
//        cons_remarks_part_b = EXCLUDED.cons_remarks_part_b,
//        sp_remarks_part_c   = EXCLUDED.sp_remarks_part_c,
//        cons_remarks_part_c = EXCLUDED.cons_remarks_part_c,
//        sp_remarks_part_d   = EXCLUDED.sp_remarks_part_d,
//        cons_remarks_part_d = EXCLUDED.cons_remarks_part_d`,
//     [
//       id,
//       blankToNull(b.sp_remarks_partB), blankToNull(b.cons_remarks_partB),
//       blankToNull(b.sp_remarks_partC), blankToNull(b.cons_remarks_partC),
//       blankToNull(b.sp_remarks_partD), blankToNull(b.cons_remarks_partD),
//     ]
//   );

//   res.json({ http_status: 'Success.', data: 'Remarks saved.' });
// });

// // Read them back (used by the G2 review screen and the submit flow).
// app.post('/site/Api_formGremarksviewToken', async (req, res) => {
//   const id = parseInt(req.body.recID, 10);
//   const result = await pool.query(
//     'SELECT * FROM form_g_remarks WHERE inspection_id = $1',
//     [id]
//   );
//   const r = result.rows[0] ?? {};

//   // Always return one row (empty strings if nothing saved yet),
//   // because the app expects data.first to exist.
//   res.json({
//     http_status: 'Success.',
//     data: [{
//       recID: String(id),
//       sp_remarks_partB: r.sp_remarks_part_b ?? '',
//       cons_remarks_partB: r.cons_remarks_part_b ?? '',
//       sp_remarks_partC: r.sp_remarks_part_c ?? '',
//       cons_remarks_partC: r.cons_remarks_part_c ?? '',
//       sp_remarks_partD: r.sp_remarks_part_d ?? '',
//       cons_remarks_partD: r.cons_remarks_part_d ?? '',
//     }],
//   });
// });


// app.post('/site/Api_formGsignatureToken', async (req, res) => {
//   const b = req.body;
//   const id = parseInt(b.recID, 10);
//   if (!Number.isInteger(id)) {
//     return res.status(400).json({ http_status: 'Missing recID.' });
//   }

//   await pool.query(
//     `INSERT INTO form_g_approvals
//        (inspection_id, investigation, sp_sign_date, ec_sign_date, sign_agree)
//      VALUES ($1, $2, $3, $4, $5)
//      ON CONFLICT (inspection_id) DO UPDATE SET
//        investigation = EXCLUDED.investigation,
//        sp_sign_date  = EXCLUDED.sp_sign_date,
//        ec_sign_date  = EXCLUDED.ec_sign_date,
//        sign_agree    = EXCLUDED.sign_agree`,
//     [
//       id,
//       blankToNull(b.investigation),
//       dateOnly(b.sp_sign_date),
//       dateOnly(b.ec_sign_date),
//       blankToNull(b.sign_agree),
//     ]
//   );

//   res.json({ http_status: 'Success.', data: 'Approval saved.' });
// });

// app.post('/site/Api_formGMainListingToken', async (req, res) => {
//   const result = await pool.query(
//     `SELECT id, inspection_date::text AS inspection_date, reference_no,
//             package_id, district_id, road_id, status
//        FROM form_g_inspections ORDER BY id`
//   );

//   res.json({
//     http_status: 'Success.',
//     data: result.rows.map((r) => ({
//       inspection_date: r.inspection_date ?? '',
//       package: r.package_id ?? '',
//       district: r.district_id ?? '',
//       roadName: r.road_id ?? '',
//       reference_no: r.reference_no ?? '',
//       recID: String(r.id),
//       insRecID: String(r.id),
//       status: r.status,
//     })),
//   });
// });

// const port = Number(process.env.PORT) || 3000;
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });