(function() {


	$$.registerControl('demo1Ctrl', function(elt) {


		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './demo1.html'},
			data: {
				sphereRotation: [0, 0, 0],
				boxPosition: [-1, 0, -3],
				realBoxPosition: function() {
					return this.boxPosition.join(' ')
				},
				realSphereRotation: function() {
					return this.sphereRotation.join(' ')
				}
			}

		})

	 

		var timer = setInterval(function() {
			ctrl.model.sphereRotation[1] = (ctrl.model.sphereRotation[1] + 10) % 360

			ctrl.model.boxPosition[1] = (ctrl.model.boxPosition[1] + 0.5) % 3

			ctrl.update('sphereRotation,boxPosition')
		}, 500)		

		return {
			dispose: function() {
				clearInterval(timer)
			},

			canChange : function() {
				console.log('[demo1Ctrl] canChange')

				return confirm('Are you sure you wish to leave ?')
			}
		}

	})
})();
