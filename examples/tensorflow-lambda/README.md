# AWS Lambda with TensorFlow
This is a demo that integrates [Tensorflow](https://www.tensorflow.org/) with AWS Lambda.

## Requirements

* An AWS account

## Get started
Once inside this example's directory, install Serephem.

```bash
$ npm i
```

## Deploy
The Serephem plugin will take care of retrieving all the TensorFlow dependencies and injecting them into the Serverless Lambdas zip artifact prior to deploying to AWS.

Make sure you configure the `serverless.yml` file to your necessities before deploying (i.e. `region`, `stage`, `profile`...)

```bash
$ sls deploy -v
```

> Remember to run `sls remove` when finished with this demo.

## Lambdas
This project features 2 Lambdas:
* A TensorFlow addition of two numbers
* A NumPy that prints properties of a matrix

### Tensorflow add
#### File
`tensorflow_test.py`

#### Description
It uses the TensorFlow library to add two integer numbers.

#### Input
Two integer numbers *a*  and *b*. The Lambda test event JSON looks as follows:

```json
{
  "a": 30,
  "b": 90
}
```

#### Result
The Lambda will add those numbers using the [`tf.add`](https://www.tensorflow.org/api_docs/python/math_ops/arithmetic_operators#add) function. The result looks as follows:

```json
{
  "message": "TensorFlow \"add\" function test: 30 + 90",
  "result": "120"
}
```

### NumPy matrix properties
The TensorFlow package includes NumPy, since it is a dependency.

#### File
`numpy_test.py`

#### Description
Creates a 2x3 matrix of integers and returns some of its NumPy properties.

#### Input
None.

#### Result

```json
{
  "message": "NumPy test",
  "event": {},
  "attrs": {
    "ndim": 2,
    "itemsize": 8,
    "dtype.name": "int64",
    "size": 6
  }
}
```

## Local testing of Serephem plugin

In case you want to use this example to locally test the Serephem plugin, you can do the following:

1. Open a new terminal window and go to the Serephem root folder

1. Run `npm link`

1. Return to the terminal window for the `tensorflow-lambda` example

1. Run `npm link serverless-ephemeral`

1. Run `sls package -v` to see your changes

