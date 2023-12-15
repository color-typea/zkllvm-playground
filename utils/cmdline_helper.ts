import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import {LogLevels, getLogger} from "./logging";

function empty() { }

export const LogLevel = {
    ALL: 0,
    DEBUG: 10,
    INFO: 20,
    WARNING: 30,
    ERROR: 40,
    NONE: 100000,
}

export class CmdlineHelper {
    protected logger;
    private supressSubcommandOutput: boolean;

    constructor(logLevel: number) {
        this.logger = getLogger(logLevel);
        this.supressSubcommandOutput = logLevel >= LogLevel.INFO;
    }

    protected flattenNamedArgs(namedArgs: Record<string, string>): string[] {
        return Object.entries(namedArgs).reduce<string[]>(
            (acc, [key, value]) => acc.concat([key, value]),
            []
        );
    }

    protected arrayArg(name: string, values: string[]): string[] {
        return values.map(value => `${name} ${value}`);
    }

    protected async deleteAllFilesInDir(dirPath: string): Promise<void> {
        try {
            const files = await fs.promises.readdir(dirPath);
            const deletePromises = files.map(file => path.join(dirPath, file)).map(fs.promises.unlink);

            return Promise.all(deletePromises).then(_ => { return });
        } catch (err) {
            return Promise.reject(err);
        }
    }

    protected async moveAllFilesInDir(srcPath: string, destPath: string) {
        try {
            const files = await fs.promises.readdir(srcPath);

            const renamePromises = files.map(file => {
                const oldPath = path.join(srcPath, file);
                const newPath = path.join(destPath, file);
                return fs.promises.rename(oldPath, newPath);
            });

            return Promise.all(renamePromises).then(_ => { return });
        } catch (err) {
            return Promise.reject(err);
        }
    }

    async runCmd(command: string, options: childProcess.SpawnOptions = {}): Promise<void> {
        const exec = () => childProcess.spawn(command, {
            shell: true,
            stdio: 'inherit',
            ...options
        });
        return this._run(exec);
    }

    async runCommand(command: string, runArgs: Array<string>, options: childProcess.SpawnOptions = {}): Promise<void> {
        const stdout = this.supressSubcommandOutput ? 'ignore' : 'inherit';
        const exec = () => childProcess.spawn(command, runArgs, {
            shell: true,
            stdio: ['inherit', stdout, 'inherit'],
            ...options
        });
        this.logger.debug("Running", command, runArgs);
        return this._run(exec);
    }

    private _run(cmdFn: () => childProcess.ChildProcess): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const process = cmdFn();
                process.on('error', (err) => {
                    reject(err);
                });
                process.on('exit', (code, signal) => {
                    if (signal) {
                        reject(`Assigner exited with signal ${signal}`);
                    }
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`Failed - retcode ${code}`));
                    }
                });
            } catch (err) {
                console.log("Err", err);
                reject(err);
            }
        });
    }
}