import Module from '../../module'
import api from './api/router';
import fromClient from './handlers/fromClient';

const DiameterModule: Module = {
  apiRouter: api,
  socketHandler: fromClient
};

export default DiameterModule;