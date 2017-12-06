const Packager = require('..');

class CustomPackager extends Packager {
    constructor (serverless, ephemeral, options = {}) {
        super(serverless, ephemeral, options);
    }
}

module.exports = CustomPackager;
