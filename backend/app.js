import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { pool } from './config/db.js';
import { uploadsDir } from './config/uploads.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import formGRoutes from './routes/formG.routes.js';

const app = express();

app.use(cors());
// The app posts multipart/form-data. Allow big text fields (base64 photos).
app.use(multer({ limits: { fieldSize: 25 * 1024 * 1024 } }).none());

// Photos are viewable at /uploads/<filename>
app.use('/uploads', express.static(uploadsDir));

app.get('/health', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

app.use('/site', formGRoutes);

// Any error thrown by an endpoint ends up here.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ http_status: 'Server error.', message: err.message });
});

export default app;