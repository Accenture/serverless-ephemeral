const parsePath = require('parse-filepath');

class FilePath {
    constructor (dir, filename = '') {
        this.dir = dir;
        this.filename = filename;
    }

    static fromPath (path) {
        const parsed = parsePath(path);
        return new FilePath(parsed.dir, parsed.base);
    }

    get path () {
        return this.dir + (this.filename ? `/${this.filename}` : '');
    }
}

module.exports = FilePath;
