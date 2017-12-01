const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const del = require('del');
const fs = require('fs');

const Util = {
    fs: null,
};

Util.fs = require('../../src/util/fs');

const actionFile = '../../src/action/fetchLibraries';
const action = require('../../src/action/fetchLibraries');

function getRequestStub () {
    const streamStub = {
        pipe: sinon.stub(),
        on: sinon.stub(),
    };

    streamStub.pipe.callsFake(() => streamStub);
    streamStub.on.callsFake(() => streamStub);
    streamStub.on.withArgs('finish').yields();

    const requestStub = sinon.stub();
    requestStub.callsFake(() => streamStub);

    return { requestStub, streamStub };
}

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

test.serial('Deletes local copy when nocache option is true', (t) => {
    sinon.stub(del, 'sync');

    return action.checkForLibrariesZip({
        file: {
            path: '.ephemeral/libs/library-A.zip',
        },
        nocache: true,
    }).then((config) => {
        t.true(del.sync.calledWith('.ephemeral/libs/library-A.zip'));
        t.true(config.refetch);

        del.sync.restore();
    });
});

test.serial('Checks if the library zip exists locally', (t) => {
    action.serverless.cli.vlog.reset();

    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.callsArg(1);

    return action.checkForLibrariesZip({
        file: {
            path: '.ephemeral/libs/library-A.zip',
        },
        nocache: false,
    }).then((config) => {
        t.is(Util.fs.onPathExists.getCall(0).args[0], '.ephemeral/libs/library-A.zip');
        t.true(action.serverless.cli.vlog.calledOnce);
        t.false(config.refetch);
    });
});

test.serial('Checks if the library zip does not exist locally', (t) => {
    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.callsArg(2);

    return action.checkForLibrariesZip({
        file: {
            path: '.ephemeral/libs/library-A.zip',
        },
        nocache: false,
    }).then((config) => {
        t.is(Util.fs.onPathExists.getCall(0).args[0], '.ephemeral/libs/library-A.zip');
        t.true(config.refetch);
    });
});

