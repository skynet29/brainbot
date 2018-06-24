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