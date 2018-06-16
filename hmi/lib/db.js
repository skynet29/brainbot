
var dbClient = require('mongodb').MongoClient
var db = null


module.exports = {

	open: function(dbUrl) {
		return new Promise((resolve, reject) => {
			dbClient.connect(dbUrl, (err, db) => {
				if (err) {
					reject(err)
					return
				}

				this.db = db
				resolve()

			})			
		})


	},

	getCollection(name) {
		return this.db.collection(name)
	}

}