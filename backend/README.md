# TRAMS Backend (local dev)

A small Express + PostgreSQL API that stands in for the real PRIMS server so the Flutter app (`trams-clone`) can be developed and tested without access to the real backend. It currently implements **Form G** only.

- Runtime: Node.js (ES modules) + Express
- Database: PostgreSQL 16 (Docker Compose)
- Request format: `POST` with `multipart/form-data` (text fields only), the same way the Flutter app sends everything
- Response format: JSON with `"http_status": "Success."` on success

> **Not for production.** There is no login and no token check. Any request is accepted.

---

## 1. Project structure

```
backend/
├── server.js                  Starts the server (reads PORT)
├── app.js                     Builds the Express app: cors, multer, static uploads, routes, error handler
├── config/
│   ├── db.js                  Postgres connection pool (reads DATABASE_URL)
│   └── uploads.js             Creates/exports the uploads/ folder path
├── constants/
│   └── formG.js               The 8 inspection items, the 24 item field names, insert column list
├── controllers/
│   └── formG.controller.js    The logic of each Form G endpoint
├── middleware/
│   └── asyncHandler.js        Passes errors from async handlers to Express
├── routes/
│   └── formG.routes.js        Maps each URL to a controller function
├── utils/
│   └── helpers.js             blankToNull, dateOnly, snake, parseId
├── uploads/                   Uploaded photos (created automatically, git-ignored)
├── docker-compose.yml         PostgreSQL container
├── .env                       Local settings (git-ignored)
└── package.json
```

**Request flow:** `app.js` → `routes/formG.routes.js` → `controllers/formG.controller.js` → Postgres.

---

## 2. Setup

### Prerequisites
- Node.js (LTS) and npm
- Docker Desktop (running)

### Environment (`.env`)
```
# used by docker compose
TRAMS_POSTGRES_USER=trams
TRAMS_POSTGRES_PASSWORD=change_me
TRAMS_POSTGRES_DB=trams

# used by Express (user, password and database name must match the values above)
PORT=3000
DATABASE_URL=postgres://trams:change_me@localhost:5003/trams
```
The database is published on host port **5003**.

### Start the database
```
docker compose up -d
docker compose ps          # wait until trams-db is "healthy"
```
Create the tables (see section 3). `db/init/*.sql` files only run the **first time** the database volume is created. To reset everything: `docker compose down -v` (this deletes all data), then `docker compose up -d`.

### Start the server
```
npm install
npm start                  # or: npm run dev  (restarts on file changes)
```
Check it: open `http://localhost:3000/health` — you should get `{"ok":true}`.

---

## 3. Database

Four tables. All Form G data lives here.

```sql
-- One table holds both structures and inspections (see "How records fit together").
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

CREATE TABLE form_g_photos (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER NOT NULL REFERENCES form_g_inspections(id) ON DELETE CASCADE,
  photo_no TEXT NOT NULL,
  remarks TEXT,                 -- caption of this one photo
  file_name TEXT NOT NULL,      -- file inside uploads/
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspection_id, photo_no)
);

CREATE TABLE form_g_remarks (   -- Part B / C / D remarks, one row per inspection
  inspection_id INTEGER PRIMARY KEY REFERENCES form_g_inspections(id) ON DELETE CASCADE,
  sp_remarks_part_b   TEXT,
  cons_remarks_part_b TEXT,
  sp_remarks_part_c   TEXT,
  cons_remarks_part_c TEXT,
  sp_remarks_part_d   TEXT,
  cons_remarks_part_d TEXT
);

CREATE TABLE form_g_approvals ( -- signature section, one row per inspection
  inspection_id INTEGER PRIMARY KEY REFERENCES form_g_inspections(id) ON DELETE CASCADE,
  investigation TEXT,
  sp_sign_date  DATE,
  ec_sign_date  DATE,
  sign_agree    TEXT
);
```

**Tip:** save all of the above as `db/init/001_schema.sql` so a fresh database is created with every table in one go.

