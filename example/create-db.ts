import { promises } from 'fs'
import { Client } from 'pg'

const createDB = async () => {
    const db = new Client('postgres://postgres:password@localhost/postgres')
    await db.connect()
    const r = await db.query(`SELECT 'CREATE DATABASE schemats' as create WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'schemats')`)
    const createSql = r.rows[0]?.create
    if (createSql) {
        await db.query(createSql)
    }    
    await db.end()
}

const main = async () => {
    await createDB()

    const db = new Client('postgres://postgres:password@localhost/schemats')
    await db.connect()
    await db.query<{ version: string }>(`SELECT version()`)
    await db.query(await promises.readFile(`${__dirname}/schema.sql`, 'utf-8'))
    await db.end()

}

main()