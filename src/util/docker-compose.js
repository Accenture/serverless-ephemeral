const shell = require('shelljs');

const validate = () => {
    if (!shell.which('docker') || !shell.which('docker-compose')) {
        throw new Error('Docker not found on host machine. Please install it to proceed.');
    }
};

module.exports = {
    /**
     * Validates Docker is installed
     * @throws Error if docker is not installed
     */
    validate () {
        return validate();
    },

    /**
     * Calls docker-compose build command
     * @returns Promise
     */
    build () {
        validate();

        const build = shell.exec('docker-compose build', { async: true });

        return new Promise((resolve, reject) => {
            build.on('error', err => reject(err));
            build.on('close', () => resolve());
        });
    },

    /**
     * Calls docker-compose run command
     * @param {string} container - name of the Docker container
     * @param {Object} options
     * @param {string} options.volume - Docker volume to mount
     * @param {Object} options.environment - Key-value pairs for environment variables
     * @returns Promise
     *
     * @example
    *      dockerCompose.run({
    *          volume: '/host/dir:/container/dir',
    *          environment: {
    *              foo: 'var',
    *              baz: 5
    *          }
    *      });
    */
    run (container, options = {}) {
        validate();

        let command = ['docker-compose run'];

        if (options.volume) {
            command.push(`-v ${options.volume}`);
        }

        if (options.environment) {
            const envs = options.environment;
            command = command.concat(
                Object.keys(envs).map(env => `-e '${env}=${envs[env]}'`)
            );
        }

        const run = shell.exec(`${command.join(' ')} ${container}`, { async: true });

        return new Promise((resolve, reject) => {
            run.on('error', err => reject(err));
            run.on('close', () => resolve());
        });
    },

    rm (container) {
        validate();

        const remove = shell.exec(`docker-compose rm -f ${container}`, { async: true });
        return new Promise((resolve, reject) => {
            remove.on('error', err => reject(err));
            remove.on('close', () => resolve());
        });
    },
};
