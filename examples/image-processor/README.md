# Image Processor example
This is a demo that uses Python [Pillow](https://python-pillow.org/) within AWS Lambda to resize an image. The Pillow library is built and bundled via Serephem.

## Requirements

* An AWS account
* Docker

## Get started
1. Once inside this example's directory, install Serephem.

    ```bash
    $ npm i
    ```

1. Configure the `serverless.yml` file with your own settings (i.e.  `region`, `stage`, `profile`). Defaults are:

    * **region:** `us-east-1`
    * **stage:** `dev`
    * **profile:** Ommited, thus points to `default`

## Resources

### S3 Bucket

An S3 bucket named `srphm-image-processor` is created on deployment. Here you will upload your images to process.
You **must** upload them to the `original` folder. Either you can create it or will be created for you when running the **test** Lambda (see below).

### Lambdas

This example features 2 Lambdas:
* `processor`: This processor takes an image uploaded to S3 and resizes it to 128, 192 and 320 pixels, keeping the width/height ratio. It then uploads each to a different folder in the S3 bucket.
* `test`: Uploads a default provided image (`tokyo.jpg`) to the `original` directory (creating it if it doesn't exist). This, as a result, triggers the `processor` Lambda.


## Deploy

```bash
$ sls deploy -v
```

The first time you run this, you will see how Docker builds the `image-processor.zip` file. This file contains the Pillow library.
On subsequent deployments, the zip file will be pulled from local cache unless it is deleted or you decide to rebuild via the `nocache` option.

> Remember to run `sls remove` when done with the demo.

## Test

1. Log in to the AWS console

1. Here you can choose 2 paths:

    * **Upload an image manually**

      a. Go to AWS S3 and open the `srphm-image-processor` bucket

      b. Create the `original` folder if it doesn't exist

      c. Open the folder and upload an image

    * **Use the `test` Lambda**

      a. Go to the `test` Lambda in the AWS console

      b. Click the **Test** button to run it. Use `{}` as test event.

1. In the bucket, you will notice 3 new folders: `w128`, `w192` and `w320`. Each will contain resized versions of the uploaded images.
