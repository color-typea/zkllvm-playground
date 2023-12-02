export const LogLevel = {
    ALL: 0,
    DEBUG: 10,
    INFO: 20,
    WARNING: 30,
    ERROR: 40,
    NONE: 100000,
}

function empty() {}

export function getLogger(logLevel: number) {
    return {
        debug: logLevel <= LogLevel.DEBUG ? console.debug : empty,
        info: logLevel <= LogLevel.INFO ? console.info : empty,
        warn: logLevel <= LogLevel.WARNING ? console.warn : empty,
        error: logLevel <= LogLevel.ERROR ? console.error : empty,
    }
}

export const LogLevels = {
    DEPLOY: LogLevel.INFO,
    ARTIFACTS: LogLevel.INFO,
    PROOF_GENERATOR: LogLevel.INFO,
    CONTRACT_INTERACTION: LogLevel.INFO,
}