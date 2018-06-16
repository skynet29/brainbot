$$.configReady(function() {

	var ctrl = $$.viewController('body', {
		template: "<div class=\"bn-flex-1 bn-flex-col\">\r\n	<div bn-control=\"HtmlEditorControl\" bn-iface=\"editorCtrl\" class=\"bn-flex-1\"></div>\r\n	<div>\r\n		<button bn-event=\"click: onShowHtml\">Show HTML</button>	\r\n	</div>\r\n	\r\n</div>\r\n",
		events: {
			onShowHtml: function() {
				console.log('onShowHtml', ctrl.scope.editorCtrl.html())
			}
		}
	})
})