class Library {
    constructor (dir, filename = '') {
        this.dir = dir;
        this.filename = filename;
    }

    get path () {
        return this.dir + (this.filename ? `/${this.filename}` : '');
    }
}

module.exports = Library;
