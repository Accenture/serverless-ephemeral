/**
 * Cleans up the libraries directory
 */
const BbPromise = require('bluebird');
const del = require('del');

const Util = {
    fs: null,
};

Util.fs = require('../util/fs');

module.exports = {
    cleanUpDependencies () {
        return new BbPromise((resolve, reject) => {
            Util.fs.onPathExists(this.ephemeral.paths.pkg,
                () => {
                    // delete if exists
                    this.serverless.cli.vlog(`Deleting ${this.ephemeral.paths.pkg}`);
                    del.sync(this.ephemeral.paths.pkg);
                    resolve();
                },
                () => {
                    // nothing to do if it doesn't exist
                    resolve();
                },
                (accessError) => {
                    this.serverless.cli.log(`Error accessing ${this.ephemeral.paths.pkg}`);
                    reject(accessError);
                }
            );
        });
    },
};
