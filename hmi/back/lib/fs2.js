var fs = require('fs')
var path = require('path')

function readdir(filePath) {
	return new Promise(function(resolve, reject) {
		fs.readdir(filePath, function(err, files) {
			if (err) {
				reject(err)
			}
			else {
				resolve(files)
			}
		})
	})
}


function lstat(filePath) {
	return new Promise(function(resolve, reject) {
		fs.lstat(filePath, function(err, stats) {
			if (err) {
				reject(err)
			}
			else {
				stats.name = path.basename(filePath)
				resolve(stats)
			}
		})
	})
}

function unlink(filePath) {
	return new Promise(function(resolve, reject) {
		fs.unlink(filePath, function(err) {
			if (err) {
				reject(err)
			}
			else {
				resolve()
			}
		})
	})	
}

function mkdir(filePath) {
	return new Promise(function(resolve, reject) {
		fs.mkdir(filePath, function(err) {
			if (err) {
				reject(err)
			}
			else {
				resolve()
			}
		})
	})	
}

function rmdir(filePath) {
	return new Promise(function(resolve, reject) {
		fs.rmdir(filePath, function(err) {
			if (err) {
				reject(err)
			}
			else {
				resolve()
			}
		})
	})	
}

function rename(srcPath, destPath) {
	return new Promise(function(resolve, reject) {
		fs.rename(srcPath, destPath, function(err) {
			if (err) {
				reject(err)
			}
			else {
				resolve()
			}
		})
	})	
}

function copyFile(srcPath, destPath) {
	return new Promise(function(resolve, reject) {

		var src = fs.createReadStream(srcPath)

		src.on('error', function(err) {
			reject(err)
		})

		var dest = fs.createWriteStream(destPath)

		dest.on('error', function(err) {
			reject(err)
		})

		dest.on('close', function() {
			resolve()
		})

		src.pipe(dest)

/*		fs.copyFile(srcPath, destPath, function(err) {
			if (err) {
				reject(err)
			}
			else {
				resolve()
			}
		})
*/	})	
}


function readFile(filePath) {
	return new Promise(function(resolve, reject) {
		fs.readFile(filePath, function(err, data) {
			if (err) {
				reject(err)
			}
			else {
				resolve(data)
			}
		})
	})	
}

function writeFile(filePath, content) {
	console.log('writeFile', filePath)
	return new Promise(function(resolve, reject) {
		fs.writeFile(filePath, content, function(err) {
			console.log('writeFile', err)
			if (err) {
				reject(err)
			}
			else {
				resolve(content)
			}
		})
	})	
}


/*function readJSONFile(filePath) {
	return new Promise(function(resolve, reject) {
		fs.readFile(filePath, function(err, data) {
			if (err) {
				reject(err)
			}
			else {
				try {
					var config = JSON.parse(data.toString())	
					resolve(config)
				}
				catch(e) {
					reject({error: 'Parse error', detail: e.message})
				}						
			}
		})
	})	
}*/

function readJSONFile(filePath) {
	return readFile(filePath).then(function(data) {
		try {
			return Promise.resolve(JSON.parse(data.toString()))	
		}
		catch(e) {
			return Promise.reject({error: 'Parse error', detail: e.message})
		}			
	})
	
}

function writeJSONFile(filePath, data) {
	return writeFile(filePath, JSON.stringify(data, null, 4))
	
}


module.exports = {
	readdir,
	lstat,
	readJSONFile,
	writeJSONFile,
	unlink,
	mkdir,
	rmdir,
	rename,
	copyFile
}