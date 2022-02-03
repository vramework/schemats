## [1.0.0] - 2022.02.03

fix(postgres): (bchrobot) adding missing cli command throwOnMissingType

fix(postgres): (bchrobot) typo in write-header option

## [0.0.12] - 2021.11.01

fix: typo in CLI

## [0.0.11] - 2021.10.31

feat: adding mysql compatability

This allows you to do the same thing just with mysql using `/bin/schemats mysql $connection_string -s $schema_name `

## [0.0.10] - 2021.09.02

chore: updating all dependencies

feat: add -C --camelCaseTypes option
    
    This option adds the ability to camel case just the type names - which
    gives a good mix between using JS Standard Camel Case and still
    following the actual definitions of database.
    
    The issue with using camel case for both the types and the keys
    is that we would have to provide a layer within the programs using the
    types to convert back to the original form if the attributes are
    different in JS than in the schema.
    
    There are definately
    issues with this, especially with a database schema with an inconsistent
    naming convention - we would have to provide some sort of mapping file
    to acheive correct conversion.
    
    The types on the other hand, only exist in JS and therefore can be named
    whatever we want when generating the types.

fix(schema): add 'tsvector' to string types
    
    Text Search Vectors are a complex type inside of postgres, but can
    generally be expressed as strings within TS.

fix(generator): quote string enum keys
    
    This helps prevent issues in the generated file due to special
    characters like `:` present in the postgres enum keys.

## [0.0.9] - 2021.08.27

doc: adding example documentation
fix: Don't export custom types if empty

## [0.0.8] - 2021.08.22

Feat: Exporting tables and Custom types for typed-postgres

## [0.0.7] - 2021.08.05

Fix: array regression due to bad merge

## [0.0.6] - 2021.08.05

Feat: using the -f flag to reference a file with non DB types and adding comments to columns in postgres using `COMMENT ON COLUMN schema.table.column is '@type {TYPE}';` now allows us to type jsonb columns directly

## [0.0.5] - 2021.07.26

Fix: isArray overrides real value with false

## [0.0.4] - 2021.07.26

Fix: publish dist and src packages

## [0.0.3] - 2021.07.26

Fix: nullable fields are also optional

## [0.0.2] - 2021.07.26

Fix: Adding support for arrays

## [0.0.1] - 2021.06.20

Include README file in published package

## [0.0.0] - 2021.06.20

First release
