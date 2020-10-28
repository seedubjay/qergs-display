import { clamp } from './math';

export function getPassiveStrokeModel(strokeCB: (duration: number, accuracy: number) => void) {

    let _duration = 0;
    let _accuracy = 1;
    let _active = false;
    let running = false;

    function update(duration: number, accuracy: number, active: boolean) {
        _duration = duration;
        _accuracy = accuracy;
        _active = active;
        tryStroke();
    }

    function tryStroke() {
        if (!_active || running) return;

        running = true;
        setTimeout(() => {
            running = false;
            tryStroke();
        }, _duration * 1000);
        strokeCB(_duration, _accuracy);
    }

    return update;
}

export function getStrokeModel(getTimeMS: () => number, strokeCB: (duration: number, accuracy: number) => void, noStrokeCB = () => {}) {

    const maxDuration = 2;
    const minDuration = .2;

    const accuracyCalc = (cur: number, next: number) => {
        let k = 2; // 1:k or k:1 in durations => accuracy=0
        let ratio = cur < next ? next/cur : cur/next;
        let a = clamp(1 - (ratio-1)/(k-1), clamp(next-1));
        
        return a;
    }

    let strokeStart = -1e9;
    let strokeDuration = maxDuration;
    let nextDuration: number | null = null;
    let running = false;
    let accuracy = 1;

    function onClick() {
        // if next stroke is already decided, ignore this stroke
        if (nextDuration) return;

        let rawDuration = getTimeMS()/1000 - strokeStart;
        accuracy = accuracyCalc(strokeDuration, rawDuration);
        const decay = rawDuration < strokeDuration ? .5*accuracy : .5;
        nextDuration = rawDuration*decay + strokeDuration*(1-decay); // natural decay
        nextDuration = Math.max(Math.min(nextDuration,maxDuration),minDuration);
        if (nextDuration == maxDuration) accuracy = 1;
        console.log(nextDuration.toFixed(2), accuracy.toFixed(2));
        tryStroke();
        return rawDuration;
    }

    function tryStroke() {
        if (running) return;
        if (!nextDuration) {
            noStrokeCB();
            return;
        }

        strokeDuration = nextDuration;
        nextDuration = null;
        strokeStart = getTimeMS() / 1000;
        running = true;
        setTimeout(() => {
            running = false;
            tryStroke();
        }, strokeDuration * 1000);
        strokeCB(strokeDuration, accuracy);
    }

    return onClick;
}