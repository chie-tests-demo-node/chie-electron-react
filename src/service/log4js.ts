import log4js from "log4js";


log4js.configure({
    appenders: {
        fileout: {
            type: "dateFile",
            filename: './logs/sysLog',
            pattern: '[yyyy-MM-dd].log',
            alwaysIncludePattern: true,
        },
        consoleout: { type: 'console' }
    },
    categories: { default: { appenders: ["fileout", "consoleout"], level: 'info' } },
});

const logger_access = log4js.getLogger();

const info = (prefix: string, content: string) => logger_access.info(`${prefix}: ${content}`);
const error = (prefix: string, content: string) => logger_access.error(`${prefix}: ${content}`);
const warn = (prefix: string, content: string) => logger_access.warn(`${prefix}: ${content}`);


const logger = {
    info,
    error,
    warn
};


export default logger;