/**
 * Serverles Plugin that adds stateless libraries to the Lambdas deployment package
 */

const BbPromise = require('bluebird');

const createDirectories = require('./src/action/createDirectories');
const copyServerlessArtifacts = require('./src/action/copyServerlessArtifacts');
const fetchLibraries = require('./src/action/fetchLibraries');
const packDependencies = require('./src/action/packDependencies');
const addLocalLdLibraryPath = require('./src/action/addLocalLdLibraryPath');
const { isVerbose, vlog, debug } = require('./src/util/cli');

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
            addLocalLdLibraryPath,
            packDependencies // eslint-disable-line comma-dangle
        );

        // Extend the Serverless CLI
        this.serverless.cli.isVerbose = isVerbose.bind(this);
        this.serverless.cli.vlog = vlog.bind(this);
        this.serverless.cli.debug = debug.bind(this);

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

            'before:invoke:local:invoke': () => BbPromise.bind(this)
                .then(this.addLocalLdLibraryPath),

        };
    }
}

module.exports = ServerlessEphemeral;
