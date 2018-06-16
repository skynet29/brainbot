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
