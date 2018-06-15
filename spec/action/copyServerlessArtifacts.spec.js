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
            Util.fs.promises.access.calledWith('/service/.serverless/project.zip', fs.constants.R_OK)
        );
    });
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
