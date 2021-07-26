#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var package_json_1 = require("../package.json");
var commander_1 = require("commander");
var schemats_postgres_1 = require("./schemats-postgres");
var program = new commander_1.Command('schemats');
program.usage('[command]').version(package_json_1.version.toString());
schemats_postgres_1.postgres(program);
program.parseAsync(process.argv);
//# sourceMappingURL=schemats.js.map