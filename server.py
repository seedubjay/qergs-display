from flask import Flask, json
from flask_cors import CORS, cross_origin
from datetime import datetime, time, timedelta, date
import random
import sys
from threading import Thread
import time
import requests
from multiprocessing import Pool

MAX_LANES = 8

# list of dicts (endpoint, name, club)
with open(sys.argv[1]) as f:
    config = json.load(f)

start_time = datetime.now()

data = []

def random_split():
    return f"1:{random.randint(35,45)}.{random.randint(0,9)}"

for i in range(len(config)):
    data.append({
        'id': f"{i}xyz",
        'name': config[i]['name'],
        'club': config[i]['club'],
        'lane': i + (MAX_LANES - len(config)) // 2,
        'position': 0,
        'split': 0,
        'rate': 1000000,
        'alive': True
    })

def get_erg_data(c):
    try:
        return requests.get(c['endpoint']).json()
    except requests.exceptions.RequestException:
        return None

def update_data():
    global data
    while True:
        current_time = datetime.now()
        with Pool(8) as p:
            reqs = p.map(get_erg_data,config)
        for i in range(len(config)):
            if reqs[i] is None:
                data[i]['alive'] = False
            else:
                data[i]['position'] = reqs[i]['distance']
                data[i]['split'] = reqs[i]['pace']
                data[i]['rate'] = 60 / reqs[i]['rate']
                data[i]['alive'] = reqs[i]['workout_state'] != 3
        print(data)
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
    api.run()