const parsePath = require('parse-filepath');

class FilePath {
    constructor (dir, filename = '') {
        this.dir = dir;
        this.filename = filename;
    }

    static fromPath (path) {
        const noFile = path.charAt(path.length - 1) === '/' || !/([^/]+)(?=\.\w+$)/g.test(path);
        const parsed = parsePath(path);
        const dir = (parsed.dir || '.') + (noFile ? `/${parsed.base}` : '');
        const filename = noFile ? '' : parsed.base;

        return new FilePath(dir, filename);
    }

    get path () {
        return this.dir + (this.filename ? `/${this.filename}` : '');
    }

    toString () {
        return this.path;
    }
}

module.exports = FilePath;
