const path = require('path');
const shell = require('shelljs');
const { rtrim } = require('underscore.string');

const Packager = require('../index');
const dockerCompose = require('../../../util/docker-compose');

class TensorFlow extends Packager {
    constructor (serverless, ephemeral, options = {}) {
        if (!options.version) {
            throw new Error('TensorFlow "version" was not provided');
        }

        options.filename = `${options.name}-${options.version}.zip`;
        super(serverless, ephemeral, options);

        this.version = options.version;
    }

    fetch () {
        this.serverless.cli.log(`Building TensorFlow v${this.version}`);

        shell.pushd(path.resolve(__dirname, `../../packager/${this.name}`));

        const container = 'packager';
        const dir = '/tmp/tensorflow';
        const volume =
            `${rtrim(this.serverless.config.servicePath, '/')}/${this.ephemeral.paths.lib}:${dir}`;
        const environment = {
            version: this.version,
            output: `${dir}/${this.file.filename}`,
        };

        return dockerCompose.build()
            .then(dockerCompose.run.bind(null, container, { volume, environment }))
            .then(dockerCompose.rm.bind(null, container))
            .then(() => {
                shell.popd();
            });
    }
}

module.exports = TensorFlow;
