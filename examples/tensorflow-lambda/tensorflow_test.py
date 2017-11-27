import sys
sys.path.insert(0, './tfpackage')

import tensorflow as tf

def lambda_handler(event, context):
    a = tf.constant(event['a'])
    b = tf.constant(event['b'])

    result = tf.Session().run(tf.add(a, b))

    return {
        "message": "TensorFlow \"add\" function test: {} + {}".format(event['a'], event['b']),
        "result": "{}".format(result)
    }
