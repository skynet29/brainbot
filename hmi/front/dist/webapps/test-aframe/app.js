$$.configReady(function() {

	var routes = [
		{href: '/', redirect: '/demo1'},
		{href: '/demo1', control: 'demo1Ctrl'},
		{href: '/demo2', control: 'demo2Ctrl'},
		{href: '/demo3', control: 'demo3Ctrl'}
	]

	var ctrl = $$.viewController('body', {
		template: "<div class=\"bn-flex-1 bn-flex-col\">\r\n	<div class=\"w3-blue\" bn-control=\"NavbarControl\" data-activeColor=\"w3-black\">\r\n	    <a href=\"#/demo1\">Demo 1</a>\r\n	    <a href=\"#/demo2\">Demo 2</a>\r\n	    <a href=\"#/demo3\">Demo 3</a>\r\n	</div>\r\n\r\n	<div bn-control=\"RouterControl\" bn-data=\"routes: routes\" class=\"mainPanel\"></div>\r\n</div>",
		data: {
			routes
		}
	})


});

(function() {


	$$.registerControl('demo1Ctrl', function(elt) {


		var ctrl = $$.viewController(elt, {
			template: "<a-scene>\r\n		\r\n	<a-box bn-attr=\"position: realBoxPosition\" rotation=\"0 45 0\" src=\"/pages/test-aframe/assets/texture.jpg\"></a-box>\r\n	<a-sphere position=\"0 1.25 -8\" radius=\"1.25\" bn-attr=\"rotation: realSphereRotation\" src=\"/pages/test-aframe/assets/cubes.jpg\">\r\n		<a-ring position=\"-1 1 0\" color=\"#B96FD3\"></a-ring>\r\n		<a-ring position=\"1 1 0\" color=\"#B96FD3\"></a-ring>\r\n	</a-sphere>\r\n	<a-cylinder position=\"-2 0.75 -3\" radius=\"0.5\" height=\"1.5\" color=\"#FFC65D\" rotation=\"90 0 0\"></a-cylinder> \r\n	<a-plane position=\"0 0 -4\" rotation=\"-90 0 0\" width=\"4\" height=\"4\" color=\"#7BC8A4\"></a-plane>\r\n	<a-text value=\"Hello, World\" position=\"0 2.5 -2\" color=\"#111\" align=\"center\" font=\"/fonts/Roboto-msdf.json\" color=\"#FF0000\"></a-text>\r\n	<a-cone height=\"2\" radius-top=\"0.3\" position=\"0 1 -6\"></a-cone>\r\n<!-- 	<a-light type=\"ambient\" color=\"#666\"></a-light>\r\n	<a-light type=\"point\" intensity=\"1\" position=\"2 4 4\"></a-light>\r\n --></a-scene>",
			data: {
				sphereRotation: [0, 0, 0],
				boxPosition: [-1, 0, -3],
				realBoxPosition: function() {
					return this.boxPosition.join(' ')
				},
				realSphereRotation: function() {
					return this.sphereRotation.join(' ')
				}
			}

		})

	 

		var timer = setInterval(function() {
			ctrl.model.sphereRotation[1] = (ctrl.model.sphereRotation[1] + 10) % 360

			ctrl.model.boxPosition[1] = (ctrl.model.boxPosition[1] + 0.5) % 3

			ctrl.update('sphereRotation,boxPosition')
		}, 500)		

		return {
			dispose: function() {
				clearInterval(timer)
			},

			canChange : function() {
				console.log('[demo1Ctrl] canChange')

				return confirm('Are you sure you wish to leave ?')
			}
		}

	})
})();

