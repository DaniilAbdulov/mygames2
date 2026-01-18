type LogMethod = (msg: string) => void;

declare interface Logger {
    error: LogMethod,
    warn: LogMethod,
    debug: LogMethod,
    info: LogMethod
}

export = Logger;
