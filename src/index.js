/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.boerDenHoedt = function boerDenHoedt(req, res) {

    // res.setHeader('Content-Type', 'application/json');
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');


    try {

        const fL = require('./functionLib');

        const body = payload;
        const result = body.result;
        const summerStrat = body.summerStrat;
        const winterStrat = body.winterStrat;


        let resultMonthly = fL.monthlyHourCooling(result, winterStrat, summerStrat);
        let resultSeasonal = fL.seasonalHourCooling(result, summerStrat, winterStrat);



        console.log('resultMonthly: ' + JSON.stringify(resultMonthly));
        console.log('resultSeasonal: ' + JSON.stringify(resultSeasonal));
  

        // res.status(200).send(trial);

    } catch (error) {
        console.log(error);
        // res.status(error.error_code).send(error);
    }


};

const payload = require('../payload.json');
exports.boerDenHoedt({body : payload});