(function() {

'use strict';

var statusCodeMap = {
	0: 'OK',
	100: 'Service not available',
	200: 'Invalid parameters'
}

function getErrorMessage(statusCode) {
	return statusCodeMap[statusCode] || ''
}


function factory(EventEmitter2, ws) {



	class Client {

		constructor(id, options) {
			this.sock = null
			this.id = id
			this.isConnected = false
			this.topics = new EventEmitter2({wildcard: true})
			this.services = new EventEmitter2()
			this.events = new EventEmitter2()

			options = options || {}

			const port = options.masterPort || 8090
			const host = options.masterHost || '127.0.0.1'

			this.url = `ws://${host}:${port}/${id}`

			this.registeredTopics = {}
			this.registeredServices = {}
			this.waitingMsg = {}
			this.suspended = false
		}

		suspend() {
			this.suspended = true
		}

		resume() {
			if (this.suspended) {
				for(let topic in this.waitingMsg) {
					const msg = this.waitingMsg[topic]
					this.topics.emit(topic, msg)
				}
				this.waitingMsg = {}
				this.suspended = false
			}
		}

		connect() {
			console.log('try to connect...')

			var sock = ws.connect(this.url, () => {
				console.log("Connected to Master")
				this.isConnected = true
				this.events.emit('connect')

				for(let topic in this.registeredTopics) {
					var getLast = this.registeredTopics[topic]
					this.sendMsg({type: 'register', topic: topic, getLast: getLast})
				}

				for(let srvName in this.registeredServices) {
					this.sendMsg({type: 'registerService', srvName: srvName})
				}

			}) 

			sock.onText((text) => {
				var msg = JSON.parse(text)


				if (typeof msg.topic == 'string') {
					let split = msg.topic.split('.') // compute the id (layerId.objectId) from topic
					if (split.length == 3) {
						split.shift()
						msg.id = split.join('.')
					}					

					if (this.suspended) {
						this.waitingMsg[msg.topic] = msg
					}
					else {
						this.topics.emit(msg.topic, msg)				
					}

				}

				if (msg.type == 'callService') {
					this.handleCallService(msg)
				}				

				if (msg.type == 'callServiceResp') {
					this.services.emit(msg.srvName, msg)
				}				
			
			})

			sock.onClose((code, reason) => {
				//console.log('WS close', code, reason)
				if (this.isConnected) {
					console.log('Disconnected !')
					this.events.emit('disconnect')
				}
				this.isConnected = false
				setTimeout(() => {this.connect()}, 5000)

			})


			this.sock = sock		
		}

		handleCallService(msg) {
			//console.log('handleCallService')
			const func = this.registeredServices[msg.srvName]
			if (typeof func == 'function') {
				var respMsg = {
					type: 'callServiceResp',
					srvName: msg.srvName,
					dest: msg.src,
					statusCode: 0
				}
				func(msg.data, respMsg)
				this.sendMsg(respMsg)			
			}
		}

		sendMsg(msg) {
			//console.log('[Client] sendMsg', msg)
			msg.time = Date.now()
			var text = JSON.stringify(msg)
			if (this.isConnected) {
				this.sock.sendText(text)
			}
		}

		emit(topic, data) {
			//console.log('publish', topic, data)
			var msg = {
				type: 'notif',
				topic: topic
			}

			if (data !== undefined) {
				msg.data = data
			}
			this.sendMsg(msg)
		}

		on(topic, callback) {

			this.topics.on(topic, callback)
		}

		register(topics, getLast, callback) {
			if (typeof topics == 'string') {
				topics = [topics]
			}

			topics.forEach((topic) => {
				this.registeredTopics[topic] = getLast
				this.on(topic, callback)
				if (this.isConnected) {
					this.sendMsg({type: 'register', topic: topic, getLast: getLast})
				}
			})
			
		}

		unregister(topics, callback) {
			if (typeof topics == 'string') {
				topics = [topics]
			}

			topics.forEach((topic) => {

				this.topics.off(topic, callback)
				var nbListeners = this.topics.listeners(topic).length

				if (this.isConnected && nbListeners == 0) { // no more listeners for this topic
					this.sendMsg({type: 'unregister', topic: topic})
				}		
			})
		}		

		registerService(srvName, func) {
			this.registeredServices[srvName] = func
			if (this.isConnected) {
				this.sendMsg({type: 'registerService', srvName: srvName})
			}		
		}


		callService(srvName, data) {
			console.log('[Client] callService', srvName, data)
			var that = this
			return new Promise((resolve, reject) => {
				this.services.once(srvName, function(msg) {
					var statusCode = msg.statusCode
					if (statusCode == 0) {
						resolve(msg.data)
					}
					else {
						reject({
							code: statusCode,
							message: getErrorMessage(msg.statusCode)
						})
					}
				})

				this.sendMsg({
					type: 'callService',
					srvName: srvName,
					data: data
				})
			})
		}



		sendTo(dest, topic, data) {
			var msg = {
				type: 'cmd',
				topic: topic,
				dest: dest
			}

			if (data !== undefined) {
				msg.data = data
			}
			this.sendMsg(msg)		
		}	
		
	}

	return Client
}


if (typeof module != 'undefined') {
	const websocket = require("nodejs-websocket")
	const EventEmitter2 = require('EventEmitter2').EventEmitter2		

	var ws = {
		connect: function(url, onConnect) {
			var sock = websocket.connect(url, onConnect)
			sock.on('error', function(err) {
				console.log('ws error', err)
			})

			return {
				sendText: function(text) {
					sock.sendText(text)
				},
				onText: function(callback) {
					sock.on('text', callback)
				},
				onClose: function(callback) {
					sock.on('close', callback)
				}
			}
		}
	}

	module.exports = factory(EventEmitter2, ws)
}
else {

	var ws = {
		connect: function(url, onConnect) {
			var sock = new WebSocket(url)
			sock.addEventListener('open', onConnect)
			sock.addEventListener('error', function(err) {
				console.log('ws error', err)
			})


			return {
				sendText: function(text) {
					sock.send(text)
				},
				onText: function(callback) {
					sock.addEventListener('message', function(ev) {
						callback(ev.data)
					})
				},
				onClose: function(callback) {
					sock.addEventListener('close', callback)
				}
			}
		}
	}

	window.WebSocketClient = factory(EventEmitter2, ws)

}



})();

