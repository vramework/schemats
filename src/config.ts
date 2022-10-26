import camelCase from 'camelcase'

export interface ConfigValues {
    schema: string
    tables: string[]
    camelCase?: boolean
    camelCaseTypes?: boolean
    writeHeader?: boolean
    typesFile?: boolean
    throwOnMissingType?: boolean
    enums?: boolean
    bigint?: boolean
}

export class Config {
    constructor (public config: Partial<ConfigValues> & Pick<ConfigValues, 'schema' | 'tables'>) {
        this.config = {
            writeHeader: true,
            camelCase: false,
            throwOnMissingType: true,
            enums: false,
            bigint: true,
            ...config
        }
    }

    public getCLICommand (dbConnection: string): string {
        const commands = ['schemats', 'generate', dbConnection]
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

    public get typesFile () {
        return this.config.typesFile
    }

    public get throwOnMissingType () {
        return this.config.throwOnMissingType
    }

    public transformTypeName (typename: string) {
        return (this.config.camelCase || this.config.camelCaseTypes) ? camelCase(typename, { pascalCase: true }) : typename
    }

    public transformColumnName (columnName: string) {
        return this.config.camelCase ? camelCase(columnName) : columnName
    }
}
