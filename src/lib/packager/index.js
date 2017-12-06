const shell = require('shelljs');
const parsePath = require('parse-filepath');

const Fetch = require('../Fetch');
const Library = require('../Library');

class Packager extends Fetch {
    constructor (serverless, ephemeral, options = {}) {
        super(serverless, ephemeral);

        if (!options.name) {
            throw new Error('No packager "name" was defined');
        }

        this.name = options.name;

        if (!options.filename) {
            const parsed = parsePath(options.output);

            if (parsed.ext !== '.zip') {
                throw new Error('Packager "output" must be a path to a zip file');
            }

            options.filename = parsed.base;
        }

        this.file = new Library(
            `${this.ephemeral.paths.lib}`,
            options.filename
        );

        // Initialize shell as silent
        shell.config.silent = !this.serverless.cli.isVerbose();
    }
}

module.exports = Packager;
