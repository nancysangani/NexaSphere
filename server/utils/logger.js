/**
 * Winston Logger Configuration
 * Structured logging for all backend operations
 */

import winston from 'winston';
import { appContext } from '../config/appContext.js';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define transports
// 1. Define the base format WITHOUT colorize
const baseFileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const ts = typeof timestamp === 'string' ? timestamp : new Date().toISOString();

    // Strip out internal Winston symbol keys so they don't print as empty objects
    const cleanArgs = Object.keys(args).reduce((acc, key) => {
      if (typeof key === "string" || typeof key === "number") {
        acc[key] = args[key];
      }
      return acc;
    }, {});

    return `${ts} [${level}]: ${message} ${
      Object.keys(cleanArgs).length ? JSON.stringify(cleanArgs, null, 2) : ""
    }`;
  })
);

// 2. Apply separate configurations inside your transports array
const transports = [
  // Console gets colors added cleanly on top of the base format
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      baseFileFormat
    ),
  }),

  // Files use the base format directly (ensures 100% clean plain text)
  new winston.transports.File({
    filename: path.join(logsDir, "error.log"),
    level: "error",
    format: baseFileFormat,
  }),

  new winston.transports.File({
    filename: path.join(logsDir, "combined.log"),
    format: baseFileFormat,
  }),

  new DailyRotateFile({
    filename: path.join(logsDir, "application-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "14d",
    format: baseFileFormat,
    utc: true,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: baseFileFormat, //  FIX: Use the uncolorized base format here
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, "exceptions-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: baseFileFormat, //  FIX: Ensures clean exception dumps
      utc: true,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, "rejections-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: baseFileFormat, //  FIX: Ensures clean rejection dumps
      utc: true,
    }),
  ],
});

export default logger;
