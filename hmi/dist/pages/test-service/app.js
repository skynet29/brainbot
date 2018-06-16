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