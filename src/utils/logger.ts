export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel = LogLevel.INFO;
    private prefix: string = '[ErrorExplainer]';

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    public debug(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.log(`${this.prefix} [DEBUG]`, message, ...args);
        }
    }

    public info(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.INFO) {
            console.log(`${this.prefix} [INFO]`, message, ...args);
        }
    }

    public warn(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.WARN) {
            console.warn(`${this.prefix} [WARN]`, message, ...args);
        }
    }

    public error(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.ERROR) {
            console.error(`${this.prefix} [ERROR]`, message, ...args);
        }
    }
}