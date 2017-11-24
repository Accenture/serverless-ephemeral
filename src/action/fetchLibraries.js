/**
 * Downloads all the Ephemeral Python dependencies and appends the Serverless Lambda artifacts
 */
const BbPromise = require('bluebird');
const shell = require('shelljs');

const del = require('del');
const fs = require('fs');
const path = require('path');
const request = require('request');
const parse = require('url-parse');
const { rtrim } = require('underscore.string');

const Util = {
    fs: null,
};

Util.fs = require('../util/fs');

module.exports = {
    /**
     * Checks if the libraries zip exists locally
     * @param {Object} config - package configuration
     * @returns Promise
     */
    checkForLibrariesZip (config) {
        if (config.forceDownload) {
            del.sync(config.file.path);

            config.download = true;
            return BbPromise.resolve(config);
        }

        return new BbPromise((resolve, reject) => {
            Util.fs.onPathExists(config.file.path,
                () => {
                    // if dependencies exist, do not download
                    config.download = false;
                    this.serverless.cli.vlog(`Using local copy of ${config.file.name}`);
                    resolve(config);
                },
                () => {
                    // if dependencies do not exist, download
                    config.download = true;
                    resolve(config);
                },
                (accessError) => {
                    this.serverless.cli.log(`Error checking for library ${config.file.name}`);
                    reject(accessError);
                }
            );
        });
    },

    /**
     * Creates a custom directory inside package dir if specified by user
     * @param {Object} config - package configuration
     * @returns Promise
     */
    createCustomDirectory (config) {
        config.destinationPath = this.ephemeral.paths.pkg;

        let dir = config.directory || '';
        dir = dir.trim();

        // validate entered directory
        if (dir.length) {
            if (!/^[A-Za-z0-9._-]+$/.test(dir)) {
                return Promise.reject('Directory name can only include alphanumeric characters and symbols -_.');
            }

            dir = `/${rtrim(dir, '/')}`;
        }

        // append directory to path
        config.destinationPath += dir;

        // create directory if it doesn't exist
        try {
            fs.mkdirSync(config.destinationPath);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                return Promise.reject(`Unexpected error creating directory ${config.destinationPath}`);
            }
        }

        return Promise.resolve(config);
    },

    /**
     * Decides whether to download or fetch a package definition and build
     * @param {Object} config - package configuration
     * @returns Promise
     */
    fetchLibrary (config) {
        if (config.build === true) {
            return this.buildLibraryZip(config);
        }

        return this.downloadLibraryZip(config);
    },

    /**
     * Builds the library zip
     * @param {Object} config - package configuration
     * @returns Promise
     */
    buildLibraryZip (config) {
        if (!shell.which('docker') || !shell.which('docker-compose')) {
            return Promise.reject(new Error('Docker not found on host machine. Please install to proceed.'));
        }

        return new Promise((resolve, reject) => {
            shell.pushd(path.resolve(__dirname, '../../packager/tensorflow'));
            const build = shell.exec('docker-compose build', { async: true });
            build.on('error', error => reject(error));
            build.on('close', () => {
                const volume = `${this.serverless.config.servicePath}/${this.ephemeral.paths.lib}:/tmp/tensorflow`;
                const run = shell.exec(`docker run -v ${volume} -e "SOURCE=${config.url}" acn/lambdatensorflow`, { async: true });
                run.on('error', error => reject(error));
                run.on('close', () => {
                    shell.popd();
                    resolve(config);
                });
            });
        });
    },

    /**
     * Downloads the external libraries zip
     * @param {Object} config - package configuration
     * @returns Promise
     */
    downloadLibraryZip (config) {
        if (!config.download) {
            return BbPromise.resolve(config);
        }

        return new BbPromise((resolve, reject) => {
            this.serverless.cli.vlog(`Downloading ${config.url}`);

            const req = request(config.url);

            req.on('error', (error) => {
                this.serverless.cli.log('Error downloading');
                reject(error);
            });

            const output = req.pipe(fs.createWriteStream(config.file.path));

            output.on('finish', () => {
                resolve(config);
            });

            output.on('error', (error) => {
                this.serverless.cli.log('Error creating zip file');
                reject(error);
            });
        });
    },

    /**
     * Unzips libraries to the package directory
     * @param {Object} config - package configuration
     * @returns Promise
     */
    unzipLibraryToPackageDir (config) {
        return Util.fs.unzip(
            config.file.path,
            config.destinationPath,
            this.serverless.cli.vlog,
            { before: `Extracting ${config.file.name} to ${config.destinationPath}` }
        );
    },

    /**
     * Pulls the path and zip file name for better usability
     * @param {Object} config - package configuration
     * @returns Promise
     */
    prepareLibConfig (libConfig) {
        const name = `${parse(libConfig.url).pathname.match(/([^/]+)(?=\.\w+$)/)[0]}.zip`;
        const filePath = `${this.ephemeral.paths.lib}/${name}`;

        libConfig = Object.assign({}, libConfig, {
            file: { name, path: filePath },
        });

        return libConfig;
    },

    fetchLibraries () {
        const libs = this.ephemeral.config.libraries;
        const promises = [];

        libs.forEach((libConfig) => {
            const promise = this.checkForLibrariesZip(this.prepareLibConfig(libConfig))
                .then(this.createCustomDirectory.bind(this))
                .then(this.fetchLibrary.bind(this))
                .then(this.unzipLibraryToPackageDir.bind(this));

            promises.push(promise);
        });

        return BbPromise.all(promises);
    },
};
