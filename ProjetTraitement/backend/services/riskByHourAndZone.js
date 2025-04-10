function calculateRiskByHourAndZone(accidents) {
    const riskByHourAndZone = {};

    accidents.forEach(accident => {
        if (!accident.crash_time || !accident.on_street_name) {
            return; // Ignore les accidents sans heure ou sans rue
        }

        const hour = accident.crash_time.trim().substring(0, 5); // Extraction de "hh:mm"
        const zone = accident.on_street_name.trim();

        if (!riskByHourAndZone[hour]) {
            riskByHourAndZone[hour] = {};
        }

        if (!riskByHourAndZone[hour][zone]) {
            riskByHourAndZone[hour][zone] = {
                totalAccidents: 0,
                totalInjuries: 0,
                totalDeaths: 0,
                longitude: parseFloat(accident.longitude) || 0,
                latitude: parseFloat(accident.latitude) || 0
            };
        }

        riskByHourAndZone[hour][zone].totalAccidents++;
        riskByHourAndZone[hour][zone].totalInjuries += parseInt(accident.number_of_persons_injured) || 0;
        riskByHourAndZone[hour][zone].totalDeaths += parseInt(accident.number_of_persons_killed) || 0;
    });

    // Calcul du score de risque
    Object.keys(riskByHourAndZone).forEach(hour => {
        Object.keys(riskByHourAndZone[hour]).forEach(zone => {
            const risk = riskByHourAndZone[hour][zone];
            const severityScore = (risk.totalAccidents * 2) + (risk.totalInjuries * 1.5) + (risk.totalDeaths * 3);
            riskByHourAndZone[hour][zone].riskScore = severityScore;
        });
    });

    return riskByHourAndZone;
}

module.exports = calculateRiskByHourAndZone;
