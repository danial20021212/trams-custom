// The app sends '' for "not filled in". Store that as NULL.
export const blankToNull = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

// "2026-10-11T16:04:24.560" -> "2026-10-11"
export const dateOnly = (v) => {
  const s = blankToNull(v);
  return s ? s.slice(0, 10) : null;
};

// 'gantryBeamCritical' -> 'gantry_beam_critical'
export const snake = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

// "7" -> 7, anything that isn't a whole number -> null
export const parseId = (v) => {
  const id = Number.parseInt(v, 10);
  return Number.isInteger(id) ? id : null;
};