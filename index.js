/**
 * Serverles Plugin that adds stateless libraries to the Lambdas deployment package
 */

const BbPromise = require('bluebird');

const vlog = require('./src/util/cli').vlog;
const createDirectories = require('./src/action/createDirectories');
const copyServerlessArtifacts = require('./src/action/copyServerlessArtifacts');
const downloadLibraries = require('./src/action/downloadLibraries');
const packDependencies = require('./src/action/packDependencies');

const EPHEMERAL_DIR_NAME = '.ephemeral';

/**
 * ServerlessEphemeral plugin class
 */
class ServerlessEphemeral {
    /**
     * Constructor
     */
    constructor (serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.ephemeral = {
            config: serverless.service.custom.ephemeral,
            paths: {
                base: `${this.serverless.config.servicePath}/${EPHEMERAL_DIR_NAME}`,
                lib: `${this.serverless.config.servicePath}/${EPHEMERAL_DIR_NAME}/lib`,
                pkg: `${this.serverless.config.servicePath}/${EPHEMERAL_DIR_NAME}/pkg`,
            },
        };

        Object.assign(
            this,
            createDirectories,
            copyServerlessArtifacts,
            downloadLibraries,
            packDependencies // eslint-disable-line comma-dangle
        );

        // Extend the Serverless CLI
        this.serverless.cli.vlog = vlog.bind(this);

        /**
         * Hooks that fire before or after core Serverless lifecycle events
         */
        this.hooks = {
            'after:deploy:cleanup': () => BbPromise.bind(this)
                .then(this.createDirectories),

            'after:deploy:createDeploymentArtifacts': () => BbPromise.bind(this)
                .then(this.copyServerlessArtifacts)
                .then(this.downloadLibraries),

            'before:deploy:deploy': () => BbPromise.bind(this)
                .then(this.packDependencies),
        };
    }
}

module.exports = ServerlessEphemeral;
