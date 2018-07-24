$$.configReady(function() {

	var ctrl = $$.viewController('body', {
		template: {gulp_inject: './app.html'},
		events: {
			onShowHtml: function() {
				console.log('onShowHtml', ctrl.scope.editorCtrl.html())
			}
		}
	})
})