import * as express from 'express';
import * as asyncHandler from 'express-async-handler';
import DiameterCommon from '../common';
import Peer from '../../diameter/peer';

const router = express.Router();

router.get('/', asyncHandler(async (req, res, next) => {
    let peers = Array.from(Peer.connected.values(), (peer) => peer.config);
    res.json(peers);
}));

router.post('/', asyncHandler(async (req, res, next) => {
    let params = req.body;
    let peer = await DiameterCommon.cer(params);
    res.send(peer);
}));

router.delete('/:id', asyncHandler(async (req, res, next) => {
    let id = parseInt(req.params.id);
    let peer = Peer.get(id);
    let success = await DiameterCommon.dpr(peer);
    res.sendStatus(success ? 204 : 500);
}));

export default router;