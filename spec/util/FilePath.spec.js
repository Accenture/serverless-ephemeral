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
