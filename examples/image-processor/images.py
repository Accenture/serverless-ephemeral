import sys
sys.path.insert(0, './image-processor')

import boto3
import ntpath
import os.path
import urllib
import uuid

from PIL import Image
import PIL.Image

s3_client = boto3.client('s3')

widths = [128, 192, 320]
image_types = ['.tif', '.tiff', '.jpeg', '.jpg', '.png', '.bmp']

def resize(width, source, dest):
    img = Image.open(source)
    wpercent = (width / float(img.size[0]))
    hsize = int((float(img.size[1]) * float(wpercent)))
    img = img.copy().resize((width, hsize), PIL.Image.ANTIALIAS)
    img.save(dest)

# Default example
def test(event, context):
    s3_client.upload_file('./tokyo.jpg', 'srphm-image-processor', 'original/tokyo.jpg')

def process(event, context):
    for record in event['Records']:
        key = record['s3']['object']['key']
        filename = ntpath.basename(key)
        (name, extension) = os.path.splitext(filename)

        if extension in image_types:
            bucket = record['s3']['bucket']['name']
            download_path = '/tmp/{}-{}'.format(uuid.uuid4(), filename)
            s3_client.download_file(bucket, key, download_path)

            for width in widths:
                upload_path = '/tmp/w{}-{}'.format(width, filename)
                resize(width, download_path, upload_path)
                s3_client.upload_file(upload_path, '{}'.format(bucket), 'w{}/{}_w{}{}'.format(width, name, width, extension))
