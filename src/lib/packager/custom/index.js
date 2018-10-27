const shell = require('shelljs');
const { rtrim } = require('underscore.string');

const Packager = require('../index');
const FilePath = require('../../../util/FilePath');
const dockerCompose = require('../../../util/docker-compose');

const validateOption = (options, option) => {
    if (!options[option]) {
        throw new Error(`The option "${option}" was not provided`);
    }
};

class CustomPackager extends Packager {
    constructor (serverless, ephemeral, options = {}) {
        options.name = options.name || '__custom';

        super(serverless, ephemeral, options);

        validateOption(options, 'compose');
        validateOption(options, 'service');
        validateOption(options, 'output');

        this.compose = FilePath.fromPath(options.compose);
        this.service = options.service;
        this.output = FilePath.fromPath(options.output);
    }

    fetch () {
        this.serverless.cli.log('Building custom package');

        shell.pushd(this.compose.dir);

        const volume =
            `${rtrim(this.serverless.config.servicePath, '/')}/${this.ephemeral.paths.lib}:${this.output.dir}`;

        const environment = {
            output: `${this.output}`,
        };

        return dockerCompose.build()
            .then(dockerCompose.run.bind(null, this.service, { volume, environment }))
            .then(dockerCompose.rm.bind(null, this.service))
            .then(() => {
                shell.popd();
            });
    }
}

module.exports = CustomPackager;
