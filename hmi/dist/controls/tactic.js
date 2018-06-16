(function() {	

	$$.loadStyle('/controls/tactic.css')
})();

(function() {
	 
	let shapes = {}


	function isObject(o) {
		return (typeof o == 'object' && !Array.isArray(o))
	}



	function getTemplate() {
		return `
			<div class="map"></div>
		`
	}


	$$.registerControl('TacticViewControl', ['WebSocketService', 'LeafletService'], function(elt, client, L) {
		var map
		var actions = new EventEmitter2()
		var events = new EventEmitter2()
		var lastZoom
		var defaultIcon =  new L.Icon.Default;
		var pluginsInstance = {}

		var layers = {}
		var ctx = {
			elt: elt,
			actions: actions,
			events: events,
			layers: layers,
			processMenuItemConfig: processMenuItemConfig,
			addPanel: addPanel,
			disableHandlers: disableHandlers,
			enableHandlers: enableHandlers,
			getIconMarker: getIconMarker,
			updateShapeModel: updateShapeModel,
			getShapeData: getShapeData,
			reset: reset,
			updateShape: updateShape,
			removeShape: removeShape,
			dispose: dispose
		}

		elt.append(getTemplate())


		function dispose() {
			console.log('[TacticViewControl] dispose !!')
			for(var k in pluginsInstance) {
				var i = pluginsInstance[k]
				if (typeof i == 'object' && typeof i.dispose == 'function') {
					i.dispose()
				}
			}
		}


		function getIconMarker(name, data) {
			//console.log('[TacticViewControl] getIconMarker', name, data)
			if (typeof name == 'string') {
				var o = $$.getObject('map.icon', name)
				if (o && o.status === 'ok') {
					var args = [data].concat(o.deps)
					var icon = o.fn.apply(null, args)
					if (icon instanceof L.Icon) {
						return icon
					}
					else {
						console.warn(`icon of type '${name}' doee not return an Icon object`)
						return defaultIcon
					}				
				}			
			}

			return defaultIcon
		}		

		function reset() {
			console.log('[TacticViewControl] reset')

			for(var layerName in layers) {
				layers[layerName].clearLayers()
			}
		}

		function getShapeDesc(name) {
			if (shapes[name] == undefined) {
				var o = $$.getObject('map.shape', name)

				shapes[name] = (o && o.status == 'ok') ? o.fn(ctx) : null

			}
			return shapes[name]
		}		

		function addPanel(className) {
			console.log('[TacticViewControl] addPanel', className)
			var panel = $('<div>').addClass(className)
			elt.append(panel)
			map.invalidateSize() // force map width update
			return panel
		}

		function handleLayersVisibility() {
			var zoom = map.getZoom()
			for(var layerName in layers) {
				handleLayerVisibility(zoom, layers[layerName])
			}
			lastZoom = zoom
		}

		function handleLayerVisibility(zoom, layer) {
			var minZoom = layer.minZoom || 0
			var maxZoom = layer.maxZoom || 100
			//console.log('[TacticViewControl] handleLayerVisibility', layer.fullId, minZoom)
/*			if (typeof minZoom != 'number') {
				return
			}*/

			if ((zoom < minZoom || zoom > maxZoom) && map.hasLayer(layer)) {
				map.removeLayer(layer)				
			}
			else if ((zoom >= minZoom && zoom <= maxZoom) && !map.hasLayer(layer)) {
				map.addLayer(layer)				
			}
		}

		function reOrderLayers() {
			//console.log('reOrderLayers')
			for(var layerName in layers) {
				var layer = layers[layerName]
				if (map.hasLayer(layer)) {
					layer.bringToFront() // call only when layer is added to map
				}				
			}
		}

		function onZoomStart() {
			client.suspend()

		}

		function onZoomEnd() {
			client.resume()
			handleLayersVisibility()
			sessionStorage.setItem('zoom', map.getZoom())
		}

		function onOverlayAdd() {
			reOrderLayers()
		}

		function configure(config) {
			//console.log('configure', config)
			let mapConfig = config.map

			if (isObject(mapConfig)) {

				let contextmenuConfig = config.contextmenuItems

				if (Array.isArray(contextmenuConfig)) {
					mapConfig.contextmenu = true
					mapConfig.contextmenuItems = processMenuItemConfig(contextmenuConfig)
				}				

				mapConfig.closePopupOnClick = false

				console.log('[TacticViewControl] add map')
				var zoom = sessionStorage.getItem('zoom')
				if (zoom) {
					mapConfig.zoom = zoom
				}	
				var center = sessionStorage.getItem('center')	
				if (center) {
					mapConfig.center = JSON.parse(center)
				}		
				map = L.map(elt.find('.map').get(0), mapConfig)

				ctx.map = map
				lastZoom = map.getZoom()

				map.on('zoomstart', onZoomStart)
				map.on('zoomend', onZoomEnd)
				map.on('overlayadd', onOverlayAdd)
				map.on('movestart', function() {
					//console.log('movestart')
					client.resume()
				})
				map.on('moveend', function() {
					sessionStorage.setItem('center', JSON.stringify(map.getCenter()))
				})

			}

			configureTileLayer(config.tileLayer)
	
			configureControls(config.controls)

			configurePlugins(config.plugins)

		}

		function processMenuItemConfig(contextmenuConfig) {
			let config = [].concat(contextmenuConfig)
			config.forEach((item) => {
				let topic = item.topic
				if (typeof topic == 'string') {
					item.callback = (ev) => {
						//console.log('callback', topic)
						client.emit(topic, ev.relatedTarget || ev.latlng)
					}
					delete item.topic
				}

				let action = item.action
				if (typeof action == 'string') {
					item.callback = (ev) => {
						actions.emit(action, ev.relatedTarget || ev.latlng)
					}
					delete item.action
				}
			})
			return config
		}

		function configureTileLayer(tileLayerConfig) {
			if (isObject(tileLayerConfig) ) {
				let urlTemplate = tileLayerConfig.urlTemplate
				if (typeof urlTemplate != 'string') {
					console.warn('[TacticViewControl] missing urlTemplate in tileLayer config')
				}
				else {
					console.log('[TacticViewControl] add tileLayer')
					L.tileLayer(urlTemplate, tileLayerConfig).addTo(map)					
				}
			}			
		}

		function configureControls(controlsConfig) {
			if (isObject(controlsConfig) ) {
				let scaleConfig = controlsConfig.scale

				if (isObject(scaleConfig)) {
					console.log('[TacticViewControl] add scale control')
					L.control.scale(scaleConfig).addTo(map)
				}

				let coordinatesConfig = controlsConfig.coordinates
				if (isObject(coordinatesConfig)) {
					console.log('[TacticViewControl] add coordinates control')
					L.control.coordinates(coordinatesConfig).addTo(map)
				}



	            let graticuleConfig = controlsConfig.graticule
				if (isObject(graticuleConfig)) {
			        var zoomInterval = [
			            {start: 2, end: 2, interval: 40},
			            {start: 3, end: 3, interval: 20},
			            {start: 4, end: 4, interval: 10},
			            {start: 5, end: 7, interval: 5},
			            {start: 8, end: 10, interval: 1},
			            {start: 11, end: 20, interval: 0.5}
			        ]
			        var options = $.extend({zoomInterval: zoomInterval}, graticuleConfig)		
			            			
					console.log('[TacticViewControl] add graticule control')
					L.latlngGraticule(options).addTo(map)
				}	            


				configureLayers(controlsConfig.layers)
				
			}			
		}

		function configureLayers(layersConfig) {
			if (isObject(layersConfig)) {
				let conf = {}
				for(let layerName in layersConfig) {
					var layerConfig = layersConfig[layerName]
					var minZoom = layerConfig.minZoom
					var layer
					if (layerConfig.cluster === true || typeof layerConfig.cluster == 'object') {

						var options = {}
						if (typeof layerConfig.cluster == 'object') {
							options = layerConfig.cluster
						}
						layer = L.markerClusterGroup(options)
					}
					else {
						layer = new L.FeatureGroup()
					}
					layer.minZoom = layerConfig.minZoom
					layer.maxZoom = layerConfig.maxZoom
					layer.fullId = layerName
					
					layers[layerName] = layer
					console.log(`[TacticViewControl] add layer '${layerName}' with config:`, layerConfig)

					let label = layerConfig.label
					let visible = layerConfig.visible
					if (typeof layer.minZoom == 'number' || typeof layer.maxZoom == 'number') {
						handleLayerVisibility(map.getZoom(), layer)
					}
					else {
						if (visible === true) {
							map.addLayer(layer)
						}
						if (typeof label == 'string') {
							conf[label] = layer
						}						
					}
					
				}

				if (Object.keys(conf).length != 0) {
					L.control.layers({}, conf).addTo(map)
				}
				

			}			
		}

		function configurePlugins(pluginsConfig) {
			if (isObject(pluginsConfig)) {
				for(let pluginsName in pluginsConfig) {
					let o = $$.getObject('map.plugin', pluginsName)
					if (o && o.status == 'ok') {
						var options = pluginsConfig[pluginsName]
						var args = [ctx, options].concat(o.deps)
						console.log(`[TacticViewControl] init plugin '${pluginsName}'`)
						pluginsInstance[pluginsName] = o.fn.apply(null, args)
					}
					else {
						console.warn(`[TacticViewControl] plugin '${pluginsName}' is not registered`)
					}
				}

			}
		}


		function findObject(layer, id) {
			//console.log('findObject', id)
			var ret = null

			layer.eachLayer((layer) => {
				if (layer.fullId == id) {
					ret = layer
				}
			})	
			return ret
		}

		function findInfo(id) {
			var layerName = id.split('.')[0]
			var layer = layers[layerName]
			return {
				layer: layer,
				obj: findObject(layer, id),
				layerName: layerName

			}
		}

		function onObjectClicked() {
			//console.log('click', this.fullId)
			client.resume()
			events.emit('objectClicked', this)
		}

		function onObjectContextMenu() {
			//console.log('contextmenu', this.fullId)

			client.resume()
			events.emit('objectContextMenu', this)
		}

		function removeShape(id) {
			//var layer = findOwnerLayer(id)
			var {obj, layer} = findInfo(id)
/*			var obj = null
			if (layer != null) {
				obj = findObject(layer, id)
			}
*/
			if (obj != null) {
				obj.removeFrom(layer)
				console.log(`[ShapeDecoder] remove shape '${id}'`)	
			}
		}

		function updateShape(id, data) {
			var {obj, layer, layerName} = findInfo(id)

			if (obj != null && obj.userData.shape != data.shape) { // if shape change type, remove older and create new one
				obj.removeFrom(layer)
				console.log(`[ShapeDecoder] remove shape '${id}'`)
				obj = null
			}

			if (obj != null) {
				//console.log(`[ShapeDecoder] update shape '${msg.id}'`)
				$.extend(obj.userData, data)
				updateShapeView(obj)
				events.emit('objectUpdated', obj)
			}
			else {

				if (layer != undefined) {
					obj = createShape(data)
					if (obj != null) {
						obj.fullId = id
						obj.userData.id = id
						obj.addTo(layer)
						//console.log(`[ShapeDecoder] add shape '${msg.id}'`)						
					}
					else {
						console.warn(`[ShapeDecoder] shape '${data.shape} is not implemented`)
					}

				}
				else {
					console.warn(`[ShapeDecoder] layer '${layerName}' does not exist`)
				}


			}
		
			return obj
		}


		function createShape(data) {
			var ret = null
			var desc = getShapeDesc(data.shape)
			if (typeof desc == 'object' && typeof desc.create == 'function') {
				ret = desc.create(data)
				if (ret != null) {
					ret.userData = data
					ret.on('mousedown', function() {
						client.suspend()
					})
					ret.on('click', onObjectClicked)
					ret.on('contextmenu', onObjectContextMenu)
				}
			}
			return ret
		}

		function updateShapeView(layer) {
			var desc = getShapeDesc(layer.userData.shape)
			if (typeof desc == 'object' && typeof desc.update == 'function') {
				desc.update(layer, layer.userData)
			}
		}

		function updateShapeModel(layer) {
			var desc = getShapeDesc(layer.userData.shape)
			var data = {}
			if (typeof desc == 'object' && typeof desc.getData == 'function') {
				desc.getData(layer, data)
			}
			$.extend(layer.userData, data)
		}


		function getShapeData(layer, type) {

			var desc = getShapeDesc(type)
			var data = {shape: type}
			if (typeof desc == 'object' && typeof desc.getData == 'function') {
				desc.getData(layer, data)
			}
			return data
		}


		function disableHandlers() {
			map._handlers.forEach(function(handler) {
				handler.disable()
			})			
		}

		function enableHandlers() {
			map._handlers.forEach(function(handler) {
				handler.enable()
			})			
		}



		configure(elt.getOptions())



		return ctx
	})

})();


