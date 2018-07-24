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
	console.log('libs', libs)

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvcmUuanMiLCJkZXRhaWwuanMiLCJtYWluLmpzIiwic2VydmljZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQuY29uZmlnUmVhZHkoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHR2YXIgcm91dGVzID0gW1xyXG5cdFx0e2hyZWY6ICcvJywgcmVkaXJlY3Q6ICcvY29udHJvbHMnfSxcclxuXHRcdHtocmVmOiAnL2NvbnRyb2xzJywgY29udHJvbDogJyRNYWluQ29udHJvbCd9LFxyXG5cdFx0e2hyZWY6ICcvc2VydmljZXMnLCBjb250cm9sOiAnJFNlcnZpY2VzQ29udHJvbCd9LFxyXG5cdFx0e2hyZWY6ICcvY29yZScsIGNvbnRyb2w6ICckQ29yZUNvbnRyb2wnfSxcclxuXHRcdHtocmVmOiAnL2NvbnRyb2wvOm5hbWUnLCBjb250cm9sOiAnJERldGFpbENvbnRyb2wnfVxyXG5cclxuXHJcblxyXG5cdF1cclxuXHJcblxyXG5cdCQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xyXG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInczLWJsdWVcXFwiIGJuLWNvbnRyb2w9XFxcIk5hdmJhckNvbnRyb2xcXFwiPlxcclxcblx0ICAgIDxhIGhyZWY9XFxcIiMvY29udHJvbHNcXFwiPkNvbnRyb2xzPC9hPlxcclxcblx0ICAgIDxhIGhyZWY9XFxcIiMvc2VydmljZXNcXFwiPlNlcnZpY2VzPC9hPlxcclxcblx0ICAgIDxhIGhyZWY9XFxcIiMvY29yZVxcXCI+Q29yZTwvYT5cXHJcXG5cdDwvZGl2Plxcclxcblxcclxcblx0PGRpdiBibi1jb250cm9sPVxcXCJSb3V0ZXJDb250cm9sXFxcIiBibi1kYXRhPVxcXCJyb3V0ZXM6IHJvdXRlc1xcXCIgY2xhc3M9XFxcIm1haW5QYW5lbCBibi1mbGV4LTFcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiLFxyXG5cdFx0ZGF0YToge3JvdXRlc31cdFxyXG5cdH0pXHJcblxyXG59KTsiLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnJENvcmVDb250cm9sJywge1xyXG5cclxuXHRpbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJtYWluIGJuLWZsZXgtMSBibi1mbGV4LWNvbFxcXCI+XFxyXFxuXHQ8aDM+QXZhaWxhYmxlIEZ1bmN0aW9uczwvaDM+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxyXFxuXHRcdDx1bCBibi1lYWNoPVxcXCJtIG9mIG1ldGhvZHNcXFwiPlxcclxcblx0XHRcdDxsaSBibi10ZXh0PVxcXCJtXFxcIj48L2xpPlxcclxcblx0XHQ8L3VsPlx0XHRcXHJcXG5cdDwvZGl2PlxcclxcblxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0bWV0aG9kczogT2JqZWN0LmtleXMoJCQpLnNvcnQoKVxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cdH1cclxufSk7XHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCckRGV0YWlsQ29udHJvbCcsIHtcclxuXHJcblx0aW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0dmFyIG5hbWUgPSBvcHRpb25zLiRwYXJhbXMubmFtZVxyXG5cclxuXHRcdHZhciBpbmZvID0gJCQuZ2V0Q29udHJvbEluZm8obmFtZSlcclxuXHRcdC8vY29uc29sZS5sb2coJ2luZm8nLCBpbmZvKVxyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LWNvbFxcXCI+XFxyXFxuXHQ8ZGl2Plxcclxcblx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJCYWNrXFxcIiBjbGFzcz1cXFwiYmFja0J0blxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkJhY2tcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1hcnJvdy1jaXJjbGUtbGVmdFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8aDEgYm4tdGV4dD1cXFwibmFtZVxcXCI+PC9oMT5cXHJcXG5cdDwvZGl2Plxcclxcblx0PGRpdiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcclxcblx0XHRcXHJcXG5cdFx0PHByZSBibi10ZXh0PVxcXCJkZXRhaWxcXFwiPjwvcHJlPlx0XHRcXHJcXG5cdDwvZGl2PlxcclxcblxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0bmFtZSxcclxuXHRcdFx0XHRkZXRhaWw6IEpTT04uc3RyaW5naWZ5KGluZm8sIG51bGwsIDQpLnJlcGxhY2UoL1xcXCIvZywgJycpXHJcblx0XHRcdH0sXHJcblx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdG9uQmFjazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRoaXN0b3J5LmJhY2soKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHR9XHJcbn0pOyIsIiQkLnJlZ2lzdGVyQ29udHJvbCgnJE1haW5Db250cm9sJywgZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdHZhciBjdHJscyA9ICQkLmdldFJlZ2lzdGVyZWRDb250cm9sc0V4KClcclxuXHR2YXIgbGlicyA9IFtdXHJcblx0Zm9yKHZhciBrIGluIGN0cmxzKSB7XHJcblx0XHRsaWJzLnB1c2goe1xyXG5cdFx0XHRuYW1lOiBrLCBcclxuXHRcdFx0Y3RybHM6IGN0cmxzW2tdLm1hcCgobmFtZSkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiB7bmFtZSwgdXJsOiAnIy9jb250cm9sLycgKyBuYW1lfVxyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblx0Y29uc29sZS5sb2coJ2xpYnMnLCBsaWJzKVxyXG5cclxuXHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwibWFpbiBibi1mbGV4LTEgYm4tZmxleC1jb2xcXFwiPlxcclxcblx0PGgzPkF2YWlsYWJsZSBDb250cm9sczwvaDM+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCIgc3R5bGU9XFxcInBhZGRpbmc6IDEwcHhcXFwiPlxcclxcblx0XHQ8ZGl2IGJuLWVhY2g9XFxcImwgb2YgbGlic1xcXCI+XFxyXFxuXHRcdFx0PGRpdj5cXHJcXG5cdFx0XHRcdDxwPkxpYnJhcnkgPHN0cm9uZyBibi10ZXh0PVxcXCJsLm5hbWVcXFwiPjwvc3Ryb25nPjwvcD5cXHJcXG5cdFx0XHRcdDx1bCBibi1lYWNoPVxcXCJjIG9mIGwuY3RybHNcXFwiPlxcclxcblx0XHRcdFx0XHQ8bGk+PGEgYm4tYXR0cj1cXFwiaHJlZjogYy51cmxcXFwiIGJuLXRleHQ9XFxcImMubmFtZVxcXCI+PC9hPjwvbGk+XFxyXFxuXHRcdFx0XHQ8L3VsPlxcclxcblx0XHRcdFx0XFxyXFxuXHRcdFx0PC9kaXY+XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuPC9kaXY+XCIsXHJcblx0XHRkYXRhOiB7XHJcblx0XHRcdGxpYnNcclxuXHRcdH1cclxuXHR9KVxyXG5cclxufSk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJyRTZXJ2aWNlc0NvbnRyb2wnLCB7XHJcblxyXG5cdGluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwibWFpbiBibi1mbGV4LTEgYm4tZmxleC1jb2xcXFwiPlxcclxcblx0PGgzPkF2YWlsYWJsZSBTZXJ2aWNlczwvaDM+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxyXFxuXHRcdDx1bCBibi1lYWNoPVxcXCJzIG9mIHNlcnZpY2VzXFxcIj5cXHJcXG5cdFx0XHQ8bGkgYm4tdGV4dD1cXFwic1xcXCI+PC9saT5cXHJcXG5cdFx0PC91bD5cdFx0XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdHNlcnZpY2VzOiAkJC5nZXRSZWdpc3RlcmVkU2VydmljZXMoKS5tYXAoKHMpID0+IHMubmFtZSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHR9XHJcbn0pO1xyXG4iXX0=
