var mongo = require('mongodb')
var client = mongo.MongoClient

var seed = require('../db/bebus/stops.json')
var data = []
for(var stopName in seed) {
	var stops = seed[stopName]
	stops.forEach(function(stop) {
		stop._id = stop.Stop_id
		delete stop.Stop_id
		data.push(stop)
	})
}
console.log('data', data)

client.connect('mongodb://localhost:27017/bebus', (err, db) => {
	console.log(err)
	if (err) {
		console.log('Error connection to Mongo')
		process.exit(1)
	}

	console.log('Connected to Mongo')

	var collection = db.collection('stops')
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
