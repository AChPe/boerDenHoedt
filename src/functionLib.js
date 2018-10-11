/**
 * @file Contains general functions required for the active cooling model calculations (i.e. Boer den Hoedt Cooling Scenarios).
 */

const p = require('./psychrometric');

/**
 * Function to filter the data points relating to the summerPeriod from the overall payload.
 * @param {float} obj  - The current object from the overall payload being scanned by the filter function.
 * @returns {Array} Array containing the dataPoints from the overall payload that occur during the Summer Period.
 */
function summerFilter(obj) {
    return obj.season === 'summer';
}

/**
 * Function to filter the data points relating to the winterPeriod from the overall payload.
 * @param {float} obj  - The current object from the overall payload being scanned by the filter function.
 * @returns {Array} Array containing the dataPoints from the overall payload that occur during the Winter Period.
 */
function winterFilter(obj) {
    return obj.season === 'winter';
}

/**
 * Function to filter the data points relating to a given month (i.e. 1-12) from the overall climateData payload (i.e. hourly Objects for entire period).
 * @param {float} obj  - The current object from the overal climateData Array being scanned by the filter function.
 * @returns {Array} Array containing the dataPoints from the overall climateData payload which correspond to the current month being filtered for.
 */

function monthFilter(obj) { 
    return obj.month == this; 
}

/**
 * Function to filter the data points relating to a given hour (i.e. 0-23) from the pre-filtered seasonal or monthly Arrays (i.e. winterTime1 or summerTime1 arrays, or per month Arrays).
 * @param {float} obj  - The current object from the seasonal Array being scanned by the filter function.
 * @returns {Array} Array containing the dataPoints from the seasonalArrays/monthlyArrays divided into hours. i.e. Array with 24 sub-arrays. Each sub-array contains all data points occuring in a given hour.
 */

function hourFilter(obj) { 
    return obj.hour == this; 
}

/**
 * Function to filter the data points relating to a given hour (i.e. 0-23) from the pre-filtered seasonal Arrays (i.e. winterTime1 or summerTime1 arrays).
 * @param {float} obj  - The current object from the seasonal Array being scanned by the filter function.
 * @param {array} summerTime1 - Array containing the dataPoints from the overall payload that occur during the Summer Period.
 * @param {array} winterTime1 - Array containing the dataPoints from the overall payload that occur during the Winter Period.
 * @param {array} summerTime - Empty array where the hourly dataPoints (i.e. 0-23) for the Summer Season period will be stored.
 * @param {array} winterTime - Empty array where the hourly dataPoints (i.e. 0-23) for the Winter Season period will be stored.
 * @returns {Array} The filled summerTime and winterTime arrays containing the dataPoints from the respective seasonalArrays divided into hours. i.e. Array with 24 sub-arrays. Each sub-array contains all data points occuring in a given hour.
 */

function seasonalHourCooling(result, summerStrat, winterStrat) {
    const fL = require('./functionLib');
    
    let summerFilter = result.filter(fL.summerFilter);
    // console.log("summerFilter: " + JSON.stringify(summerFilter));
    let winterFilter = result.filter(fL.winterFilter);
        // console.log("winterFilter: " + JSON.stringify(winterFilter));
    let summerTime=[];
    let winterTime=[];

    for (let i = 0; i<24; i++) {
        let winterHour = winterFilter.filter(fL.hourFilter, i);
        let summerHour = summerFilter.filter(fL.hourFilter, i);

        summerTime.push(summerHour);
        winterTime.push(winterHour);
    }

    // console.log('winterTime: ' + JSON.stringify(winterTime));
    // console.log('summerTime: ' + JSON.stringify(summerTime));              

    let winterFinal = winterTime.map((obj, index, array) => fL.seasonalCalculator(obj, index, array, winterStrat));
    let summerFinal = summerTime.map((obj, index, array) => fL.seasonalCalculator(obj, index, array, summerStrat));

    console.log('winterFinal: ' + JSON.stringify(winterFinal));
    console.log('summerFinal: ' + JSON.stringify(summerFinal));
}


/**
 * Function to filter and divide the overall payload climateData array initially per month (i.e. 1- 12), and then divides every month into an array per hour (i.e. 0-23).
 * @param {float} obj  - The current object from the seasonal Array being scanned by the filter function.
 * @param {array} result - Array containing the climateData overall payload for the entire year
 * @returns {Array} The filled summerTime and winterTime arrays containing the dataPoints from the respective seasonalArrays divided into hours. i.e. Array with 24 sub-arrays. Each sub-array contains all data points occuring in a given hour.
 */

