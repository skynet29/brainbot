(function() {

	function toRad(val) {
		return val*Math.PI/180
	}	

	$$.registerControlEx('FlightPanelControl',  {

		props: {
			roll: {val: 0, set: 'setRoll'},
			pitch: {val: 0, set: 'setPitch'},
			speed: {val: 0, set: 'setSpeed'},
			altitude: {val: 0, set: 'setAltitude'}		
		},


		options: {
			skyColor: '#33f',
			earthColor: '#992',
			frontCameraFovY: 200,
			majorWidth: 100,
			minorWidth: 60,
			zeroWidth: 200,
			zeroGap: 20,
			radialLimit: 60,
			tickRadius: 10,
			radialRadius: 178,
			speedIndicatorHeight: 250,
			speedIndicatorWidth: 60,
			zeroPadding: 100,
			speedAltOpacity: 0.2,
			pixelsPer10Kmph: 50,
			minorTicksPer10Kmph: 5,
			speedWarningWidth: 10,

			yellowBoundarySpeed: 100,
			redBoundarySpeed: 130,

			altIndicatorHeight: 250,
			altIndicatorWidth: 50,
			majorTickWidth: 10,
			minorTickWidth: 5,
			pixelsPer100Ft: 50,
			minorTicksPer100Ft: 5				
		},

		
	lib: 'flight',
init: function(elt, options) {

			var canvas = $('<canvas>').attr('width', 640).attr('height', 360).appendTo(elt)


			var ctx = canvas.get(0).getContext('2d')
			var pixelsPerDeg = ctx.canvas.height / (options.frontCameraFovY / 2)	 

			var rollRad = toRad(options.roll)
			var pitchRad = toRad(options.pitch)

			//console.log(`width: ${ctx.canvas.width}, height: ${ctx.canvas.height}`)


			function drawHorizon() {

				var {radialRadius, majorWidth, minorWidth, skyColor, earthColor} = options

			  ctx.save();
			  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
			  ctx.rotate(-rollRad);
			  var pitchPixels = pitchRad / (Math.PI * 2) * 360 * pixelsPerDeg;
			  ctx.translate(0, pitchPixels);
			  
			   ctx.fillStyle = skyColor;
			   ctx.fillRect(-10000, -10000, 20000, 10000);
			   ctx.fillStyle = earthColor;
			   ctx.fillRect(-10000, 0, 20000, 10000);
			  
			  // horizon
			  ctx.strokeStyle = '#fff';
			  ctx.fillStyle = 'white';
			  ctx.lineWidth = 2;
			  ctx.beginPath();
			  ctx.moveTo(-10000, 0);
			  ctx.lineTo(20000, 0);
			  ctx.stroke();

			  ctx.beginPath();
			  ctx.arc(0, -pitchPixels, radialRadius, 0, Math.PI * 2, false);
			  ctx.closePath();
			  ctx.clip();

			  ctx.beginPath();
			  for (var i = -18; i <= 18; ++i) {
			    var pitchAngle = i / 2 * 10;
			    if (i !== 0) {
			      if (i % 2 === 0) {
			        ctx.moveTo(-majorWidth / 2, -pixelsPerDeg * pitchAngle);
			        ctx.lineTo(+majorWidth / 2, -pixelsPerDeg * pitchAngle);
			        ctx.fillText(pitchAngle, -majorWidth / 2 - 20, -pixelsPerDeg * 10 / 2 * i);
			        ctx.fillText(pitchAngle, majorWidth / 2 + 10, -pixelsPerDeg * 10 / 2 * i);
			      } else {
			        ctx.moveTo(-minorWidth / 2, -pixelsPerDeg * pitchAngle);
			        ctx.lineTo(+minorWidth / 2, -pixelsPerDeg * pitchAngle);
			      }
			    }
			  }
			  ctx.closePath();
			  ctx.stroke();
			  ctx.restore();
			}

			function drawZero() {

				var {zeroWidth, zeroGap, radialRadius, radialLimit, tickRadius} = options

				ctx.save();
				ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
				ctx.strokeStyle = 'yellow';
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(-zeroWidth / 2, 0);
				ctx.lineTo(-zeroGap / 2, 0);
				ctx.moveTo(+zeroWidth / 2, 0);
				ctx.lineTo(+zeroGap / 2, 0);
				ctx.moveTo(-zeroGap / 2, zeroGap / 2);
				ctx.lineTo(0, 0);
				ctx.lineTo(+zeroGap / 2, zeroGap / 2);
				ctx.stroke();
				// The radial roll indicator
				ctx.beginPath();
				ctx.arc(0, 0, radialRadius, -Math.PI / 2 - Math.PI * radialLimit / 180, -Math.PI / 2 + Math.PI * radialLimit / 180, false);
				ctx.stroke();
				for (var i = -4; i <= 4; ++i) {
					ctx.moveTo((radialRadius - tickRadius) * Math.cos(-Math.PI / 2 + i * 15 / 180 * Math.PI), (radialRadius - tickRadius) * Math.sin(-Math.PI / 2 + i * 15 / 180 * Math.PI));
					ctx.lineTo(radialRadius * Math.cos(-Math.PI / 2 + i * 15 / 180 * Math.PI), radialRadius * Math.sin(-Math.PI / 2 + i * 15 / 180 * Math.PI));
				}
				ctx.stroke();
				ctx.restore();
			}	

			function drawRoll() {

				var {radialRadius} = options

				ctx.save();
				ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
				ctx.rotate(-rollRad);
				ctx.fillStyle = 'white';
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(0, -radialRadius);
				ctx.lineTo(-5, -radialRadius + 10);
				ctx.lineTo(+5, -radialRadius + 10);
				ctx.closePath();
				ctx.fill();
				var readableRollAngle = Math.round(rollRad / Math.PI / 2 * 360) % 360;
				if (readableRollAngle > 180) {
					readableRollAngle = readableRollAngle - 360;
				}
				ctx.fillRect(-20, -radialRadius + 9, 40, 16);
				ctx.font = '12px Arial';
				ctx.fillStyle = 'black';
				ctx.fillText(readableRollAngle, -7, -radialRadius + 22);
				ctx.restore();
			}			

			function drawSpeed() {

				var {
					speedIndicatorHeight,
					speedIndicatorWidth,
					speedWarningWidth,
					zeroPadding,
					zeroWidth,
					speedAltOpacity,
					yellowBoundarySpeed,
					redBoundarySpeed,
					pixelsPer10Kmph,
					majorTickWidth,
					minorTickWidth,
					minorTicksPer10Kmph,
					altIndicatorHeight,
					speed
				}  = options


				ctx.save();
				ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
				ctx.translate(-zeroWidth / 2 - zeroPadding - speedIndicatorWidth, 0);
				ctx.fillStyle = 'rgba(0,0,0,' + speedAltOpacity + ')';
				ctx.strokeStyle = 'white';
				ctx.lineWidth = 2;
				ctx.strokeRect(0, -speedIndicatorHeight / 2, speedIndicatorWidth, speedIndicatorHeight);
				ctx.fillRect(0, -speedIndicatorHeight / 2, speedIndicatorWidth, speedIndicatorHeight);
				ctx.restore();
				ctx.save();
				ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
				ctx.translate(-zeroWidth / 2 - zeroPadding - speedIndicatorWidth, 0);
				ctx.rect(0, -speedIndicatorHeight / 2, speedIndicatorWidth, speedIndicatorHeight);
				ctx.clip();
				var yellowBoundaryY = -(-speed + yellowBoundarySpeed) / 10 * pixelsPer10Kmph;
				var redBoundaryY = -(-speed + redBoundarySpeed) / 10 * pixelsPer10Kmph;
				ctx.fillStyle = 'yellow';
				ctx.fillRect(speedIndicatorWidth - speedWarningWidth, yellowBoundaryY, speedWarningWidth, redBoundaryY - yellowBoundaryY);
				ctx.fillStyle = 'red';
				ctx.fillRect(speedIndicatorWidth - speedWarningWidth, redBoundaryY, speedWarningWidth, -speedIndicatorHeight / 2 - redBoundaryY);
				ctx.fillStyle = 'green';
				ctx.fillRect(speedIndicatorWidth - speedWarningWidth, yellowBoundaryY, speedWarningWidth, +speedIndicatorHeight / 2 - yellowBoundaryY);
				var yOffset = speed / 10 * pixelsPer10Kmph;
				// The unclipped ticks to be rendered.
				// We render 100kmph either side of the center to be safe
				var from = -Math.floor(speed / 10) - 10;
				var to = Math.ceil(speed / 10) + 10;
				for (var i = from; i < to; ++i) {
					ctx.moveTo(speedIndicatorWidth - speedWarningWidth, -i * pixelsPer10Kmph + yOffset);
					ctx.lineTo(speedIndicatorWidth - speedWarningWidth - majorTickWidth, -i * pixelsPer10Kmph + yOffset);
					for (j = 1; j < minorTicksPer10Kmph; ++j) {
					  ctx.moveTo(speedIndicatorWidth - speedWarningWidth, -i * pixelsPer10Kmph - j * pixelsPer10Kmph / minorTicksPer10Kmph + yOffset);
					  ctx.lineTo(speedIndicatorWidth - speedWarningWidth - minorTickWidth, -i * pixelsPer10Kmph - j * pixelsPer10Kmph / minorTicksPer10Kmph + yOffset);
					}
					ctx.font = '12px Arial';
					ctx.fillStyle = 'white';
					ctx.fillText(i * 10, 20, -i * pixelsPer10Kmph + yOffset + 4);
				}
				ctx.strokeStyle = 'white';
				ctx.lineWidth = 2;
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(speedIndicatorWidth - speedWarningWidth - minorTickWidth, 0);
				ctx.lineTo(speedIndicatorWidth - speedWarningWidth - minorTickWidth * 2, -5);
				ctx.lineTo(speedIndicatorWidth - speedWarningWidth - minorTickWidth * 2, -10);
				ctx.lineTo(0, -10);
				ctx.lineTo(0, 10);
				ctx.lineTo(speedIndicatorWidth - speedWarningWidth - minorTickWidth * 2, 10);
				ctx.lineTo(speedIndicatorWidth - speedWarningWidth - minorTickWidth * 2, 5);
				ctx.closePath();
				ctx.fill();
				ctx.strokeStyle = 'black';
				ctx.fillStyle = 'black';
				ctx.fillText(Math.round(speed * 100) / 100, 15, 4.5, altIndicatorHeight);
				ctx.restore();
			}		


			function drawAltitude() {

				var {
					zeroWidth,
					zeroPadding,
					speedAltOpacity,
					altIndicatorHeight,
					altIndicatorWidth,
					pixelsPer100Ft,
					minorTickWidth,
					majorTickWidth,
					minorTicksPer100Ft,
					altitude
				} = options

				ctx.save();
				ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
				ctx.translate(zeroWidth / 2 + zeroPadding, 0);
				ctx.fillStyle = 'rgba(0,0,0,' + speedAltOpacity + ')';
				ctx.strokeStyle = 'white';
				ctx.lineWidth = 2;
				ctx.fillRect(0, -altIndicatorHeight / 2, altIndicatorWidth, altIndicatorHeight);
				ctx.strokeRect(0, -altIndicatorHeight / 2, altIndicatorWidth, altIndicatorHeight);
				ctx.restore();
				ctx.save();
				ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
				ctx.translate(zeroWidth / 2 + zeroPadding, 0);
				ctx.rect(0, -altIndicatorHeight / 2, altIndicatorWidth, altIndicatorHeight);
				ctx.clip();
				var yOffset = altitude / 1 * pixelsPer100Ft;
				// The unclipped ticks to be rendered. We render 500ft either side of
				// the center to be safe
				var from = Math.floor(altitude / 1) - 5;
				var to = Math.ceil(altitude / 1) + 5;
				for (var i = from; i < to; ++i) {
					ctx.moveTo(0, -i * pixelsPer100Ft + yOffset);
					ctx.lineTo(majorTickWidth, -i * pixelsPer100Ft + yOffset);
					for (var j = 1; j < minorTicksPer100Ft; ++j) {
						  ctx.moveTo(0, -i * pixelsPer100Ft - j * pixelsPer100Ft / minorTicksPer100Ft + yOffset);
						  ctx.lineTo(minorTickWidth, -i * pixelsPer100Ft - j * pixelsPer100Ft / minorTicksPer100Ft + yOffset);
					}
					ctx.font = '12px Arial';
					ctx.fillStyle = 'white';
					ctx.fillText(i * 1, 15, -i * pixelsPer100Ft + yOffset + 4);
				}
				ctx.strokeStyle = 'white';
				ctx.lineWidth = 2;
				ctx.stroke();
				ctx.restore();
				ctx.save();
				ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
				ctx.translate(zeroWidth / 2 + zeroPadding, 0);
				ctx.strokeStyle = 'white';
				ctx.lineWidth = 2;
				ctx.font = '12px Arial';
				ctx.fillStyle = 'white';
				ctx.fillOpacity = 1;
				ctx.beginPath();
				ctx.moveTo(minorTickWidth, 0);
				ctx.lineTo(minorTickWidth * 2, -5);
				ctx.lineTo(minorTickWidth * 2, -10);
				ctx.lineTo(altIndicatorWidth, -10);
				ctx.lineTo(altIndicatorWidth, 10);
				ctx.lineTo(minorTickWidth * 2, 10);
				ctx.lineTo(minorTickWidth * 2, 5);
				ctx.closePath();
				ctx.fill();
				ctx.strokeStyle = 'black';
				ctx.fillStyle = 'black';
				ctx.fillText(Math.round(altitude * 100) / 100, 15, 4.5, altIndicatorHeight);
				ctx.restore();
			}			

			function render() {
				drawHorizon()
				drawZero()
				drawRoll()
				drawSpeed()
				drawAltitude()
			}



			render()

			return {
				setRoll: function(value) {
					options.roll = value
					rollRad = toRad(value)
					render()				
				},


				setSpeed: function(value) {
					options.speed = value
					render()					
				},
				setPitch: function(value) {
					options.pitch = value
					pitchRad = toRad(value)
					render()				
				},

				setAltitude: function(value) {
					options.altitude = value
					render()				
				}


			}
		}
	})


})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZsaWdodHBhbmVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZmxpZ2h0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRmdW5jdGlvbiB0b1JhZCh2YWwpIHtcclxuXHRcdHJldHVybiB2YWwqTWF0aC5QSS8xODBcclxuXHR9XHRcclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZsaWdodFBhbmVsQ29udHJvbCcsICB7XHJcblxyXG5cdFx0cHJvcHM6IHtcclxuXHRcdFx0cm9sbDoge3ZhbDogMCwgc2V0OiAnc2V0Um9sbCd9LFxyXG5cdFx0XHRwaXRjaDoge3ZhbDogMCwgc2V0OiAnc2V0UGl0Y2gnfSxcclxuXHRcdFx0c3BlZWQ6IHt2YWw6IDAsIHNldDogJ3NldFNwZWVkJ30sXHJcblx0XHRcdGFsdGl0dWRlOiB7dmFsOiAwLCBzZXQ6ICdzZXRBbHRpdHVkZSd9XHRcdFxyXG5cdFx0fSxcclxuXHJcblxyXG5cdFx0b3B0aW9uczoge1xyXG5cdFx0XHRza3lDb2xvcjogJyMzM2YnLFxyXG5cdFx0XHRlYXJ0aENvbG9yOiAnIzk5MicsXHJcblx0XHRcdGZyb250Q2FtZXJhRm92WTogMjAwLFxyXG5cdFx0XHRtYWpvcldpZHRoOiAxMDAsXHJcblx0XHRcdG1pbm9yV2lkdGg6IDYwLFxyXG5cdFx0XHR6ZXJvV2lkdGg6IDIwMCxcclxuXHRcdFx0emVyb0dhcDogMjAsXHJcblx0XHRcdHJhZGlhbExpbWl0OiA2MCxcclxuXHRcdFx0dGlja1JhZGl1czogMTAsXHJcblx0XHRcdHJhZGlhbFJhZGl1czogMTc4LFxyXG5cdFx0XHRzcGVlZEluZGljYXRvckhlaWdodDogMjUwLFxyXG5cdFx0XHRzcGVlZEluZGljYXRvcldpZHRoOiA2MCxcclxuXHRcdFx0emVyb1BhZGRpbmc6IDEwMCxcclxuXHRcdFx0c3BlZWRBbHRPcGFjaXR5OiAwLjIsXHJcblx0XHRcdHBpeGVsc1BlcjEwS21waDogNTAsXHJcblx0XHRcdG1pbm9yVGlja3NQZXIxMEttcGg6IDUsXHJcblx0XHRcdHNwZWVkV2FybmluZ1dpZHRoOiAxMCxcclxuXHJcblx0XHRcdHllbGxvd0JvdW5kYXJ5U3BlZWQ6IDEwMCxcclxuXHRcdFx0cmVkQm91bmRhcnlTcGVlZDogMTMwLFxyXG5cclxuXHRcdFx0YWx0SW5kaWNhdG9ySGVpZ2h0OiAyNTAsXHJcblx0XHRcdGFsdEluZGljYXRvcldpZHRoOiA1MCxcclxuXHRcdFx0bWFqb3JUaWNrV2lkdGg6IDEwLFxyXG5cdFx0XHRtaW5vclRpY2tXaWR0aDogNSxcclxuXHRcdFx0cGl4ZWxzUGVyMTAwRnQ6IDUwLFxyXG5cdFx0XHRtaW5vclRpY2tzUGVyMTAwRnQ6IDVcdFx0XHRcdFxyXG5cdFx0fSxcclxuXHJcblx0XHRcblx0bGliOiAnZmxpZ2h0JyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdFx0dmFyIGNhbnZhcyA9ICQoJzxjYW52YXM+JykuYXR0cignd2lkdGgnLCA2NDApLmF0dHIoJ2hlaWdodCcsIDM2MCkuYXBwZW5kVG8oZWx0KVxyXG5cclxuXHJcblx0XHRcdHZhciBjdHggPSBjYW52YXMuZ2V0KDApLmdldENvbnRleHQoJzJkJylcclxuXHRcdFx0dmFyIHBpeGVsc1BlckRlZyA9IGN0eC5jYW52YXMuaGVpZ2h0IC8gKG9wdGlvbnMuZnJvbnRDYW1lcmFGb3ZZIC8gMilcdCBcclxuXHJcblx0XHRcdHZhciByb2xsUmFkID0gdG9SYWQob3B0aW9ucy5yb2xsKVxyXG5cdFx0XHR2YXIgcGl0Y2hSYWQgPSB0b1JhZChvcHRpb25zLnBpdGNoKVxyXG5cclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhgd2lkdGg6ICR7Y3R4LmNhbnZhcy53aWR0aH0sIGhlaWdodDogJHtjdHguY2FudmFzLmhlaWdodH1gKVxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGRyYXdIb3Jpem9uKCkge1xyXG5cclxuXHRcdFx0XHR2YXIge3JhZGlhbFJhZGl1cywgbWFqb3JXaWR0aCwgbWlub3JXaWR0aCwgc2t5Q29sb3IsIGVhcnRoQ29sb3J9ID0gb3B0aW9uc1xyXG5cclxuXHRcdFx0ICBjdHguc2F2ZSgpO1xyXG5cdFx0XHQgIGN0eC50cmFuc2xhdGUoY3R4LmNhbnZhcy53aWR0aCAvIDIsIGN0eC5jYW52YXMuaGVpZ2h0IC8gMik7XHJcblx0XHRcdCAgY3R4LnJvdGF0ZSgtcm9sbFJhZCk7XHJcblx0XHRcdCAgdmFyIHBpdGNoUGl4ZWxzID0gcGl0Y2hSYWQgLyAoTWF0aC5QSSAqIDIpICogMzYwICogcGl4ZWxzUGVyRGVnO1xyXG5cdFx0XHQgIGN0eC50cmFuc2xhdGUoMCwgcGl0Y2hQaXhlbHMpO1xyXG5cdFx0XHQgIFxyXG5cdFx0XHQgICBjdHguZmlsbFN0eWxlID0gc2t5Q29sb3I7XHJcblx0XHRcdCAgIGN0eC5maWxsUmVjdCgtMTAwMDAsIC0xMDAwMCwgMjAwMDAsIDEwMDAwKTtcclxuXHRcdFx0ICAgY3R4LmZpbGxTdHlsZSA9IGVhcnRoQ29sb3I7XHJcblx0XHRcdCAgIGN0eC5maWxsUmVjdCgtMTAwMDAsIDAsIDIwMDAwLCAxMDAwMCk7XHJcblx0XHRcdCAgXHJcblx0XHRcdCAgLy8gaG9yaXpvblxyXG5cdFx0XHQgIGN0eC5zdHJva2VTdHlsZSA9ICcjZmZmJztcclxuXHRcdFx0ICBjdHguZmlsbFN0eWxlID0gJ3doaXRlJztcclxuXHRcdFx0ICBjdHgubGluZVdpZHRoID0gMjtcclxuXHRcdFx0ICBjdHguYmVnaW5QYXRoKCk7XHJcblx0XHRcdCAgY3R4Lm1vdmVUbygtMTAwMDAsIDApO1xyXG5cdFx0XHQgIGN0eC5saW5lVG8oMjAwMDAsIDApO1xyXG5cdFx0XHQgIGN0eC5zdHJva2UoKTtcclxuXHJcblx0XHRcdCAgY3R4LmJlZ2luUGF0aCgpO1xyXG5cdFx0XHQgIGN0eC5hcmMoMCwgLXBpdGNoUGl4ZWxzLCByYWRpYWxSYWRpdXMsIDAsIE1hdGguUEkgKiAyLCBmYWxzZSk7XHJcblx0XHRcdCAgY3R4LmNsb3NlUGF0aCgpO1xyXG5cdFx0XHQgIGN0eC5jbGlwKCk7XHJcblxyXG5cdFx0XHQgIGN0eC5iZWdpblBhdGgoKTtcclxuXHRcdFx0ICBmb3IgKHZhciBpID0gLTE4OyBpIDw9IDE4OyArK2kpIHtcclxuXHRcdFx0ICAgIHZhciBwaXRjaEFuZ2xlID0gaSAvIDIgKiAxMDtcclxuXHRcdFx0ICAgIGlmIChpICE9PSAwKSB7XHJcblx0XHRcdCAgICAgIGlmIChpICUgMiA9PT0gMCkge1xyXG5cdFx0XHQgICAgICAgIGN0eC5tb3ZlVG8oLW1ham9yV2lkdGggLyAyLCAtcGl4ZWxzUGVyRGVnICogcGl0Y2hBbmdsZSk7XHJcblx0XHRcdCAgICAgICAgY3R4LmxpbmVUbygrbWFqb3JXaWR0aCAvIDIsIC1waXhlbHNQZXJEZWcgKiBwaXRjaEFuZ2xlKTtcclxuXHRcdFx0ICAgICAgICBjdHguZmlsbFRleHQocGl0Y2hBbmdsZSwgLW1ham9yV2lkdGggLyAyIC0gMjAsIC1waXhlbHNQZXJEZWcgKiAxMCAvIDIgKiBpKTtcclxuXHRcdFx0ICAgICAgICBjdHguZmlsbFRleHQocGl0Y2hBbmdsZSwgbWFqb3JXaWR0aCAvIDIgKyAxMCwgLXBpeGVsc1BlckRlZyAqIDEwIC8gMiAqIGkpO1xyXG5cdFx0XHQgICAgICB9IGVsc2Uge1xyXG5cdFx0XHQgICAgICAgIGN0eC5tb3ZlVG8oLW1pbm9yV2lkdGggLyAyLCAtcGl4ZWxzUGVyRGVnICogcGl0Y2hBbmdsZSk7XHJcblx0XHRcdCAgICAgICAgY3R4LmxpbmVUbygrbWlub3JXaWR0aCAvIDIsIC1waXhlbHNQZXJEZWcgKiBwaXRjaEFuZ2xlKTtcclxuXHRcdFx0ICAgICAgfVxyXG5cdFx0XHQgICAgfVxyXG5cdFx0XHQgIH1cclxuXHRcdFx0ICBjdHguY2xvc2VQYXRoKCk7XHJcblx0XHRcdCAgY3R4LnN0cm9rZSgpO1xyXG5cdFx0XHQgIGN0eC5yZXN0b3JlKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGRyYXdaZXJvKCkge1xyXG5cclxuXHRcdFx0XHR2YXIge3plcm9XaWR0aCwgemVyb0dhcCwgcmFkaWFsUmFkaXVzLCByYWRpYWxMaW1pdCwgdGlja1JhZGl1c30gPSBvcHRpb25zXHJcblxyXG5cdFx0XHRcdGN0eC5zYXZlKCk7XHJcblx0XHRcdFx0Y3R4LnRyYW5zbGF0ZShjdHguY2FudmFzLndpZHRoIC8gMiwgY3R4LmNhbnZhcy5oZWlnaHQgLyAyKTtcclxuXHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSAneWVsbG93JztcclxuXHRcdFx0XHRjdHgubGluZVdpZHRoID0gMjtcclxuXHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XHJcblx0XHRcdFx0Y3R4Lm1vdmVUbygtemVyb1dpZHRoIC8gMiwgMCk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbygtemVyb0dhcCAvIDIsIDApO1xyXG5cdFx0XHRcdGN0eC5tb3ZlVG8oK3plcm9XaWR0aCAvIDIsIDApO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8oK3plcm9HYXAgLyAyLCAwKTtcclxuXHRcdFx0XHRjdHgubW92ZVRvKC16ZXJvR2FwIC8gMiwgemVyb0dhcCAvIDIpO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8oMCwgMCk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbygremVyb0dhcCAvIDIsIHplcm9HYXAgLyAyKTtcclxuXHRcdFx0XHRjdHguc3Ryb2tlKCk7XHJcblx0XHRcdFx0Ly8gVGhlIHJhZGlhbCByb2xsIGluZGljYXRvclxyXG5cdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcclxuXHRcdFx0XHRjdHguYXJjKDAsIDAsIHJhZGlhbFJhZGl1cywgLU1hdGguUEkgLyAyIC0gTWF0aC5QSSAqIHJhZGlhbExpbWl0IC8gMTgwLCAtTWF0aC5QSSAvIDIgKyBNYXRoLlBJICogcmFkaWFsTGltaXQgLyAxODAsIGZhbHNlKTtcclxuXHRcdFx0XHRjdHguc3Ryb2tlKCk7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IC00OyBpIDw9IDQ7ICsraSkge1xyXG5cdFx0XHRcdFx0Y3R4Lm1vdmVUbygocmFkaWFsUmFkaXVzIC0gdGlja1JhZGl1cykgKiBNYXRoLmNvcygtTWF0aC5QSSAvIDIgKyBpICogMTUgLyAxODAgKiBNYXRoLlBJKSwgKHJhZGlhbFJhZGl1cyAtIHRpY2tSYWRpdXMpICogTWF0aC5zaW4oLU1hdGguUEkgLyAyICsgaSAqIDE1IC8gMTgwICogTWF0aC5QSSkpO1xyXG5cdFx0XHRcdFx0Y3R4LmxpbmVUbyhyYWRpYWxSYWRpdXMgKiBNYXRoLmNvcygtTWF0aC5QSSAvIDIgKyBpICogMTUgLyAxODAgKiBNYXRoLlBJKSwgcmFkaWFsUmFkaXVzICogTWF0aC5zaW4oLU1hdGguUEkgLyAyICsgaSAqIDE1IC8gMTgwICogTWF0aC5QSSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjdHguc3Ryb2tlKCk7XHJcblx0XHRcdFx0Y3R4LnJlc3RvcmUoKTtcclxuXHRcdFx0fVx0XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBkcmF3Um9sbCgpIHtcclxuXHJcblx0XHRcdFx0dmFyIHtyYWRpYWxSYWRpdXN9ID0gb3B0aW9uc1xyXG5cclxuXHRcdFx0XHRjdHguc2F2ZSgpO1xyXG5cdFx0XHRcdGN0eC50cmFuc2xhdGUoY3R4LmNhbnZhcy53aWR0aCAvIDIsIGN0eC5jYW52YXMuaGVpZ2h0IC8gMik7XHJcblx0XHRcdFx0Y3R4LnJvdGF0ZSgtcm9sbFJhZCk7XHJcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcblx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IDI7XHJcblx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xyXG5cdFx0XHRcdGN0eC5tb3ZlVG8oMCwgLXJhZGlhbFJhZGl1cyk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbygtNSwgLXJhZGlhbFJhZGl1cyArIDEwKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKCs1LCAtcmFkaWFsUmFkaXVzICsgMTApO1xyXG5cdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcclxuXHRcdFx0XHRjdHguZmlsbCgpO1xyXG5cdFx0XHRcdHZhciByZWFkYWJsZVJvbGxBbmdsZSA9IE1hdGgucm91bmQocm9sbFJhZCAvIE1hdGguUEkgLyAyICogMzYwKSAlIDM2MDtcclxuXHRcdFx0XHRpZiAocmVhZGFibGVSb2xsQW5nbGUgPiAxODApIHtcclxuXHRcdFx0XHRcdHJlYWRhYmxlUm9sbEFuZ2xlID0gcmVhZGFibGVSb2xsQW5nbGUgLSAzNjA7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGN0eC5maWxsUmVjdCgtMjAsIC1yYWRpYWxSYWRpdXMgKyA5LCA0MCwgMTYpO1xyXG5cdFx0XHRcdGN0eC5mb250ID0gJzEycHggQXJpYWwnO1xyXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSAnYmxhY2snO1xyXG5cdFx0XHRcdGN0eC5maWxsVGV4dChyZWFkYWJsZVJvbGxBbmdsZSwgLTcsIC1yYWRpYWxSYWRpdXMgKyAyMik7XHJcblx0XHRcdFx0Y3R4LnJlc3RvcmUoKTtcclxuXHRcdFx0fVx0XHRcdFxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZHJhd1NwZWVkKCkge1xyXG5cclxuXHRcdFx0XHR2YXIge1xyXG5cdFx0XHRcdFx0c3BlZWRJbmRpY2F0b3JIZWlnaHQsXHJcblx0XHRcdFx0XHRzcGVlZEluZGljYXRvcldpZHRoLFxyXG5cdFx0XHRcdFx0c3BlZWRXYXJuaW5nV2lkdGgsXHJcblx0XHRcdFx0XHR6ZXJvUGFkZGluZyxcclxuXHRcdFx0XHRcdHplcm9XaWR0aCxcclxuXHRcdFx0XHRcdHNwZWVkQWx0T3BhY2l0eSxcclxuXHRcdFx0XHRcdHllbGxvd0JvdW5kYXJ5U3BlZWQsXHJcblx0XHRcdFx0XHRyZWRCb3VuZGFyeVNwZWVkLFxyXG5cdFx0XHRcdFx0cGl4ZWxzUGVyMTBLbXBoLFxyXG5cdFx0XHRcdFx0bWFqb3JUaWNrV2lkdGgsXHJcblx0XHRcdFx0XHRtaW5vclRpY2tXaWR0aCxcclxuXHRcdFx0XHRcdG1pbm9yVGlja3NQZXIxMEttcGgsXHJcblx0XHRcdFx0XHRhbHRJbmRpY2F0b3JIZWlnaHQsXHJcblx0XHRcdFx0XHRzcGVlZFxyXG5cdFx0XHRcdH0gID0gb3B0aW9uc1xyXG5cclxuXHJcblx0XHRcdFx0Y3R4LnNhdmUoKTtcclxuXHRcdFx0XHRjdHgudHJhbnNsYXRlKGN0eC5jYW52YXMud2lkdGggLyAyLCBjdHguY2FudmFzLmhlaWdodCAvIDIpO1xyXG5cdFx0XHRcdGN0eC50cmFuc2xhdGUoLXplcm9XaWR0aCAvIDIgLSB6ZXJvUGFkZGluZyAtIHNwZWVkSW5kaWNhdG9yV2lkdGgsIDApO1xyXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwnICsgc3BlZWRBbHRPcGFjaXR5ICsgJyknO1xyXG5cdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9ICd3aGl0ZSc7XHJcblx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IDI7XHJcblx0XHRcdFx0Y3R4LnN0cm9rZVJlY3QoMCwgLXNwZWVkSW5kaWNhdG9ySGVpZ2h0IC8gMiwgc3BlZWRJbmRpY2F0b3JXaWR0aCwgc3BlZWRJbmRpY2F0b3JIZWlnaHQpO1xyXG5cdFx0XHRcdGN0eC5maWxsUmVjdCgwLCAtc3BlZWRJbmRpY2F0b3JIZWlnaHQgLyAyLCBzcGVlZEluZGljYXRvcldpZHRoLCBzcGVlZEluZGljYXRvckhlaWdodCk7XHJcblx0XHRcdFx0Y3R4LnJlc3RvcmUoKTtcclxuXHRcdFx0XHRjdHguc2F2ZSgpO1xyXG5cdFx0XHRcdGN0eC50cmFuc2xhdGUoY3R4LmNhbnZhcy53aWR0aCAvIDIsIGN0eC5jYW52YXMuaGVpZ2h0IC8gMik7XHJcblx0XHRcdFx0Y3R4LnRyYW5zbGF0ZSgtemVyb1dpZHRoIC8gMiAtIHplcm9QYWRkaW5nIC0gc3BlZWRJbmRpY2F0b3JXaWR0aCwgMCk7XHJcblx0XHRcdFx0Y3R4LnJlY3QoMCwgLXNwZWVkSW5kaWNhdG9ySGVpZ2h0IC8gMiwgc3BlZWRJbmRpY2F0b3JXaWR0aCwgc3BlZWRJbmRpY2F0b3JIZWlnaHQpO1xyXG5cdFx0XHRcdGN0eC5jbGlwKCk7XHJcblx0XHRcdFx0dmFyIHllbGxvd0JvdW5kYXJ5WSA9IC0oLXNwZWVkICsgeWVsbG93Qm91bmRhcnlTcGVlZCkgLyAxMCAqIHBpeGVsc1BlcjEwS21waDtcclxuXHRcdFx0XHR2YXIgcmVkQm91bmRhcnlZID0gLSgtc3BlZWQgKyByZWRCb3VuZGFyeVNwZWVkKSAvIDEwICogcGl4ZWxzUGVyMTBLbXBoO1xyXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSAneWVsbG93JztcclxuXHRcdFx0XHRjdHguZmlsbFJlY3Qoc3BlZWRJbmRpY2F0b3JXaWR0aCAtIHNwZWVkV2FybmluZ1dpZHRoLCB5ZWxsb3dCb3VuZGFyeVksIHNwZWVkV2FybmluZ1dpZHRoLCByZWRCb3VuZGFyeVkgLSB5ZWxsb3dCb3VuZGFyeVkpO1xyXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSAncmVkJztcclxuXHRcdFx0XHRjdHguZmlsbFJlY3Qoc3BlZWRJbmRpY2F0b3JXaWR0aCAtIHNwZWVkV2FybmluZ1dpZHRoLCByZWRCb3VuZGFyeVksIHNwZWVkV2FybmluZ1dpZHRoLCAtc3BlZWRJbmRpY2F0b3JIZWlnaHQgLyAyIC0gcmVkQm91bmRhcnlZKTtcclxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gJ2dyZWVuJztcclxuXHRcdFx0XHRjdHguZmlsbFJlY3Qoc3BlZWRJbmRpY2F0b3JXaWR0aCAtIHNwZWVkV2FybmluZ1dpZHRoLCB5ZWxsb3dCb3VuZGFyeVksIHNwZWVkV2FybmluZ1dpZHRoLCArc3BlZWRJbmRpY2F0b3JIZWlnaHQgLyAyIC0geWVsbG93Qm91bmRhcnlZKTtcclxuXHRcdFx0XHR2YXIgeU9mZnNldCA9IHNwZWVkIC8gMTAgKiBwaXhlbHNQZXIxMEttcGg7XHJcblx0XHRcdFx0Ly8gVGhlIHVuY2xpcHBlZCB0aWNrcyB0byBiZSByZW5kZXJlZC5cclxuXHRcdFx0XHQvLyBXZSByZW5kZXIgMTAwa21waCBlaXRoZXIgc2lkZSBvZiB0aGUgY2VudGVyIHRvIGJlIHNhZmVcclxuXHRcdFx0XHR2YXIgZnJvbSA9IC1NYXRoLmZsb29yKHNwZWVkIC8gMTApIC0gMTA7XHJcblx0XHRcdFx0dmFyIHRvID0gTWF0aC5jZWlsKHNwZWVkIC8gMTApICsgMTA7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IGZyb207IGkgPCB0bzsgKytpKSB7XHJcblx0XHRcdFx0XHRjdHgubW92ZVRvKHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCwgLWkgKiBwaXhlbHNQZXIxMEttcGggKyB5T2Zmc2V0KTtcclxuXHRcdFx0XHRcdGN0eC5saW5lVG8oc3BlZWRJbmRpY2F0b3JXaWR0aCAtIHNwZWVkV2FybmluZ1dpZHRoIC0gbWFqb3JUaWNrV2lkdGgsIC1pICogcGl4ZWxzUGVyMTBLbXBoICsgeU9mZnNldCk7XHJcblx0XHRcdFx0XHRmb3IgKGogPSAxOyBqIDwgbWlub3JUaWNrc1BlcjEwS21waDsgKytqKSB7XHJcblx0XHRcdFx0XHQgIGN0eC5tb3ZlVG8oc3BlZWRJbmRpY2F0b3JXaWR0aCAtIHNwZWVkV2FybmluZ1dpZHRoLCAtaSAqIHBpeGVsc1BlcjEwS21waCAtIGogKiBwaXhlbHNQZXIxMEttcGggLyBtaW5vclRpY2tzUGVyMTBLbXBoICsgeU9mZnNldCk7XHJcblx0XHRcdFx0XHQgIGN0eC5saW5lVG8oc3BlZWRJbmRpY2F0b3JXaWR0aCAtIHNwZWVkV2FybmluZ1dpZHRoIC0gbWlub3JUaWNrV2lkdGgsIC1pICogcGl4ZWxzUGVyMTBLbXBoIC0gaiAqIHBpeGVsc1BlcjEwS21waCAvIG1pbm9yVGlja3NQZXIxMEttcGggKyB5T2Zmc2V0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGN0eC5mb250ID0gJzEycHggQXJpYWwnO1xyXG5cdFx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcblx0XHRcdFx0XHRjdHguZmlsbFRleHQoaSAqIDEwLCAyMCwgLWkgKiBwaXhlbHNQZXIxMEttcGggKyB5T2Zmc2V0ICsgNCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9ICd3aGl0ZSc7XHJcblx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IDI7XHJcblx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xyXG5cdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcclxuXHRcdFx0XHRjdHgubW92ZVRvKHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCAtIG1pbm9yVGlja1dpZHRoLCAwKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCAtIG1pbm9yVGlja1dpZHRoICogMiwgLTUpO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8oc3BlZWRJbmRpY2F0b3JXaWR0aCAtIHNwZWVkV2FybmluZ1dpZHRoIC0gbWlub3JUaWNrV2lkdGggKiAyLCAtMTApO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8oMCwgLTEwKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKDAsIDEwKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCAtIG1pbm9yVGlja1dpZHRoICogMiwgMTApO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8oc3BlZWRJbmRpY2F0b3JXaWR0aCAtIHNwZWVkV2FybmluZ1dpZHRoIC0gbWlub3JUaWNrV2lkdGggKiAyLCA1KTtcclxuXHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XHJcblx0XHRcdFx0Y3R4LmZpbGwoKTtcclxuXHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSAnYmxhY2snO1xyXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSAnYmxhY2snO1xyXG5cdFx0XHRcdGN0eC5maWxsVGV4dChNYXRoLnJvdW5kKHNwZWVkICogMTAwKSAvIDEwMCwgMTUsIDQuNSwgYWx0SW5kaWNhdG9ySGVpZ2h0KTtcclxuXHRcdFx0XHRjdHgucmVzdG9yZSgpO1xyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGRyYXdBbHRpdHVkZSgpIHtcclxuXHJcblx0XHRcdFx0dmFyIHtcclxuXHRcdFx0XHRcdHplcm9XaWR0aCxcclxuXHRcdFx0XHRcdHplcm9QYWRkaW5nLFxyXG5cdFx0XHRcdFx0c3BlZWRBbHRPcGFjaXR5LFxyXG5cdFx0XHRcdFx0YWx0SW5kaWNhdG9ySGVpZ2h0LFxyXG5cdFx0XHRcdFx0YWx0SW5kaWNhdG9yV2lkdGgsXHJcblx0XHRcdFx0XHRwaXhlbHNQZXIxMDBGdCxcclxuXHRcdFx0XHRcdG1pbm9yVGlja1dpZHRoLFxyXG5cdFx0XHRcdFx0bWFqb3JUaWNrV2lkdGgsXHJcblx0XHRcdFx0XHRtaW5vclRpY2tzUGVyMTAwRnQsXHJcblx0XHRcdFx0XHRhbHRpdHVkZVxyXG5cdFx0XHRcdH0gPSBvcHRpb25zXHJcblxyXG5cdFx0XHRcdGN0eC5zYXZlKCk7XHJcblx0XHRcdFx0Y3R4LnRyYW5zbGF0ZShjdHguY2FudmFzLndpZHRoIC8gMiwgY3R4LmNhbnZhcy5oZWlnaHQgLyAyKTtcclxuXHRcdFx0XHRjdHgudHJhbnNsYXRlKHplcm9XaWR0aCAvIDIgKyB6ZXJvUGFkZGluZywgMCk7XHJcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLCcgKyBzcGVlZEFsdE9wYWNpdHkgKyAnKSc7XHJcblx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gJ3doaXRlJztcclxuXHRcdFx0XHRjdHgubGluZVdpZHRoID0gMjtcclxuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgLWFsdEluZGljYXRvckhlaWdodCAvIDIsIGFsdEluZGljYXRvcldpZHRoLCBhbHRJbmRpY2F0b3JIZWlnaHQpO1xyXG5cdFx0XHRcdGN0eC5zdHJva2VSZWN0KDAsIC1hbHRJbmRpY2F0b3JIZWlnaHQgLyAyLCBhbHRJbmRpY2F0b3JXaWR0aCwgYWx0SW5kaWNhdG9ySGVpZ2h0KTtcclxuXHRcdFx0XHRjdHgucmVzdG9yZSgpO1xyXG5cdFx0XHRcdGN0eC5zYXZlKCk7XHJcblx0XHRcdFx0Y3R4LnRyYW5zbGF0ZShjdHguY2FudmFzLndpZHRoIC8gMiwgY3R4LmNhbnZhcy5oZWlnaHQgLyAyKTtcclxuXHRcdFx0XHRjdHgudHJhbnNsYXRlKHplcm9XaWR0aCAvIDIgKyB6ZXJvUGFkZGluZywgMCk7XHJcblx0XHRcdFx0Y3R4LnJlY3QoMCwgLWFsdEluZGljYXRvckhlaWdodCAvIDIsIGFsdEluZGljYXRvcldpZHRoLCBhbHRJbmRpY2F0b3JIZWlnaHQpO1xyXG5cdFx0XHRcdGN0eC5jbGlwKCk7XHJcblx0XHRcdFx0dmFyIHlPZmZzZXQgPSBhbHRpdHVkZSAvIDEgKiBwaXhlbHNQZXIxMDBGdDtcclxuXHRcdFx0XHQvLyBUaGUgdW5jbGlwcGVkIHRpY2tzIHRvIGJlIHJlbmRlcmVkLiBXZSByZW5kZXIgNTAwZnQgZWl0aGVyIHNpZGUgb2ZcclxuXHRcdFx0XHQvLyB0aGUgY2VudGVyIHRvIGJlIHNhZmVcclxuXHRcdFx0XHR2YXIgZnJvbSA9IE1hdGguZmxvb3IoYWx0aXR1ZGUgLyAxKSAtIDU7XHJcblx0XHRcdFx0dmFyIHRvID0gTWF0aC5jZWlsKGFsdGl0dWRlIC8gMSkgKyA1O1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSBmcm9tOyBpIDwgdG87ICsraSkge1xyXG5cdFx0XHRcdFx0Y3R4Lm1vdmVUbygwLCAtaSAqIHBpeGVsc1BlcjEwMEZ0ICsgeU9mZnNldCk7XHJcblx0XHRcdFx0XHRjdHgubGluZVRvKG1ham9yVGlja1dpZHRoLCAtaSAqIHBpeGVsc1BlcjEwMEZ0ICsgeU9mZnNldCk7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBqID0gMTsgaiA8IG1pbm9yVGlja3NQZXIxMDBGdDsgKytqKSB7XHJcblx0XHRcdFx0XHRcdCAgY3R4Lm1vdmVUbygwLCAtaSAqIHBpeGVsc1BlcjEwMEZ0IC0gaiAqIHBpeGVsc1BlcjEwMEZ0IC8gbWlub3JUaWNrc1BlcjEwMEZ0ICsgeU9mZnNldCk7XHJcblx0XHRcdFx0XHRcdCAgY3R4LmxpbmVUbyhtaW5vclRpY2tXaWR0aCwgLWkgKiBwaXhlbHNQZXIxMDBGdCAtIGogKiBwaXhlbHNQZXIxMDBGdCAvIG1pbm9yVGlja3NQZXIxMDBGdCArIHlPZmZzZXQpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Y3R4LmZvbnQgPSAnMTJweCBBcmlhbCc7XHJcblx0XHRcdFx0XHRjdHguZmlsbFN0eWxlID0gJ3doaXRlJztcclxuXHRcdFx0XHRcdGN0eC5maWxsVGV4dChpICogMSwgMTUsIC1pICogcGl4ZWxzUGVyMTAwRnQgKyB5T2Zmc2V0ICsgNCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9ICd3aGl0ZSc7XHJcblx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IDI7XHJcblx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xyXG5cdFx0XHRcdGN0eC5yZXN0b3JlKCk7XHJcblx0XHRcdFx0Y3R4LnNhdmUoKTtcclxuXHRcdFx0XHRjdHgudHJhbnNsYXRlKGN0eC5jYW52YXMud2lkdGggLyAyLCBjdHguY2FudmFzLmhlaWdodCAvIDIpO1xyXG5cdFx0XHRcdGN0eC50cmFuc2xhdGUoemVyb1dpZHRoIC8gMiArIHplcm9QYWRkaW5nLCAwKTtcclxuXHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSAnd2hpdGUnO1xyXG5cdFx0XHRcdGN0eC5saW5lV2lkdGggPSAyO1xyXG5cdFx0XHRcdGN0eC5mb250ID0gJzEycHggQXJpYWwnO1xyXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSAnd2hpdGUnO1xyXG5cdFx0XHRcdGN0eC5maWxsT3BhY2l0eSA9IDE7XHJcblx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xyXG5cdFx0XHRcdGN0eC5tb3ZlVG8obWlub3JUaWNrV2lkdGgsIDApO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8obWlub3JUaWNrV2lkdGggKiAyLCAtNSk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbyhtaW5vclRpY2tXaWR0aCAqIDIsIC0xMCk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbyhhbHRJbmRpY2F0b3JXaWR0aCwgLTEwKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKGFsdEluZGljYXRvcldpZHRoLCAxMCk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbyhtaW5vclRpY2tXaWR0aCAqIDIsIDEwKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKG1pbm9yVGlja1dpZHRoICogMiwgNSk7XHJcblx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xyXG5cdFx0XHRcdGN0eC5maWxsKCk7XHJcblx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gJ2JsYWNrJztcclxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gJ2JsYWNrJztcclxuXHRcdFx0XHRjdHguZmlsbFRleHQoTWF0aC5yb3VuZChhbHRpdHVkZSAqIDEwMCkgLyAxMDAsIDE1LCA0LjUsIGFsdEluZGljYXRvckhlaWdodCk7XHJcblx0XHRcdFx0Y3R4LnJlc3RvcmUoKTtcclxuXHRcdFx0fVx0XHRcdFxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gcmVuZGVyKCkge1xyXG5cdFx0XHRcdGRyYXdIb3Jpem9uKClcclxuXHRcdFx0XHRkcmF3WmVybygpXHJcblx0XHRcdFx0ZHJhd1JvbGwoKVxyXG5cdFx0XHRcdGRyYXdTcGVlZCgpXHJcblx0XHRcdFx0ZHJhd0FsdGl0dWRlKClcclxuXHRcdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0XHRyZW5kZXIoKVxyXG5cclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRzZXRSb2xsOiBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdFx0b3B0aW9ucy5yb2xsID0gdmFsdWVcclxuXHRcdFx0XHRcdHJvbGxSYWQgPSB0b1JhZCh2YWx1ZSlcclxuXHRcdFx0XHRcdHJlbmRlcigpXHRcdFx0XHRcclxuXHRcdFx0XHR9LFxyXG5cclxuXHJcblx0XHRcdFx0c2V0U3BlZWQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRvcHRpb25zLnNwZWVkID0gdmFsdWVcclxuXHRcdFx0XHRcdHJlbmRlcigpXHRcdFx0XHRcdFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0c2V0UGl0Y2g6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRvcHRpb25zLnBpdGNoID0gdmFsdWVcclxuXHRcdFx0XHRcdHBpdGNoUmFkID0gdG9SYWQodmFsdWUpXHJcblx0XHRcdFx0XHRyZW5kZXIoKVx0XHRcdFx0XHJcblx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0c2V0QWx0aXR1ZGU6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRvcHRpb25zLmFsdGl0dWRlID0gdmFsdWVcclxuXHRcdFx0XHRcdHJlbmRlcigpXHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG5cclxufSkoKTsiXX0=
