import * as express from 'express';

const api = express();
api.use(express.json());

const jsonErrorHandler = async (err: any, req: any, res: any, next: any) => {
  if (err instanceof Error) {
    res.status(500).send({
      code: err.name,
      message: err.message,
      stack: err.stack
    });
  }
  else {
    res.status(500).send(err);
  }

}

api.use(jsonErrorHandler);

export default api;