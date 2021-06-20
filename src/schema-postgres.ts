import { Client } from 'pg'
import { Config } from './generator'
import { TableDefinition, Database, EnumTypes } from './schema-interfaces'

export const mapPostgresTableDefinitionToType = (config: Config, tableDefinition: TableDefinition, customTypes: Set<string>): TableDefinition => {
    return Object.entries(tableDefinition).reduce((result, [table, column]) => {
        column.isArray = column.udtName.startsWith('_')
        switch (column.udtName) {
            case 'bpchar':
            case 'char':
            case 'varchar':
            case 'text':
            case 'citext':
            case 'uuid':
            case 'bytea':
            case 'inet':
            case 'time':
            case 'timetz':
            case 'interval':
            case 'name':
                column.tsType = 'string'
                break
            case 'int2':
            case 'int4':
            case 'int8':
            case 'float4':
            case 'float8':
            case 'numeric':
            case 'money':
            case 'oid':
                column.tsType = 'number'
                break
            case 'bool':
                column.tsType = 'boolean'
                break
            case 'json':
            case 'jsonb':
                column.tsType = config.getTypeOfObjectForColumn(table, column)
                break
            case 'date':
            case 'timestamp':
            case 'timestamptz':
                column.tsType = 'Date'
                break
            default:
                if (customTypes.has(column.udtName)) {
                    column.tsType = config.transformTypeName(column.udtName)
                    break
                } else {
                    const warning = `Type [${column.udtName} has been mapped to [any] because no specific type has been found.`
                    if (config.throwOnMissingType) {
                        throw new Error(warning)
                    }
                    console.log(`Type [${column.udtName} has been mapped to [any] because no specific type has been found.`)
                    column.tsType = 'any'
                    break
                }
        }
        result[table] = column
        return result
    }, {} as TableDefinition)
}

export class PostgresDatabase implements Database {
    private db: Client
    public version: string = ''

    constructor (private config: Config, public readonly connectionString: string) {
        this.db = new Client(connectionString || 'postgres://postgres:password@localhost/enjamon')
    }

    public async isReady () {
        await this.db.connect()
        const result = await this.db.query<{ version: string }>(`SELECT version()`)
        this.version = result.rows[0].version
    }

    public async close () {
        await this.db.end()
    }

    public getDefaultSchema (): string {
        return 'public'
    }

    public async getEnums (schema: string): Promise<EnumTypes> {
        const results = await this.db.query<{ name: string, value: string }>(`
            SELECT n.nspname as schema, t.typname as name, e.enumlabel as value
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = $1
        `, [schema])
        return results.rows.reduce((result, { name, value }) => {
            let values = result[name] || []
            values.push(value)
            result[name] = values
            return result
        }, {} as EnumTypes)
    }

    public async getTableDefinition (tableSchema: string, tableName: string) {
        const result = await this.db.query<{ column_name: string, udt_name: string, is_nullable: string }>(`
            SELECT column_name, udt_name, is_nullable
            FROM information_schema.columns
            WHERE table_name = $1 and table_schema = $2
        `, [tableName, tableSchema])
        if (result.rows.length === 0) {
            console.error(`Missing table: ${tableSchema}.${tableName}`)
        }
        return result.rows.reduce((result, { column_name, udt_name, is_nullable }) => {
            result[column_name] = {
                udtName: udt_name.replace(/^_/, ''),
                nullable: is_nullable === 'YES',
                isArray: udt_name.startsWith('_')
            }
            return result
        }, {} as TableDefinition)
    }


    public async getTableTypes (tableSchema: string, tableName: string) {
        const enumTypes = await this.getEnums(tableSchema)
        return mapPostgresTableDefinitionToType(this.config, await this.getTableDefinition(tableSchema, tableName), new Set(Object.keys(enumTypes)))
    }

    public async getSchemaTables (schemaName: string): Promise<string[]> {
        const result = await this.db.query(`
            SELECT table_name
            FROM information_schema.columns
            WHERE table_schema = $1
            GROUP BY table_name
        `, [schemaName])
        if (result.rows.length === 0) {
            console.error(`Missing schema: ${schemaName}`)
        }
        return result.rows.map(({ table_name }) => table_name)
    }
}
