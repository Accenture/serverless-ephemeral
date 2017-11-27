# Serverless Ephemeral

This is a [Serverless Framework plugin](https://serverless.com/framework/docs/providers/aws/guide/plugins/) that helps bundling any stateless library into the Lambda deployment artifact.

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]

## Pre-requirements
* Node >= 6.9
* Serverless Framework >= 1.12.0
* Docker (with docker compose)

## Examples
* [TensorFlow Lambda](examples/tensorflow-lambda): Uses Serverless Ephemeral to pull in a packaged TensorFlow (see [docs/build-tensorflow-package.md](docs/build-tensorflow-package.md)) and add the library to Python Lambdas.

## Using the plugin

### Add it to your project
1. Install the plugin

    ```
    npm i --save-dev serverless-ephemeral
    ```

1. Add the plugin to your `serverless.yml` file and exclude the `.ephemeral` directory

    ```yml
        plugins:
            - serverless-ephemeral

        package:
            exclude:
                - package.json
                - package-lock.json
                - node_modules/**
                - .ephemeral/**
    ```

1. Add the `.ephemeral` directory to `.gitignore`

```
# Serverless Framework
.serverless
.ephemeral
```


### Configure the Ephemeral plugin
The configuration for the Ephemeral plugin is set inside the `custom` section of the `serverless.yml` file. In it, you can define the list of stateless libraries you wish to pull into the final Lambda artifact.

There are two types of configuration:
* Build a provided package on runtime
* Download a package

#### Build a provided package

Serverless ephemeral provides packagers powered by Docker. Currently, only a TensorFlow Lambda packager is available; more general use packages will be provided in the future.

```yml
custom:
  ephemeral:
    libraries:
      - build: tensorflow
        version: 1.4.0
```

- **build** is mandatory. This is the ID of the package to use. The value must be one of the following:
    - **tensorflow**

- **version** is mandatory. This will determine which version of the package you want to build.

#### Download a package

```yml
custom:
  ephemeral:
    libraries:
      - url: https://xxxxx.s3.amazonaws.com/tensorflow-1.3.0-cp27-none-linux_x86_64.zip
```

- **url** is mandatory. This is the packaged library you want to include. The library must be a zip file.

> Documentation explaining how to create the deployable TensorFlow zipped package can be found here: [docs/build-tensorflow-package.md](docs/build-tensorflow-package.md). This approach can be used as a base to create other stateless libraries.

#### Global options

```yml
custom:
  ephemeral:
    libraries:
      - build: tensorflow
        version: 1.4.0
        directory: tfpackage
      - url: https://xxxxx.s3.amazonaws.com/boto3.zip
        nocache: true
```

- **directory** is optional. When ommitted, the package contents will be unzipped at service root level. If entered, a new folder will be created at that level using the specified name and everything will be unzipped there. The folder can only be named using alphanumeric characters and the symbols `. _ -`

- **nocache** is optional. When ommitted or set to *false*, it will use the locally cached copy of the library. Otherwise, if set to *true*, it will re-fetch (download or build) the library every time the service is packaged.

    > Note: the **forceDownload** option has been deprecated as of version 0.6.0 and will be completely removed on future versions. Use **nocache** instead.

### Deploying
5. Deploy your service normally with the `serverless deploy` (or `sls deploy`) command. If you use the `-v` option, Ephemeral will show more information about the process.

    ```bash
    sls deploy -v
    ```

    > If the Serverless deployment is timing out, use the `AWS_CLIENT_TIMEOUT` environment variable: https://github.com/serverless/serverless/issues/490#issuecomment-204976134

### The .ephemeral directory
During the deployment process, the `.ephemeral` directory will be created. The purpose of this directory is:
* Saving the libraries' zip files inside the `.ephemeral/lib` folder
* Bundling the libraries and the Serverless Lambda function file(s) inside the `.ephemeral/pkg` folder

---
## Development
This plugin is created with Node and uses the Serverless Framework hooks to execute the necessary actions.

### Installation
1. Clone this repository

    ```bash
    git clone https://github.com/Accenture/serverless-ephemeral.git
    ```

2. Install the node dependencies

    ```bash
    npm i
    ```

### Running Lint
The plugin code uses the AirBnB ESLint rule set with some enhancements (see `.eslintrc` file). To run the linter:

```bash
npm run lint
```

### Tests
The unit tests are coded with [Ava](https://github.com/avajs/ava) and [SinonJS](http://sinonjs.org/docs/). They can be found inside the `spec` folder.

To run the tests:

```bash
npm test
```

To run tests on "watch" mode and add verbosity:

```
npm test -- --watch -v
```

[npm-image]: https://img.shields.io/npm/v/serverless-ephemeral.svg
[npm-url]: https://npmjs.org/package/serverless-ephemeral
[travis-image]: https://img.shields.io/travis/Accenture/serverless-ephemeral/master.svg
[travis-url]: https://travis-ci.org/Accenture/serverless-ephemeral
