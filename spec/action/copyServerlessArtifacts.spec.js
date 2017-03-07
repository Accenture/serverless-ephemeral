const test = require('ava');
const sinon = require('sinon');

const BbPromise = require('bluebird');
const fs = require('fs');

const Util = {
    fs: null,
};

Util.fs = require('../../src/util/fs');

const action = require('../../src/action/copyServerlessArtifacts');

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
        pkg: '/service/.ephemeral/pkg',
    },
};

test.before(() => {
    sinon.stub(Util.fs.promises, 'access');
    sinon.stub(Util.fs.promises, 'mkdir');
    sinon.stub(Util.fs, 'onPathExists');
    sinon.stub(Util.fs, 'unzip');
});

test.serial('Checks if the Serverless artifacts zip exists', (t) => {
    Util.fs.promises.access.returns(BbPromise.resolve());

    return action.checkServerlessArtifactExists().then(() => {
        t.true(
            Util.fs.promises.access.calledWith('/service/.serverless/project.zip', fs.constants.R_OK));
    });
});

test.serial('Callback when Ephemeral directory exists', (t) => {
    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.callsArg(1);

    return action.checkEphemeralDirExists().then((create) => {
        t.is(Util.fs.onPathExists.getCall(0).args[0], '/service/.ephemeral');
        t.false(create);
    });
});

test.serial('Callback when Ephemeral directory does not exist', (t) => {
    Util.fs.onPathExists.reset();
    Util.fs.onPathExists.callsArg(2);

    return action.checkEphemeralDirExists().then((create) => {
        t.is(Util.fs.onPathExists.getCall(0).args[0], '/service/.ephemeral');
        t.true(create);
    });
});

test.serial('Callback when there is an error accessing the Ephemeral directory', (t) => {
    Util.fs.onPathExists.reset();
    action.serverless.cli.log.reset();

    Util.fs.onPathExists.callsArgWith(3, 'Access Error');

    return action.checkEphemeralDirExists().catch((error) => {
        t.is(Util.fs.onPathExists.getCall(0).args[0], '/service/.ephemeral');
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

test.serial('Unzips the Serverless artifacts to the Ephemeral files package directory', (t) => {
    action.unzipServerlessArtifactsToEphemeralPkgDir();

    t.is(Util.fs.unzip.getCall(0).args[0], '/service/.serverless/project.zip');
    t.is(Util.fs.unzip.getCall(0).args[1], '/service/.ephemeral/pkg');
});

test.after(() => {
    Util.fs.promises.access.restore();
    Util.fs.promises.mkdir.restore();
    Util.fs.onPathExists.restore();
    Util.fs.unzip.restore();
});
