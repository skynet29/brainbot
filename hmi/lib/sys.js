const path = require('path')
const fs2 = require('./fs2')

const configPath = path.join(__dirname, '../config/webapps.json')

function readConfig() {
	return fs2.readJSONFile(configPath)
}

function getAppProps(appName) {
	return readConfig().then(function(appsInfo) {
		return appsInfo[appName].props
	})
}

function getAppConfig(appName, appConfigName) {
	return readConfig().then(function(appsInfo) {
		return appsInfo[appName].configs[appConfigName]
	})	
}

function getAppsConfigs() {
	return readConfig().then(function(appsInfo) {
		var ret = {}
		for(var k in appsInfo) {
			ret[k] = Object.keys(appsInfo[k].configs || {})
		}
		return ret
	})	
}

module.exports = {
	readConfig,
	getAppProps,
	getAppConfig,
	getAppsConfigs
}