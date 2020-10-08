#!/usr/bin/env node
// To be used by pkg 

require('diameter-dictionary');
require('./package.json');
require('./lib').run().catch(require('@oclif/errors/handle'));