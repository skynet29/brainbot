const db = require('./db.js')

const userCollection = db.getCollection('users')

module.exports =  {
	getUserList: function() {

		console.log('getUserList')
		return userCollection.find({}, {name:1}).toArray()
	},

	getUserInfo: function(userName) {

		console.log('getUserInfo', userName)
		return userCollection.findOne({name: userName})
	},


	updateUserInfo: function(userName, data) {

		console.log(`updateUserInfo`, userName, data)
		var update = {'$set': {allowedApps: data.allowedApps, pwd: data.pwd}}

		return userCollection.updateOne({name: userName}, update)

	},

	createUser: function(userName) {

		console.log(`createUser`, userName)

		return userCollection.insertOne({pwd: 'welcome', allowedApps: {}, name: userName })
	},


	deleteUser: function(userName) {

		console.log(`deleteUser`, userName)

		return userCollection.deleteOne({name: userName})
	}

}


