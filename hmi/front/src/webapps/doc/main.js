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
		template: {gulp_inject: './main.html'},
		data: {
			libs
		}
	})

});