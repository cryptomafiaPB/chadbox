import pc from 'picocolors';

export const logger = {
    info: (msg: string) => console.log(pc.blue('ℹ') + ' ' + msg),
    success: (msg: string) => console.log(pc.green('✔') + ' ' + msg),
    error: (msg: string) => console.log(pc.red('✖') + ' ' + msg),
    warn: (msg: string) => console.log(pc.yellow('⚠') + ' ' + msg),
    pc,
};
