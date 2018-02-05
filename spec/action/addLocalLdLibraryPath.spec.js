const test = require('ava');

const action = require('../../src/action/addLocalLdLibraryPath');

function initServerlessValues (act) {
    act.options = {};

    act.serverless = {
        service: {
            getFunction () {
                return {
                };
            },
        },
    };
}

function initEphemeralValues (act) {
    act.ephemeral = {
        config: {
            libraries: [{
                local_ld_library_path: '/usr/local/cuda/lib64',
            }, {
                local_ld_library_path: ['/usr/local/foo/bar', '/usr/local/bar/foo'],
            }],
        },
    };
}

test.before(() => {
    initEphemeralValues(action);
    initServerlessValues(action);
});


test('Add LD_LIBRARY_PATH to function environment variables', t => action.addLocalLdLibraryPath().then(() => {
    t.is(action.options.functionObj.environment.LD_LIBRARY_PATH, '/usr/local/cuda/lib64:/usr/local/foo/bar:/usr/local/bar/foo:/usr/local/lib64/node-v4.3.x/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib');
}));
