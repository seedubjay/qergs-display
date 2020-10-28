import * as PIXI from 'pixi.js';

export default class Viewport extends PIXI.Container {

    screenWidth: number;
    screenHeight: number;

    _cameraHeight: number;

    constructor(screenWidth: number, screenHeight: number) {
        super();
        this._cameraHeight = screenHeight
        this.resize(screenWidth, screenHeight);
    }

    get screenRatio() {return this.screenWidth/this.screenHeight;}

    resize(w: number, h: number) {
        this.screenWidth = w;
        this.screenHeight = h;
        this.position.set(w/2,h/2);
        this.scale.set(h / this._cameraHeight);
    }

    get cameraHeight() {
        return this._cameraHeight;
    }

    set cameraHeight(h: number) {
        this._cameraHeight = h;
        this.scale.set(this.screenHeight / h);
    }

    get cameraWidth() {
        return this.cameraHeight / this.screenHeight * this.screenWidth
    }

    set cameraWidth(w: number) {
        this.cameraHeight = w / this.screenWidth * this.screenHeight;
    }

    get center() {
        return this.pivot;
    }

    set center(p: PIXI.IPoint) {
        this.pivot = this.pivot.copyFrom(p);
    }
}