### Notes on the data
- Checkbox-style values are stored as **text**: the app sends `'1'` / `'0'` for the 24 item fields and `'Yes'` / `'No'` for the three site-condition fields.
- An empty string from the app is stored as `NULL` (`blankToNull`).
- Dates arrive as `2026-10-11T16:04:24.560`; only the date part is stored (`dateOnly`).

### Sample data (needed for the app to show a record)
```sql
-- A "structure" row: this is the recID the app opens (id 9, no inspection date).
INSERT INTO form_g_inspections
  (id, reference_no, package_id, district_id, road_id,
   chainage, structure_code, gps_easting, gps_northing)
VALUES
  (9, 'test edit', '1', 'Kuching', 'Q1-1A', '0+110', '1011', '0.1234', '0.4567');

-- New inspections get ids from 1001, so they never collide with structure ids.
SELECT setval('form_g_inspections_id_seq', 1000);
```

---

## 4. How records fit together

The Flutter app expects the same model as the real server:

- **One table, one list.** Every row of `form_g_inspections` is returned by the listing endpoint.
- **A structure is a row with no `inspection_date`.** Its `id` is the `recID` the app opens (e.g. `9`). It supplies the header (district, road, chainage, GPS, `reference_no`).
- **An inspection is a row with an `inspection_date`.** All rows that share the same `reference_no` belong to the same structure.
- **The app does the grouping.** The first screen shows the latest row per `reference_no`. The details screen keeps rows whose `reference_no` equals the header's and that have a date.
- **`parent_rec_id`** stores the `recID` the app sent when it created the inspection (the structure it was created from).
- New inspections copy `reference_no`, chainage etc. from the header, which is why the structure row must exist first.

---

## 5. API reference

Base URL: `http://localhost:3000/site` (Chrome / iOS simulator) or `http://10.0.2.2:3000/site` (Android emulator).

All endpoints are `POST` with `multipart/form-data`. The Flutter app also sends `access_token` and `userName`; they are currently ignored. On a server error every endpoint returns HTTP 500 with `{ "http_status": "Server error.", "message": "..." }`.

### Summary

| Endpoint | Purpose |
|---|---|
| `Api_formGMainListingToken` | List all rows (structures and inspections) |
| `Api_formGMainListingDetailsToken` | Header block for one record |
| `Api_formGInspectionDetailsToken` | Site condition + 24 item values (Form G1) |
| `Api_formGnewInspectionToken` | Save a new inspection |
| `Api_formGphotoUploadToken` | Upload one photo (base64) |
| `Api_formGlistPhotoToken` | List photos of an inspection |
| `Api_formGremarksToken` | Save Part B / C / D remarks |
| `Api_formGremarksviewToken` | Read Part B / C / D remarks |
| `Api_formGsignatureToken` | Save approval / signature section |
| `GET /health` | Server + database check |

### `Api_formGMainListingToken`
Request: `packageId`, `districtId`, `routeId` are sent by the app but **currently ignored** (everything is returned).

Response:
```json
{
  "http_status": "Success.",
  "data": [
    {
      "inspection_date": "2026-10-12",
      "package": "1",
      "district": "Kuching",
      "roadName": "Q1-1A",
      "reference_no": "test edit",
      "recID": "1001",
      "insRecID": "1001",
      "status": "Pending"
    }
  ]
}
```
`inspection_date` is `""` for structure rows.

### `Api_formGMainListingDetailsToken`
Request: `recID` — id of a structure or an inspection row.

