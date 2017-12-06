# Serverless Ephemeral

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]

![Serephem](img/logo192.png)

Serverless Ephemeral (or Serephem) is a [Serverless Framework plugin](https://serverless.com/framework/docs/providers/aws/guide/plugins/) that helps bundling any stateless library into the Lambda deployment artifact.

## Pre-requirements
* Node >= 6.9
* Serverless Framework >= 1.12.0
* Docker (with docker compose)

## Examples
* [TensorFlow Lambda](examples/tensorflow-lambda): Uses Serverless Ephemeral to pull in a packaged TensorFlow (see [docs/build-tensorflow-package.md](docs/build-tensorflow-package.md)) and add the library to Python Lambdas.

## Add the plugin
1. Install it

    ```bash
    npm i --save-dev serverless-ephemeral
    ```

1. Add it to your `serverless.yml` file and exclude the `.ephemeral` directory

    ```yaml
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

```text
# Serverless Framework
.serverless
.ephemeral
```


## Configuration
The configuration for the Ephemeral plugin is set inside the `custom` section of the `serverless.yml` file. In it, you can define the list of stateless libraries you wish to pull into the final Lambda artifact.

There are two types of configuration:
* [Build a library during runtime](#build-a-library)
* [Download a library](#download-a-library)

Both can be enhanced with [global configuration options](#global-options).

### Build a library

You can build a specific library during runtime. This is achieved via a Docker container that outputs a zip library.

#### Serverless Ephemeral packagers

You can use one of the Docker packagers provided with the Serverless Ephemeral plugin.

##### TensorFlow

```yaml
custom:
  ephemeral:
    libraries:
      - packager:
          name: tensorflow
          version: 1.4.0
```

- **packager.name** is required. This is the packager name identifier for TensorFlow: **tensorflow**
- **packager.version** is required. This will determine which TensorFlow version you want to build.

### Download a library

```yaml
custom:
  ephemeral:
    libraries:
      - url: https://xxxxx.s3.amazonaws.com/tensorflow-1.3.0-cp27-none-linux_x86_64.zip
```

- **url** is required. This is the packaged library you want to include. The library must be a zip file.

> Documentation explaining how to create the deployable TensorFlow zipped package can be found here: [docs/build-tensorflow-package.md](docs/build-tensorflow-package.md). This approach can be used as a base to create other stateless libraries.

### Global options

```yaml
custom:
  ephemeral:
    libraries:
      - packager:
          name: tensorflow
          version: 1.4.0
        directory: tfpackage
      - url: https://xxxxx.s3.amazonaws.com/boto3.zip
        nocache: true
```

- **directory** is optional. When ommitted, the package contents will be unzipped at service root level. If entered, a new folder will be created at that level using the specified name and everything will be unzipped there. The folder can only be named using alphanumeric characters and the symbols `. _ -`

- **nocache** is optional. When ommitted or set to *false*, it will use the locally cached copy of the library. Otherwise, if set to *true*, it will re-fetch (download or build) the library every time the service is packaged.

    > Note: the **forceDownload** option has been deprecated in favor of **nocache**

## Deploy
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
## Contribute
This plugin is created with Node and uses the Serverless Framework hooks to execute the necessary actions.

### Installation
1. Clone this repository

    ```bash
    git clone https://github.com/Accenture/serverless-ephemeral.git
    ```

1. Install the node dependencies

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

```bash
npm test -- --watch -v
```

[npm-image]: https://img.shields.io/npm/v/serverless-ephemeral.svg
[npm-url]: https://npmjs.org/package/serverless-ephemeral
[travis-image]: https://img.shields.io/travis/Accenture/serverless-ephemeral/master.svg
[travis-url]: https://travis-ci.org/Accenture/serverless-ephemeral

### Test via examples

Refer to the [`examples`](examples) directory, for instance the [`TensorFlow example`](examples/tensorflow-lambda/README.md).