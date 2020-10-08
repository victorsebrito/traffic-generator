import * as express from 'express';
import peers from './peers';
import dictionary from './dictionary';

const router = express.Router();

router.use('/dictionary', dictionary);
router.use('/peers', peers);

export default router;