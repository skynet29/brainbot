(function() {

	$$.registerControlEx('WebcamControl', {

		events: 'mediaReady',
		iface: 'takePicture():dataURL',

		
	lib: 'media',
init: function(elt) {


			var canvas
			var video

			const ctrl = $$.viewController(elt, {
				template: "<div>\r\n	<div><span bn-text=\"message\"></span></div>\r\n	<video bn-bind=\"video\" bn-event=\"canplay: onCanPlay\"></video>\r\n	<canvas bn-bind=\"canvas\" hidden=\"\"></canvas>\r\n</div>",
				events: {
					onCanPlay: function() {
						console.log(`[WebcamControl] onCanPlay, width: ${this.videoWidth}, height: ${this.videoHeight}`)
						canvas.width = this.videoWidth
						canvas.height = this.videoHeight
						elt.trigger('mediaReady')
					}
				},
				init: function() {
					video = this.scope.video.get(0)
					canvas = this.scope.canvas.get(0)
				} 
			})

			function takePicture() {
			    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
			    return canvas.toDataURL('image/png');
			}

			navigator.getUserMedia({video: true}, function(stream) {
				//console.log('stream')

				var url = URL.createObjectURL(stream)
				video.src = url
				video.play()

			},
			function(err) {
				console.log('[WebcamControl] error', err)
				ctrl.setData('message', err.name)
			})	

			return {
				takePicture
			}	
		}
	})

})();