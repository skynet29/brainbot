var usersModel = require('../lib/usersModel')

module.exports = function(app) {

	app.post('/connect', function(req, res) {
		console.log('connect', req.body, req.path)
		var user = req.body.user

		usersModel.getUserInfo(user).then((userInfo) => {

			console.log('userInfo', userInfo)
			if (userInfo == null) {
				res.render('login', {message: 'Unknown user', user:''})
			}
			else if (userInfo.pwd != req.body.pwd) {
				res.render('login', {message: 'Bad password', user: user})
			}

			else {

				req.session.connected = true
/*				connectedUsers[user] = Date.now()
*/				console.log(`user '${user}' connected with IP:${req.ip}`)

				req.session.allowedApps = userInfo.allowedApps

				req.session.user = user
				res.redirect('/')
/*				sendStatus()
*/			}

		}).catch((e) => {
				console.log('error', e)
				res.render('error', {message: e})
			}
		)
	})

	app.get('/disconnect', function(req, res) {
		console.log('disconnect')
/*		delete connectedUsers[req.session.user]
*/		req.session.connected = false
		req.session.destroy()
		res.redirect('/')
/*		sendStatus()
*/
	})

}