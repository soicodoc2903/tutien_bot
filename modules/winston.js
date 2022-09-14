import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const log = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

log.configure({
    level: 'verbose',
    transports: [
        new DailyRotateFile({
            filename: 'chuyen-bac-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    log.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

export {
    log
}
