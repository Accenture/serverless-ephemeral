/**
 * Downloads all the Ephemeral Python dependencies and appends the Serverless Lambda artifacts
 */
const BbPromise = require('bluebird');
const fs = require('fs');

const Util = {
    fs: null,
};

Util.fs = require('../util/fs');

module.exports = {
    /**
     * Checks if the Serverless artifact with Lambda functions was created
     * @returns Promise
     */
    checkServerlessArtifactExists () {
        return Util.fs.promises.access(this.serverless.service.package.artifact, fs.constants.R_OK);
    },

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
     * Unzips the Serverless artifacts into the Ephemeral package directory
     */
    unzipServerlessArtifactsToEphemeralPkgDir () {
        return Util.fs.unzip(
            this.serverless.service.package.artifact,
            this.ephemeral.paths.pkg,
            this.serverless.cli.vlog,
            { before: `Extracting Serverless artifacts to ${this.ephemeral.paths.pkg}` }
        );
    },

    copyServerlessArtifacts () {
        return this.checkServerlessArtifactExists()
            .then(this.checkEphemeralDirExists.bind(this))
            .then(this.createEphemeralDir.bind(this))
            .then(this.createEphemeralPkgDir.bind(this))
            .then(this.unzipServerlessArtifactsToEphemeralPkgDir.bind(this));
    },
};
