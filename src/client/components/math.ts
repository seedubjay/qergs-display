export class Vector {
    readonly x: number;
    readonly y: number;

    constructor();
    constructor(x: number, y:number);
    constructor(v: {x:number, y:number});
    constructor(v: number[]);
    constructor(x: number | number[] | {x:number,y:number} = 0, y = 0) {
        if (typeof x !== 'number') {
            if (x instanceof Array) [x,y] = x.splice(0,2);
            else [x,y] = [x.x,x.y];
        }
        this.x = x;
        this.y = y;
    }

    static byPolar = (r: number, theta: number) => (new Vector(
        Math.cos(theta),
        Math.sin(theta)
    )).scale(r);

    readonly add = (v: Vector) => new Vector(this.x+v.x, this.y+v.y);
    readonly subtract = (v: Vector) => new Vector(this.x-v.x, this.y-v.y);
    readonly scale = (k: number) => new Vector(this.x*k,this.y*k);

    readonly roundedToZero = (eps: number) => this.r < eps ? new Vector(0,0) : this;

    readonly dot = (v: Vector) => this.x*v.x + this.y*v.y;
    readonly cross = (v: Vector) => this.x*v.y - this.y*v.x;

    get r() {return (this.x**2+this.y**2)**.5;}
    get theta(): number {return Math.atan2(this.y,this.x);}

    equalish = (v: Vector) => this.subtract(v).r < 1e-9;

    rotate = (a: number) => Vector.byPolar(this.r,this.theta+a);

    public toString = (): string => `${Math.round(this.x*100)/100},${Math.round(this.y*100)/100}`
}

export class Angle {
    static readonly TAU = 2*Math.PI;
    static readonly PI = Math.PI;

    static readonly normalised = (a: number) => ((a % Angle.TAU) + Angle.TAU) % Angle.TAU;

    static lerp(a: number, b: number, t: number) {
        let d = Angle.normalised(b-a);
        return d < Angle.PI ? Angle.normalised(a + d*t) : Angle.normalised(a - (Angle.TAU-d)*t);
    }
}

export const clamp = (x:number,a:number=0,b:number=1) => Math.max(Math.min(x,b),a);
export const range = (a:number[]) => [Math.min(...a), Math.max(...a)];

export function lerp(k:number,x1:number|number[],x2?:number) {
    if (typeof x1 !== 'number') [x1,x2] = x1.splice(0,2);
    return k*(x2-x1) + x1;
}

export function unlerp(x:number,x1:number|number[],x2?:number) {
    if (typeof x1 !== 'number') [x1,x2] = x1.splice(0,2);
    return (x-x1)/(x2-x1);
}