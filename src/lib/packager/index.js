const shell = require('shelljs');
const parsePath = require('parse-filepath');

const Fetch = require('../Fetch');
const FilePath = require('../../util/FilePath');

class Packager extends Fetch {
    constructor (serverless, ephemeral, options = {}) {
        super(serverless, ephemeral);

        if (!options.name) {
            throw new Error('No packager "name" was defined');
        }

        this.name = options.name;

        if (options.output) {
            const parsed = parsePath(options.output);

            if (parsed.ext !== '.zip') {
                throw new Error('Packager "output" must be a path to a zip file');
            }

            options.filename = parsed.base;
        } else if (options.filename && !/\.zip$/.test(options.filename)) {
            throw new Error('"filename" must be a zip file');
        }

        this.file = new FilePath(
            `${this.ephemeral.paths.lib}`,
            options.filename
        );

        // Initialize shell as silent
        shell.config.silent = !this.serverless.cli.isVerbose();
    }
}

module.exports = Packager;
