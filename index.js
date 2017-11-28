/**
 * Serverles Plugin that adds stateless libraries to the Lambdas deployment package
 */

const BbPromise = require('bluebird');

const vlog = require('./src/util/cli').vlog;
const createDirectories = require('./src/action/createDirectories');
const copyServerlessArtifacts = require('./src/action/copyServerlessArtifacts');
const fetchLibraries = require('./src/action/fetchLibraries');
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
                base: `${EPHEMERAL_DIR_NAME}`,
                lib: `${EPHEMERAL_DIR_NAME}/lib`,
                pkg: `${EPHEMERAL_DIR_NAME}/pkg`,
            },
        };

        Object.assign(
            this,
            createDirectories,
            copyServerlessArtifacts,
            fetchLibraries,
            packDependencies // eslint-disable-line comma-dangle
        );

        // Extend the Serverless CLI
        this.serverless.cli.vlog = vlog.bind(this);

        /**
         * Hooks that fire before or after core Serverless lifecycle events
         */
        this.hooks = {
            'after:package:cleanup': () => BbPromise.bind(this)
                .then(this.createDirectories),

            'after:package:createDeploymentArtifacts': () => BbPromise.bind(this)
                .then(this.copyServerlessArtifacts)
                .then(this.fetchLibraries),

            'before:package:finalize': () => BbPromise.bind(this)
                .then(this.packDependencies),
        };
    }
}

module.exports = ServerlessEphemeral;
