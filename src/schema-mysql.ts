import { Config } from './generator'
import { TableDefinition, Database, EnumTypes } from './schema-interfaces'
import { Connection, createConnection, RowDataPacket } from 'mysql2/promise'

// uses the type mappings from https://github.com/mysqljs/ where sensible
const mapTableDefinitionToType = (config: Config, tableDefinition: TableDefinition, enumTypes: Set<string>, customTypes: Set<string>, columnDescriptions: Record<string, string>): TableDefinition => {
    return Object.entries(tableDefinition).reduce((result, [columnName, column]) => {
        switch (column.udtName) {
            case 'char':
            case 'varchar':
            case 'text':
            case 'tinytext':
            case 'mediumtext':
            case 'longtext':
            case 'time':
            case 'geometry':
            case 'set':
            case 'enum':
                // keep set and enum defaulted to string if custom type not mapped
                column.tsType = 'string'
                break
            case 'integer':
            case 'int':
            case 'smallint':
            case 'mediumint':
            case 'bigint':
            case 'double':
            case 'decimal':
            case 'numeric':
            case 'float':
            case 'year':
                column.tsType = 'number'
                break
            case 'tinyint':
                column.tsType = 'boolean'
                break
            case 'json':
                column.tsType = 'unknown'
                if (columnDescriptions[columnName]) {
                    const type = /@type \{([^}]+)\}/.exec(columnDescriptions[columnName])
                    if (type) {
                        column.tsType = type[1].trim()
                        customTypes.add(column.tsType)
                    }
                }
                break
            case 'date':
            case 'datetime':
            case 'timestamp':
                column.tsType = 'Date'
                break
            case 'tinyblob':
            case 'mediumblob':
            case 'longblob':
            case 'blob':
            case 'binary':
            case 'varbinary':
            case 'bit':
                column.tsType = 'Buffer'
                break
            default:
                if (enumTypes.has(column.udtName)) {
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
        result[columnName] = column
        return result
    }, {} as TableDefinition)
}

const parseMysqlEnumeration = (mysqlEnum: string): string[] => {
    return mysqlEnum.replace(/(^(enum|set)\('|'\)$)/gi, '').split(`','`)
}

const getEnumNameFromColumn = (dataType: string, columnName: string): string => {
    return `${dataType}_${columnName}`
}

export class MysqlDatabase implements Database {
    public version: string = ''
    private db!: Connection

    constructor (private config: Config, public connectionString: string) {
    }

    public async isReady(): Promise<void> {
        this.db = await createConnection(this.connectionString)
    }

    public async close(): Promise<void> {
        await this.db.destroy()
    }

    public getConnectionString (): string {
        return this.connectionString
    }

    public getDefaultSchema (): string {
        return 'public'
    }

    public async getEnums(schema: string): Promise<EnumTypes> {
        const rawEnumRecords = await this.query<{ COLUMN_NAME: string, COLUMN_TYPE: string, DATA_TYPE: string }>(`
            SELECT COLUMN_NAME, COLUMN_TYPE, DATA_TYPE
            FROM information_schema.columns
            WHERE data_type IN ('enum', 'set') and table_schema = ?
        `, [schema])
        return rawEnumRecords.reduce((result, { COLUMN_NAME, COLUMN_TYPE, DATA_TYPE }) => {
            const enumName = getEnumNameFromColumn(DATA_TYPE, COLUMN_NAME)
            const enumValues = parseMysqlEnumeration(COLUMN_TYPE)
            if (result[enumName] && JSON.stringify(result[enumName]) !== JSON.stringify(enumValues)) {
                throw new Error(
                    `Multiple enums with the same name and contradicting types were found: ${COLUMN_NAME}: ${JSON.stringify(result[enumName])} and ${JSON.stringify(enumValues)}`
                )
            }
            result[enumName] = enumValues
            return result
        }, {} as EnumTypes)
    }

    public async getTableDefinition (tableSchema: string, tableName: string): Promise<TableDefinition> {
        const tableColumns = await this.query<{ COLUMN_NAME: string, DATA_TYPE: string, IS_NULLABLE: string, COLUMN_DEFAULT: string }>(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT  
            FROM information_schema.columns
            WHERE table_name = ? and table_schema = ?`,
            [tableName, tableSchema]
        )
        const tableDefinition = tableColumns.reduce((result, schemaItem) => {
            const columnName = schemaItem.COLUMN_NAME
            const dataType = schemaItem.DATA_TYPE
            result[columnName] = {
                udtName: /^(enum|set)$/i.test(dataType) ? getEnumNameFromColumn(dataType, columnName) : dataType,
                nullable: schemaItem.IS_NULLABLE === 'YES',
                isArray: false,
                hasDefault: schemaItem.COLUMN_DEFAULT !== null
            }
            return result
        }, {} as TableDefinition)
        return tableDefinition
    }

    public async getTableTypes (tableSchema: string, tableName: string, customTypes: Set<string>) {
        const enumTypes = await this.getEnums(tableSchema)
        const columnComments = await this.getColumnComments(tableSchema, tableName)
        return mapTableDefinitionToType(
            this.config, 
            await this.getTableDefinition(tableSchema, tableName), 
            new Set(Object.keys(enumTypes)), 
            customTypes,
            columnComments
        )
    }

    public async getSchemaTables (schemaName: string): Promise<string[]> {
        const schemaTables = await this.query<{ TABLE_NAME: string }>(`
            SELECT TABLE_NAME
            FROM information_schema.columns
            WHERE table_schema = ?
            GROUP BY table_name
        `,
            [schemaName]
        )
        return schemaTables.map((schemaItem: { TABLE_NAME: string }) => schemaItem.TABLE_NAME)
    }

    public async getColumnComments(schemaName: string, tableName: string) {
        // See https://stackoverflow.com/a/4946306/388951
        const commentsResult = await this.query<{
            table_name: string;
            column_name: string;
            description: string;
        }>(
            `
            select column_name, column_type, column_default, column_comment
            from information_schema.COLUMNS
            where table_schema = ? and table_name = ?;
            `,
            [schemaName, tableName],
        );
        return commentsResult.reduce((result, { column_name, description }) => {
            result[column_name] = description
            return result
        }, {} as Record<string, string>)
    }

    private async query <T>(query: string, args: any[]): Promise<T[]> {
        const [rows, columns] = await this.db.query<RowDataPacket[]>(query, args)
        return rows as unknown as T[]
    }
}
