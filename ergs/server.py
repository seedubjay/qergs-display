from flask import Flask, json
from flask_cors import CORS, cross_origin
from datetime import datetime, time, timedelta, date
import random
import sys
from threading import Thread
import time
import requests
from multiprocessing import Pool

MAX_LANES = 5
PORT = 5000

HOSTNAME_RESOLVER = 'https://frozen-island-91924.herokuapp.com'

# list of dicts (endpoint, name, club)
with open(sys.argv[1]) as f:
    config = json.load(f)

for c in config:
    if not c['endpoint'].startswith('http://') and not c['endpoint'].startswith('https://'):
        r = "http://" + requests.get(HOSTNAME_RESOLVER + '/' + c['endpoint']).text + f":{PORT}"
        print(f"Resolved hostname {c['endpoint']} to {r}")
        c['endpoint'] = r

start_time = datetime.now()
data = []

for i in range(len(config)):
    data.append({
        'id': f"{i}xyz",
        'name': config[i]['name'],
        'club': config[i]['club'],
        'position': 0,
        'split': 0,
        'rate': 4,
        'alive': True,
        'active': True
    })

def get_erg_data(c):
    try:
        return requests.get(c['endpoint'], timeout=0.2).json()
    except requests.exceptions.RequestException:
        return None

def update_data():
    global data
    while True:
        current_time = datetime.now()
        with Pool(16) as p: 
            reqs = p.map(get_erg_data, config)
        for i in range(len(config)):
            if reqs[i] is None:
                data[i]['alive'] = False
            else:
                data[i]['position'] = reqs[i]['distance']
                split = int(reqs[i]['pace']*10)
                data[i]['split'] = f"{split//600}:{(split//10)%60}.{split % 10}"
                data[i]['rate'] = 60 / max(reqs[i]['rate'], 15)
                data[i]['alive'] = True
                data[i]['active'] = reqs[i]['workout_state'] != 3
        time.sleep(max(0,.25 - (datetime.now() - current_time).total_seconds()))

api = Flask(__name__)
cors = CORS(api)
api.config['CORS_HEADERS'] = 'Content-Type'

@api.route('/', methods=['GET'])
@cross_origin()
def get_standings():
    return json.dumps(data)

if __name__ == '__main__':
    t = Thread(target=update_data)
    t.start()
    api.run('0.0.0.0', 5000)