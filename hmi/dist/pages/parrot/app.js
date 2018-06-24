$$.configReady(function() {

	$$.startApp('MainControl')
}) 
$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'], 

	init: function(elt, options, client) {

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



		const ctrl = $$.viewController(elt, {
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

	}

}) 
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbigpIHtcclxuXHJcblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcclxufSkgIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ01haW5Db250cm9sJywge1xyXG5cdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLCBcclxuXHJcblx0aW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcclxuXHJcblx0XHR2YXIgY3VyQWN0aW9uID0gMFxyXG5cclxuXHQgXHRjb25zdCBnYW1lcGFkTWFwID0ge1xyXG5cdCBcdFx0YXhlczoge1xyXG5cdCBcdFx0XHQnMCc6IHtcclxuXHQgXHRcdFx0XHRsZWZ0OiB7bWF4OiAtMC42fSxcclxuXHQgXHRcdFx0XHRyaWdodDoge21pbjogMC42fVxyXG5cdCBcdFx0XHR9LFxyXG5cdCBcdFx0XHQnMSc6IHtcclxuXHQgXHRcdFx0XHRiYWNrOiB7bWluOiAwLjV9LFxyXG5cdCBcdFx0XHRcdGZyb250OiB7bWF4OiAtMC41fVxyXG5cdCBcdFx0XHR9XHJcblx0IFx0XHR9LFxyXG5cdCBcdFx0YnV0dG9uczoge1xyXG5cdCBcdFx0XHQnNCc6ICdjbG9ja3dpc2UnLFxyXG5cdCBcdFx0XHQnMyc6ICdjb3VudGVyQ2xvY2t3aXNlJyxcclxuXHQgXHRcdFx0JzUnOiAndXAnLFxyXG5cdCBcdFx0XHQnNic6ICdkb3duJyxcclxuXHQgXHRcdFx0JzEnOiAnbGFuZCcsXHJcblx0IFx0XHRcdCcwJzogJ3Bob3RvJ1xyXG5cdCBcdFx0fVxyXG5cclxuXHQgXHR9XHJcblxyXG5cdCBcdGNvbnN0IGFjdGlvbk1hc2tzID0ge1xyXG5cdCBcdFx0J2xlZnQnOiAxLFxyXG5cdCBcdFx0J3JpZ2h0JzogMixcclxuXHQgXHRcdCdiYWNrJzogNCxcclxuXHQgXHRcdCdmcm9udCc6IDgsXHJcblx0IFx0XHQnY2xvY2t3aXNlJzogMTYsXHJcblx0IFx0XHQnY291bnRlckNsb2Nrd2lzZSc6IDMyLFxyXG5cdCBcdFx0J3VwJzogNjQsXHJcblx0IFx0XHQnZG93bic6IDEyOCxcclxuXHQgXHRcdCdsYW5kJzogMjU2XHJcblxyXG5cclxuXHQgXHR9XHJcblxyXG5cclxuXHJcblx0XHRjb25zdCBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXY+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJwYW5lbDFcXFwiPlxcclxcblx0XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLmNtZDogb25DbWRcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcInRha2VvZmZcXFwiPlRha2UgT2ZmPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwibGFuZFxcXCIgYm4tc2hvdz1cXFwiIWdhbWVwYWREZXRlY3RlZFxcXCI+TGFuZDwvYnV0dG9uPlx0XHRcXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJkaXNhYmxlRW1lcmdlbmN5XFxcIj5SZWNvdmVyPC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plxcclxcblxcclxcblxcclxcblxcclxcblx0XHQ8ZGl2Plxcclxcblx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRCYXR0ZXJ5OiA8c3BhbiBibi10ZXh0PVxcXCJiYXR0ZXJ5XFxcIj48L3NwYW4+JVxcclxcblx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XFxyXFxuXHRcdFx0PGRpdj5cXHJcXG5cdFx0XHRcdENvbnRyb2wgU3RhdGU6IDxzcGFuIGJuLXRleHQ9XFxcImNvbnRyb2xTdGF0ZVxcXCI+PC9zcGFuPlxcclxcblx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XFxyXFxuXHRcdFx0PGRpdj5cXHJcXG5cdFx0XHRcdEZseSBTdGF0ZTogPHNwYW4gYm4tdGV4dD1cXFwiZmx5U3RhdGVcXFwiPjwvc3Bhbj5cXHJcXG5cdFx0XHQ8L2Rpdj5cdFx0XHRcXHJcXG5cdFx0XHQ8ZGl2Plxcclxcblx0XHRcdFx0QWN0aW9uOiA8c3BhbiBibi10ZXh0PVxcXCJjdXJBY3Rpb25cXFwiPjwvc3Bhbj5cXHJcXG5cdFx0XHQ8L2Rpdj5cdFxcclxcblx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRXYWl0IExhbmRpbmc6IDxzcGFuIGJuLXRleHQ9XFxcIndhaXRMYW5kaW5nXFxcIj48L3NwYW4+XFxyXFxuXHRcdFx0PC9kaXY+XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHRcdDxkaXYgYm4tZWFjaD1cXFwidiBvZiBheGVzXFxcIiBibi1zaG93PVxcXCJnYW1lcGFkRGV0ZWN0ZWRcXFwiPlxcclxcblx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRBeGUgOiA8c3BhbiBibi10ZXh0PVxcXCJ2XFxcIj48L3NwYW4+XFxyXFxuXHRcdFx0PC9kaXY+XFxyXFxuXHRcdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCIgYm4tZXZlbnQ9XFxcIm1vdXNlZG93bi5jbWQ6IG9uU3BlZWRDbWQsIG1vdXNldXAuY21kOiBvblN0b3BcXFwiIGJuLXNob3c9XFxcIiFnYW1lcGFkRGV0ZWN0ZWRcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZyb250XFxcIj5Gcm9udDwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImJhY2tcXFwiPkJhY2s8L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJsZWZ0XFxcIj5MZWZ0PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwicmlnaHRcXFwiPlJpZ2h0PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwidXBcXFwiPlVwPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZG93blxcXCI+RG93bjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImNsb2Nrd2lzZVxcXCI+Q2xvY2t3aXNlPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiY291bnRlckNsb2Nrd2lzZVxcXCI+Q291bnRlciBDbG9ja3dpc2U8L2J1dHRvbj5cXHJcXG5cdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJwYW5lbDJcXFwiPlxcclxcblx0XHRcdFxcclxcblx0XHRcdDxkaXYgYm4tY29udHJvbD1cXFwiRmxpZ2h0UGFuZWxDb250cm9sXFxcIiBibi1kYXRhPVxcXCJyb2xsOiByb2xsLCBwaXRjaDogcGl0Y2gsIGFsdGl0dWRlOiBhbHRpdHVkZVxcXCI+PC9kaXY+XHRcXHJcXG5cXHJcXG5cdFx0XHQ8aW1nIGJuLWF0dHI9XFxcInNyYzogaW1nVXJsXFxcIj5cXHJcXG5cdFx0XHQ8ZGl2IGJuLWJpbmQ9XFxcImRyb25lc3RyZWFtXFxcIj48L2Rpdj5cXHJcXG5cdFxcclxcblx0XHRcdFxcclxcblx0XHRcdFxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRyb2xsOiAwLFxyXG5cdFx0XHRcdHBpdGNoOiAwLFxyXG5cdFx0XHRcdGFsdGl0dWRlOiAwLFxyXG5cdFx0XHRcdGJhdHRlcnk6IDAsXHJcblx0XHRcdFx0Y29udHJvbFN0YXRlOiAnVW5rbm93bicsXHJcblx0XHRcdFx0Zmx5U3RhdGU6ICdVbmtub3duJyxcclxuXHRcdFx0XHRheGVzOiBbXSxcclxuXHRcdFx0XHRnYW1lcGFkRGV0ZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdGN1ckFjdGlvbixcclxuXHRcdFx0XHRpbWdVcmw6ICcnLFxyXG5cdFx0XHRcdHdhaXRMYW5kaW5nOiBmYWxzZVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRvbkNtZDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQvL2NsaWVudC5lbWl0KCdwYXJyb3RDbWQnLCB7Y21kOiAndGFrZU9mZid9KVxyXG5cdFx0XHRcdFx0Y29uc3QgY21kID0gJCh0aGlzKS5kYXRhKCdjbWQnKVxyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2NtZCcsIGNtZClcclxuXHRcdFx0XHRcdGNsaWVudC5lbWl0KCdwYXJyb3RDbWQnLCB7Y21kfSlcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uU3BlZWRDbWQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0Ly9jbGllbnQuZW1pdCgncGFycm90Q21kJywge2NtZDogJ3Rha2VPZmYnfSlcclxuXHRcdFx0XHRcdGNvbnN0IGNtZCA9ICQodGhpcykuZGF0YSgnY21kJylcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdjbWQnLCBjbWQpXHJcblx0XHRcdFx0XHRzZXRBY3Rpb24oYWN0aW9uTWFza3NbY21kXSlcclxuXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvblN0b3A6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0c2V0QWN0aW9uKDApXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cclxuXHRcdHZhciB2aWRlb1N0cmVhbSA9IG5ldyBOb2RlY29wdGVyU3RyZWFtKFxyXG5cdFx0XHRjdHJsLnNjb3BlLmRyb25lc3RyZWFtLmdldCgwKSxcclxuXHRcdFx0e3BvcnQ6IDMwMDF9XHJcblx0XHRcdClcclxuXHJcblx0XHR2YXIgd2FpdExhbmRpbmcgPSBmYWxzZVxyXG5cclxuXHJcblx0XHRmdW5jdGlvbiBzZXRBY3Rpb24oYWN0aW9uKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdzZXRBY3Rpb24nLCBhY3Rpb24pXHJcblx0XHRcdGN1ckFjdGlvbiA9IGFjdGlvblxyXG5cclxuXHJcblxyXG5cdFx0XHR2YXIgY21kcyA9IHt9XHJcblx0XHRcdGZvcih2YXIgayBpbiBhY3Rpb25NYXNrcykge1xyXG5cdFx0XHRcdGlmIChhY3Rpb24gJiBhY3Rpb25NYXNrc1trXSkge1xyXG5cdFx0XHRcdFx0Y21kc1trXSA9IDAuM1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRjb25zb2xlLmxvZygnY21kcycsIGNtZHMpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSh7Y3VyQWN0aW9uOiBPYmplY3Qua2V5cyhjbWRzKS50b1N0cmluZygpfSlcclxuXHJcblx0XHRcdGlmIChjdHJsLm1vZGVsLndhaXRMYW5kaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChhY3Rpb24gPT0gMCkge1xyXG5cdFx0XHRcdGNsaWVudC5lbWl0KCdwYXJyb3RDbWQnLCB7Y21kOiAnc3RvcCd9KVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRlbHNlIGlmIChjbWRzLmxhbmQpIHtcclxuXHRcdFx0XHRjbGllbnQuZW1pdCgncGFycm90Q21kJywge2NtZDogJ2xhbmQnfSlcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe3dhaXRMYW5kaW5nOiB0cnVlfSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChPYmplY3Qua2V5cyhjbWRzKS5sZW5ndGggPiAwKSB7XHJcblx0XHRcdFx0Y2xpZW50LmVtaXQoJ3BhcnJvdENtZCcsIHtjbWQ6ICdtb3ZlJywgbW92ZTogY21kc30pXHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHRcdGNsaWVudC5yZWdpc3RlcigncGFycm90TmF2RGF0YScsIGZhbHNlLCBmdW5jdGlvbihtc2cpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncGFycm90TmF2RGF0YScsIG1zZy5kYXRhKVxyXG5cdFx0XHRjb25zdCBkYXRhID0gbXNnLmRhdGFcclxuXHJcblx0XHRcdGlmIChkYXRhLmRlbW8pIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdkZW1vJywgZGF0YS5kZW1vKVxyXG5cdFx0XHRcdGNvbnN0IGRlbW8gPSBkYXRhLmRlbW9cclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe1xyXG5cdFx0XHRcdFx0YWx0aXR1ZGU6IGRlbW8uYWx0aXR1ZGVNZXRlcnMsXHJcblx0XHRcdFx0XHRiYXR0ZXJ5OiBkZW1vLmJhdHRlcnlQZXJjZW50YWdlLFxyXG5cdFx0XHRcdFx0cm9sbDogLWRlbW8ucm90YXRpb24ucm9sbCxcclxuXHRcdFx0XHRcdHBpdGNoOiBkZW1vLnJvdGF0aW9uLnBpdGNoLFxyXG5cdFx0XHRcdFx0Y29udHJvbFN0YXRlOiBkZW1vLmNvbnRyb2xTdGF0ZSxcclxuXHRcdFx0XHRcdGZseVN0YXRlOiBkZW1vLmZseVN0YXRlXHJcblxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0aWYgKGN0cmwubW9kZWwud2FpdExhbmRpbmcpIHtcclxuXHRcdFx0XHRcdGlmIChjdHJsLm1vZGVsLmNvbnRyb2xTdGF0ZSA9PSAnQ1RSTF9MQU5ERUQnKSB7XHJcblx0XHRcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHt3YWl0TGFuZGluZzogZmFsc2V9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHJcblxyXG5cclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHJcblxyXG5cclxuXHJcblx0XHRmdW5jdGlvbiBjaGVja0dhbWVQYWRTdGF0dXMoKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2NoZWNrR2FtZVBhZFN0YXR1cycpXHJcblx0XHRcdHZhciBnYW1lcGFkID0gbmF2aWdhdG9yLmdldEdhbWVwYWRzKClbMF1cclxuXHRcdFx0aWYgKGdhbWVwYWQpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdnYW1lcGFkJywgZ2FtZXBhZClcclxuXHRcdFx0XHR2YXIgYWN0aW9uID0gMFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0Y29uc3QgYnV0dG9ucyA9IGdhbWVwYWQuYnV0dG9uc1xyXG5cdFx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBidXR0b25zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHR2YXIgdmFsID0gYnV0dG9uc1tpXS5wcmVzc2VkXHJcblx0XHRcdFx0XHRpZiAodmFsID09PSB0cnVlKSB7XHJcblx0XHRcdFx0XHRcdHZhciBlbnRyeSA9IGdhbWVwYWRNYXAuYnV0dG9uc1tpXVxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGVudHJ5ID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdFx0YWN0aW9uIHw9IGFjdGlvbk1hc2tzW2VudHJ5XVxyXG5cdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGNvbnN0IGF4ZXMgPSBnYW1lcGFkLmF4ZXNcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe1xyXG5cdFx0XHRcdFx0YXhlczogZml4QXhlcyhheGVzKVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGF4ZXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRcdHZhciB2YWwgPSBheGVzW2ldXHJcblx0XHRcdFx0XHR2YXIgZW50cnkgPSBnYW1lcGFkTWFwLmF4ZXNbaV1cclxuXHRcdFx0XHRcdGlmIChlbnRyeSkge1xyXG5cdFx0XHRcdFx0XHRmb3IodmFyIGsgaW4gZW50cnkpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgZGVzYyA9IGVudHJ5W2tdXHJcblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBkZXNjLm1pbiA9PSBcIm51bWJlclwiKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRpZiAodmFsID4gZGVzYy5taW4pIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0YWN0aW9uIHw9IGFjdGlvbk1hc2tzW2tdXHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgZGVzYy5tYXggPT0gXCJudW1iZXJcIikge1xyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKHZhbCA8IGRlc2MubWF4KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbiB8PSBhY3Rpb25NYXNrc1trXVxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmIChhY3Rpb24gIT0gY3VyQWN0aW9uKSB7XHJcblx0XHRcdFx0XHRzZXRBY3Rpb24oYWN0aW9uKVx0XHRcdFxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNoZWNrR2FtZVBhZFN0YXR1cylcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZml4QXhlcyhheGVzKSB7XHJcblx0XHRcdHJldHVybiBheGVzLm1hcCgodikgPT4gdi50b0ZpeGVkKDIpKVxyXG5cdFx0fVxyXG5cclxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiZ2FtZXBhZGNvbm5lY3RlZFwiLCBmdW5jdGlvbihlKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKFwiQ29udHLDtGxldXIgbsKwJWQgY29ubmVjdMOpIDogJXMuICVkIGJvdXRvbnMsICVkIGF4ZXMuXCIsXHJcblx0ICBcdFx0XHRlLmdhbWVwYWQuaW5kZXgsIGUuZ2FtZXBhZC5pZCxcclxuXHQgIFx0XHRcdGUuZ2FtZXBhZC5idXR0b25zLmxlbmd0aCwgZS5nYW1lcGFkLmF4ZXMubGVuZ3RoKTtcclxuXHJcblxyXG5cdFx0XHRjb25zdCBheGVzID0gZS5nYW1lcGFkLmF4ZXNcclxuXHRcdFx0Y3RybC5zZXREYXRhKHtnYW1lcGFkRGV0ZWN0ZWQ6IHRydWUsIGF4ZXM6IGZpeEF4ZXMoYXhlcyl9KVx0XHJcblx0XHRcclxuXHJcblx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZShjaGVja0dhbWVQYWRTdGF0dXMpXHJcblxyXG5cdFx0fSk7XHJcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImdhbWVwYWRkaXNjb25uZWN0ZWRcIiwgZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnZ2FtZXBhZGRpc2Nvbm5lY3RlZCcpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSh7Z2FtZXBhZERldGVjdGVkOiBmYWxzZX0pXHRcclxuXHRcdH0pO1xyXG5cclxuXHR9XHJcblxyXG59KSAiXX0=
