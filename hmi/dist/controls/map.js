(function() {	

	$$.loadStyle('/controls/map.css')
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


	$$.registerControlEx('MapViewControl', {
		deps: ['WebSocketService', 'LeafletService'],
		events: 'objectClicked,objectContextMenu,objectUpdated',
		iface: 	'updateShape(id, data);removeShape(id);on(event, callback);getShapeInfo(id)',
		
	lib: 'map',
init:  function(elt, options, client, L) {
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
				removeShape: removeShape
			}

			elt.append(getTemplate())


			this.dispose = function() {
				console.log('[MapViewControl] dispose !!')
				for(var k in pluginsInstance) {
					var i = pluginsInstance[k]
					if (typeof i == 'object' && typeof i.dispose == 'function') {
						i.dispose()
					}
				}
			}


			function getIconMarker(name, data) {
				//console.log('[MapViewControl] getIconMarker', name, data)
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
					else {
						console.warn(`icon of type '${name}' is not implemented, use defaultIcon`)
					}			
				}

				return defaultIcon
			}		

			function reset() {
				console.log('[MapViewControl] reset')

				for(var layerName in layers) {
					layers[layerName].clearLayers()
				}
			}

			function getShapeDesc(name) {
				if (shapes[name] == undefined) {
					var o = $$.getObject('map.shape', name)

					shapes[name] = null
					if (o.status == 'ok') {
						shapes[name] = o.obj = o.fn(ctx)
					}

				}
				return shapes[name]
			}		

			function addPanel(className) {
				console.log('[MapViewControl] addPanel', className)
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
				//console.log('[MapViewControl] handleLayerVisibility', layer.fullId, minZoom)
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

					console.log('[MapViewControl] add map')
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
						console.warn('[MapViewControl] missing urlTemplate in tileLayer config')
					}
					else {
						console.log('[MapViewControl] add tileLayer')
						L.tileLayer(urlTemplate, tileLayerConfig).addTo(map)					
					}
				}			
			}

			function configureControls(controlsConfig) {
				if (isObject(controlsConfig) ) {
					let scaleConfig = controlsConfig.scale

					if (isObject(scaleConfig)) {
						console.log('[MapViewControl] add scale control')
						L.control.scale(scaleConfig).addTo(map)
					}

					let coordinatesConfig = controlsConfig.coordinates
					if (isObject(coordinatesConfig)) {
						console.log('[MapViewControl] add coordinates control')
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
				            			
						console.log('[MapViewControl] add graticule control')
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
						console.log(`[MapViewControl] add layer '${layerName}' with config:`, layerConfig)

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
							console.log(`[MapViewControl] init plugin '${pluginsName}'`)
							pluginsInstance[pluginsName] = o.fn.apply(null, args)
						}
						else {
							console.warn(`[MapViewControl] plugin '${pluginsName}' is not registered`)
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
				var split = id.split('.')
				if (split.length != 2) {
					console.warn(`[MapViewControl] wrong id: '${id}'`)
					return
				}
				var layerName = split[0]
				var layer = layers[layerName]
				return {
					layer: layer,
					obj: layer && findObject(layer, id),
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
				console.log('[MapViewControl] removeShape', id)
				//var layer = findOwnerLayer(id)
				var info = findInfo(id)
				if (info == undefined) {
					return
				}

				//console.log('info', info)

				var {obj, layer, layerName} = info


				if (layer == undefined || obj == null) {
					console.warn(`[MapViewControl.removeShape] shape '${id}' does not exist`)
					return
				}

				obj.removeFrom(layer)
					//console.log(`[MapViewControl] remove shape '${id}'`)	
			}

			function getShapeInfo(id) {
				if (typeof id != 'string') {
					return
				}
				var info = findInfo(id)
				if (info == undefined) {
					return
				}
				if (typeof info.obj == 'object') {
					return info.obj.userData
				}

			}

			function updateShape(id, data) {
				if (typeof id != 'string' || typeof data !='object') {
					console.warn(`[MapViewControl] updateShape(id:string, data:object) called with wrong parameters`)
					return
				}
				var info = findInfo(id)
				if (info == undefined) {
					return
				}



				//console.log('info', info)

				var {obj, layer, layerName} = info

				if (layer == undefined) {
					console.warn(`[MapViewControl.updateShape] layer '${layerName}' does not exist`)
					return
				}				

				if (typeof data.shape == 'string') {
					if (obj != null && obj.userData.shape != data.shape) { // if shape change type, remove older and create new one
						obj.removeFrom(layer)
						obj = null
					}					
				}


				if (obj != null) {
					//console.log(`[ShapeDecoder] update shape '${msg.id}'`)
					
					updateShapeView(obj, data)
					events.emit('objectUpdated', obj)
				}
				else {

					if (typeof data.shape != 'string') {
						console.warn(`[MapViewControl.updateShape] missing or wrong parameter 'shape'`)
						return
					}

					obj = createShape(data)
					if (obj && obj != null) {
						obj.fullId = id
						obj.userData.id = id
						obj.addTo(layer)
						//console.log(`[ShapeDecoder] add shape '${msg.id}'`)						
					}

				}
			
				return obj
			}


			function createShape(data) {
				console.log('[MapViewControl] createShape', data)
				var ret = null
				var desc = getShapeDesc(data.shape)
				//console.log('desc', desc)
				if (typeof desc == 'object' && desc != null && typeof desc.create == 'function') {
					if (desc.createSchema && !$$.checkType(data, desc.createSchema)) {
						console.warn(`[MapViewControl] create ${data.shape}, missing or wrong parameters`, data, 'schema: ', desc.createSchema)
						return null
					}					
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
				else {
					console.warn(`[MapViewControl.createShape] shape '${data.shape}' is not implemented`)
					return
				}
				return ret
			}

			function updateShapeView(layer, data) {
				//console.log('[MapViewControl] updateShapeView', data)
				var shape = layer.userData.shape
				var desc = getShapeDesc(shape)
				//console.log('desc', desc)
				if (typeof desc == 'object' && typeof desc.update == 'function') {
					if (desc.updateSchema && !$$.checkType(data, desc.updateSchema)) {
						console.warn(`[MapViewControl] update ${shape}, missing or wrong parameters`, data, 'schema: ', desc.updateSchema)
						return
					}
				
					desc.update(layer, data)
					$.extend(layer.userData, data)
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

			this.updateShape = updateShape
			this.removeShape = removeShape
			this.on = events.on.bind(events)
			this.getShapeInfo = getShapeInfo


		}
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

	var dataSchema = {
		$size: 'number',
		$name: 'string',
		sidc: 'string'
	}

	$$.registerObject('map.icon', 'milsymbol', ['MilSymbolService'], function(data, ms) {

		//console.log('data', data)

		if (!$$.checkType(data, dataSchema)) {
			console.warn('[TacticViewControl] create milsymbol marker, missing or wrong parameters', data, 'schema: ', dataSchema)
			return null
		}

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


	$$.registerObject('map.plugin', 'CenterMap', function(mapView) {


		let centerVeh = null


		function onCenterMap(pos) {
			console.log('centerMap', pos)
			mapView.map.panTo(pos)
			centerVeh = null
		}

/*		mapView.actions.on('centerOnVehicule', (marker) => {
			console.log('centerOnVehicule', marker.fullId)
			mapView.map.panTo(marker.getLatLng())
			centerVeh = marker.fullId
		})
		
		mapView.events.on('objectUpdated', (obj) => {
			//console.log('aisReport', msg)

		})	*/

		mapView.actions.on('centerMap', onCenterMap)

		return {
			dispose: function() {
				console.log('[TacticViewCenterMap] dispose')
				mapView.events.off('objectContextMenu', onObjectContextMenu)
				mapView.actions.off('centerMap', onCenterMap)
			}
		}
	})
	
	
})();
(function () {


	$$.registerObject('map.plugin', 'CircularMenu', function(mapView, options) {

		var controlContainer = mapView.elt.find('.leaflet-control-container')

		var ctrl = $$.viewController(controlContainer, {
			template: `<div class="menu" bn-control="CircularMenuControl" bn-options="config" bn-event="menuSelected: onMenuSelected"></div>`,
			data: {config: options},
			events: {
				onMenuSelected: function(item) {
					console.log('onMenuSelected', item)
					if (item && typeof item.action == 'string') {
						mapView.actions.emit(item.action)
					}			
				}
			}
		})


	})
})();

(function () {


	$$.registerObject('map.plugin', 'ObjectCircularMenu', ['WebSocketService'], function(mapView, options, client) {
		//console.log('CircularMenu', mapView)

		//console.log('[TacticViewObjectCircularMenu] options:', options)

		options.hasTrigger = false

		var controlContainer = mapView.elt.find('.leaflet-control-container')

		var ctrl = $$.viewController(controlContainer, {
			template: `<div class="menu" bn-control="CircularMenuControl" bn-options="config" 
				bn-event="menuClosed: onMenuClosed, menuSelected: onMenuSelected" bn-iface="iface"></div>`,
			data: {
				config: options
			},
			events: {
				onMenuClosed: function() {
					//console.log('onMenuClosed')
					mapView.enableHandlers()
				},
				onMenuSelected: function(menuInfo) {
					//console.log('onMenuSelected', menuInfo, selObj.fullId, selObj.privateData)

					selObj.userData.options.color = menuInfo.color


					client.sendTo(selObj.creator, 'mapViewShapeEdited', selObj.userData)					
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
				var pt = mapView.map.latLngToContainerPoint(pos)
				//console.log('pt', pt)	
				ctrlIf.showMenu(pt.x, pt.y)
				mapView.disableHandlers()				
			}


		}

		mapView.events.on('objectContextMenu', onObjectContextMenu)

		return {
			dispose: function() {
				console.log('[TacticViewObjectCircularMenu] dispose')
				mapView.events.off('objectContextMenu', onObjectContextMenu)
			}
		}

/*		ctrlIf.on('menuClosed', function() {
			//console.log('menuClosed')
			mapView.enableHandlers()
		})

		ctrlIf.on('menuSelected', function(menuInfo) {
			console.log('menuSelected', menuInfo, selObj.fullId, selObj.privateData)

			selObj.userData.options.color = menuInfo.color


			client.sendTo(selObj.creator, 'mapViewShapeEdited', selObj.userData)

			
		})*/

	})
})();

(function(){

	$$.registerObject('map.plugin', 'PanelInfo', function(mapView, options) {


		var panelInfo = mapView.addPanel('panelInfo')
		var map = mapView.map

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
			panelInfo.updateTemplate(ctx, {
				lat: pos.lat.toFixed(5),
				lng: pos.lng.toFixed(5),
				label: obj.userData.label || obj.fullId
			})
		}

		panelInfo.append(getInfoTemplate('Zoom Level', map.getZoom(), 'zoomLevel'))
		panelInfo.append(getInfoTemplate('Label', '', 'label'))
		panelInfo.append(getInfoTemplate('Latitude', 0, 'lat'))
		panelInfo.append(getInfoTemplate('Longitude', 0, 'lng'))
		var ctx = panelInfo.processTemplate()


		map.on('zoomend', () => {
			panelInfo.processTemplate({zoomLevel: map.getZoom()})
		})

		mapView.events.on('objectClicked', function(obj) {
			console.log('[panelInfo] objectClicked', obj.fullId)
			if (obj instanceof L.Marker || obj instanceof L.CircleMarker) {
				updateInfo(obj)
				selMarker = obj
			}
			
		})

		mapView.events.on('objectUpdated', function(obj) {
			//console.log('[panelInfo] objectUpdated', obj.fullId)
			if (obj == selMarker) {
				updateInfo(obj)
			}
		})


	})

})();
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

(function() {


	$$.registerObject('map.shape', 'circle', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				radius: 'number',
				$options: {
					$color: 'string'
				}
			},
			updateSchema: {
				$latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$radius: 'number',
				$options: {
					$color: 'string'
				}
			},			
			create: function(data) {
				return L.circle(data.latlng, data.radius, data.options)
			},
			update: function(layer, data) {
			
				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}	
				
				if (data.radius) {
					layer.setRadius(data.radius)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
				
			},
			getData: function(layer, data) {
				data.radius = layer.getRadius()
				data.latlng = layer.getLatLng()	
			}
		}
	})
})();

(function() {



	$$.registerObject('map.shape', 'circleMarker', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$options: {
					$color: 'string'
				}
			},

			updateSchema: {
				$latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$options: {
					$color: 'string'
				}
			},			
			create: function(data) {
				
				return L.circleMarker(data.latlng, data.options)
			},
			update: function(layer, data) {
			
				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}	
				
				if (data.options) {
					layer.setStyle(data.options)
				}
				
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

(function() {



	$$.registerObject('map.shape', 'polyline', function(mapView) {

		return {
			createSchema: {
				latlngs: [{
					lat: 'number', 
					lng: 'number'
				}],
				$options: {
					$color: 'string'
				}
			},

			updateSchema: {
				$latlngs: [{
					lat: 'number', 
					lng: 'number'
				}],
				$options: {
					$color: 'string'
				}
			},

			create: function(data) {
				return L.polyline(data.latlngs, data.options)
			},
			update: function(layer, data) {

				if (data.latlngs) {
					layer.setLatLngs(data.latlngs)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
			},
			getData: function(layer, data) {
				data.latlngs = layer.getLatLngs()
			}

		}
	})
})();

(function() {



	$$.registerObject('map.shape', 'rectangle', function(mapView) {

		return {
			createSchema: {
				northWest: {
					lat: 'number', 
					lng: 'number'
				},
				southEast: {
					lat: 'number', 
					lng: 'number'
				},		radius: 'number',
				$options: {
					$color: 'string'
				}
			},

			updateSchema: {
				$northWest: {
					lat: 'number', 
					lng: 'number'
				},
				$southEast: {
					lat: 'number', 
					lng: 'number'
				},		radius: 'number',
				$options: {
					$color: 'string'
				}
			},

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

	$$.registerObject('map.shape', 'sector', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				radius: 'number',
				direction: 'number',
				size: 'number',
				$options: {
					$color: 'string'
				}
			},
			updateSchema: {
				$latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$radius: 'number',
				$direction: 'number',
				$size: 'number',
				$options: {
					$color: 'string'
				}
			},			
			create: function(data) {
				var options = $.extend({radius: data.radius}, data.options)
				var sector = L.semiCircle(data.latlng, options)
				sector.setDirection(data.direction, data.size)
				return sector
			},
			update: function(layer, data) {
				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}
				if (data.radius) {
					layer.setRadius(data.radius)
				}
				if (data.direction && data.size) {
					layer.setDirection(data.direction, data.size)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
			}

		}
	})
})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlcHMuanMiLCJtYXAuanMiLCJtYXJrZXJzL2Fpcy5qcyIsIm1hcmtlcnMvZm9udC5qcyIsIm1hcmtlcnMvbWlsc3ltYm9sLmpzIiwicGx1Z2lucy9jZW50ZXJtYXAuanMiLCJwbHVnaW5zL2NpcmN1bGFybWVudS5qcyIsInBsdWdpbnMvb2JqZWN0Y2lyY3VsYXJtZW51LmpzIiwicGx1Z2lucy9wYW5lbGluZm8uanMiLCJwbHVnaW5zL3NoYXBlZGVjb2Rlci5qcyIsInBsdWdpbnMvc2hhcGVlZGl0b3IuanMiLCJzaGFwZXMvY2lyY2xlLmpzIiwic2hhcGVzL2NpcmNsZU1hcmtlci5qcyIsInNoYXBlcy9tYXJrZXIuanMiLCJzaGFwZXMvcG9seWdvbi5qcyIsInNoYXBlcy9wb2x5bGluZS5qcyIsInNoYXBlcy9yZWN0YW5nbGUuanMiLCJzaGFwZXMvc2VjdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1x0XHJcblxyXG5cdCQkLmxvYWRTdHlsZSgnL2NvbnRyb2xzL21hcC5jc3MnKVxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblx0IFxyXG5cdGxldCBzaGFwZXMgPSB7fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gaXNPYmplY3Qobykge1xyXG5cdFx0cmV0dXJuICh0eXBlb2YgbyA9PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShvKSlcclxuXHR9XHJcblxyXG5cclxuXHJcblx0ZnVuY3Rpb24gZ2V0VGVtcGxhdGUoKSB7XHJcblx0XHRyZXR1cm4gYFxyXG5cdFx0XHQ8ZGl2IGNsYXNzPVwibWFwXCI+PC9kaXY+XHJcblx0XHRgXHJcblx0fVxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ01hcFZpZXdDb250cm9sJywge1xyXG5cdFx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJywgJ0xlYWZsZXRTZXJ2aWNlJ10sXHJcblx0XHRldmVudHM6ICdvYmplY3RDbGlja2VkLG9iamVjdENvbnRleHRNZW51LG9iamVjdFVwZGF0ZWQnLFxyXG5cdFx0aWZhY2U6IFx0J3VwZGF0ZVNoYXBlKGlkLCBkYXRhKTtyZW1vdmVTaGFwZShpZCk7b24oZXZlbnQsIGNhbGxiYWNrKTtnZXRTaGFwZUluZm8oaWQpJyxcclxuXHRcdFxuXHRsaWI6ICdtYXAnLFxuaW5pdDogIGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50LCBMKSB7XHJcblx0XHRcdHZhciBtYXBcclxuXHRcdFx0dmFyIGFjdGlvbnMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblx0XHRcdHZhciBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblx0XHRcdHZhciBsYXN0Wm9vbVxyXG5cdFx0XHR2YXIgZGVmYXVsdEljb24gPSAgbmV3IEwuSWNvbi5EZWZhdWx0O1xyXG5cdFx0XHR2YXIgcGx1Z2luc0luc3RhbmNlID0ge31cclxuXHJcblx0XHRcdHZhciBsYXllcnMgPSB7fVxyXG5cdFx0XHR2YXIgY3R4ID0ge1xyXG5cdFx0XHRcdGVsdDogZWx0LFxyXG5cdFx0XHRcdGFjdGlvbnM6IGFjdGlvbnMsXHJcblx0XHRcdFx0ZXZlbnRzOiBldmVudHMsXHJcblx0XHRcdFx0bGF5ZXJzOiBsYXllcnMsXHJcblx0XHRcdFx0cHJvY2Vzc01lbnVJdGVtQ29uZmlnOiBwcm9jZXNzTWVudUl0ZW1Db25maWcsXHJcblx0XHRcdFx0YWRkUGFuZWw6IGFkZFBhbmVsLFxyXG5cdFx0XHRcdGRpc2FibGVIYW5kbGVyczogZGlzYWJsZUhhbmRsZXJzLFxyXG5cdFx0XHRcdGVuYWJsZUhhbmRsZXJzOiBlbmFibGVIYW5kbGVycyxcclxuXHRcdFx0XHRnZXRJY29uTWFya2VyOiBnZXRJY29uTWFya2VyLFxyXG5cdFx0XHRcdHVwZGF0ZVNoYXBlTW9kZWw6IHVwZGF0ZVNoYXBlTW9kZWwsXHJcblx0XHRcdFx0Z2V0U2hhcGVEYXRhOiBnZXRTaGFwZURhdGEsXHJcblx0XHRcdFx0cmVzZXQ6IHJlc2V0LFxyXG5cdFx0XHRcdHVwZGF0ZVNoYXBlOiB1cGRhdGVTaGFwZSxcclxuXHRcdFx0XHRyZW1vdmVTaGFwZTogcmVtb3ZlU2hhcGVcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZWx0LmFwcGVuZChnZXRUZW1wbGF0ZSgpKVxyXG5cclxuXHJcblx0XHRcdHRoaXMuZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbTWFwVmlld0NvbnRyb2xdIGRpc3Bvc2UgISEnKVxyXG5cdFx0XHRcdGZvcih2YXIgayBpbiBwbHVnaW5zSW5zdGFuY2UpIHtcclxuXHRcdFx0XHRcdHZhciBpID0gcGx1Z2luc0luc3RhbmNlW2tdXHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIGkgPT0gJ29iamVjdCcgJiYgdHlwZW9mIGkuZGlzcG9zZSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdGkuZGlzcG9zZSgpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZ2V0SWNvbk1hcmtlcihuYW1lLCBkYXRhKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSBnZXRJY29uTWFya2VyJywgbmFtZSwgZGF0YSlcclxuXHRcdFx0XHRpZiAodHlwZW9mIG5hbWUgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdHZhciBvID0gJCQuZ2V0T2JqZWN0KCdtYXAuaWNvbicsIG5hbWUpXHJcblx0XHRcdFx0XHRpZiAobyAmJiBvLnN0YXR1cyA9PT0gJ29rJykge1xyXG5cdFx0XHRcdFx0XHR2YXIgYXJncyA9IFtkYXRhXS5jb25jYXQoby5kZXBzKVxyXG5cdFx0XHRcdFx0XHR2YXIgaWNvbiA9IG8uZm4uYXBwbHkobnVsbCwgYXJncylcclxuXHRcdFx0XHRcdFx0aWYgKGljb24gaW5zdGFuY2VvZiBMLkljb24pIHtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gaWNvblxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihgaWNvbiBvZiB0eXBlICcke25hbWV9JyBkb2VlIG5vdCByZXR1cm4gYW4gSWNvbiBvYmplY3RgKVxyXG5cdFx0XHRcdFx0XHRcdHJldHVybiBkZWZhdWx0SWNvblxyXG5cdFx0XHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oYGljb24gb2YgdHlwZSAnJHtuYW1lfScgaXMgbm90IGltcGxlbWVudGVkLCB1c2UgZGVmYXVsdEljb25gKVxyXG5cdFx0XHRcdFx0fVx0XHRcdFxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIGRlZmF1bHRJY29uXHJcblx0XHRcdH1cdFx0XHJcblxyXG5cdFx0XHRmdW5jdGlvbiByZXNldCgpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSByZXNldCcpXHJcblxyXG5cdFx0XHRcdGZvcih2YXIgbGF5ZXJOYW1lIGluIGxheWVycykge1xyXG5cdFx0XHRcdFx0bGF5ZXJzW2xheWVyTmFtZV0uY2xlYXJMYXllcnMoKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZ2V0U2hhcGVEZXNjKG5hbWUpIHtcclxuXHRcdFx0XHRpZiAoc2hhcGVzW25hbWVdID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0dmFyIG8gPSAkJC5nZXRPYmplY3QoJ21hcC5zaGFwZScsIG5hbWUpXHJcblxyXG5cdFx0XHRcdFx0c2hhcGVzW25hbWVdID0gbnVsbFxyXG5cdFx0XHRcdFx0aWYgKG8uc3RhdHVzID09ICdvaycpIHtcclxuXHRcdFx0XHRcdFx0c2hhcGVzW25hbWVdID0gby5vYmogPSBvLmZuKGN0eClcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBzaGFwZXNbbmFtZV1cclxuXHRcdFx0fVx0XHRcclxuXHJcblx0XHRcdGZ1bmN0aW9uIGFkZFBhbmVsKGNsYXNzTmFtZSkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbTWFwVmlld0NvbnRyb2xdIGFkZFBhbmVsJywgY2xhc3NOYW1lKVxyXG5cdFx0XHRcdHZhciBwYW5lbCA9ICQoJzxkaXY+JykuYWRkQ2xhc3MoY2xhc3NOYW1lKVxyXG5cdFx0XHRcdGVsdC5hcHBlbmQocGFuZWwpXHJcblx0XHRcdFx0bWFwLmludmFsaWRhdGVTaXplKCkgLy8gZm9yY2UgbWFwIHdpZHRoIHVwZGF0ZVxyXG5cdFx0XHRcdHJldHVybiBwYW5lbFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBoYW5kbGVMYXllcnNWaXNpYmlsaXR5KCkge1xyXG5cdFx0XHRcdHZhciB6b29tID0gbWFwLmdldFpvb20oKVxyXG5cdFx0XHRcdGZvcih2YXIgbGF5ZXJOYW1lIGluIGxheWVycykge1xyXG5cdFx0XHRcdFx0aGFuZGxlTGF5ZXJWaXNpYmlsaXR5KHpvb20sIGxheWVyc1tsYXllck5hbWVdKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRsYXN0Wm9vbSA9IHpvb21cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gaGFuZGxlTGF5ZXJWaXNpYmlsaXR5KHpvb20sIGxheWVyKSB7XHJcblx0XHRcdFx0dmFyIG1pblpvb20gPSBsYXllci5taW5ab29tIHx8IDBcclxuXHRcdFx0XHR2YXIgbWF4Wm9vbSA9IGxheWVyLm1heFpvb20gfHwgMTAwXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSBoYW5kbGVMYXllclZpc2liaWxpdHknLCBsYXllci5mdWxsSWQsIG1pblpvb20pXHJcblx0LypcdFx0XHRpZiAodHlwZW9mIG1pblpvb20gIT0gJ251bWJlcicpIHtcclxuXHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdH0qL1xyXG5cclxuXHRcdFx0XHRpZiAoKHpvb20gPCBtaW5ab29tIHx8IHpvb20gPiBtYXhab29tKSAmJiBtYXAuaGFzTGF5ZXIobGF5ZXIpKSB7XHJcblx0XHRcdFx0XHRtYXAucmVtb3ZlTGF5ZXIobGF5ZXIpXHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBpZiAoKHpvb20gPj0gbWluWm9vbSAmJiB6b29tIDw9IG1heFpvb20pICYmICFtYXAuaGFzTGF5ZXIobGF5ZXIpKSB7XHJcblx0XHRcdFx0XHRtYXAuYWRkTGF5ZXIobGF5ZXIpXHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIHJlT3JkZXJMYXllcnMoKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygncmVPcmRlckxheWVycycpXHJcblx0XHRcdFx0Zm9yKHZhciBsYXllck5hbWUgaW4gbGF5ZXJzKSB7XHJcblx0XHRcdFx0XHR2YXIgbGF5ZXIgPSBsYXllcnNbbGF5ZXJOYW1lXVxyXG5cdFx0XHRcdFx0aWYgKG1hcC5oYXNMYXllcihsYXllcikpIHtcclxuXHRcdFx0XHRcdFx0bGF5ZXIuYnJpbmdUb0Zyb250KCkgLy8gY2FsbCBvbmx5IHdoZW4gbGF5ZXIgaXMgYWRkZWQgdG8gbWFwXHJcblx0XHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIG9uWm9vbVN0YXJ0KCkge1xyXG5cdFx0XHRcdGNsaWVudC5zdXNwZW5kKClcclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIG9uWm9vbUVuZCgpIHtcclxuXHRcdFx0XHRjbGllbnQucmVzdW1lKClcclxuXHRcdFx0XHRoYW5kbGVMYXllcnNWaXNpYmlsaXR5KClcclxuXHRcdFx0XHRzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCd6b29tJywgbWFwLmdldFpvb20oKSlcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gb25PdmVybGF5QWRkKCkge1xyXG5cdFx0XHRcdHJlT3JkZXJMYXllcnMoKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBjb25maWd1cmUoY29uZmlnKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY29uZmlndXJlJywgY29uZmlnKVxyXG5cdFx0XHRcdGxldCBtYXBDb25maWcgPSBjb25maWcubWFwXHJcblxyXG5cdFx0XHRcdGlmIChpc09iamVjdChtYXBDb25maWcpKSB7XHJcblxyXG5cdFx0XHRcdFx0bGV0IGNvbnRleHRtZW51Q29uZmlnID0gY29uZmlnLmNvbnRleHRtZW51SXRlbXNcclxuXHJcblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShjb250ZXh0bWVudUNvbmZpZykpIHtcclxuXHRcdFx0XHRcdFx0bWFwQ29uZmlnLmNvbnRleHRtZW51ID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRtYXBDb25maWcuY29udGV4dG1lbnVJdGVtcyA9IHByb2Nlc3NNZW51SXRlbUNvbmZpZyhjb250ZXh0bWVudUNvbmZpZylcclxuXHRcdFx0XHRcdH1cdFx0XHRcdFxyXG5cclxuXHRcdFx0XHRcdG1hcENvbmZpZy5jbG9zZVBvcHVwT25DbGljayA9IGZhbHNlXHJcblxyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ1tNYXBWaWV3Q29udHJvbF0gYWRkIG1hcCcpXHJcblx0XHRcdFx0XHR2YXIgem9vbSA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ3pvb20nKVxyXG5cdFx0XHRcdFx0aWYgKHpvb20pIHtcclxuXHRcdFx0XHRcdFx0bWFwQ29uZmlnLnpvb20gPSB6b29tXHJcblx0XHRcdFx0XHR9XHRcclxuXHRcdFx0XHRcdHZhciBjZW50ZXIgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCdjZW50ZXInKVx0XHJcblx0XHRcdFx0XHRpZiAoY2VudGVyKSB7XHJcblx0XHRcdFx0XHRcdG1hcENvbmZpZy5jZW50ZXIgPSBKU09OLnBhcnNlKGNlbnRlcilcclxuXHRcdFx0XHRcdH1cdFx0XHJcblx0XHRcdFx0XHRtYXAgPSBMLm1hcChlbHQuZmluZCgnLm1hcCcpLmdldCgwKSwgbWFwQ29uZmlnKVxyXG5cclxuXHRcdFx0XHRcdGN0eC5tYXAgPSBtYXBcclxuXHRcdFx0XHRcdGxhc3Rab29tID0gbWFwLmdldFpvb20oKVxyXG5cclxuXHRcdFx0XHRcdG1hcC5vbignem9vbXN0YXJ0Jywgb25ab29tU3RhcnQpXHJcblx0XHRcdFx0XHRtYXAub24oJ3pvb21lbmQnLCBvblpvb21FbmQpXHJcblx0XHRcdFx0XHRtYXAub24oJ292ZXJsYXlhZGQnLCBvbk92ZXJsYXlBZGQpXHJcblx0XHRcdFx0XHRtYXAub24oJ21vdmVzdGFydCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdtb3Zlc3RhcnQnKVxyXG5cdFx0XHRcdFx0XHRjbGllbnQucmVzdW1lKClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRtYXAub24oJ21vdmVlbmQnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0c2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgnY2VudGVyJywgSlNPTi5zdHJpbmdpZnkobWFwLmdldENlbnRlcigpKSlcclxuXHRcdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y29uZmlndXJlVGlsZUxheWVyKGNvbmZpZy50aWxlTGF5ZXIpXHJcblx0XHRcclxuXHRcdFx0XHRjb25maWd1cmVDb250cm9scyhjb25maWcuY29udHJvbHMpXHJcblxyXG5cdFx0XHRcdGNvbmZpZ3VyZVBsdWdpbnMoY29uZmlnLnBsdWdpbnMpXHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBwcm9jZXNzTWVudUl0ZW1Db25maWcoY29udGV4dG1lbnVDb25maWcpIHtcclxuXHRcdFx0XHRsZXQgY29uZmlnID0gW10uY29uY2F0KGNvbnRleHRtZW51Q29uZmlnKVxyXG5cdFx0XHRcdGNvbmZpZy5mb3JFYWNoKChpdGVtKSA9PiB7XHJcblx0XHRcdFx0XHRsZXQgdG9waWMgPSBpdGVtLnRvcGljXHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIHRvcGljID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdGl0ZW0uY2FsbGJhY2sgPSAoZXYpID0+IHtcclxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdjYWxsYmFjaycsIHRvcGljKVxyXG5cdFx0XHRcdFx0XHRcdGNsaWVudC5lbWl0KHRvcGljLCBldi5yZWxhdGVkVGFyZ2V0IHx8IGV2LmxhdGxuZylcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRkZWxldGUgaXRlbS50b3BpY1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGxldCBhY3Rpb24gPSBpdGVtLmFjdGlvblxyXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBhY3Rpb24gPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0aXRlbS5jYWxsYmFjayA9IChldikgPT4ge1xyXG5cdFx0XHRcdFx0XHRcdGFjdGlvbnMuZW1pdChhY3Rpb24sIGV2LnJlbGF0ZWRUYXJnZXQgfHwgZXYubGF0bG5nKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGRlbGV0ZSBpdGVtLmFjdGlvblxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0cmV0dXJuIGNvbmZpZ1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBjb25maWd1cmVUaWxlTGF5ZXIodGlsZUxheWVyQ29uZmlnKSB7XHJcblx0XHRcdFx0aWYgKGlzT2JqZWN0KHRpbGVMYXllckNvbmZpZykgKSB7XHJcblx0XHRcdFx0XHRsZXQgdXJsVGVtcGxhdGUgPSB0aWxlTGF5ZXJDb25maWcudXJsVGVtcGxhdGVcclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgdXJsVGVtcGxhdGUgIT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbTWFwVmlld0NvbnRyb2xdIG1pc3NpbmcgdXJsVGVtcGxhdGUgaW4gdGlsZUxheWVyIGNvbmZpZycpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ1tNYXBWaWV3Q29udHJvbF0gYWRkIHRpbGVMYXllcicpXHJcblx0XHRcdFx0XHRcdEwudGlsZUxheWVyKHVybFRlbXBsYXRlLCB0aWxlTGF5ZXJDb25maWcpLmFkZFRvKG1hcClcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBjb25maWd1cmVDb250cm9scyhjb250cm9sc0NvbmZpZykge1xyXG5cdFx0XHRcdGlmIChpc09iamVjdChjb250cm9sc0NvbmZpZykgKSB7XHJcblx0XHRcdFx0XHRsZXQgc2NhbGVDb25maWcgPSBjb250cm9sc0NvbmZpZy5zY2FsZVxyXG5cclxuXHRcdFx0XHRcdGlmIChpc09iamVjdChzY2FsZUNvbmZpZykpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ1tNYXBWaWV3Q29udHJvbF0gYWRkIHNjYWxlIGNvbnRyb2wnKVxyXG5cdFx0XHRcdFx0XHRMLmNvbnRyb2wuc2NhbGUoc2NhbGVDb25maWcpLmFkZFRvKG1hcClcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRsZXQgY29vcmRpbmF0ZXNDb25maWcgPSBjb250cm9sc0NvbmZpZy5jb29yZGluYXRlc1xyXG5cdFx0XHRcdFx0aWYgKGlzT2JqZWN0KGNvb3JkaW5hdGVzQ29uZmlnKSkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSBhZGQgY29vcmRpbmF0ZXMgY29udHJvbCcpXHJcblx0XHRcdFx0XHRcdEwuY29udHJvbC5jb29yZGluYXRlcyhjb29yZGluYXRlc0NvbmZpZykuYWRkVG8obWFwKVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0ICAgICAgICAgICAgbGV0IGdyYXRpY3VsZUNvbmZpZyA9IGNvbnRyb2xzQ29uZmlnLmdyYXRpY3VsZVxyXG5cdFx0XHRcdFx0aWYgKGlzT2JqZWN0KGdyYXRpY3VsZUNvbmZpZykpIHtcclxuXHRcdFx0XHQgICAgICAgIHZhciB6b29tSW50ZXJ2YWwgPSBbXHJcblx0XHRcdFx0ICAgICAgICAgICAge3N0YXJ0OiAyLCBlbmQ6IDIsIGludGVydmFsOiA0MH0sXHJcblx0XHRcdFx0ICAgICAgICAgICAge3N0YXJ0OiAzLCBlbmQ6IDMsIGludGVydmFsOiAyMH0sXHJcblx0XHRcdFx0ICAgICAgICAgICAge3N0YXJ0OiA0LCBlbmQ6IDQsIGludGVydmFsOiAxMH0sXHJcblx0XHRcdFx0ICAgICAgICAgICAge3N0YXJ0OiA1LCBlbmQ6IDcsIGludGVydmFsOiA1fSxcclxuXHRcdFx0XHQgICAgICAgICAgICB7c3RhcnQ6IDgsIGVuZDogMTAsIGludGVydmFsOiAxfSxcclxuXHRcdFx0XHQgICAgICAgICAgICB7c3RhcnQ6IDExLCBlbmQ6IDIwLCBpbnRlcnZhbDogMC41fVxyXG5cdFx0XHRcdCAgICAgICAgXVxyXG5cdFx0XHRcdCAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7em9vbUludGVydmFsOiB6b29tSW50ZXJ2YWx9LCBncmF0aWN1bGVDb25maWcpXHRcdFxyXG5cdFx0XHRcdCAgICAgICAgICAgIFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSBhZGQgZ3JhdGljdWxlIGNvbnRyb2wnKVxyXG5cdFx0XHRcdFx0XHRMLmxhdGxuZ0dyYXRpY3VsZShvcHRpb25zKS5hZGRUbyhtYXApXHJcblx0XHRcdFx0XHR9XHQgICAgICAgICAgICBcclxuXHJcblxyXG5cdFx0XHRcdFx0Y29uZmlndXJlTGF5ZXJzKGNvbnRyb2xzQ29uZmlnLmxheWVycylcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdH1cdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gY29uZmlndXJlTGF5ZXJzKGxheWVyc0NvbmZpZykge1xyXG5cdFx0XHRcdGlmIChpc09iamVjdChsYXllcnNDb25maWcpKSB7XHJcblx0XHRcdFx0XHRsZXQgY29uZiA9IHt9XHJcblx0XHRcdFx0XHRmb3IobGV0IGxheWVyTmFtZSBpbiBsYXllcnNDb25maWcpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGxheWVyQ29uZmlnID0gbGF5ZXJzQ29uZmlnW2xheWVyTmFtZV1cclxuXHRcdFx0XHRcdFx0dmFyIG1pblpvb20gPSBsYXllckNvbmZpZy5taW5ab29tXHJcblx0XHRcdFx0XHRcdHZhciBsYXllclxyXG5cdFx0XHRcdFx0XHRpZiAobGF5ZXJDb25maWcuY2x1c3RlciA9PT0gdHJ1ZSB8fCB0eXBlb2YgbGF5ZXJDb25maWcuY2x1c3RlciA9PSAnb2JqZWN0Jykge1xyXG5cclxuXHRcdFx0XHRcdFx0XHR2YXIgb3B0aW9ucyA9IHt9XHJcblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBsYXllckNvbmZpZy5jbHVzdGVyID09ICdvYmplY3QnKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRvcHRpb25zID0gbGF5ZXJDb25maWcuY2x1c3RlclxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRsYXllciA9IEwubWFya2VyQ2x1c3Rlckdyb3VwKG9wdGlvbnMpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0bGF5ZXIgPSBuZXcgTC5GZWF0dXJlR3JvdXAoKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGxheWVyLm1pblpvb20gPSBsYXllckNvbmZpZy5taW5ab29tXHJcblx0XHRcdFx0XHRcdGxheWVyLm1heFpvb20gPSBsYXllckNvbmZpZy5tYXhab29tXHJcblx0XHRcdFx0XHRcdGxheWVyLmZ1bGxJZCA9IGxheWVyTmFtZVxyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0bGF5ZXJzW2xheWVyTmFtZV0gPSBsYXllclxyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhgW01hcFZpZXdDb250cm9sXSBhZGQgbGF5ZXIgJyR7bGF5ZXJOYW1lfScgd2l0aCBjb25maWc6YCwgbGF5ZXJDb25maWcpXHJcblxyXG5cdFx0XHRcdFx0XHRsZXQgbGFiZWwgPSBsYXllckNvbmZpZy5sYWJlbFxyXG5cdFx0XHRcdFx0XHRsZXQgdmlzaWJsZSA9IGxheWVyQ29uZmlnLnZpc2libGVcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBsYXllci5taW5ab29tID09ICdudW1iZXInIHx8IHR5cGVvZiBsYXllci5tYXhab29tID09ICdudW1iZXInKSB7XHJcblx0XHRcdFx0XHRcdFx0aGFuZGxlTGF5ZXJWaXNpYmlsaXR5KG1hcC5nZXRab29tKCksIGxheWVyKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh2aXNpYmxlID09PSB0cnVlKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRtYXAuYWRkTGF5ZXIobGF5ZXIpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgbGFiZWwgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGNvbmZbbGFiZWxdID0gbGF5ZXJcclxuXHRcdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYgKE9iamVjdC5rZXlzKGNvbmYpLmxlbmd0aCAhPSAwKSB7XHJcblx0XHRcdFx0XHRcdEwuY29udHJvbC5sYXllcnMoe30sIGNvbmYpLmFkZFRvKG1hcClcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFxyXG5cclxuXHRcdFx0XHR9XHRcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGNvbmZpZ3VyZVBsdWdpbnMocGx1Z2luc0NvbmZpZykge1xyXG5cdFx0XHRcdGlmIChpc09iamVjdChwbHVnaW5zQ29uZmlnKSkge1xyXG5cdFx0XHRcdFx0Zm9yKGxldCBwbHVnaW5zTmFtZSBpbiBwbHVnaW5zQ29uZmlnKSB7XHJcblx0XHRcdFx0XHRcdGxldCBvID0gJCQuZ2V0T2JqZWN0KCdtYXAucGx1Z2luJywgcGx1Z2luc05hbWUpXHJcblx0XHRcdFx0XHRcdGlmIChvICYmIG8uc3RhdHVzID09ICdvaycpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgb3B0aW9ucyA9IHBsdWdpbnNDb25maWdbcGx1Z2luc05hbWVdXHJcblx0XHRcdFx0XHRcdFx0dmFyIGFyZ3MgPSBbY3R4LCBvcHRpb25zXS5jb25jYXQoby5kZXBzKVxyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBbTWFwVmlld0NvbnRyb2xdIGluaXQgcGx1Z2luICcke3BsdWdpbnNOYW1lfSdgKVxyXG5cdFx0XHRcdFx0XHRcdHBsdWdpbnNJbnN0YW5jZVtwbHVnaW5zTmFtZV0gPSBvLmZuLmFwcGx5KG51bGwsIGFyZ3MpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbTWFwVmlld0NvbnRyb2xdIHBsdWdpbiAnJHtwbHVnaW5zTmFtZX0nIGlzIG5vdCByZWdpc3RlcmVkYClcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBmaW5kT2JqZWN0KGxheWVyLCBpZCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZpbmRPYmplY3QnLCBpZClcclxuXHRcdFx0XHR2YXIgcmV0ID0gbnVsbFxyXG5cclxuXHRcdFx0XHRsYXllci5lYWNoTGF5ZXIoKGxheWVyKSA9PiB7XHJcblx0XHRcdFx0XHRpZiAobGF5ZXIuZnVsbElkID09IGlkKSB7XHJcblx0XHRcdFx0XHRcdHJldCA9IGxheWVyXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSlcdFxyXG5cdFx0XHRcdHJldHVybiByZXRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZmluZEluZm8oaWQpIHtcclxuXHRcdFx0XHR2YXIgc3BsaXQgPSBpZC5zcGxpdCgnLicpXHJcblx0XHRcdFx0aWYgKHNwbGl0Lmxlbmd0aCAhPSAyKSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtNYXBWaWV3Q29udHJvbF0gd3JvbmcgaWQ6ICcke2lkfSdgKVxyXG5cdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciBsYXllck5hbWUgPSBzcGxpdFswXVxyXG5cdFx0XHRcdHZhciBsYXllciA9IGxheWVyc1tsYXllck5hbWVdXHJcblx0XHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdGxheWVyOiBsYXllcixcclxuXHRcdFx0XHRcdG9iajogbGF5ZXIgJiYgZmluZE9iamVjdChsYXllciwgaWQpLFxyXG5cdFx0XHRcdFx0bGF5ZXJOYW1lOiBsYXllck5hbWVcclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBvbk9iamVjdENsaWNrZWQoKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY2xpY2snLCB0aGlzLmZ1bGxJZClcclxuXHRcdFx0XHRjbGllbnQucmVzdW1lKClcclxuXHRcdFx0XHRldmVudHMuZW1pdCgnb2JqZWN0Q2xpY2tlZCcsIHRoaXMpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIG9uT2JqZWN0Q29udGV4dE1lbnUoKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY29udGV4dG1lbnUnLCB0aGlzLmZ1bGxJZClcclxuXHJcblx0XHRcdFx0Y2xpZW50LnJlc3VtZSgpXHJcblx0XHRcdFx0ZXZlbnRzLmVtaXQoJ29iamVjdENvbnRleHRNZW51JywgdGhpcylcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gcmVtb3ZlU2hhcGUoaWQpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSByZW1vdmVTaGFwZScsIGlkKVxyXG5cdFx0XHRcdC8vdmFyIGxheWVyID0gZmluZE93bmVyTGF5ZXIoaWQpXHJcblx0XHRcdFx0dmFyIGluZm8gPSBmaW5kSW5mbyhpZClcclxuXHRcdFx0XHRpZiAoaW5mbyA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnaW5mbycsIGluZm8pXHJcblxyXG5cdFx0XHRcdHZhciB7b2JqLCBsYXllciwgbGF5ZXJOYW1lfSA9IGluZm9cclxuXHJcblxyXG5cdFx0XHRcdGlmIChsYXllciA9PSB1bmRlZmluZWQgfHwgb2JqID09IG51bGwpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW01hcFZpZXdDb250cm9sLnJlbW92ZVNoYXBlXSBzaGFwZSAnJHtpZH0nIGRvZXMgbm90IGV4aXN0YClcclxuXHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0b2JqLnJlbW92ZUZyb20obGF5ZXIpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbTWFwVmlld0NvbnRyb2xdIHJlbW92ZSBzaGFwZSAnJHtpZH0nYClcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBnZXRTaGFwZUluZm8oaWQpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGlkICE9ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dmFyIGluZm8gPSBmaW5kSW5mbyhpZClcclxuXHRcdFx0XHRpZiAoaW5mbyA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodHlwZW9mIGluZm8ub2JqID09ICdvYmplY3QnKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gaW5mby5vYmoudXNlckRhdGFcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiB1cGRhdGVTaGFwZShpZCwgZGF0YSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgaWQgIT0gJ3N0cmluZycgfHwgdHlwZW9mIGRhdGEgIT0nb2JqZWN0Jykge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbTWFwVmlld0NvbnRyb2xdIHVwZGF0ZVNoYXBlKGlkOnN0cmluZywgZGF0YTpvYmplY3QpIGNhbGxlZCB3aXRoIHdyb25nIHBhcmFtZXRlcnNgKVxyXG5cdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciBpbmZvID0gZmluZEluZm8oaWQpXHJcblx0XHRcdFx0aWYgKGluZm8gPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0XHR9XHJcblxyXG5cclxuXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnaW5mbycsIGluZm8pXHJcblxyXG5cdFx0XHRcdHZhciB7b2JqLCBsYXllciwgbGF5ZXJOYW1lfSA9IGluZm9cclxuXHJcblx0XHRcdFx0aWYgKGxheWVyID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbTWFwVmlld0NvbnRyb2wudXBkYXRlU2hhcGVdIGxheWVyICcke2xheWVyTmFtZX0nIGRvZXMgbm90IGV4aXN0YClcclxuXHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cclxuXHRcdFx0XHRpZiAodHlwZW9mIGRhdGEuc2hhcGUgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdGlmIChvYmogIT0gbnVsbCAmJiBvYmoudXNlckRhdGEuc2hhcGUgIT0gZGF0YS5zaGFwZSkgeyAvLyBpZiBzaGFwZSBjaGFuZ2UgdHlwZSwgcmVtb3ZlIG9sZGVyIGFuZCBjcmVhdGUgbmV3IG9uZVxyXG5cdFx0XHRcdFx0XHRvYmoucmVtb3ZlRnJvbShsYXllcilcclxuXHRcdFx0XHRcdFx0b2JqID0gbnVsbFxyXG5cdFx0XHRcdFx0fVx0XHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0XHRpZiAob2JqICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coYFtTaGFwZURlY29kZXJdIHVwZGF0ZSBzaGFwZSAnJHttc2cuaWR9J2ApXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdHVwZGF0ZVNoYXBlVmlldyhvYmosIGRhdGEpXHJcblx0XHRcdFx0XHRldmVudHMuZW1pdCgnb2JqZWN0VXBkYXRlZCcsIG9iailcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblxyXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBkYXRhLnNoYXBlICE9ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihgW01hcFZpZXdDb250cm9sLnVwZGF0ZVNoYXBlXSBtaXNzaW5nIG9yIHdyb25nIHBhcmFtZXRlciAnc2hhcGUnYClcclxuXHRcdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0b2JqID0gY3JlYXRlU2hhcGUoZGF0YSlcclxuXHRcdFx0XHRcdGlmIChvYmogJiYgb2JqICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0b2JqLmZ1bGxJZCA9IGlkXHJcblx0XHRcdFx0XHRcdG9iai51c2VyRGF0YS5pZCA9IGlkXHJcblx0XHRcdFx0XHRcdG9iai5hZGRUbyhsYXllcilcclxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW1NoYXBlRGVjb2Rlcl0gYWRkIHNoYXBlICcke21zZy5pZH0nYClcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0XHRyZXR1cm4gb2JqXHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBjcmVhdGVTaGFwZShkYXRhKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1tNYXBWaWV3Q29udHJvbF0gY3JlYXRlU2hhcGUnLCBkYXRhKVxyXG5cdFx0XHRcdHZhciByZXQgPSBudWxsXHJcblx0XHRcdFx0dmFyIGRlc2MgPSBnZXRTaGFwZURlc2MoZGF0YS5zaGFwZSlcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdkZXNjJywgZGVzYylcclxuXHRcdFx0XHRpZiAodHlwZW9mIGRlc2MgPT0gJ29iamVjdCcgJiYgZGVzYyAhPSBudWxsICYmIHR5cGVvZiBkZXNjLmNyZWF0ZSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRpZiAoZGVzYy5jcmVhdGVTY2hlbWEgJiYgISQkLmNoZWNrVHlwZShkYXRhLCBkZXNjLmNyZWF0ZVNjaGVtYSkpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbTWFwVmlld0NvbnRyb2xdIGNyZWF0ZSAke2RhdGEuc2hhcGV9LCBtaXNzaW5nIG9yIHdyb25nIHBhcmFtZXRlcnNgLCBkYXRhLCAnc2NoZW1hOiAnLCBkZXNjLmNyZWF0ZVNjaGVtYSlcclxuXHRcdFx0XHRcdFx0cmV0dXJuIG51bGxcclxuXHRcdFx0XHRcdH1cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRyZXQgPSBkZXNjLmNyZWF0ZShkYXRhKVxyXG5cdFx0XHRcdFx0aWYgKHJldCAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdHJldC51c2VyRGF0YSA9IGRhdGFcclxuXHRcdFx0XHRcdFx0cmV0Lm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRjbGllbnQuc3VzcGVuZCgpXHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdHJldC5vbignY2xpY2snLCBvbk9iamVjdENsaWNrZWQpXHJcblx0XHRcdFx0XHRcdHJldC5vbignY29udGV4dG1lbnUnLCBvbk9iamVjdENvbnRleHRNZW51KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW01hcFZpZXdDb250cm9sLmNyZWF0ZVNoYXBlXSBzaGFwZSAnJHtkYXRhLnNoYXBlfScgaXMgbm90IGltcGxlbWVudGVkYClcclxuXHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcmV0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIHVwZGF0ZVNoYXBlVmlldyhsYXllciwgZGF0YSkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tNYXBWaWV3Q29udHJvbF0gdXBkYXRlU2hhcGVWaWV3JywgZGF0YSlcclxuXHRcdFx0XHR2YXIgc2hhcGUgPSBsYXllci51c2VyRGF0YS5zaGFwZVxyXG5cdFx0XHRcdHZhciBkZXNjID0gZ2V0U2hhcGVEZXNjKHNoYXBlKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2Rlc2MnLCBkZXNjKVxyXG5cdFx0XHRcdGlmICh0eXBlb2YgZGVzYyA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgZGVzYy51cGRhdGUgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0aWYgKGRlc2MudXBkYXRlU2NoZW1hICYmICEkJC5jaGVja1R5cGUoZGF0YSwgZGVzYy51cGRhdGVTY2hlbWEpKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihgW01hcFZpZXdDb250cm9sXSB1cGRhdGUgJHtzaGFwZX0sIG1pc3Npbmcgb3Igd3JvbmcgcGFyYW1ldGVyc2AsIGRhdGEsICdzY2hlbWE6ICcsIGRlc2MudXBkYXRlU2NoZW1hKVxyXG5cdFx0XHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRcdGRlc2MudXBkYXRlKGxheWVyLCBkYXRhKVxyXG5cdFx0XHRcdFx0JC5leHRlbmQobGF5ZXIudXNlckRhdGEsIGRhdGEpXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gdXBkYXRlU2hhcGVNb2RlbChsYXllcikge1xyXG5cdFx0XHRcdHZhciBkZXNjID0gZ2V0U2hhcGVEZXNjKGxheWVyLnVzZXJEYXRhLnNoYXBlKVxyXG5cdFx0XHRcdHZhciBkYXRhID0ge31cclxuXHRcdFx0XHRpZiAodHlwZW9mIGRlc2MgPT0gJ29iamVjdCcgJiYgdHlwZW9mIGRlc2MuZ2V0RGF0YSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRkZXNjLmdldERhdGEobGF5ZXIsIGRhdGEpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdCQuZXh0ZW5kKGxheWVyLnVzZXJEYXRhLCBkYXRhKVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZ2V0U2hhcGVEYXRhKGxheWVyLCB0eXBlKSB7XHJcblxyXG5cdFx0XHRcdHZhciBkZXNjID0gZ2V0U2hhcGVEZXNjKHR5cGUpXHJcblx0XHRcdFx0dmFyIGRhdGEgPSB7c2hhcGU6IHR5cGV9XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBkZXNjID09ICdvYmplY3QnICYmIHR5cGVvZiBkZXNjLmdldERhdGEgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0ZGVzYy5nZXREYXRhKGxheWVyLCBkYXRhKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZGF0YVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZGlzYWJsZUhhbmRsZXJzKCkge1xyXG5cdFx0XHRcdG1hcC5faGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbihoYW5kbGVyKSB7XHJcblx0XHRcdFx0XHRoYW5kbGVyLmRpc2FibGUoKVxyXG5cdFx0XHRcdH0pXHRcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGVuYWJsZUhhbmRsZXJzKCkge1xyXG5cdFx0XHRcdG1hcC5faGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbihoYW5kbGVyKSB7XHJcblx0XHRcdFx0XHRoYW5kbGVyLmVuYWJsZSgpXHJcblx0XHRcdFx0fSlcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGNvbmZpZ3VyZShlbHQuZ2V0T3B0aW9ucygpKVxyXG5cclxuXHRcdFx0dGhpcy51cGRhdGVTaGFwZSA9IHVwZGF0ZVNoYXBlXHJcblx0XHRcdHRoaXMucmVtb3ZlU2hhcGUgPSByZW1vdmVTaGFwZVxyXG5cdFx0XHR0aGlzLm9uID0gZXZlbnRzLm9uLmJpbmQoZXZlbnRzKVxyXG5cdFx0XHR0aGlzLmdldFNoYXBlSW5mbyA9IGdldFNoYXBlSW5mb1xyXG5cclxuXHJcblx0XHR9XHJcblx0fSlcclxuXHJcbn0pKCk7XHJcblxyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5pY29uJywgJ2FpcycsIGZ1bmN0aW9uKGRhdGEpIHtcclxuXHJcblx0XHR2YXIgY29sb3IgPSBkYXRhLmNvbG9yIHx8ICdncmVlbidcclxuXHJcblx0XHR2YXIgdGVtcGxhdGUgPSAgYFxyXG5cdFx0XHQ8c3ZnIHdpZHRoPVwiNDBcIiBoZWlnaHQ9XCI0MFwiIHN0eWxlPVwiYm9yZGVyOiAxcHggc29saWQgYmFjaztcIj5cclxuXHRcdFx0XHQ8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMjAsIDIwKVwiIHN0cm9rZT1cIiR7Y29sb3J9XCIgZmlsbD1cIiR7Y29sb3J9XCI+XHJcblx0XHRcdFx0XHQ8Y2lyY2xlIHI9XCIzXCI+PC9jaXJjbGU+XHJcblx0XHRcdFx0XHQ8cmVjdCB4PVwiLTdcIiB5PVwiLTdcIiB3aWR0aD1cIjE1XCIgaGVpZ2h0PVwiMTVcIiBmaWxsPSR7Y29sb3J9IGZpbGwtb3BhY2l0eT1cIjAuM1wiPjwvcmVjdD5cclxuXHRcdFx0XHRcdDxsaW5lIHkyPVwiLTMwXCI+PC9saW5lPlxyXG5cdFx0XHRcdDwvZz5cclxuXHRcdFx0PC9zdmc+XHJcblx0XHRgXHJcblxyXG5cdFx0cmV0dXJuIEwuZGl2SWNvbih7XHJcblx0XHRcdGNsYXNzTmFtZTogJ2Fpc01hcmtlcicsXHJcblx0XHRcdGljb25TaXplOiBbNDAsIDQwXSxcclxuXHRcdFx0aWNvbkFuY2hvcjogWzIwLCAyMF0sXHJcblx0XHRcdGh0bWw6IHRlbXBsYXRlXHJcblx0XHR9KVx0XHRcclxuXHR9KVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAuaWNvbicsICdmb250JywgZnVuY3Rpb24oZGF0YSkge1xyXG5cclxuXHRcdHZhciBkYXRhID0gJC5leHRlbmQoe1xyXG5cdFx0XHRjbGFzc05hbWU6ICdmYSBmYS1ob21lJyxcclxuXHRcdFx0Zm9udFNpemU6IDEwLFxyXG5cdFx0XHRjb2xvcjogJ2dyZWVuJ1xyXG5cdFx0fSwgZGF0YSlcclxuXHJcblx0XHR2YXIgZm9udFNpemUgPSBkYXRhLmZvbnRTaXplXHJcblxyXG5cdFx0dmFyIHRlbXBsYXRlID0gYFxyXG5cdFx0XHQ8aSBjbGFzcz1cIiR7ZGF0YS5jbGFzc05hbWV9XCIgc3R5bGU9XCJjb2xvcjogJHtkYXRhLmNvbG9yfTsgZm9udC1zaXplOiAke2ZvbnRTaXplfXB4XCI+PC9pPlxyXG5cdFx0YFxyXG5cdFx0cmV0dXJuIEwuZGl2SWNvbih7XHJcblx0XHRcdGNsYXNzTmFtZTogJ2ZvbnRNYXJrZXInLFxyXG5cdFx0XHRpY29uU2l6ZTogW2ZvbnRTaXplLCBmb250U2l6ZV0sXHJcblx0XHRcdGljb25BbmNob3I6IFtmb250U2l6ZS8yLCBmb250U2l6ZS8yXSxcclxuXHRcdFx0aHRtbDogdGVtcGxhdGVcclxuXHRcdH0pXHRcdFxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdHZhciBkYXRhU2NoZW1hID0ge1xyXG5cdFx0JHNpemU6ICdudW1iZXInLFxyXG5cdFx0JG5hbWU6ICdzdHJpbmcnLFxyXG5cdFx0c2lkYzogJ3N0cmluZydcclxuXHR9XHJcblxyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAuaWNvbicsICdtaWxzeW1ib2wnLCBbJ01pbFN5bWJvbFNlcnZpY2UnXSwgZnVuY3Rpb24oZGF0YSwgbXMpIHtcclxuXHJcblx0XHQvL2NvbnNvbGUubG9nKCdkYXRhJywgZGF0YSlcclxuXHJcblx0XHRpZiAoISQkLmNoZWNrVHlwZShkYXRhLCBkYXRhU2NoZW1hKSkge1xyXG5cdFx0XHRjb25zb2xlLndhcm4oJ1tUYWN0aWNWaWV3Q29udHJvbF0gY3JlYXRlIG1pbHN5bWJvbCBtYXJrZXIsIG1pc3Npbmcgb3Igd3JvbmcgcGFyYW1ldGVycycsIGRhdGEsICdzY2hlbWE6ICcsIGRhdGFTY2hlbWEpXHJcblx0XHRcdHJldHVybiBudWxsXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHN5bWJvbCA9IG5ldyBtcy5TeW1ib2woZGF0YS5zaWRjLCB7XHJcblx0XHRcdHNpemU6IGRhdGEuc2l6ZSB8fCAyMCxcclxuXHRcdFx0dW5pcXVlRGVzaWduYXRpb246IGRhdGEubmFtZVxyXG5cdFx0fSlcclxuXHJcblx0XHR2YXIgYW5jaG9yID0gc3ltYm9sLmdldEFuY2hvcigpXHJcblxyXG5cdFx0cmV0dXJuIEwuaWNvbih7XHJcblx0XHRcdGljb25Vcmw6IHN5bWJvbC50b0RhdGFVUkwoKSxcclxuXHRcdFx0aWNvbkFuY2hvcjogW2FuY2hvci54LCBhbmNob3IueV0sXHJcblx0XHR9KVx0XHRcclxuXHR9KVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKXtcclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAucGx1Z2luJywgJ0NlbnRlck1hcCcsIGZ1bmN0aW9uKG1hcFZpZXcpIHtcclxuXHJcblxyXG5cdFx0bGV0IGNlbnRlclZlaCA9IG51bGxcclxuXHJcblxyXG5cdFx0ZnVuY3Rpb24gb25DZW50ZXJNYXAocG9zKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdjZW50ZXJNYXAnLCBwb3MpXHJcblx0XHRcdG1hcFZpZXcubWFwLnBhblRvKHBvcylcclxuXHRcdFx0Y2VudGVyVmVoID0gbnVsbFxyXG5cdFx0fVxyXG5cclxuLypcdFx0bWFwVmlldy5hY3Rpb25zLm9uKCdjZW50ZXJPblZlaGljdWxlJywgKG1hcmtlcikgPT4ge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnY2VudGVyT25WZWhpY3VsZScsIG1hcmtlci5mdWxsSWQpXHJcblx0XHRcdG1hcFZpZXcubWFwLnBhblRvKG1hcmtlci5nZXRMYXRMbmcoKSlcclxuXHRcdFx0Y2VudGVyVmVoID0gbWFya2VyLmZ1bGxJZFxyXG5cdFx0fSlcclxuXHRcdFxyXG5cdFx0bWFwVmlldy5ldmVudHMub24oJ29iamVjdFVwZGF0ZWQnLCAob2JqKSA9PiB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2Fpc1JlcG9ydCcsIG1zZylcclxuXHJcblx0XHR9KVx0Ki9cclxuXHJcblx0XHRtYXBWaWV3LmFjdGlvbnMub24oJ2NlbnRlck1hcCcsIG9uQ2VudGVyTWFwKVxyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbVGFjdGljVmlld0NlbnRlck1hcF0gZGlzcG9zZScpXHJcblx0XHRcdFx0bWFwVmlldy5ldmVudHMub2ZmKCdvYmplY3RDb250ZXh0TWVudScsIG9uT2JqZWN0Q29udGV4dE1lbnUpXHJcblx0XHRcdFx0bWFwVmlldy5hY3Rpb25zLm9mZignY2VudGVyTWFwJywgb25DZW50ZXJNYXApXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG5cdFxyXG5cdFxyXG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG5cclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnbWFwLnBsdWdpbicsICdDaXJjdWxhck1lbnUnLCBmdW5jdGlvbihtYXBWaWV3LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0dmFyIGNvbnRyb2xDb250YWluZXIgPSBtYXBWaWV3LmVsdC5maW5kKCcubGVhZmxldC1jb250cm9sLWNvbnRhaW5lcicpXHJcblxyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihjb250cm9sQ29udGFpbmVyLCB7XHJcblx0XHRcdHRlbXBsYXRlOiBgPGRpdiBjbGFzcz1cIm1lbnVcIiBibi1jb250cm9sPVwiQ2lyY3VsYXJNZW51Q29udHJvbFwiIGJuLW9wdGlvbnM9XCJjb25maWdcIiBibi1ldmVudD1cIm1lbnVTZWxlY3RlZDogb25NZW51U2VsZWN0ZWRcIj48L2Rpdj5gLFxyXG5cdFx0XHRkYXRhOiB7Y29uZmlnOiBvcHRpb25zfSxcclxuXHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0b25NZW51U2VsZWN0ZWQ6IGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbk1lbnVTZWxlY3RlZCcsIGl0ZW0pXHJcblx0XHRcdFx0XHRpZiAoaXRlbSAmJiB0eXBlb2YgaXRlbS5hY3Rpb24gPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0bWFwVmlldy5hY3Rpb25zLmVtaXQoaXRlbS5hY3Rpb24pXHJcblx0XHRcdFx0XHR9XHRcdFx0XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cclxuXHJcblx0fSlcclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAucGx1Z2luJywgJ09iamVjdENpcmN1bGFyTWVudScsIFsnV2ViU29ja2V0U2VydmljZSddLCBmdW5jdGlvbihtYXBWaWV3LCBvcHRpb25zLCBjbGllbnQpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ0NpcmN1bGFyTWVudScsIG1hcFZpZXcpXHJcblxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW1RhY3RpY1ZpZXdPYmplY3RDaXJjdWxhck1lbnVdIG9wdGlvbnM6Jywgb3B0aW9ucylcclxuXHJcblx0XHRvcHRpb25zLmhhc1RyaWdnZXIgPSBmYWxzZVxyXG5cclxuXHRcdHZhciBjb250cm9sQ29udGFpbmVyID0gbWFwVmlldy5lbHQuZmluZCgnLmxlYWZsZXQtY29udHJvbC1jb250YWluZXInKVxyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoY29udHJvbENvbnRhaW5lciwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJtZW51XCIgYm4tY29udHJvbD1cIkNpcmN1bGFyTWVudUNvbnRyb2xcIiBibi1vcHRpb25zPVwiY29uZmlnXCIgXHJcblx0XHRcdFx0Ym4tZXZlbnQ9XCJtZW51Q2xvc2VkOiBvbk1lbnVDbG9zZWQsIG1lbnVTZWxlY3RlZDogb25NZW51U2VsZWN0ZWRcIiBibi1pZmFjZT1cImlmYWNlXCI+PC9kaXY+YCxcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdGNvbmZpZzogb3B0aW9uc1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRvbk1lbnVDbG9zZWQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25NZW51Q2xvc2VkJylcclxuXHRcdFx0XHRcdG1hcFZpZXcuZW5hYmxlSGFuZGxlcnMoKVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25NZW51U2VsZWN0ZWQ6IGZ1bmN0aW9uKG1lbnVJbmZvKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbk1lbnVTZWxlY3RlZCcsIG1lbnVJbmZvLCBzZWxPYmouZnVsbElkLCBzZWxPYmoucHJpdmF0ZURhdGEpXHJcblxyXG5cdFx0XHRcdFx0c2VsT2JqLnVzZXJEYXRhLm9wdGlvbnMuY29sb3IgPSBtZW51SW5mby5jb2xvclxyXG5cclxuXHJcblx0XHRcdFx0XHRjbGllbnQuc2VuZFRvKHNlbE9iai5jcmVhdG9yLCAnbWFwVmlld1NoYXBlRWRpdGVkJywgc2VsT2JqLnVzZXJEYXRhKVx0XHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cclxuXHRcdHZhciBjdHJsSWYgPSBjdHJsLnNjb3BlLmlmYWNlXHJcblx0XHR2YXIgc2VsT2JqXHJcblxyXG5cdFx0ZnVuY3Rpb24gb25PYmplY3RDb250ZXh0TWVudShvYmopIHtcclxuXHRcdFx0c2VsT2JqID0gb2JqXHJcblx0XHRcdGlmIChvYmogaW5zdGFuY2VvZiBMLkNpcmNsZU1hcmtlcikge1xyXG5cclxuXHRcdFx0XHR2YXIgY29sb3IgPSBzZWxPYmoub3B0aW9ucy5jb2xvclxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ29uSW5pdCcsIGNvbG9yKVxyXG5cdFx0XHRcdHZhciBpZHggPSBvcHRpb25zLm1lbnVzLmZpbmRJbmRleChmdW5jdGlvbihtZW51KSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gbWVudS5jb2xvciA9PSBjb2xvclxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnaWR4JywgaWR4KVxyXG5cdFx0XHRcdGN0cmxJZi5zZWxlY3QoaWR4KVxyXG5cclxuXHRcdFx0XHR2YXIgcG9zID0gb2JqLmdldExhdExuZygpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygncG9zJywgcG9zKVxyXG5cdFx0XHRcdHZhciBwdCA9IG1hcFZpZXcubWFwLmxhdExuZ1RvQ29udGFpbmVyUG9pbnQocG9zKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3B0JywgcHQpXHRcclxuXHRcdFx0XHRjdHJsSWYuc2hvd01lbnUocHQueCwgcHQueSlcclxuXHRcdFx0XHRtYXBWaWV3LmRpc2FibGVIYW5kbGVycygpXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0bWFwVmlldy5ldmVudHMub24oJ29iamVjdENvbnRleHRNZW51Jywgb25PYmplY3RDb250ZXh0TWVudSlcclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRkaXNwb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW1RhY3RpY1ZpZXdPYmplY3RDaXJjdWxhck1lbnVdIGRpc3Bvc2UnKVxyXG5cdFx0XHRcdG1hcFZpZXcuZXZlbnRzLm9mZignb2JqZWN0Q29udGV4dE1lbnUnLCBvbk9iamVjdENvbnRleHRNZW51KVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG4vKlx0XHRjdHJsSWYub24oJ21lbnVDbG9zZWQnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnbWVudUNsb3NlZCcpXHJcblx0XHRcdG1hcFZpZXcuZW5hYmxlSGFuZGxlcnMoKVxyXG5cdFx0fSlcclxuXHJcblx0XHRjdHJsSWYub24oJ21lbnVTZWxlY3RlZCcsIGZ1bmN0aW9uKG1lbnVJbmZvKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdtZW51U2VsZWN0ZWQnLCBtZW51SW5mbywgc2VsT2JqLmZ1bGxJZCwgc2VsT2JqLnByaXZhdGVEYXRhKVxyXG5cclxuXHRcdFx0c2VsT2JqLnVzZXJEYXRhLm9wdGlvbnMuY29sb3IgPSBtZW51SW5mby5jb2xvclxyXG5cclxuXHJcblx0XHRcdGNsaWVudC5zZW5kVG8oc2VsT2JqLmNyZWF0b3IsICdtYXBWaWV3U2hhcGVFZGl0ZWQnLCBzZWxPYmoudXNlckRhdGEpXHJcblxyXG5cdFx0XHRcclxuXHRcdH0pKi9cclxuXHJcblx0fSlcclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAucGx1Z2luJywgJ1BhbmVsSW5mbycsIGZ1bmN0aW9uKG1hcFZpZXcsIG9wdGlvbnMpIHtcclxuXHJcblxyXG5cdFx0dmFyIHBhbmVsSW5mbyA9IG1hcFZpZXcuYWRkUGFuZWwoJ3BhbmVsSW5mbycpXHJcblx0XHR2YXIgbWFwID0gbWFwVmlldy5tYXBcclxuXHJcblx0XHR2YXIgc2VsTWFya2VyID0gbnVsbFxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldEluZm9UZW1wbGF0ZShsYWJlbCwgdmFsdWUsIG5hbWUpIHtcclxuXHRcdFx0cmV0dXJuIGA8ZGl2PlxyXG5cdFx0XHRcdFx0XHQ8c3Ryb25nPiR7bGFiZWx9PC9zdHJvbmc+XHJcblx0XHRcdFx0XHRcdDxzcGFuIGJuLXRleHQ9XCIke25hbWV9XCI+JHt2YWx1ZX08L3NwYW4+XHJcblx0XHRcdFx0XHQ8L2Rpdj5gXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gdXBkYXRlSW5mbyhvYmopIHtcclxuXHRcdFx0dmFyIHBvcyA9IG9iai5nZXRMYXRMbmcoKVxyXG5cdFx0XHR2YXIgdG9vbHRpcCA9IG9iai5nZXRUb29sdGlwKClcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygndG9vbHRpcCcsIHRvb2x0aXApXHJcblx0XHRcdHBhbmVsSW5mby51cGRhdGVUZW1wbGF0ZShjdHgsIHtcclxuXHRcdFx0XHRsYXQ6IHBvcy5sYXQudG9GaXhlZCg1KSxcclxuXHRcdFx0XHRsbmc6IHBvcy5sbmcudG9GaXhlZCg1KSxcclxuXHRcdFx0XHRsYWJlbDogb2JqLnVzZXJEYXRhLmxhYmVsIHx8IG9iai5mdWxsSWRcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRwYW5lbEluZm8uYXBwZW5kKGdldEluZm9UZW1wbGF0ZSgnWm9vbSBMZXZlbCcsIG1hcC5nZXRab29tKCksICd6b29tTGV2ZWwnKSlcclxuXHRcdHBhbmVsSW5mby5hcHBlbmQoZ2V0SW5mb1RlbXBsYXRlKCdMYWJlbCcsICcnLCAnbGFiZWwnKSlcclxuXHRcdHBhbmVsSW5mby5hcHBlbmQoZ2V0SW5mb1RlbXBsYXRlKCdMYXRpdHVkZScsIDAsICdsYXQnKSlcclxuXHRcdHBhbmVsSW5mby5hcHBlbmQoZ2V0SW5mb1RlbXBsYXRlKCdMb25naXR1ZGUnLCAwLCAnbG5nJykpXHJcblx0XHR2YXIgY3R4ID0gcGFuZWxJbmZvLnByb2Nlc3NUZW1wbGF0ZSgpXHJcblxyXG5cclxuXHRcdG1hcC5vbignem9vbWVuZCcsICgpID0+IHtcclxuXHRcdFx0cGFuZWxJbmZvLnByb2Nlc3NUZW1wbGF0ZSh7em9vbUxldmVsOiBtYXAuZ2V0Wm9vbSgpfSlcclxuXHRcdH0pXHJcblxyXG5cdFx0bWFwVmlldy5ldmVudHMub24oJ29iamVjdENsaWNrZWQnLCBmdW5jdGlvbihvYmopIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1twYW5lbEluZm9dIG9iamVjdENsaWNrZWQnLCBvYmouZnVsbElkKVxyXG5cdFx0XHRpZiAob2JqIGluc3RhbmNlb2YgTC5NYXJrZXIgfHwgb2JqIGluc3RhbmNlb2YgTC5DaXJjbGVNYXJrZXIpIHtcclxuXHRcdFx0XHR1cGRhdGVJbmZvKG9iailcclxuXHRcdFx0XHRzZWxNYXJrZXIgPSBvYmpcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH0pXHJcblxyXG5cdFx0bWFwVmlldy5ldmVudHMub24oJ29iamVjdFVwZGF0ZWQnLCBmdW5jdGlvbihvYmopIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW3BhbmVsSW5mb10gb2JqZWN0VXBkYXRlZCcsIG9iai5mdWxsSWQpXHJcblx0XHRcdGlmIChvYmogPT0gc2VsTWFya2VyKSB7XHJcblx0XHRcdFx0dXBkYXRlSW5mbyhvYmopXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cclxuXHR9KVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnbWFwLnBsdWdpbicsICdTaGFwZURlY29kZXInLCBbJ1dlYlNvY2tldFNlcnZpY2UnXSwgZnVuY3Rpb24obWFwVmlldywgb3B0aW9ucywgY2xpZW50KSB7XHJcblxyXG5cclxuXHRcdHZhciB0b3BpY3MgPSBPYmplY3Qua2V5cyhtYXBWaWV3LmxheWVycykubWFwKGZ1bmN0aW9uKGxheWVyKXtcclxuXHRcdFx0cmV0dXJuIGBtYXBWaWV3QWRkU2hhcGUuJHtsYXllcn0uKmBcclxuXHRcdH0pXHJcblxyXG5cclxuXHRcdGZ1bmN0aW9uIG9uQWRkU2hhcGUobXNnKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ29uVGFjdGljVmlld0FkZFNoYXBlJywgbXNnKVxyXG5cdFx0XHRpZiAobXNnLmlkID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybignTWlzc2luZyBsYXllciBvciBpZCcpXHJcblx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChtc2cuZGF0YSA9PSB1bmRlZmluZWQpIHsgLy8gbm8gcGF5bG9hZCwgbWVhbnMgcmVtb3ZlIG9iamVjdFxyXG5cdFx0XHRcdG1hcFZpZXcucmVtb3ZlU2hhcGUobXNnLmlkKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdHZhciBvYmogPSBtYXBWaWV3LnVwZGF0ZVNoYXBlKG1zZy5pZCwgbXNnLmRhdGEpXHJcblx0XHRcdFx0b2JqLmNyZWF0b3IgPSBtc2cuc3JjXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0Y2xpZW50LnJlZ2lzdGVyKHRvcGljcywgdHJ1ZSwgb25BZGRTaGFwZSlcclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRkaXNwb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW1NoYXBlRGVjb2Rlcl0gZGlzcG9zZScpXHJcblx0XHRcdFx0Y2xpZW50LnVucmVnaXN0ZXIodG9waWNzLCBvbkFkZFNoYXBlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5wbHVnaW4nLCAnU2hhcGVFZGl0b3InLCBbJ1dlYlNvY2tldFNlcnZpY2UnXSwgZnVuY3Rpb24obWFwVmlldywgb3B0aW9ucywgY2xpZW50KSB7XHJcblxyXG5cdFx0bGV0IG1hcCA9IG1hcFZpZXcubWFwXHJcblx0XHRsZXQgZmVhdHVyZUdyb3VwTmFtZVxyXG5cclxuXHRcdGlmIChvcHRpb25zLmVkaXQgIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdGZlYXR1cmVHcm91cE5hbWUgPSBvcHRpb25zLmVkaXQuZmVhdHVyZUdyb3VwXHJcblx0XHRcdGlmICh0eXBlb2YgZmVhdHVyZUdyb3VwTmFtZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdGxldCBmZWF0dXJlR3JvdXAgPSBtYXBWaWV3LmxheWVyc1tmZWF0dXJlR3JvdXBOYW1lXVxyXG5cdFx0XHRcdGlmIChmZWF0dXJlR3JvdXAgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYGxheWVyICcke2ZlYXR1cmVHcm91cE5hbWV9JyBpcyBub3QgZGVmaW5lZGApXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0b3B0aW9ucy5lZGl0LmZlYXR1cmVHcm91cCA9IGZlYXR1cmVHcm91cFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBkcmF3Q29udHJvbCA9IG5ldyBMLkNvbnRyb2wuRHJhdyhvcHRpb25zKVxyXG5cdFx0bWFwLmFkZENvbnRyb2woZHJhd0NvbnRyb2wpXHJcblxyXG5cdFx0bWFwLm9uKCdkcmF3OmNyZWF0ZWQnLCAoZSkgID0+IHtcclxuXHRcdFx0dmFyIGxheWVyID0gZS5sYXllclxyXG5cdFx0XHR2YXIgdHlwZSA9IGUubGF5ZXJUeXBlXHJcblx0XHRcdGNvbnNvbGUubG9nKCdkcmF3OmNyZWF0ZWQnLCB0eXBlKVxyXG5cclxuXHJcblxyXG5cdFx0XHR2YXIgZGF0YSA9IG1hcFZpZXcuZ2V0U2hhcGVEYXRhKGxheWVyLCB0eXBlKVxyXG5cdFx0XHRcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXHJcblxyXG5cdFx0XHRjbGllbnQuZW1pdCgnbWFwVmlld1NoYXBlQ3JlYXRlZC4nICsgdHlwZSwgZGF0YSlcclxuXHRcdFx0XHJcblx0XHR9KVx0XHJcblxyXG5cdFx0bWFwLm9uKCdkcmF3OmVkaXRlZCcsIChlKSA9PiB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2RyYXc6ZWRpdGVkJywgZSlcclxuXHRcdFx0ZS5sYXllcnMuZWFjaExheWVyKChsYXllcikgPT4ge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBvYmplY3Qgd2l0aCBpZCAnJHtsYXllci5mdWxsSWR9JyB3YXMgZWRpdGVkYClcclxuXHRcdFx0XHRtYXBWaWV3LnVwZGF0ZVNoYXBlTW9kZWwobGF5ZXIpXHJcblx0XHRcdFx0Y2xpZW50LnNlbmRUbyhsYXllci5jcmVhdG9yLCAnbWFwVmlld1NoYXBlRWRpdGVkJywgbGF5ZXIudXNlckRhdGEpXHJcblxyXG5cdFx0XHR9KVxyXG5cdFx0fSlcdFxyXG5cclxuXHJcblx0XHRtYXAub24oJ2RyYXc6ZGVsZXRlZCcsIChlKSA9PiB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2RyYXc6ZWRpdGVkJywgZSlcclxuXHRcdFx0ZS5sYXllcnMuZWFjaExheWVyKChsYXllcikgPT4ge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBvYmplY3Qgd2l0aCBpZCAnJHtsYXllci5mdWxsSWR9JyB3YXMgZGVsZXRlZGApXHRcdFx0XHRcclxuXHRcdFx0XHRjbGllbnQuc2VuZFRvKGxheWVyLmNyZWF0b3IsICdtYXBWaWV3U2hhcGVEZWxldGVkJywgbGF5ZXIudXNlckRhdGEpXHJcblx0XHRcdH0pXHJcblx0XHR9KVx0XHJcblx0XHRcclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5zaGFwZScsICdjaXJjbGUnLCBmdW5jdGlvbihtYXBWaWV3KSB7XHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0Y3JlYXRlU2NoZW1hOiB7XHJcblx0XHRcdFx0bGF0bG5nOiB7XHJcblx0XHRcdFx0XHRsYXQ6ICdudW1iZXInLCBcclxuXHRcdFx0XHRcdGxuZzogJ251bWJlcidcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHJhZGl1czogJ251bWJlcicsXHJcblx0XHRcdFx0JG9wdGlvbnM6IHtcclxuXHRcdFx0XHRcdCRjb2xvcjogJ3N0cmluZydcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdHVwZGF0ZVNjaGVtYToge1xyXG5cdFx0XHRcdCRsYXRsbmc6IHtcclxuXHRcdFx0XHRcdGxhdDogJ251bWJlcicsIFxyXG5cdFx0XHRcdFx0bG5nOiAnbnVtYmVyJ1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0JHJhZGl1czogJ251bWJlcicsXHJcblx0XHRcdFx0JG9wdGlvbnM6IHtcclxuXHRcdFx0XHRcdCRjb2xvcjogJ3N0cmluZydcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHRcdFx0XHJcblx0XHRcdGNyZWF0ZTogZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHRcdHJldHVybiBMLmNpcmNsZShkYXRhLmxhdGxuZywgZGF0YS5yYWRpdXMsIGRhdGEub3B0aW9ucylcclxuXHRcdFx0fSxcclxuXHRcdFx0dXBkYXRlOiBmdW5jdGlvbihsYXllciwgZGF0YSkge1xyXG5cdFx0XHRcclxuXHRcdFx0XHRpZiAoZGF0YS5sYXRsbmcpIHtcclxuXHRcdFx0XHRcdGxheWVyLnNldExhdExuZyhkYXRhLmxhdGxuZylcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoZGF0YS5yYWRpdXMpIHtcclxuXHRcdFx0XHRcdGxheWVyLnNldFJhZGl1cyhkYXRhLnJhZGl1cylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRhdGEub3B0aW9ucykge1xyXG5cdFx0XHRcdFx0bGF5ZXIuc2V0U3R5bGUoZGF0YS5vcHRpb25zKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0fSxcclxuXHRcdFx0Z2V0RGF0YTogZnVuY3Rpb24obGF5ZXIsIGRhdGEpIHtcclxuXHRcdFx0XHRkYXRhLnJhZGl1cyA9IGxheWVyLmdldFJhZGl1cygpXHJcblx0XHRcdFx0ZGF0YS5sYXRsbmcgPSBsYXllci5nZXRMYXRMbmcoKVx0XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5zaGFwZScsICdjaXJjbGVNYXJrZXInLCBmdW5jdGlvbihtYXBWaWV3KSB7XHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0Y3JlYXRlU2NoZW1hOiB7XHJcblx0XHRcdFx0bGF0bG5nOiB7XHJcblx0XHRcdFx0XHRsYXQ6ICdudW1iZXInLCBcclxuXHRcdFx0XHRcdGxuZzogJ251bWJlcidcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdCRvcHRpb25zOiB7XHJcblx0XHRcdFx0XHQkY29sb3I6ICdzdHJpbmcnXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0dXBkYXRlU2NoZW1hOiB7XHJcblx0XHRcdFx0JGxhdGxuZzoge1xyXG5cdFx0XHRcdFx0bGF0OiAnbnVtYmVyJywgXHJcblx0XHRcdFx0XHRsbmc6ICdudW1iZXInXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHQkb3B0aW9uczoge1xyXG5cdFx0XHRcdFx0JGNvbG9yOiAnc3RyaW5nJ1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcdFx0XHRcclxuXHRcdFx0Y3JlYXRlOiBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0cmV0dXJuIEwuY2lyY2xlTWFya2VyKGRhdGEubGF0bG5nLCBkYXRhLm9wdGlvbnMpXHJcblx0XHRcdH0sXHJcblx0XHRcdHVwZGF0ZTogZnVuY3Rpb24obGF5ZXIsIGRhdGEpIHtcclxuXHRcdFx0XHJcblx0XHRcdFx0aWYgKGRhdGEubGF0bG5nKSB7XHJcblx0XHRcdFx0XHRsYXllci5zZXRMYXRMbmcoZGF0YS5sYXRsbmcpXHJcblx0XHRcdFx0fVx0XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGRhdGEub3B0aW9ucykge1xyXG5cdFx0XHRcdFx0bGF5ZXIuc2V0U3R5bGUoZGF0YS5vcHRpb25zKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHR9KVxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHRmdW5jdGlvbiBwcm9jZXNzQ29udGVudChkYXRhKSB7XHJcblx0XHR2YXIgY29udGVudCA9IGRhdGEucG9wdXBDb250ZW50XHJcblx0XHRpZiAoIUFycmF5LmlzQXJyYXkoY29udGVudCkpIHtcclxuXHRcdFx0Y29udGVudCA9IFtjb250ZW50XVxyXG5cdFx0fVxyXG5cdFx0dmFyIGRpdiA9ICQoJzxkaXY+JylcclxuXHRcdFx0LmNzcygnZGlzcGxheScsICdmbGV4JylcclxuXHRcdFx0LmNzcygnZmxleC1kaXJlY3Rpb24nLCAnY29sdW1uJylcclxuXHJcblx0XHRjb250ZW50LmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdpdGVtJywgaXRlbSlcclxuXHRcdFx0dmFyIGRpdkl0ZW0gPSAkKCc8ZGl2PicpXHJcblx0XHRcdFx0LmNzcygnZGlzcGxheScsICdmbGV4JylcclxuXHRcdFx0XHQuY3NzKCdqdXN0aWZ5LWNvbnRlbnQnLCAnc3BhY2UtYmV0d2VlbicpXHJcblx0XHRcclxuXHRcdFx0aWYgKHR5cGVvZiBpdGVtID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0ZGl2SXRlbS5odG1sKGl0ZW0pLnByb2Nlc3NUZW1wbGF0ZShkYXRhLnByb3BzKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAodHlwZW9mIGl0ZW0gPT0gJ29iamVjdCcgJiZcclxuXHRcdFx0XHQgdHlwZW9mIGl0ZW0ubGFiZWwgPT0gJ3N0cmluZycgJiZcclxuXHRcdFx0XHQgdHlwZW9mIGl0ZW0ucHJvcCA9PSAnc3RyaW5nJykge1xyXG5cclxuXHRcdFx0XHR2YXIgdGVtcGxhdGUgPSBgPHNwYW4gc3R5bGU9XCJtYXJnaW4tcmlnaHQ6IDEwcHhcIj4ke2l0ZW0ubGFiZWx9PC9zcGFuPjxzcGFuIGJuLXRleHQ9XCIke2l0ZW0ucHJvcH1cIj48L3NwYW4+YFxyXG5cdFx0XHRcdGRpdkl0ZW0uaHRtbCh0ZW1wbGF0ZSkucHJvY2Vzc1RlbXBsYXRlKGRhdGEucHJvcHMpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGRpdi5hcHBlbmQoZGl2SXRlbSlcclxuXHRcdH0pXHJcblxyXG5cdFx0cmV0dXJuIGRpdi5nZXQoMClcclxuXHR9XHJcblxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5zaGFwZScsICdtYXJrZXInLCBmdW5jdGlvbihtYXBWaWV3KSB7XHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0Y3JlYXRlU2NoZW1hOiB7XHJcblx0XHRcdFx0bGF0bG5nOiB7XHJcblx0XHRcdFx0XHRsYXQ6ICdudW1iZXInLCBcclxuXHRcdFx0XHRcdGxuZzogJ251bWJlcidcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdCRyb3RhdGlvbkFuZ2xlOiAnbnVtYmVyJyxcclxuXHRcdFx0XHQkaWNvbjoge1xyXG5cdFx0XHRcdFx0dHlwZTogJ3N0cmluZydcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdCRvcHRpb25zOiB7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHQkcG9wdXBDb250ZW50OiBbJ3N0cmluZycsIHtsYWJlbDogJ3N0cmluZycsIHByb3A6ICdzdHJpbmcnfV1cclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHVwZGF0ZVNjaGVtYToge1xyXG5cdFx0XHRcdCRsYXRsbmc6IHtcclxuXHRcdFx0XHRcdGxhdDogJ251bWJlcicsIFxyXG5cdFx0XHRcdFx0bG5nOiAnbnVtYmVyJ1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0JHJvdGF0aW9uQW5nbGU6ICdudW1iZXInLFxyXG5cdFx0XHRcdCRpY29uOiB7XHJcblx0XHRcdFx0XHR0eXBlOiAnc3RyaW5nJ1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0JG9wdGlvbnM6IHtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdCRwb3B1cENvbnRlbnQ6IFsnc3RyaW5nJywge2xhYmVsOiAnc3RyaW5nJywgcHJvcDogJ3N0cmluZyd9XVxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0Y3JlYXRlOiBmdW5jdGlvbihkYXRhKSB7XHJcblxyXG5cdFx0XHRcdHZhciBvcHRpb25zID0gZGF0YS5vcHRpb25zIHx8IHt9XHJcblx0XHRcdFx0aWYgKGRhdGEuaWNvbikge1xyXG5cdFx0XHRcdFx0b3B0aW9ucy5pY29uID0gbWFwVmlldy5nZXRJY29uTWFya2VyKGRhdGEuaWNvbi50eXBlLCBkYXRhLmljb24pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChkYXRhLnJvdGF0aW9uQW5nbGUpIHtcclxuXHRcdFx0XHRcdG9wdGlvbnMucm90YXRpb25BbmdsZSA9IGRhdGEucm90YXRpb25BbmdsZVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0dmFyIG1hcmtlciA9IEwubWFya2VyKGRhdGEubGF0bG5nLCBvcHRpb25zKVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGRhdGEucG9wdXBDb250ZW50KSB7XHJcblx0XHRcdFx0XHRsZXQgcG9wdXAgPSBMLnBvcHVwKHthdXRvQ2xvc2U6IGZhbHNlLCBjbG9zZUJ1dHRvbjogdHJ1ZSwgY2xhc3NOYW1lOiAndG90bycsIGF1dG9QYW46IGZhbHNlfSlcclxuXHRcdFx0XHRcdHBvcHVwLnNldENvbnRlbnQocHJvY2Vzc0NvbnRlbnQoZGF0YSkpXHJcblx0XHRcdFx0XHRtYXJrZXIuYmluZFBvcHVwKHBvcHVwKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdHJldHVybiBtYXJrZXJcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHVwZGF0ZTogZnVuY3Rpb24obGF5ZXIsIGRhdGEpIHtcclxuXHRcclxuXHJcblx0XHRcdFx0aWYgKGRhdGEubGF0bG5nKSB7XHJcblx0XHRcdFx0XHRsYXllci5zZXRMYXRMbmcoZGF0YS5sYXRsbmcpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChkYXRhLmljb24pIHtcclxuXHRcdFx0XHRcdGxheWVyLnNldEljb24obWFwVmlldy5nZXRJY29uTWFya2VyKGRhdGEuaWNvbi50eXBlLCBkYXRhLmljb24pKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5yb3RhdGlvbkFuZ2xlKSB7XHJcblx0XHRcdFx0XHRsYXllci5zZXRSb3RhdGlvbkFuZ2xlKGRhdGEucm90YXRpb25BbmdsZSlcclxuXHRcdFx0XHR9XHRcclxuXHJcblx0XHRcdFx0aWYgKGRhdGEucG9wdXBDb250ZW50KSB7XHJcblx0XHRcdFx0XHRsYXllci5zZXRQb3B1cENvbnRlbnQocHJvY2Vzc0NvbnRlbnQoZGF0YSkpXHJcblx0XHRcdFx0fVx0XHJcblxyXG5cdFx0XHR9LFxyXG5cdFx0XHRnZXREYXRhOiBmdW5jdGlvbihsYXllciwgZGF0YSkge1xyXG5cdFx0XHRcdGRhdGEubGF0bG5nID0gbGF5ZXIuZ2V0TGF0TG5nKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdH0gXHJcblx0fSlcclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHR2YXIgY3JlYXRlU2NoZW1hID0ge1xyXG5cdFx0bGF0bG5nczogW3tcclxuXHRcdFx0bGF0OiAnbnVtYmVyJywgXHJcblx0XHRcdGxuZzogJ251bWJlcidcclxuXHRcdH1dLFxyXG5cdFx0JG9wdGlvbnM6IHtcclxuXHRcdFx0JGNvbG9yOiAnc3RyaW5nJ1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIHVwZGF0ZVNjaGVtYSA9IHtcclxuXHRcdCRsYXRsbmdzOiBbe1xyXG5cdFx0XHRsYXQ6ICdudW1iZXInLCBcclxuXHRcdFx0bG5nOiAnbnVtYmVyJ1xyXG5cdFx0fV0sXHJcblx0XHQkb3B0aW9uczoge1xyXG5cdFx0XHQkY29sb3I6ICdzdHJpbmcnXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnbWFwLnNoYXBlJywgJ3BvbHlnb24nLCBmdW5jdGlvbihtYXBWaWV3KSB7XHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0Y3JlYXRlOiBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdFx0aWYgKCEkJC5jaGVja1R5cGUoZGF0YSwgY3JlYXRlU2NoZW1hKSkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbVGFjdGljVmlld0NvbnRyb2xdIGNyZWF0ZSBwb2x5Z29uLCBtaXNzaW5nIG9yIHdyb25nIHBhcmFtZXRlcnMnLCBkYXRhLCAnc2NoZW1hOiAnLCBjcmVhdGVTY2hlbWEpXHJcblx0XHRcdFx0XHRyZXR1cm4gbnVsbFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gTC5wb2x5Z29uKGRhdGEubGF0bG5ncywgZGF0YS5vcHRpb25zKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHR1cGRhdGU6IGZ1bmN0aW9uKGxheWVyLCBkYXRhKSB7XHJcblx0XHRcdFx0aWYgKCEkJC5jaGVja1R5cGUoZGF0YSwgY3JlYXRlU2NoZW1hKSkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbVGFjdGljVmlld0NvbnRyb2xdIGNyZWF0ZSBwb2x5Z29uLCBtaXNzaW5nIG9yIHdyb25nIHBhcmFtZXRlcnMnLCBkYXRhLCAnc2NoZW1hOiAnLCBjcmVhdGVTY2hlbWEpXHJcblx0XHRcdFx0XHRyZXR1cm4gbnVsbFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5sYXRsbmdzKSB7XHJcblx0XHRcdFx0XHRsYXllci5zZXRMYXRMbmdzKGRhdGEubGF0bG5ncylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRhdGEub3B0aW9ucykge1xyXG5cdFx0XHRcdFx0bGF5ZXIuc2V0U3R5bGUoZGF0YS5vcHRpb25zKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRnZXREYXRhOiBmdW5jdGlvbihsYXllciwgZGF0YSkge1xyXG5cdFx0XHRcdGRhdGEubGF0bG5ncyA9IGxheWVyLmdldExhdExuZ3MoKVswXVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cdH0pXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnbWFwLnNoYXBlJywgJ3BvbHlsaW5lJywgZnVuY3Rpb24obWFwVmlldykge1xyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGNyZWF0ZVNjaGVtYToge1xyXG5cdFx0XHRcdGxhdGxuZ3M6IFt7XHJcblx0XHRcdFx0XHRsYXQ6ICdudW1iZXInLCBcclxuXHRcdFx0XHRcdGxuZzogJ251bWJlcidcclxuXHRcdFx0XHR9XSxcclxuXHRcdFx0XHQkb3B0aW9uczoge1xyXG5cdFx0XHRcdFx0JGNvbG9yOiAnc3RyaW5nJ1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHVwZGF0ZVNjaGVtYToge1xyXG5cdFx0XHRcdCRsYXRsbmdzOiBbe1xyXG5cdFx0XHRcdFx0bGF0OiAnbnVtYmVyJywgXHJcblx0XHRcdFx0XHRsbmc6ICdudW1iZXInXHJcblx0XHRcdFx0fV0sXHJcblx0XHRcdFx0JG9wdGlvbnM6IHtcclxuXHRcdFx0XHRcdCRjb2xvcjogJ3N0cmluZydcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRjcmVhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0XHRyZXR1cm4gTC5wb2x5bGluZShkYXRhLmxhdGxuZ3MsIGRhdGEub3B0aW9ucylcclxuXHRcdFx0fSxcclxuXHRcdFx0dXBkYXRlOiBmdW5jdGlvbihsYXllciwgZGF0YSkge1xyXG5cclxuXHRcdFx0XHRpZiAoZGF0YS5sYXRsbmdzKSB7XHJcblx0XHRcdFx0XHRsYXllci5zZXRMYXRMbmdzKGRhdGEubGF0bG5ncylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRhdGEub3B0aW9ucykge1xyXG5cdFx0XHRcdFx0bGF5ZXIuc2V0U3R5bGUoZGF0YS5vcHRpb25zKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0Z2V0RGF0YTogZnVuY3Rpb24obGF5ZXIsIGRhdGEpIHtcclxuXHRcdFx0XHRkYXRhLmxhdGxuZ3MgPSBsYXllci5nZXRMYXRMbmdzKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHR9KVxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5zaGFwZScsICdyZWN0YW5nbGUnLCBmdW5jdGlvbihtYXBWaWV3KSB7XHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0Y3JlYXRlU2NoZW1hOiB7XHJcblx0XHRcdFx0bm9ydGhXZXN0OiB7XHJcblx0XHRcdFx0XHRsYXQ6ICdudW1iZXInLCBcclxuXHRcdFx0XHRcdGxuZzogJ251bWJlcidcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHNvdXRoRWFzdDoge1xyXG5cdFx0XHRcdFx0bGF0OiAnbnVtYmVyJywgXHJcblx0XHRcdFx0XHRsbmc6ICdudW1iZXInXHJcblx0XHRcdFx0fSxcdFx0cmFkaXVzOiAnbnVtYmVyJyxcclxuXHRcdFx0XHQkb3B0aW9uczoge1xyXG5cdFx0XHRcdFx0JGNvbG9yOiAnc3RyaW5nJ1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHVwZGF0ZVNjaGVtYToge1xyXG5cdFx0XHRcdCRub3J0aFdlc3Q6IHtcclxuXHRcdFx0XHRcdGxhdDogJ251bWJlcicsIFxyXG5cdFx0XHRcdFx0bG5nOiAnbnVtYmVyJ1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0JHNvdXRoRWFzdDoge1xyXG5cdFx0XHRcdFx0bGF0OiAnbnVtYmVyJywgXHJcblx0XHRcdFx0XHRsbmc6ICdudW1iZXInXHJcblx0XHRcdFx0fSxcdFx0cmFkaXVzOiAnbnVtYmVyJyxcclxuXHRcdFx0XHQkb3B0aW9uczoge1xyXG5cdFx0XHRcdFx0JGNvbG9yOiAnc3RyaW5nJ1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdGNyZWF0ZTogZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHRcclxuXHRcdFx0XHRsZXQgYm91bmRzID0gTC5sYXRMbmdCb3VuZHMoZGF0YS5ub3J0aFdlc3QsIGRhdGEuc291dGhFYXN0KVxyXG5cdFx0XHRcdHJldHVybiBMLnJlY3RhbmdsZShib3VuZHMsIGRhdGEub3B0aW9ucylcclxuXHRcdFx0fSxcclxuXHRcdFx0dXBkYXRlOiBmdW5jdGlvbihsYXllciwgZGF0YSkge1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGxldCBib3VuZHMgPSBMLmxhdExuZ0JvdW5kcyhkYXRhLm5vcnRoV2VzdCwgZGF0YS5zb3V0aEVhc3QpXHJcblx0XHRcdFx0bGF5ZXIuc2V0Qm91bmRzKGJvdW5kcylcclxuXHRcdFx0XHRsYXllci5zZXRTdHlsZShkYXRhLm9wdGlvbnMpXHJcblx0XHRcdH0sXHRcdFx0XHJcblx0XHRcdGdldERhdGE6IGZ1bmN0aW9uKGxheWVyLCBkYXRhKSB7XHJcblx0XHRcdFx0bGV0IGJvdW5kcyA9IGxheWVyLmdldEJvdW5kcygpXHJcblx0XHRcdFx0ZGF0YS5ub3J0aFdlc3QgPSAgYm91bmRzLmdldE5vcnRoV2VzdCgpXHJcblx0XHRcdFx0ZGF0YS5zb3V0aEVhc3QgPSAgYm91bmRzLmdldFNvdXRoRWFzdCgpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAuc2hhcGUnLCAnc2VjdG9yJywgZnVuY3Rpb24obWFwVmlldykge1xyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGNyZWF0ZVNjaGVtYToge1xyXG5cdFx0XHRcdGxhdGxuZzoge1xyXG5cdFx0XHRcdFx0bGF0OiAnbnVtYmVyJywgXHJcblx0XHRcdFx0XHRsbmc6ICdudW1iZXInXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRyYWRpdXM6ICdudW1iZXInLFxyXG5cdFx0XHRcdGRpcmVjdGlvbjogJ251bWJlcicsXHJcblx0XHRcdFx0c2l6ZTogJ251bWJlcicsXHJcblx0XHRcdFx0JG9wdGlvbnM6IHtcclxuXHRcdFx0XHRcdCRjb2xvcjogJ3N0cmluZydcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdHVwZGF0ZVNjaGVtYToge1xyXG5cdFx0XHRcdCRsYXRsbmc6IHtcclxuXHRcdFx0XHRcdGxhdDogJ251bWJlcicsIFxyXG5cdFx0XHRcdFx0bG5nOiAnbnVtYmVyJ1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0JHJhZGl1czogJ251bWJlcicsXHJcblx0XHRcdFx0JGRpcmVjdGlvbjogJ251bWJlcicsXHJcblx0XHRcdFx0JHNpemU6ICdudW1iZXInLFxyXG5cdFx0XHRcdCRvcHRpb25zOiB7XHJcblx0XHRcdFx0XHQkY29sb3I6ICdzdHJpbmcnXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFx0XHRcdFxyXG5cdFx0XHRjcmVhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0XHR2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHtyYWRpdXM6IGRhdGEucmFkaXVzfSwgZGF0YS5vcHRpb25zKVxyXG5cdFx0XHRcdHZhciBzZWN0b3IgPSBMLnNlbWlDaXJjbGUoZGF0YS5sYXRsbmcsIG9wdGlvbnMpXHJcblx0XHRcdFx0c2VjdG9yLnNldERpcmVjdGlvbihkYXRhLmRpcmVjdGlvbiwgZGF0YS5zaXplKVxyXG5cdFx0XHRcdHJldHVybiBzZWN0b3JcclxuXHRcdFx0fSxcclxuXHRcdFx0dXBkYXRlOiBmdW5jdGlvbihsYXllciwgZGF0YSkge1xyXG5cdFx0XHRcdGlmIChkYXRhLmxhdGxuZykge1xyXG5cdFx0XHRcdFx0bGF5ZXIuc2V0TGF0TG5nKGRhdGEubGF0bG5nKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5yYWRpdXMpIHtcclxuXHRcdFx0XHRcdGxheWVyLnNldFJhZGl1cyhkYXRhLnJhZGl1cylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRhdGEuZGlyZWN0aW9uICYmIGRhdGEuc2l6ZSkge1xyXG5cdFx0XHRcdFx0bGF5ZXIuc2V0RGlyZWN0aW9uKGRhdGEuZGlyZWN0aW9uLCBkYXRhLnNpemUpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChkYXRhLm9wdGlvbnMpIHtcclxuXHRcdFx0XHRcdGxheWVyLnNldFN0eWxlKGRhdGEub3B0aW9ucylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblx0fSlcclxufSkoKTtcclxuIl19
