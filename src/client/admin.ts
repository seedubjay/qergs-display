import './styles.scss'
import './admin.scss'

let wss = new WebSocket('ws' + location.href.substr(4));
wss.onmessage = e => {
    console.log(e.data);
}