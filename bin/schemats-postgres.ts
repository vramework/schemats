import * as commander from 'commander'
import { Config, typescriptOfSchema } from '../src/generator'
import { PostgresDatabase } from '../src/schema-postgres'
import { promises } from 'fs'
import { relative } from 'path'

// work-around for:
// TS4023: Exported variable 'command' has or is using name 'local.Command'
// from external module "node_modules/commander/typings/index" but cannot be named.
export type Command = commander.Command

export const postgres = async (program: Command): Promise<void> => {
    program
        .command('postgres')
        .arguments('[connection]')
        .option('-s, --schema <schema>', 'the schema to use', 'public')
        .option('-t, --tables <tables...>', 'the tables within the schema')
        .option('-f, --typesFile <typesFile>', 'the file where jsonb types can be imported from')
        .option('-c, --camelCase', 'use camel case for enums, table names, and column names')
        .option('-C, --camelCaseTypes', 'use camel case only for TS names - not modifying the column names')
        .option('-e, --enums', 'use enums instead of types')
        .option('-o, --output <output>', 'where to save the generated file relative to the current working directory')
        .option('--no-write-header', 'don\'t generate a header')
        .option('--no-throw-on-missing-type', 'don\'t throw an error when pg type cannot be mapped to ts type')
        .description('Generate a typescript schema from postgres', {
            connection: 'The connection string to use, if left empty will use env variables'
        })
        .action(async (connection, rest) => {
            const config = new Config(rest)
            const database = new PostgresDatabase(config, connection)
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
