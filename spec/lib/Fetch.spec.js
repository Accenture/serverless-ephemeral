const test = require('ava');
const proxyquire = require('proxyquire');

const Fetch = proxyquire('../../src/lib/Fetch', {
    '../util/FilePath': function FilePath (dir) {
        this.dir = dir;
    },
});

const serverless = {
    cli: {},
};

const ephemeral = {
    paths: {
        pkg: '.ephemeral/pkg',
    },
};

test('Create a Fetch instance', (t) => {
    const fetch = new Fetch(serverless, ephemeral, {});
    t.is(fetch.serverless, serverless);
    t.is(fetch.ephemeral, ephemeral);
    t.is(fetch.file, null);
    t.true(fetch.useCached);
    t.is(fetch.unzipped.dir, '.ephemeral/pkg');
});

test('Create a Fetch instance with no cache', (t) => {
    const fetch = new Fetch(serverless, ephemeral, { useCached: false });
    t.false(fetch.useCached);
});

test('Adds directories to the path', (t) => {
    const fetch = new Fetch(serverless, ephemeral, {});
    fetch.addDirectory('lib/package');
    t.is(fetch.unzipped.dir, '.ephemeral/pkg/lib/package');
});

test('Throws error when calling the fetch method', (t) => {
    const fetch = new Fetch(serverless, ephemeral, {});
    const error = t.throws(() => fetch.fetch());
    t.is(error.message, '"fetch" must be implemented in child class');
});
