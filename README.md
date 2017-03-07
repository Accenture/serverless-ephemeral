# Serverless Ephemeral
This is a [Serverless Framework plugin](https://serverless.com/framework/docs/providers/aws/guide/plugins/) that helps bundling any stateless zipped library to the Lambda deployment artifact.

## Pre-requirements
* Node 6.9 or later

## Using the plugin
### Adding it to your project
1. Add these lines to your .gitignore file

    ```
    .ephemeral
    node_modules
    ```

2. Go to the root folder of your Serverless service and create a *package.json* with the following content:

    ```json
    {
      "devDependencies": {
        "serverless-ephemeral": "git+https://git@gitlab.com:alexleonescalera/serverless-ephemeral.git"
      }
    }
    ```
3. Run `npm install`
4. Add the plugin and exclussions to your `serverless.yml` file

    ```yml
        plugins:
            - serverless-ephemeral

        package:
            exclude:
                - package.json
                - .ephemeral/**
                - node_modules/**
    ```


### Configure the Ephemeral plugin
The configuration for the Ephemeral plugin is set inside the `custom` section of the serverless.yml file. In it, you can define the list of stateless libraries you wish to pull into the final Lambda artifact.

> The stateless libraries MUST be zip files

```yml
custom:
  ephemeral:
    libraries:
      - url: https://domain.com/library-A.zip
      - url: https://domain.com/library-B.zip
        forceDownload: true
```

- The **url** is mandatory, since it is the location where your zipped library is found
- **forceDownload** is optional. When set to *true*, it will download the library only the first time, saving a local copy and reusing it every time the service is deployed

### Deploying
5. Deploy your service normally with the `serverless deploy` (or `sls deploy`) command. If you use the `-v` option, Ephemeral will show more information about the process.

    ```bash
    sls deploy -v
    ```

    > Given the plugin bundles libraries, the final zipped asset size may increase considerable. Under slow connections, consider using the `AWS_CLIENT_TIMEOUT` environment variable (see https://github.com/serverless/serverless/issues/490#issuecomment-204976134)

### The .ephemeral directory
During the deployment process, a `.ephemeral` directory will be created. The purpose of this directory is:
* Saving the downloaded library zip files inside the `.ephemeral/lib` folder
* Bundling the libraries and the Serverless Lambda function file(s) inside the `.ephemeral/pkg` folder

---
## Development
This plugin is created with Node and uses the Serverless Framework hooks to execute the necessary actions.

### Installation
1. Clone this repository

    ```bash
    git clone git@gitlab.com:alexleonescalera/serverless-ephemeral.git
    ```

2. Install the node dependencies

    ```bash
    npm install
    ```

### Running Lint
The plugin code uses the AirBnB ESLint rule set with some enhancements (see `.eslintrc` file). To run the linter:

```bash
npm run lint
```

### Tests
The unit tests are coded with [Ava](https://github.com/avajs/ava) and [SinonJS](http://sinonjs.org/docs/). They can be found inside the `spec` folder. To run the tests:

```bash
npm test
```

To run tests on "watch" mode and add verbosity:

```
npm test -- --watch -v
```
# Serverless Ephemeral
This is a [Serverless Framework plugin](https://serverless.com/framework/docs/providers/aws/guide/plugins/) that helps bundling any stateless zipped library to the Lambda deployment artifact.

## Pre-requirements
* Node 6.9 or later

## Using the plugin
### Adding it to your project
1. Add these lines to your .gitignore file

    ```
    .ephemeral
    node_modules
    ```

2. Go to the root folder of your Serverless service and create a *package.json* with the following content:

    ```json
    {
      "devDependencies": {
        "serverless-ephemeral": "git+https://git@gitlab.com:alexleonescalera/serverless-ephemeral.git"
      }
    }
    ```
3. Run `npm install`
4. Add the plugin and exclussions to your `serverless.yml` file

    ```yml
        plugins:
            - serverless-ephemeral

        package:
            exclude:
                - package.json
                - .ephemeral/**
                - node_modules/**
    ```
### Configure the Ephemeral plugin
The configuration for the Ephemeral plugin is set inside the `custom` section of the serverless.yml file. In it, you can define the list of stateless libraries you wish to pull into the final Lambda artifact.

> The stateless libraries MUST be zip files

```
custom:
  ephemeral:
    libraries:
      - url: https://domain.com/library-A.zip
      - url: https://domain.com/library-B.zip
        forceDownload: true
```

- The **url** is mandatory, since it is the location where your zipped library is found
- **forceDownload** is optional. When set to *true*, it will download the library only the first time, saving a local copy and reusing it every time the service is deployed

### Deploying
5. Deploy your service normally with the `serverless deploy` (or `sls deploy`) command. If you use the `-v` option, Ephemeral will show more information about the process.

    ```bash
    sls deploy -v
    ```

    > Given the plugin bundles libraries, the final zipped asset size may increase considerable. Under slow connections, consider using the `AWS_CLIENT_TIMEOUT` environment variable (see https://github.com/serverless/serverless/issues/490#issuecomment-204976134)

### The .ephemeral directory
During the deployment process, a `.ephemeral` directory will be created. The purpose of this directory is:
* Saving the downloaded library zip files inside the `.ephemeral/lib` folder
* Bundling the libraries and the Serverless Lambda function file(s) inside the `.ephemeral/pkg` folder

---
## Development
This plugin is created with Node and uses the Serverless Framework hooks to execute the necessary actions.

### Installation
1. Clone this repository

    ```bash
    git clone git@gitlab.com:alexleonescalera/serverless-ephemeral.git
    ```

2. Install the node dependencies

    ```bash
    npm install
    ```

### Running Lint
The plugin code uses the AirBnB ESLint rule set with some enhancements (see `.eslintrc` file). To run the linter:

```bash
npm run lint
```

### Tests
The unit tests are coded with [Ava](https://github.com/avajs/ava) and [SinonJS](http://sinonjs.org/docs/). They can be found inside the `spec` folder. To run the tests:

```bash
npm test
```

To run tests on "watch" mode and add verbosity:

```
npm test -- --watch -v
```
