exports.boerDenHoedtCalcs = function boerDenHoedtCalcs(summerTime, winterTime, summerStrat, winterStrat) {
    // const c = require('./utils/constants').constants;
    const f = require('./functions');
    const p = require('./psychrometric');
    // const f2 = require('./utils/functionLib2');
    // const cl = require('./classTrial');
    let capCB = 75;
    let tempCB = 9;
    let cropLAI = 2;
    // const summerTime = result.filter(function (obj) { return obj.season === 'summer'; });
    // const winterTime = result.filter(function (obj) { return obj.season === 'winter'; });
    console.log('winterTime: ' + JSON.stringify(winterTime));
    let trialArr12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    let trialArr22 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    let med12 = f.median(trialArr12);
    let med22 = f.median(trialArr22);
    let q1_12 = f.firstQuartile(trialArr12);
    let q1_22 = f.firstQuartile(trialArr22);
    let q3_12 = f.thirdQuartile(trialArr12);
    let q3_22 = f.thirdQuartile(trialArr22);
    let low_12 = f.lowestValue(trialArr12);
    let low_22 = f.lowestValue(trialArr22);
    let high_12 = f.highestValue(trialArr12);
    let high_22 = f.highestValue(trialArr22);
    let avg_12 = f.average(trialArr12);
    let avg_22 = f.average(trialArr22);
    // console.log('med12: ' + med12);
    // console.log('med22: ' + med22);
    // console.log('q1_12: ' + q1_12);
    // console.log('q1_22: ' + q1_22);
    // console.log('q3_12: ' + q3_12);
    // console.log('q3_22: ' + q3_22);
    // console.log('low12: ' + low_12);
    // console.log('low22: ' + low_22);
    // console.log('high_12: ' + high_12);
    // console.log('high_22: ' + high_22);
    // console.log('avg12: ' + avg_12);
    // console.log('avg22: ' + avg_22);
    let arrDataWinter = [];
    let arrDataSummer = [];
    let finalDataInputWinter = {};
    // for (i = 0; i < 24; i++) {
    //     var hour1 = i;
    //     console.log('hour1: ' + hour1);
    // }
    // WINTER
    for(i = 0; i < 1; i++) {
            // let hour = i;
            console.log('hour: ' + i);
        //     //     var finalDataInputWinter = {};
            let tempArrayWinter = [];
            let rhArrayWinter = [];
        //     //     var finalDataInputSummer = {};
        //     //     var tempArraySummer = [];
        //     //     var rhArraySummer = [];
            let currentTimePointWinter = winterTime.filter(f.hourFilter, i);
        //     //     var currentTimePointSummer = summerTime.filter(hourFilter, hour);
            console.log('currentTimePointWinter: ' + JSON.stringify(currentTimePointWinter));
            let targetConditionWinter = winterStrat.filter(f.hourFilter, i);
            let testTemperatureWinter = targetConditionWinter[0].t;
            let testRelativeHumidityWinter = targetConditionWinter[0].h;
        //     //     var targetConditionSummer = summerStrat.filter(hourFilter, hour);
        //     //     var testTemperatureSummer = targetConditionSummer[0].t;
        //     //     var testRelativeHumiditySummer = targetConditionSummer[0].h;
            console.log('targetConditionWinter: ' + JSON.stringify(targetConditionWinter));
            console.log('testTemperatureWinter: ' + JSON.stringify(testTemperatureWinter));
            console.log('testRHWinter: ' + JSON.stringify(testRelativeHumidityWinter));
        //     //     console.log( 'targetConditionSummer: '+JSON.stringify(targetConditionSummer));
        //     //     console.log('testTemperatureSummer: '+ JSON.stringify(testTemperatureSummer));
        //     //     console.log('testRHSummer: '+ JSON.stringify(testRelativeHumiditySummer));
            let testEnthalpyWinter = p.psychrometric(testTemperatureWinter, testRelativeHumidityWinter).enthalpy;
            console.log('testEnthalpyWinter: ' + JSON.stringify(testEnthalpyWinter));
            let testMixingRatioWinter = p.psychrometric(testTemperatureWinter, testRelativeHumidityWinter).mixingRatio;
            console.log('testMixingRatioWinter: ' + JSON.stringify(testMixingRatioWinter));
        //     //     var testEnthalpySummer = new psychrometric(testTemperatureSummer,testRelativeHumiditySummer).enthalpy;
        //     //     var testMixingRatioSummer = new psychrometric(testTemperatureSummer,testRelativeHumiditySummer).mixingRatio;
            var newPoint = currentTimePointWinter.map((obj) => f.cellEvaluator(obj, capCB, tempCB, testEnthalpyWinter, testMixingRatioWinter));
            // console.log('currentTimePointWinter: ' + JSON.stringify(currentTimePointWinter));
            // let selectedCellsWinter = currentTimePointWinter.filter((obj,index,array) => f.selectCells(obj,index,array));
            // console.log('selectedCells1: ' + JSON.stringify(selectedCellsWinter));
            // selectedCellsWinter.forEach((obj) => f.arrayPush(obj, tempArrayWinter, rhArrayWinter));
            // var tempArrayWinter = winterEvaluation.tempArrayWinter;
        //     //     currentTimePointSummer.forEach((obj, index, array) => cellEvaluator(obj, index, array, capCB, tempCB, tempArraySummer, rhArraySummer, testEnthalpySummer, testMixingRatioSummer));
            console.log('newPoint: ' + JSON.stringify(newPoint));
            // console.log('newArr2: ' + JSON.stringify(newArr2));
            console.log('tempArrayWinter: ' + JSON.stringify(tempArrayWinter));
            console.log('rhArrayWinter: ' + JSON.stringify(rhArrayWinter));
            // console.log('tempArrayWinter: ' + JSON.stringify(tempArrayWinter));
        //     console.log('rhArrayWinter: ' + JSON.stringify(rhArrayWinter));
        //     //   console.log('tempArraSummer: '+JSON.stringify(tempArraySummer));
        //     //   console.log('rhArraySummer: '+JSON.stringify(rhArraySummer));
            // let tempMedianWinter = f.median(tempArrayWinter);
        //     let tempAverageWinter = f.average(tempArrayWinter);
        //     let tempQ1Winter = f.firstQuartile(tempArrayWinter);
        //     let tempQ3Winter = f.thirdQuartile(tempArrayWinter);
        //     let tempLowWinter = f.lowestValue(tempArrayWinter);
        //     let tempHighWinter = f.highestValue(tempArrayWinter);
        //     let rhMedianWinter = f.median(rhArrayWinter);
        //     let rhQ1Winter = f.firstQuartile(rhArrayWinter);
        //     let rhQ3Winter = f.thirdQuartile(rhArrayWinter);
        //     let rhLowWinter = f.lowestValue(rhArrayWinter);
        //     let rhHighWinter = f.highestValue(rhArrayWinter);
        //     finalDataInputWinter.hour = hour;
        //     finalDataInputWinter.targetT = testTemperatureWinter;
        //     finalDataInputWinter.targetRH = testRelativeHumidityWinter;
        //     finalDataInputWinter.V1T = tempLowWinter;
        //     finalDataInputWinter.V2T = tempQ1Winter;
        //     finalDataInputWinter.V3T = tempQ3Winter;
        //     finalDataInputWinter.V4T = tempHighWinter;
        //     finalDataInputWinter.medT = tempMedianWinter;
        //     finalDataInputWinter.V1RH = rhLowWinter;
        //     finalDataInputWinter.V2RH = rhQ1Winter;
        //     finalDataInputWinter.V3RH = rhQ3Winter;
        //     finalDataInputWinter.V4RH = rhHighWinter;
        //     finalDataInputWinter.medRH = rhMedianWinter;
        //     //     var finalDataInputWinter = {
        //     //       hour : hour,
        //     //       targetT: testTemperatureWinter,
        //     //       targetRH: testRelativeHumidityWinter,
        //     //       V1T : tempLowWinter,
        //     //       V2T: tempQ1Winter,
        //     //       V3T : tempQ3Winter,
        //     //       V4T : tempHighWinter,
        //     //       medT : tempMedianWinter,
        //     //       V1RH : rhLowWinter,
        //     //       V2RH : rhQ1Winter,
        //     //       V3RH : rhQ3Winter,
        //     //       V4RH : rhHighWinter,
        //     //       medRH : rhMedianWinter
        //     //     };
        //     arrDataWinter.push(finalDataInputWinter);
        
        }
    // Here we change hour, so at this point the object with all needed values for the hour must have been created and pushed into the array we will use for graphing.
    // console.log('result: ' + JSON.stringify(result));
    // return { responseData };
    return { "1": 1 };
    // return {output_Capture, output_Dist, output_Fruits};
}