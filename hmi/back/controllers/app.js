var sys = require('../lib/sys')

function filterFileNames(fileNames, appPath) {
	console.log('filterFileNames', fileNames, appPath)
	return fileNames
	.filter(function(fileName) {
		return typeof fileName == 'string'
	})					
	.map(function(fileName) {
		return (fileName.startsWith('/')) ? fileName : appPath + fileName
	})	
}

function renderApp(appName, user, res) {
	console.log('renderApp')
	var appPath = `/webapps/${appName}/`
	var data = {
		scripts: [appPath + 'app.js'],
		styles: [],
		title: appName,
		log: true,
		user: user
	}

	sys.getAppProps(appName).then(function(props) {
		console.log('props', props)
		if (typeof props.title == 'string') {
			data.title = props.title
		}
		if (Array.isArray(props.scripts)) {
			var scripts = filterFileNames(props.scripts, appPath)
			console.log('scripts', scripts)
			data.scripts = scripts.concat(data.scripts)
		}
		if (Array.isArray(props.styles)) {
			var styles = filterFileNames(props.styles, appPath)
			console.log('styles', styles)
			data.styles = styles
		}
		if (typeof props.log == 'boolean') {
			data.log = props.log
		}

		
		res.render('app', data)
		console.log('renderApp OK')
	})

}


module.exports = function(app) {

	app.get('/apps/:app', function(req, res, next) {
		console.log('requestedApp', req.params, req.path)
		if (req.session.connected) {
			var requestedApp = req.params.app

			if (! (requestedApp in req.session.allowedApps) ) {
				var text = `Connected user '${req.session.user}' is not allowed to access this app`
				res.render('error', {message: text})
			}
			else {
				renderApp(requestedApp, req.session.user, res)
				
			}						
		}
		else {
			res.redirect('/')
		}
	})

}