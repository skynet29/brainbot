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
