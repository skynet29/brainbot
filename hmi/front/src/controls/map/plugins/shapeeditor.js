(function() {



	$$.registerObject('map.plugin', 'ShapeEditor', ['WebSocketService'], function(mapView, options, client) {

		let map = mapView.map
		let featureGroupName

		if (options.edit != undefined) {
			featureGroupName = options.edit.featureGroup
			if (typeof featureGroupName == 'string') {
				let featureGroup = mapView.layers[featureGroupName]
				if (featureGroup == undefined) {
					console.warn(`layer '${featureGroupName}' is not defined`)
				}
				else {
					options.edit.featureGroup = featureGroup
				}
			}
		}

		var drawControl = new L.Control.Draw(options)
		map.addControl(drawControl)

		map.on('draw:created', (e)  => {
			var layer = e.layer
			var type = e.layerType
			console.log('draw:created', type)



			var data = mapView.getShapeData(layer, type)
			
			//console.log('data', data)

			client.emit('mapViewShapeCreated.' + type, data)
			
		})	

		map.on('draw:edited', (e) => {
			//console.log('draw:edited', e)
			e.layers.eachLayer((layer) => {
				console.log(`object with id '${layer.fullId}' was edited`)
				mapView.updateShapeModel(layer)
				client.sendTo(layer.creator, 'mapViewShapeEdited', layer.userData)

			})
		})	


		map.on('draw:deleted', (e) => {
			//console.log('draw:edited', e)
			e.layers.eachLayer((layer) => {
				console.log(`object with id '${layer.fullId}' was deleted`)				
				client.sendTo(layer.creator, 'mapViewShapeDeleted', layer.userData)
			})
		})	
		
	})

})();
