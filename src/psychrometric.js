exports.psychrometric = function psychrometric(temperature, relativeHumidity, mixingRatioAirFinal) {
    var a = function () {
        return 6.116441 * Math.pow(10, ((7.591386 * temperature) /
            (temperature + 240.7263))) * 100;
    }; /* [Pa] */
    var saturatedWaterVapourPressure = a();
    var waterVapourPressure = relativeHumidity * (saturatedWaterVapourPressure / 100); /* [Pa] */
    var absoluteHumidity = 2.16679 * (a() * (relativeHumidity / 100)) / (273.15 + temperature); /* [g/m3] */
    var absoluteHumiditySaturationPoint = 2.16679 * a() / (273.15 + temperature); /* [g/m3] */
    var humidityDeficit = absoluteHumiditySaturationPoint - absoluteHumidity; /* [g/m3] */
    var dewPointTemperature = (237.3 * Math.log(((saturatedWaterVapourPressure / 100) * relativeHumidity) / 611)) /
        (7.5 * Math.log(10) - Math.log(((saturatedWaterVapourPressure / 100) * relativeHumidity) / 611));
    var saturatedWaterVapourPressureDewPointTemperature = 6.116441 *
        Math.pow(10, ((7.591386 * dewPointTemperature) / (dewPointTemperature + 240.7263))) * 100; /* [Pa] */
    var mixingRatio = 621.9907 * (saturatedWaterVapourPressureDewPointTemperature / 100) /
        (998 - (saturatedWaterVapourPressureDewPointTemperature / 100)); /* [g_Water/ kg_Air] */
    var enthalpy = temperature * (1.01 + 0.00189 * mixingRatio) + 2.5 * mixingRatio; /* [KJ/Kg] */
    var enthalpy2 = temperature * (1.01 + 0.00189 * mixingRatioAirFinal) + 2.5 * mixingRatioAirFinal; /* [KJ/Kg] */
    var wetBulbTemperature = temperature * Math.atan(0.151977 * Math.pow(relativeHumidity + 8.313659, (1 / 2))) +
        Math.atan(temperature + relativeHumidity) - Math.atan(relativeHumidity - 1.676331) +
        0.00391838 * Math.pow(relativeHumidity, (3 / 2)) * Math.atan(0.023101 * relativeHumidity) -
        4.686035;

        let conclusion = {
            temperature: temperature,
            relativeHumidity: relativeHumidity,
            saturatedWaterVapourPressure: saturatedWaterVapourPressure,
            waterVapourPressure: waterVapourPressure,
            absoluteHumidity: absoluteHumidity,
            absoluteHumiditySaturationPoint: absoluteHumiditySaturationPoint,
            humidityDeficit: humidityDeficit,
            mixingRatio: mixingRatio,
            enthalpy: enthalpy,
            enthalpy2: enthalpy2,
            wetBulbTemperature: wetBulbTemperature,
            dewPointTemperature: dewPointTemperature,
            saturatedWaterVapourPressureDewPointTemperature: saturatedWaterVapourPressureDewPointTemperature
        }

        return conclusion;

    // this.temperature = temperature;
    // this.relativeHumidity = relativeHumidity;
    // this.saturatedWaterVapourPressure = saturatedWaterVapourPressure;
    // this.waterVapourPressure = waterVapourPressure;
    // this.absoluteHumidity = absoluteHumidity;
    // this.absoluteHumiditySaturationPoint = absoluteHumiditySaturationPoint;
    // this.humidityDeficit = humidityDeficit;
    // this.mixingRatio = mixingRatio;
    // this.enthalpy = enthalpy;
    // this.enthalpy2 = enthalpy2;
    // this.wetBulbTemperature = wetBulbTemperature;
    // this.dewPointTemperature = dewPointTemperature;
    // this.saturatedWaterVapourPressureDewPointTemperature = saturatedWaterVapourPressureDewPointTemperature;
}