function monthlyHourCooling(result, winterStrat, summerStrat) {
    const fL = require('./functionLib');

    let finalMonthlyArray = [];

    for (let y = 1; y < 13; y++) {
        
        let monthTime = [];
        let monthlyConditions = result.filter(fL.monthFilter, y);

        for(let i = 0; i < 24; i++) {

            let hourConditions = monthlyConditions.filter(fL.hourFilter, i);
            // console.log("hourConditions: " + JSON.stringify(hourConditions));

            monthTime.push(hourConditions);

        }

        let conditionsFinal = monthTime.map((obj, index, array) => fL.monthlyCalculator(obj, index, array, winterStrat, summerStrat));

        finalMonthlyArray.push({month: y, result : conditionsFinal});
    }

    // console.log('finalMonthlyArray: ' + JSON.strigify(finalMonthlyArray));

    return finalMonthlyArray
}

/**
 * Mapping function for the seasonal arrays that first defines the desiredClimate setpoints, then evaluates all hourObjects relative to the desiredSetpoints and definedStrategy (e.g. cooling for 30 min),
 * and then filters from the overallArray those hourObjects which were defined as badCells that could not be actively cooled. With these un-coolable bad hours we then build the boxPlots to show the client what their climate will look like.
 * @param {float} obj  - The current object from seasonalArray that is being scanned (i.e. an object containing data for a given hour of the year). seasonalArrays contain in each object all hour objects for a given time (i.e. all occurances where hour: 0 within the specified filter --> be it Seasonal or Monthly).
 * @param {float} index - The index number of the current object in the seasonalArray
 * @param {float} array - The seasonalArray being mapped.
 * @param {float} seasonStrat - The desiredClimate strategy for a given season.
 * @returns {Object} Object containing the needed information to generate the temperature and rh boxplots, as well as the overview table, for every hour (i.e. 0-23) perSeason 
 */

function seasonalCalculator(obj, index, array, seasonStrat) {
    const fL = require('./functionLib');
    const p = require('./psychrometric');
    const stats = require('stats-lite');

    let capCB = 75;
    let tempCB = 9;
    let cropLAI = 2;
    let currentTimePoint = obj;
    // console.log('currentTimePoint: ' + JSON.stringify(currentTimePoint));
    // console.log('array: ' + JSON.stringify(array));

    let tempArray = [];
    let rhArray = [];

    let targetCondition = seasonStrat.filter(fL.hourFilter, index);

    // console.log('targetCondition: ' + JSON.stringify(targetCondition));

    let hour = targetCondition[0].hour;
    let testTemperature = targetCondition[0].t;
    let testRelativeHumidity = targetCondition[0].h;

    // console.log('targetCondition: ' + JSON.stringify(targetCondition));
    // console.log('testTemperature: ' + JSON.stringify(testTemperature));
    // console.log('testRH: ' + JSON.stringify(testRelativeHumidity));

    let testEnthalpy = p.psychrometric(testTemperature, testRelativeHumidity).enthalpy;
    // console.log('testEnthalpyWinter: ' + JSON.stringify(testEnthalpy));
    let testMixingRatio = p.psychrometric(testTemperature, testRelativeHumidity).mixingRatio;
    // console.log('testMixingRatioWinter: ' + JSON.stringify(testMixingRatio));

    let totalHourCount = obj.length;

    currentTimePoint.map((obj) => fL.cellEvaluator(obj, capCB, tempCB, testEnthalpy, testMixingRatio));

    let totalBadCells = currentTimePoint.filter((obj, index, array) => fL.badCellsCount(obj, index, array));

    let badCellsCount = totalBadCells.length;

    // console.log('newPoint: ' + JSON.stringify(newPoint));
    let selectedCells = currentTimePoint.filter((obj, index, array) => fL.selectCells(obj, index, array));
    // console.log('selectedCells1: ' + JSON.stringify(selectedCells));
    selectedCells.forEach((obj) => fL.arrayPush(obj, tempArray, rhArray));

    let badCellsFinal = tempArray.length;

    let fractionBadHoursTot = (badCellsCount / totalHourCount) * 100;
    let activeCooledCount = badCellsCount - badCellsFinal;
    let fractionBadCellsFinal = (badCellsFinal / totalHourCount) * 100;

    // console.log('tempArrayWinter: ' + JSON.stringify(tempArray));
    // console.log('rhArrayWinter: ' + JSON.stringify(rhArray));

    let tempMedian = stats.median(tempArray);
    let tempAverage = stats.mean(tempArray);
    let tempQ1 = stats.percentile(tempArray, 0.25);
    let tempQ3 = stats.percentile(tempArray, 0.75);
    let tempLow = fL.lowestValue(tempArray);
    let tempHigh = fL.highestValue(tempArray);
    let rhMedian = stats.median(rhArray);
    let rhQ1 = stats.percentile(rhArray, 0.25);
    let rhQ3 = stats.percentile(rhArray, 0.75);
    let rhLow = fL.lowestValue(rhArray);
    let rhHigh = fL.highestValue(rhArray);

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



    return finalDataInput;

}

