/**
 * Downloads all the Ephemeral Python dependencies and appends the Serverless Lambda artifacts
 */
const BbPromise = require('bluebird');
const shell = require('shelljs');
const del = require('del');
const fs = require('fs');
const { trim } = require('underscore.string');

const PackagerFactory = require('../lib/packager/Factory');
const Download = require('../lib/download');

const Util = { fs: null };
Util.fs = require('../util/fs');

// Initialize shell as silent
shell.config.silent = true;

module.exports = {
    /**
     * Checks if the libraries zip exists locally
     * @param {Object} libHandler - library handler
     * @returns Promise
     */
    checkForLocalLibrary (libHandler) {
        if (!libHandler.useCached) {
            del.sync(libHandler.file.path);
            return BbPromise.resolve(libHandler);
        }

        try {
            if (Util.fs.onPathExists(libHandler.file.path)) {
                this.serverless.cli.vlog(`Using local copy of ${libHandler.file.filename}`);
            } else {
                libHandler.useCached = false;
            }

            return BbPromise.resolve(libHandler);
        } catch (err) {
            this.serverless.cli.debug(`Unexpected error checking for library ${libHandler.file.filename}`);
            return BbPromise.reject(err);
        }
    },

    /**
     * Creates a custom directory inside package dir if specified by user
     * @param {Object} libHandler - library handler
     * @returns Promise
     */
    createCustomDirectory (libHandler) {
        // create directory if it doesn't exist
        try {
            fs.mkdirSync(libHandler.unzipped.path);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                this.serverless.cli.debug(`Unexpected error creating directory ${libHandler.unzipped.path}`);
                return BbPromise.reject(error);
            }
        }

        return BbPromise.resolve(libHandler);
    },

    /**
     * Decides whether to download or fetch a package definition and build
     * @param {Object} libHandler - library handler
     * @returns Promise
     */
    fetchLibrary (libHandler) {
        if (libHandler.useCached) {
            return BbPromise.resolve(libHandler);
        }

        return libHandler.fetch()
            .then(() => libHandler);
    },

    /**
     * Builds the library via a custom packager
     * @param {Object} config - library configuration
     * @returns Promise
     */
    /* eslint-disable max-len */
    // buildViaCustomPackager (config) {
    //     return new Promise((resolve, reject) => {
    //         let composePath = config.build.path.substring(0, config.build.path.lastIndexOf('/')) || '.';
    //         composePath = path.resolve(`./${composePath.replace(/^\.\//, '')}`);

    //         shell.pushd(composePath);
    //         const build = shell.exec('docker-compose build', { async: true });
    //         build.on('error', err => reject(err));
    //         build.on('close', () => {
    //             const outputDir = () => {
    //                 const tokens = config.build.output.split('/');
    //                 tokens.pop();
    //                 return tokens.join('/');
    //             };

    //             const volume = `${this.serverless.config.servicePath}/${this.ephemeral.paths.lib}:${outputDir}`;
    //             const command = `docker run -v ${volume} ${config.build.container}`;
    //             const run = shell.exec(command, { async: true });
    //             run.on('error', err => reject(err));
    //             run.on('close', () => {
    //                 shell.popd();
    //                 resolve(config);
    //             });
    //         });
    //     });
    // },
    /* eslint-enable max-len */

    /**
     * Unzips libraries to the package directory
     * @param {Object} libHandler - library handler
     * @returns Promise
     */
    unzipLibraryToPackageDir (libHandler) {
        return Util.fs.unzip(
            libHandler.file.path,
            libHandler.unzipped.path,
            this.serverless.cli.vlog,
            { before: `Extracting ${libHandler.file.filename} to ${libHandler.unzipped.path}` }
        );
    },

    validateConfig (libConfig) {
        if (libConfig.forceDownload) {
            this.serverless.cli.log('"forceDownload" is deprecated. Please use "nocache" instead');
            libConfig.nocache = libConfig.forceDownload;
        }

        if (libConfig.build) {
            this.serverless.cli.log('"build" is deprecated. Please use "packager" instead');
            libConfig.packager = libConfig.build;
        }

        if (libConfig.directory) {
            libConfig.directory = trim(libConfig.directory, '/');

            if (!/^[A-Za-z0-9._-]+$/.test(libConfig.directory)) {
                throw new Error('"directory" can only include alphanumeric characters and symbols -_.');
            }
        }

        return libConfig;
    },

    createLibHandlers () {
        return this.ephemeral.config.libraries.map((libConfig) => {
            let handler;
            libConfig = this.validateConfig(libConfig);

            if (libConfig.packager) {
                handler = PackagerFactory.build(
                    this.serverless, this.ephemeral, libConfig.packager);
            } else if (libConfig.url) {
                handler = new Download(this.serverless, this.ephemeral, libConfig.url);
            } else {
                throw new Error('Invalid Serverless Ephemeral configuration');
            }

            handler.useCached = !libConfig.nocache;
            handler.addDirectory(libConfig.directory);

            return handler;
        });
    },

    fetchLibraries () {
        const promises = [];
        let handlers;

        try {
            handlers = this.createLibHandlers();
        } catch (err) {
            return BbPromise.reject(err);
        }

        handlers.forEach((handler) => {
            const promise = this.checkForLocalLibrary(handler)
                .then(this.createCustomDirectory.bind(this))
                .then(this.fetchLibrary.bind(this))
                .then(this.unzipLibraryToPackageDir.bind(this));

            promises.push(promise);
        });

        return BbPromise.all(promises);
    },
};
