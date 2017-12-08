const test = require('ava');
const sinon = require('sinon');

const util = require('../../src/util/cli');

test.beforeEach(() => {
    util.serverless = {
        cli: {
            log: sinon.stub(),
        },
        processedInput: {
            options: {
                verbose: null,
            },
        },
    };
});

test('Console is verbose', (t) => {
    util.serverless.processedInput.options.verbose = true;
    t.true(util.isVerbose());
});

test('Console is not verbose', (t) => {
    util.serverless.processedInput.options.verbose = false;
    t.false(util.isVerbose());
});

test('Logs a message when verbosity is true', (t) => {
    util.serverless.cli.isVerbose = () => true;
    util.vlog('A message');
    t.true(util.serverless.cli.log.calledWith('A message'));
});

test('Doesn\'t log a message when verbosity if false', (t) => {
    util.serverless.cli.isVerbose = () => false;

    util.vlog('A message');

    t.false(util.serverless.cli.log.called);
});

test('Debug a message when SLS_DEBUG is set', (t) => {
    process.env.SLS_DEBUG = '1';
    util.debug('A debug message');
    t.true(util.serverless.cli.log.calledWith('A debug message'));
    delete process.env.SLS_DEBUG;
});

test('Do not debug a message when SLS_DEBUG not set', (t) => {
    util.debug('A debug message');
    t.false(util.serverless.cli.log.called);
});
