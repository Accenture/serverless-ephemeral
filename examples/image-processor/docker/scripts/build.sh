#!/bin/bash

# Start virtual environment and install Pillow and request
. /venv/bin/activate && pip install Pillow && deactivate
cd /venv/lib64/python2.7/site-packages

# Remove unnecessary libraries to save space
rm -rf easy_install* pip* setup_tools* setuptools* wheel*

# Zip libraries
output=/tmp/libs
mkdir -p ${output}
zip -r9q ${output}/image-processor.zip * --exclude \*.pyc
