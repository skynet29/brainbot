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