import json
import scipy.io as io
import argparse
import numpy as np

parser = argparse.ArgumentParser(description='Convert json to mat')
parser.add_argument('--json', type=str, default='data.json', help='json file')
parser.add_argument('--mat', type=str, default='data.mat', help='mat file')

args = parser.parse_args()

# Load data from json
with open(args.json) as f:
    data = json.load(f)
    print(data.keys())
    for key in data:
        print(key)
        try:
            data[key] = np.array(data[key]).astype(np.float16)
        except:
            pass

# Save data to mat
io.savemat(args.mat, data, do_compression=True)

