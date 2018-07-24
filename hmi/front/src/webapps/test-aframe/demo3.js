(function() {


	$$.registerControl('demo3Ctrl', function(elt) {

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './demo3.html'}
		})
	})

})();
