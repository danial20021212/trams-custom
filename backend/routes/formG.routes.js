import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as formG from '../controllers/formG.controller.js';

const router = Router();

router.post('/Api_formGMainListingToken',        asyncHandler(formG.mainListing));
router.post('/Api_formGMainListingDetailsToken', asyncHandler(formG.mainListingDetails));
router.post('/Api_formGInspectionDetailsToken',  asyncHandler(formG.inspectionDetails));
router.post('/Api_formGnewInspectionToken',      asyncHandler(formG.newInspection));
router.post('/Api_formGphotoUploadToken',        asyncHandler(formG.photoUpload));
router.post('/Api_formGlistPhotoToken',          asyncHandler(formG.listPhoto));
router.post('/Api_formGremarksToken',            asyncHandler(formG.saveRemarks));
router.post('/Api_formGremarksviewToken',        asyncHandler(formG.viewRemarks));
router.post('/Api_formGsignatureToken',          asyncHandler(formG.saveSignature));

export default router;