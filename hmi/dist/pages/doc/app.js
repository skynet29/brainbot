$$.configReady(function() {


	var routes = [
		{href: '/', redirect: '/controls'},
		{href: '/controls', control: '$MainControl'},
		{href: '/services', control: '$ServicesControl'},
		{href: '/core', control: '$CoreControl'},
		{href: '/control/:name', control: '$DetailControl'}



	]


	$$.viewController('body', {
		template: "<div class=\"bn-flex-col bn-flex-1\">\r\n	<div class=\"w3-blue\" bn-control=\"NavbarControl\">\r\n	    <a href=\"#/controls\">Controls</a>\r\n	    <a href=\"#/services\">Services</a>\r\n	    <a href=\"#/core\">Core</a>\r\n	</div>\r\n\r\n	<div bn-control=\"RouterControl\" bn-data=\"routes: routes\" class=\"mainPanel bn-flex-1\"></div>\r\n</div>\r\n",
		data: {routes}	
	})

});
$$.registerControlEx('$CoreControl', {

	init: function(elt, options) {

		var ctrl = $$.viewController(elt, {
			template: "<div class=\"main bn-flex-1 bn-flex-col\">\r\n	<h3>Available Functions</h3>\r\n	<div class=\"scrollPanel\">\r\n		<ul bn-each=\"m of methods\">\r\n			<li bn-text=\"m\"></li>\r\n		</ul>		\r\n	</div>\r\n\r\n</div>",
			data: {
				methods: Object.keys($$).sort()
			}
		})
	}
});

$$.registerControlEx('$DetailControl', {

	init: function(elt, options) {

		var name = options.$params.name

		var info = $$.getControlInfo(name)
		//console.log('info', info)

		var ctrl = $$.viewController(elt, {
			template: "<div class=\"bn-flex-1 bn-flex-col\">\r\n	<div>\r\n		<button title=\"Back\" class=\"backBtn\" bn-event=\"click: onBack\"><i class=\"fa fa-2x fa-arrow-circle-left\"></i></button>\r\n		<h1 bn-text=\"name\"></h1>\r\n	</div>\r\n	<div class=\"scrollPanel\">\r\n		\r\n		<pre bn-text=\"detail\"></pre>		\r\n	</div>\r\n\r\n</div>",
			data: {
				name,
				detail: JSON.stringify(info, null, 4).replace(/\"/g, '')
			},
			events: {
				onBack: function() {
					history.back()
				}
			}
		})
	}
});
$$.registerControl('$MainControl', function(elt) {

	var ctrls = $$.getRegisteredControlsEx()
	var libs = []
	for(var k in ctrls) {
		libs.push({
			name: k, 
			ctrls: ctrls[k].map((name) => {
				return {name, url: '#/control/' + name}
			})
		})
	}
	//console.log('libs', libs)

	var ctrl = $$.viewController(elt, {
		template: "<div class=\"main bn-flex-1 bn-flex-col\">\r\n	<h3>Available Controls</h3>\r\n	<div class=\"scrollPanel\" style=\"padding: 10px\">\r\n		<div bn-each=\"l of libs\">\r\n			<div>\r\n				<p>Library <strong bn-text=\"l.name\"></strong></p>\r\n				<ul bn-each=\"c of l.ctrls\">\r\n					<li><a bn-attr=\"href: c.url\" bn-text=\"c.name\"></a></li>\r\n				</ul>\r\n				\r\n			</div>\r\n		</div>\r\n	</div>\r\n\r\n</div>",
		data: {
			libs
		}
	})

});
$$.registerControlEx('$ServicesControl', {

	init: function(elt, options) {
		var ctrl = $$.viewController(elt, {
			template: "<div class=\"main bn-flex-1 bn-flex-col\">\r\n	<h3>Available Services</h3>\r\n	<div class=\"scrollPanel\">\r\n		<ul bn-each=\"s of services\">\r\n			<li bn-text=\"s\"></li>\r\n		</ul>		\r\n	</div>\r\n\r\n</div>",
			data: {
				services: $$.getRegisteredServices().map((s) => s.name)
			}
		})
	}
});
