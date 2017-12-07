const test = require('ava');
const proxyquire = require('proxyquire');

const PackagerFactory = proxyquire('../../../src/lib/packager/Factory', {
    './tensorflow': function TensorFlow (s, e, o) {
        this.name = o.name;
    },
    './custom': function CustomPackager (s, e, o) {
        this.name = o.name;
    },
});

test('Pick a TensorFlow packager', (t) => {
    const packager = PackagerFactory.build('serverless', 'ephemeral', { name: 'tensorflow' });
    t.is(packager.name, 'tensorflow');
});

test('Pick a custom packager', (t) => {
    const packager = PackagerFactory.build('serverless', 'ephemeral');
    t.is(packager.name, '__custom');
});
