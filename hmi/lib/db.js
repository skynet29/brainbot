
var MongoClient = require('mongodb').MongoClient
var _db = null
const dbName = 'reviews'

module.exports = {

	open: function(dbUrl) {
		console.log('db.open', dbUrl)
		return new Promise((resolve, reject) => {
			MongoClient.connect(dbUrl, (err, client) => {
				console.log('db result', err)
				if (err) {
					reject(err)
					return
				}

				_db = client.db(dbName)
				resolve()

			})			
		})


	},

	getCollection(name) {
		return _db.collection(name)
	}

}