(function() {


	$$.registerControl('demo2Ctrl', function(elt) {

		var ctrl = $$.viewController(elt, {
			template: "<a-scene>\r\n	<a-assets>\r\n		<img id=\"city\" src=\"/pages/test-aframe/assets/city.jpg\">\r\n		<img id=\"sechelt\" src=\"/pages/test-aframe/assets/sechelt.jpg\">		\r\n		<img id=\"thumb-city\" src=\"/pages/test-aframe/assets/thumb-city.jpg\">		\r\n		<img id=\"thumb-sechelt\" src=\"/pages/test-aframe/assets/thumb-sechelt.jpg\">		\r\n\r\n	</a-assets>\r\n\r\n	<a-sky src=\"#city\" radius=\"10\" bn-bind=\"sky\"></a-sky>\r\n\r\n	<a-entity layout=\"type: line; margin: 1.5\" position=\"0 -1 -4\" \r\n		bn-event=\"click.item: onClick, mouseenter.item: onMouseEnter, mouseleave.item: onMouseLeave\">\r\n		<a-plane height=\"1\" width=\"1\"  class=\"item\" src=\"#thumb-sechelt\" data-src=\"#sechelt\"></a-plane>\r\n		<a-plane height=\"1\" width=\"1\" class=\"item\" src=\"#thumb-city\" data-src=\"#city\"></a-plane>\r\n		<a-plane height=\"1\" width=\"1\" color=\"red\" class=\"item\" ></a-plane>\r\n	</a-entity>\r\n\r\n	<a-camera>\r\n		<a-cursor color=\"green\" fuse=\"true\"></a-cursor>\r\n	</a-camera>\r\n</a-scene>",
			events: {
				onClick: function(ev) {
					console.log('onClick', $(this).data('src'))
					ctrl.scope.sky.attr('src', $(this).data('src'))
				},
				onMouseEnter: function() {
					console.log('onMouseEnter')
					$(this).attr('scale', '1.2 1.2 1')
				},
				onMouseLeave: function() {
					console.log('onMouseLeave')
					$(this).attr('scale', '1 1 1')			
				}				
			}
		})

	})


})();

