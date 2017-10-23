# Building TensorFlow deployable package
TensorFlow is provided as a package that can be installed via `pip`. In order to use this package and its dependencies successfully as part of an AWS Lambda, they must be provided as a zip file.

> At the time of last update, the latest TensorFlow version is 1.3.0. Visit https://www.tensorflow.org/install/install_linux to get the latest version.

## 1. Create an EC2 instance
Lambdas are executed under a Public Amazon Linux AMI instance (see [Lambda Execution Environment](http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html)). Therefore, it is a good idea to use an Amazon Linux AMI instance (CentOS based) to create the TensorFlow deployable package. You can follow this [tutorial](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html) to create and run an EC2 instance. A `t2.micro` type is enough for this process.

> Note that AWS Instances come loaded with Python 2.7, so this guide will use that version.

## 2. Create a virtual environment
Once you have your EC2 instance running, you need to create a virtual environment. First, you need to install the pre-required libraries:

```bash
$ sudo yum -y install epel-release
$ sudo yum -y install gcc gcc-c++ python-pip python-devel atlas atlas-devel gcc-gfortran openssl-devel libffi-devel
```

Now that `pip` is installed, you can install the virtual environment tool:

```bash
$ pip install --upgrade virtualenv
```

You can now create a virtual environment. This will serve as an isolated environment to collect all the necessary libraries. For this example, we will create a virtual environment with the path `~/venvs/tensorflow`:

```bash
$ virtualenv ~/venvs/tensorflow
```

> Make sure that you **don't** use `sudo` when creating the virtual environment and/or using `pip`.

We can now start the environment:

```bash
$ source ~/venvs/tensorflow/bin/activate
```

> To exit the environment, call the `deactivate` command.

## 3. Install TensorFlow
We are now inside the virtual environment (you will notice the `(tensorflow)` prefix in the command line). *pip* and *wheel* were installed by default in your virtual environment; we are going to need them in order to install TensorFlow and its dependencies.

The first thing to do is upgrade *pip* to its latest version:

```bash
(tensorflow)$ pip install --upgrade pip
```

Then, we will install TensorFlow. This tutorial uses the Linux 64-bit, CPU only, Python 2.7 version. For full list of versions, look [here](https://www.tensorflow.org/get_started/os_setup):

```bash
(tensorflow)$ pip install --upgrade --ignore-installed --no-cache-dir https://storage.googleapis.com/tensorflow/linux/cpu/tensorflow-1.3.0-cp27-none-linux_x86_64.whl
```

## 4. Add init file to google module
In order to package all modules correctly, an `__init__.py` file must exist at the root of each. All of the installed modules contain one, except for the `google` module. Thus, you'll need to add an empty `__init.py__` file:

```bash
(tensorflow)$ touch $VIRTUAL_ENV/lib64/python2.7/site-packages/google/__init__.py
```

## 4.1. Remove unnecessary libraries
> **Warning:** this is an experimental step. Removing libraries is used to better comply with the AWS Lambda (unzipped) max size of 250 MB. The final product was tested versus several examples, but it doesn't ensure it will work with all implementations. If your final file size is not compromised, skip this step.

Libraries that don't seem to be used by TensorFlow are:
* `easy_install`
* `pip`
* `setup_tools`
* `wheel`

Therefore, they can be removed from the package.

```bash
(tensorflow)$ cd $VIRTUAL_ENV/lib/python2.7/site-packages
# back up site-packages folder
(tensorflow)$ cp -r . ../site-packages-backup
(tensorflow)$ rm -rf easy_install* pip* setup_tools* wheel*
```

## 5. Reduce binary sizes
By using the `strip` command, we can reduce the size of the *.so binary files in NumPy and Tensorflow. This will help complying with the AWS Lambda 250 MB max size.

```bash
(tensorflow)$ find $VIRTUAL_ENV/lib/python2.7/site-packages -name "*.so" | xargs strip
(tensorflow)$ find $VIRTUAL_ENV/lib64/python2.7/site-packages -name "*.so" | xargs strip
```

## 6. Zip the libraries
We can now zip the TensorFlow libraries. It is advised to use the best compression level, which will reduce the bundle size up to a fourth of its size. The Python compiled files are excluded to help reducing the size.

```bash
(tensorflow)$ pushd $VIRTUAL_ENV/lib/python2.7/site-packages/
(tensorflow)$ zip -r9q ~/tensorflow-0.12.1-cp27-none-linux_x86_64.zip * --exclude \*.pyc
(tensorflow)$ popd
(tensorflow)$ pushd $VIRTUAL_ENV/lib64/python2.7/site-packages/
(tensorflow)$ zip -r9q ~/tensorflow-0.12.1-cp27-none-linux_x86_64.zip * --exclude \*.pyc
(tensorflow)$ popd
```

## 7. Publish your zip file
Now you can publish your zip. You can use AWS CLI to put in an S3 bucket, or download it to your computer via scp command and manually upload to a storage service.


## Troubleshooting

### NumPy version

If when running your Lambda you get a `numpy.core.multiarray failed to import`, you will need to downgrade NumPy one minor version. For example, if you are having trouble with NumPy v1.12, you would downgrade to v1.11

```bash
(tensorflow)$ pip uninstall -y numpy
(tensorflow)$ pip install --ignore-installed --no-cache-dir https://pypi.python.org/packages/5e/d5/3433e015f3e4a1f309dbb110e8557947f68887fe9b8438d50a4b7790a954/numpy-1.11.2-cp27-cp27mu-manylinux1_x86_64.whl#md5=fa62a11922a9e0776963508fb5254d3d
```

Then you repeat steps 4 through 7.
running TensorFlow in Lambdas.

> You can find the NumPy wheel files here: https://pypi.python.org/pypi/numpy

### Step 5 `strip`

If you get a warning when `strip` is run against NumPy saying ` Not enough room for program headers`, just ignore it. This doesn't appear to cause issues when

## References
* http://www.slideshare.net/fabiandubois/tensorflow-in-production-with-aws-lambda
* http://hoolihan.net/blog-tim/2016/03/02/installing-tensorflow-on-centos/
* https://medium.com/@maebert/machine-learning-on-aws-lambda-5dc57127aee1
* https://www.tensorflow.org/get_started/os_setup
* https://pypi.python.org/pypi/numpy/1.11.2

