export const LogLevel = {
    ALL: 0,
    DEBUG: 10,
    INFO: 20,
    WARNING: 30,
    ERROR: 40,
    NONE: 100000,
}

function empty() {}
function identity<T>(x: T): T { return x; }

type LogFunc = (message?: any, ...optionalParams: any[]) => void

function injectMarker(marker: string): (arg: LogFunc) => LogFunc {
    return (logFunc: LogFunc) => {
        return (message?: any, ...optionalParams: any[]) => {
            logFunc(`[${marker}] ${message}`, ...optionalParams);
        }
    }
}

export function getLogger(logLevel: number, loggerName: string | null = null) {
    const wrapper = loggerName != null ? injectMarker(loggerName) : identity;
    return {
        debug: logLevel <= LogLevel.DEBUG ? wrapper(console.debug) : empty,
        info: logLevel <= LogLevel.INFO ? wrapper(console.info) : empty,
        warn: logLevel <= LogLevel.WARNING ? wrapper(console.warn) : empty,
        error: logLevel <= LogLevel.ERROR ? wrapper(console.error) : empty,
    }
}

export const LogLevels = {
    DEPLOY: LogLevel.INFO,
    ARTIFACTS: LogLevel.INFO,
    PROOF_GENERATOR: LogLevel.INFO,
    CONTRACT_INTERACTION: LogLevel.INFO,
}