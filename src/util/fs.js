const BbPromise = require('bluebird');
const crypto = require('crypto');
const fs = require('fs');
const unzip = require('unzip');

module.exports = {
    /**
     * Collection of promisified Node fs functions
     */
    promises: {
        access: BbPromise.promisify(fs.access),
        mkdir: BbPromise.promisify(fs.mkdir),
    },

    /**
     * Utility that helps executing code whenever a path/file
     * exists, does not exist, or there is an error
     * @param {string} path - The path to the file or folder
     * @param {function} cbExists - A callback to execute when the path exists
     * @param {function} [cbNotExists] - A callback to execute when the path does not exist
     * @param {function} [cbError] - A callback to execute when there is an error
     */
    onPathExists (path, cbExists, cbNotExists = () => {}, cbError = () => {}) {
        fs.access(path, (accessError) => {
            if (accessError) {
                if (accessError.code === 'ENOENT') {
                    cbNotExists(accessError);
                } else {
                    cbError(accessError);
                }
            } else {
                cbExists();
            }
        });
    },

    /**
     * Unzips a file to a specified destination
     * @param  {string} zipFile - Path tot the zip file
     * @param  {string} destination - Path to the destination folder
     * @param  {Object} [logger] - Optional logger to output messages
     * @param  {Object} [messages] - Optional messages to be logged
     */
    unzip (zipFile, destination, logger = null, messages = {
        before: `Extracting to ${destination}`,
        success: `Successfully unzipped to ${destination}`,
        fail: 'Error unzipping',
    }) {
        return new BbPromise((resolve, reject) => {
            if (logger && messages.before) {
                logger(messages.before);
            }

            fs.createReadStream(zipFile)
                .pipe(unzip.Extract({ path: destination }))
                .on('close', () => {
                    if (logger && messages.success) {
                        logger(messages.success);
                    }

                    resolve();
                })
                .on('error', (error) => {
                    if (logger && messages.fail) {
                        logger(messages.fail);
                    }

                    reject(error);
                });
        });
    },

    /**
     * Calculates a SHA256 hash of a given file
     * @param  {string} filePath - Path to the file
     * @return {string}
     */
    calculateFileHash (filePath) {
        const content = fs.readFileSync(filePath);

        const hash = crypto.createHash('sha256');
        hash.setEncoding('base64');
        hash.write(content);
        hash.end();

        return hash.read();
    },
};
