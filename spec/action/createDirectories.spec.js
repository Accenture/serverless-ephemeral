const test = require('ava');
const sinon = require('sinon');

const BbPromise = require('bluebird');

const Util = {
    fs: null,
};

Util.fs = require('../../src/util/fs');

const action = require('../../src/action/createDirectories');

action.serverless = {
    service: {
        package: {
            artifact: '/service/.serverless/project.zip',
        },
    },
    cli: {
        log: sinon.stub(),
        vlog: sinon.stub(),
    },
};

action.ephemeral = {
    paths: {
        base: '/service/.ephemeral',
        lib: '/service/.ephemeral/lib',
        pkg: '/service/.ephemeral/pkg',
    },
};

test.before(() => {
    sinon.stub(Util.fs.promises, 'mkdir');
    sinon.stub(Util.fs, 'onPathExistsCb');
});

test.serial('Callback when Ephemeral directory exists', (t) => {
    Util.fs.onPathExistsCb.reset();
    Util.fs.onPathExistsCb.callsArg(1);

    return action.checkEphemeralDirExists().then((create) => {
        t.is(Util.fs.onPathExistsCb.getCall(0).args[0], '/service/.ephemeral');
        t.false(create);
    });
});

test.serial('Callback when Ephemeral directory does not exist', (t) => {
    Util.fs.onPathExistsCb.reset();
    Util.fs.onPathExistsCb.callsArg(2);

    return action.checkEphemeralDirExists().then((create) => {
        t.is(Util.fs.onPathExistsCb.getCall(0).args[0], '/service/.ephemeral');
        t.true(create);
    });
});

test.serial('Callback when there is an error accessing the Ephemeral directory', (t) => {
    Util.fs.onPathExistsCb.reset();
    action.serverless.cli.log.reset();

    Util.fs.onPathExistsCb.callsArgWith(3, 'Access Error');

    return action.checkEphemeralDirExists().catch((error) => {
        t.is(Util.fs.onPathExistsCb.getCall(0).args[0], '/service/.ephemeral');
        t.is(error, 'Access Error');
        t.true(action.serverless.cli.log.calledOnce);
    });
});

test.serial('Creates the Ephemeral directory', (t) => {
    Util.fs.promises.mkdir.reset();
    Util.fs.promises.mkdir.returns(BbPromise.resolve());

    action.serverless.cli.vlog.reset();

    action.createEphemeralDir(true);

    t.true(Util.fs.promises.mkdir.calledWith('/service/.ephemeral'));
    t.true(action.serverless.cli.vlog.calledOnce);
});

test.serial('Does not create the Ephemeral directory when create param is false', (t) => {
    Util.fs.promises.mkdir.reset();

    action.createEphemeralDir(false);

    t.false(Util.fs.promises.mkdir.called);
});

test.serial('Creates the Ephemeral files package directory', (t) => {
    Util.fs.promises.mkdir.reset();
    Util.fs.promises.mkdir.returns(BbPromise.resolve());

    action.serverless.cli.vlog.reset();

    action.createEphemeralPkgDir();

    t.true(Util.fs.promises.mkdir.calledWith('/service/.ephemeral/pkg'));
    t.true(action.serverless.cli.vlog.calledOnce);
});

test.serial('Callback when Ephemeral libraries directory exists', (t) => {
    Util.fs.onPathExistsCb.reset();
    Util.fs.onPathExistsCb.callsArg(1);

    return action.checkLibrariesDirExists().then((create) => {
        t.is(Util.fs.onPathExistsCb.getCall(0).args[0], '/service/.ephemeral/lib');
        t.false(create);
    });
});

test.serial('Callback when Ephemeral libraries directory does not exist', (t) => {
    Util.fs.onPathExistsCb.reset();
    Util.fs.onPathExistsCb.callsArg(2);

    return action.checkLibrariesDirExists().then((create) => {
        t.is(Util.fs.onPathExistsCb.getCall(0).args[0], '/service/.ephemeral/lib');
        t.true(create);
    });
});

test.serial('Callback when there is an error accessing the Ephemeral libraries directory', (t) => {
    Util.fs.onPathExistsCb.reset();
    action.serverless.cli.log.reset();

    Util.fs.onPathExistsCb.callsArgWith(3, 'Access Error');

    return action.checkLibrariesDirExists().catch((error) => {
        t.is(Util.fs.onPathExistsCb.getCall(0).args[0], '/service/.ephemeral/lib');
        t.is(error, 'Access Error');
        t.true(action.serverless.cli.log.calledOnce);
    });
});

test.serial('Creates the Ephemeral libraries directory', (t) => {
    Util.fs.promises.mkdir.reset();
    Util.fs.promises.mkdir.returns(BbPromise.resolve());

    action.serverless.cli.vlog.reset();

    action.createLibrariesDir(true);

    t.true(Util.fs.promises.mkdir.calledWith('/service/.ephemeral/lib'));
    t.true(action.serverless.cli.vlog.calledOnce);
});

test.serial('Does not create the Ephemeral libraries directory when create param is false', (t) => {
    Util.fs.promises.mkdir.reset();

    action.createLibrariesDir(false);

    t.false(Util.fs.promises.mkdir.called);
});

test.after(() => {
    Util.fs.promises.mkdir.restore();
    Util.fs.onPathExistsCb.restore();
});
