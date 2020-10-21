import * as PIXI from 'pixi.js';
import Game from './components/game';
import Boat from './components/boat';
import { getPassiveStrokeModel } from './components/strokemodel';
import './index.scss'
import config from './components/config';

const boatData: {tag:string, name:string}[] = require('./assets/boats.json');

require.context('./assets', true);

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
        window.innerHeight
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


    setInterval(_ => {
        fetch("http://localhost:5000").then(resp => {
            resp.json().then(data => {
                app.update(data);
                columns.forEach(c => c.innerHTML = '');
                data.forEach((d: any) => columns[d['lane']].innerHTML = `<div class="team-name">${d['name']}</div><div class="distance">${Math.round(d['position'])}m</div><div class="split">${d['split']}</div>`)
            });
        }).catch(reason => {
            console.log(`fetch failed: ${reason}`)
        });
    }, config.serverUpdateRate * 1000);

}