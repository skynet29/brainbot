(function() {


	$$.registerObject('map.plugin', 'ShapeDecoder', ['WebSocketService'], function(mapView, options, client) {


		var topics = Object.keys(mapView.layers).map(function(layer){
			return `mapViewAddShape.${layer}.*`
		})


		function onAddShape(msg) {
			//console.log('onTacticViewAddShape', msg)
			if (msg.id == undefined) {
				console.warn('Missing layer or id')
				return
			}

			if (msg.data == undefined) { // no payload, means remove object
				mapView.removeShape(msg.id)
			}
			else {
				var obj = mapView.updateShape(msg.id, msg.data)
				obj.creator = msg.src
			}

		}

		client.register(topics, true, onAddShape)

		return {
			dispose: function() {
				console.log('[ShapeDecoder] dispose')
				client.unregister(topics, onAddShape)
			}
		}

	})

})();
