var mongo = require('mongodb')
var client = mongo.MongoClient

var usersSeed = require('../db/users.json')
var users = []
for(var userName in usersSeed) {
	users.push(Object.assign({name: userName}, usersSeed[userName]))
}
//console.log('users', users)

client.connect('mongodb://localhost:27017/reviews', (err, db) => {
	console.log(err)
	if (err) {
		console.log('Error connection to Mongo')
		process.exit(1)
	}

	console.log('Connected to Mongo')

	var userCollection = db.collection('users')
/*	userCollection.find({}, {name:1}).toArray().then((docs) => {
		console.log(docs)
	})*/
	userCollection.removeMany().then(() => {
		return userCollection.insertMany(users)
	}).then(() => {
		return userCollection.find({}, {name:1}).toArray()
	})
	.then((docs) => {
		console.log('docs', docs)
	})


})
