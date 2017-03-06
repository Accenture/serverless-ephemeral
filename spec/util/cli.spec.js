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

test('Logs a message when verbosity is true', (t) => {
    util.serverless.processedInput.options.verbose = true;

    util.vlog('A message');

    t.true(util.serverless.cli.log.calledWith('A message'));
});

test('Doesn\'t log a message when verbosity if false', (t) => {
    util.serverless.processedInput.options.verbose = false;

    util.vlog('A message');

    t.false(util.serverless.cli.log.called);
});
