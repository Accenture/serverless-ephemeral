
const fs = require('fs');
const parse = require('url-parse');
const request = require('request');

const Fetch = require('../Fetch');
const Library = require('../Library');

class Download extends Fetch {
    constructor (serverless, ephemeral, url) {
        super(serverless, ephemeral);

        this.url = url;
        this.file = new Library(
            `${this.ephemeral.paths.lib}`,
            `${parse(url).pathname.match(/([^/]+)(?=\.\w+$)/)[0]}.zip`
        );
    }

    fetch () {
        this.serverless.cli.log(`Downloading ${this.url}`);

        const req = request(this.url);

        return new Promise((resolve, reject) => {
            req.on('error', (error) => {
                this.serverless.cli.debug('Error downloading');
                reject(error);
            });

            const output = req.pipe(fs.createWriteStream(this.file.path));

            output.on('finish', () => {
                resolve();
            });

            output.on('error', (error) => {
                this.serverless.cli.debug('Error creating the zip file');
                reject(error);
            });
        });
    }
}

module.exports = Download;
