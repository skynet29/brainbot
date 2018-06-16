"use strict"



var gulp = require('gulp')
var concat = require('gulp-concat')
var injectHTML = require('gulp-inject-stringified-html')
var to5 = require('gulp-6to5')
var inject = require('gulp-inject-string')

var fs = require('fs')
var path = require('path')


function source(srcs, dist, options) {
	options = options || {}
	console.log('source', srcs, dist, options)

	var stream = gulp.src(srcs)
	if (options.injectHTML === true) {
		stream = stream.pipe(injectHTML())
	}

	if (typeof options.lib == 'string') {
		stream = stream.pipe(inject.before('init:', `\n\tlib: '${options.lib}',\n`))
	}

	if (options.to5 === true) {
		stream = stream.pipe(to5())
	}
	if (typeof options.concat == 'string') {
		stream = stream.pipe(concat(options.concat))
	}


	return stream.pipe(gulp.dest(dist))
}


let tasks = require('./gulp.conf.js')


let watchTasks = {}

for(let task in tasks) {
	let info = tasks[task]

	let dest = info.dest || './dist/'



	gulp.task(task, function() {
		if (typeof info.subdir == 'string') {
			return folderSource2(info.src, info.subdir, dest)
		}
		if (typeof info.ext == 'string') {
			return folderSource(info.src, info.ext, dest, info.options)
		}	
		else {
			return source(info.src, dest, info.options)
		}	
		
	})

	if (info.watch === true) {
		var src = info.src
		if (typeof info.ext == 'string') {
			src += '/**/*.' + info.ext
		}
		var srcs = [src]
		if (info.options && info.options.injectHTML === true) {
			srcs.push(src.replace('*.js', '*.html'))
		}
		watchTasks[task] = srcs
	}
}


function getFolders(dir) {
	return fs.readdirSync(dir)
		.filter(function(file) {
			return fs.statSync(path.join(dir, file)).isDirectory()
		})
}



function folderSource(folderPath, ext, dest, options) {
		var folders = getFolders(folderPath)


		//console.log('folders', folders)
		return folders.map(function(folder) {
			let opts = Object.assign({}, options)
			let d = dest

			if (opts.lib === true) {
				opts.lib = folder
			}

			if (opts.concat === '$folder') {
				opts.concat = folder + '.' + ext
			}
			else {
				d += folder
			}

			return source(path.join(folderPath, folder, '/**/*.' + ext), d, opts)
		})

}

function folderSource2(folderPath, subFolder, dest) {
		var folders = getFolders(folderPath)


		//console.log('folders', folders)
		return folders.map(function(folder) {

			return source(
				path.join(folderPath, folder, subFolder, '/**/*'),
				path.join(dest, folder, subFolder))
		})

}



//console.log('tasks', Object.keys(tasks))
gulp.task('all', Object.keys(tasks))

//console.log('watchTasks', watchTasks)

gulp.task('watch', ['all'], function() {

	for(let task in watchTasks) {
		console.log('watch', watchTasks[task], [task])
		gulp.watch(watchTasks[task], [task])
	}

})