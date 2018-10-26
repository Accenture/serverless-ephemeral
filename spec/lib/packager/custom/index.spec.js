const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const CustomPackager = require('../../../../src/lib/packager/custom');
const dockerCompose = require('../../../../src/util/docker-compose');

const getServerless = () => ({
    config: {
        servicePath: '/home/foo/project',
    },
    cli: {
        isVerbose: () => false,
        log: sinon.stub(),
    },
});

const getEphemeral = () => ({
    paths: {
        lib: '.ephemeral/lib',
    },
});

test('Create a CustomPackager instance', (t) => {
    const packager = new CustomPackager(getServerless(), getEphemeral(), {
        compose: 'path/to/docker-compose.yml',
        service: 'my-service',
        output: '/tmp/libraries/library-A.zip',
    });
    t.is(packager.compose.path, 'path/to/docker-compose.yml');
    t.is(packager.service, 'my-service');
    t.is(packager.output.path, '/tmp/libraries/library-A.zip');
});

test('Throws error when "compose" is missing', (t) => {
    const error = t.throws(() =>
        new CustomPackager(getServerless(), getEphemeral(), {
            service: 'my-service',
            output: '/tmp/libraries/library-A.zip',
        }));
    t.is(error.message, 'The option "compose" was not provided');
});

test('Throws error when "service" is missing', (t) => {
    const error = t.throws(() =>
        new CustomPackager(getServerless(), getEphemeral(), {
            compose: 'path/to/docker-compose.yml',
            output: '/tmp/libraries/library-A.zip',
        }));
    t.is(error.message, 'The option "service" was not provided');
});

test('Throws error when "output" is missing', (t) => {
    const error = t.throws(() =>
        new CustomPackager(getServerless(), getEphemeral(), {
            compose: 'path/to/docker-compose.yml',
            service: 'my-service',
        }));
    t.is(error.message, 'The option "output" was not provided');
});

test('Throws error when "output" is not a path to a zip file', (t) => {
    const error = t.throws(() =>
        new CustomPackager(getServerless(), getEphemeral(), {
            compose: 'path/to/docker-compose.yml',
            service: 'my-service',
            output: '/tmp/libraries/library-A.7z',
        }));
    t.is(error.message, 'Packager "output" must be a path to a zip file');
});

test('Builds a zip via the custom Docker files', async (t) => {
    sinon.stub(dockerCompose, 'build').callsFake(() => Promise.resolve());
    sinon.stub(dockerCompose, 'run').callsFake(() => Promise.resolve());
    sinon.stub(dockerCompose, 'rm').callsFake(() => Promise.resolve());

    const shellStub = {
        pushd: sinon.stub(),
        popd: sinon.stub(),
    };

    const PackagerProxy = proxyquire('../../../../src/lib/packager/custom', {
        shelljs: shellStub,
        '../index': function Packager (s, e) {
            this.serverless = s;
            this.ephemeral = e;
        },
    });

    const packager = new PackagerProxy(getServerless(), getEphemeral(), {
        compose: 'path/to/docker-compose.yml',
        service: 'my-service',
        output: '/tmp/libraries/library-A.7z',
    });

    return packager.fetch().then(() => {
        t.true(packager.serverless.cli.log.calledWith('Building custom package'));
        t.true(shellStub.pushd.calledWith('path/to'));
        t.true(dockerCompose.build.calledOnce);

        const runCall = dockerCompose.run.getCall(0);
        t.is(runCall.args[0], 'my-service');
        t.is(runCall.args[1].volume, '/home/foo/project/.ephemeral/lib:/tmp/libraries');
        t.is(runCall.args[1].environment.output, '/tmp/libraries/library-A.7z');

        t.true(dockerCompose.rm.calledWith('my-service'));
        t.true(shellStub.popd.calledOnce);
    });
});