/**
 * Mapping function for the Monthly arrays that first defines the desiredClimate setpoints, then evaluates all hourObjects relative to the desiredSetpoints and definedStrategy (e.g. cooling for 30 min),
 * and then filters from the overallArray those hourObjects which were defined as badCells that could not be actively cooled. With these un-coolable bad hours we then build the boxPlots to show the client what their climate will look like.
 * @param {float} obj  - The current object from monthlyArray that is being scanned (i.e. an object containing data for a given hour of the year). monthlyArrays contain in each object all hour objects for a given time (i.e. all occurances where hour: 0 within the specified filter --> be it Seasonal or Monthly).
 * @param {float} index - The index number of the current object in the monthlyArray
 * @param {float} array - The monthlyArray being mapped.
 * @param {float} seasonStrat - The desiredClimate strategy for a given season.
 * @returns {Object} Object containing the needed information to generate the temperature and rh boxplots, as well as the overview table, for every hour (i.e. 0-23) perMonth
 */

function monthlyCalculator(obj, index, array, winterStrat, summerStrat) {
    const fL = require('./functionLib');
    const p = require('./psychrometric');
    const stats = require('stats-lite');

    let capCB = 75;
    let tempCB = 9;
    let cropLAI = 2;
    // console.log('array: ' + JSON.stringify(array));

    let targetCondition = (obj[0].month < 5 || obj[0].month > 8 ? winterStrat.filter(fL.hourFilter, index) : summerStrat.filter(fL.hourFilter, index));
    let hour = targetCondition[0].hour;

    // console.log('targetCondition: ' + JSON.stringify(targetCondition));

    let tempArray = [];
    let rhArray = [];
    let currentTimePoint = obj;
    // console.log('currentTimePoint: ' + JSON.stringify(currentTimePoint));

    let testTemperature = targetCondition[0].t;
    let testRelativeHumidity = targetCondition[0].h;

    // console.log('testTemperature: ' + JSON.stringify(testTemperature));
    // console.log('testRH: ' + JSON.stringify(testRelativeHumidity));

    let testEnthalpy = p.psychrometric(testTemperature, testRelativeHumidity).enthalpy;
    // console.log('testEnthalpyWinter: ' + JSON.stringify(testEnthalpy));
    let testMixingRatio = p.psychrometric(testTemperature, testRelativeHumidity).mixingRatio;
    // console.log('testMixingRatioWinter: ' + JSON.stringify(testMixingRatio));

    let totalHourCount = obj.length;

    currentTimePoint.map((obj) => fL.cellEvaluator(obj, capCB, tempCB, testEnthalpy, testMixingRatio));

    let totalBadCells = currentTimePoint.filter((obj, index, array) => fL.badCellsCount(obj, index, array));

    let badCellsCount = totalBadCells.length;

    let selectedCells = currentTimePoint.filter((obj, index, array) => fL.selectCells(obj, index, array));
    // console.log('selectedCells1: ' + JSON.stringify(selectedCells));
    selectedCells.forEach((obj) => fL.arrayPush(obj, tempArray, rhArray));

    let badCellsFinal = tempArray.length;

    let fractionBadHoursTot = (badCellsCount / totalHourCount) * 100;
    let activeCooledCount = badCellsCount - badCellsFinal;
    let fractionBadCellsFinal = (badCellsFinal / totalHourCount) * 100;


    let tempMedian = stats.median(tempArray);
    let tempAverage = stats.mean(tempArray);
    let tempQ1 = stats.percentile(tempArray, 0.25);
    let tempQ3 = stats.percentile(tempArray, 0.75);
    let tempLow = fL.lowestValue(tempArray);
    let tempHigh = fL.highestValue(tempArray);
    let rhMedian = stats.median(rhArray);
    let rhQ1 = stats.percentile(rhArray, 0.25);
    let rhQ3 = stats.percentile(rhArray, 0.75);
    let rhLow = fL.lowestValue(rhArray);
    let rhHigh = fL.highestValue(rhArray);

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



    return finalDataInput;

}

/**
 * Function to evaluate every hourObject relative to the desiredClimate and determine if it is a badCell and also if the system can convert it into a good condition (i.e. if the badCell can be corrected via ActiveCooling)
 * @param {float} obj  - The current object from currentTimePoint array that is being scanned (i.e. an object containing data for a given hour of the year). CurrentTimePoint contains in each object all hour objects for a given time (i.e. all occurances where hour: 0 within the specified filter --> be it Seasonal or Monthly).
 * @param {float} capCB - The cooling capacity of the coldBlock in W/m2.
 * @param {float} tempCB - The average cold block water temperature (average between supply and return).
 * @param {float} testEnthalpy - The maximum enthalpy allowed/desired in the greenhouse air during the current hour.
 * @param {float} testMixingRatio - The maximum mixingRatio allowed/desired in the greenhouse air during the current hour.
 * @returns {Array} The original object with modified values for temperature and humidity, showing the final outcome of the simulation, as well as the new properties: badCell and activeCooled, which evaluate the hourObject in these terms.
 */

