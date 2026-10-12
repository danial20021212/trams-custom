import { snake } from '../utils/helpers.js';

export const ITEMS = [
  'barrier', 'gantryBeam', 'gantryColumn', 'footings',
  'anchorMortar', 'maintenanceAccess', 'staticSigns', 'vms',
];

// ['barrierDistress', 'barrierCritical', 'barrierClosed', ...] = 24 names
export const ITEM_FIELDS = ITEMS.flatMap((item) =>
  ['Distress', 'Critical', 'Closed'].map((suffix) => item + suffix)
);

// Column order for inserting a new inspection. It must match the order of
// the values array in the newInspection controller.
export const INSERT_COLUMNS = [
  'parent_rec_id', 'inspection_date', 'reference_no', 'package_id',
  'district_id', 'road_id', 'chainage', 'structure_code',
  'gps_easting', 'gps_northing',
  'parking_position', 'access_condition', 'potential_hazard',
  ...ITEM_FIELDS.map(snake),
];