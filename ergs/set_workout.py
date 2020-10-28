import requests
import sys
import json

HOSTNAME_RESOLVER = 'https://frozen-island-91924.herokuapp.com'

# list of dicts (endpoint, name, club)
with open(sys.argv[1]) as f:
    config = json.load(f)

for c in config:
    name = c['endpoint']
    addr = name
    if not addr.startswith('http://') and not addr.startswith('https://'):
        addr = "http://" + requests.get(HOSTNAME_RESOLVER + '/' + c['endpoint']).text + ":5353"
        print(f"Resolved hostname {name} to {addr}")
    
    try:
        requests.post(addr + "/workout?distance=4000", timeout=1)
    except requests.exceptions.RequestException as e:
        print(f"Error at erg {name}: {str(e)}")