$$.configReady(function(config) {

	var tacticConfig = {
		"map": {
			"attributionControl": false,
			"zoomControl": true,
			"center": [48.3583, -4.53417],
			"zoom": 13		
		},

		"tileLayer": {
			"maxZoom": 19,
			"urlTemplate": "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
		},

		"controls": {

			"layers": {
				"mission": {"label": "Mission", "visible": true},
				"default": {"label": "Default", "visible": true},
				"vehicule": {"label": "Vehicule", "visible": true}
			}

			
		},		

		"plugins": {

			"ShapeDecoder": {}
		}		
	}	

	var routes = [
		{href: '/', redirect: '/agents'},
		{href: '/agents', control: 'MasterAgentsControl'},
		{href: '/clients', control: 'MasterClientsControl'},
		{href: '/shapes', control: 'TacticShapesControl'},
		{href: '/tactic', control: 'TacticViewControl', options: tacticConfig}
	]

	$$.viewController('body', {
		template: {gulp_inject: './app.html'},
		data: {routes}	
	})


})