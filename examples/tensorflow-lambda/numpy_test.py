import numpy as np

def lambda_handler(event, context):
    a = np.arange(6).reshape(2, 3)

    return {
        "message": "NumPy test",
        "event": event,
        "attrs": {
            "ndim": a.ndim,
            "dtype.name": a.dtype.name,
            "itemsize": a.itemsize,
            "size": a.size
        }
    }

if __name__ == '__main__':
    print(lambda_handler({}, {}))
