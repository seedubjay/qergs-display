import * as PIXI from 'pixi.js';

import { ease } from 'pixi-ease';

import Viewport from './viewport';
import Boat from './boat';
import { getPassiveStrokeModel } from './strokemodel';
import config from './config';

export default class Game {

    private app: PIXI.Application;

    private viewport: Viewport;
    
    private background: PIXI.DisplayObject = null;

    private boats: Map<string,Boat> = new Map();
    private strokeHandlers: Map<string, (duration: number, accuracy: number, active: boolean) => void> = new Map();

    private pixelsPerMeter: number;

    constructor(width: number, height:number) {
        this.app = new PIXI.Application({
            width: width,
            height: height,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: true,
            backgroundColor: 0x5050bb
        });

        // create viewport
        this.viewport = new Viewport(width, height);
        this.viewport.cameraWidth = config.laneCount * config.laneWidth + 2 * config.laneBuffer;
        // this.viewport.scale.set(this.viewport.scale.x/2)
        this.viewport.alpha = 1;
        this.app.stage.addChild(this.viewport);

        this.pixelsPerMeter = this.viewport.cameraHeight / config.raceLegLength / config.raceLegScreenRatio;
        this.render_backgound();

        PIXI.Ticker.shared.add(this.update_camera.bind(this));
    }

    get view() {return this.app.view;}

    render_backgound() {
        if (this.background) {
            this.background.parent.removeChild(this.background);
            this.background = null;
        }

        let map = new PIXI.Graphics();

        map.beginFill(0xffffff);
        for (let l = 0; l < config.raceLegCount; l++) {
            for (let c = 1; c < config.raceLegLength / config.coneGapLength; c++) {
                for (let i = 0; i <= config.laneCount; i++) {
                    map.drawCircle(config.laneBuffer + i*config.laneWidth, - (c * config.coneGapLength + l * config.raceLegLength) * this.pixelsPerMeter, config.coneRadius);
                }
            }
        }
        map.endFill();

        for (let l = 0; l <= config.raceLegCount; l++) {
            map.lineStyle(3, 0xffffff)
               .moveTo(config.laneBuffer * .5, - l * config.raceLegLength * this.pixelsPerMeter)
               .lineTo(config.laneBuffer * 1.5 + config.laneCount*config.laneWidth, - l * config.raceLegLength * this.pixelsPerMeter);
            
            let text = new PIXI.Text(`${l * config.raceLegLength}m`, { fontSize: 48, fill: '#fff'});
            text.position.set(config.laneBuffer * .5, - (48 + l * config.raceLegLength * this.pixelsPerMeter))

            map.addChild(text)
        }

        this.viewport.addChild(map);

        this.background = map;
    }

    update_camera() {
        let min_y = config.boatLength * .6 - this.viewport.cameraHeight / 2;
        let max_boat = this.boats.size > 0 ? Math.min(...Array.from(this.boats.values()).map(d => d.position.y)) : 0;
        this.viewport.center = new PIXI.Point(this.viewport.cameraWidth / 2, Math.min(min_y, max_boat + this.viewport.cameraHeight * .3));
    }

    resize(width:number, height:number) {
        this.app.renderer.resize(width,height);
        this.viewport.resize(width,height);
        this.pixelsPerMeter = this.viewport.cameraHeight / config.raceLegLength / config.raceLegScreenRatio;
        this.render_backgound()
        this.viewport.cameraWidth = config.laneCount * config.laneWidth + 2 * config.laneBuffer;
    }

    update(data: [any]) {
        let keys = Array.from(this.boats.keys());
        // console.log(keys);
        // console.log(data.map(d => d['id']));
        keys.forEach(i => {
            if (!data.some(d => d['id'] == i)) {
                this.boats.get(i).parent.removeChild(this.boats.get(i));
                this.boats.delete(i);
            }
        })
        for (let i = 0; i < data.length; i++) {
            let d = data[i];
            let id = d['id']

            if (this.boats.has(id) && d['alive'] && !this.boats.get(id).alive) {
                this.boats.get(id).parent.removeChild(this.boats.get(id));
                this.boats.delete(id);
                this.strokeHandlers.get(id)(2,1,false);
                this.strokeHandlers.delete(id);
            }
            
            let emptyLanes = Math.floor((config.laneCount - data.length)/2);
            if (!this.boats.has(id)) {
                let b = new Boat((i + emptyLanes +.5) * config.laneWidth + config.laneBuffer, config.boatLength / 2 - d['position'] * this.pixelsPerMeter, -Math.PI/2,true,d["club"]);
                this.boats.set(id, b);
                this.viewport.addChild(b);
                this.strokeHandlers.set(id, getPassiveStrokeModel(b.takeStroke.bind(b)));
            } else {
                let b = this.boats.get(id);
                b.updateLocation((i + emptyLanes +.5) * config.laneWidth + config.laneBuffer, config.boatLength / 2 - d['position'] * this.pixelsPerMeter, b.rotation);
            }
            this.strokeHandlers.get(id)(1.3, .8, d['active']);
            if (!d['alive']) this.boats.get(id).kill(true);
        }
    }

}