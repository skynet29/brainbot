$$.registerControl('MainControl', ['OpenLayerService', 'MilSymbolService'], function(elt, ol, ms) {

	var curAction = null

	function setAction(action) {
		if (curAction != null) {
			map.removeInteraction(curAction)
		}
		if (action != null) {
			map.addInteraction(action)
		}
		
		curAction = action
	}

	var ctrl = $$.viewController(elt, {
		template: {gulp_inject: './app.html'},
		events: {
			onClear: function() {
				console.log('onClear')
				source.clear()
			},
			onSelect: function() {
				setAction(select)
			},
			onDrawPolygon: function() {
				setAction(drawPolygon)
			},
			onDrawCircle: function() {
				setAction(drawCircle)
			},		
			onNone: function() {
				setAction(null)
			},
			onModify: function() {
				setAction(modify)
			},
			onDump() {
				var features = source.getFeatures()
				console.log('length', features.length)
				features.forEach(function(feature) {
					console.log('geometryType', feature.getGeometry().getType())
					var center = feature.getGeometry().getCenter()
					var lonlat = ol.proj.toLonLat(center)
					console.log('coordinates', lonlat)
					console.log('radius', feature.getGeometry().getRadius())
				})
			}			
		}
	})

	var source = new ol.source.Vector({
		url: '/data/result.json',
		format: new ol.format.GeoJSON()
	})

	var vectorLayer = new ol.layer.Vector({
			  title: 'Earthquakes',

			 source: source,
			 style: milSymbolStyle
			}) 

	var circleStyle = new ol.style.Style({
			    image: new ol.style.Circle({
			      radius: 3,
			      fill: new ol.style.Fill({color: 'red'}),
			       stroke: new ol.style.Stroke({ color: 'green', width: 1 })
			    })
			  })

	function milSymbolStyle(feature, resolution) {
		var zoom = map.getView().getZoom()

		if (zoom < 8) {
			return circleStyle
		}

		var props = feature.getProperties()
		//console.log('milSymbolStyle', zoom, props.uuid)
		var symbol = new ms.Symbol(props.sidc, {
			size: 20,
			uniqueDesignation: props.uuid
		})

		var anchor = symbol.getAnchor()
		var size = symbol.getSize()

		return new ol.style.Style({
          image: new ol.style.Icon(({
            scale: 1,
            anchor: [anchor.x, anchor.y],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            imgSize: [Math.floor(size.width), Math.floor(size.height)],
            img: symbol.asCanvas()
          }))
		})		
	}



/*
	var source = new ol.source.Vector()

	var vectorLayer = new ol.layer.Vector({
		source: source,
        style: new ol.style.Style({
        	fill: new ol.style.Fill({color: 'green'})
        })	
    })*/

	var tileLayer = new ol.layer.Tile({
		source: new ol.source.OSM()
	})



     var drawPolygon = new ol.interaction.Draw({
        source: source,
        type: 'Polygon'
      })

     drawPolygon.on('drawend', function() {
     	console.log('drawend')
     })

     var drawCircle = new ol.interaction.Draw({
        source: source,
        type: 'Circle',

      })     

     var modify = new ol.interaction.Modify({
        source: source
      })

	var select = new ol.interaction.Select({
		    style: new ol.style.Style({
		      image: new ol.style.Circle({
		        radius: 5,
		        fill: new ol.style.Fill({
		          color: '#FF0000'
		        }),
		        stroke: new ol.style.Stroke({
		          color: '#000000'
		        })
		      })
		    })
		  })


      var map = new ol.Map({
        target: 'map',
        layers: [tileLayer, vectorLayer],

        view: new ol.View({
          center: ol.proj.fromLonLat([-4.53417, 48.3583]),
          zoom: 9
        }),

/*		controls: ol.control.defaults().extend([
		  	new ol.control.ScaleLine()
  
		])*/

		controls: ol.control.defaults().extend([
		  new ol.control.ScaleLine({className: 'ol-scale-line', target: document.getElementById('scale-line')})
		]),	

/*	   controls: ol.control.defaults({
	      attributionOptions: {
	        collapsible: false
	      }
	    })*/

/*		interactions: ol.interaction.defaults().extend([
		  new ol.interaction.Select({
		    style: new ol.style.Style({
		      image: new ol.style.Circle({
		        radius: 5,
		        fill: new ol.style.Fill({
		          color: '#FF0000'
		        }),
		        stroke: new ol.style.Stroke({
		          color: '#000000'
		        })
		      })
		    })
		  })
		]),	 */ 

/*		interactions: ol.interaction.defaults().extend([draw])  
*/
      })
/*      map.addInteraction(draw)
      map.addInteraction(select)*/

      map.on('click', function(ev) {
      		console.log('click', ev)
      		map.forEachFeatureAtPixel(ev.pixel, function(feature) {
      			var props = feature.getProperties()
      			//console.log('props', props.summary)
      			ctrl.setData({title: props.uuid})
      			map.updateSize()
      			return true
      		}) 
      })

})