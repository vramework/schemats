export interface ColumnDefinition {
    udtName: string,
    nullable: boolean,
    tsType?: string
    isArray: boolean
}

export type EnumTypes = Record<string, string[]>
export type TableDefinition = Record<string, ColumnDefinition>

export interface Database {
    version: string
    connectionString: string
    isReady (): Promise<void>
    close (): Promise<void>
    getDefaultSchema (): string
    getEnums (schemaName: string): Promise<EnumTypes>
    getTableDefinition (schemaName: string, tableName: string): Promise<TableDefinition>
    getTableTypes (schemaName: string, tableName: string): Promise<TableDefinition>
    getSchemaTables (schemaName: string): Promise<string[]>
}
