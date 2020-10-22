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
    boatLength = 100;
    serverUpdateRate = .5;
    animationBlurTime = .5;

    headerHeight = 50;
    footerHeight = 80;

    laneWidth = 110;
    laneBuffer = 30;
    laneCount = 8;
    coneRadius = 3;
    
    coneGapLength = 100;
    raceLegScreenRatio = 1.3;
    raceLegLength = 500;
    raceLegCount = 8;
}

export default new Config();