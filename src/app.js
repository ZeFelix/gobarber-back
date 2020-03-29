import 'dotenv/config';

import express from 'express';
import { resolve } from 'path';
import * as Sentry from '@sentry/node';
import Youch from 'youch';
import 'express-async-errors';

import routes from './router';
import sentryConfig from './config/sentry';

import './database';

class App {

  constructor() {
    this.server = express();

    Sentry.init(sentryConfig);

    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(Sentry.Handlers.requestHandler());
    this.server.use(express.json());
    this.server.use(
      '/files',
      express.static(resolve(__dirname, '..', 'tmp', 'uploads')),
    );
  }

  routes() {
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler());
  }

  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        const errors = await new Youch(err, req).toJSON();

        return res.status(res.statusCode).json(errors);
      }

      return res.status(res.statusCode).json({ message: 'Internal error!' });
    });
  }
}

export default new App().server;
