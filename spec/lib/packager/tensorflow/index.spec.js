const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const TensorFlow = require('../../../../src/lib/packager/tensorflow');
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

test('Create a TensorFlow instance', (t) => {
    const tensorflow = new TensorFlow(getServerless(), getEphemeral(), {
        name: 'tensorflow',
        version: '1.4.0',
    });
    t.is(tensorflow.version, '1.4.0');
    t.is(tensorflow.file.path, '.ephemeral/lib/tensorflow-1.4.0.zip');
});

test('Throws error when no version is provided on creation', (t) => {
    const error = t.throws(() => new TensorFlow(getServerless(), getEphemeral(), {
        name: 'tensorflow',
    }));

    t.is(error.message, 'TensorFlow "version" was not provided');
});

test('Builds a TensorFlow zip via Docker', async (t) => {
    sinon.stub(dockerCompose, 'build').callsFake(() => Promise.resolve());
    sinon.stub(dockerCompose, 'run').callsFake(() => Promise.resolve());
    sinon.stub(dockerCompose, 'rm').callsFake(() => Promise.resolve());

    const shellStub = {
        pushd: sinon.stub(),
        popd: sinon.stub(),
    };

    const TensorFlowProxy = proxyquire('../../../../src/lib/packager/tensorflow', {
        shelljs: shellStub,
        '../index': function Packager (s, e, o) {
            this.serverless = s;
            this.ephemeral = e;
            this.name = o.name;
            this.file = { filename: o.filename };
        },
    });

    const tensorflow = new TensorFlowProxy(getServerless(), getEphemeral(), {
        name: 'tensorflow',
        version: '1.4.0',
    });

    return tensorflow.fetch().then(() => {
        t.true(tensorflow.serverless.cli.log.calledWith('Building TensorFlow v1.4.0'));
        t.true(shellStub.pushd.getCall(0).args[0].indexOf('packager/tensorflow') !== -1);
        t.true(dockerCompose.build.calledOnce);

        const runCall = dockerCompose.run.getCall(0);
        t.is(runCall.args[0], 'packager');
        t.is(runCall.args[1].volume, '/home/foo/project/.ephemeral/lib:/tmp/tensorflow');
        t.is(runCall.args[1].environment.version, '1.4.0');
        t.is(runCall.args[1].environment.output, '/tmp/tensorflow/tensorflow-1.4.0.zip');

        t.true(dockerCompose.rm.calledWith('packager'));
        t.true(shellStub.popd.calledOnce);
    });
});
