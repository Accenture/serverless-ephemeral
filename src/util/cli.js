module.exports = {
    /**
     * Serverless CLI logging that displays a message only when the --verbose option is true.
     * This function must be bound to the Serverless context.
     * @param  {String} message [description]
     * @return {[type]}         [description]
     */
    vlog (message) {
        if (this.serverless.processedInput.options.verbose) {
            this.serverless.cli.log(message);
        }
    },
};