function cellEvaluator(obj, capCB, tempCB, testEnthalpy, testMixingRatio) {
    let psychro = p.psychrometric(obj.t, obj.h);
    //     console.log('t1: '+ obj.t);
    //     console.log('h1: '+ obj.h);
    let deltaH = 2450000; /* [J/Kg_water] */
    let mWater = 18; /* [Kg/Kmol] */
    let R = 8314; /* [J/Kmol K] */
    let hAir = 7; //3.8                                                 /* [m] */
    let fVentForced = 0.02083 * 60; //75    0.00694                                   /* [m3/m2 s] */
    let sMV12 = -0.1;
    let rhoAir = 1.2; /* [Kg/m3] */
    let cpAir = 1005; /* [J/Kg K] */
    let gamma = 65.8; /* [Pa/K] */
    let lai = 2; /* [m2_LA/m2_floor] */
    // var r_b = 500 / 60; //100                                                  /* [s/m] */
    // var r_s = 250 / 60; //50                                                    /* [s/m] */
    let absPressure = 101325; /* [Pa] */
    let Rspec = 287.058; /* [J/Kg K] */
    let rhoDryAir = absPressure / (Rspec * (obj.t + 273.15)); /* [Kg/m3] */
    let xAir = psychro.mixingRatio / 1000; /* [Kg_water/Kg_air] */
    let rhoMoistAir = (rhoDryAir * (1 + xAir) / (1 + 1.609 * xAir)); /* [Kg_air/m3] */
    let fVentFinal = fVentForced * rhoMoistAir; /* [Kg_air/m2 min] */
    let fVentFinal1 = (fVentForced / 60) * rhoMoistAir; /* [Kg_air/m2 s] */
    let cpAir2 = cpAir + 1.82 * xAir; /* [J/Kg K] */
    let testVP = psychro.waterVapourPressure;
    //     var vpCan = psychro.saturatedWaterVapourPressure;
    let vpCB = p.psychrometric(tempCB).saturatedWaterVapourPressure;
    let inputs = {};
    if (obj.time === "night") {
        for (i = 0; i < 30; i++) {
            var tempAir = (i === 0) ? obj.t : inputs.tempFinal2;
            var vpAir = (i === 0) ? testVP : inputs.vpFinal;
            var xRatio = (i === 0) ? (psychro.mixingRatio / 1000) : inputs.xRatioFinal;
            var cpAir3 = cpAir + 1.82 * xRatio;
            var hecAirCB = ((capCB * 60) / (tempAir - tempCB + (6.4 * Math.pow(10, -9)) * deltaH * (vpAir - vpCB)));
            var mvAirCB = ((1 / (1 + Math.exp(sMV12 * (vpAir - vpCB)))) * (6.4 * Math.pow(10, -9)) * hecAirCB * (vpAir - vpCB));
            var xRatioAfterCB = (fVentFinal * (xRatio) - mvAirCB) * (1 / fVentFinal);
            var cpAirAfterCB = cpAir + 1.82 * xRatioAfterCB;
            var capAirAfterCB = fVentFinal * cpAirAfterCB;
            var hAirCB = hecAirCB * (tempAir - tempCB);
            var tempAirAfterCB = tempAir - (hAirCB / capAirAfterCB);
            var capVPAirAfterCB = ((mWater * hAir) / (R * (tempAirAfterCB + 273.15)));
            var vpAirAfterCB = vpAir - (mvAirCB / capVPAirAfterCB);
            var mvCanAir = (0.000333) * 0.9; /* kG/m2/min */ /* Mention for T there is no effect, but for Humidity we do*/ /* If mvAirCB > mvCanAir then you need a heat exchanger to control humidity*/
            var xRatioAfterTrans = ((hAir * rhoMoistAir * xRatio) + mvCanAir) * (1 / (hAir * rhoMoistAir));
            var hAirOut = ((tempAir - obj.t) * (7.7 * 0.5 * 1.24)) * 60; /* U-Value of 4.4. Check */
            var capacityAirAfterEx = hAir * rhoMoistAir * cpAir3;
            var tempAirAfterEx = tempAir - (hAirOut / capacityAirAfterEx);
            var tFinal3 = ((tempAirAfterCB * fVentForced) + tempAirAfterEx * (hAir - fVentForced)) / hAir;
            var vpAirFinal3 = ((vpAirAfterCB * fVentForced) + vpAir * (hAir - fVentForced)) / hAir;
            var xRatioFinal3 = ((fVentFinal * xRatioAfterCB) + ((hAir - fVentForced) * rhoMoistAir * xRatioAfterTrans)) / (hAir * rhoMoistAir);
            inputs.tempFinal2 = tFinal3;
            inputs.vpFinal = vpAirFinal3;
            inputs.xRatioFinal = xRatioFinal3;
            //       console.log(inputs);
        }
    }
    else {
        for (i = 0; i < 1; i++) {

            var tempAirDay = (i === 0) ? obj.t : inputs.tempFinal2;
            var vpAirDay = (i === 0) ? testVP : inputs.vpFinal;
            var xRatioDay = (i === 0) ? (psychro.mixingRatio / 1000) : inputs.xRatioFinal;
            var cpAir3Day = cpAir + 1.82 * xRatioDay;
            var hecAirCBDay = (capCB / (tempAirDay - tempCB + (6.4 * Math.pow(10, -9)) * deltaH * (vpAirDay - vpCB)));
            var mvAirCBDay = ((1 / (1 + Math.exp(sMV12 * (vpAirDay - vpCB)))) * (6.4 * Math.pow(10, -9)) * hecAirCBDay * (vpAirDay - vpCB));
            var xRatioAfterCBDay = (fVentFinal1 * (xRatioDay) - mvAirCBDay) * (1 / fVentFinal1);
            var cpAirAfterCBDay = cpAir + 1.82 * xRatioAfterCBDay;
            var capAirAfterCBDay = fVentFinal1 * cpAirAfterCBDay;
            var hAirCBDay = hecAirCBDay * (tempAirDay - tempCB);
            var tempAirAfterCBDay = tempAirDay - (hAirCBDay / capAirAfterCBDay);
            var capVPAirAfterCBDay = ((mWater * hAir) / (R * (tempAirAfterCBDay + 273.15)));
            var vpAirAfterCBDay = vpAirDay - (mvAirCBDay / capVPAirAfterCBDay);
            var mvCanAirDay = (0.000333 / 60) * 0.9; /* kG/m2/s */
            var xRatioAfterTransDay = ((hAir * rhoMoistAir * xRatioDay) + mvCanAirDay) * (1 / (hAir * rhoMoistAir));
            var lCanAir = deltaH * mvCanAirDay;
            // rGlobSunAir is being calculated here with a shadeScreen, if we dont want shading then we use the calculation below. 
            var rGlobSunAir = (obj.rad > 500 ? (0.1 * obj.rad * 0.85 * 0.3 * 0.5 * (0.4 + 0.1) * 0.5 * 0.5) : (0.1 * obj.rad * 0.85 * 0.5 * (0.4 + 0.1) * 0.5)); /* With Shade Screen */
            // var rGlobSunAir = 0.1 * obj.rad * 0.85 * 0.5 * (
            // \ 0.4 + 0.1) * 0.5;
            var hAirOutDay = ((tempAirDay - obj.t) * (7.7 * 0.5 * 1.24));
            var capacityAirAfterExDay = hAir * rhoMoistAir * cpAir3Day;
            var tempAirAfterExDay = tempAirDay - ((hAirOutDay + lCanAir - rGlobSunAir) / capacityAirAfterExDay);
            // var tempAirAfterExDayScreen = tempAirDay - ((hAirOutDay + lCanAir - rGlobSunAirScreen) / capacityAirAfterExDay);
            var tFinal3Day = ((tempAirAfterCBDay * (fVentForced / 60)) + tempAirAfterExDay * (hAir - (fVentForced / 60))) / hAir;
            // var tFinal3DayScreen = ((tempAirAfterCBDay * (fVentForced / 60)) + tempAirAfterExDayScreen * (hAir - (fVentForced / 60))) / hAir;
            var vpAirFinal3Day = ((vpAirAfterCBDay * (fVentForced / 60)) + vpAirDay * (hAir - (fVentForced / 60))) / hAir;
            var xRatioFinal3Day = ((fVentFinal1 * xRatioAfterCBDay) + ((hAir - (fVentForced / 60)) * rhoMoistAir * xRatioAfterTransDay)) / (hAir * rhoMoistAir);
            inputs.tempFinal2 = tFinal3Day;
            // inputs.tempFinal2Screen = tFinal3DayScreen;
            inputs.vpFinal = vpAirFinal3Day;
            inputs.xRatioFinal = xRatioFinal3Day;
        }
    }
    var psychro4 = p.psychrometric(inputs.tempFinal2, undefined, (inputs.xRatioFinal * 1000));
    var rhFinal = (inputs.vpFinal / psychro4.saturatedWaterVapourPressure) * 100;
    inputs.rhFinal = (rhFinal > 100) ? 100 : rhFinal;
    var enthal1 = psychro.enthalpy;
    var enthal3 = psychro4.enthalpy2;
    var mix1 = psychro.mixingRatio;
    obj.badCell = psychro.enthalpy > testEnthalpy || psychro.mixingRatio > testMixingRatio ? true : false;
    obj.activeCool = obj.badCell === false ? false : (psychro4.enthalpy2 > testEnthalpy /*|| (inputs.xRatioFinal * 1000) > testMixingRatio*/) ? false : true;
    obj.t = inputs.tempFinal2;
    obj.h = inputs.rhFinal;
    return obj;

}

