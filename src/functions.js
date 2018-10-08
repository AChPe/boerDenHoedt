const p = require('./psychrometric');

exports.cellEvaluator = function cellEvaluator(obj, capCB, tempCB, testEnthalpy, testMixingRatio) {
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
            var rGlobSunAir = (obj.rad > 500 ? (0.1 * obj.rad * 0.85 * 0.3 * 0.5 * (0.4 + 0.1) * 0.5 * 0.5) : (0.1 * obj.rad * 0.85 * 0.5 * (0.4 + 0.1) * 0.5)) ; /* With Shade Screen */
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

exports.cellEvaluator2 = function cellEvaluator2(obj, capCB, tempCB, testEnthalpy, testMixingRatio) {
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
            var tFinal3 = ((tempAir *(fVentForced / 60)) + tempAirAfterEx * (hAir - (fVentForced / 60))) / hAir;
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

exports.selectCells = function selectCells(obj, index, array) {
    if (array[index].activeCool === false && array[index].badCell === true) {
        return true
    } else {
        return false
    }
}

exports.badCellsCount = function badCellsCount(obj, index, array) {
    if (array[index].badCell === true) {
        return true
    } else {
        return false
    }
}

exports.arrayPush = function arrayPush(obj, tempArray, rhArray) {
    tempArray.push(obj.t);
    rhArray.push(obj.h);
}


exports.firstQuartile = function firstQuartile(array) {
    array.sort((a, b) => a - b);

    var d1 = Math.floor(array.length / 2);

    if (array.length % 2) // if length number is uneven
    {
        var newArr = array.slice(0, d1);
        var halfWay = Math.floor(newArr.length / 2);
        return newArr[halfWay];
    }
    else {
        var newArr1_1 = array.slice(0, d1 - 1);
        var newArr1_2 = array.slice(0, d1);
        var halfWay1_1 = Math.floor(newArr1_1.length / 2);
        var med1_1 = (newArr1_1[halfWay1_1 - 1] + newArr1_1[halfWay1_1]) / 2;
        var halfWay1_2 = Math.floor(newArr1_2.length / 2);
        var med1_2 = newArr1_2[halfWay1_2];
        return (med1_1 + med1_2) / 2;
    }
};


exports.median = function median(array) {
    array.sort((a, b) => a - b);

    var half = Math.floor(array.length / 2);

    if (array.length % 2)
        return array[half];
    else
        return (array[half - 1] + array[half]) / 2;
};


exports.thirdQuartile = function thirdQuartile(array) {
    array.sort((a, b) => a - b);

    var d2 = Math.floor(array.length / 2);

    if (array.length % 2) // if length number is uneven
    {
        var newArr = array.slice(d2);
        var halfWay = Math.floor(newArr.length / 2);
        return newArr[halfWay];
    }
    else {
        var newArr1_1 = array.slice(d2 + 1);
        var newArr1_2 = array.slice(d2);
        var halfWay1_1 = Math.floor(newArr1_1.length / 2);
        var med1_1 = (newArr1_1[halfWay1_1 - 1] + newArr1_1[halfWay1_1]) / 2;
        var halfWay1_2 = Math.floor(newArr1_2.length / 2);
        var med1_2 = newArr1_2[halfWay1_2];
        return (med1_1 + med1_2) / 2;
    }
};

exports.lowestValue = function lowestValue(array) {
    array.sort((a, b) => a - b);
    return array[0];
};

exports.highestValue = function highestValue(array) {
    array.sort((a, b) => a - b);
    return array[array.length - 1];
};

exports.average = function average(array) {
    var count = 0;
    for (i = 0; i < array.length; i++) {
        count += array[i];
    }
    return count / array.length;
};



exports.hourFilter = function hourFilter(obj) { return obj.hour == this; };

exports.monthFilter = function monthFilter(obj) { return obj.month == this; };


