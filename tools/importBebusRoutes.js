var mongo = require('mongodb')
var client = mongo.MongoClient

var seed = require('../db/bebus/routes.json')
var data = []
seed.forEach(function(route) {
		route._id = route.Route_id
		delete route.Route_id
		data.push(route)
	})
console.log('data', data)

client.connect('mongodb://localhost:27017/bebus', (err, db) => {
	console.log(err)
	if (err) {
		console.log('Error connection to Mongo')
		process.exit(1)
	}

	console.log('Connected to Mongo')

	var collection = db.collection('routes')
	collection.find({}, {name:1}).toArray().then((docs) => {
		console.log(docs)
	})
	collection.removeMany().then(() => {
		return collection.insertMany(data)
	}).then(() => {
		return collection.find({}, {name:1}).toArray()
	})
	.then((docs) => {
		console.log('docs', docs)
	})


})
