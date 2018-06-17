$$.configReady(function(config) {

	$$.startApp('MainControl')

})
$$.registerControl('MainControl', ['WebSocketService'], function(elt, client) {

	var ctrl = $$.viewController(elt, {
		template: "<div id=\"main\">\r\n	<form bn-event=\"submit: onCompute\">\r\n		<input type=\"number\" placeholder=\"nombre 1\" name=\"a\" required=\"\">\r\n		&nbsp;+&nbsp;\r\n		<input type=\"number\" placeholder=\"nombre 2\" name=\"b\" required=\"\">\r\n		&nbsp;=&nbsp;\r\n		<input type=\"text\" placeholder=\"resultat\" readonly=\"\" bn-val=\"result\">\r\n		<button type=\"submit\">Compute</button>\r\n	</form>\r\n	<p bn-text=\"message\"></p>\r\n\r\n</div>",
		data: {
			message: ''
		},
		events: {
			onCompute: function(ev) {
				ev.preventDefault()
				var data = $(this).getFormData()
				console.log('data', data)
				client.callService('sum', data).then(function(result) {
					ctrl.setData({result, message: ''})
				})
				.catch(function(err) {
					ctrl.setData('message', err.message)
				})
			}
		}
	})
})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuXHQkJC5zdGFydEFwcCgnTWFpbkNvbnRyb2wnKVxyXG5cclxufSkiLCIkJC5yZWdpc3RlckNvbnRyb2woJ01haW5Db250cm9sJywgWydXZWJTb2NrZXRTZXJ2aWNlJ10sIGZ1bmN0aW9uKGVsdCwgY2xpZW50KSB7XHJcblxyXG5cdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGlkPVxcXCJtYWluXFxcIj5cXHJcXG5cdDxmb3JtIGJuLWV2ZW50PVxcXCJzdWJtaXQ6IG9uQ29tcHV0ZVxcXCI+XFxyXFxuXHRcdDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHBsYWNlaG9sZGVyPVxcXCJub21icmUgMVxcXCIgbmFtZT1cXFwiYVxcXCIgcmVxdWlyZWQ9XFxcIlxcXCI+XFxyXFxuXHRcdCZuYnNwOysmbmJzcDtcXHJcXG5cdFx0PGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgcGxhY2Vob2xkZXI9XFxcIm5vbWJyZSAyXFxcIiBuYW1lPVxcXCJiXFxcIiByZXF1aXJlZD1cXFwiXFxcIj5cXHJcXG5cdFx0Jm5ic3A7PSZuYnNwO1xcclxcblx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcInJlc3VsdGF0XFxcIiByZWFkb25seT1cXFwiXFxcIiBibi12YWw9XFxcInJlc3VsdFxcXCI+XFxyXFxuXHRcdDxidXR0b24gdHlwZT1cXFwic3VibWl0XFxcIj5Db21wdXRlPC9idXR0b24+XFxyXFxuXHQ8L2Zvcm0+XFxyXFxuXHQ8cCBibi10ZXh0PVxcXCJtZXNzYWdlXFxcIj48L3A+XFxyXFxuXFxyXFxuPC9kaXY+XCIsXHJcblx0XHRkYXRhOiB7XHJcblx0XHRcdG1lc3NhZ2U6ICcnXHJcblx0XHR9LFxyXG5cdFx0ZXZlbnRzOiB7XHJcblx0XHRcdG9uQ29tcHV0ZTogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRcdFx0dmFyIGRhdGEgPSAkKHRoaXMpLmdldEZvcm1EYXRhKClcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXHJcblx0XHRcdFx0Y2xpZW50LmNhbGxTZXJ2aWNlKCdzdW0nLCBkYXRhKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtyZXN1bHQsIG1lc3NhZ2U6ICcnfSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHRcdC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSgnbWVzc2FnZScsIGVyci5tZXNzYWdlKVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG59KSJdfQ==