(function() {
	$$.registerObject('map.icon', 'ais', function(data) {

		var color = data.color || 'green'

		var template =  `
			<svg width="40" height="40" style="border: 1px solid back;">
				<g transform="translate(20, 20)" stroke="${color}" fill="${color}">
					<circle r="3"></circle>
					<rect x="-7" y="-7" width="15" height="15" fill=${color} fill-opacity="0.3"></rect>
					<line y2="-30"></line>
				</g>
			</svg>
		`

		return L.divIcon({
			className: 'aisMarker',
			iconSize: [40, 40],
			iconAnchor: [20, 20],
			html: template
		})		
	})

})();
(function() {

	$$.registerObject('map.icon', 'font', function(data) {

		var data = $.extend({
			className: 'fa fa-home',
			fontSize: 10,
			color: 'green'
		}, data)

		var fontSize = data.fontSize

		var template = `
			<i class="${data.className}" style="color: ${data.color}; font-size: ${fontSize}px"></i>
		`
		return L.divIcon({
			className: 'fontMarker',
			iconSize: [fontSize, fontSize],
			iconAnchor: [fontSize/2, fontSize/2],
			html: template
		})		
	})

})();

(function() {
	$$.registerObject('map.icon', 'milsymbol', ['MilSymbolService'], function(data, ms) {

		var symbol = new ms.Symbol(data.sidc, {
			size: data.size || 20,
			uniqueDesignation: data.name
		})

		var anchor = symbol.getAnchor()

		return L.icon({
			iconUrl: symbol.toDataURL(),
			iconAnchor: [anchor.x, anchor.y],
		})		
	})

})();
(function(){


	$$.registerObject('map.plugin', 'CenterMap', function(tacticView) {


		let centerVeh = null


		function onCenterMap(pos) {
			console.log('centerMap', pos)
			tacticView.map.panTo(pos)
			centerVeh = null
		}

/*		tacticView.actions.on('centerOnVehicule', (marker) => {
			console.log('centerOnVehicule', marker.fullId)
			tacticView.map.panTo(marker.getLatLng())
			centerVeh = marker.fullId
		})
		
		tacticView.events.on('objectUpdated', (obj) => {
			//console.log('aisReport', msg)

		})	*/

		tacticView.actions.on('centerMap', onCenterMap)

		return {
			dispose: function() {
				console.log('[TacticViewCenterMap] dispose')
				tacticView.events.off('objectContextMenu', onObjectContextMenu)
				tacticView.actions.off('centerMap', onCenterMap)
			}
		}
	})
	
	
})();
(function () {


	$$.registerObject('map.plugin', 'CircularMenu', function(tacticView, options) {

		var controlContainer = tacticView.elt.find('.leaflet-control-container')

		var ctrl = $$.viewController(controlContainer, {
			template: `<div class="menu" bn-control="CircularMenuControl" bn-options="config" bn-event="menuSelected: onMenuSelected"></div>`,
			data: {config: options},
			events: {
				onMenuSelected: function(item) {
					console.log('onMenuSelected', item)
					if (item && typeof item.action == 'string') {
						tacticView.actions.emit(item.action)
					}			
				}
			}
		})


	})
})();

