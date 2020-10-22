import * as PIXI from 'pixi.js';
import { Ease, Easing } from 'pixi-ease';

import { Angle } from './math';
import Config from './config';

export default class Boat extends PIXI.Container {

    private goalX: number;
    private goalY: number;
    private goalRot: number;
    private goalTimeAway = 0;

    alive = true;

    hull: PIXI.Sprite;
    
    private moveTicker: PIXI.Ticker;
    moveCb: (x:number, y:number, rot:number) => void | null = null;

    private oarEase = new Ease({ease: "easeInOutSine"});
    private oarAnimationLoaders: ((nextFront:number, intendedDuration: number) => void)[] = [];

    // _label = ""
    // labelSprite: PIXI.Text;
    // get label() {return this._label;}
    // set label(l: string) {

    // }

    constructor(x: number, y: number, rot: number, alive: boolean, textureId: string, length = Config.boatLength) {
        super()
        console.log(textureId);
        this.position.set(x,y);
        this.rotation = rot;
        if (!alive) this.kill(false);

        this.moveTicker = new PIXI.Ticker();

        const boatTexture = PIXI.Texture.from(textureId);
        const oarTexture = PIXI.Texture.from('oar');
        
        this.hull = new PIXI.Sprite(boatTexture);
        this.hull.height *= length / this.hull.width;
        this.hull.width = length;
        this.addChild(this.hull);

        // this.labelSprite = new PIXI.Text("hello", {fontFamily: 'Monaco' ,fontSize:, align: 'center'});
        // this.labelSprite.pivot.set(this.labelSprite.width/2, this.labelSprite.height);
        // // this.labelSprite.position
        // this.addChild(this.labelSprite)

        const oarFrontArc = Math.PI / 6;
        const oarBackArc = Math.PI / 5;

        const oarLength = length / 2;
        const rowersMin = length * .205;
        const rowersMax = length * .723;

        for (let i = 0; i < 8; i++) {
            const oarSprite = new PIXI.Sprite(oarTexture);
            oarSprite.height *= oarLength / oarSprite.width;
            oarSprite.width = oarLength;
            oarSprite.anchor.set(.73,.5);
            oarSprite.x = rowersMin + (rowersMax-rowersMin)/8*(i+.5);
            
            let frontAngle = Math.PI / 2 + oarFrontArc;
            let backAngle = Math.PI / 2 - oarBackArc;
            if (i % 2 == 0) {
                oarSprite.y = -1.2*this.hull.height;
            } else {
                oarSprite.y = 2.2*this.hull.height;
                frontAngle *= -1;
                backAngle *= -1;
            }
            oarSprite.rotation = frontAngle;

            const ratio = 1/3; // ratio of time spent in stroke before recovery

            let oarAnimation: Easing | null = null;
            let thisFront = 0;

            let nextExists = false;
            let nextBack = 0;
            let nextFront = 0;
            let nextAngle = 0;

            let tryStroke = () => {
                if (oarAnimation) return;
                if (!nextExists) {
                    return;
                }
                oarAnimation = this.oarEase.add(oarSprite,{rotation: nextAngle}, {duration: nextBack * 1000 - window.performance.now()});
                oarAnimation.on('complete', () => {
                    oarAnimation = this.oarEase.add(oarSprite,{rotation: frontAngle}, {duration: nextFront * 1000 - window.performance.now()});
                    oarAnimation.on('complete', () => {
                        oarAnimation = null;
                        tryStroke();
                    })
                });
                thisFront = nextFront;
                nextExists = false;
            }

            // next stroke should return to frontstops at time nextFront
            this.oarAnimationLoaders.push((_nextFront: number, intendedDuration: number) => {
                if (nextExists) return;
                nextExists = true;
                nextFront = _nextFront;

                if (!oarAnimation) thisFront = window.performance.now() / 1000;

                const availableDuration = nextFront - thisFront;
                const minBackDuration = .9*intendedDuration*ratio;

                if (availableDuration*ratio > minBackDuration) {
                    // speed up regular stroke
                    nextBack = thisFront + availableDuration*ratio;
                    nextAngle = backAngle;
                } else if (availableDuration > 2*minBackDuration) {
                    // rush the slide
                    nextBack = thisFront + minBackDuration;
                    nextAngle = backAngle;
                } else {
                    // shorten the slide
                    let p = availableDuration / (2*minBackDuration); // proportion of slide used
                    nextBack = thisFront + availableDuration/2;
                    nextAngle = Angle.lerp(frontAngle,backAngle,p);
                }
                tryStroke();
            })
            this.addChild(oarSprite);
        }

        // this.ticker.add

        this.pivot.set(this.hull.width/2, this.hull.height/2);

        // const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
        // bg.width = container.width;
        // bg.height = container.height;
        // container.addChild(bg);

        this.moveTicker.add(() => { 
            let T = this.goalTimeAway;
            let t = Math.min(this.moveTicker.deltaMS/1000,T);
            this.x = (this.x * T + this.goalX * t) / (T + t);
            this.y = (this.y * T + this.goalY * t) / (T + t);
            this.rotation = Angle.lerp(this.rotation, this.goalRot, t/(t+T));
            this.goalTimeAway -= t;
            if (this.goalTimeAway <= 0) {
                this.moveTicker.stop();
            }
            if (this.moveCb) this.moveCb(this.x, this.y, this.rotation);
        })
    }   

    kill(animated = true) {
        if (!this.alive) return;
        this.alive = false;
        if (animated) {
            const ease = new Ease({ease: "easeOutSine", duration: 150});
            ease.add(this, {alpha: .6},{});
            this.children.forEach(s => {
                if (s instanceof PIXI.Sprite) ease.add(s, {blend: 0xa0a0a0},{});
            });
        } else {
            this.alpha = .6;
            this.children.forEach(s => {
                if (s instanceof PIXI.Sprite) s.tint = 0xa0a0a0;
            });
        }
        this.oarEase.destroy();
    }

    updateLocation(x: number, y: number, rot: number) {
        const delay = Config.animationBlurTime;
        if (this.moveTicker.started) this.moveTicker.update();
        this.goalX = x;
        this.goalY = y;
        this.goalRot = rot;
        this.goalTimeAway = delay;
        if (!this.moveTicker.started) this.moveTicker.start();
    }

    takeStroke(duration: number, accuracy: number) {
        const time = window.performance.now() / 1000;

        const variation = (1-accuracy) * (.1+duration*.3); // can take up to 30% too long

        this.oarAnimationLoaders.forEach(setStroke => setStroke(
            time + duration + Math.random()*variation,
            duration
        ))
    }
}