(function() {


	$$.registerControl('demo3Ctrl', function(elt) {

		var ctrl = $$.viewController(elt, {
			template: "<a-scene>\r\n  <a-assets>\r\n    <a-asset-item id=\"cityModel\" src=\"/pages/test-aframe/assets/VC.gltf\"></a-asset-item>\r\n  </a-assets>\r\n\r\n  <a-entity fps-counter></a-entity>\r\n  \r\n  <a-gltf-model src=\"#cityModel\" animation-mixer></a-gltf-model>\r\n</a-scene>"
		})
	})

})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImRlbW8xLmpzIiwiZGVtbzIuanMiLCJkZW1vMy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQuY29uZmlnUmVhZHkoZnVuY3Rpb24oKSB7XHJcblxyXG5cdHZhciByb3V0ZXMgPSBbXHJcblx0XHR7aHJlZjogJy8nLCByZWRpcmVjdDogJy9kZW1vMSd9LFxyXG5cdFx0e2hyZWY6ICcvZGVtbzEnLCBjb250cm9sOiAnZGVtbzFDdHJsJ30sXHJcblx0XHR7aHJlZjogJy9kZW1vMicsIGNvbnRyb2w6ICdkZW1vMkN0cmwnfSxcclxuXHRcdHtocmVmOiAnL2RlbW8zJywgY29udHJvbDogJ2RlbW8zQ3RybCd9XHJcblx0XVxyXG5cclxuXHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xyXG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC0xIGJuLWZsZXgtY29sXFxcIj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInczLWJsdWVcXFwiIGJuLWNvbnRyb2w9XFxcIk5hdmJhckNvbnRyb2xcXFwiIGRhdGEtYWN0aXZlQ29sb3I9XFxcInczLWJsYWNrXFxcIj5cXHJcXG5cdCAgICA8YSBocmVmPVxcXCIjL2RlbW8xXFxcIj5EZW1vIDE8L2E+XFxyXFxuXHQgICAgPGEgaHJlZj1cXFwiIy9kZW1vMlxcXCI+RGVtbyAyPC9hPlxcclxcblx0ICAgIDxhIGhyZWY9XFxcIiMvZGVtbzNcXFwiPkRlbW8gMzwvYT5cXHJcXG5cdDwvZGl2Plxcclxcblxcclxcblx0PGRpdiBibi1jb250cm9sPVxcXCJSb3V0ZXJDb250cm9sXFxcIiBibi1kYXRhPVxcXCJyb3V0ZXM6IHJvdXRlc1xcXCIgY2xhc3M9XFxcIm1haW5QYW5lbFxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XCIsXHJcblx0XHRkYXRhOiB7XHJcblx0XHRcdHJvdXRlc1xyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG5cclxufSk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbCgnZGVtbzFDdHJsJywgZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxhLXNjZW5lPlxcclxcblx0XHRcXHJcXG5cdDxhLWJveCBibi1hdHRyPVxcXCJwb3NpdGlvbjogcmVhbEJveFBvc2l0aW9uXFxcIiByb3RhdGlvbj1cXFwiMCA0NSAwXFxcIiBzcmM9XFxcIi9wYWdlcy90ZXN0LWFmcmFtZS9hc3NldHMvdGV4dHVyZS5qcGdcXFwiPjwvYS1ib3g+XFxyXFxuXHQ8YS1zcGhlcmUgcG9zaXRpb249XFxcIjAgMS4yNSAtOFxcXCIgcmFkaXVzPVxcXCIxLjI1XFxcIiBibi1hdHRyPVxcXCJyb3RhdGlvbjogcmVhbFNwaGVyZVJvdGF0aW9uXFxcIiBzcmM9XFxcIi9wYWdlcy90ZXN0LWFmcmFtZS9hc3NldHMvY3ViZXMuanBnXFxcIj5cXHJcXG5cdFx0PGEtcmluZyBwb3NpdGlvbj1cXFwiLTEgMSAwXFxcIiBjb2xvcj1cXFwiI0I5NkZEM1xcXCI+PC9hLXJpbmc+XFxyXFxuXHRcdDxhLXJpbmcgcG9zaXRpb249XFxcIjEgMSAwXFxcIiBjb2xvcj1cXFwiI0I5NkZEM1xcXCI+PC9hLXJpbmc+XFxyXFxuXHQ8L2Etc3BoZXJlPlxcclxcblx0PGEtY3lsaW5kZXIgcG9zaXRpb249XFxcIi0yIDAuNzUgLTNcXFwiIHJhZGl1cz1cXFwiMC41XFxcIiBoZWlnaHQ9XFxcIjEuNVxcXCIgY29sb3I9XFxcIiNGRkM2NURcXFwiIHJvdGF0aW9uPVxcXCI5MCAwIDBcXFwiPjwvYS1jeWxpbmRlcj4gXFxyXFxuXHQ8YS1wbGFuZSBwb3NpdGlvbj1cXFwiMCAwIC00XFxcIiByb3RhdGlvbj1cXFwiLTkwIDAgMFxcXCIgd2lkdGg9XFxcIjRcXFwiIGhlaWdodD1cXFwiNFxcXCIgY29sb3I9XFxcIiM3QkM4QTRcXFwiPjwvYS1wbGFuZT5cXHJcXG5cdDxhLXRleHQgdmFsdWU9XFxcIkhlbGxvLCBXb3JsZFxcXCIgcG9zaXRpb249XFxcIjAgMi41IC0yXFxcIiBjb2xvcj1cXFwiIzExMVxcXCIgYWxpZ249XFxcImNlbnRlclxcXCIgZm9udD1cXFwiL2ZvbnRzL1JvYm90by1tc2RmLmpzb25cXFwiIGNvbG9yPVxcXCIjRkYwMDAwXFxcIj48L2EtdGV4dD5cXHJcXG5cdDxhLWNvbmUgaGVpZ2h0PVxcXCIyXFxcIiByYWRpdXMtdG9wPVxcXCIwLjNcXFwiIHBvc2l0aW9uPVxcXCIwIDEgLTZcXFwiPjwvYS1jb25lPlxcclxcbjwhLS0gXHQ8YS1saWdodCB0eXBlPVxcXCJhbWJpZW50XFxcIiBjb2xvcj1cXFwiIzY2NlxcXCI+PC9hLWxpZ2h0Plxcclxcblx0PGEtbGlnaHQgdHlwZT1cXFwicG9pbnRcXFwiIGludGVuc2l0eT1cXFwiMVxcXCIgcG9zaXRpb249XFxcIjIgNCA0XFxcIj48L2EtbGlnaHQ+XFxyXFxuIC0tPjwvYS1zY2VuZT5cIixcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdHNwaGVyZVJvdGF0aW9uOiBbMCwgMCwgMF0sXHJcblx0XHRcdFx0Ym94UG9zaXRpb246IFstMSwgMCwgLTNdLFxyXG5cdFx0XHRcdHJlYWxCb3hQb3NpdGlvbjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5ib3hQb3NpdGlvbi5qb2luKCcgJylcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHJlYWxTcGhlcmVSb3RhdGlvbjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5zcGhlcmVSb3RhdGlvbi5qb2luKCcgJylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHR9KVxyXG5cclxuXHQgXHJcblxyXG5cdFx0dmFyIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XHJcblx0XHRcdGN0cmwubW9kZWwuc3BoZXJlUm90YXRpb25bMV0gPSAoY3RybC5tb2RlbC5zcGhlcmVSb3RhdGlvblsxXSArIDEwKSAlIDM2MFxyXG5cclxuXHRcdFx0Y3RybC5tb2RlbC5ib3hQb3NpdGlvblsxXSA9IChjdHJsLm1vZGVsLmJveFBvc2l0aW9uWzFdICsgMC41KSAlIDNcclxuXHJcblx0XHRcdGN0cmwudXBkYXRlKCdzcGhlcmVSb3RhdGlvbixib3hQb3NpdGlvbicpXHJcblx0XHR9LCA1MDApXHRcdFxyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNsZWFySW50ZXJ2YWwodGltZXIpXHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRjYW5DaGFuZ2UgOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW2RlbW8xQ3RybF0gY2FuQ2hhbmdlJylcclxuXHJcblx0XHRcdFx0cmV0dXJuIGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2lzaCB0byBsZWF2ZSA/JylcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2woJ2RlbW8yQ3RybCcsIGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxhLXNjZW5lPlxcclxcblx0PGEtYXNzZXRzPlxcclxcblx0XHQ8aW1nIGlkPVxcXCJjaXR5XFxcIiBzcmM9XFxcIi9wYWdlcy90ZXN0LWFmcmFtZS9hc3NldHMvY2l0eS5qcGdcXFwiPlxcclxcblx0XHQ8aW1nIGlkPVxcXCJzZWNoZWx0XFxcIiBzcmM9XFxcIi9wYWdlcy90ZXN0LWFmcmFtZS9hc3NldHMvc2VjaGVsdC5qcGdcXFwiPlx0XHRcXHJcXG5cdFx0PGltZyBpZD1cXFwidGh1bWItY2l0eVxcXCIgc3JjPVxcXCIvcGFnZXMvdGVzdC1hZnJhbWUvYXNzZXRzL3RodW1iLWNpdHkuanBnXFxcIj5cdFx0XFxyXFxuXHRcdDxpbWcgaWQ9XFxcInRodW1iLXNlY2hlbHRcXFwiIHNyYz1cXFwiL3BhZ2VzL3Rlc3QtYWZyYW1lL2Fzc2V0cy90aHVtYi1zZWNoZWx0LmpwZ1xcXCI+XHRcdFxcclxcblxcclxcblx0PC9hLWFzc2V0cz5cXHJcXG5cXHJcXG5cdDxhLXNreSBzcmM9XFxcIiNjaXR5XFxcIiByYWRpdXM9XFxcIjEwXFxcIiBibi1iaW5kPVxcXCJza3lcXFwiPjwvYS1za3k+XFxyXFxuXFxyXFxuXHQ8YS1lbnRpdHkgbGF5b3V0PVxcXCJ0eXBlOiBsaW5lOyBtYXJnaW46IDEuNVxcXCIgcG9zaXRpb249XFxcIjAgLTEgLTRcXFwiIFxcclxcblx0XHRibi1ldmVudD1cXFwiY2xpY2suaXRlbTogb25DbGljaywgbW91c2VlbnRlci5pdGVtOiBvbk1vdXNlRW50ZXIsIG1vdXNlbGVhdmUuaXRlbTogb25Nb3VzZUxlYXZlXFxcIj5cXHJcXG5cdFx0PGEtcGxhbmUgaGVpZ2h0PVxcXCIxXFxcIiB3aWR0aD1cXFwiMVxcXCIgIGNsYXNzPVxcXCJpdGVtXFxcIiBzcmM9XFxcIiN0aHVtYi1zZWNoZWx0XFxcIiBkYXRhLXNyYz1cXFwiI3NlY2hlbHRcXFwiPjwvYS1wbGFuZT5cXHJcXG5cdFx0PGEtcGxhbmUgaGVpZ2h0PVxcXCIxXFxcIiB3aWR0aD1cXFwiMVxcXCIgY2xhc3M9XFxcIml0ZW1cXFwiIHNyYz1cXFwiI3RodW1iLWNpdHlcXFwiIGRhdGEtc3JjPVxcXCIjY2l0eVxcXCI+PC9hLXBsYW5lPlxcclxcblx0XHQ8YS1wbGFuZSBoZWlnaHQ9XFxcIjFcXFwiIHdpZHRoPVxcXCIxXFxcIiBjb2xvcj1cXFwicmVkXFxcIiBjbGFzcz1cXFwiaXRlbVxcXCIgPjwvYS1wbGFuZT5cXHJcXG5cdDwvYS1lbnRpdHk+XFxyXFxuXFxyXFxuXHQ8YS1jYW1lcmE+XFxyXFxuXHRcdDxhLWN1cnNvciBjb2xvcj1cXFwiZ3JlZW5cXFwiIGZ1c2U9XFxcInRydWVcXFwiPjwvYS1jdXJzb3I+XFxyXFxuXHQ8L2EtY2FtZXJhPlxcclxcbjwvYS1zY2VuZT5cIixcclxuXHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0b25DbGljazogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbkNsaWNrJywgJCh0aGlzKS5kYXRhKCdzcmMnKSlcclxuXHRcdFx0XHRcdGN0cmwuc2NvcGUuc2t5LmF0dHIoJ3NyYycsICQodGhpcykuZGF0YSgnc3JjJykpXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbk1vdXNlRW50ZXI6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uTW91c2VFbnRlcicpXHJcblx0XHRcdFx0XHQkKHRoaXMpLmF0dHIoJ3NjYWxlJywgJzEuMiAxLjIgMScpXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbk1vdXNlTGVhdmU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uTW91c2VMZWF2ZScpXHJcblx0XHRcdFx0XHQkKHRoaXMpLmF0dHIoJ3NjYWxlJywgJzEgMSAxJylcdFx0XHRcclxuXHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHJcblx0fSlcclxuXHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2woJ2RlbW8zQ3RybCcsIGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxhLXNjZW5lPlxcclxcbiAgPGEtYXNzZXRzPlxcclxcbiAgICA8YS1hc3NldC1pdGVtIGlkPVxcXCJjaXR5TW9kZWxcXFwiIHNyYz1cXFwiL3BhZ2VzL3Rlc3QtYWZyYW1lL2Fzc2V0cy9WQy5nbHRmXFxcIj48L2EtYXNzZXQtaXRlbT5cXHJcXG4gIDwvYS1hc3NldHM+XFxyXFxuXFxyXFxuICA8YS1lbnRpdHkgZnBzLWNvdW50ZXI+PC9hLWVudGl0eT5cXHJcXG4gIFxcclxcbiAgPGEtZ2x0Zi1tb2RlbCBzcmM9XFxcIiNjaXR5TW9kZWxcXFwiIGFuaW1hdGlvbi1taXhlcj48L2EtZ2x0Zi1tb2RlbD5cXHJcXG48L2Etc2NlbmU+XCJcclxuXHRcdH0pXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcbiJdfQ==