(function () {


	$$.registerObject('map.plugin', 'ObjectCircularMenu', ['WebSocketService'], function(tacticView, options, client) {
		//console.log('CircularMenu', tacticView)

		//console.log('[TacticViewObjectCircularMenu] options:', options)

		options.hasTrigger = false

		var controlContainer = tacticView.elt.find('.leaflet-control-container')

		var ctrl = $$.viewController(controlContainer, {
			template: `<div class="menu" bn-control="CircularMenuControl" bn-options="config" 
				bn-event="menuClosed: onMenuClosed, menuSelected: onMenuSelected" bn-iface="iface"></div>`,
			data: {
				config: options
			},
			events: {
				onMenuClosed: function() {
					//console.log('onMenuClosed')
					tacticView.enableHandlers()
				},
				onMenuSelected: function(menuInfo) {
					//console.log('onMenuSelected', menuInfo, selObj.fullId, selObj.privateData)

					selObj.userData.options.color = menuInfo.color


					client.sendTo(selObj.creator, 'tacticViewShapeEdited', selObj.userData)					
				}
			}
		})


		var ctrlIf = ctrl.scope.iface
		var selObj

		function onObjectContextMenu(obj) {
			selObj = obj
			if (obj instanceof L.CircleMarker) {

				var color = selObj.options.color
				//console.log('onInit', color)
				var idx = options.menus.findIndex(function(menu) {
					return menu.color == color
				})
				//console.log('idx', idx)
				ctrlIf.select(idx)

				var pos = obj.getLatLng()
				//console.log('pos', pos)
				var pt = tacticView.map.latLngToContainerPoint(pos)
				//console.log('pt', pt)	
				ctrlIf.showMenu(pt.x, pt.y)
				tacticView.disableHandlers()				
			}


		}

		tacticView.events.on('objectContextMenu', onObjectContextMenu)

		return {
			dispose: function() {
				console.log('[TacticViewObjectCircularMenu] dispose')
				tacticView.events.off('objectContextMenu', onObjectContextMenu)
			}
		}

/*		ctrlIf.on('menuClosed', function() {
			//console.log('menuClosed')
			tacticView.enableHandlers()
		})

		ctrlIf.on('menuSelected', function(menuInfo) {
			console.log('menuSelected', menuInfo, selObj.fullId, selObj.privateData)

			selObj.userData.options.color = menuInfo.color


			client.sendTo(selObj.creator, 'tacticViewShapeEdited', selObj.userData)

			
		})*/

	})
})();

