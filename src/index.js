/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.boerDenHoedt = function boerDenHoedt(req, res) {

    // res.setHeader('Content-Type', 'application/json');
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');
    var results = [];

    // const payload = require('../src/payload.json');

    try {

        // const authentication = require('./authentication.json'); // collection of keys 

        { // THROW ERRORS WHEN NEEDED
            // Throw error when authentication header is undefined
            // if (req.headers.authentication === undefined) throw {
            //     'error_message': 'No authentication filled in',
            //     'error_code': 400,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // // Throw error when authentication header is not valid
            // var authenticationKeys = authentication.keys;
            // if (authenticationKeys.indexOf(req.headers.authentication) === -1) throw {
            //     'error_message': 'Authentication key not valid',
            //     'error_code': 401,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload === undefined) throw {
            //     'error_message': 'No message defined!',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.start === undefined) throw {
            //     'error_message': 'Start date is not defined',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.end === undefined) throw {
            //     'error_message': 'End date is not defined',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.start > payload.end) throw {
            //     'error_message': 'Start date is after End date',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.measurements === undefined) throw {
            //     'error_message': 'Sensor data is missing from request',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.data.temperature === undefined && payload.data.humidity === undefined && payload.data.co2 === undefined) throw {
            //     'error_message': 'Sensor data posted is empty',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.data.temperature === undefined && payload.data.humidity === undefined) throw {
            //     'error_message': 'Temperature and Relative Humidity data are missing from request',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.measurements.temperature === undefined && payload.measurements.co2 === undefined) throw {
            //     'error_message': 'Temperature and CO2 data are missing from request',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.data.humidity === undefined && payload.data.co2 === undefined) throw {
            //     'error_message': 'Relative Humidity and CO2 data are missing from request',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.measurements.temperature === undefined) throw {
            //     'error_message': 'Temperature data is missing from request',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.data.humidity === undefined) throw {
            //     'error_message': 'Relative Humidity data is missing from request',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
            // if (payload.measurements.co2 === undefined) throw {
            //     'error_message': 'CO2 data is missing from request',
            //     'error_code': 200,
            //     'results': results,
            //     'status': 'ERROR'
            // };
        }

        const f = require('./functions');

        const body = payload;
        const result = body.result;
        const summerStrat = body.summerStrat;
        const winterStrat = body.winterStrat;
        const summerTime1 = result.filter(function (obj) { return obj.season === 'summer'; });
        const winterTime1 = result.filter(function (obj) { return obj.season === 'winter'; });
        var summerTime=[];
        var winterTime=[];

        // console.log('winterTime1: '+ JSON.stringify(winterTime1));

        // for(y=1; y<13; y++){

        //     var summerTime = [];
        //     var winterTime = [];
        //     var monthTime = [];

        //     let monthlyConditions = result.filter(f.monthFilter, y);

        for(i=0; i<24; i++){

            // let hourConditions = monthlyConditions.filter(f.hourFilter, i);
            let timeWinter = winterTime1.filter(f.hourFilter, i);
            let timeSummer = summerTime1.filter(f.hourFilter, i);

            // console.log("hourConditions: " + JSON.stringify(hourConditions));

            // monthTime.push(hourConditions);

            summerTime.push(timeSummer);
            winterTime.push(timeWinter);
        }

        // console.log('winterTime: ' + JSON.stringify(winterTime));
        // console.log('summerTime: ' + JSON.stringify(summerTime));

        const calcs = require('./calcs');
        const calcs1 = require('./calcs1');
        const calcs2 = require('./calcs2');

        // console.log('winterTime: '+ JSON.stringify(winterTime));

        // let pgmOutput = standardizedData
        //     .map((obj, index) => pgm.plantGrowthModel(obj, crop1, crop2, requestedData));

        // let trial = calcs.boerDenHoedtCalcs(summerTime, winterTime, summerStrat, winterStrat);

        //   console.log('winterTime2: '+ JSON.stringify(winterTime2));

            // let conditionsFinal = monthTime.map((obj, index, array) => calcs1.boerDenHoedtCalcs1(obj, index, array, winterStrat, summerStrat));

        let winterFinal = winterTime.map((obj,index,array) => calcs2.boerDenHoedtCalcs2(obj, index, array, winterStrat));
        let summerFinal = summerTime.map((obj, index, array) => calcs2.boerDenHoedtCalcs2(obj, index, array, summerStrat))

        // monthlyFinal.push(winterFinal);

            console.log('FinalWinter: ' + JSON.stringify(winterFinal) +"\n"+ 'FinalSummer: '+JSON.stringify(summerFinal));

        // console.log('FinalWinter: '+JSON.stringify(winterFinal) /*+"\n"+ 'FinalSummer: '+JSON.stringify(summerFinal)*/);

        // };
    // };
        
        // return (monthlyFinal);
    return (winterFinal);
    

        // res.status(200).send(trial);

    } catch (error) {
        console.log(error);
        // res.status(error.error_code).send(error);
    }


};


// //const standardization1 = require('./standardization');
// const payload = require('../payload.json');
const payload = require('../payload.json');
// // const payload = require('./payload2.json');
exports.boerDenHoedt({body : payload});