const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const del = require('del');
const fs = require('fs');

const Util = {
    fs: null,
};

const PackagerFactory = require('../../src/lib/packager/Factory');
Util.fs = require('../../src/util/fs');

const action = require('../../src/action/fetchLibraries');

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
            debug: sinon.stub(),
        },
    };
}

function initEphemeralValues (act) {
    act.ephemeral = {
        config: { libraries: [] },
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

test.serial('Deletes local copy when using user decides not to use cache', (t) => {
    sinon.stub(del, 'sync');

    const param = {
        file: { path: '.ephemeral/libs/library-A.zip' },
        useCached: false,
    };

    return action.checkForLocalLibrary(param).then((handler) => {
        t.true(del.sync.calledWith('.ephemeral/libs/library-A.zip'));
        t.is(handler, param);
        del.sync.restore();
    });
});

test('Informs the user it will use the local copy of the library', (t) => {
    action.serverless.cli.vlog.reset();
    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.callsFake(() => true);

    const param = {
        file: {
            path: '.ephemeral/libs/library-B.zip',
            filename: 'library-B.zip',
        },
        useCached: true,
    };

    return action.checkForLocalLibrary(param).then((handler) => {
        t.true(Util.fs.onPathExists.calledWith('.ephemeral/libs/library-B.zip'));
        t.true(action.serverless.cli.vlog.calledWith('Using local copy of library-B.zip'));
        t.is(handler, param);
    });
});

test('Local library is not found when user wants to use cache', (t) => {
    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.callsFake(() => false);

    const param = {
        file: {
            path: '.ephemeral/libs/library-B.zip',
            filename: 'library-B.zip',
        },
        useCached: true,
    };

    return action.checkForLocalLibrary(param).then((handler) => {
        t.true(Util.fs.onPathExists.calledWith('.ephemeral/libs/library-B.zip'));
        t.false(handler.useCached);
        t.is(handler.file, param.file);
    });
});

test.serial('There is an error when checking for the local library', async (t) => {
    action.serverless.cli.debug.reset();
    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.throws(new Error('Unexpected error'));

    const promise = action.checkForLocalLibrary({
        file: {
            path: '.ephemeral/libs/library-C.zip',
            filename: 'library-C.zip',
        },
        useCached: true,
    });

    const error = await t.throws(promise);

    t.true(Util.fs.onPathExists.calledWith('.ephemeral/libs/library-C.zip'));
    t.true(action.serverless.cli.debug.calledWith('Unexpected error checking for library library-C.zip'));
    t.is(error.message, 'Unexpected error');
});


test.serial('Creates a custom directory for a specific library', (t) => {
    const param = {
        unzipped: { path: '.ephemeral/pkg/my-library' },
    };

    fs.mkdirSync.reset();

    return action.createCustomDirectory(param).then((handler) => {
        t.is(handler, param);
        t.true(fs.mkdirSync.calledWith('.ephemeral/pkg/my-library'));
    });
});

test.serial('Provided custom directory already exists', (t) => {
    const param = {
        unzipped: { path: '.ephemeral/pkg/my-library' },
    };

    fs.mkdirSync.reset();
    fs.mkdirSync.throws({ code: 'EEXIST' });

    return action.createCustomDirectory(param).then((handler) => {
        t.is(handler, param);
        t.true(fs.mkdirSync.calledWith('.ephemeral/pkg/my-library'));
    });
});

test.serial('An unexpected error occurs when creating the custom directory', async (t) => {
    const param = {
        unzipped: { path: '.ephemeral/pkg/my-library' },
    };

    fs.mkdirSync.reset();
    fs.mkdirSync.throws({ code: 'UNEXPECTED' });

    const error = await t.throws(action.createCustomDirectory(param));
    t.true(fs.mkdirSync.calledWith('.ephemeral/pkg/my-library'));
    t.is(error.code, 'UNEXPECTED');
});

test('Library is found locally, so nothing to build/download', (t) => {
    const param = { useCached: true };

    return action.fetchLibrary(param).then((handler) => {
        t.is(param, handler);
    });
});

test('Fetches (build/download) the library', (t) => {
    const param = {
        useCached: false,
        fetch: sinon.stub().callsFake(() => Promise.resolve()),
    };

    return action.fetchLibrary(param).then((handler) => {
        t.true(param.fetch.called);
        t.is(param, handler);
    });
});

test('Unzips the library to the Ephemeral package directory', (t) => {
    Util.fs.unzip.reset();

    action.unzipLibraryToPackageDir({
        unzipped: { path: '.ephemeral/pkg/my-libraries' },
        file: { path: '.ephemeral/lib/library-A.zip' },
    });

    t.is(Util.fs.unzip.getCall(0).args[0], '.ephemeral/lib/library-A.zip');
    t.is(Util.fs.unzip.getCall(0).args[1], '.ephemeral/pkg/my-libraries');
});

test('"directory" leading/trailing slash will be removed', (t) => {
    const clean = action.validateConfig({ directory: '/folder/' });
    t.is(clean.directory, 'folder');
});

test('"directory" contains invalid characters', (t) => {
    const error = t.throws(() => action.validateConfig({ directory: 'bad/name' }));
    t.is(error.message, '"directory" can only include alphanumeric characters and symbols -_.');
});

test('Creates a packager handler', (t) => {
    sinon.stub(action, 'validateConfig').returnsArg(0);
    sinon.stub(PackagerFactory, 'build');
    PackagerFactory.build.callsFake(() => ({
        addDirectory: sinon.stub(),
    }));

    const libConfig = {
        packager: 'PACKAGER INFO',
        directory: 'dir',
        nocache: true,
    };

    action.ephemeral.config.libraries.push(libConfig);

    const handler = action.createLibHandlers()[0];

    t.false(handler.useCached);
    t.true(handler.addDirectory.calledWith('dir'));
    t.true(PackagerFactory.build.calledWith(action.serverless, action.ephemeral, 'PACKAGER INFO'));

    action.ephemeral.config.libraries = [];
    action.validateConfig.restore();
});

test('Creates a download handler', (t) => {
    let url;
    const proxyAction = proxyquire('../../src/action/fetchLibraries', {
        '../lib/download': function Download (s, e, u) {
            url = u;
            this.addDirectory = sinon.stub();
        },
    });

    initServerlessValues(proxyAction);
    initEphemeralValues(proxyAction);

    sinon.stub(proxyAction, 'validateConfig').returnsArg(0);

    const libConfig = {
        url: 'https://www.domain.com/library.zip',
        directory: 'dir',
    };

    proxyAction.ephemeral.config.libraries.push(libConfig);

    const handler = proxyAction.createLibHandlers()[0];

    t.true(handler.useCached);
    t.true(handler.addDirectory.calledWith('dir'));
    t.is(url, 'https://www.domain.com/library.zip');

    proxyAction.ephemeral.config.libraries = [];
    proxyAction.validateConfig.restore();
});

test.after(() => {
    Util.fs.onPathExists.restore();
    Util.fs.unzip.restore();
    fs.mkdirSync.restore();
});