$$.registerService('FileService', ['HttpService'], function(config, http) {

	return {
		list: function(path, imageOnly, folderOnly) {
			console.log('[FileService] list', path)

			return http.post('/api/file/list', {path, imageOnly, folderOnly})
		},

		fileUrl: function(fileName) {
			return '/api/file/load?fileName=' + fileName
		},

		uploadFile: function(dataUrl, saveAsfileName, destPath) {
			console.log('[FileService] uploadFile', saveAsfileName)
			var blob = $$.dataURLtoBlob(dataUrl)
			if (blob == undefined) {
				return Promise.reject('File format not supported')
			}
			//console.log('blob', blob)
			var fd = new FormData()
			fd.append('picture', blob, saveAsfileName)
			fd.append('destPath', destPath)
			return http.postFormData('/api/file/save', fd)
		},

		removeFiles: function(fileNames) {
			console.log('[FileService] removeFiles', fileNames)
			return http.post('/api/file/delete', fileNames)
		},

		mkdir: function(fileName) {
			console.log('[FileService] mkdir', fileName)
			return http.post('/api/file/mkdir', {fileName: fileName})
		},

		rmdir: function(fileName) {
			console.log('[FileService] rmdir', fileName)
			return http.post('/api/file/rmdir', {fileName: fileName})
		},

		moveFiles: function(fileNames, destPath) {
			console.log('[FileService] moveFiles', fileNames, destPath)
			return http.post('/api/file/move', {fileNames, destPath})
		},

		copyFiles: function(fileNames, destPath) {
			console.log('[FileService] copyFiles', fileNames, destPath)
			return http.post('/api/file/copy', {fileNames, destPath})
		}	
	}

});

(function() {

	$$.registerService('HttpService', function() {
		return {
			get(url) {
				return $.getJSON(url)
			},


			post(url, data) {
				return $.ajax({
					method: 'POST',
					url : url,
					contentType: 'application/json',
					data: JSON.stringify(data)
				})
			},

			put(url, data) {
				return $.ajax({
					method: 'PUT',
					url : url,
					contentType: 'application/json',
					data: JSON.stringify(data)
				})
			},			

			delete(url) {
				return $.ajax({
					method: 'DELETE',
					url : url,
				})				
			},

			postFormData(url, fd) {
				return $.ajax({
				  url: url,
				  type: "POST",
				  data: fd,
				  processData: false,  // indique à jQuery de ne pas traiter les données
				  contentType: false   // indique à jQuery de ne pas configurer le contentType
				})				
			}

			
		}
	})

	
})();




(function() {

	$$.registerService('LeafletService', ['WebSocketService'], function(config, client) {

		var L = window.L

		if (! L) {
			console.warn(`[LeafletService] Missing library dependancy 'leaflet.js'`)
		}
		else {
			console.log('Leaflet version', L.version)
			console.log('LeafletDraw version', L.drawVersion)
			//delete window.L
			$$.loadStyle('/css/leaflet.css')
		}

		return L

	})

})();
(function() {

	$$.registerService('MilSymbolService', function(config) {

		var ms = window.ms

		if (! ms) {
			console.warn(`[MilSymbolService] Missing library dependancy 'milsymbol.js'`)
		}
		else {
			delete window.ms
		}

		return ms

	})

})();
(function() {

	$$.registerService('OpenLayerService', function(config) {

		var ol = window.ol

		if (! ol) {
			console.warn(`[OpenLayerService] Missing library dependancy 'ol.j'`)
		}
		else {
			delete window.ol
			$$.loadStyle('/css/ol.css')
		}

		return ol

	})

})();
(function() {

	$$.registerService('TreeCtrlService', function(config) {


		if ($.ui.fancytree == undefined) {
			console.warn(`[TreeCtrlService] Missing library dependancy 'tree.js'`)
		}
		else {
			console.log('Fancytree version:', $.ui.fancytree.version)
			$$.loadStyle('/css/tree/tree.css')
		}

		return {}

	})

})();

