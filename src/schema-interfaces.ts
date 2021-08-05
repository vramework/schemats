export interface ForeignKey {
    table: string;
    column: string;
}

export interface ColumnDefinition {
    udtName: string,
    nullable: boolean,
    tsType?: string
    isArray: boolean
    comment?: string;
    foreignKey?: ForeignKey
    hasDefault: boolean
}

export interface Metadata {
    schema: string;
    enumTypes: any
    foreignKeys: Record<string, { [columnName: string]: ForeignKey }>
    tableToKeys: Record<string, string>
    columnComments: Record<string, Record<string, string>>
    tableComments: Record<string, string>
}

export type EnumTypes = Record<string, string[]>
export type TableDefinition = Record<string, ColumnDefinition>

export interface Database {
    version: string
    getConnectionString: () => string
    isReady(): Promise<void>
    close(): Promise<void>
    getDefaultSchema(): string
    getEnums(schemaName: string): Promise<EnumTypes>
    getTableDefinition(schemaName: string, tableName: string): Promise<TableDefinition>
    getTableTypes(schemaName: string, tableName: string, types: Set<string>): Promise<TableDefinition>
    getSchemaTables(schemaName: string): Promise<string[]>
}
