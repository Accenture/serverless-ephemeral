const test = require('ava');
const sinon = require('sinon');

const crypto = require('crypto');
const fs = require('fs');
const unzip = require('unzip-stream');

const util = require('../../src/util/fs');

test('A callback function is executed when the path exists', (t) => {
    sinon.stub(fs, 'access');
    const cbExistsStub = sinon.stub();
    const cbNotExistsStub = sinon.stub();
    const cbErrorStub = sinon.stub();

    fs.access.callsArgWith(1, undefined);

    util.onPathExists('/test/path', cbExistsStub, cbNotExistsStub, cbErrorStub);

    t.true(fs.access.calledWith('/test/path', sinon.match.typeOf('function')));
    t.true(cbExistsStub.calledOnce);

    // ensure other callbacks are not called
    t.false(cbNotExistsStub.called);
    t.false(cbErrorStub.called);

    fs.access.restore();
});

test('A callback function is executed when the path does not exist', (t) => {
    sinon.stub(fs, 'access');

    const accessError = { code: 'ENOENT' };

    const cbExistsStub = sinon.stub();
    const cbNotExistsStub = sinon.stub();
    const cbErrorStub = sinon.stub();

    fs.access.callsArgWith(1, accessError);

    util.onPathExists('/test/path', cbExistsStub, cbNotExistsStub, cbErrorStub);

    t.true(fs.access.calledWith('/test/path', sinon.match.typeOf('function')));
    t.true(cbNotExistsStub.calledWith(accessError));

    // ensure other callbacks are not called
    t.false(cbExistsStub.called);
    t.false(cbErrorStub.called);

    fs.access.restore();
});

test('A callback function is executed when an unexpected error happens', (t) => {
    sinon.stub(fs, 'access');

    const accessError = { code: 'UNEXPECTED' };

    const cbExistsStub = sinon.stub();
    const cbNotExistsStub = sinon.stub();
    const cbErrorStub = sinon.stub();

    fs.access.callsArgWith(1, accessError);

    util.onPathExists('/test/path', cbExistsStub, cbNotExistsStub, cbErrorStub);

    t.true(fs.access.calledWith('/test/path', sinon.match.typeOf('function')));
    t.true(cbErrorStub.calledWith(accessError));

    // ensure other callbacks are not called
    t.false(cbExistsStub.called);
    t.false(cbNotExistsStub.called);

    fs.access.restore();
});

test.serial('Unzips a file to a specified directory', (t) => {
    // setup
    const streamStub = {
        pipe: sinon.stub(),
        on: sinon.stub(),
    };

    // stubbed to mimic FS Stream functions returning an FS Stream
    streamStub.pipe.returns(streamStub);
    streamStub.on.returns(streamStub);
    streamStub.on.withArgs('close').yields();

    sinon.stub(fs, 'createReadStream');
    fs.createReadStream.returns(streamStub);

    sinon.stub(unzip, 'Extract').callsFake(() => 'Unzipped files');

    const loggerStub = sinon.stub();
    const messages = { before: 'Before', success: 'Success' };

    // call tested code
    return util.unzip('/path/file.zip', '/destination', loggerStub, messages).then(() => {
        // tests
        t.true(fs.createReadStream.calledWith('/path/file.zip'));
        t.true(streamStub.pipe.calledWith('Unzipped files'));
        t.true(unzip.Extract.calledWith({ path: '/destination' }));
        t.true(streamStub.on.getCall(0).calledWith('close', sinon.match.func));
        t.is(loggerStub.getCall(0).args[0], messages.before);
        t.is(loggerStub.getCall(1).args[0], messages.success);

        // tear down
        fs.createReadStream.restore();
        unzip.Extract.restore();
    });
});

test.serial('Error unzipping a file to a specified directory', (t) => {
    // setup
    const streamStub = {
        pipe: sinon.stub(),
        on: sinon.stub(),
    };

    // stubbed to mimic FS Stream functions returning an FS Stream
    streamStub.pipe.returns(streamStub);
    streamStub.on.returns(streamStub);
    streamStub.on.withArgs('error').yields('Unzip error');

    sinon.stub(fs, 'createReadStream');
    fs.createReadStream.returns(streamStub);

    sinon.stub(unzip, 'Extract').callsFake(() => 'Unzipped assets');

    const loggerStub = sinon.stub();
    const messages = { fail: 'Fail' };

    // call tested code
    return util.unzip('/path/file.zip', '/destination', loggerStub, messages).catch((error) => {
        // tests
        t.is(error, 'Unzip error');
        t.true(fs.createReadStream.calledWith('/path/file.zip'));
        t.true(streamStub.pipe.calledWith('Unzipped assets'));
        t.true(unzip.Extract.calledWith({ path: '/destination' }));
        t.true(streamStub.on.getCall(1).calledWith('error', sinon.match.func));
        t.true(loggerStub.calledWith(messages.fail));

        // tear down
        fs.createReadStream.restore();
        unzip.Extract.restore();
    });
});

test('Calculates the sha256 hash for a given file', (t) => {
    sinon.stub(fs, 'readFileSync').callsFake(() => 'File contents');

    const hashStub = {
        setEncoding: sinon.stub(),
        write: sinon.stub(),
        end: sinon.stub(),
        read: sinon.stub(),
    };

    hashStub.read.returns('SHA256 hash');

    sinon.stub(crypto, 'createHash').callsFake(() => hashStub);

    const result = util.calculateFileHash('/path/to/file.zip');

    t.true(fs.readFileSync.calledWith('/path/to/file.zip'));
    t.true(crypto.createHash.calledWith('sha256'));
    t.true(hashStub.setEncoding.calledWith('base64'));
    t.true(hashStub.write.calledWith('File contents'));
    t.true(hashStub.end.calledOnce);
    t.true(hashStub.read.calledOnce);
    t.is(result, 'SHA256 hash');
});
