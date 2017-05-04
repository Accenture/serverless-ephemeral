/**
 * Downloads all the Ephemeral Python dependencies and appends the Serverless Lambda artifacts
 */
const BbPromise = require('bluebird');
const del = require('del');
const fs = require('fs');
const request = require('request');
const parse = require('url-parse');

const Util = {
    fs: null,
};

Util.fs = require('../util/fs');

module.exports = {
    /**
     * Checks if the libraries zip exists locally
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
     * @param {boolean} download - Whether to download the zip file
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
     * Unzips libraries to the package directory
     */
    unzipLibrariesToPackageDir (config) {
        return Util.fs.unzip(
            config.file.path,
            this.ephemeral.paths.pkg,
            this.serverless.cli.vlog,
            { before: `Extracting ${config.file.name} to ${this.ephemeral.paths.pkg}` }
        );
    },

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
                .then(this.downloadLibrariesZip.bind(this))
                .then(this.unzipLibrariesToPackageDir.bind(this));

            promises.push(promise);
        });

        return BbPromise.all(promises);
    },
};
