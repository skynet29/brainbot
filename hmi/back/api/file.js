var fs = require('fs')
var path = require('path')
var fs2 = require('../lib/fs2')

var usersPath = path.join(__dirname, '../config/users')

var routes = require('express').Router()


routes.post('/save', function(req, res) {
	console.log('save req', req.files, req.session.user)
	if (!req.files) {
		return res.status(400).send('No files were uploaded.');

	}

	var user = req.session.user
	var userPath = path.join(usersPath, user)
	var picture = req.files.picture
	var destPath = req.body.destPath
	console.log('destPath', destPath)

	console.log('userPath', userPath)

	fs2.lstat(userPath).catch(function(err) {
		console.log('lstat', err)
		return fs2.mkdir(userPath)
	})
	.then(function() {
		picture.mv(path.join(usersPath, user, destPath, picture.name), function(err) {
		    if (err) {
		    	console.log('err', err)
		     	return res.status(500).send(err)
		    }
		 
		    res.send('File uploaded!')
		})
	})		
	.catch(function(e) {
		console.log('error', e)
		res.status(400).send(e.message)			
	})

})


routes.post('/delete', function(req, res) {
	console.log('delete req', req.body)
	var fileNames = req.body
	var user = req.session.user

	var promises = fileNames.map(function(fileName) {
		var fullPath = path.join(usersPath, user, fileName)
		return fs2.lstat(fullPath).then(function(stats) {
			console.log('stats', stats)
			if (stats.isDirectory()) {
				return fs2.rmdir(fullPath)
			} 
			else {
				return fs2.unlink(fullPath)
			}
		})
	})

	Promise.all(promises)
	.then(function() {
		res.status(200).send('File removed !')
	})
	.catch(function(e) {
		console.log('error', e)
		res.status(400).send(e.message)
	})			
})

routes.post('/move', function(req, res) {
	console.log('move req', req.body)
	var fileNames = req.body.fileNames
	var destPath = req.body.destPath

	var user = req.session.user

	var promises = fileNames.map(function(fileName) {
		var fullPath = path.join(usersPath, user, fileName)
		var fullDest = path.join(usersPath, user, destPath, path.basename(fileName))
		console.log('fullDest', fullDest)
		return fs2.rename(fullPath, fullDest)
	})

	Promise.all(promises)
	.then(function() {
		res.status(200).send('File moved !')
	})
	.catch(function(e) {
		console.log('error', e)
		res.status(400).send(e.message)
	})			
})

routes.post('/copy', function(req, res) {
	console.log('copy req', req.body)
	var fileNames = req.body.fileNames
	var destPath = req.body.destPath

	var user = req.session.user

	var promises = fileNames.map(function(fileName) {
		var fullPath = path.join(usersPath, user, fileName)
		var fullDest = path.join(usersPath, user, destPath, path.basename(fileName))
		console.log('fullDest', fullDest)
		return fs2.copyFile(fullPath, fullDest)
	})

	Promise.all(promises)
	.then(function() {
		res.status(200).send('File copied !')
	})
	.catch(function(e) {
		console.log('error', e)
		res.status(400).send(e.message)
	})			
})


routes.post('/mkdir', function(req, res) {
	console.log('mkdir req', req.body)
	var fileName = req.body.fileName
	var user = req.session.user

	var userPath = path.join(usersPath, user)
	console.log('userPath', userPath)


	fs2.lstat(userPath).catch(function(err) {
		console.log('lstat', err)
		return fs2.mkdir(userPath)
	})
	.then(function() {
		return fs2.mkdir(path.join(usersPath, user, fileName))
	})		
	.then(function() {
		res.status(200).send('Folder created !')
	})
	.catch(function(e) {
		console.log('error', e)
		res.status(400).send(e.message)			
	})
	
})	

routes.post('/rmdir', function(req, res) {
	console.log('rmdir req', req.body)
	var fileName = req.body.fileName
	var user = req.session.user

	fs2.rmdir(path.join(usersPath, user, fileName))
	.then(function() {
		res.status(200).send('Folder created !')
	})
	.catch(function(e) {
		res.status(400).send(e.message)
	})
	
	
})

function isImage(fileName) {
	return (/\.(gif|jpg|jpeg|png)$/i).test(fileName)
}	

routes.post('/list', function(req, res) {
	console.log('list req', req.session.user)
	console.log('params', req.body)
	var user = req.session.user
	var destPath = req.body.path
	var rootPath = path.join(usersPath, user)
	if (destPath) {
		rootPath = path.join(rootPath, destPath)
	}

	fs2.readdir(rootPath)
	.then(function(files) {
		console.log('files', files)
		var promises = files.map((file) => fs2.lstat(path.join(rootPath, file)))
		
		return Promise.all(promises)


		
	})
	.then(function(values) {
		//console.log('values', values)

		var ret = values

		if (req.body.imageOnly === true) {
			ret = ret.filter((value) => value.isDirectory() || isImage(value.name) )
		}

		if (req.body.folderOnly === true) {
			ret = ret.filter((value) => value.isDirectory() )
		}
		
		ret = ret.map(function(value) {
			return {
				title: value.name,
				size: value.size,
				folder: value.isDirectory(),
				lazy: value.isDirectory()
			}
		})
		console.log('values', ret)
		res.json(ret)
	})		
	.catch(function(err) {
		console.log('err', err)
		res.json([])
	}) 

})


routes.get('/load', function(req, res) {
	console.log('load req', req.query)
	var fileName = req.query.fileName
	var user = req.session.user

	res.sendFile(path.join(usersPath, user, fileName))
})



module.exports = routes