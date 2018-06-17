(function() {

	var createSchema = {
		latlngs: [{
			lat: 'number', 
			lng: 'number'
		}],
		$options: {
			$color: 'string'
		}
	}

	var updateSchema = {
		$latlngs: [{
			lat: 'number', 
			lng: 'number'
		}],
		$options: {
			$color: 'string'
		}
	}

	$$.registerObject('map.shape', 'polygon', function(mapView) {

		return {
			create: function(data) {
				if (!$$.checkType(data, createSchema)) {
					console.warn('[TacticViewControl] create polygon, missing or wrong parameters', data, 'schema: ', createSchema)
					return null
				}
				return L.polygon(data.latlngs, data.options)
			},
			update: function(layer, data) {
				if (!$$.checkType(data, createSchema)) {
					console.warn('[TacticViewControl] create polygon, missing or wrong parameters', data, 'schema: ', createSchema)
					return null
				}
				if (data.latlngs) {
					layer.setLatLngs(data.latlngs)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
				return true
			},
			getData: function(layer, data) {
				data.latlngs = layer.getLatLngs()[0]
			}

		}
	})
})();
