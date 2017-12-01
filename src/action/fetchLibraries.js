/**
 * Downloads all the Ephemeral Python dependencies and appends the Serverless Lambda artifacts
 */
const BbPromise = require('bluebird');
const shell = require('shelljs');

const del = require('del');
const fs = require('fs');
const path = require('path');
const request = require('request');
const parse = require('url-parse');
const _ = require('underscore');
const { rtrim } = require('underscore.string');

const Util = {
    fs: null,
};

Util.fs = require('../util/fs');

// Initialize shell as silent
shell.config.silent = true;

// TODO: create configuration strategy
const PACKAGERS = {
    tensorflow: {
        container: {
            outputDir: '/tmp/tensorflow',
        },
        requiredOpts: ['version'],
        logMessage: opts => `Building TensorFlow v${opts.version}`,
    },
    __custom: {
        requiredOpts: ['container', 'output'],
    },
};

// Initialize shell as silent
shell.config.silent = true;

module.exports = {
    /**
     * Checks if the libraries zip exists locally
     * @param {Object} config - library configuration
     * @returns Promise
     */
    checkForLibrariesZip (config) {
        if (config.forceDownload) {
            this.serverless.cli.log('Option "forceDownload" is deprecated. Please use "nocache" instead');
            config.nocache = config.forceDownload;
        }

        if (config.nocache) {
            del.sync(config.file.path);

            config.refetch = true;
            return BbPromise.resolve(config);
        }

        return new BbPromise((resolve, reject) => {
            Util.fs.onPathExists(config.file.path,
                () => {
                    // if dependencies exist, do not fetch
                    config.refetch = false;
                    this.serverless.cli.vlog(`Using local copy of ${config.file.name}`);
                    resolve(config);
                },
                () => {
                    // if dependencies do not exist, fetch (i.e. build or download)
                    config.refetch = true;
                    resolve(config);
                },
                (accessError) => {
                    this.serverless.cli.log(`Error checking for library ${config.file.name}`);
                    reject(accessError);
                }
            );
        });
    },

    /**
     * Creates a custom directory inside package dir if specified by user
     * @param {Object} config - library configuration
     * @returns Promise
     */
    createCustomDirectory (config) {
        config.destinationPath = this.ephemeral.paths.pkg;

        let dir = config.directory || '';
        dir = dir.trim();

        // validate entered directory
        if (dir.length) {
            if (!/^[A-Za-z0-9._-]+$/.test(dir)) {
                return Promise.reject('Directory name can only include alphanumeric characters and symbols -_.');
            }

            dir = `/${rtrim(dir, '/')}`;
        }

        // append directory to path
        config.destinationPath += dir;

        // create directory if it doesn't exist
        try {
            fs.mkdirSync(config.destinationPath);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                return Promise.reject(`Unexpected error creating directory ${config.destinationPath}`);
            }
        }

        return Promise.resolve(config);
    },

    /**
     * Decides whether to download or fetch a package definition and build
     * @param {Object} config - library configuration
     * @returns Promise
     */
    fetchLibrary (config) {
        if (!config.refetch) {
            return BbPromise.resolve(config);
        }

        if (config.build !== undefined) {
            return this.buildLibraryZip(config);
        }

        return this.downloadLibraryZip(config);
    },

    /**
     * Validates the configuration for building the library on runtime
     * @param {Object} buildConfig - Build configuration
     * @returns Error | null
     */
    validateBuildConfiguration (buildConfig) {
        if (!shell.which('docker') || !shell.which('docker-compose')) {
            return new Error('Docker not found on host machine. Please install it to proceed.');
        }

        const isCustom = buildConfig.path && !buildConfig.name;
        let opts = Object.assign({}, buildConfig);

        if (isCustom) {
            if (!/\.ya?ml/g.test(buildConfig.path)) {
                return new Error(`${buildConfig.path} is not a Docker compose file`);
            }

            delete opts.path;
        } else {
            const keys = Object.keys(PACKAGERS);

            if (keys.indexOf(buildConfig.name) === -1) {
                return new Error(`The packager "${buildConfig.name}" is not available. Please use one of the following: ${keys.join(', ')}`);
            }

            delete opts.name;
        }

        opts = Object.keys(opts);
        const name = buildConfig.name || '__custom';
        const missing = _.difference(PACKAGERS[name].requiredOpts, opts);

        if (missing.length > 0) {
            return new Error(`The following required options were not provided: ${missing.join(', ')}`);
        }

        return null;
    },

    /**
     * Builds the library via a Serverless Ephemeral provided packager
     * @param {Object} config - library configuration
     * @returns Promise
     */
    buildViaProvidedPackager (config) {
        const packager = PACKAGERS[config.build.name];

        if (packager.logMessage) {
            this.serverless.cli.log(packager.logMessage(config.build));
        }

        if (this.serverless.cli.isVerbose()) {
            shell.config.silent = false;
        }

        return new Promise((resolve, reject) => {
            shell.pushd(path.resolve(__dirname, `../../packager/${config.build.name}`));
            const build = shell.exec('docker-compose build', { async: true });
            build.on('error', err => reject(err));
            build.on('close', () => {
                const volume = `${this.serverless.config.servicePath}/${this.ephemeral.paths.lib}:${packager.container.outputDir}`;

                const envVars = packager.requiredOpts.map(opt => `-e ${opt}='${config.build[opt]}'`);
                envVars.push(`-e name='${config.file.name}'`);
                envVars.push(`-e output_dir='${packager.container.outputDir}'`);

                const command = `docker-compose run -v ${volume} ${envVars.join(' ')} packager`;
                const run = shell.exec(command, { async: true });
                run.on('error', err => reject(err));
                run.on('close', () => {
                    shell.exec('docker-compose rm -f packager');
                    shell.popd();
                    resolve(config);
                });
            });
        });
    },

    /**
     * Builds the library via a custom packager
     * @param {Object} config - library configuration
     * @returns Promise
     */
    buildViaCustomPackager (config) {
        return new Promise((resolve, reject) => {
            let composePath = config.build.path.substring(0, config.build.path.lastIndexOf('/')) || '.';
            composePath = path.resolve(`./${composePath.replace(/^\.\//, '')}`);

            shell.pushd(composePath);
            const build = shell.exec('docker-compose build', { async: true });
            build.on('error', err => reject(err));
            build.on('close', () => {
                const outputDir = () => {
                    const tokens = config.build.output.split('/');
                    tokens.pop();
                    return tokens.join('/');
                };

                const volume = `${this.serverless.config.servicePath}/${this.ephemeral.paths.lib}:${outputDir}`;
                const command = `docker run -v ${volume} ${config.build.container}`;
                const run = shell.exec(command, { async: true });
                run.on('error', err => reject(err));
                run.on('close', () => {
                    shell.popd();
                    resolve(config);
                });
            });
        });
    },

    /**
     * Builds the library zip
     * @param {Object} config - library configuration
     * @returns Promise
     */
    buildLibraryZip (config) {
        const error = this.validateBuildConfiguration(config.build);

        if (error !== null) {
            return Promise.reject(error);
        }

        // TODO: pending refinement
        // if (config.build.path) {
        //     return this.buildViaCustomPackager(config);
        // }

        return this.buildViaProvidedPackager(config);
    },

    /**
     * Downloads the external libraries zip
     * @param {Object} config - library configuration
     * @returns Promise
     */
    downloadLibraryZip (config) {
        return new BbPromise((resolve, reject) => {
            this.serverless.cli.log(`Downloading ${config.url}`);

            const req = request(config.url);

            req.on('error', (error) => {
                this.serverless.cli.log('Error downloading');
                reject(error);
            });

            const output = req.pipe(fs.createWriteStream(config.file.path));

            output.on('finish', () => {
                resolve(config);
            });

            output.on('error', (error) => {
                this.serverless.cli.log('Error creating zip file');
                reject(error);
            });
        });
    },

    /**
     * Unzips libraries to the package directory
     * @param {Object} config - library configuration
     * @returns Promise
     */
    unzipLibraryToPackageDir (config) {
        return Util.fs.unzip(
            config.file.path,
            config.destinationPath,
            this.serverless.cli.vlog,
            { before: `Extracting ${config.file.name} to ${config.destinationPath}` }
        );
    },

    /**
     * Generates the library name
     * @param {Object} config - library configuration
     * @returns string
     */
    generateLibName (config) {
        let name;

        if (config.url) {
            name = `${parse(config.url).pathname.match(/([^/]+)(?=\.\w+$)/)[0]}`;
        } else if (config.build.name) {
            switch (config.build.name) {
                case 'tensorflow':
                default:  // TODO: modify default as more packages are introduced
                    name = `${config.build.name}-${config.build.version}`;
                    break;
            }
        } else if (config.build.path) {
            name = `${config.build.output.match(/([^/]+)(?=\.\w+$)/)[0]}`;
        }

        name += '.zip';

        return name;
    },

    /**
     * Pulls the path and zip file name for better usability
     * @param {Object} config - library configuration
     * @returns Promise
     */
    prepareLibConfig (libConfig) {
        const name = this.generateLibName(libConfig);
        const filePath = `${this.ephemeral.paths.lib}/${name}`;

        libConfig = Object.assign({}, libConfig, {
            file: { name, path: filePath },
        });

        return libConfig;
    },

    fetchLibraries () {
        const libs = this.ephemeral.config.libraries;
        const promises = [];

        libs.forEach((libConfig) => {
            const promise = this.checkForLibrariesZip(this.prepareLibConfig(libConfig))
                .then(this.createCustomDirectory.bind(this))
                .then(this.fetchLibrary.bind(this))
                .then(this.unzipLibraryToPackageDir.bind(this));

            promises.push(promise);
        });

        return BbPromise.all(promises);
    },
};
