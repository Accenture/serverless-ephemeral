module.exports = {
    addLocalLdLibraryPath () {
        let ldPaths = [];
        for (let i = 0; i < this.ephemeral.config.libraries.length; i += 1) {
            if (typeof (this.ephemeral.config.libraries[i].local_ld_library_path) === 'string') {
                ldPaths.push(this.ephemeral.config.libraries[i].local_ld_library_path);
            } else if (Array.isArray(this.ephemeral.config.libraries[i].local_ld_library_path)) {
                ldPaths = ldPaths.concat(this.ephemeral.config.libraries[i].local_ld_library_path);
            }
        }

      // from https://github.com/serverless/serverless/blob/4b71faf2128308894646940ce2fb64e826450972/lib/plugins/aws/invokeLocal/index.js#L95
      // LD_LIBRARY_PATH is hardcoded
        const awsLibs = '/usr/local/lib64/node-v4.3.x/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib';
        ldPaths = ldPaths.concat(awsLibs.split(':'));

      // in order to override it, we should inject it into functionObj.environment
      // it is then merged in https://github.com/serverless/serverless/blob/4b71faf2128308894646940ce2fb64e826450972/lib/plugins/aws/invokeLocal/index.js#L111
      // it is not the most elegant way but this tricks do the job for now

        this.options.functionObj = this.serverless.service.getFunction(this.options.function);

        if (!this.options.functionObj.environment) {
            this.options.functionObj.environment = {};
        }
        this.options.functionObj.environment.LD_LIBRARY_PATH = ldPaths.join(':');
        return Promise.resolve();
    },
};
