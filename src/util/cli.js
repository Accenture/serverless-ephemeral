module.exports = {
    /**
     * Serverless CLI logging that displays a message only when the --verbose option is true.
     * This function must be bound to the Serverless context.
     * @param  {String} message [description]
     * @return {[type]}         [description]
     */
    vlog (message) {
        const options = this.serverless.processedInput.options;

        if (options.v || options.verbose) {
            this.serverless.cli.log(message);
        }
    },
};
