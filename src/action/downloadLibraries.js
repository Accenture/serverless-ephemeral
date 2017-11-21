/**
 * Downloads all the Ephemeral Python dependencies and appends the Serverless Lambda artifacts
 */
const BbPromise = require('bluebird');
const del = require('del');
const fs = require('fs');
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
     * Downloads the external libraries zip
     * @param {Object} config - package configuration
     * @returns Promise
     */
    downloadLibrariesZip (config) {
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
     * Unzips libraries to the package directory
     * @param {Object} config - package configuration
     * @returns Promise
     */
    unzipLibrariesToPackageDir (config) {
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
        const name = parse(libConfig.url).pathname
            .split('/')
            .filter(token => token.indexOf('.zip') !== -1)[0];

        const path = `${this.ephemeral.paths.lib}/${name}`;

        libConfig = Object.assign({}, libConfig, {
            file: { name, path },
        });

        return libConfig;
    },

    downloadLibraries () {
        const libs = this.ephemeral.config.libraries;
        const promises = [];

        libs.forEach((libConfig) => {
            const promise = this.checkForLibrariesZip(this.prepareLibConfig(libConfig))
                .then(this.createCustomDirectory.bind(this))
                .then(this.downloadLibrariesZip.bind(this))
                .then(this.unzipLibrariesToPackageDir.bind(this));

            promises.push(promise);
        });

        return BbPromise.all(promises);
    },
};
