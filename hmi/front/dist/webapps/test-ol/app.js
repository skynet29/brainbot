$$.configReady(function(config) {

	$$.startApp('MainControl')
})
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
		template: "<div class=\"bn-flex-1 bn-no-overflow bn-flex-col\">\r\n	<div id=\"map\" class=\"bn-flex-1 bn-no-overflow\"></div>\r\n	<div id=\"scale-line\" class=\"scale-line\"></div>\r\n	<div>\r\n		<button bn-event=\"click: onClear\">Clear</button>\r\n		<button bn-event=\"click: onSelect\">Select</button>\r\n		<button bn-event=\"click: onDrawPolygon\">Polygon</button>\r\n		<button bn-event=\"click: onDrawCircle\">Circle</button>\r\n		<button bn-event=\"click: onModify\">Modify</button>\r\n		<button bn-event=\"click: onNone\">None</button>\r\n		<button bn-event=\"click: onDump\">Dump</button>\r\n\r\n	</div>\r\n	<div>\r\n		<h2 bn-text=\"title\"></h2>\r\n		<div bn-html=\"summary\"></div>	\r\n	</div>\r\n	\r\n</div>",
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQuY29uZmlnUmVhZHkoZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cdCQkLnN0YXJ0QXBwKCdNYWluQ29udHJvbCcpXHJcbn0pIiwiJCQucmVnaXN0ZXJDb250cm9sKCdNYWluQ29udHJvbCcsIFsnT3BlbkxheWVyU2VydmljZScsICdNaWxTeW1ib2xTZXJ2aWNlJ10sIGZ1bmN0aW9uKGVsdCwgb2wsIG1zKSB7XHJcblxyXG5cdHZhciBjdXJBY3Rpb24gPSBudWxsXHJcblxyXG5cdGZ1bmN0aW9uIHNldEFjdGlvbihhY3Rpb24pIHtcclxuXHRcdGlmIChjdXJBY3Rpb24gIT0gbnVsbCkge1xyXG5cdFx0XHRtYXAucmVtb3ZlSW50ZXJhY3Rpb24oY3VyQWN0aW9uKVxyXG5cdFx0fVxyXG5cdFx0aWYgKGFjdGlvbiAhPSBudWxsKSB7XHJcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihhY3Rpb24pXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGN1ckFjdGlvbiA9IGFjdGlvblxyXG5cdH1cclxuXHJcblx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1uby1vdmVyZmxvdyBibi1mbGV4LWNvbFxcXCI+XFxyXFxuXHQ8ZGl2IGlkPVxcXCJtYXBcXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgYm4tbm8tb3ZlcmZsb3dcXFwiPjwvZGl2Plxcclxcblx0PGRpdiBpZD1cXFwic2NhbGUtbGluZVxcXCIgY2xhc3M9XFxcInNjYWxlLWxpbmVcXFwiPjwvZGl2Plxcclxcblx0PGRpdj5cXHJcXG5cdFx0PGJ1dHRvbiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQ2xlYXJcXFwiPkNsZWFyPC9idXR0b24+XFxyXFxuXHRcdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvblNlbGVjdFxcXCI+U2VsZWN0PC9idXR0b24+XFxyXFxuXHRcdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkRyYXdQb2x5Z29uXFxcIj5Qb2x5Z29uPC9idXR0b24+XFxyXFxuXHRcdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkRyYXdDaXJjbGVcXFwiPkNpcmNsZTwvYnV0dG9uPlxcclxcblx0XHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25Nb2RpZnlcXFwiPk1vZGlmeTwvYnV0dG9uPlxcclxcblx0XHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25Ob25lXFxcIj5Ob25lPC9idXR0b24+XFxyXFxuXHRcdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkR1bXBcXFwiPkR1bXA8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdDwvZGl2Plxcclxcblx0PGRpdj5cXHJcXG5cdFx0PGgyIGJuLXRleHQ9XFxcInRpdGxlXFxcIj48L2gyPlxcclxcblx0XHQ8ZGl2IGJuLWh0bWw9XFxcInN1bW1hcnlcXFwiPjwvZGl2Plx0XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdFxcclxcbjwvZGl2PlwiLFxyXG5cdFx0ZXZlbnRzOiB7XHJcblx0XHRcdG9uQ2xlYXI6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvbkNsZWFyJylcclxuXHRcdFx0XHRzb3VyY2UuY2xlYXIoKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRvblNlbGVjdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0c2V0QWN0aW9uKHNlbGVjdClcclxuXHRcdFx0fSxcclxuXHRcdFx0b25EcmF3UG9seWdvbjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0c2V0QWN0aW9uKGRyYXdQb2x5Z29uKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRvbkRyYXdDaXJjbGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHNldEFjdGlvbihkcmF3Q2lyY2xlKVxyXG5cdFx0XHR9LFx0XHRcclxuXHRcdFx0b25Ob25lOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRzZXRBY3Rpb24obnVsbClcclxuXHRcdFx0fSxcclxuXHRcdFx0b25Nb2RpZnk6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHNldEFjdGlvbihtb2RpZnkpXHJcblx0XHRcdH0sXHJcblx0XHRcdG9uRHVtcCgpIHtcclxuXHRcdFx0XHR2YXIgZmVhdHVyZXMgPSBzb3VyY2UuZ2V0RmVhdHVyZXMoKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdsZW5ndGgnLCBmZWF0dXJlcy5sZW5ndGgpXHJcblx0XHRcdFx0ZmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbihmZWF0dXJlKSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnZ2VvbWV0cnlUeXBlJywgZmVhdHVyZS5nZXRHZW9tZXRyeSgpLmdldFR5cGUoKSlcclxuXHRcdFx0XHRcdHZhciBjZW50ZXIgPSBmZWF0dXJlLmdldEdlb21ldHJ5KCkuZ2V0Q2VudGVyKClcclxuXHRcdFx0XHRcdHZhciBsb25sYXQgPSBvbC5wcm9qLnRvTG9uTGF0KGNlbnRlcilcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdjb29yZGluYXRlcycsIGxvbmxhdClcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyYWRpdXMnLCBmZWF0dXJlLmdldEdlb21ldHJ5KCkuZ2V0UmFkaXVzKCkpXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVx0XHRcdFxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG5cdHZhciBzb3VyY2UgPSBuZXcgb2wuc291cmNlLlZlY3Rvcih7XHJcblx0XHR1cmw6ICcvZGF0YS9yZXN1bHQuanNvbicsXHJcblx0XHRmb3JtYXQ6IG5ldyBvbC5mb3JtYXQuR2VvSlNPTigpXHJcblx0fSlcclxuXHJcblx0dmFyIHZlY3RvckxheWVyID0gbmV3IG9sLmxheWVyLlZlY3Rvcih7XHJcblx0XHRcdCAgdGl0bGU6ICdFYXJ0aHF1YWtlcycsXHJcblxyXG5cdFx0XHQgc291cmNlOiBzb3VyY2UsXHJcblx0XHRcdCBzdHlsZTogbWlsU3ltYm9sU3R5bGVcclxuXHRcdFx0fSkgXHJcblxyXG5cdHZhciBjaXJjbGVTdHlsZSA9IG5ldyBvbC5zdHlsZS5TdHlsZSh7XHJcblx0XHRcdCAgICBpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XHJcblx0XHRcdCAgICAgIHJhZGl1czogMyxcclxuXHRcdFx0ICAgICAgZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe2NvbG9yOiAncmVkJ30pLFxyXG5cdFx0XHQgICAgICAgc3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHsgY29sb3I6ICdncmVlbicsIHdpZHRoOiAxIH0pXHJcblx0XHRcdCAgICB9KVxyXG5cdFx0XHQgIH0pXHJcblxyXG5cdGZ1bmN0aW9uIG1pbFN5bWJvbFN0eWxlKGZlYXR1cmUsIHJlc29sdXRpb24pIHtcclxuXHRcdHZhciB6b29tID0gbWFwLmdldFZpZXcoKS5nZXRab29tKClcclxuXHJcblx0XHRpZiAoem9vbSA8IDgpIHtcclxuXHRcdFx0cmV0dXJuIGNpcmNsZVN0eWxlXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHByb3BzID0gZmVhdHVyZS5nZXRQcm9wZXJ0aWVzKClcclxuXHRcdC8vY29uc29sZS5sb2coJ21pbFN5bWJvbFN0eWxlJywgem9vbSwgcHJvcHMudXVpZClcclxuXHRcdHZhciBzeW1ib2wgPSBuZXcgbXMuU3ltYm9sKHByb3BzLnNpZGMsIHtcclxuXHRcdFx0c2l6ZTogMjAsXHJcblx0XHRcdHVuaXF1ZURlc2lnbmF0aW9uOiBwcm9wcy51dWlkXHJcblx0XHR9KVxyXG5cclxuXHRcdHZhciBhbmNob3IgPSBzeW1ib2wuZ2V0QW5jaG9yKClcclxuXHRcdHZhciBzaXplID0gc3ltYm9sLmdldFNpemUoKVxyXG5cclxuXHRcdHJldHVybiBuZXcgb2wuc3R5bGUuU3R5bGUoe1xyXG4gICAgICAgICAgaW1hZ2U6IG5ldyBvbC5zdHlsZS5JY29uKCh7XHJcbiAgICAgICAgICAgIHNjYWxlOiAxLFxyXG4gICAgICAgICAgICBhbmNob3I6IFthbmNob3IueCwgYW5jaG9yLnldLFxyXG4gICAgICAgICAgICBhbmNob3JYVW5pdHM6ICdwaXhlbHMnLFxyXG4gICAgICAgICAgICBhbmNob3JZVW5pdHM6ICdwaXhlbHMnLFxyXG4gICAgICAgICAgICBpbWdTaXplOiBbTWF0aC5mbG9vcihzaXplLndpZHRoKSwgTWF0aC5mbG9vcihzaXplLmhlaWdodCldLFxyXG4gICAgICAgICAgICBpbWc6IHN5bWJvbC5hc0NhbnZhcygpXHJcbiAgICAgICAgICB9KSlcclxuXHRcdH0pXHRcdFxyXG5cdH1cclxuXHJcblxyXG5cclxuLypcclxuXHR2YXIgc291cmNlID0gbmV3IG9sLnNvdXJjZS5WZWN0b3IoKVxyXG5cclxuXHR2YXIgdmVjdG9yTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcclxuXHRcdHNvdXJjZTogc291cmNlLFxyXG4gICAgICAgIHN0eWxlOiBuZXcgb2wuc3R5bGUuU3R5bGUoe1xyXG4gICAgICAgIFx0ZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe2NvbG9yOiAnZ3JlZW4nfSlcclxuICAgICAgICB9KVx0XHJcbiAgICB9KSovXHJcblxyXG5cdHZhciB0aWxlTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVGlsZSh7XHJcblx0XHRzb3VyY2U6IG5ldyBvbC5zb3VyY2UuT1NNKClcclxuXHR9KVxyXG5cclxuXHJcblxyXG4gICAgIHZhciBkcmF3UG9seWdvbiA9IG5ldyBvbC5pbnRlcmFjdGlvbi5EcmF3KHtcclxuICAgICAgICBzb3VyY2U6IHNvdXJjZSxcclxuICAgICAgICB0eXBlOiAnUG9seWdvbidcclxuICAgICAgfSlcclxuXHJcbiAgICAgZHJhd1BvbHlnb24ub24oJ2RyYXdlbmQnLCBmdW5jdGlvbigpIHtcclxuICAgICBcdGNvbnNvbGUubG9nKCdkcmF3ZW5kJylcclxuICAgICB9KVxyXG5cclxuICAgICB2YXIgZHJhd0NpcmNsZSA9IG5ldyBvbC5pbnRlcmFjdGlvbi5EcmF3KHtcclxuICAgICAgICBzb3VyY2U6IHNvdXJjZSxcclxuICAgICAgICB0eXBlOiAnQ2lyY2xlJyxcclxuXHJcbiAgICAgIH0pICAgICBcclxuXHJcbiAgICAgdmFyIG1vZGlmeSA9IG5ldyBvbC5pbnRlcmFjdGlvbi5Nb2RpZnkoe1xyXG4gICAgICAgIHNvdXJjZTogc291cmNlXHJcbiAgICAgIH0pXHJcblxyXG5cdHZhciBzZWxlY3QgPSBuZXcgb2wuaW50ZXJhY3Rpb24uU2VsZWN0KHtcclxuXHRcdCAgICBzdHlsZTogbmV3IG9sLnN0eWxlLlN0eWxlKHtcclxuXHRcdCAgICAgIGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcclxuXHRcdCAgICAgICAgcmFkaXVzOiA1LFxyXG5cdFx0ICAgICAgICBmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XHJcblx0XHQgICAgICAgICAgY29sb3I6ICcjRkYwMDAwJ1xyXG5cdFx0ICAgICAgICB9KSxcclxuXHRcdCAgICAgICAgc3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcclxuXHRcdCAgICAgICAgICBjb2xvcjogJyMwMDAwMDAnXHJcblx0XHQgICAgICAgIH0pXHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgIH0pXHJcblx0XHQgIH0pXHJcblxyXG5cclxuICAgICAgdmFyIG1hcCA9IG5ldyBvbC5NYXAoe1xyXG4gICAgICAgIHRhcmdldDogJ21hcCcsXHJcbiAgICAgICAgbGF5ZXJzOiBbdGlsZUxheWVyLCB2ZWN0b3JMYXllcl0sXHJcblxyXG4gICAgICAgIHZpZXc6IG5ldyBvbC5WaWV3KHtcclxuICAgICAgICAgIGNlbnRlcjogb2wucHJvai5mcm9tTG9uTGF0KFstNC41MzQxNywgNDguMzU4M10pLFxyXG4gICAgICAgICAgem9vbTogOVxyXG4gICAgICAgIH0pLFxyXG5cclxuLypcdFx0Y29udHJvbHM6IG9sLmNvbnRyb2wuZGVmYXVsdHMoKS5leHRlbmQoW1xyXG5cdFx0ICBcdG5ldyBvbC5jb250cm9sLlNjYWxlTGluZSgpXHJcbiAgXHJcblx0XHRdKSovXHJcblxyXG5cdFx0Y29udHJvbHM6IG9sLmNvbnRyb2wuZGVmYXVsdHMoKS5leHRlbmQoW1xyXG5cdFx0ICBuZXcgb2wuY29udHJvbC5TY2FsZUxpbmUoe2NsYXNzTmFtZTogJ29sLXNjYWxlLWxpbmUnLCB0YXJnZXQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY2FsZS1saW5lJyl9KVxyXG5cdFx0XSksXHRcclxuXHJcbi8qXHQgICBjb250cm9sczogb2wuY29udHJvbC5kZWZhdWx0cyh7XHJcblx0ICAgICAgYXR0cmlidXRpb25PcHRpb25zOiB7XHJcblx0ICAgICAgICBjb2xsYXBzaWJsZTogZmFsc2VcclxuXHQgICAgICB9XHJcblx0ICAgIH0pKi9cclxuXHJcbi8qXHRcdGludGVyYWN0aW9uczogb2wuaW50ZXJhY3Rpb24uZGVmYXVsdHMoKS5leHRlbmQoW1xyXG5cdFx0ICBuZXcgb2wuaW50ZXJhY3Rpb24uU2VsZWN0KHtcclxuXHRcdCAgICBzdHlsZTogbmV3IG9sLnN0eWxlLlN0eWxlKHtcclxuXHRcdCAgICAgIGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcclxuXHRcdCAgICAgICAgcmFkaXVzOiA1LFxyXG5cdFx0ICAgICAgICBmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XHJcblx0XHQgICAgICAgICAgY29sb3I6ICcjRkYwMDAwJ1xyXG5cdFx0ICAgICAgICB9KSxcclxuXHRcdCAgICAgICAgc3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcclxuXHRcdCAgICAgICAgICBjb2xvcjogJyMwMDAwMDAnXHJcblx0XHQgICAgICAgIH0pXHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgIH0pXHJcblx0XHQgIH0pXHJcblx0XHRdKSxcdCAqLyBcclxuXHJcbi8qXHRcdGludGVyYWN0aW9uczogb2wuaW50ZXJhY3Rpb24uZGVmYXVsdHMoKS5leHRlbmQoW2RyYXddKSAgXHJcbiovXHJcbiAgICAgIH0pXHJcbi8qICAgICAgbWFwLmFkZEludGVyYWN0aW9uKGRyYXcpXHJcbiAgICAgIG1hcC5hZGRJbnRlcmFjdGlvbihzZWxlY3QpKi9cclxuXHJcbiAgICAgIG1hcC5vbignY2xpY2snLCBmdW5jdGlvbihldikge1xyXG4gICAgICBcdFx0Y29uc29sZS5sb2coJ2NsaWNrJywgZXYpXHJcbiAgICAgIFx0XHRtYXAuZm9yRWFjaEZlYXR1cmVBdFBpeGVsKGV2LnBpeGVsLCBmdW5jdGlvbihmZWF0dXJlKSB7XHJcbiAgICAgIFx0XHRcdHZhciBwcm9wcyA9IGZlYXR1cmUuZ2V0UHJvcGVydGllcygpXHJcbiAgICAgIFx0XHRcdC8vY29uc29sZS5sb2coJ3Byb3BzJywgcHJvcHMuc3VtbWFyeSlcclxuICAgICAgXHRcdFx0Y3RybC5zZXREYXRhKHt0aXRsZTogcHJvcHMudXVpZH0pXHJcbiAgICAgIFx0XHRcdG1hcC51cGRhdGVTaXplKClcclxuICAgICAgXHRcdFx0cmV0dXJuIHRydWVcclxuICAgICAgXHRcdH0pIFxyXG4gICAgICB9KVxyXG5cclxufSkiXX0=