test.serial('There is an error when checking if the library zip exists', async (t) => {
    action.serverless.cli.log.reset();

    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.callsArgWith(3, 'Error checking');

    const error = await t.throws(action.checkForLibrariesZip({
        file: {
            path: '.ephemeral/libs/library-A.zip',
        },
        nocache: false,
    }));

    t.is(Util.fs.onPathExists.getCall(0).args[0], '.ephemeral/libs/library-A.zip');
    t.true(action.serverless.cli.log.calledOnce);
    t.is(error, 'Error checking');
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

test.serial('Library is found locally, so nothing to build/download', (t) => {
    const configParam = {
        refetch: false,
    };

    sinon.spy(action, 'buildLibraryZip');
    sinon.spy(action, 'downloadLibraryZip');

    return action.fetchLibrary(configParam).then((config) => {
        t.false(action.buildLibraryZip.called);
        t.false(action.downloadLibraryZip.called);
        t.is(config, configParam);

        action.downloadLibraryZip.restore();
        action.buildLibraryZip.restore();
    });
});

test.serial('Decides to build the library', (t) => {
    const configParam = {
        build: 'tensorflow',
        refetch: true,
    };

    sinon.spy(action, 'downloadLibraryZip');
    sinon.stub(action, 'buildLibraryZip')
        .callsFake(config => Promise.resolve(config));

    return action.fetchLibrary(configParam).then((config) => {
        t.false(action.downloadLibraryZip.called);
        t.true(action.buildLibraryZip.calledWith(config));

        action.buildLibraryZip.restore();
        action.downloadLibraryZip.restore();
    });
});

test.serial('Decides to download the library', (t) => {
    const configParam = {
        url: 'http://domain.com/library-A.zip',
        refetch: true,
    };

    sinon.spy(action, 'buildLibraryZip');
    sinon.stub(action, 'downloadLibraryZip')
        .callsFake(config => Promise.resolve(config));

    return action.fetchLibrary(configParam).then((config) => {
        t.false(action.buildLibraryZip.called);
        t.true(action.downloadLibraryZip.calledWith(config));

        action.downloadLibraryZip.restore();
        action.buildLibraryZip.restore();
    });
});

test('Build configuration for a custom packager is valid', (t) => {
    const shelljs = { which: sinon.stub() };
    shelljs.which.callsFake(() => true);

    const proxyAction = proxyquire(actionFile, { shelljs });

    const error = proxyAction.validateBuildConfiguration({
        path: 'path/to/docker-compose.yml',
        container: 'mylibcontainer',
        output: '/tmp/libraries/my-lib.zip',
    });

    t.is(error, null);
});

test('Path to Docker compose file for custom packager is not valid', (t) => {
    const shelljs = { which: sinon.stub() };
    shelljs.which.callsFake(() => true);

    const proxyAction = proxyquire(actionFile, { shelljs });

    const error = proxyAction.validateBuildConfiguration({
        path: 'path/to/docker-configuration.txt',
        container: 'mylibcontainer',
        output: '/tmp/libraries/my-lib.zip',
    });

    t.is(error.message, 'path/to/docker-configuration.txt is not a Docker compose file');
});

test('Build configuration for a custom packager is missing options', (t) => {
    const shelljs = { which: sinon.stub() };
    shelljs.which.callsFake(() => true);

    const proxyAction = proxyquire(actionFile, { shelljs });

    const error = proxyAction.validateBuildConfiguration({
        path: 'path/to/docker-compose.yml',
    });

    t.is(error.message, 'The following required options were not provided: container, output');
});

test('Build configuration for an existing packager is valid', (t) => {
    const shelljs = { which: sinon.stub() };
    shelljs.which.callsFake(() => true);

    const proxyAction = proxyquire(actionFile, { shelljs });

    const error = proxyAction.validateBuildConfiguration({
        name: 'tensorflow',
        version: '1.0.0',
    });

    t.is(error, null);
});

test('Build configuration for an existing packager is missing options', (t) => {
    const shelljs = { which: sinon.stub() };
    shelljs.which.callsFake(() => true);

    const proxyAction = proxyquire(actionFile, { shelljs });

    const error = proxyAction.validateBuildConfiguration({
        name: 'tensorflow',
    });

    t.is(error.message, 'The following required options were not provided: version');
});

test('A requested packager does not exist', (t) => {
    const shelljs = { which: sinon.stub() };
    shelljs.which.callsFake(() => true);

    const proxyAction = proxyquire(actionFile, { shelljs });

    const error = proxyAction.validateBuildConfiguration({
        name: 'foo',
    });

    t.is(
        error.message,
        'The packager "foo" does not exist. Please refer to the documentation for available packagers'
    );
});


test.serial('Downloads the specified library zip', (t) => {
    const { requestStub, streamStub } = getRequestStub();

    sinon.stub(fs, 'createWriteStream').callsFake(() => 'Zip File');

    // proxyquire action to stub the request module
    const proxyAction = proxyquire(actionFile, {
        request: requestStub,
    });

    initServerlessValues(proxyAction);

    proxyAction.serverless.cli.log.reset();

    const configParam = {
        download: true,
        url: 'http://domain.com/library-A.zip',
        file: {
            path: '.ephemeral/libs/library-A.zip',
        },
    };

    return proxyAction.downloadLibraryZip(configParam).then((config) => {
        t.true(requestStub.calledWith('http://domain.com/library-A.zip'));
        t.true(fs.createWriteStream.calledWith('.ephemeral/libs/library-A.zip'));
        t.true(streamStub.pipe.calledWith('Zip File'));
        t.true(proxyAction.serverless.cli.log.calledOnce);
        t.deepEqual(configParam, config);

        fs.createWriteStream.restore();
    });
});

test.serial('Unzips the library to the Ephemeral package directory', (t) => {
    Util.fs.unzip.reset();

    action.unzipLibraryToPackageDir({
        destinationPath: '.ephemeral/pkg/my-libraries',
        file: {
            path: '.ephemeral/lib/library-A.zip',
        },
    });

    t.is(Util.fs.unzip.getCall(0).args[0], '.ephemeral/lib/library-A.zip');
    t.is(Util.fs.unzip.getCall(0).args[1], '.ephemeral/pkg/my-libraries');
});

test('Generates the zip name when using a provided packager', (t) => {
    const name = action.generateLibName({
        build: {
            name: 'tensorflow',
            version: '1.0.0',
        },
    });

    t.is(name, 'tensorflow-1.0.0.zip');
});

test('Generates the zip name when using a custom packager', (t) => {
    const name = action.generateLibName({
        build: {
            path: 'path/to/docker-compose.yml',
            container: 'mylibcontainer',
            output: '/tmp/libraries/my-lib.zip',
        },
    });

    t.is(name, 'my-lib.zip');
});

test('Generates the zip name when downloading the library', (t) => {
    const name = action.generateLibName({
        url: 'http://domain.com/path/library-A.zip',
    });

    t.is(name, 'library-A.zip');
});

test('Prepares the library\'s configuration with the file info', (t) => {
    sinon.stub(action, 'generateLibName').callsFake(() => 'name.zip');

    const result = action.prepareLibConfig({
        url: 'http://domain.com/path/library-A.zip',
        nocache: true,
    });

    t.deepEqual(result, {
        url: 'http://domain.com/path/library-A.zip',
        nocache: true,
        file: {
            name: 'name.zip',
            path: '.ephemeral/lib/name.zip',
        },
    });

    action.generateLibName.restore();
});

test.after(() => {
    Util.fs.onPathExists.restore();
    Util.fs.unzip.restore();

    fs.mkdirSync.restore();
});
