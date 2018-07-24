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

			this.setRoll = function(value) {
				options.roll = value
				rollRad = toRad(value)
				render()				
			}


			this.setSpeed = function(value) {
				options.speed = value
				render()					
			},
			
			this.setPitch = function(value) {
				options.pitch = value
				pitchRad = toRad(value)
				render()				
			},

			this.setAltitude = function(value) {
				options.altitude = value
				render()				
			}

			
		}
	})


})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZsaWdodHBhbmVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImZsaWdodC5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcclxuXHJcblx0ZnVuY3Rpb24gdG9SYWQodmFsKSB7XHJcblx0XHRyZXR1cm4gdmFsKk1hdGguUEkvMTgwXHJcblx0fVx0XHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdGbGlnaHRQYW5lbENvbnRyb2wnLCAge1xyXG5cclxuXHRcdHByb3BzOiB7XHJcblx0XHRcdHJvbGw6IHt2YWw6IDAsIHNldDogJ3NldFJvbGwnfSxcclxuXHRcdFx0cGl0Y2g6IHt2YWw6IDAsIHNldDogJ3NldFBpdGNoJ30sXHJcblx0XHRcdHNwZWVkOiB7dmFsOiAwLCBzZXQ6ICdzZXRTcGVlZCd9LFxyXG5cdFx0XHRhbHRpdHVkZToge3ZhbDogMCwgc2V0OiAnc2V0QWx0aXR1ZGUnfVx0XHRcclxuXHRcdH0sXHJcblxyXG5cclxuXHRcdG9wdGlvbnM6IHtcclxuXHRcdFx0c2t5Q29sb3I6ICcjMzNmJyxcclxuXHRcdFx0ZWFydGhDb2xvcjogJyM5OTInLFxyXG5cdFx0XHRmcm9udENhbWVyYUZvdlk6IDIwMCxcclxuXHRcdFx0bWFqb3JXaWR0aDogMTAwLFxyXG5cdFx0XHRtaW5vcldpZHRoOiA2MCxcclxuXHRcdFx0emVyb1dpZHRoOiAyMDAsXHJcblx0XHRcdHplcm9HYXA6IDIwLFxyXG5cdFx0XHRyYWRpYWxMaW1pdDogNjAsXHJcblx0XHRcdHRpY2tSYWRpdXM6IDEwLFxyXG5cdFx0XHRyYWRpYWxSYWRpdXM6IDE3OCxcclxuXHRcdFx0c3BlZWRJbmRpY2F0b3JIZWlnaHQ6IDI1MCxcclxuXHRcdFx0c3BlZWRJbmRpY2F0b3JXaWR0aDogNjAsXHJcblx0XHRcdHplcm9QYWRkaW5nOiAxMDAsXHJcblx0XHRcdHNwZWVkQWx0T3BhY2l0eTogMC4yLFxyXG5cdFx0XHRwaXhlbHNQZXIxMEttcGg6IDUwLFxyXG5cdFx0XHRtaW5vclRpY2tzUGVyMTBLbXBoOiA1LFxyXG5cdFx0XHRzcGVlZFdhcm5pbmdXaWR0aDogMTAsXHJcblxyXG5cdFx0XHR5ZWxsb3dCb3VuZGFyeVNwZWVkOiAxMDAsXHJcblx0XHRcdHJlZEJvdW5kYXJ5U3BlZWQ6IDEzMCxcclxuXHJcblx0XHRcdGFsdEluZGljYXRvckhlaWdodDogMjUwLFxyXG5cdFx0XHRhbHRJbmRpY2F0b3JXaWR0aDogNTAsXHJcblx0XHRcdG1ham9yVGlja1dpZHRoOiAxMCxcclxuXHRcdFx0bWlub3JUaWNrV2lkdGg6IDUsXHJcblx0XHRcdHBpeGVsc1BlcjEwMEZ0OiA1MCxcclxuXHRcdFx0bWlub3JUaWNrc1BlcjEwMEZ0OiA1XHRcdFx0XHRcclxuXHRcdH0sXHJcblxyXG5cdFx0XG5cdGxpYjogJ2ZsaWdodCcsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRcdHZhciBjYW52YXMgPSAkKCc8Y2FudmFzPicpLmF0dHIoJ3dpZHRoJywgNjQwKS5hdHRyKCdoZWlnaHQnLCAzNjApLmFwcGVuZFRvKGVsdClcclxuXHJcblxyXG5cdFx0XHR2YXIgY3R4ID0gY2FudmFzLmdldCgwKS5nZXRDb250ZXh0KCcyZCcpXHJcblx0XHRcdHZhciBwaXhlbHNQZXJEZWcgPSBjdHguY2FudmFzLmhlaWdodCAvIChvcHRpb25zLmZyb250Q2FtZXJhRm92WSAvIDIpXHQgXHJcblxyXG5cdFx0XHR2YXIgcm9sbFJhZCA9IHRvUmFkKG9wdGlvbnMucm9sbClcclxuXHRcdFx0dmFyIHBpdGNoUmFkID0gdG9SYWQob3B0aW9ucy5waXRjaClcclxuXHJcblx0XHRcdC8vY29uc29sZS5sb2coYHdpZHRoOiAke2N0eC5jYW52YXMud2lkdGh9LCBoZWlnaHQ6ICR7Y3R4LmNhbnZhcy5oZWlnaHR9YClcclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBkcmF3SG9yaXpvbigpIHtcclxuXHJcblx0XHRcdFx0dmFyIHtyYWRpYWxSYWRpdXMsIG1ham9yV2lkdGgsIG1pbm9yV2lkdGgsIHNreUNvbG9yLCBlYXJ0aENvbG9yfSA9IG9wdGlvbnNcclxuXHJcblx0XHRcdCAgY3R4LnNhdmUoKTtcclxuXHRcdFx0ICBjdHgudHJhbnNsYXRlKGN0eC5jYW52YXMud2lkdGggLyAyLCBjdHguY2FudmFzLmhlaWdodCAvIDIpO1xyXG5cdFx0XHQgIGN0eC5yb3RhdGUoLXJvbGxSYWQpO1xyXG5cdFx0XHQgIHZhciBwaXRjaFBpeGVscyA9IHBpdGNoUmFkIC8gKE1hdGguUEkgKiAyKSAqIDM2MCAqIHBpeGVsc1BlckRlZztcclxuXHRcdFx0ICBjdHgudHJhbnNsYXRlKDAsIHBpdGNoUGl4ZWxzKTtcclxuXHRcdFx0ICBcclxuXHRcdFx0ICAgY3R4LmZpbGxTdHlsZSA9IHNreUNvbG9yO1xyXG5cdFx0XHQgICBjdHguZmlsbFJlY3QoLTEwMDAwLCAtMTAwMDAsIDIwMDAwLCAxMDAwMCk7XHJcblx0XHRcdCAgIGN0eC5maWxsU3R5bGUgPSBlYXJ0aENvbG9yO1xyXG5cdFx0XHQgICBjdHguZmlsbFJlY3QoLTEwMDAwLCAwLCAyMDAwMCwgMTAwMDApO1xyXG5cdFx0XHQgIFxyXG5cdFx0XHQgIC8vIGhvcml6b25cclxuXHRcdFx0ICBjdHguc3Ryb2tlU3R5bGUgPSAnI2ZmZic7XHJcblx0XHRcdCAgY3R4LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcblx0XHRcdCAgY3R4LmxpbmVXaWR0aCA9IDI7XHJcblx0XHRcdCAgY3R4LmJlZ2luUGF0aCgpO1xyXG5cdFx0XHQgIGN0eC5tb3ZlVG8oLTEwMDAwLCAwKTtcclxuXHRcdFx0ICBjdHgubGluZVRvKDIwMDAwLCAwKTtcclxuXHRcdFx0ICBjdHguc3Ryb2tlKCk7XHJcblxyXG5cdFx0XHQgIGN0eC5iZWdpblBhdGgoKTtcclxuXHRcdFx0ICBjdHguYXJjKDAsIC1waXRjaFBpeGVscywgcmFkaWFsUmFkaXVzLCAwLCBNYXRoLlBJICogMiwgZmFsc2UpO1xyXG5cdFx0XHQgIGN0eC5jbG9zZVBhdGgoKTtcclxuXHRcdFx0ICBjdHguY2xpcCgpO1xyXG5cclxuXHRcdFx0ICBjdHguYmVnaW5QYXRoKCk7XHJcblx0XHRcdCAgZm9yICh2YXIgaSA9IC0xODsgaSA8PSAxODsgKytpKSB7XHJcblx0XHRcdCAgICB2YXIgcGl0Y2hBbmdsZSA9IGkgLyAyICogMTA7XHJcblx0XHRcdCAgICBpZiAoaSAhPT0gMCkge1xyXG5cdFx0XHQgICAgICBpZiAoaSAlIDIgPT09IDApIHtcclxuXHRcdFx0ICAgICAgICBjdHgubW92ZVRvKC1tYWpvcldpZHRoIC8gMiwgLXBpeGVsc1BlckRlZyAqIHBpdGNoQW5nbGUpO1xyXG5cdFx0XHQgICAgICAgIGN0eC5saW5lVG8oK21ham9yV2lkdGggLyAyLCAtcGl4ZWxzUGVyRGVnICogcGl0Y2hBbmdsZSk7XHJcblx0XHRcdCAgICAgICAgY3R4LmZpbGxUZXh0KHBpdGNoQW5nbGUsIC1tYWpvcldpZHRoIC8gMiAtIDIwLCAtcGl4ZWxzUGVyRGVnICogMTAgLyAyICogaSk7XHJcblx0XHRcdCAgICAgICAgY3R4LmZpbGxUZXh0KHBpdGNoQW5nbGUsIG1ham9yV2lkdGggLyAyICsgMTAsIC1waXhlbHNQZXJEZWcgKiAxMCAvIDIgKiBpKTtcclxuXHRcdFx0ICAgICAgfSBlbHNlIHtcclxuXHRcdFx0ICAgICAgICBjdHgubW92ZVRvKC1taW5vcldpZHRoIC8gMiwgLXBpeGVsc1BlckRlZyAqIHBpdGNoQW5nbGUpO1xyXG5cdFx0XHQgICAgICAgIGN0eC5saW5lVG8oK21pbm9yV2lkdGggLyAyLCAtcGl4ZWxzUGVyRGVnICogcGl0Y2hBbmdsZSk7XHJcblx0XHRcdCAgICAgIH1cclxuXHRcdFx0ICAgIH1cclxuXHRcdFx0ICB9XHJcblx0XHRcdCAgY3R4LmNsb3NlUGF0aCgpO1xyXG5cdFx0XHQgIGN0eC5zdHJva2UoKTtcclxuXHRcdFx0ICBjdHgucmVzdG9yZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBkcmF3WmVybygpIHtcclxuXHJcblx0XHRcdFx0dmFyIHt6ZXJvV2lkdGgsIHplcm9HYXAsIHJhZGlhbFJhZGl1cywgcmFkaWFsTGltaXQsIHRpY2tSYWRpdXN9ID0gb3B0aW9uc1xyXG5cclxuXHRcdFx0XHRjdHguc2F2ZSgpO1xyXG5cdFx0XHRcdGN0eC50cmFuc2xhdGUoY3R4LmNhbnZhcy53aWR0aCAvIDIsIGN0eC5jYW52YXMuaGVpZ2h0IC8gMik7XHJcblx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gJ3llbGxvdyc7XHJcblx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IDI7XHJcblx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xyXG5cdFx0XHRcdGN0eC5tb3ZlVG8oLXplcm9XaWR0aCAvIDIsIDApO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8oLXplcm9HYXAgLyAyLCAwKTtcclxuXHRcdFx0XHRjdHgubW92ZVRvKCt6ZXJvV2lkdGggLyAyLCAwKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKCt6ZXJvR2FwIC8gMiwgMCk7XHJcblx0XHRcdFx0Y3R4Lm1vdmVUbygtemVyb0dhcCAvIDIsIHplcm9HYXAgLyAyKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKDAsIDApO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8oK3plcm9HYXAgLyAyLCB6ZXJvR2FwIC8gMik7XHJcblx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xyXG5cdFx0XHRcdC8vIFRoZSByYWRpYWwgcm9sbCBpbmRpY2F0b3JcclxuXHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XHJcblx0XHRcdFx0Y3R4LmFyYygwLCAwLCByYWRpYWxSYWRpdXMsIC1NYXRoLlBJIC8gMiAtIE1hdGguUEkgKiByYWRpYWxMaW1pdCAvIDE4MCwgLU1hdGguUEkgLyAyICsgTWF0aC5QSSAqIHJhZGlhbExpbWl0IC8gMTgwLCBmYWxzZSk7XHJcblx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAtNDsgaSA8PSA0OyArK2kpIHtcclxuXHRcdFx0XHRcdGN0eC5tb3ZlVG8oKHJhZGlhbFJhZGl1cyAtIHRpY2tSYWRpdXMpICogTWF0aC5jb3MoLU1hdGguUEkgLyAyICsgaSAqIDE1IC8gMTgwICogTWF0aC5QSSksIChyYWRpYWxSYWRpdXMgLSB0aWNrUmFkaXVzKSAqIE1hdGguc2luKC1NYXRoLlBJIC8gMiArIGkgKiAxNSAvIDE4MCAqIE1hdGguUEkpKTtcclxuXHRcdFx0XHRcdGN0eC5saW5lVG8ocmFkaWFsUmFkaXVzICogTWF0aC5jb3MoLU1hdGguUEkgLyAyICsgaSAqIDE1IC8gMTgwICogTWF0aC5QSSksIHJhZGlhbFJhZGl1cyAqIE1hdGguc2luKC1NYXRoLlBJIC8gMiArIGkgKiAxNSAvIDE4MCAqIE1hdGguUEkpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xyXG5cdFx0XHRcdGN0eC5yZXN0b3JlKCk7XHJcblx0XHRcdH1cdFxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZHJhd1JvbGwoKSB7XHJcblxyXG5cdFx0XHRcdHZhciB7cmFkaWFsUmFkaXVzfSA9IG9wdGlvbnNcclxuXHJcblx0XHRcdFx0Y3R4LnNhdmUoKTtcclxuXHRcdFx0XHRjdHgudHJhbnNsYXRlKGN0eC5jYW52YXMud2lkdGggLyAyLCBjdHguY2FudmFzLmhlaWdodCAvIDIpO1xyXG5cdFx0XHRcdGN0eC5yb3RhdGUoLXJvbGxSYWQpO1xyXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSAnd2hpdGUnO1xyXG5cdFx0XHRcdGN0eC5saW5lV2lkdGggPSAyO1xyXG5cdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcclxuXHRcdFx0XHRjdHgubW92ZVRvKDAsIC1yYWRpYWxSYWRpdXMpO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8oLTUsIC1yYWRpYWxSYWRpdXMgKyAxMCk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbygrNSwgLXJhZGlhbFJhZGl1cyArIDEwKTtcclxuXHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XHJcblx0XHRcdFx0Y3R4LmZpbGwoKTtcclxuXHRcdFx0XHR2YXIgcmVhZGFibGVSb2xsQW5nbGUgPSBNYXRoLnJvdW5kKHJvbGxSYWQgLyBNYXRoLlBJIC8gMiAqIDM2MCkgJSAzNjA7XHJcblx0XHRcdFx0aWYgKHJlYWRhYmxlUm9sbEFuZ2xlID4gMTgwKSB7XHJcblx0XHRcdFx0XHRyZWFkYWJsZVJvbGxBbmdsZSA9IHJlYWRhYmxlUm9sbEFuZ2xlIC0gMzYwO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjdHguZmlsbFJlY3QoLTIwLCAtcmFkaWFsUmFkaXVzICsgOSwgNDAsIDE2KTtcclxuXHRcdFx0XHRjdHguZm9udCA9ICcxMnB4IEFyaWFsJztcclxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gJ2JsYWNrJztcclxuXHRcdFx0XHRjdHguZmlsbFRleHQocmVhZGFibGVSb2xsQW5nbGUsIC03LCAtcmFkaWFsUmFkaXVzICsgMjIpO1xyXG5cdFx0XHRcdGN0eC5yZXN0b3JlKCk7XHJcblx0XHRcdH1cdFx0XHRcclxuXHJcblx0XHRcdGZ1bmN0aW9uIGRyYXdTcGVlZCgpIHtcclxuXHJcblx0XHRcdFx0dmFyIHtcclxuXHRcdFx0XHRcdHNwZWVkSW5kaWNhdG9ySGVpZ2h0LFxyXG5cdFx0XHRcdFx0c3BlZWRJbmRpY2F0b3JXaWR0aCxcclxuXHRcdFx0XHRcdHNwZWVkV2FybmluZ1dpZHRoLFxyXG5cdFx0XHRcdFx0emVyb1BhZGRpbmcsXHJcblx0XHRcdFx0XHR6ZXJvV2lkdGgsXHJcblx0XHRcdFx0XHRzcGVlZEFsdE9wYWNpdHksXHJcblx0XHRcdFx0XHR5ZWxsb3dCb3VuZGFyeVNwZWVkLFxyXG5cdFx0XHRcdFx0cmVkQm91bmRhcnlTcGVlZCxcclxuXHRcdFx0XHRcdHBpeGVsc1BlcjEwS21waCxcclxuXHRcdFx0XHRcdG1ham9yVGlja1dpZHRoLFxyXG5cdFx0XHRcdFx0bWlub3JUaWNrV2lkdGgsXHJcblx0XHRcdFx0XHRtaW5vclRpY2tzUGVyMTBLbXBoLFxyXG5cdFx0XHRcdFx0YWx0SW5kaWNhdG9ySGVpZ2h0LFxyXG5cdFx0XHRcdFx0c3BlZWRcclxuXHRcdFx0XHR9ICA9IG9wdGlvbnNcclxuXHJcblxyXG5cdFx0XHRcdGN0eC5zYXZlKCk7XHJcblx0XHRcdFx0Y3R4LnRyYW5zbGF0ZShjdHguY2FudmFzLndpZHRoIC8gMiwgY3R4LmNhbnZhcy5oZWlnaHQgLyAyKTtcclxuXHRcdFx0XHRjdHgudHJhbnNsYXRlKC16ZXJvV2lkdGggLyAyIC0gemVyb1BhZGRpbmcgLSBzcGVlZEluZGljYXRvcldpZHRoLCAwKTtcclxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsJyArIHNwZWVkQWx0T3BhY2l0eSArICcpJztcclxuXHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSAnd2hpdGUnO1xyXG5cdFx0XHRcdGN0eC5saW5lV2lkdGggPSAyO1xyXG5cdFx0XHRcdGN0eC5zdHJva2VSZWN0KDAsIC1zcGVlZEluZGljYXRvckhlaWdodCAvIDIsIHNwZWVkSW5kaWNhdG9yV2lkdGgsIHNwZWVkSW5kaWNhdG9ySGVpZ2h0KTtcclxuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgLXNwZWVkSW5kaWNhdG9ySGVpZ2h0IC8gMiwgc3BlZWRJbmRpY2F0b3JXaWR0aCwgc3BlZWRJbmRpY2F0b3JIZWlnaHQpO1xyXG5cdFx0XHRcdGN0eC5yZXN0b3JlKCk7XHJcblx0XHRcdFx0Y3R4LnNhdmUoKTtcclxuXHRcdFx0XHRjdHgudHJhbnNsYXRlKGN0eC5jYW52YXMud2lkdGggLyAyLCBjdHguY2FudmFzLmhlaWdodCAvIDIpO1xyXG5cdFx0XHRcdGN0eC50cmFuc2xhdGUoLXplcm9XaWR0aCAvIDIgLSB6ZXJvUGFkZGluZyAtIHNwZWVkSW5kaWNhdG9yV2lkdGgsIDApO1xyXG5cdFx0XHRcdGN0eC5yZWN0KDAsIC1zcGVlZEluZGljYXRvckhlaWdodCAvIDIsIHNwZWVkSW5kaWNhdG9yV2lkdGgsIHNwZWVkSW5kaWNhdG9ySGVpZ2h0KTtcclxuXHRcdFx0XHRjdHguY2xpcCgpO1xyXG5cdFx0XHRcdHZhciB5ZWxsb3dCb3VuZGFyeVkgPSAtKC1zcGVlZCArIHllbGxvd0JvdW5kYXJ5U3BlZWQpIC8gMTAgKiBwaXhlbHNQZXIxMEttcGg7XHJcblx0XHRcdFx0dmFyIHJlZEJvdW5kYXJ5WSA9IC0oLXNwZWVkICsgcmVkQm91bmRhcnlTcGVlZCkgLyAxMCAqIHBpeGVsc1BlcjEwS21waDtcclxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gJ3llbGxvdyc7XHJcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCwgeWVsbG93Qm91bmRhcnlZLCBzcGVlZFdhcm5pbmdXaWR0aCwgcmVkQm91bmRhcnlZIC0geWVsbG93Qm91bmRhcnlZKTtcclxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gJ3JlZCc7XHJcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCwgcmVkQm91bmRhcnlZLCBzcGVlZFdhcm5pbmdXaWR0aCwgLXNwZWVkSW5kaWNhdG9ySGVpZ2h0IC8gMiAtIHJlZEJvdW5kYXJ5WSk7XHJcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9ICdncmVlbic7XHJcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCwgeWVsbG93Qm91bmRhcnlZLCBzcGVlZFdhcm5pbmdXaWR0aCwgK3NwZWVkSW5kaWNhdG9ySGVpZ2h0IC8gMiAtIHllbGxvd0JvdW5kYXJ5WSk7XHJcblx0XHRcdFx0dmFyIHlPZmZzZXQgPSBzcGVlZCAvIDEwICogcGl4ZWxzUGVyMTBLbXBoO1xyXG5cdFx0XHRcdC8vIFRoZSB1bmNsaXBwZWQgdGlja3MgdG8gYmUgcmVuZGVyZWQuXHJcblx0XHRcdFx0Ly8gV2UgcmVuZGVyIDEwMGttcGggZWl0aGVyIHNpZGUgb2YgdGhlIGNlbnRlciB0byBiZSBzYWZlXHJcblx0XHRcdFx0dmFyIGZyb20gPSAtTWF0aC5mbG9vcihzcGVlZCAvIDEwKSAtIDEwO1xyXG5cdFx0XHRcdHZhciB0byA9IE1hdGguY2VpbChzcGVlZCAvIDEwKSArIDEwO1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSBmcm9tOyBpIDwgdG87ICsraSkge1xyXG5cdFx0XHRcdFx0Y3R4Lm1vdmVUbyhzcGVlZEluZGljYXRvcldpZHRoIC0gc3BlZWRXYXJuaW5nV2lkdGgsIC1pICogcGl4ZWxzUGVyMTBLbXBoICsgeU9mZnNldCk7XHJcblx0XHRcdFx0XHRjdHgubGluZVRvKHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCAtIG1ham9yVGlja1dpZHRoLCAtaSAqIHBpeGVsc1BlcjEwS21waCArIHlPZmZzZXQpO1xyXG5cdFx0XHRcdFx0Zm9yIChqID0gMTsgaiA8IG1pbm9yVGlja3NQZXIxMEttcGg7ICsraikge1xyXG5cdFx0XHRcdFx0ICBjdHgubW92ZVRvKHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCwgLWkgKiBwaXhlbHNQZXIxMEttcGggLSBqICogcGl4ZWxzUGVyMTBLbXBoIC8gbWlub3JUaWNrc1BlcjEwS21waCArIHlPZmZzZXQpO1xyXG5cdFx0XHRcdFx0ICBjdHgubGluZVRvKHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCAtIG1pbm9yVGlja1dpZHRoLCAtaSAqIHBpeGVsc1BlcjEwS21waCAtIGogKiBwaXhlbHNQZXIxMEttcGggLyBtaW5vclRpY2tzUGVyMTBLbXBoICsgeU9mZnNldCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRjdHguZm9udCA9ICcxMnB4IEFyaWFsJztcclxuXHRcdFx0XHRcdGN0eC5maWxsU3R5bGUgPSAnd2hpdGUnO1xyXG5cdFx0XHRcdFx0Y3R4LmZpbGxUZXh0KGkgKiAxMCwgMjAsIC1pICogcGl4ZWxzUGVyMTBLbXBoICsgeU9mZnNldCArIDQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSAnd2hpdGUnO1xyXG5cdFx0XHRcdGN0eC5saW5lV2lkdGggPSAyO1xyXG5cdFx0XHRcdGN0eC5zdHJva2UoKTtcclxuXHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XHJcblx0XHRcdFx0Y3R4Lm1vdmVUbyhzcGVlZEluZGljYXRvcldpZHRoIC0gc3BlZWRXYXJuaW5nV2lkdGggLSBtaW5vclRpY2tXaWR0aCwgMCk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbyhzcGVlZEluZGljYXRvcldpZHRoIC0gc3BlZWRXYXJuaW5nV2lkdGggLSBtaW5vclRpY2tXaWR0aCAqIDIsIC01KTtcclxuXHRcdFx0XHRjdHgubGluZVRvKHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCAtIG1pbm9yVGlja1dpZHRoICogMiwgLTEwKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKDAsIC0xMCk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbygwLCAxMCk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbyhzcGVlZEluZGljYXRvcldpZHRoIC0gc3BlZWRXYXJuaW5nV2lkdGggLSBtaW5vclRpY2tXaWR0aCAqIDIsIDEwKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKHNwZWVkSW5kaWNhdG9yV2lkdGggLSBzcGVlZFdhcm5pbmdXaWR0aCAtIG1pbm9yVGlja1dpZHRoICogMiwgNSk7XHJcblx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xyXG5cdFx0XHRcdGN0eC5maWxsKCk7XHJcblx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gJ2JsYWNrJztcclxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gJ2JsYWNrJztcclxuXHRcdFx0XHRjdHguZmlsbFRleHQoTWF0aC5yb3VuZChzcGVlZCAqIDEwMCkgLyAxMDAsIDE1LCA0LjUsIGFsdEluZGljYXRvckhlaWdodCk7XHJcblx0XHRcdFx0Y3R4LnJlc3RvcmUoKTtcclxuXHRcdFx0fVx0XHRcclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBkcmF3QWx0aXR1ZGUoKSB7XHJcblxyXG5cdFx0XHRcdHZhciB7XHJcblx0XHRcdFx0XHR6ZXJvV2lkdGgsXHJcblx0XHRcdFx0XHR6ZXJvUGFkZGluZyxcclxuXHRcdFx0XHRcdHNwZWVkQWx0T3BhY2l0eSxcclxuXHRcdFx0XHRcdGFsdEluZGljYXRvckhlaWdodCxcclxuXHRcdFx0XHRcdGFsdEluZGljYXRvcldpZHRoLFxyXG5cdFx0XHRcdFx0cGl4ZWxzUGVyMTAwRnQsXHJcblx0XHRcdFx0XHRtaW5vclRpY2tXaWR0aCxcclxuXHRcdFx0XHRcdG1ham9yVGlja1dpZHRoLFxyXG5cdFx0XHRcdFx0bWlub3JUaWNrc1BlcjEwMEZ0LFxyXG5cdFx0XHRcdFx0YWx0aXR1ZGVcclxuXHRcdFx0XHR9ID0gb3B0aW9uc1xyXG5cclxuXHRcdFx0XHRjdHguc2F2ZSgpO1xyXG5cdFx0XHRcdGN0eC50cmFuc2xhdGUoY3R4LmNhbnZhcy53aWR0aCAvIDIsIGN0eC5jYW52YXMuaGVpZ2h0IC8gMik7XHJcblx0XHRcdFx0Y3R4LnRyYW5zbGF0ZSh6ZXJvV2lkdGggLyAyICsgemVyb1BhZGRpbmcsIDApO1xyXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwnICsgc3BlZWRBbHRPcGFjaXR5ICsgJyknO1xyXG5cdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9ICd3aGl0ZSc7XHJcblx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IDI7XHJcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIC1hbHRJbmRpY2F0b3JIZWlnaHQgLyAyLCBhbHRJbmRpY2F0b3JXaWR0aCwgYWx0SW5kaWNhdG9ySGVpZ2h0KTtcclxuXHRcdFx0XHRjdHguc3Ryb2tlUmVjdCgwLCAtYWx0SW5kaWNhdG9ySGVpZ2h0IC8gMiwgYWx0SW5kaWNhdG9yV2lkdGgsIGFsdEluZGljYXRvckhlaWdodCk7XHJcblx0XHRcdFx0Y3R4LnJlc3RvcmUoKTtcclxuXHRcdFx0XHRjdHguc2F2ZSgpO1xyXG5cdFx0XHRcdGN0eC50cmFuc2xhdGUoY3R4LmNhbnZhcy53aWR0aCAvIDIsIGN0eC5jYW52YXMuaGVpZ2h0IC8gMik7XHJcblx0XHRcdFx0Y3R4LnRyYW5zbGF0ZSh6ZXJvV2lkdGggLyAyICsgemVyb1BhZGRpbmcsIDApO1xyXG5cdFx0XHRcdGN0eC5yZWN0KDAsIC1hbHRJbmRpY2F0b3JIZWlnaHQgLyAyLCBhbHRJbmRpY2F0b3JXaWR0aCwgYWx0SW5kaWNhdG9ySGVpZ2h0KTtcclxuXHRcdFx0XHRjdHguY2xpcCgpO1xyXG5cdFx0XHRcdHZhciB5T2Zmc2V0ID0gYWx0aXR1ZGUgLyAxICogcGl4ZWxzUGVyMTAwRnQ7XHJcblx0XHRcdFx0Ly8gVGhlIHVuY2xpcHBlZCB0aWNrcyB0byBiZSByZW5kZXJlZC4gV2UgcmVuZGVyIDUwMGZ0IGVpdGhlciBzaWRlIG9mXHJcblx0XHRcdFx0Ly8gdGhlIGNlbnRlciB0byBiZSBzYWZlXHJcblx0XHRcdFx0dmFyIGZyb20gPSBNYXRoLmZsb29yKGFsdGl0dWRlIC8gMSkgLSA1O1xyXG5cdFx0XHRcdHZhciB0byA9IE1hdGguY2VpbChhbHRpdHVkZSAvIDEpICsgNTtcclxuXHRcdFx0XHRmb3IgKHZhciBpID0gZnJvbTsgaSA8IHRvOyArK2kpIHtcclxuXHRcdFx0XHRcdGN0eC5tb3ZlVG8oMCwgLWkgKiBwaXhlbHNQZXIxMDBGdCArIHlPZmZzZXQpO1xyXG5cdFx0XHRcdFx0Y3R4LmxpbmVUbyhtYWpvclRpY2tXaWR0aCwgLWkgKiBwaXhlbHNQZXIxMDBGdCArIHlPZmZzZXQpO1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaiA9IDE7IGogPCBtaW5vclRpY2tzUGVyMTAwRnQ7ICsraikge1xyXG5cdFx0XHRcdFx0XHQgIGN0eC5tb3ZlVG8oMCwgLWkgKiBwaXhlbHNQZXIxMDBGdCAtIGogKiBwaXhlbHNQZXIxMDBGdCAvIG1pbm9yVGlja3NQZXIxMDBGdCArIHlPZmZzZXQpO1xyXG5cdFx0XHRcdFx0XHQgIGN0eC5saW5lVG8obWlub3JUaWNrV2lkdGgsIC1pICogcGl4ZWxzUGVyMTAwRnQgLSBqICogcGl4ZWxzUGVyMTAwRnQgLyBtaW5vclRpY2tzUGVyMTAwRnQgKyB5T2Zmc2V0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGN0eC5mb250ID0gJzEycHggQXJpYWwnO1xyXG5cdFx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcblx0XHRcdFx0XHRjdHguZmlsbFRleHQoaSAqIDEsIDE1LCAtaSAqIHBpeGVsc1BlcjEwMEZ0ICsgeU9mZnNldCArIDQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSAnd2hpdGUnO1xyXG5cdFx0XHRcdGN0eC5saW5lV2lkdGggPSAyO1xyXG5cdFx0XHRcdGN0eC5zdHJva2UoKTtcclxuXHRcdFx0XHRjdHgucmVzdG9yZSgpO1xyXG5cdFx0XHRcdGN0eC5zYXZlKCk7XHJcblx0XHRcdFx0Y3R4LnRyYW5zbGF0ZShjdHguY2FudmFzLndpZHRoIC8gMiwgY3R4LmNhbnZhcy5oZWlnaHQgLyAyKTtcclxuXHRcdFx0XHRjdHgudHJhbnNsYXRlKHplcm9XaWR0aCAvIDIgKyB6ZXJvUGFkZGluZywgMCk7XHJcblx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gJ3doaXRlJztcclxuXHRcdFx0XHRjdHgubGluZVdpZHRoID0gMjtcclxuXHRcdFx0XHRjdHguZm9udCA9ICcxMnB4IEFyaWFsJztcclxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gJ3doaXRlJztcclxuXHRcdFx0XHRjdHguZmlsbE9wYWNpdHkgPSAxO1xyXG5cdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcclxuXHRcdFx0XHRjdHgubW92ZVRvKG1pbm9yVGlja1dpZHRoLCAwKTtcclxuXHRcdFx0XHRjdHgubGluZVRvKG1pbm9yVGlja1dpZHRoICogMiwgLTUpO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8obWlub3JUaWNrV2lkdGggKiAyLCAtMTApO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8oYWx0SW5kaWNhdG9yV2lkdGgsIC0xMCk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbyhhbHRJbmRpY2F0b3JXaWR0aCwgMTApO1xyXG5cdFx0XHRcdGN0eC5saW5lVG8obWlub3JUaWNrV2lkdGggKiAyLCAxMCk7XHJcblx0XHRcdFx0Y3R4LmxpbmVUbyhtaW5vclRpY2tXaWR0aCAqIDIsIDUpO1xyXG5cdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcclxuXHRcdFx0XHRjdHguZmlsbCgpO1xyXG5cdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9ICdibGFjayc7XHJcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9ICdibGFjayc7XHJcblx0XHRcdFx0Y3R4LmZpbGxUZXh0KE1hdGgucm91bmQoYWx0aXR1ZGUgKiAxMDApIC8gMTAwLCAxNSwgNC41LCBhbHRJbmRpY2F0b3JIZWlnaHQpO1xyXG5cdFx0XHRcdGN0eC5yZXN0b3JlKCk7XHJcblx0XHRcdH1cdFx0XHRcclxuXHJcblx0XHRcdGZ1bmN0aW9uIHJlbmRlcigpIHtcclxuXHRcdFx0XHRkcmF3SG9yaXpvbigpXHJcblx0XHRcdFx0ZHJhd1plcm8oKVxyXG5cdFx0XHRcdGRyYXdSb2xsKClcclxuXHRcdFx0XHRkcmF3U3BlZWQoKVxyXG5cdFx0XHRcdGRyYXdBbHRpdHVkZSgpXHJcblx0XHRcdH1cclxuXHJcblxyXG5cclxuXHRcdFx0cmVuZGVyKClcclxuXHJcblx0XHRcdHRoaXMuc2V0Um9sbCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0b3B0aW9ucy5yb2xsID0gdmFsdWVcclxuXHRcdFx0XHRyb2xsUmFkID0gdG9SYWQodmFsdWUpXHJcblx0XHRcdFx0cmVuZGVyKClcdFx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0dGhpcy5zZXRTcGVlZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0b3B0aW9ucy5zcGVlZCA9IHZhbHVlXHJcblx0XHRcdFx0cmVuZGVyKClcdFx0XHRcdFx0XHJcblx0XHRcdH0sXHJcblx0XHRcdFxyXG5cdFx0XHR0aGlzLnNldFBpdGNoID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRvcHRpb25zLnBpdGNoID0gdmFsdWVcclxuXHRcdFx0XHRwaXRjaFJhZCA9IHRvUmFkKHZhbHVlKVxyXG5cdFx0XHRcdHJlbmRlcigpXHRcdFx0XHRcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHRoaXMuc2V0QWx0aXR1ZGUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdG9wdGlvbnMuYWx0aXR1ZGUgPSB2YWx1ZVxyXG5cdFx0XHRcdHJlbmRlcigpXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0XHJcblx0XHR9XHJcblx0fSlcclxuXHJcblxyXG59KSgpOyJdfQ==
