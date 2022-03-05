import * as commander from 'commander'
import { Config, typescriptOfSchema } from '../src/generator'
import { promises } from 'fs'
import { relative } from 'path'

// work-around for:
// TS4023: Exported variable 'command' has or is using name 'local.Command'
// from external module "node_modules/commander/typings/index" but cannot be named.
export type Command = commander.Command

export const mysql = async (program: Command): Promise<void> => {
    program
        .command('mysql')
        .description('Generate a typescript schema from mysql')
        .argument('[connection]', 'The connection string to use, if left empty will use env variables')
        .option('-s, --schema <schema>', 'the schema to use', 'public')
        .option('-t, --tables <tables...>', 'the tables within the schema')
        .option('-c, --camelCase', 'use camel case for enums, table names, and column names')
        .option('-e, --enums', 'use enums instead of types')
        .option('-o, --output <output>', 'where to save the generated file relative to the current working directory')
        .option('--no-header', 'don\'t generate a header')
        .action(async (connection, rest) => {
            const { MysqlDatabase } = require('../src/schema-mysql')
            const config = new Config(rest)
            const database = new MysqlDatabase(config, connection)
            await database.isReady()
            const schema = await typescriptOfSchema(config, database)
            if (rest.output) {
                const outputPath = relative(process.cwd(), rest.output)
                await promises.writeFile(outputPath, schema, 'utf8')
                console.log(`Written schema to ${outputPath}`)
            } else {
                console.log(schema)
            }
            await database.close()
        })

  program.action(program.help)
}
