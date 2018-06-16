var express = require('express')
var session = require('express-session')
var bodyParser = require('body-parser')
var db = require('./lib/db.js')
var fileUpload = require('express-fileupload');
var MongoDBStore = require('connect-mongodb-session')(session);
var path = require('path')
var fs = require('fs')
var sys = require('./lib/sys')

var agent = require('../lib/agent')

var port = agent.config.port || 9000
var dbUrl = agent.config.dbUrl
console.log('dbUrl', dbUrl)

if (typeof dbUrl != 'string') {
	console.log('Please specify a url for mongodb in configuration')
	process.exit(1)
}



db.open(dbUrl)
.then(dbReady)
.catch(function(e) {
	console.log('Error', e)
	process.exit(1)	
})




function dbReady() {
	console.log('Connected to Mongo')
	var usersModel = require('./lib/usersModel')

	var app = express()	



	var store = new MongoDBStore(
	  {
	    uri: dbUrl,
	    collection: 'sessions'
	  })


	app.use(session({
		secret: 'keyboard cat',
		store: store,
		resave: true,
		saveUninitialized: true,
		cookie: {maxAge: null}
	})) // maxAge infini :)

	app.use(bodyParser.urlencoded({extended: false}))
	app.use(bodyParser.json())
	app.use(fileUpload())

	app.set('view engine', 'ejs')
	app.set('views', path.join(__dirname, 'views'))	


	// forbid acces to REST API when no user connected
	app.all('/api/*' , function(req, res, next) {
		//console.log('url', req.url)
		if (!req.session.connected) {
			res.sendStatus('401')
		}
		else { 
			next()
		}
	})




	app.use('/api/users', require('./lib/usersRoutes'))
	app.use('/api/file', require('./lib/fileRoutes'))

	app.get('/api/apps', function(req, res) {
		console.log('get /api/apps')
		sys.getAppsConfigs().then(function(appsConfig) {
			res.json(appsConfig)
		})		
	})

	// view controllers

	require('./controllers/app')(app)
	require('./controllers/home')(app)
	require('./controllers/login')(app)

	var mapPath = agent.config.mapPath
	if (typeof mapPath == 'string') {
		app.use('/maps', express.static(mapPath))
	}


	app.use('/data', express.static(path.join(__dirname, 'data')))
	app.use(express.static(path.join(__dirname, 'dist')))


	app.listen(port, function() {
		console.log('WEB Server listening on port',  port)
	})

	agent.start()

/*	agent.start()
	agent.onConnect(function() {
		sendStatus()
	})*/


}


var connectedUsers = {}


function sendStatus() {
	agent.emit('connectedUsers', connectedUsers)
}	




