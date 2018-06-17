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


			function dispose() {
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

			return {
				dispose,
				updateShape,
				removeShape,
				on: events.on.bind(events),
				getShapeInfo

			}
		}
	})

})();