Response: `data` is a one-item array (empty if the id doesn't exist):
```json
{
  "ProjectName": "TRAMS (local dev)",
  "district": "Kuching", "road": "Q1-1A",
  "inspection_date": "", "reference_no": "test edit",
  "StructureCode": "1011", "Chainage": "0+110",
  "GPS_Easting": "0.1234", "GPS_Northing": "0.4567",
  "status": "Pending"
}
```

### `Api_formGInspectionDetailsToken`
Request: `recID` — inspection id.

Response: `data[0]` contains `parkingPosition`, `accessCondition`, `potentialHazard` (`"Yes"`/`"No"`) and the 24 item fields (`"1"`, `"0"` or `null`):
`barrier`, `gantryBeam`, `gantryColumn`, `footings`, `anchorMortar`, `maintenanceAccess`, `staticSigns`, `vms` — each with the suffixes `Distress`, `Critical`, `Closed` (e.g. `vmsCritical`).

### `Api_formGnewInspectionToken`
Request fields (names are case-sensitive; missing or empty fields are stored as `NULL`):

| Field | Stored in |
|---|---|
| `recID` | `parent_rec_id` |
| `inspection_date` | `inspection_date` |
| `referenceNo` | `reference_no` |
| `packageId`, `districtId`, `roadId` | `package_id`, `district_id`, `road_id` |
| `Chainage`, `StructureCode` | `chainage`, `structure_code` |
| `GPS_Easting`, `GPS_Northing` | `gps_easting`, `gps_northing` |
| `parkingPosition`, `accessCondition`, `potentialHazard` | `parking_position`, `access_condition`, `potential_hazard` |
| the 24 item fields, e.g. `barrierCritical` | e.g. `barrier_critical` |

Response:
```json
{ "http_status": "Success.", "recID": "1001", "data": "Inspection saved." }
```
The app uses the returned `recID` for the photo, remarks and approval calls that follow.

### `Api_formGphotoUploadToken`
Request: `recID`, `photoNo` (e.g. `photo1`), `photo` (base64 text, an optional `data:...,` prefix is stripped), `remarks` (caption).

Saves the image to `uploads/formG_<recID>_<photoNo>_<timestamp>.jpg` and a row in `form_g_photos`. Uploading the same `photoNo` again replaces it. Returns 400 if `recID`, `photoNo` or `photo` is missing.

Response: `{ "http_status": "Success.", "data": "Photo saved." }`

### `Api_formGlistPhotoToken`
Request: `recID` (the app also sends `limit`, ignored).

Response:
```json
{
  "http_status": "Success.",
  "data": [
    { "image": "http://10.0.2.2:3000/uploads/formG_1001_photo1_1791775135288.jpg", "photoNo": "photo1", "remarks": "test" }
  ]
}
```
The image URL is built from the address the app called, so it also works from the emulator. Photos are served from `/uploads/<filename>`.

### `Api_formGremarksToken`
Request: `recID`, `sp_remarks_partB`, `cons_remarks_partB`, `sp_remarks_partC`, `cons_remarks_partC`, `sp_remarks_partD`, `cons_remarks_partD`.

Saves (or overwrites) the single remarks row of the inspection. Returns 400 without `recID`.

Response: `{ "http_status": "Success.", "data": "Remarks saved." }`

### `Api_formGremarksviewToken`
Request: `recID`.

Response: always one item in `data`, with empty strings if nothing is saved:
```json
{ "recID": "1001", "sp_remarks_partB": "", "cons_remarks_partB": "",
  "sp_remarks_partC": "", "cons_remarks_partC": "",
  "sp_remarks_partD": "", "cons_remarks_partD": "" }
```

### `Api_formGsignatureToken`
Request: `recID`, `investigation`, `sp_sign_date`, `ec_sign_date` (empty until the consultant signs), `sign_agree`.

Response: `{ "http_status": "Success.", "data": "Approval saved." }`

---

## 6. What the app does when a Form G is submitted

1. `Api_formGnewInspectionToken` — main form; returns the new `recID`
2. `Api_formGphotoUploadToken` — once per photo
3. `Api_formGlistPhotoToken` — checks the photos arrived
4. `Api_formGremarksToken` — Part B / C / D
5. `Api_formGsignatureToken` — approval

If **any** step fails (for example a 404 because an endpoint is missing), the app saves the submission as a local draft instead. The main inspection row may already exist in the database by then.

---

## 7. Connecting the Flutter app

In `lib/constant/url.dart`:
```dart
final String localapi = kIsWeb
    ? "http://localhost:3000/site"
    : (defaultTargetPlatform == TargetPlatform.android
        ? "http://10.0.2.2:3000/site"
        : "http://localhost:3000/site");

String _formRoot(String formType) => formType == 'G' ? localapi : rootapi;
```
The generic form URLs (`Api_form${formType}...`) use `_formRoot(formType)`, so only Form G talks to this server. Login, dashboards, filters and Forms B, C and R still use the real server (`rootapi`).

- **Android emulator:** `10.0.2.2` is the host PC. Plain `http` needs `android:usesCleartextTraffic="true"` in `android/app/src/debug/AndroidManifest.xml`.
- **Real phone:** use the PC's LAN IP instead (same Wi-Fi), and allow port 3000 through the firewall.
- **Chrome:** `localhost` works; `cors()` is enabled in `app.js`.

---

## 8. Adding a new endpoint or form

1. Add a function to a controller, e.g. `controllers/formG.controller.js`.
2. Register it in `routes/formG.routes.js`: `router.post('/Api_formG...Token', asyncHandler(formG.yourFunction));`
3. For a new form (e.g. B): create `controllers/formB.controller.js` and `routes/formB.routes.js`, then add `app.use('/site', formBRoutes);` in `app.js`.
4. In the Flutter app, make `_formRoot` return `localapi` for that form type.
5. Restart the server (`node server.js`) — Express does not reload by itself unless you use `npm run dev`.

Watch the app's debug log to find which routes it still calls: a missing endpoint shows up as a 404 with the exact path.

---

## 9. Known limitations

- **No authentication.** `access_token` is not checked and there is no login endpoint.
- **Listing ignores filters.** `packageId`, `districtId`, `routeId` are not applied.
- **Not implemented for Form G:** edit inspection, delete photo, PDF download, search, signature view (`Api_UserSignatureToken`).
- **Structures are inserted by hand.** The structure ids come from the real server's search screen; there is no structures table or search endpoint here.
- **Ids:** new inspections start at 1001 (see sample data). If a real structure id could be 1001 or higher, change the sequence start.
- **Photos** are stored on local disk in `uploads/` and are not removed when an inspection is deleted from the database.
- **Only Form G exists.** Other forms still use the real server.

---

## 10. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `DATABASE_URL is not set in .env` | `.env` is missing or not in the folder you run `npm start` from |
| `password authentication failed` / `database "..." does not exist` | `DATABASE_URL` doesn't match `TRAMS_POSTGRES_*`. Changing `.env` after the first start has no effect on the existing volume — reset with `docker compose down -v` |
| `Cannot POST /site/...` | Route not registered in `routes/formG.routes.js`, a typo in the path, or the server wasn't restarted |
| Postman works but the app can't connect | Android blocks plain `http` (see section 7), or the wrong host is used (`10.0.2.2` vs `localhost`) |
| Inspection saved but the app stored a draft | A later step returned an error — check the app log for the failing URL |
| `duplicate key value violates unique constraint` on insert | A manually inserted id collides with the sequence. Run `SELECT setval('form_g_inspections_id_seq', 1000);` |
| New inspection doesn't show in Inspection Records | Its `reference_no` doesn't match the structure's, or it has no `inspection_date` |
| Docker logs `database "trams" does not exist` every 5 seconds | Healthcheck uses the wrong database name. Use `pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB` |

---

## 11. Handy commands

```
docker compose up -d                         start the database
docker compose down                          stop it (data kept)
docker compose down -v                       stop and DELETE all data
docker compose logs trams-db                 database logs
docker exec -it trams-db psql -U <user> -d <db>    open a SQL prompt
\dt                                          (inside psql) list tables
\d form_g_inspections                        (inside psql) show columns
npm start / npm run dev                      run the server
```
