#!/usr/bin/env node
import { version } from '../package.json'

import { Command } from 'commander'
import { postgres } from './schemats-postgres'
import { mysql } from './schemats-mysql'

const program = new Command('schemats')
program.usage('[command]').version(version.toString())

postgres(program)
mysql(program)

program.parseAsync(process.argv)