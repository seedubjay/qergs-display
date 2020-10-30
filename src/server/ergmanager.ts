import { maxHeaderSize, Server } from 'http';
import { stringify } from 'querystring';
import WebSocket from 'ws';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';

export default class {

    wss: WebSocket.Server;

    devices: Record<string,any> = {}

    ergs: Record<string,any> = {}
    
    race: Array<any> = []

    constructor(server: Server) {
        this.wss = new WebSocket.Server({ server: server });

        this.wss.on('connection', (ws,req) => {
            let s = req.url.split('/');
            if (s[1] === "erg") {
                if (!s[2]) ws.terminate();
                else {
                    let host = s.slice(2).join('/');

                    this.devices[host] = {
                        'host': host,
                        'ip': req.connection.remoteAddress,
                        'erg_count': undefined,
                        'last_update': undefined,
                        'expected_ergs': [],
                        'ws': ws
                    } 

                    ws.on('message', msg => {
                        let ergdata: Array<any> = JSON.parse(msg as string)
                        this.devices[host]["expected_ergs"].forEach((e:string) => {this.ergs[e]['alive'] = false;});
                        ergdata.map((data: Record<string,any>) => {
                            data['hostname'] = host;
                            data['timestamp'] = Date.now();
                            data['alive'] = true;
                            if (!this.race.some(r => r['serial'] === data['serial'])) {
                                this.race.push({
                                    'serial': data['serial'],
                                    'name': 'hello',
                                    'club': 'queens'
                                });
                            }
                            this.ergs[data['serial']] = data
                        })
                        this.devices[host]["expected_ergs"] = ergdata.map(d => d["serial"]);
                        this.output_is_current = false;

                        if (!Object.keys(this.devices).includes(host)) return;
                        this.devices[host]['erg_count'] = ergdata.length;
                        this.devices[host]['last_update'] = Date.now();

                    });

                    ws.on("close", () => {
                        console.log('closing... handling', this.devices[host]['expected_ergs'])
                        this.devices[host]['expected_ergs'].forEach((e:string) => {
                            if (Object.keys(this.ergs).includes(e)) this.ergs[e]['alive'] = false;
                        })
                    });
                }
            } else if (s[1] == "admin") {
                try {
                    let token = cookie.parse(req.headers.cookie)['jwt'];
                    jwt.verify(token, process.env.SECRET_TOKEN);
                } catch (e) {
                    ws.close();
                    return;
                }
                let id = setInterval(() => {
                    ws.send(JSON.stringify({
                        'devices': Object.values(this.devices).map(d => ({
                            'host': d['host'],
                            'ip': d['ip'],
                            'erg_count': d['erg_count'],
                            'last_update': d['last_update'],
                            'alive': d['ws'].readyState !== WebSocket.CLOSED
                        })),
                        'ergs': Object.values(this.ergs)
                    }));
                    if (ws.readyState === WebSocket.CLOSED) clearInterval(id);
                }, 1000)
            } else {
                let id = setInterval(() => {
                    ws.send(JSON.stringify(this.get_output()));
                    if (ws.readyState === WebSocket.CLOSED) clearInterval(id);
                }, 1000)
            }
        });
    }

    output_is_current = false
    output: any = {}
    get_output() {
        if (!this.output_is_current) {
            this.output_is_current = true;
            this.output = this.race.map(r => {
                let erg = this.ergs[r['serial']];
                let split = Math.round(erg['pace']*10);
                return {
                    "id": r['serial'],
                    "name": r['name'],
                    "club": r['club'],
                    "position": erg['distance'],
                    "time": erg['time'],
                    "split":
                        Math.floor(split/600) + ':' +
                        Math.floor(split/10%60).toString().padStart(2,'0') + '.' +
                        Math.floor(split%10),
                    "rate": erg['rate'] = 60 / Math.max(erg['rate'], 15),
                    "alive": true,
                    "active": true
                }
            });
        }
        return this.output;
    }

    delete_device(device: string) {
        if (Object.keys(this.devices).includes(device)) {
            this.devices[device]["ws"].on("close", () => {delete this.devices[device]});
            this.devices[device]["ws"].close();
        }
    }
}