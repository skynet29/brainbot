const path = require('path')
const fs2 = require('./fs2')

const usersPath = path.join(__dirname, '../config/users.json')

function readDb() {
	return fs2.readJSONFile(usersPath)
}

function writeDb() {
	return fs2.writeJSONFile(usersPath, users)
}

var users = {
	admin: {
		pwd: 'admin',
		allowedApps: {
			users: true
		}
	}
}

function init() {
	return readDb().then((data) => {
		console.log('Read users OK', data)
		users = data
	}).catch((err) => {
		console.log('Create users.json')
		return writeDb()
	})
}

module.exports =  {
	init,

	getUserList: function() {

		console.log('getUserList')
		return Promise.resolve(Object.keys(users))
	},

	getUserInfo: function(userName) {

		console.log('getUserInfo', userName)
		return Promise.resolve(users[userName])
	},


	updateUserInfo: function(userName, data) {

		console.log(`updateUserInfo`, userName, data)

		if (users[userName]) {
			Object.assign(users[userName], data)
			return writeDb()
		}
		else {
			return Promise.reject('unknown user')
		}
		

	},

	createUser: function(userName) {

		console.log(`createUser`, userName)
		if (users[userName]) {
			
			return Promise.reject('user already created')
		}

		users[userName] = {pwd: 'welcome', allowedApps: {}}
		return writeDb()

	},


	deleteUser: function(userName) {

		console.log(`deleteUser`, userName)

		if (users[userName]) {
			delete users[userName]
			return writeDb()
		}
		else {
			return Promise.reject('unknown user')
		}
	}

}