(function() {

	$$.registerService('TweenMaxService', function(config) {

		var TweenMax = window.TweenMax

		if (! TweenMax) {
			console.warn(`[TweenMaxService] Missing library dependancy 'tween.js'`)
		}
		else {
			//delete window.TweenMax
		}

		return TweenMax

	})

})();
(function() {

	$$.registerService('WebSocketService', function(config) {
		const options = {
			masterPort: config.port || 8090,
			masterHost: config.host || location.hostname
		}

		var id = (config.id || 'WebSocket') + (Date.now() % 100000)

		const client = new WebSocketClient(id, options)
		client.connect()

		return client;
	})


})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsaWVudC5qcyIsImZpbGUuanMiLCJodHRwLmpzIiwibGVhZmxldC5qcyIsIm1pbHN5bWJvbC5qcyIsIm9sLmpzIiwidHJlZS5qcyIsInR3ZWVuLmpzIiwid2Vic29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDclRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc3RhdHVzQ29kZU1hcCA9IHtcclxuXHQwOiAnT0snLFxyXG5cdDEwMDogJ1NlcnZpY2Ugbm90IGF2YWlsYWJsZScsXHJcblx0MjAwOiAnSW52YWxpZCBwYXJhbWV0ZXJzJ1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRFcnJvck1lc3NhZ2Uoc3RhdHVzQ29kZSkge1xyXG5cdHJldHVybiBzdGF0dXNDb2RlTWFwW3N0YXR1c0NvZGVdIHx8ICcnXHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBmYWN0b3J5KEV2ZW50RW1pdHRlcjIsIHdzKSB7XHJcblxyXG5cclxuXHJcblx0Y2xhc3MgQ2xpZW50IHtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihpZCwgb3B0aW9ucykge1xyXG5cdFx0XHR0aGlzLnNvY2sgPSBudWxsXHJcblx0XHRcdHRoaXMuaWQgPSBpZFxyXG5cdFx0XHR0aGlzLmlzQ29ubmVjdGVkID0gZmFsc2VcclxuXHRcdFx0dGhpcy50b3BpY3MgPSBuZXcgRXZlbnRFbWl0dGVyMih7d2lsZGNhcmQ6IHRydWV9KVxyXG5cdFx0XHR0aGlzLnNlcnZpY2VzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cdFx0XHR0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcclxuXHJcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcblxyXG5cdFx0XHRjb25zdCBwb3J0ID0gb3B0aW9ucy5tYXN0ZXJQb3J0IHx8IDgwOTBcclxuXHRcdFx0Y29uc3QgaG9zdCA9IG9wdGlvbnMubWFzdGVySG9zdCB8fCAnMTI3LjAuMC4xJ1xyXG5cclxuXHRcdFx0dGhpcy51cmwgPSBgd3M6Ly8ke2hvc3R9OiR7cG9ydH0vJHtpZH1gXHJcblxyXG5cdFx0XHR0aGlzLnJlZ2lzdGVyZWRUb3BpY3MgPSB7fVxyXG5cdFx0XHR0aGlzLnJlZ2lzdGVyZWRTZXJ2aWNlcyA9IHt9XHJcblx0XHRcdHRoaXMud2FpdGluZ01zZyA9IHt9XHJcblx0XHRcdHRoaXMuc3VzcGVuZGVkID0gZmFsc2VcclxuXHRcdH1cclxuXHJcblx0XHRzdXNwZW5kKCkge1xyXG5cdFx0XHR0aGlzLnN1c3BlbmRlZCA9IHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRyZXN1bWUoKSB7XHJcblx0XHRcdGlmICh0aGlzLnN1c3BlbmRlZCkge1xyXG5cdFx0XHRcdGZvcihsZXQgdG9waWMgaW4gdGhpcy53YWl0aW5nTXNnKSB7XHJcblx0XHRcdFx0XHRjb25zdCBtc2cgPSB0aGlzLndhaXRpbmdNc2dbdG9waWNdXHJcblx0XHRcdFx0XHR0aGlzLnRvcGljcy5lbWl0KHRvcGljLCBtc2cpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMud2FpdGluZ01zZyA9IHt9XHJcblx0XHRcdFx0dGhpcy5zdXNwZW5kZWQgPSBmYWxzZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Y29ubmVjdCgpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ3RyeSB0byBjb25uZWN0Li4uJylcclxuXHJcblx0XHRcdHZhciBzb2NrID0gd3MuY29ubmVjdCh0aGlzLnVybCwgKCkgPT4ge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiQ29ubmVjdGVkIHRvIE1hc3RlclwiKVxyXG5cdFx0XHRcdHRoaXMuaXNDb25uZWN0ZWQgPSB0cnVlXHJcblx0XHRcdFx0dGhpcy5ldmVudHMuZW1pdCgnY29ubmVjdCcpXHJcblxyXG5cdFx0XHRcdGZvcihsZXQgdG9waWMgaW4gdGhpcy5yZWdpc3RlcmVkVG9waWNzKSB7XHJcblx0XHRcdFx0XHR2YXIgZ2V0TGFzdCA9IHRoaXMucmVnaXN0ZXJlZFRvcGljc1t0b3BpY11cclxuXHRcdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3JlZ2lzdGVyJywgdG9waWM6IHRvcGljLCBnZXRMYXN0OiBnZXRMYXN0fSlcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGZvcihsZXQgc3J2TmFtZSBpbiB0aGlzLnJlZ2lzdGVyZWRTZXJ2aWNlcykge1xyXG5cdFx0XHRcdFx0dGhpcy5zZW5kTXNnKHt0eXBlOiAncmVnaXN0ZXJTZXJ2aWNlJywgc3J2TmFtZTogc3J2TmFtZX0pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fSkgXHJcblxyXG5cdFx0XHRzb2NrLm9uVGV4dCgodGV4dCkgPT4ge1xyXG5cdFx0XHRcdHZhciBtc2cgPSBKU09OLnBhcnNlKHRleHQpXHJcblxyXG5cclxuXHRcdFx0XHRpZiAodHlwZW9mIG1zZy50b3BpYyA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0bGV0IHNwbGl0ID0gbXNnLnRvcGljLnNwbGl0KCcuJykgLy8gY29tcHV0ZSB0aGUgaWQgKGxheWVySWQub2JqZWN0SWQpIGZyb20gdG9waWNcclxuXHRcdFx0XHRcdGlmIChzcGxpdC5sZW5ndGggPT0gMykge1xyXG5cdFx0XHRcdFx0XHRzcGxpdC5zaGlmdCgpXHJcblx0XHRcdFx0XHRcdG1zZy5pZCA9IHNwbGl0LmpvaW4oJy4nKVxyXG5cdFx0XHRcdFx0fVx0XHRcdFx0XHRcclxuXHJcblx0XHRcdFx0XHRpZiAodGhpcy5zdXNwZW5kZWQpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy53YWl0aW5nTXNnW21zZy50b3BpY10gPSBtc2dcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHR0aGlzLnRvcGljcy5lbWl0KG1zZy50b3BpYywgbXNnKVx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKG1zZy50eXBlID09ICdjYWxsU2VydmljZScpIHtcclxuXHRcdFx0XHRcdHRoaXMuaGFuZGxlQ2FsbFNlcnZpY2UobXNnKVxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cclxuXHRcdFx0XHRpZiAobXNnLnR5cGUgPT0gJ2NhbGxTZXJ2aWNlUmVzcCcpIHtcclxuXHRcdFx0XHRcdHRoaXMuc2VydmljZXMuZW1pdChtc2cuc3J2TmFtZSwgbXNnKVxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdHNvY2sub25DbG9zZSgoY29kZSwgcmVhc29uKSA9PiB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnV1MgY2xvc2UnLCBjb2RlLCByZWFzb24pXHJcblx0XHRcdFx0aWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdEaXNjb25uZWN0ZWQgIScpXHJcblx0XHRcdFx0XHR0aGlzLmV2ZW50cy5lbWl0KCdkaXNjb25uZWN0JylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5pc0Nvbm5lY3RlZCA9IGZhbHNlXHJcblx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7dGhpcy5jb25uZWN0KCl9LCA1MDAwKVxyXG5cclxuXHRcdFx0fSlcclxuXHJcblxyXG5cdFx0XHR0aGlzLnNvY2sgPSBzb2NrXHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdGhhbmRsZUNhbGxTZXJ2aWNlKG1zZykge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdoYW5kbGVDYWxsU2VydmljZScpXHJcblx0XHRcdGNvbnN0IGZ1bmMgPSB0aGlzLnJlZ2lzdGVyZWRTZXJ2aWNlc1ttc2cuc3J2TmFtZV1cclxuXHRcdFx0aWYgKHR5cGVvZiBmdW5jID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHR2YXIgcmVzcE1zZyA9IHtcclxuXHRcdFx0XHRcdHR5cGU6ICdjYWxsU2VydmljZVJlc3AnLFxyXG5cdFx0XHRcdFx0c3J2TmFtZTogbXNnLnNydk5hbWUsXHJcblx0XHRcdFx0XHRkZXN0OiBtc2cuc3JjLFxyXG5cdFx0XHRcdFx0c3RhdHVzQ29kZTogMFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmdW5jKG1zZy5kYXRhLCByZXNwTXNnKVxyXG5cdFx0XHRcdHRoaXMuc2VuZE1zZyhyZXNwTXNnKVx0XHRcdFxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0c2VuZE1zZyhtc2cpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW0NsaWVudF0gc2VuZE1zZycsIG1zZylcclxuXHRcdFx0bXNnLnRpbWUgPSBEYXRlLm5vdygpXHJcblx0XHRcdHZhciB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkobXNnKVxyXG5cdFx0XHRpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xyXG5cdFx0XHRcdHRoaXMuc29jay5zZW5kVGV4dCh0ZXh0KVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZW1pdCh0b3BpYywgZGF0YSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdwdWJsaXNoJywgdG9waWMsIGRhdGEpXHJcblx0XHRcdHZhciBtc2cgPSB7XHJcblx0XHRcdFx0dHlwZTogJ25vdGlmJyxcclxuXHRcdFx0XHR0b3BpYzogdG9waWNcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdG1zZy5kYXRhID0gZGF0YVxyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuc2VuZE1zZyhtc2cpXHJcblx0XHR9XHJcblxyXG5cdFx0b24odG9waWMsIGNhbGxiYWNrKSB7XHJcblxyXG5cdFx0XHR0aGlzLnRvcGljcy5vbih0b3BpYywgY2FsbGJhY2spXHJcblx0XHR9XHJcblxyXG5cdFx0cmVnaXN0ZXIodG9waWNzLCBnZXRMYXN0LCBjYWxsYmFjaykge1xyXG5cdFx0XHRpZiAodHlwZW9mIHRvcGljcyA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHRvcGljcyA9IFt0b3BpY3NdXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRvcGljcy5mb3JFYWNoKCh0b3BpYykgPT4ge1xyXG5cdFx0XHRcdHRoaXMucmVnaXN0ZXJlZFRvcGljc1t0b3BpY10gPSBnZXRMYXN0XHJcblx0XHRcdFx0dGhpcy5vbih0b3BpYywgY2FsbGJhY2spXHJcblx0XHRcdFx0aWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3JlZ2lzdGVyJywgdG9waWM6IHRvcGljLCBnZXRMYXN0OiBnZXRMYXN0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHVucmVnaXN0ZXIodG9waWNzLCBjYWxsYmFjaykge1xyXG5cdFx0XHRpZiAodHlwZW9mIHRvcGljcyA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHRvcGljcyA9IFt0b3BpY3NdXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRvcGljcy5mb3JFYWNoKCh0b3BpYykgPT4ge1xyXG5cclxuXHRcdFx0XHR0aGlzLnRvcGljcy5vZmYodG9waWMsIGNhbGxiYWNrKVxyXG5cdFx0XHRcdHZhciBuYkxpc3RlbmVycyA9IHRoaXMudG9waWNzLmxpc3RlbmVycyh0b3BpYykubGVuZ3RoXHJcblxyXG5cdFx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkICYmIG5iTGlzdGVuZXJzID09IDApIHsgLy8gbm8gbW9yZSBsaXN0ZW5lcnMgZm9yIHRoaXMgdG9waWNcclxuXHRcdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3VucmVnaXN0ZXInLCB0b3BpYzogdG9waWN9KVxyXG5cdFx0XHRcdH1cdFx0XHJcblx0XHRcdH0pXHJcblx0XHR9XHRcdFxyXG5cclxuXHRcdHJlZ2lzdGVyU2VydmljZShzcnZOYW1lLCBmdW5jKSB7XHJcblx0XHRcdHRoaXMucmVnaXN0ZXJlZFNlcnZpY2VzW3Nydk5hbWVdID0gZnVuY1xyXG5cdFx0XHRpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xyXG5cdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3JlZ2lzdGVyU2VydmljZScsIHNydk5hbWU6IHNydk5hbWV9KVxyXG5cdFx0XHR9XHRcdFxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRjYWxsU2VydmljZShzcnZOYW1lLCBkYXRhKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbQ2xpZW50XSBjYWxsU2VydmljZScsIHNydk5hbWUsIGRhdGEpXHJcblx0XHRcdHZhciB0aGF0ID0gdGhpc1xyXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRcdHRoaXMuc2VydmljZXMub25jZShzcnZOYW1lLCBmdW5jdGlvbihtc2cpIHtcclxuXHRcdFx0XHRcdHZhciBzdGF0dXNDb2RlID0gbXNnLnN0YXR1c0NvZGVcclxuXHRcdFx0XHRcdGlmIChzdGF0dXNDb2RlID09IDApIHtcclxuXHRcdFx0XHRcdFx0cmVzb2x2ZShtc2cuZGF0YSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRyZWplY3Qoe1xyXG5cdFx0XHRcdFx0XHRcdGNvZGU6IHN0YXR1c0NvZGUsXHJcblx0XHRcdFx0XHRcdFx0bWVzc2FnZTogZ2V0RXJyb3JNZXNzYWdlKG1zZy5zdGF0dXNDb2RlKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdHRoaXMuc2VuZE1zZyh7XHJcblx0XHRcdFx0XHR0eXBlOiAnY2FsbFNlcnZpY2UnLFxyXG5cdFx0XHRcdFx0c3J2TmFtZTogc3J2TmFtZSxcclxuXHRcdFx0XHRcdGRhdGE6IGRhdGFcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0c2VuZFRvKGRlc3QsIHRvcGljLCBkYXRhKSB7XHJcblx0XHRcdHZhciBtc2cgPSB7XHJcblx0XHRcdFx0dHlwZTogJ2NtZCcsXHJcblx0XHRcdFx0dG9waWM6IHRvcGljLFxyXG5cdFx0XHRcdGRlc3Q6IGRlc3RcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdG1zZy5kYXRhID0gZGF0YVxyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuc2VuZE1zZyhtc2cpXHRcdFxyXG5cdFx0fVx0XHJcblx0XHRcclxuXHR9XHJcblxyXG5cdHJldHVybiBDbGllbnRcclxufVxyXG5cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnKSB7XHJcblx0Y29uc3Qgd2Vic29ja2V0ID0gcmVxdWlyZShcIm5vZGVqcy13ZWJzb2NrZXRcIilcclxuXHRjb25zdCBFdmVudEVtaXR0ZXIyID0gcmVxdWlyZSgnRXZlbnRFbWl0dGVyMicpLkV2ZW50RW1pdHRlcjJcdFx0XHJcblxyXG5cdHZhciB3cyA9IHtcclxuXHRcdGNvbm5lY3Q6IGZ1bmN0aW9uKHVybCwgb25Db25uZWN0KSB7XHJcblx0XHRcdHZhciBzb2NrID0gd2Vic29ja2V0LmNvbm5lY3QodXJsLCBvbkNvbm5lY3QpXHJcblx0XHRcdHNvY2sub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ3dzIGVycm9yJywgZXJyKVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRzZW5kVGV4dDogZnVuY3Rpb24odGV4dCkge1xyXG5cdFx0XHRcdFx0c29jay5zZW5kVGV4dCh0ZXh0KVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25UZXh0OiBmdW5jdGlvbihjYWxsYmFjaykge1xyXG5cdFx0XHRcdFx0c29jay5vbigndGV4dCcsIGNhbGxiYWNrKVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25DbG9zZTogZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuXHRcdFx0XHRcdHNvY2sub24oJ2Nsb3NlJywgY2FsbGJhY2spXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoRXZlbnRFbWl0dGVyMiwgd3MpXHJcbn1cclxuZWxzZSB7XHJcblxyXG5cdHZhciB3cyA9IHtcclxuXHRcdGNvbm5lY3Q6IGZ1bmN0aW9uKHVybCwgb25Db25uZWN0KSB7XHJcblx0XHRcdHZhciBzb2NrID0gbmV3IFdlYlNvY2tldCh1cmwpXHJcblx0XHRcdHNvY2suYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsIG9uQ29ubmVjdClcclxuXHRcdFx0c29jay5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCd3cyBlcnJvcicsIGVycilcclxuXHRcdFx0fSlcclxuXHJcblxyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdHNlbmRUZXh0OiBmdW5jdGlvbih0ZXh0KSB7XHJcblx0XHRcdFx0XHRzb2NrLnNlbmQodGV4dClcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uVGV4dDogZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuXHRcdFx0XHRcdHNvY2suYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHRcdGNhbGxiYWNrKGV2LmRhdGEpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25DbG9zZTogZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuXHRcdFx0XHRcdHNvY2suYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCBjYWxsYmFjaylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHdpbmRvdy5XZWJTb2NrZXRDbGllbnQgPSBmYWN0b3J5KEV2ZW50RW1pdHRlcjIsIHdzKVxyXG5cclxufVxyXG5cclxuXHJcblxyXG59KSgpO1xyXG4iLCIkJC5yZWdpc3RlclNlcnZpY2UoJ0ZpbGVTZXJ2aWNlJywgWydIdHRwU2VydmljZSddLCBmdW5jdGlvbihjb25maWcsIGh0dHApIHtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdGxpc3Q6IGZ1bmN0aW9uKHBhdGgsIGltYWdlT25seSwgZm9sZGVyT25seSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBsaXN0JywgcGF0aClcclxuXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9saXN0Jywge3BhdGgsIGltYWdlT25seSwgZm9sZGVyT25seX0pXHJcblx0XHR9LFxyXG5cclxuXHRcdGZpbGVVcmw6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XHJcblx0XHRcdHJldHVybiAnL2FwaS9maWxlL2xvYWQ/ZmlsZU5hbWU9JyArIGZpbGVOYW1lXHJcblx0XHR9LFxyXG5cclxuXHRcdHVwbG9hZEZpbGU6IGZ1bmN0aW9uKGRhdGFVcmwsIHNhdmVBc2ZpbGVOYW1lLCBkZXN0UGF0aCkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSB1cGxvYWRGaWxlJywgc2F2ZUFzZmlsZU5hbWUpXHJcblx0XHRcdHZhciBibG9iID0gJCQuZGF0YVVSTHRvQmxvYihkYXRhVXJsKVxyXG5cdFx0XHRpZiAoYmxvYiA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0ZpbGUgZm9ybWF0IG5vdCBzdXBwb3J0ZWQnKVxyXG5cdFx0XHR9XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2Jsb2InLCBibG9iKVxyXG5cdFx0XHR2YXIgZmQgPSBuZXcgRm9ybURhdGEoKVxyXG5cdFx0XHRmZC5hcHBlbmQoJ3BpY3R1cmUnLCBibG9iLCBzYXZlQXNmaWxlTmFtZSlcclxuXHRcdFx0ZmQuYXBwZW5kKCdkZXN0UGF0aCcsIGRlc3RQYXRoKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0Rm9ybURhdGEoJy9hcGkvZmlsZS9zYXZlJywgZmQpXHJcblx0XHR9LFxyXG5cclxuXHRcdHJlbW92ZUZpbGVzOiBmdW5jdGlvbihmaWxlTmFtZXMpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gcmVtb3ZlRmlsZXMnLCBmaWxlTmFtZXMpXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9kZWxldGUnLCBmaWxlTmFtZXMpXHJcblx0XHR9LFxyXG5cclxuXHRcdG1rZGlyOiBmdW5jdGlvbihmaWxlTmFtZSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBta2RpcicsIGZpbGVOYW1lKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvbWtkaXInLCB7ZmlsZU5hbWU6IGZpbGVOYW1lfSlcclxuXHRcdH0sXHJcblxyXG5cdFx0cm1kaXI6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIHJtZGlyJywgZmlsZU5hbWUpXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9ybWRpcicsIHtmaWxlTmFtZTogZmlsZU5hbWV9KVxyXG5cdFx0fSxcclxuXHJcblx0XHRtb3ZlRmlsZXM6IGZ1bmN0aW9uKGZpbGVOYW1lcywgZGVzdFBhdGgpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gbW92ZUZpbGVzJywgZmlsZU5hbWVzLCBkZXN0UGF0aClcclxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL21vdmUnLCB7ZmlsZU5hbWVzLCBkZXN0UGF0aH0pXHJcblx0XHR9LFxyXG5cclxuXHRcdGNvcHlGaWxlczogZnVuY3Rpb24oZmlsZU5hbWVzLCBkZXN0UGF0aCkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBjb3B5RmlsZXMnLCBmaWxlTmFtZXMsIGRlc3RQYXRoKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvY29weScsIHtmaWxlTmFtZXMsIGRlc3RQYXRofSlcclxuXHRcdH1cdFxyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnSHR0cFNlcnZpY2UnLCBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGdldCh1cmwpIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5nZXRKU09OKHVybClcclxuXHRcdFx0fSxcclxuXHJcblxyXG5cdFx0XHRwb3N0KHVybCwgZGF0YSkge1xyXG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xyXG5cdFx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXHJcblx0XHRcdFx0XHR1cmwgOiB1cmwsXHJcblx0XHRcdFx0XHRjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG5cdFx0XHRcdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0cHV0KHVybCwgZGF0YSkge1xyXG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xyXG5cdFx0XHRcdFx0bWV0aG9kOiAnUFVUJyxcclxuXHRcdFx0XHRcdHVybCA6IHVybCxcclxuXHRcdFx0XHRcdGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXHJcblx0XHRcdFx0XHRkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH0sXHRcdFx0XHJcblxyXG5cdFx0XHRkZWxldGUodXJsKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuYWpheCh7XHJcblx0XHRcdFx0XHRtZXRob2Q6ICdERUxFVEUnLFxyXG5cdFx0XHRcdFx0dXJsIDogdXJsLFxyXG5cdFx0XHRcdH0pXHRcdFx0XHRcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHBvc3RGb3JtRGF0YSh1cmwsIGZkKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuYWpheCh7XHJcblx0XHRcdFx0ICB1cmw6IHVybCxcclxuXHRcdFx0XHQgIHR5cGU6IFwiUE9TVFwiLFxyXG5cdFx0XHRcdCAgZGF0YTogZmQsXHJcblx0XHRcdFx0ICBwcm9jZXNzRGF0YTogZmFsc2UsICAvLyBpbmRpcXVlIMOgIGpRdWVyeSBkZSBuZSBwYXMgdHJhaXRlciBsZXMgZG9ubsOpZXNcclxuXHRcdFx0XHQgIGNvbnRlbnRUeXBlOiBmYWxzZSAgIC8vIGluZGlxdWUgw6AgalF1ZXJ5IGRlIG5lIHBhcyBjb25maWd1cmVyIGxlIGNvbnRlbnRUeXBlXHJcblx0XHRcdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRcclxuXHRcdH1cclxuXHR9KVxyXG5cclxuXHRcclxufSkoKTtcclxuXHJcblxyXG5cclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ0xlYWZsZXRTZXJ2aWNlJywgWydXZWJTb2NrZXRTZXJ2aWNlJ10sIGZ1bmN0aW9uKGNvbmZpZywgY2xpZW50KSB7XHJcblxyXG5cdFx0dmFyIEwgPSB3aW5kb3cuTFxyXG5cclxuXHRcdGlmICghIEwpIHtcclxuXHRcdFx0Y29uc29sZS53YXJuKGBbTGVhZmxldFNlcnZpY2VdIE1pc3NpbmcgbGlicmFyeSBkZXBlbmRhbmN5ICdsZWFmbGV0LmpzJ2ApXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ0xlYWZsZXQgdmVyc2lvbicsIEwudmVyc2lvbilcclxuXHRcdFx0Y29uc29sZS5sb2coJ0xlYWZsZXREcmF3IHZlcnNpb24nLCBMLmRyYXdWZXJzaW9uKVxyXG5cdFx0XHQvL2RlbGV0ZSB3aW5kb3cuTFxyXG5cdFx0XHQkJC5sb2FkU3R5bGUoJy9jc3MvbGVhZmxldC5jc3MnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBMXHJcblxyXG5cdH0pXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdNaWxTeW1ib2xTZXJ2aWNlJywgZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cdFx0dmFyIG1zID0gd2luZG93Lm1zXHJcblxyXG5cdFx0aWYgKCEgbXMpIHtcclxuXHRcdFx0Y29uc29sZS53YXJuKGBbTWlsU3ltYm9sU2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ21pbHN5bWJvbC5qcydgKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGRlbGV0ZSB3aW5kb3cubXNcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbXNcclxuXHJcblx0fSlcclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ09wZW5MYXllclNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0XHR2YXIgb2wgPSB3aW5kb3cub2xcclxuXHJcblx0XHRpZiAoISBvbCkge1xyXG5cdFx0XHRjb25zb2xlLndhcm4oYFtPcGVuTGF5ZXJTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAnb2wuaidgKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGRlbGV0ZSB3aW5kb3cub2xcclxuXHRcdFx0JCQubG9hZFN0eWxlKCcvY3NzL29sLmNzcycpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG9sXHJcblxyXG5cdH0pXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdUcmVlQ3RybFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblxyXG5cdFx0aWYgKCQudWkuZmFuY3l0cmVlID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRjb25zb2xlLndhcm4oYFtUcmVlQ3RybFNlcnZpY2VdIE1pc3NpbmcgbGlicmFyeSBkZXBlbmRhbmN5ICd0cmVlLmpzJ2ApXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ0ZhbmN5dHJlZSB2ZXJzaW9uOicsICQudWkuZmFuY3l0cmVlLnZlcnNpb24pXHJcblx0XHRcdCQkLmxvYWRTdHlsZSgnL2Nzcy90cmVlL3RyZWUuY3NzJylcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4ge31cclxuXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdUd2Vlbk1heFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0XHR2YXIgVHdlZW5NYXggPSB3aW5kb3cuVHdlZW5NYXhcclxuXHJcblx0XHRpZiAoISBUd2Vlbk1heCkge1xyXG5cdFx0XHRjb25zb2xlLndhcm4oYFtUd2Vlbk1heFNlcnZpY2VdIE1pc3NpbmcgbGlicmFyeSBkZXBlbmRhbmN5ICd0d2Vlbi5qcydgKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdC8vZGVsZXRlIHdpbmRvdy5Ud2Vlbk1heFxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBUd2Vlbk1heFxyXG5cclxuXHR9KVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnV2ViU29ja2V0U2VydmljZScsIGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcclxuXHRcdFx0bWFzdGVyUG9ydDogY29uZmlnLnBvcnQgfHwgODA5MCxcclxuXHRcdFx0bWFzdGVySG9zdDogY29uZmlnLmhvc3QgfHwgbG9jYXRpb24uaG9zdG5hbWVcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgaWQgPSAoY29uZmlnLmlkIHx8ICdXZWJTb2NrZXQnKSArIChEYXRlLm5vdygpICUgMTAwMDAwKVxyXG5cclxuXHRcdGNvbnN0IGNsaWVudCA9IG5ldyBXZWJTb2NrZXRDbGllbnQoaWQsIG9wdGlvbnMpXHJcblx0XHRjbGllbnQuY29ubmVjdCgpXHJcblxyXG5cdFx0cmV0dXJuIGNsaWVudDtcclxuXHR9KVxyXG5cclxuXHJcbn0pKCk7XHJcbiJdfQ==