/**
 * Function to evaluate every hourObject relative to the desiredClimate and determine if it is a badCell and show what the conditions would be without activeCooling.
 * @param {float} obj  - The current object from currentTimePoint array that is being scanned (i.e. an object containing data for a given hour of the year). CurrentTimePoint contains in each object all hour objects for a given time (i.e. all occurances where hour: 0 within the specified filter --> be it Seasonal or Monthly).
 * @param {float} capCB - The cooling capacity of the coldBlock in W/m2.
 * @param {float} tempCB - The average cold block water temperature (average between supply and return).
 * @param {float} testEnthalpy - The maximum enthalpy allowed/desired in the greenhouse air during the current hour.
 * @param {float} testMixingRatio - The maximum mixingRatio allowed/desired in the greenhouse air during the current hour.
 * @returns {Array} The original object with modified values for temperature and humidity, showing the final outcome of the simulation, as well as the new properties: badCell and activeCooled, which evaluate the hourObject in these terms. 
 * activeCooled is always false for these hourObjects because they are not being cooled.
 */

function cellEvaluator2(obj, capCB, tempCB, testEnthalpy, testMixingRatio) {
    var psychro = p.psychrometric(obj.t, obj.h);
    //     console.log('t1: '+ obj.t);
    //     console.log('h1: '+ obj.h);
    var deltaH = 2450000; /* [J/Kg_water] */
    var mWater = 18; /* [Kg/Kmol] */
    var R = 8314; /* [J/Kmol K] */
    var hAir = 7; //3.8                                                 /* [m] */
    var fVentForced = 0.02083 * 60; //75    0.00694                                   /* [m3/m2 s] */
    var sMV12 = -0.1;
    var rhoAir = 1.2; /* [Kg/m3] */
    var cpAir = 1005; /* [J/Kg K] */
    var gamma = 65.8; /* [Pa/K] */
    var lai = 2; /* [m2_LA/m2_floor] */
    // var r_b = 500 / 60; //100                                                  /* [s/m] */
    // var r_s = 250 / 60; //50                                                    /* [s/m] */
    var absPressure = 101325; /* [Pa] */
    var Rspec = 287.058; /* [J/Kg K] */
    var rhoDryAir = absPressure / (Rspec * (obj.t + 273.15)); /* [Kg/m3] */
    var xAir = psychro.mixingRatio / 1000; /* [Kg_water/Kg_air] */
    var rhoMoistAir = (rhoDryAir * (1 + xAir) / (1 + 1.609 * xAir)); /* [Kg_air/m3] */
    var fVentFinal = fVentForced * rhoMoistAir; /* [Kg_air/m2 min] */
    var fVentFinal1 = (fVentForced / 60) * rhoMoistAir; /* [Kg_air/m2 s] */
    var cpAir2 = cpAir + 1.82 * xAir; /* [J/Kg K] */
    var testVP = psychro.waterVapourPressure;
    //     var vpCan = psychro.saturatedWaterVapourPressure;
    var vpCB = p.psychrometric(tempCB).saturatedWaterVapourPressure;
    var inputs = {};
    if (obj.time === "night") {
        for (i = 0; i < 1; i++) {
            var tempAir = (i === 0) ? obj.t : inputs.tempFinal2;
            var vpAir = (i === 0) ? testVP : inputs.vpFinal;
            var xRatio = (i === 0) ? (psychro.mixingRatio / 1000) : inputs.xRatioFinal;
            var cpAir3 = cpAir + 1.82 * xRatio;
            // var hecAirCB = ((capCB * 60) / (tempAir - tempCB + (6.4 * Math.pow(10, -9)) * deltaH * (vpAir - vpCB)));
            // var mvAirCB = ((1 / (1 + Math.exp(sMV12 * (vpAir - vpCB)))) * (6.4 * Math.pow(10, -9)) * hecAirCB * (vpAir - vpCB));
            // var xRatioAfterCB = (fVentFinal * (xRatio) - mvAirCB) * (1 / fVentFinal);
            // var cpAirAfterCB = cpAir + 1.82 * xRatioAfterCB;
            // var capAirAfterCB = fVentFinal * cpAirAfterCB;
            // var hAirCB = hecAirCB * (tempAir - tempCB);
            // var tempAirAfterCB = tempAir - (hAirCB / capAirAfterCB);
            // var capVPAirAfterCB = ((mWater * hAir) / (R * (tempAirAfterCB + 273.15)));
            // var vpAirAfterCB = vpAir - (mvAirCB / capVPAirAfterCB);
            var mvCanAir = (0.000333 / 60) * 0.9; /* kG/m2/min */ /* Mention for T there is no effect, but for Humidity we do*/ /* If mvAirCB > mvCanAir then you need a heat exchanger to control humidity*/
            var xRatioAfterTrans = ((hAir * rhoMoistAir * xRatio) + mvCanAir) * (1 / (hAir * rhoMoistAir));
            var hAirOut = ((tempAir - obj.t) * (7.7 * 0.5 * 1.24)); /* U-Value of 4.4. Check */
            var capacityAirAfterEx = hAir * rhoMoistAir * cpAir3;
            var tempAirAfterEx = tempAir - (hAirOut / capacityAirAfterEx);
            var tFinal3 = ((tempAir * (fVentForced / 60)) + tempAirAfterEx * (hAir - (fVentForced / 60))) / hAir;
            var vpAirFinal3 = ((vpAir * (fVentForced / 60)) + vpAir * (hAir - (fVentForced / 60))) / hAir;
            var xRatioFinal3 = ((fVentFinal * xRatio) + ((hAir - (fVentForced / 60)) * rhoMoistAir * xRatioAfterTrans)) / (hAir * rhoMoistAir);
            inputs.tempFinal2 = tFinal3;
            inputs.vpFinal = vpAirFinal3;
            inputs.xRatioFinal = xRatioFinal3;
            //       console.log(inputs);
        }
    }
    else {
        for (i = 0; i < 1; i++) {

            var tempAirDay = (i === 0) ? obj.t : inputs.tempFinal2;
            var vpAirDay = (i === 0) ? testVP : inputs.vpFinal;
            var xRatioDay = (i === 0) ? (psychro.mixingRatio / 1000) : inputs.xRatioFinal;
            var cpAir3Day = cpAir + 1.82 * xRatioDay;
            // var hecAirCBDay = (capCB / (tempAirDay - tempCB + (6.4 * Math.pow(10, -9)) * deltaH * (vpAirDay - vpCB)));
            // var mvAirCBDay = ((1 / (1 + Math.exp(sMV12 * (vpAirDay - vpCB)))) * (6.4 * Math.pow(10, -9)) * hecAirCBDay * (vpAirDay - vpCB));
            // var xRatioAfterCBDay = (fVentFinal1 * (xRatioDay) - mvAirCBDay) * (1 / fVentFinal1);
            // var cpAirAfterCBDay = cpAir + 1.82 * xRatioAfterCBDay;
            // var capAirAfterCBDay = fVentFinal1 * cpAirAfterCBDay;
            // var hAirCBDay = hecAirCBDay * (tempAirDay - tempCB);
            // var tempAirAfterCBDay = tempAirDay - (hAirCBDay / capAirAfterCBDay);
            // var capVPAirAfterCBDay = ((mWater * hAir) / (R * (tempAirAfterCBDay + 273.15)));
            // var vpAirAfterCBDay = vpAirDay - (mvAirCBDay / capVPAirAfterCBDay);
            var mvCanAirDay = (0.000333 / 60) * 0.9; /* kG/m2/s */
            var xRatioAfterTransDay = ((hAir * rhoMoistAir * xRatioDay) + mvCanAirDay) * (1 / (hAir * rhoMoistAir));
            var lCanAir = deltaH * mvCanAirDay;
            // var rGlobSunAir = (obj.rad > 500 ? (0.1 * obj.rad * 0.85 * 0.7 * 0.5 * (0.4 + 0.1) * 0.5 * 0.5) : (0.1 * obj.rad * 0.85 * 0.5 * (0.4 + 0.1) * 0.5)) ; /* With Shade Screen */
            var rGlobSunAir = 0.1 * obj.rad * 0.85 * 0.5 * (0.4 + 0.1) * 0.5;
            var hAirOutDay = ((tempAirDay - obj.t) * (7.7 * 0.5 * 1.24));
            var capacityAirAfterExDay = hAir * rhoMoistAir * cpAir3Day;
            var tempAirAfterExDay = tempAirDay - ((hAirOutDay + lCanAir - rGlobSunAir) / capacityAirAfterExDay);
            // var tempAirAfterExDayScreen = tempAirDay - ((hAirOutDay + lCanAir - rGlobSunAirScreen) / capacityAirAfterExDay);
            var tFinal3Day = ((tempAirDay * (fVentForced / 60)) + tempAirAfterExDay * (hAir - (fVentForced / 60))) / hAir;
            // var tFinal3DayScreen = ((tempAirAfterCBDay * (fVentForced / 60)) + tempAirAfterExDayScreen * (hAir - (fVentForced / 60))) / hAir;
            var vpAirFinal3Day = ((vpAirDay * (fVentForced / 60)) + vpAirDay * (hAir - (fVentForced / 60))) / hAir;
            var xRatioFinal3Day = ((fVentFinal1 * xRatioDay) + ((hAir - (fVentForced / 60)) * rhoMoistAir * xRatioAfterTransDay)) / (hAir * rhoMoistAir);
            inputs.tempFinal2 = tFinal3Day;
            // inputs.tempFinal2Screen = tFinal3DayScreen;
            inputs.vpFinal = vpAirFinal3Day;
            inputs.xRatioFinal = xRatioFinal3Day;
        }
    }
    var psychro4 = p.psychrometric(inputs.tempFinal2, undefined, (inputs.xRatioFinal * 1000));
    var rhFinal = (inputs.vpFinal / psychro4.saturatedWaterVapourPressure) * 100;
    inputs.rhFinal = (rhFinal > 100) ? 100 : rhFinal;
    var enthal1 = psychro.enthalpy;
    var enthal3 = psychro4.enthalpy2;
    var mix1 = psychro.mixingRatio;
    obj.badCell = psychro.enthalpy > testEnthalpy || psychro.mixingRatio > testMixingRatio ? true : false;
    obj.activeCool = obj.badCell === false ? false : (psychro4.enthalpy2 > testEnthalpy /*|| (inputs.xRatioFinal * 1000) > testMixingRatio*/) ? false : true;
    obj.t = inputs.tempFinal2;
    obj.h = inputs.rhFinal;
    return obj;

}