(function(){

	$$.registerObject('map.plugin', 'PanelInfo', function(tacticView, options) {


		var panelInfo = tacticView.addPanel('panelInfo')
		var map = tacticView.map

		var selMarker = null

		function getInfoTemplate(label, value, name) {
			return `<div>
						<strong>${label}</strong>
						<span bn-text="${name}">${value}</span>
					</div>`
		}

		function updateInfo(obj) {
			var pos = obj.getLatLng()
			var tooltip = obj.getTooltip()
			//console.log('tooltip', tooltip)
			panelInfo.processTemplate({
				lat: pos.lat.toFixed(5),
				lng: pos.lng.toFixed(5),
				label: obj.userData.label || obj.fullId
			})
		}

		panelInfo.append(getInfoTemplate('Zoom Level', map.getZoom(), 'zoomLevel'))
		panelInfo.append(getInfoTemplate('Label', '', 'label'))
		panelInfo.append(getInfoTemplate('Latitude', 0, 'lat'))
		panelInfo.append(getInfoTemplate('Longitude', 0, 'lng'))



		map.on('zoomend', () => {
			panelInfo.processTemplate({zoomLevel: map.getZoom()})
		})

		tacticView.events.on('objectClicked', function(obj) {
			console.log('[panelInfo] objectClicked', obj.fullId)
			if (obj instanceof L.Marker || obj instanceof L.CircleMarker) {
				updateInfo(obj)
				selMarker = obj
			}
			
		})

		tacticView.events.on('objectUpdated', function(obj) {
			//console.log('[panelInfo] objectUpdated', obj.fullId)
			if (obj == selMarker) {
				updateInfo(obj)
			}
		})


	})

})();
(function() {


	$$.registerObject('map.plugin', 'ShapeDecoder', ['WebSocketService'], function(tacticView, options, client) {


		var topics = Object.keys(tacticView.layers).map(function(layer){
			return `tacticViewAddShape.${layer}.*`
		})


		function onTacticViewAddShape(msg) {
			//console.log('onTacticViewAddShape', msg)
			if (msg.id == undefined) {
				console.warn('Missing layer or id')
				return
			}

			if (msg.data == undefined) { // no payload, means remove object
				tacticView.removeShape(msg.id)
			}
			else {
				var obj = tacticView.updateShape(msg.id, msg.data)
				obj.creator = msg.src
			}

		}

		client.register(topics, true, onTacticViewAddShape)

		return {
			dispose: function() {
				console.log('[ShapeDecoder] dispose')
				client.unregister(topics, onTacticViewAddShape)
			}
		}

	})

})();

