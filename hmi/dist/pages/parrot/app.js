$$.configReady(function() {

	$$.startApp('MainControl')
}) 
$$.registerControl('MainControl', ['WebSocketService'], function(elt, client) {

	var curAction = 0

 	const gamepadMap = {
 		axes: {
 			'0': {
 				left: {max: -0.6},
 				right: {min: 0.6}
 			},
 			'1': {
 				back: {min: 0.5},
 				front: {max: -0.5}
 			}
 		},
 		buttons: {
 			'4': 'clockwise',
 			'3': 'counterClockwise',
 			'5': 'up',
 			'6': 'down',
 			'1': 'land',
 			'0': 'photo'
 		}

 	}

 	const actionMasks = {
 		'left': 1,
 		'right': 2,
 		'back': 4,
 		'front': 8,
 		'clockwise': 16,
 		'counterClockwise': 32,
 		'up': 64,
 		'down': 128,
 		'land': 256


 	}



	const ctrl = window.app = $$.viewController(elt, {
		template: "<div>\r\n	<div class=\"panel1\">\r\n		\r\n		<div bn-control=\"ToolbarControl\" bn-event=\"click.cmd: onCmd\">\r\n			<button class=\"cmd\" data-cmd=\"takeoff\">Take Off</button>\r\n			<button class=\"cmd\" data-cmd=\"land\" bn-show=\"!gamepadDetected\">Land</button>		\r\n			<button class=\"cmd\" data-cmd=\"disableEmergency\">Recover</button>\r\n		</div>\r\n\r\n\r\n\r\n		<div>\r\n			<div>\r\n				Battery: <span bn-text=\"battery\"></span>%\r\n			</div>\r\n				\r\n			<div>\r\n				Control State: <span bn-text=\"controlState\"></span>\r\n			</div>\r\n				\r\n			<div>\r\n				Fly State: <span bn-text=\"flyState\"></span>\r\n			</div>			\r\n			<div>\r\n				Action: <span bn-text=\"curAction\"></span>\r\n			</div>	\r\n			<div>\r\n				Wait Landing: <span bn-text=\"waitLanding\"></span>\r\n			</div>	\r\n		</div>\r\n\r\n		<div bn-each=\"v of axes\" bn-show=\"gamepadDetected\">\r\n			<div>\r\n				Axe : <span bn-text=\"v\"></span>\r\n			</div>\r\n				\r\n		</div>\r\n	</div>\r\n\r\n		<div bn-control=\"ToolbarControl\" bn-event=\"mousedown.cmd: onSpeedCmd, mouseup.cmd: onStop\" bn-show=\"!gamepadDetected\">\r\n			<button class=\"cmd\" data-cmd=\"front\">Front</button>\r\n			<button class=\"cmd\" data-cmd=\"back\">Back</button>\r\n			<button class=\"cmd\" data-cmd=\"left\">Left</button>\r\n			<button class=\"cmd\" data-cmd=\"right\">Right</button>\r\n			<button class=\"cmd\" data-cmd=\"up\">Up</button>\r\n			<button class=\"cmd\" data-cmd=\"down\">Down</button>\r\n			<button class=\"cmd\" data-cmd=\"clockwise\">Clockwise</button>\r\n			<button class=\"cmd\" data-cmd=\"counterClockwise\">Counter Clockwise</button>\r\n			\r\n		</div>\r\n\r\n	<div class=\"panel2\">\r\n			\r\n			<div bn-control=\"FlightPanelControl\" bn-data=\"roll: roll, pitch: pitch, altitude: altitude\"></div>	\r\n\r\n			<img bn-attr=\"src: imgUrl\">\r\n			<div bn-bind=\"dronestream\"></div>\r\n	\r\n			\r\n			\r\n	</div>\r\n\r\n</div>",
		data: {
			roll: 0,
			pitch: 0,
			altitude: 0,
			battery: 0,
			controlState: 'Unknown',
			flyState: 'Unknown',
			axes: [],
			gamepadDetected: false,
			curAction,
			imgUrl: '',
			waitLanding: false
		},
		events: {
			onCmd: function() {
				//client.emit('parrotCmd', {cmd: 'takeOff'})
				const cmd = $(this).data('cmd')
				console.log('cmd', cmd)
				client.emit('parrotCmd', {cmd})
			},
			onSpeedCmd: function() {
				//client.emit('parrotCmd', {cmd: 'takeOff'})
				const cmd = $(this).data('cmd')
				console.log('cmd', cmd)
				setAction(actionMasks[cmd])

			},
			onStop: function() {
				setAction(0)
			}
			
		}
	})

	var videoStream = new NodecopterStream(
		ctrl.scope.dronestream.get(0),
		{port: 3001}
		)

	var waitLanding = false


	function setAction(action) {
		console.log('setAction', action)
		curAction = action



		var cmds = {}
		for(var k in actionMasks) {
			if (action & actionMasks[k]) {
				cmds[k] = 0.3
			}
		}
		console.log('cmds', cmds)
		ctrl.setData({curAction: Object.keys(cmds).toString()})

		if (ctrl.model.waitLanding) {
			return
		}

		if (action == 0) {
			client.emit('parrotCmd', {cmd: 'stop'})
		}

		else if (cmds.land) {
			client.emit('parrotCmd', {cmd: 'land'})
			ctrl.setData({waitLanding: true})
		}
		else if (Object.keys(cmds).length > 0) {
			client.emit('parrotCmd', {cmd: 'move', move: cmds})
		}


		
	}



	client.register('parrotNavData', false, function(msg) {
		//console.log('parrotNavData', msg.data)
		const data = msg.data

		if (data.demo) {
			//console.log('demo', data.demo)
			const demo = data.demo
			ctrl.setData({
				altitude: demo.altitudeMeters,
				battery: demo.batteryPercentage,
				roll: -demo.rotation.roll,
				pitch: demo.rotation.pitch,
				controlState: demo.controlState,
				flyState: demo.flyState

			})
			if (ctrl.model.waitLanding) {
				if (ctrl.model.controlState == 'CTRL_LANDED') {
	
					ctrl.setData({waitLanding: false})
				}
			}		


		}
	})




	function checkGamePadStatus() {
		//console.log('checkGamePadStatus')
		var gamepad = navigator.getGamepads()[0]
		if (gamepad) {
			//console.log('gamepad', gamepad)
			var action = 0
				
			const buttons = gamepad.buttons
			for(var i = 0; i < buttons.length; i++) {
				var val = buttons[i].pressed
				if (val === true) {
					var entry = gamepadMap.buttons[i]
					if (typeof entry == 'string') {
						action |= actionMasks[entry]
					}					
				}

			}

			const axes = gamepad.axes
			ctrl.setData({
				axes: fixAxes(axes)
			})
			for(var i = 0; i < axes.length; i++) {
				var val = axes[i]
				var entry = gamepadMap.axes[i]
				if (entry) {
					for(var k in entry) {
						var desc = entry[k]
						if (typeof desc.min == "number") {
							if (val > desc.min) {
								action |= actionMasks[k]
							}
						}
						if (typeof desc.max == "number") {
							if (val < desc.max) {
								action |= actionMasks[k]
							}
						}
					}
				}
			}				
			
			
			if (action != curAction) {
				setAction(action)			
			}

			requestAnimationFrame(checkGamePadStatus)			
		}

		
	}

	function fixAxes(axes) {
		return axes.map((v) => v.toFixed(2))
	}

	window.addEventListener("gamepadconnected", function(e) {
		console.log("Contrôleur n°%d connecté : %s. %d boutons, %d axes.",
  			e.gamepad.index, e.gamepad.id,
  			e.gamepad.buttons.length, e.gamepad.axes.length);


		const axes = e.gamepad.axes
		ctrl.setData({gamepadDetected: true, axes: fixAxes(axes)})	
	

		requestAnimationFrame(checkGamePadStatus)

	});
	window.addEventListener("gamepaddisconnected", function(e) {
		console.log('gamepaddisconnected')
		ctrl.setData({gamepadDetected: false})	
	});

}) 
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5zdGFydEFwcCgnTWFpbkNvbnRyb2wnKVxyXG59KSAiLCIkJC5yZWdpc3RlckNvbnRyb2woJ01haW5Db250cm9sJywgWydXZWJTb2NrZXRTZXJ2aWNlJ10sIGZ1bmN0aW9uKGVsdCwgY2xpZW50KSB7XHJcblxyXG5cdHZhciBjdXJBY3Rpb24gPSAwXHJcblxyXG4gXHRjb25zdCBnYW1lcGFkTWFwID0ge1xyXG4gXHRcdGF4ZXM6IHtcclxuIFx0XHRcdCcwJzoge1xyXG4gXHRcdFx0XHRsZWZ0OiB7bWF4OiAtMC42fSxcclxuIFx0XHRcdFx0cmlnaHQ6IHttaW46IDAuNn1cclxuIFx0XHRcdH0sXHJcbiBcdFx0XHQnMSc6IHtcclxuIFx0XHRcdFx0YmFjazoge21pbjogMC41fSxcclxuIFx0XHRcdFx0ZnJvbnQ6IHttYXg6IC0wLjV9XHJcbiBcdFx0XHR9XHJcbiBcdFx0fSxcclxuIFx0XHRidXR0b25zOiB7XHJcbiBcdFx0XHQnNCc6ICdjbG9ja3dpc2UnLFxyXG4gXHRcdFx0JzMnOiAnY291bnRlckNsb2Nrd2lzZScsXHJcbiBcdFx0XHQnNSc6ICd1cCcsXHJcbiBcdFx0XHQnNic6ICdkb3duJyxcclxuIFx0XHRcdCcxJzogJ2xhbmQnLFxyXG4gXHRcdFx0JzAnOiAncGhvdG8nXHJcbiBcdFx0fVxyXG5cclxuIFx0fVxyXG5cclxuIFx0Y29uc3QgYWN0aW9uTWFza3MgPSB7XHJcbiBcdFx0J2xlZnQnOiAxLFxyXG4gXHRcdCdyaWdodCc6IDIsXHJcbiBcdFx0J2JhY2snOiA0LFxyXG4gXHRcdCdmcm9udCc6IDgsXHJcbiBcdFx0J2Nsb2Nrd2lzZSc6IDE2LFxyXG4gXHRcdCdjb3VudGVyQ2xvY2t3aXNlJzogMzIsXHJcbiBcdFx0J3VwJzogNjQsXHJcbiBcdFx0J2Rvd24nOiAxMjgsXHJcbiBcdFx0J2xhbmQnOiAyNTZcclxuXHJcblxyXG4gXHR9XHJcblxyXG5cclxuXHJcblx0Y29uc3QgY3RybCA9IHdpbmRvdy5hcHAgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdHRlbXBsYXRlOiBcIjxkaXY+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJwYW5lbDFcXFwiPlxcclxcblx0XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLmNtZDogb25DbWRcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcInRha2VvZmZcXFwiPlRha2UgT2ZmPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwibGFuZFxcXCIgYm4tc2hvdz1cXFwiIWdhbWVwYWREZXRlY3RlZFxcXCI+TGFuZDwvYnV0dG9uPlx0XHRcXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJkaXNhYmxlRW1lcmdlbmN5XFxcIj5SZWNvdmVyPC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plxcclxcblxcclxcblxcclxcblxcclxcblx0XHQ8ZGl2Plxcclxcblx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRCYXR0ZXJ5OiA8c3BhbiBibi10ZXh0PVxcXCJiYXR0ZXJ5XFxcIj48L3NwYW4+JVxcclxcblx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XFxyXFxuXHRcdFx0PGRpdj5cXHJcXG5cdFx0XHRcdENvbnRyb2wgU3RhdGU6IDxzcGFuIGJuLXRleHQ9XFxcImNvbnRyb2xTdGF0ZVxcXCI+PC9zcGFuPlxcclxcblx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XFxyXFxuXHRcdFx0PGRpdj5cXHJcXG5cdFx0XHRcdEZseSBTdGF0ZTogPHNwYW4gYm4tdGV4dD1cXFwiZmx5U3RhdGVcXFwiPjwvc3Bhbj5cXHJcXG5cdFx0XHQ8L2Rpdj5cdFx0XHRcXHJcXG5cdFx0XHQ8ZGl2Plxcclxcblx0XHRcdFx0QWN0aW9uOiA8c3BhbiBibi10ZXh0PVxcXCJjdXJBY3Rpb25cXFwiPjwvc3Bhbj5cXHJcXG5cdFx0XHQ8L2Rpdj5cdFxcclxcblx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRXYWl0IExhbmRpbmc6IDxzcGFuIGJuLXRleHQ9XFxcIndhaXRMYW5kaW5nXFxcIj48L3NwYW4+XFxyXFxuXHRcdFx0PC9kaXY+XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHRcdDxkaXYgYm4tZWFjaD1cXFwidiBvZiBheGVzXFxcIiBibi1zaG93PVxcXCJnYW1lcGFkRGV0ZWN0ZWRcXFwiPlxcclxcblx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRBeGUgOiA8c3BhbiBibi10ZXh0PVxcXCJ2XFxcIj48L3NwYW4+XFxyXFxuXHRcdFx0PC9kaXY+XFxyXFxuXHRcdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCIgYm4tZXZlbnQ9XFxcIm1vdXNlZG93bi5jbWQ6IG9uU3BlZWRDbWQsIG1vdXNldXAuY21kOiBvblN0b3BcXFwiIGJuLXNob3c9XFxcIiFnYW1lcGFkRGV0ZWN0ZWRcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZyb250XFxcIj5Gcm9udDwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImJhY2tcXFwiPkJhY2s8L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJsZWZ0XFxcIj5MZWZ0PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwicmlnaHRcXFwiPlJpZ2h0PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwidXBcXFwiPlVwPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZG93blxcXCI+RG93bjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImNsb2Nrd2lzZVxcXCI+Q2xvY2t3aXNlPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiY291bnRlckNsb2Nrd2lzZVxcXCI+Q291bnRlciBDbG9ja3dpc2U8L2J1dHRvbj5cXHJcXG5cdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJwYW5lbDJcXFwiPlxcclxcblx0XHRcdFxcclxcblx0XHRcdDxkaXYgYm4tY29udHJvbD1cXFwiRmxpZ2h0UGFuZWxDb250cm9sXFxcIiBibi1kYXRhPVxcXCJyb2xsOiByb2xsLCBwaXRjaDogcGl0Y2gsIGFsdGl0dWRlOiBhbHRpdHVkZVxcXCI+PC9kaXY+XHRcXHJcXG5cXHJcXG5cdFx0XHQ8aW1nIGJuLWF0dHI9XFxcInNyYzogaW1nVXJsXFxcIj5cXHJcXG5cdFx0XHQ8ZGl2IGJuLWJpbmQ9XFxcImRyb25lc3RyZWFtXFxcIj48L2Rpdj5cXHJcXG5cdFxcclxcblx0XHRcdFxcclxcblx0XHRcdFxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuPC9kaXY+XCIsXHJcblx0XHRkYXRhOiB7XHJcblx0XHRcdHJvbGw6IDAsXHJcblx0XHRcdHBpdGNoOiAwLFxyXG5cdFx0XHRhbHRpdHVkZTogMCxcclxuXHRcdFx0YmF0dGVyeTogMCxcclxuXHRcdFx0Y29udHJvbFN0YXRlOiAnVW5rbm93bicsXHJcblx0XHRcdGZseVN0YXRlOiAnVW5rbm93bicsXHJcblx0XHRcdGF4ZXM6IFtdLFxyXG5cdFx0XHRnYW1lcGFkRGV0ZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRjdXJBY3Rpb24sXHJcblx0XHRcdGltZ1VybDogJycsXHJcblx0XHRcdHdhaXRMYW5kaW5nOiBmYWxzZVxyXG5cdFx0fSxcclxuXHRcdGV2ZW50czoge1xyXG5cdFx0XHRvbkNtZDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Ly9jbGllbnQuZW1pdCgncGFycm90Q21kJywge2NtZDogJ3Rha2VPZmYnfSlcclxuXHRcdFx0XHRjb25zdCBjbWQgPSAkKHRoaXMpLmRhdGEoJ2NtZCcpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ2NtZCcsIGNtZClcclxuXHRcdFx0XHRjbGllbnQuZW1pdCgncGFycm90Q21kJywge2NtZH0pXHJcblx0XHRcdH0sXHJcblx0XHRcdG9uU3BlZWRDbWQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdC8vY2xpZW50LmVtaXQoJ3BhcnJvdENtZCcsIHtjbWQ6ICd0YWtlT2ZmJ30pXHJcblx0XHRcdFx0Y29uc3QgY21kID0gJCh0aGlzKS5kYXRhKCdjbWQnKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdjbWQnLCBjbWQpXHJcblx0XHRcdFx0c2V0QWN0aW9uKGFjdGlvbk1hc2tzW2NtZF0pXHJcblxyXG5cdFx0XHR9LFxyXG5cdFx0XHRvblN0b3A6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHNldEFjdGlvbigwKVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG5cdHZhciB2aWRlb1N0cmVhbSA9IG5ldyBOb2RlY29wdGVyU3RyZWFtKFxyXG5cdFx0Y3RybC5zY29wZS5kcm9uZXN0cmVhbS5nZXQoMCksXHJcblx0XHR7cG9ydDogMzAwMX1cclxuXHRcdClcclxuXHJcblx0dmFyIHdhaXRMYW5kaW5nID0gZmFsc2VcclxuXHJcblxyXG5cdGZ1bmN0aW9uIHNldEFjdGlvbihhY3Rpb24pIHtcclxuXHRcdGNvbnNvbGUubG9nKCdzZXRBY3Rpb24nLCBhY3Rpb24pXHJcblx0XHRjdXJBY3Rpb24gPSBhY3Rpb25cclxuXHJcblxyXG5cclxuXHRcdHZhciBjbWRzID0ge31cclxuXHRcdGZvcih2YXIgayBpbiBhY3Rpb25NYXNrcykge1xyXG5cdFx0XHRpZiAoYWN0aW9uICYgYWN0aW9uTWFza3Nba10pIHtcclxuXHRcdFx0XHRjbWRzW2tdID0gMC4zXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGNvbnNvbGUubG9nKCdjbWRzJywgY21kcylcclxuXHRcdGN0cmwuc2V0RGF0YSh7Y3VyQWN0aW9uOiBPYmplY3Qua2V5cyhjbWRzKS50b1N0cmluZygpfSlcclxuXHJcblx0XHRpZiAoY3RybC5tb2RlbC53YWl0TGFuZGluZykge1xyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoYWN0aW9uID09IDApIHtcclxuXHRcdFx0Y2xpZW50LmVtaXQoJ3BhcnJvdENtZCcsIHtjbWQ6ICdzdG9wJ30pXHJcblx0XHR9XHJcblxyXG5cdFx0ZWxzZSBpZiAoY21kcy5sYW5kKSB7XHJcblx0XHRcdGNsaWVudC5lbWl0KCdwYXJyb3RDbWQnLCB7Y21kOiAnbGFuZCd9KVxyXG5cdFx0XHRjdHJsLnNldERhdGEoe3dhaXRMYW5kaW5nOiB0cnVlfSlcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKE9iamVjdC5rZXlzKGNtZHMpLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0Y2xpZW50LmVtaXQoJ3BhcnJvdENtZCcsIHtjbWQ6ICdtb3ZlJywgbW92ZTogY21kc30pXHJcblx0XHR9XHJcblxyXG5cclxuXHRcdFxyXG5cdH1cclxuXHJcblxyXG5cclxuXHRjbGllbnQucmVnaXN0ZXIoJ3BhcnJvdE5hdkRhdGEnLCBmYWxzZSwgZnVuY3Rpb24obXNnKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdwYXJyb3ROYXZEYXRhJywgbXNnLmRhdGEpXHJcblx0XHRjb25zdCBkYXRhID0gbXNnLmRhdGFcclxuXHJcblx0XHRpZiAoZGF0YS5kZW1vKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2RlbW8nLCBkYXRhLmRlbW8pXHJcblx0XHRcdGNvbnN0IGRlbW8gPSBkYXRhLmRlbW9cclxuXHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRhbHRpdHVkZTogZGVtby5hbHRpdHVkZU1ldGVycyxcclxuXHRcdFx0XHRiYXR0ZXJ5OiBkZW1vLmJhdHRlcnlQZXJjZW50YWdlLFxyXG5cdFx0XHRcdHJvbGw6IC1kZW1vLnJvdGF0aW9uLnJvbGwsXHJcblx0XHRcdFx0cGl0Y2g6IGRlbW8ucm90YXRpb24ucGl0Y2gsXHJcblx0XHRcdFx0Y29udHJvbFN0YXRlOiBkZW1vLmNvbnRyb2xTdGF0ZSxcclxuXHRcdFx0XHRmbHlTdGF0ZTogZGVtby5mbHlTdGF0ZVxyXG5cclxuXHRcdFx0fSlcclxuXHRcdFx0aWYgKGN0cmwubW9kZWwud2FpdExhbmRpbmcpIHtcclxuXHRcdFx0XHRpZiAoY3RybC5tb2RlbC5jb250cm9sU3RhdGUgPT0gJ0NUUkxfTEFOREVEJykge1xyXG5cdFxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHt3YWl0TGFuZGluZzogZmFsc2V9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVx0XHRcclxuXHJcblxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG5cclxuXHJcblxyXG5cdGZ1bmN0aW9uIGNoZWNrR2FtZVBhZFN0YXR1cygpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ2NoZWNrR2FtZVBhZFN0YXR1cycpXHJcblx0XHR2YXIgZ2FtZXBhZCA9IG5hdmlnYXRvci5nZXRHYW1lcGFkcygpWzBdXHJcblx0XHRpZiAoZ2FtZXBhZCkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdnYW1lcGFkJywgZ2FtZXBhZClcclxuXHRcdFx0dmFyIGFjdGlvbiA9IDBcclxuXHRcdFx0XHRcclxuXHRcdFx0Y29uc3QgYnV0dG9ucyA9IGdhbWVwYWQuYnV0dG9uc1xyXG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgYnV0dG9ucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdHZhciB2YWwgPSBidXR0b25zW2ldLnByZXNzZWRcclxuXHRcdFx0XHRpZiAodmFsID09PSB0cnVlKSB7XHJcblx0XHRcdFx0XHR2YXIgZW50cnkgPSBnYW1lcGFkTWFwLmJ1dHRvbnNbaV1cclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgZW50cnkgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0YWN0aW9uIHw9IGFjdGlvbk1hc2tzW2VudHJ5XVxyXG5cdFx0XHRcdFx0fVx0XHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb25zdCBheGVzID0gZ2FtZXBhZC5heGVzXHJcblx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0YXhlczogZml4QXhlcyhheGVzKVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgYXhlcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdHZhciB2YWwgPSBheGVzW2ldXHJcblx0XHRcdFx0dmFyIGVudHJ5ID0gZ2FtZXBhZE1hcC5heGVzW2ldXHJcblx0XHRcdFx0aWYgKGVudHJ5KSB7XHJcblx0XHRcdFx0XHRmb3IodmFyIGsgaW4gZW50cnkpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGRlc2MgPSBlbnRyeVtrXVxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGRlc2MubWluID09IFwibnVtYmVyXCIpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodmFsID4gZGVzYy5taW4pIHtcclxuXHRcdFx0XHRcdFx0XHRcdGFjdGlvbiB8PSBhY3Rpb25NYXNrc1trXVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGRlc2MubWF4ID09IFwibnVtYmVyXCIpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodmFsIDwgZGVzYy5tYXgpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGFjdGlvbiB8PSBhY3Rpb25NYXNrc1trXVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdFxyXG5cdFx0XHRcclxuXHRcdFx0aWYgKGFjdGlvbiAhPSBjdXJBY3Rpb24pIHtcclxuXHRcdFx0XHRzZXRBY3Rpb24oYWN0aW9uKVx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2hlY2tHYW1lUGFkU3RhdHVzKVx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZml4QXhlcyhheGVzKSB7XHJcblx0XHRyZXR1cm4gYXhlcy5tYXAoKHYpID0+IHYudG9GaXhlZCgyKSlcclxuXHR9XHJcblxyXG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiZ2FtZXBhZGNvbm5lY3RlZFwiLCBmdW5jdGlvbihlKSB7XHJcblx0XHRjb25zb2xlLmxvZyhcIkNvbnRyw7RsZXVyIG7CsCVkIGNvbm5lY3TDqSA6ICVzLiAlZCBib3V0b25zLCAlZCBheGVzLlwiLFxyXG4gIFx0XHRcdGUuZ2FtZXBhZC5pbmRleCwgZS5nYW1lcGFkLmlkLFxyXG4gIFx0XHRcdGUuZ2FtZXBhZC5idXR0b25zLmxlbmd0aCwgZS5nYW1lcGFkLmF4ZXMubGVuZ3RoKTtcclxuXHJcblxyXG5cdFx0Y29uc3QgYXhlcyA9IGUuZ2FtZXBhZC5heGVzXHJcblx0XHRjdHJsLnNldERhdGEoe2dhbWVwYWREZXRlY3RlZDogdHJ1ZSwgYXhlczogZml4QXhlcyhheGVzKX0pXHRcclxuXHRcclxuXHJcblx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2hlY2tHYW1lUGFkU3RhdHVzKVxyXG5cclxuXHR9KTtcclxuXHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImdhbWVwYWRkaXNjb25uZWN0ZWRcIiwgZnVuY3Rpb24oZSkge1xyXG5cdFx0Y29uc29sZS5sb2coJ2dhbWVwYWRkaXNjb25uZWN0ZWQnKVxyXG5cdFx0Y3RybC5zZXREYXRhKHtnYW1lcGFkRGV0ZWN0ZWQ6IGZhbHNlfSlcdFxyXG5cdH0pO1xyXG5cclxufSkgIl19
