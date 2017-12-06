const TensorFlow = require('./tensorflow');
const CustomPackager = require('./custom');

class PackagerFactory {
    /**
     * Picks a packager depending on the options provided.
     * @param {Object} serverless - Serverless object
     * @param {Object} ephemeral - Ephemeral object
     * @param {Object} [options]
     * @param {string} [options.name] - The packager name
     * @return {Object} The packager class
     */
    static build (serverless, ephemeral, options = {}) {
        options.name = options.name || '';

        switch (options.name) {
            case 'tensorflow':
                return new TensorFlow(serverless, ephemeral, options);
            default:
                return new CustomPackager(serverless, ephemeral, options);
        }
    }
}

module.exports = PackagerFactory;