(function() {



	$$.registerObject('map.plugin', 'ShapeEditor', ['WebSocketService'], function(tacticView, options, client) {

		let map = tacticView.map
		let featureGroupName

		if (options.edit != undefined) {
			featureGroupName = options.edit.featureGroup
			if (typeof featureGroupName == 'string') {
				let featureGroup = tacticView.layers[featureGroupName]
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



			var data = tacticView.getShapeData(layer, type)
			
			//console.log('data', data)

			client.emit('tacticViewShapeCreated.' + type, data)
			
		})	

		map.on('draw:edited', (e) => {
			//console.log('draw:edited', e)
			e.layers.eachLayer((layer) => {
				console.log(`object with id '${layer.fullId}' was edited`)
				tacticView.updateShapeModel(layer)
				client.sendTo(layer.creator, 'tacticViewShapeEdited', layer.userData)

			})
		})	


		map.on('draw:deleted', (e) => {
			//console.log('draw:edited', e)
			e.layers.eachLayer((layer) => {
				console.log(`object with id '${layer.fullId}' was deleted`)				
				client.sendTo(layer.creator, 'tacticViewShapeDeleted', layer.userData)
			})
		})	
		
	})

})();

(function() {

	$$.registerObject('map.shape', 'circle', function(tacticView) {

		return {
			create: function(data) {
				return L.circle(data.latlng, data.radius, data.options)
			},
			update: function(layer, data) {
				layer.setLatLng(data.latlng)
				layer.setRadius(data.radius)
				layer.setStyle(data.options)
			},
			getData: function(layer, data) {
				data.radius = layer.getRadius()
				data.latlng = layer.getLatLng()	
			}
		}
	})
})();

