#!/bin/bash

BUILD_DIR=/tmp/tensorflow

usage () {
  echo "Usage: $0 -v <version> -o <outputdir>\n\nExample:\n\t$0 -v 1.4.0 -o /tmp/tensorflow" 1>&2
  exit 1
}

download () {
  VERSION=$1
  NAME=tensorflow-${VERSION}-cp27-none-linux_x86_64
  WHEEL=https://storage.googleapis.com/tensorflow/linux/cpu/${NAME}.whl

  if curl --output /dev/null --silent --head --fail "$WHEEL"; then
    build
  else
    echo "The provided version does not exist: $VERSION"
    exit 1
  fi
}

build () {
  # Start virtual environment and install TensorFlow
  . /venv/bin/activate && pip install --upgrade --ignore-installed --no-cache-dir ${WHEEL} && deactivate

  # Add __init__.py to google dir to make it a package
  touch /venv/lib64/python2.7/site-packages/google/__init__.py

  # Remove unnecessary libraries to save space
  cd /venv/lib/python2.7/site-packages
  rm -rf easy_install* pip* setup_tools* wheel*

  # Remove *.so binaries to save space
  find /venv/lib/python2.7/site-packages -name "*.so" | xargs strip
  find /venv/lib64/python2.7/site-packages -name "*.so" | xargs strip

  # Zip libraries
  mkdir -p $BUILD_DIR
  dirs=("/venv/lib/python2.7/site-packages/" "/venv/lib64/python2.7/site-packages/")

  for dir in "${dirs[@]}"
  do
    cd ${dir}
    zip -r9q ${BUILD_DIR}/${NAME}.zip * --exclude \*.pyc
  done
}

while getopts ":v:" o; do
  case "${o}" in
    v)
      v=${OPTARG}
      ;;
    *)
      usage
      ;;
  esac
done
shift $((OPTIND-1))

if [ -z "${v}" ]; then
  usage
else
  download ${v}
fi

