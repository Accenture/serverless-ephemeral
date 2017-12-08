const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fs = require('fs');

const Download = require('../../../src/lib/download');

const getRequestStub = () => {
    const streamStub = {
        pipe: sinon.stub(),
        on: sinon.stub(),
    };

    streamStub.pipe.callsFake(() => streamStub);
    streamStub.on.callsFake(() => streamStub);

    const requestStub = sinon.stub();
    requestStub.callsFake(() => streamStub);

    return { requestStub, streamStub };
};

const getServerless = () => ({
    cli: {
        log: sinon.stub(),
        debug: sinon.stub(),
    },
});

const getEphemeral = () => ({
    paths: {
        lib: '.ephemeral/lib',
    },
});

test.before(() => {
    sinon.stub(fs, 'createWriteStream').callsFake(() => 'Zip File');
});

test('Create a Download instance', (t) => {
    const download = new Download(getServerless(), getEphemeral(), 'https://www.domain.com/path/library.zip');
    t.is(download.url, 'https://www.domain.com/path/library.zip');
    t.is(download.file.path, '.ephemeral/lib/library.zip');
});

test('Downloads the specified file', (t) => {
    const { requestStub, streamStub } = getRequestStub();
    const DownloadProxy = proxyquire('../../../src/lib/download', {
        request: requestStub,
    });

    const download = new DownloadProxy(getServerless(), getEphemeral(), 'https://www.domain.com/path/library.zip');

    streamStub.on.withArgs('finish').yields();

    return download.fetch().then(() => {
        t.true(download.serverless.cli.log.calledWith('Downloading https://www.domain.com/path/library.zip'));
        t.true(requestStub.calledWith('https://www.domain.com/path/library.zip'));
        t.true(fs.createWriteStream.calledWith('.ephemeral/lib/library.zip'));
        t.true(streamStub.pipe.calledWith('Zip File'));
    });
});

test('Error making the download http request', async (t) => {
    const { requestStub, streamStub } = getRequestStub();
    const DownloadProxy = proxyquire('../../../src/lib/download', {
        request: requestStub,
    });

    const download = new DownloadProxy(getServerless(), getEphemeral(), 'https://www.domain.com/path/library.zip');

    streamStub.on.withArgs('error').onFirstCall().yields(new Error('Request error'));

    const error = await t.throws(download.fetch());

    t.true(download.serverless.cli.log.calledWith('Downloading https://www.domain.com/path/library.zip'));
    t.true(requestStub.calledWith('https://www.domain.com/path/library.zip'));
    t.true(download.serverless.cli.debug.calledWith('Error downloading'));
    t.is(error.message, 'Request error');
});

test('Error creating creating the downloaded zip file', async (t) => {
    const { requestStub, streamStub } = getRequestStub();
    const DownloadProxy = proxyquire('../../../src/lib/download', {
        request: requestStub,
    });

    const download = new DownloadProxy(getServerless(), getEphemeral(), 'https://www.domain.com/path/library.zip');

    streamStub.on.withArgs('error').onSecondCall().yields(new Error('Write error'));

    const error = await t.throws(download.fetch());

    t.true(download.serverless.cli.log.calledWith('Downloading https://www.domain.com/path/library.zip'));
    t.true(requestStub.calledWith('https://www.domain.com/path/library.zip'));
    t.true(fs.createWriteStream.calledWith('.ephemeral/lib/library.zip'));
    t.true(download.serverless.cli.debug.calledWith('Error creating the zip file'));
    t.true(streamStub.pipe.calledWith('Zip File'));
    t.is(error.message, 'Write error');
});

test.after(() => {
    fs.createWriteStream.restore();
});
