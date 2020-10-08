import * as winston from 'winston';
import strip = require('strip-color');
import * as DailyRotateFile from 'winston-daily-rotate-file';

const { combine, colorize, timestamp, printf } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level}]: ${message}`;
});

const descolorize = winston.format((info, opts) => {
  info.message = strip(info.message);
  return info;
});

export default {
  transports: [
    new winston.transports.Console({
      level: "debug",
      format: combine(
        colorize(),
        timestamp(),
        myFormat
      ),
    }),
    new DailyRotateFile({
      format: winston.format.combine(
        descolorize(),
        timestamp(),
        myFormat
      ),
      level: "debug",
      filename: 'logs/tgen-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '3d',
    })
  ],
} as winston.LoggerOptions;
