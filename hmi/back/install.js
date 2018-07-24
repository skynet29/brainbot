var path = require('path')
var fs = require('fs')
var fs2 = require('./lib/fs2')

const appPath = path.join(__dirname, '../front/src/webapps')

function getAppFolders() {
	return fs2.readdir(appPath)
}

function getPropFiles(folders) {
	console.log('folders', folders)
	var promises = folders.map(function(appName) {
		var propsPath = path.join(appPath, appName, 'props.json')

		return fs2
				.readJSONFile(propsPath)
				.then(function(props) {
					//console.log('props', props)
					return {appName, props}
				})
				.catch(function(e) {
					return {appName, props: {}}
				})
	})

	return Promise.all(promises)
}

function getAppConfigs(results) {
	var promises = results.map(function(info) {
		var configPath = path.join(appPath, info.appName, 'config')

		return fs2.readdir(configPath)
			.then(function(configs) {

				return readConfigFiles(configPath, configs)
					.then(function(configInfos) {
						info.configs = configInfos
						return info
					})
			})
			.catch(function() {
				return info
			})

	})
	return Promise.all(promises)
	
}


function readConfigFiles(configPath, configs) {
	var promises = configs
	.map(function(configFileName) {
		var configFilePath = path.join(configPath, configFileName)

		return fs2.readJSONFile(configFilePath)
			.then(function(config) {
				return {
					name: path.basename(configFileName, '.json'),
					config
				}
			})
	})
	return Promise.all(promises)
}

function formatResults(results) {
	var ret = {}
	results.forEach((value) => {
		var appName = value.appName
		delete value.appName
		if (value.configs) {
			var configs = value.configs
			value.configs = {}
			configs.forEach((config) => {
				var name = config.name
				delete config.name
				value.configs[name] = config.config
			})
		}
		ret[appName] = value
	})	
	return ret
}


getAppFolders()
	.then(getPropFiles)
	.then(getAppConfigs)
	.then(function(results) {
		//console.log('results', results)
		
		fs.writeFile('./config/webapps.json', JSON.stringify(formatResults(results), null, 4))
	})



