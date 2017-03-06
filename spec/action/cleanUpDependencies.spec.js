const test = require('ava');
const sinon = require('sinon');
const del = require('del');

const Util = {
    fs: null,
};

Util.fs = require('../../src/util/fs');

const action = require('../../src/action/cleanUpDependencies');

test.beforeEach(() => {
    action.serverless = {
        cli: {
            log: sinon.stub(),
            vlog: sinon.stub(),
        },
    };

    action.ephemeral = {
        paths: {
            pkg: '/service/.ephemeral/pkg',
        },
    };
});

test.serial('Cleans up dependencies if directory is found', (t) => {
    action.serverless.cli.vlog.reset();

    sinon.stub(Util.fs, 'onPathExists');
    Util.fs.onPathExists.callsArg(1);

    sinon.stub(del, 'sync');

    return action.cleanUpDependencies().then(() => {
        t.true(Util.fs.onPathExists.calledWith(
            '/service/.ephemeral/pkg',
            sinon.match.func,
            sinon.match.func,
            sinon.match.func
        ));

        t.true(action.serverless.cli.vlog.calledOnce);
        t.true(del.sync.calledWith('/service/.ephemeral/pkg'));

        del.sync.restore();
        Util.fs.onPathExists.restore();
    });
});

test.serial('Handles error on directory access error', (t) => {
    action.serverless.cli.log.reset();

    sinon.stub(Util.fs, 'onPathExists');
    Util.fs.onPathExists.callsArgWith(3, 'Access error');

    return action.cleanUpDependencies().catch((error) => {
        t.true(Util.fs.onPathExists.calledWith(
            '/service/.ephemeral/pkg',
            sinon.match.func,
            sinon.match.func,
            sinon.match.func
        ));

        t.true(action.serverless.cli.log.calledOnce);
        t.is(error, 'Access error');

        Util.fs.onPathExists.restore();
    });
});
