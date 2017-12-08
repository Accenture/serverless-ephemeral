module.exports = {
    /**
     * Serverless CLI logging that displays a message only when the --verbose option is true.
     * This function must be bound to the Serverless context.
     * @returns {boolean}
     */
    isVerbose () {
        const options = this.serverless.processedInput.options;
        return (options.v || options.verbose);
    },

    /**
     * Serverless CLI logging that displays a message only when the --verbose option is true.
     * This function must be bound to the Serverless context.
     * @param {String} message - Message to log
     */
    vlog (message) {
        if (this.serverless.cli.isVerbose()) {
            this.serverless.cli.log(message);
        }
    },

    /**
     * Outputs a Serverless CLI message only when SLS_DEBUG env var is set to true.
     * This function must be bound to the Serverless context.
     * @param {String} message - Debugging message
     */
    debug (message) {
        if (process.env.SLS_DEBUG) {
            this.serverless.cli.log(message);
        }
    },
};
