//var sys = require('../lib/system')


const sys = require('../lib/sys')

module.exports = function(app) {
	var appsConfig = app.get('appsConfig')

	function renderHome(req, res) {
		console.log('renderHome')

		const user = req.session.user
		const allowedApps = req.session.allowedApps
		//console.log('session', req.session)

		sys.readConfig().then(function(infos) {
			//console.log('infos', infos)
			var appInfos = {}
			for(var k in allowedApps) {
				if (k in infos) {
					appInfos[k] = infos[k]
				}
				
			}

			//console.log('allowedAppsConfig', appInfos)

			res.render('home', {user: user, appInfos})	
			console.log('renderHome OK')

		})

		.catch(function(e) {
			console.log('Error', e)
			res.render('error', {message: e.message})
		})
				
	}
	
	app.get('/', function(req, res) {
		if (req.session.connected) {
			renderHome(req, res)			
		}
		else {
			res.render('login', {message: '', user: ''})
		}
	})

}
