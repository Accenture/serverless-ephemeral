FROM amazonlinux

# Install Python dependencies
RUN yum -y install epel-release && yum -y install \
      gcc \
      gcc-c++ \
      python-devel \
      atlas \
      atlas-devel \
      gcc-gfortran \
      openssl-devel \
      libffi-devel \
      findutils.x86_64 \
      perl-File-pushd.noarch \
      zip

# Install pip
RUN curl -O https://bootstrap.pypa.io/get-pip.py && \
    python get-pip.py && \
    rm get-pip.py

# Install and run virtualenv
RUN pip install --upgrade virtualenv

RUN virtualenv -p /usr/bin/python /venv

COPY scripts/build.sh scripts/build.sh

RUN chmod +x scripts/build.sh

CMD [ "scripts/build.sh", "https://storage.googleapis.com/tensorflow/linux/cpu/tensorflow-1.4.0-cp27-none-linux_x86_64.whl" ]