(function() {

	$$.registerObject('map.shape', 'circleMarker', function(tacticView) {

		return {
			create: function(data) {
				return L.circleMarker(data.latlng, data.options)
			},
			update: function(layer, data) {
				layer.setLatLng(data.latlng)
				layer.setStyle(data.options)
			}

		}
	})
})();

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


	$$.registerObject('map.shape', 'marker', function(tacticView) {

		return {
			create: function(data) {
				var options = data.options || {}
				if (data.icon) {
					options.icon = tacticView.getIconMarker(data.icon.type, data.icon)
				}
				if (typeof data.rotationAngle == 'number') {
					options.rotationAngle = data.rotationAngle
				}

				var marker = L.marker(data.latlng, options)							
				
				if (data.popupContent != undefined) {
					let popup = L.popup({autoClose: false, closeButton: true, className: 'toto', autoPan: false})
					popup.setContent(processContent(data))
					marker.bindPopup(popup)
				}
																	
				return marker
			},

			update: function(layer, data) {
				layer.setLatLng(data.latlng)
				if (data.icon) {
					layer.setIcon(tacticView.getIconMarker(data.icon.type, data.icon))
				}
				if (typeof data.rotationAngle == 'number') {
					layer.setRotationAngle(data.rotationAngle)
				}	

				if (data.popupContent != undefined) {
					layer.setPopupContent(processContent(data))
				}									
			},
			getData: function(layer, data) {
				data.latlng = layer.getLatLng()
			}

		} 
	})
})();

(function() {

	$$.registerObject('map.shape', 'polygon', function(tacticView) {

		return {
			create: function(data) {
				return L.polygon(data.latlngs, data.options)
			},
			update: function(layer, data) {
				layer.setLatLngs(data.latlngs)
				layer.setStyle(data.options)
			},
			getData: function(layer, data) {
				data.latlngs = layer.getLatLngs()[0]
			}

		}
	})
})();

(function() {

	$$.registerObject('map.shape', 'polyline', function(tacticView) {

		return {
			create: function(data) {
				return L.polyline(data.latlngs, data.options)
			},
			update: function(layer, data) {
				layer.setLatLngs(data.latlngs)
				layer.setStyle(data.options)
			},
			getData: function(layer, data) {
				data.latlngs = layer.getLatLngs()
			}			

		}
	})
})();

(function() {

	$$.registerObject('map.shape', 'rectangle', function(tacticView) {

		return {
			create: function(data) {
				let bounds = L.latLngBounds(data.northWest, data.southEast)
				return L.rectangle(bounds, data.options)
			},
			update: function(layer, data) {
				let bounds = L.latLngBounds(data.northWest, data.southEast)
				layer.setBounds(bounds)
				layer.setStyle(data.options)
			},			
			getData: function(layer, data) {
				let bounds = layer.getBounds()
				data.northWest =  bounds.getNorthWest()
				data.southEast =  bounds.getSouthEast()
			}
		}
	})
})();

(function() {

	$$.registerObject('map.shape', 'sector', function(tacticView) {

		return {
			create: function(data) {
				var options = $.extend({radius: data.radius}, data.options)
				var sector = L.semiCircle(data.latlng, options)
				sector.setDirection(data.direction, data.size)
				return sector
			},
			update: function(layer, data) {
				layer.setLatLng(data.latlng)
				layer.setRadius(data.radius)
				layer.setDirection(data.direction, data.size)
				layer.setStyle(data.options)
			}

		}
	})
})();
