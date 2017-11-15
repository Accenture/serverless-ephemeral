const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const fs = require('fs');

const Util = {
    fs: null,
};

Util.fs = require('../../src/util/fs');

const action = require('../../src/action/packDependencies');

function initServerlessValues (act) {
    act.serverless = {
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
}

function initEphemeralValues (act) {
    act.ephemeral = {
        paths: {
            lib: '/service/.ephemeral/lib',
            pkg: '/service/.ephemeral/pkg',
        },
    };
}

test.before(() => {
    initEphemeralValues(action);
    initServerlessValues(action);
});

test.beforeEach((t) => {
    action.serverless.service.provider = {
        compiledCloudFormationTemplate: {
            Resources: {},
            Outputs: {},
        },
    };

    // @see https://github.com/serverless/serverless/blob/master/lib/plugins/aws/lib/naming.js
    t.context.namingServiceStub = {
        getLambdaVersionLogicalId: (functionName, sha) => `${functionName}LambdaVersion${sha}`,
        getLambdaLogicalIdRegex: sinon.stub(),
    };

    sinon.spy(t.context.namingServiceStub, 'getLambdaVersionLogicalId');
    t.context.namingServiceStub.getLambdaLogicalIdRegex.returns(/LambdaFunction$/);

    action.serverless.getProvider = sinon.stub();
    action.serverless.getProvider.returns({
        naming: t.context.namingServiceStub,
    });
});

test.serial('Zips all artifacts', (t) => {
    const streamStub = {
        on: sinon.stub(),
    };

    streamStub.on.returns(streamStub);
    streamStub.on.withArgs('open').yields();
    streamStub.on.withArgs('close').yields();

    sinon.stub(fs, 'createWriteStream').callsFake(() => streamStub);

    const archiverOptionsStub = {
        pipe: sinon.stub(),
        directory: sinon.stub(),
        finalize: sinon.stub(),
    };

    const archiverStub = sinon.stub();
    archiverStub.returns(archiverOptionsStub);

    const proxyAction = proxyquire('../../src/action/packDependencies', {
        archiver: archiverStub,
    });

    initServerlessValues(proxyAction);
    initEphemeralValues(proxyAction);

    return proxyAction.zipPackage().then(() => {
        t.true(fs.createWriteStream.calledWith('/service/.serverless/project.zip'));
        t.true(archiverStub.calledWith('zip'));

        t.true(archiverOptionsStub.pipe.calledWith(streamStub));
        t.true(archiverOptionsStub.directory.calledWith('/service/.ephemeral/pkg', '/'));
        t.true(archiverOptionsStub.finalize.calledOnce);

        t.true(proxyAction.serverless.cli.vlog.calledOnce);

        fs.createWriteStream.restore();
    });
});

test.serial('Zips all artifacts', (t) => {
    const streamStub = {
        on: sinon.stub(),
    };

    streamStub.on.returns(streamStub);
    streamStub.on.withArgs('error').yields('Error writing zip file');

    sinon.stub(fs, 'createWriteStream').callsFake(() => streamStub);

    const archiverStub = sinon.stub();

    const proxyAction = proxyquire('../../src/action/packDependencies', {
        archiver: archiverStub,
    });

    initServerlessValues(proxyAction);
    initEphemeralValues(proxyAction);

    return proxyAction.zipPackage().catch((error) => {
        t.true(fs.createWriteStream.calledWith('/service/.serverless/project.zip'));
        t.true(archiverStub.calledWith('zip'));

        t.is(error, 'Error writing zip file');

        t.true(proxyAction.serverless.cli.vlog.calledOnce);

        fs.createWriteStream.restore();
    });
});


test('Updates the Lambda zip hashes in the Cloud Formation template', (t) => {
    // setup Cloud Formation test resources
    action.serverless.service.provider.compiledCloudFormationTemplate.Resources = {
        TestLambdaFunction: {
            Type: 'AWS::Lambda::Function',
        },
        TestLambdaVersion12345ABCDE: {
            Type: 'AWS::Lambda::Version',
            Properties: {
                FunctionName: {
                    Ref: 'TestLambdaFunction',
                },
                CodeSha256: '12345ABCDE',
            },
        },
        AnotherLambdaFunction: {
            Type: 'AWS::Lambda::Function',
        },
        AnotherLambdaVersion12345ABCDE: {
            Type: 'AWS::Lambda::Version',
            Properties: {
                FunctionName: {
                    Ref: 'AnotherLambdaFunction',
                },
                CodeSha256: '12345ABCDE',
            },
        },
    };

    // setup Cloud Formation test outputs
    action.serverless.service.provider.compiledCloudFormationTemplate.Outputs = {
        TestLambdaFunctionQualifiedArn: {
            Value: {
                Ref: 'TestLambdaVersion12345ABCDE',
            },
        },
        AnotherLambdaFunctionQualifiedArn: {
            Value: {
                Ref: 'AnotherLambdaVersion12345ABCDE',
            },
        },
    };

    // setup new hash calculator stub
    sinon.stub(Util.fs, 'calculateFileHash').callsFake(() => '67890QWERTY');

    return action.updateLambdasHash().then(() => {
        t.true(Util.fs.calculateFileHash.calledOnce);
        t.true(t.context.namingServiceStub.getLambdaVersionLogicalId.calledTwice);
        t.true(t.context.namingServiceStub.getLambdaLogicalIdRegex.calledTwice);

        const Resources =
            action.serverless.service.provider.compiledCloudFormationTemplate.Resources;
        const Outputs = action.serverless.service.provider.compiledCloudFormationTemplate.Outputs;

        t.truthy(Resources.TestLambdaVersion67890QWERTY);
        t.is(Resources.TestLambdaVersion67890QWERTY.Properties.CodeSha256, '67890QWERTY');
        t.is(Outputs.TestLambdaFunctionQualifiedArn.Value.Ref, 'TestLambdaVersion67890QWERTY');

        t.truthy(Resources.AnotherLambdaVersion67890QWERTY);
        t.is(Resources.AnotherLambdaVersion67890QWERTY.Properties.CodeSha256, '67890QWERTY');
        t.is(Outputs.AnotherLambdaFunctionQualifiedArn.Value.Ref, 'AnotherLambdaVersion67890QWERTY');
    });
});
