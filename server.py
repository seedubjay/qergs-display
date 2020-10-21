from flask import Flask, json
from flask_cors import CORS, cross_origin
from datetime import datetime, time, timedelta, date
import random

start_time = datetime.now()

names = [
    'Queens\' NM1',
    'Homerton NM1',
    'Pembroke NM1',
    'Robinson NM1',
    'Maggie NM1',
    'Caius NM1',
    'Magdalene NM1',
    'Hughes Hall NM1'
]

clubs = [
    'queens',
    'homerton',
    'pembroke',
    'robinson',
    'maggie',
    'caius',
    'magdalene',
    'hughes'
]

data = []

def random_split():
    return f"1:{random.randint(35,45)}.{random.randint(0,9)}"

for i in range(8):
    data.append({
        'id': f"{i}xyz",
        'name': names[i],
        'club': clubs[i],
        'lane': i,
        'position': 0,
        'split': random_split(),
        'rate': 1.2 + random.random() * .6
    })

api = Flask(__name__)
cors = CORS(api)
api.config['CORS_HEADERS'] = 'Content-Type'

@api.route('/', methods=['GET'])
@cross_origin()
def get_standings():
    for i in range(len(data)):
        data[i]['position'] = (datetime.now() - start_time).total_seconds() * (10 - data[i]['rate'] * 3)
        if random.randrange(100) < 40:
            data[i]['split'] = random_split()
    return json.dumps(data)

if __name__ == '__main__':
    api.run()