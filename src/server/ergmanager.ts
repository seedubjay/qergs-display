import { maxHeaderSize, Server } from 'http';
import { stringify } from 'querystring';
import WebSocket from 'ws';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';

export default class {

    wss: WebSocket.Server;

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
                    ws.on('message', msg => {
                        JSON.parse(msg as string).map((data: Record<string,any>) => {
                            data['hostname'] = host;
                            data['timestamp'] = Date.now();
                            if (!this.race.some(r => r['serial'] === data['serial'])) {
                                this.race.push({
                                    'serial': data['serial'],
                                    'name': 'hello',
                                    'club': 'queens'
                                });
                            }
                            this.ergs[data['serial']] = data
                            this.output_is_current = false;
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
                ws.send("hello");
            } else {
                setInterval(() => {
                    ws.send(JSON.stringify(this.get_output()));
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
}