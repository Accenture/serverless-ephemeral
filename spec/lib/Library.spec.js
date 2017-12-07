const test = require('ava');
const Library = require('../../src/lib/Library');

test('Create a Library instance', (t) => {
    const library = new Library('path/to', 'file.zip');
    t.is(library.dir, 'path/to');
    t.is(library.filename, 'file.zip');
});

test('Create a Library instance with no filename', (t) => {
    const library = new Library('path/to');
    t.is(library.dir, 'path/to');
    t.is(library.filename, '');
});

test('Getting the full path', (t) => {
    const library = new Library('path/to', 'file.zip');
    t.is(library.path, 'path/to/file.zip');
});

test('Getting the full path with no filename', (t) => {
    const library = new Library('path/to');
    t.is(library.path, 'path/to');
});
