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
		template: "<div class=\"bn-flex-col bn-flex-1\">\r\n	<div class=\"w3-blue\" bn-control=\"NavbarControl\" data-active-color=\"w3-black\">\r\n	    <a href=\"#/agents\">Agents</a>\r\n	    <a href=\"#/clients\">Clients</a>\r\n	    <a href=\"#/shapes\">Shapes</a>\r\n	    <a href=\"#/tactic\">TacticView</a>\r\n	</div>\r\n\r\n	<div bn-control=\"RouterControl\" bn-data=\"routes: routes\" class=\"mainPanel bn-flex-1\"></div>\r\n</div>",
		data: {routes}	
	})


})