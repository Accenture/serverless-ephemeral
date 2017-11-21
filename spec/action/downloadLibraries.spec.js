const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const del = require('del');
const fs = require('fs');

const Util = {
    fs: null,
};

Util.fs = require('../../src/util/fs');

const action = require('../../src/action/downloadLibraries');

function initServerlessValues (act) {
    act.serverless = {
        service: {
            package: {
                artifact: 'service/.serverless/project.zip',
            },
        },
        cli: {
            log: sinon.stub(),
            vlog: sinon.stub(),
        },
    };
}

function initEphemeralValues (act) {
    act.ephemeral = {
        paths: {
            lib: '.ephemeral/lib',
            pkg: '.ephemeral/pkg',
        },
    };
}

test.before(() => {
    sinon.stub(fs, 'mkdirSync');

    sinon.stub(Util.fs, 'onPathExists');
    sinon.stub(Util.fs, 'unzip');

    initEphemeralValues(action);
    initServerlessValues(action);
});

test.serial('Deletes local copy when forceDownload option is true', (t) => {
    sinon.stub(del, 'sync');

    return action.checkForLibrariesZip({
        file: {
            path: '.ephemeral/libs/library-A.zip',
        },
        forceDownload: true,
    }).then((config) => {
        t.true(del.sync.calledWith('.ephemeral/libs/library-A.zip'));
        t.true(config.download);

        del.sync.restore();
    });
});

test.serial('Checks if an external dependency zip exists locally', (t) => {
    action.serverless.cli.vlog.reset();

    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.callsArg(1);

    return action.checkForLibrariesZip({
        file: {
            path: '.ephemeral/libs/library-A.zip',
        },
        forceDownload: false,
    }).then((config) => {
        t.is(Util.fs.onPathExists.getCall(0).args[0], '.ephemeral/libs/library-A.zip');
        t.true(action.serverless.cli.vlog.calledOnce);
        t.false(config.download);
    });
});

test.serial('Checks if an external dependency zip does not exist locally', (t) => {
    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.callsArg(2);

    return action.checkForLibrariesZip({
        file: {
            path: '.ephemeral/libs/library-A.zip',
        },
        forceDownload: false,
    }).then((config) => {
        t.is(Util.fs.onPathExists.getCall(0).args[0], '.ephemeral/libs/library-A.zip');
        t.true(config.download);
    });
});

test.serial('There is an error when checking if an external dependency zip exists', async (t) => {
    action.serverless.cli.log.reset();

    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.callsArgWith(3, 'Error checking');

    const error = await t.throws(action.checkForLibrariesZip({
        file: {
            path: '.ephemeral/libs/library-A.zip',
        },
        forceDownload: false,
    }));

    t.is(Util.fs.onPathExists.getCall(0).args[0], '.ephemeral/libs/library-A.zip');
    t.true(action.serverless.cli.log.calledOnce);
    t.is(error, 'Error checking');
});

test.serial('Downloads the specified library zip', (t) => {
    const streamStub = {
        pipe: sinon.stub(),
        on: sinon.stub(),
    };

    streamStub.pipe.returns(streamStub);
    streamStub.on.returns(streamStub);
    streamStub.on.withArgs('finish').yields();

    const requestStub = sinon.stub();
    requestStub.returns(streamStub);

    sinon.stub(fs, 'createWriteStream').callsFake(() => 'Zip File');

    // proxyquire action to stub the request module
    const proxyAction = proxyquire('../../src/action/downloadLibraries', {
        request: requestStub,
    });

    initServerlessValues(proxyAction);

    proxyAction.serverless.cli.vlog.reset();

    const configParam = {
        download: true,
        url: 'http://domain.com/library-A.zip',
        file: {
            path: '.ephemeral/libs/library-A.zip',
        },
    };

    return proxyAction.downloadLibrariesZip(configParam).then((config) => {
        t.true(requestStub.calledWith('http://domain.com/library-A.zip'));
        t.true(fs.createWriteStream.calledWith('.ephemeral/libs/library-A.zip'));
        t.true(streamStub.pipe.calledWith('Zip File'));
        t.true(proxyAction.serverless.cli.vlog.calledOnce);
        t.deepEqual(configParam, config);

        fs.createWriteStream.restore();
    });
});

test.serial('Does not download anything when the config.download flag is false', (t) => {
    const requestStub = sinon.stub();

    // proxyquire action to stub the request module
    const proxyAction = proxyquire('../../src/action/downloadLibraries', {
        request: requestStub,
    });

    const configParam = { download: false };

    return proxyAction.downloadLibrariesZip(configParam).then((config) => {
        t.false(requestStub.called);
        t.deepEqual(configParam, config);
    });
});

test.serial('Creates a custom directory for a specific library', (t) => {
    const configParam = {
        directory: 'my-library',
    };

    fs.mkdirSync.reset();

    action.createCustomDirectory(configParam).then((config) => {
        const destPath = '.ephemeral/pkg/my-libraries';
        t.is(config.destinationPath, destPath);
        t.is(fs.mkdirSync.getCall(0).args[0], destPath);
    });
});

test.serial('Provided custom directory already exists', (t) => {
    const configParam = {
        directory: 'my-library',
    };

    fs.mkdirSync.reset();
    fs.mkdirSync.throws({ code: 'EEXIST' });

    action.createCustomDirectory(configParam).then((config) => {
        const destPath = '.ephemeral/pkg/my-library';
        t.is(config.destinationPath, destPath);
        t.is(fs.mkdirSync.getCall(0).args[0], destPath);
    });
});

test.serial('Provided an invalid custom directory name', async (t) => {
    const configParam = {
        directory: 'my/library',
    };

    const error = await t.throws(action.createCustomDirectory(configParam));
    t.is(error, 'Directory name can only include alphanumeric characters and symbols -_.');
});

test.serial('An unexpected error occurs when creating the custom directory', async (t) => {
    const configParam = {
        directory: 'my-library',
    };

    fs.mkdirSync.reset();
    fs.mkdirSync.throws({ code: 'UNEXPECTED' });

    const error = await t.throws(action.createCustomDirectory(configParam));
    t.is(error, 'Unexpected error creating directory .ephemeral/pkg/my-library');
});

test.serial('Unzips a library to the Ephemeral package directory', (t) => {
    Util.fs.unzip.reset();

    action.unzipLibrariesToPackageDir({
        destinationPath: '.ephemeral/pkg/my-libraries',
        file: {
            path: '.ephemeral/lib/library-A.zip',
        },
    });

    t.is(Util.fs.unzip.getCall(0).args[0], '.ephemeral/lib/library-A.zip');
    t.is(Util.fs.unzip.getCall(0).args[1], '.ephemeral/pkg/my-libraries');
});

test('Prepares a library\'s configuration with the file info', (t) => {
    const result = action.prepareLibConfig({
        url: 'http://domain.com/path/library-A.zip',
        forceDownload: true,
    });

    t.deepEqual(result, {
        url: 'http://domain.com/path/library-A.zip',
        forceDownload: true,
        file: {
            name: 'library-A.zip',
            path: '.ephemeral/lib/library-A.zip',
        },
    });
});

test.after(() => {
    Util.fs.onPathExists.restore();
    Util.fs.unzip.restore();

    fs.mkdirSync.restore();
});
