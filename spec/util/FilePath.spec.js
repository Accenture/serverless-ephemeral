const test = require('ava');
const FilePath = require('../../src/util/FilePath');

test('Create a FilePath instance', (t) => {
    const library = new FilePath('path/to', 'file.zip');
    t.is(library.dir, 'path/to');
    t.is(library.filename, 'file.zip');
});

test('Create a FilePath instance with no filename', (t) => {
    const library = new FilePath('path/to');
    t.is(library.dir, 'path/to');
    t.is(library.filename, '');
});

test('Getting the full path', (t) => {
    const library = new FilePath('path/to', 'file.zip');
    t.is(library.path, 'path/to/file.zip');
});

test('Getting the full path with no filename', (t) => {
    const library = new FilePath('path/to');
    t.is(library.path, 'path/to');
});

test('Create an instance from a given path', (t) => {
    const library = FilePath.fromPath('library/docker-compose.yml');
    t.is(library.dir, 'library');
    t.is(library.filename, 'docker-compose.yml');
    t.is(library.path, 'library/docker-compose.yml');
});

test('Create an instance from a given directory', (t) => {
    const library = FilePath.fromPath('library/images');
    t.is(library.dir, 'library/images');
    t.is(library.filename, '');
    t.is(library.path, 'library/images');
});

test('Create an instance from a given directory with leading slash', (t) => {
    const library = FilePath.fromPath('library/images/');
    t.is(library.dir, 'library/images');
    t.is(library.filename, '');
    t.is(library.path, 'library/images');
});

test('Create an instance from a given file name', (t) => {
    const library = FilePath.fromPath('docker-compose.yml');
    t.is(library.dir, '.');
    t.is(library.filename, 'docker-compose.yml');
    t.is(library.path, './docker-compose.yml');
});
