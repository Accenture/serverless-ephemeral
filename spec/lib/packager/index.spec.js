const test = require('ava');
const sinon = require('sinon');
const shell = require('shelljs');

const Packager = require('../../../src/lib/packager');

const getServerless = () => ({
    cli: {
        isVerbose: sinon.stub(),
    },
});

const getEphemeral = () => ({
    paths: {
        lib: '.ephemeral/lib',
    },
});

test('Creates a Packager instance with an output path', (t) => {
    const serverless = getServerless();

    serverless.cli.isVerbose.callsFake(() => false);

    const packager = new Packager(serverless, getEphemeral(), {
        name: 'packager-name',
        output: '/tmp/foo/library.zip',
    });

    t.is(packager.name, 'packager-name');
    t.is(packager.file.path, '.ephemeral/lib/library.zip');
    t.true(shell.config.silent);
});

test('Creates a Packager instance with a given filename', (t) => {
    const serverless = getServerless();

    serverless.cli.isVerbose.callsFake(() => false);

    const packager = new Packager(serverless, getEphemeral(), {
        name: 'packager-name',
        filename: 'library.zip',
    });

    t.is(packager.name, 'packager-name');
    t.is(packager.file.path, '.ephemeral/lib/library.zip');
    t.true(shell.config.silent);
});

test('Throws an error if there is no packager name provided', (t) => {
    const error = t.throws(() => new Packager(getServerless(), getEphemeral()));
    t.is(error.message, 'No packager "name" was defined');
});

test('Throws an error if the output path is not a zip file', (t) => {
    const error = t.throws(() => new Packager(getServerless(), getEphemeral(), {
        name: 'packager-name',
        output: '/tmp/foo/library.rar',
    }));
    t.is(error.message, 'Packager "output" must be a path to a zip file');
});

test('Throws an error if the filename is not a zip file', (t) => {
    const error = t.throws(() => new Packager(getServerless(), getEphemeral(), {
        name: 'packager-name',
        filename: 'library.tar.gz',
    }));
    t.is(error.message, '"filename" must be a zip file');
});
