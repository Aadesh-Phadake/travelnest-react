const { createLogger, format, transports } = require('winston');
const path = require('path');

const errorLogger = createLogger({
    level: 'error',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message, stack, method, url, statusCode }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}` +
                (method ? `\n  Method: ${method}` : '') +
                (url ? `\n  URL: ${url}` : '') +
                (statusCode ? `\n  Status: ${statusCode}` : '') +
                (stack ? `\n  Stack: ${stack}` : '') +
                '\n';
        })
    ),
    transports: [
        new transports.File({
            filename: path.join(__dirname, '..', 'error logs.txt'),
            maxsize: 5 * 1024 * 1024, // 5 MB max file size
            maxFiles: 3,              // keep up to 3 rotated files
        })
    ]
});

module.exports = errorLogger;