/**
 * Function to filter all hour objects from the currentTimePoint object that were defined as badCells that could not be activelyCooled
 * @param {float} obj  - The current object from currentTimePoint array that is being scanned (i.e. an object containing data for a given hour of the year). 
 * @param {float} index - The index of the current object being scanned in the currentTimePoint array.
 * @param {float} array - The currentTimePoint array itself, which contains in each object all hour objects for a given time (i.e. all occurances where hour: 0 within the specified filter --> be it Seasonal or Monthly).
 * @returns {boolean} The filtered currentTimePoint array including only the hourObjects that were determined to be badHours and could not be activelyCooled. These are the hours we will plot in the barCharts. 
 */

function selectCells(obj, index, array) {
    if (array[index].activeCool === false && array[index].badCell === true) {
        return true
    } else {
        return false
    }
}

/**
 * Function to filter all hour objects from the currentTimePoint object that were defined as badCells
 * @param {float} obj  - The current object from currentTimePoint array that is being scanned (i.e. an object containing data for a given hour of the year). 
 * @param {float} index - The index of the current object being scanned in the currentTimePoint array.
 * @param {float} array - The currentTimePoint array itself, which contains in each object all hour objects for a given time (i.e. all occurances where hour: 0 within the specified filter --> be it Seasonal or Monthly).
 * @returns {boolean} The filtered currentTimePoint array including only the hourObjects that were determined to be badHours.
 */

