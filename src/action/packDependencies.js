/**
 * Packages all the libraries into the Serverless bundle
 */
const archiver = require('archiver');
const BbPromise = require('bluebird');
const del = require('del');
const fs = require('fs');

const Util = {
    fs: null,
};

Util.fs = require('../util/fs');

module.exports = {
    /**
     * Zips the package
     */
    zipPackage () {
        return new BbPromise((resolve, reject) => {
            this.serverless.cli.vlog(`Zipping package on ${this.ephemeral.paths.pkg}`);

            const output = fs.createWriteStream(this.serverless.service.package.artifact);
            const archive = archiver('zip');

            output.on('open', () => {
                archive.pipe(output);
                archive.directory(this.ephemeral.paths.pkg, '/');
                archive.finalize();
            });

            output.on('close', () => {
                resolve();
            });

            output.on('error', (error) => {
                this.serverless.cli.log('Error zipping package');
                reject(error);
            });
        });
    },

    /**
     * Updates the CloudFormation Lambdas' hash that reflects the updated package
     */
    updateLambdasHash () {
        this.serverless.cli.vlog('Recalculating Lambdas version');

        const { Outputs, Resources } =
            this.serverless.service.provider.compiledCloudFormationTemplate;

        const namingService = this.serverless.getProvider('aws').naming;
        const getLambdaVersionLogicalId =
            namingService.getLambdaVersionLogicalId.bind(namingService);

        const newHash = Util.fs.calculateFileHash(this.serverless.service.package.artifact);

        Object.keys(Resources).forEach((key) => {
            const Resource = Object.assign({}, Resources[key]);

            if (Resource.Type === 'AWS::Lambda::Version') {
                delete Resources[key];

                const functionName =
                    Resource.Properties.FunctionName.Ref.replace(namingService.getLambdaLogicalIdRegex(), '');
                const newVersionLogicalId = getLambdaVersionLogicalId(functionName, newHash);

                // update the AWS::Lambda::Version resource
                Resources[newVersionLogicalId] = Resource;
                Resources[newVersionLogicalId].Properties.CodeSha256 = newHash;

                // update Outputs Lambda Qualified Arn reference
                Outputs[`${Resource.Properties.FunctionName.Ref}QualifiedArn`].Value.Ref = newVersionLogicalId;
            }
        });

        return BbPromise.resolve();
    },

    packDependencies () {
        return del(this.serverless.service.package.artifact)
            .then(this.zipPackage.bind(this))
            .then(this.updateLambdasHash.bind(this));
    },
};
