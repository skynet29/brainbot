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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuXHR2YXIgdGFjdGljQ29uZmlnID0ge1xyXG5cdFx0XCJtYXBcIjoge1xyXG5cdFx0XHRcImF0dHJpYnV0aW9uQ29udHJvbFwiOiBmYWxzZSxcclxuXHRcdFx0XCJ6b29tQ29udHJvbFwiOiB0cnVlLFxyXG5cdFx0XHRcImNlbnRlclwiOiBbNDguMzU4MywgLTQuNTM0MTddLFxyXG5cdFx0XHRcInpvb21cIjogMTNcdFx0XHJcblx0XHR9LFxyXG5cclxuXHRcdFwidGlsZUxheWVyXCI6IHtcclxuXHRcdFx0XCJtYXhab29tXCI6IDE5LFxyXG5cdFx0XHRcInVybFRlbXBsYXRlXCI6IFwiaHR0cDovL3tzfS50aWxlLm9zbS5vcmcve3p9L3t4fS97eX0ucG5nXCJcclxuXHRcdH0sXHJcblxyXG5cdFx0XCJjb250cm9sc1wiOiB7XHJcblxyXG5cdFx0XHRcImxheWVyc1wiOiB7XHJcblx0XHRcdFx0XCJtaXNzaW9uXCI6IHtcImxhYmVsXCI6IFwiTWlzc2lvblwiLCBcInZpc2libGVcIjogdHJ1ZX0sXHJcblx0XHRcdFx0XCJkZWZhdWx0XCI6IHtcImxhYmVsXCI6IFwiRGVmYXVsdFwiLCBcInZpc2libGVcIjogdHJ1ZX0sXHJcblx0XHRcdFx0XCJ2ZWhpY3VsZVwiOiB7XCJsYWJlbFwiOiBcIlZlaGljdWxlXCIsIFwidmlzaWJsZVwiOiB0cnVlfVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRcclxuXHRcdH0sXHRcdFxyXG5cclxuXHRcdFwicGx1Z2luc1wiOiB7XHJcblxyXG5cdFx0XHRcIlNoYXBlRGVjb2RlclwiOiB7fVxyXG5cdFx0fVx0XHRcclxuXHR9XHRcclxuXHJcblx0dmFyIHJvdXRlcyA9IFtcclxuXHRcdHtocmVmOiAnLycsIHJlZGlyZWN0OiAnL2FnZW50cyd9LFxyXG5cdFx0e2hyZWY6ICcvYWdlbnRzJywgY29udHJvbDogJ01hc3RlckFnZW50c0NvbnRyb2wnfSxcclxuXHRcdHtocmVmOiAnL2NsaWVudHMnLCBjb250cm9sOiAnTWFzdGVyQ2xpZW50c0NvbnRyb2wnfSxcclxuXHRcdHtocmVmOiAnL3NoYXBlcycsIGNvbnRyb2w6ICdUYWN0aWNTaGFwZXNDb250cm9sJ30sXHJcblx0XHR7aHJlZjogJy90YWN0aWMnLCBjb250cm9sOiAnVGFjdGljVmlld0NvbnRyb2wnLCBvcHRpb25zOiB0YWN0aWNDb25maWd9XHJcblx0XVxyXG5cclxuXHQkJC52aWV3Q29udHJvbGxlcignYm9keScsIHtcclxuXHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJ3My1ibHVlXFxcIiBibi1jb250cm9sPVxcXCJOYXZiYXJDb250cm9sXFxcIiBkYXRhLWFjdGl2ZS1jb2xvcj1cXFwidzMtYmxhY2tcXFwiPlxcclxcblx0ICAgIDxhIGhyZWY9XFxcIiMvYWdlbnRzXFxcIj5BZ2VudHM8L2E+XFxyXFxuXHQgICAgPGEgaHJlZj1cXFwiIy9jbGllbnRzXFxcIj5DbGllbnRzPC9hPlxcclxcblx0ICAgIDxhIGhyZWY9XFxcIiMvc2hhcGVzXFxcIj5TaGFwZXM8L2E+XFxyXFxuXHQgICAgPGEgaHJlZj1cXFwiIy90YWN0aWNcXFwiPlRhY3RpY1ZpZXc8L2E+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiUm91dGVyQ29udHJvbFxcXCIgYm4tZGF0YT1cXFwicm91dGVzOiByb3V0ZXNcXFwiIGNsYXNzPVxcXCJtYWluUGFuZWwgYm4tZmxleC0xXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cIixcclxuXHRcdGRhdGE6IHtyb3V0ZXN9XHRcclxuXHR9KVxyXG5cclxuXHJcbn0pIl19
