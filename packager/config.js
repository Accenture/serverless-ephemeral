module.exports = {
    tensorflow: {
        requiredOpts: ['version'],
        dir: '/tmp/tensorflow',
        logMessage: opts => `Building TensorFlow v${opts.version}`,
    },

    // TODO: change approach
    __custom: {
        requiredOpts: ['container', 'output'],
    },
};
