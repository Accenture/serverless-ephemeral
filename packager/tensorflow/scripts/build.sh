#!/bin/bash

build () {
  # Start virtual environment and install TensorFlow
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
  NAME="${SOURCE##*/}"  # remove domain and path
  NAME=${NAME%.*}       # remove file extension

  echo $NAME

  mkdir -p $BUILD_DIR
  dirs=("/venv/lib/python2.7/site-packages/" "/venv/lib64/python2.7/site-packages/")

  for dir in "${dirs[@]}"
  do
    cd ${dir}
    zip -r9q ${BUILD_DIR}/${NAME}.zip * --exclude \*.pyc
  done

  ls -l $BUILD_DIR
}

if curl --output /dev/null --silent --head --fail "$SOURCE"; then
  build
else
  echo "The provided source was not found: $SOURCE"
  exit 1
fi

