interface IConfig {
    boatLength: number;
    serverUpdateRate: number;
    animationBlurTime: number

    laneWidth: number;
    laneBuffer: number;
    laneCount: number;
    
    coneRadius: number;
    raceLegScreenRatio: number;
    raceLegLength: number;
    raceLegCount: number;
}

class Config implements IConfig {
    boatLength = 400;
    serverUpdateRate = 1;
    animationBlurTime = 1;

    headerHeight = 30;
    footerHeight = 80;

    laneWidth = 480;
    laneBuffer = 120;
    laneCount = 5;
    coneRadius = 12;
    
    coneGapLength = 100;
    raceLegScreenRatio = 1.3;
    raceLegLength = 500;
    raceLegCount = 8;
}

export default new Config();