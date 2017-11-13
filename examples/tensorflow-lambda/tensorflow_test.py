import argparse
import tensorflow as tf

def lambda_handler(event, context):
    a = tf.constant(event['a'])
    b = tf.constant(event['b'])

    result = tf.Session().run(tf.add(a, b))

    return {
        "message": "TensorFlow \"add\" function test: {} + {}".format(event['a'], event['b']),
        "result": "{}".format(result)
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('a', type=int, help='Integer value "a"')
    parser.add_argument('b', type=int, help='Integer value "b"')

    args = parser.parse_args()

    print(lambda_handler({'a': args.a, 'b': args.b}, {}))