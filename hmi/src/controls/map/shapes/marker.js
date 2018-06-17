(function() {


	function processContent(data) {
		var content = data.popupContent
		if (!Array.isArray(content)) {
			content = [content]
		}
		var div = $('<div>')
			.css('display', 'flex')
			.css('flex-direction', 'column')

		content.forEach(function(item) {
			//console.log('item', item)
			var divItem = $('<div>')
				.css('display', 'flex')
				.css('justify-content', 'space-between')
		
			if (typeof item == 'string') {
				divItem.html(item).processTemplate(data.props)
			}

			if (typeof item == 'object' &&
				 typeof item.label == 'string' &&
				 typeof item.prop == 'string') {

				var template = `<span style="margin-right: 10px">${item.label}</span><span bn-text="${item.prop}"></span>`
				divItem.html(template).processTemplate(data.props)
			}

			div.append(divItem)
		})

		return div.get(0)
	}



	$$.registerObject('map.shape', 'marker', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$rotationAngle: 'number',
				$icon: {
					type: 'string'
				},
				$options: {
				},
				$popupContent: ['string', {label: 'string', prop: 'string'}]
			},

			updateSchema: {
				$latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$rotationAngle: 'number',
				$icon: {
					type: 'string'
				},
				$options: {
				},
				$popupContent: ['string', {label: 'string', prop: 'string'}]
			},

			create: function(data) {

				var options = data.options || {}
				if (data.icon) {
					options.icon = mapView.getIconMarker(data.icon.type, data.icon)
				}
				if (data.rotationAngle) {
					options.rotationAngle = data.rotationAngle
				}

				var marker = L.marker(data.latlng, options)							
				
				if (data.popupContent) {
					let popup = L.popup({autoClose: false, closeButton: true, className: 'toto', autoPan: false})
					popup.setContent(processContent(data))
					marker.bindPopup(popup)
				}
																	
				return marker
			},

			update: function(layer, data) {
	

				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}
				if (data.icon) {
					layer.setIcon(mapView.getIconMarker(data.icon.type, data.icon))
				}
				if (data.rotationAngle) {
					layer.setRotationAngle(data.rotationAngle)
				}	

				if (data.popupContent) {
					layer.setPopupContent(processContent(data))
				}	

			},
			getData: function(layer, data) {
				data.latlng = layer.getLatLng()
			}

		} 
	})
})();
