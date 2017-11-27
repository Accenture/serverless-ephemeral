#!/bin/bash

build () {
  # Start virtual environment and install TensorFlow
  SOURCE=https://storage.googleapis.com/tensorflow/linux/cpu/tensorflow-${VERSION}-cp27-none-linux_x86_64.whl
  . /venv/bin/activate && pip install --upgrade --ignore-installed --no-cache-dir ${SOURCE} && deactivate

  # Add __init__.py to google dir to make it a package
  touch /venv/lib64/python2.7/site-packages/google/__init__.py

  # Remove unnecessary libraries to save space
  cd /venv/lib/python2.7/site-packages
  rm -rf easy_install* pip* setup_tools* wheel*

  # Remove *.so binaries to save space
  find /venv/lib/python2.7/site-packages -name "*.so" | xargs strip
  find /venv/lib64/python2.7/site-packages -name "*.so" | xargs strip

  # Zip libraries
  BUILD_DIR=/tmp/tensorflow

  mkdir -p $BUILD_DIR
  dirs=("/venv/lib/python2.7/site-packages/" "/venv/lib64/python2.7/site-packages/")

  for dir in "${dirs[@]}"
  do
    cd ${dir}
    zip -r9q ${BUILD_DIR}/${NAME} * --exclude \*.pyc
  done

  ls -l $BUILD_DIR
}

if [ -z "$VERSION" ]; then
  echo "No TensorFlow version provided"
  exit 1
elif [ -z "$NAME" ]; then
  echo "No filename provided"
  exit 1
else
  build
fi
