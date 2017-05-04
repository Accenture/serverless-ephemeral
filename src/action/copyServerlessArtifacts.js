/**
 * Downloads all the Ephemeral Python dependencies and appends the Serverless Lambda artifacts
 */
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
            .then(this.unzipServerlessArtifactsToEphemeralPkgDir.bind(this));
    },
};
