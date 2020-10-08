import * as express from 'express';
import * as asyncHandler from 'express-async-handler';
const dictionary = require(process.env.DIAMETER_DICTIONARY || 'diameter-dictionary');

const router = express.Router();

router.get('/', asyncHandler(async (req, res, next) => {
    res.json(dictionary);
}));

export default router;