import * as commander from 'commander';
export declare type Command = commander.Command;
export declare const postgres: (program: Command) => Promise<void>;
