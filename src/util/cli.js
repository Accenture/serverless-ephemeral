module.exports = {
    /**
     * Serverless CLI logging is verbose or not
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
     * @param   {String} message - Message to log
     */
    vlog (message) {
        if (this.serverless.cli.isVerbose()) {
            this.serverless.cli.log(message);
        }
    },
};
