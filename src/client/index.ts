import * as PIXI from 'pixi.js';
import Game from './components/game';
import Boat from './components/boat';
import { getPassiveStrokeModel } from './components/strokemodel';
import './index.scss'
import config from './components/config';

const boatData: {tag:string, name:string}[] = require('../assets/boats.json');

require.context('../assets', true);

boatData.forEach(({tag,name}) => {
    PIXI.Loader.shared.add(tag, `assets/boat-${tag}.svg`);
})

PIXI.Loader.shared
    .add('oar', 'assets/oar.svg')
    .load(onResourcesLoaded);

function onResourcesLoaded() {
    const app = new Game(
        window.innerWidth,
        window.innerHeight - config.headerHeight - config.footerHeight,
    );

    let header = document.createElement('div');
    header.id = 'ui-header';
    header.style.height = `${config.headerHeight}px`;
    
    header.innerText = "QErgs 2020"

    document.body.appendChild(header);

    document.body.appendChild(app.view);

    window.addEventListener('resize', _ => app.resize(
        window.innerWidth,
        window.innerHeight - config.headerHeight - config.footerHeight,
    ));

    let footer = document.createElement('div');
    footer.id = 'ui-footer';
    footer.style.height = `${config.footerHeight}px`;

    let bufferRatio = config.laneBuffer / (2*config.laneBuffer + config.laneCount * config.laneWidth);
    footer.style.paddingLeft = `${bufferRatio*100}%`
    footer.style.paddingRight = `${bufferRatio*100}%`

    let innerFooter = document.createElement('table');
    footer.appendChild(innerFooter);
    let columns: Array<HTMLTableDataCellElement> = []
    for (let i = 0; i < config.laneCount; i++) {
        let c = document.createElement('td');
        columns.push(c);
        innerFooter.appendChild(c);
    }

    document.body.appendChild(footer);

    let wss = new WebSocket('ws' + location.href.substr(4));
    wss.onmessage = e => {
        let data = JSON.parse(e.data as string);
        app.update(data);
        columns.forEach(c => c.innerHTML = '');
        data.forEach((d, i) => columns[i + Math.floor((config.laneCount - data.length) / 2)].innerHTML = `
            <div class="team-name">${d['name']}</div>
            <div class="distance">${Math.round(d['position'])}m</div>` +
            (d['alive'] ? `<div class="split">${d['split']}</div>` : `<div class="error">erg n/a</div>`)
        )
    }

    wss.onclose = e => {
        alert("Lost connection to ergs... Click 'OK' to reload")
        location.reload();
    }
}