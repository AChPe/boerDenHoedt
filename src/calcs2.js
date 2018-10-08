// exports.boerDenHoedtCalcs1 = function boerDenHoedtCalcs1(obj, index, array, seasonStrat,) {
exports.boerDenHoedtCalcs2 = function boerDenHoedtCalcs2(obj, index, array, seasonStrat) {
    const f = require('./functions');
    const p = require('./psychrometric');

    let capCB = 75;
    let tempCB = 9;
    let cropLAI = 2;
    // console.log('array: ' + JSON.stringify(array));

    let targetCondition = seasonStrat.filter(f.hourFilter, index);

    // let targetCondition = (obj[0].month < 5 || obj[0].month > 8 ? winterStrat.filter(f.hourFilter, index) : summerStrat.filter(f.hourFilter, index));
    let hour = targetCondition[0].hour;

    // console.log('targetCondition: ' + JSON.stringify(targetCondition));

    let tempArray = [];
    let rhArray = [];
    let currentTimePoint = obj;
    // console.log('currentTimePoint: ' + JSON.stringify(currentTimePoint));
    // let targetCondition = seasonStrat.filter(f.hourFilter, index);
    let testTemperature = targetCondition[0].t;
    let testRelativeHumidity = targetCondition[0].h;

    // console.log('targetConditionWinter: ' + JSON.stringify(targetCondition));
    // console.log('testTemperatureWinter: ' + JSON.stringify(testTemperature));
    // console.log('testRHWinter: ' + JSON.stringify(testRelativeHumidity));

    let testEnthalpy = p.psychrometric(testTemperature, testRelativeHumidity).enthalpy;
    // console.log('testEnthalpyWinter: ' + JSON.stringify(testEnthalpy));
    let testMixingRatio = p.psychrometric(testTemperature, testRelativeHumidity).mixingRatio;
    // console.log('testMixingRatioWinter: ' + JSON.stringify(testMixingRatio));

    let totalHourCount = obj.length;

    var newPoint = currentTimePoint.map((obj) => f.cellEvaluator(obj, capCB, tempCB, testEnthalpy, testMixingRatio));

    let totalBadCells = currentTimePoint.filter((obj, index, array) => f.badCellsCount(obj, index, array));

    let badCellsCount = totalBadCells.length;

    // console.log('newPoint: ' + JSON.stringify(newPoint));
    let selectedCells = currentTimePoint.filter((obj, index, array) => f.selectCells(obj, index, array));
    // console.log('selectedCells1: ' + JSON.stringify(selectedCells));
    selectedCells.forEach((obj) => f.arrayPush(obj, tempArray, rhArray));

    let badCellsFinal = tempArray.length;

    let fractionBadHoursTot = (badCellsCount / totalHourCount) * 100;
    let activeCooledCount = badCellsCount - badCellsFinal;
    let fractionBadCellsFinal = (badCellsFinal / totalHourCount) * 100;

    // console.log('tempArrayWinter: ' + JSON.stringify(tempArray));
    // console.log('rhArrayWinter: ' + JSON.stringify(rhArray));

    let tempMedian = f.median(tempArray);
    let tempAverage = f.average(tempArray);
    let tempQ1 = f.firstQuartile(tempArray);
    let tempQ3 = f.thirdQuartile(tempArray);
    let tempLow = f.lowestValue(tempArray);
    let tempHigh = f.highestValue(tempArray);
    let rhMedian = f.median(rhArray);
    let rhQ1 = f.firstQuartile(rhArray);
    let rhQ3 = f.thirdQuartile(rhArray);
    let rhLow = f.lowestValue(rhArray);
    let rhHigh = f.highestValue(rhArray);

    var finalDataInput = {
        month: obj[0].month,
        hour: hour,
        targetT: testTemperature,
        targetRH: testRelativeHumidity,
        V1T: tempLow,
        V2T: tempQ1,
        V3T: tempQ3,
        V4T: tempHigh,
        medT: tempMedian,
        V1RH: rhLow,
        V2RH: rhQ1,
        V3RH: rhQ3,
        V4RH: rhHigh,
        medRH: rhMedian,
        badCellsFinal: badCellsFinal,
        badCellsCount: badCellsCount,
        totalHourCount: totalHourCount,
        fractionBadHoursTot: fractionBadHoursTot,
        activeCooledCount: activeCooledCount,
        fractionBadCellsFinal: fractionBadCellsFinal
    };



    return { finalDataInput };

}