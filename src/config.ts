import camelCase from 'camelcase'
import { ColumnDefinition } from './schema-interfaces'

export interface ConfigValues {
    schema: string
    tables: string[]
    camelCase?: boolean
    writeHeader?: boolean
    throwOnMissingType?: boolean
    enums?: boolean
}

export class Config {
    constructor (public config: Partial<ConfigValues> & Pick<ConfigValues, 'schema' | 'tables'>) {
        this.config = {
            writeHeader: true,
            camelCase: false,
            throwOnMissingType: true,
            enums: true,
            ...config
        }
    }

    public getCLICommand (): string {
        const commands = ['schemats', 'generate']
        if (this.config.camelCase) {
            commands.push('-C')
        }
        if (this.config.tables?.length > 0) {
            commands.push('-t', this.config.tables.join(' '))
        }
        if (this.config.schema) {
            commands.push(`-s ${this.config.schema}`)
        }
        return commands.join(' ')
    }

    public get enums () {
        return this.config.enums
    }

    public get tables () {
        return this.config.tables
    }

    public get schema () {
        return this.config.schema
    }

    public get writeHeader () {
        return this.config.writeHeader
    }

    public get throwOnMissingType () {
        return this.config.throwOnMissingType
    }

    public transformTypeName (typename: string) {
        return this.config.camelCase ? camelCase(typename, { pascalCase: true }) : typename
    }

    public transformColumnName (columnName: string) {
        return this.config.camelCase ? camelCase(columnName) : columnName
    }

    public getTypeOfObjectForColumn (table: string, column: ColumnDefinition) {
        return 'never'
    }
}
