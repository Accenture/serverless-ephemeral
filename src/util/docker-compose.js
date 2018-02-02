const shell = require('shelljs');

const validate = () => {
    if (!shell.which('docker') || !shell.which('docker-compose')) {
        throw new Error('Docker not found on host machine. Please install it to proceed.');
    }

    return true;
};

const execPromise = (cmd) => {
    let stderr = '';

    const exe = shell.exec(cmd, { async: true });

    exe.stderr.on('data', (data) => {
        stderr += data;
    });

    return new Promise((resolve, reject) => {
        exe.on('error', err => reject(err));

        exe.on('close', (code) => {
            if (typeof code === 'number' && code > 0) {
                return reject(new Error(`Command '${cmd}' exited with code ${code} \n\n${stderr}`));
            }
            return resolve();
        });
    });
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
        return execPromise('docker-compose build');
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
        return execPromise(`${command.join(' ')} ${container}`);
    },

    rm (container) {
        validate();
        return execPromise(`docker-compose rm -f ${container}`);
    },
};