function badCellsCount(obj, index, array) {
    if (array[index].badCell === true) {
        return true
    } else {
        return false
    }
}

/**
 * Function to push the temperature and relativeHumidity of every object in the selectedCells array into either a Temperature or RelativeHumidty array, where we then analyze the results to build the boxplots.
 * @param {float} obj  - The current object from currentTimePoint array that is being scanned (i.e. an object containing data for a given hour of the year). 
 * @param {float} tempArray - The array where temperature values of the selectedCells array are being stored.
 * @param {float} rhArray - The array where rh values of the selectedCells array are being stored.
 * @returns {Array} The filled temp and rhArrays where the corresponding values from all selectedCells have been stored.
 */

function arrayPush(obj, tempArray, rhArray) {
    tempArray.push(obj.t);
    rhArray.push(obj.h);
}

/**
 * Function to find the lowest value of the population of values stored in the Array.
 * @param {float} Array  - The array where the population of values to be analyzed is stored. 
 * @returns {float} The lowest value of the population of values stored in the Array.
 */

function lowestValue(array) {
    array.sort((a, b) => a - b);
    return array[0];
};

/**
 * Function to find the highest value of the population of values stored in the Array.
 * @param {float} Array  - The array where the population of values to be analyzed is stored. 
 * @returns {float} The highest value of the population of values stored in the Array.
 */

function highestValue(array) {
    array.sort((a, b) => a - b);
    return array[array.length - 1];
};



module.exports = {
    summerFilter: summerFilter,
    winterFilter: winterFilter,
    monthFilter: monthFilter,
    hourFilter: hourFilter,
    seasonalHourCooling: seasonalHourCooling,
    monthlyHourCooling: monthlyHourCooling,
    seasonalCalculator: seasonalCalculator,
    monthlyCalculator: monthlyCalculator,
    cellEvaluator: cellEvaluator,
    cellEvaluator2: cellEvaluator2,
    badCellsCount: badCellsCount,
    selectCells: selectCells,
    arrayPush: arrayPush,
    lowestValue: lowestValue,
    highestValue: highestValue

}