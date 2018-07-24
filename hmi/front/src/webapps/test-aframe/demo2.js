(function() {


	$$.registerControl('demo2Ctrl', function(elt) {

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './demo2.html'},
			events: {
				onClick: function(ev) {
					console.log('onClick', $(this).data('src'))
					ctrl.scope.sky.attr('src', $(this).data('src'))
				},
				onMouseEnter: function() {
					console.log('onMouseEnter')
					$(this).attr('scale', '1.2 1.2 1')
				},
				onMouseLeave: function() {
					console.log('onMouseLeave')
					$(this).attr('scale', '1 1 1')			
				}				
			}
		})

	})


})();
