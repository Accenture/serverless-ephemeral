/**
 * Creates the .ephemeral directory and subdirectories
 */
const BbPromise = require('bluebird');
const del = require('del');

const Util = {
    fs: null,
};

Util.fs = require('../util/fs');

module.exports = {
    /**
     * Checks if the Ephemeral directory exists
     * @returns Promise
     */
    checkEphemeralDirExists () {
        return new BbPromise((resolve, reject) => {
            Util.fs.onPathExists(this.ephemeral.paths.base,
                () => {
                    // nothing is done if it exists
                    resolve(false);
                },
                () => {
                    // create if doesn't exist
                    resolve(true);
                },
                (accessError) => {
                    this.serverless.cli.log(`Error reading path ${this.ephemeral.paths.base}`);
                    reject(accessError);
                }
            );
        });
    },

    /**
     * Creates the Ephemeral directory
     * @param {boolean} create - Whether to create the directory
     * @returns Promise
     */
    createEphemeralDir (create = false) {
        if (!create) {
            return BbPromise.resolve();
        }

        this.serverless.cli.vlog(`Creating directory ${this.ephemeral.paths.base}`);
        return Util.fs.promises.mkdir(this.ephemeral.paths.base);
    },

    /**
     * Creates Ephemeral files package directory
     * @returns Promise
     */
    createEphemeralPkgDir () {
        this.serverless.cli.vlog(`Creating directory ${this.ephemeral.paths.pkg}`);
        return Util.fs.promises.mkdir(this.ephemeral.paths.pkg);
    },

    /**
     * Checks if the libraries directory exists
     * @returns Promise
     */
    checkLibrariesDirExists () {
        return new BbPromise((resolve, reject) => {
            Util.fs.onPathExists(this.ephemeral.paths.lib,
                () => {
                    // nothing is done if it exists
                    resolve(false);
                },
                () => {
                    // create if doesn't exist
                    resolve(true);
                },
                (accessError) => {
                    this.serverless.cli.log(`Error reading path ${this.ephemeral.paths.lib}`);
                    reject(accessError);
                }
            );
        });
    },

    /**
     * Creates the libraries directory
     * @param {boolean} create - Whether to create the directory
     * @returns Promise
     */
    createLibrariesDir (create = false) {
        if (!create) {
            return BbPromise.resolve();
        }

        this.serverless.cli.vlog(`Creating directory ${this.ephemeral.paths.lib}`);
        return Util.fs.promises.mkdir(this.ephemeral.paths.lib);
    },

    createDirectories () {
        return this.checkEphemeralDirExists()
            .then(this.createEphemeralDir.bind(this))
            .then(() => del(this.ephemeral.paths.pkg))
            .then(this.createEphemeralPkgDir.bind(this))
            .then(this.checkLibrariesDirExists.bind(this))
            .then(this.createLibrariesDir.bind(this));
    },
};
