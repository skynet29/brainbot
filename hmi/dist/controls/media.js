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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZpZGVvLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWVkaWEuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdXZWJjYW1Db250cm9sJywge1xyXG5cclxuXHRcdGV2ZW50czogJ21lZGlhUmVhZHknLFxyXG5cdFx0aWZhY2U6ICd0YWtlUGljdHVyZSgpOmRhdGFVUkwnLFxyXG5cclxuXHRcdFxuXHRsaWI6ICdtZWRpYScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblxyXG5cdFx0XHR2YXIgY2FudmFzXHJcblx0XHRcdHZhciB2aWRlb1xyXG5cclxuXHRcdFx0Y29uc3QgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXY+XFxyXFxuXHQ8ZGl2PjxzcGFuIGJuLXRleHQ9XFxcIm1lc3NhZ2VcXFwiPjwvc3Bhbj48L2Rpdj5cXHJcXG5cdDx2aWRlbyBibi1iaW5kPVxcXCJ2aWRlb1xcXCIgYm4tZXZlbnQ9XFxcImNhbnBsYXk6IG9uQ2FuUGxheVxcXCI+PC92aWRlbz5cXHJcXG5cdDxjYW52YXMgYm4tYmluZD1cXFwiY2FudmFzXFxcIiBoaWRkZW49XFxcIlxcXCI+PC9jYW52YXM+XFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0XHRvbkNhblBsYXk6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhgW1dlYmNhbUNvbnRyb2xdIG9uQ2FuUGxheSwgd2lkdGg6ICR7dGhpcy52aWRlb1dpZHRofSwgaGVpZ2h0OiAke3RoaXMudmlkZW9IZWlnaHR9YClcclxuXHRcdFx0XHRcdFx0Y2FudmFzLndpZHRoID0gdGhpcy52aWRlb1dpZHRoXHJcblx0XHRcdFx0XHRcdGNhbnZhcy5oZWlnaHQgPSB0aGlzLnZpZGVvSGVpZ2h0XHJcblx0XHRcdFx0XHRcdGVsdC50cmlnZ2VyKCdtZWRpYVJlYWR5JylcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dmlkZW8gPSB0aGlzLnNjb3BlLnZpZGVvLmdldCgwKVxyXG5cdFx0XHRcdFx0Y2FudmFzID0gdGhpcy5zY29wZS5jYW52YXMuZ2V0KDApXHJcblx0XHRcdFx0fSBcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdGZ1bmN0aW9uIHRha2VQaWN0dXJlKCkge1xyXG5cdFx0XHQgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKHZpZGVvLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG5cdFx0XHQgICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKHt2aWRlbzogdHJ1ZX0sIGZ1bmN0aW9uKHN0cmVhbSkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3N0cmVhbScpXHJcblxyXG5cdFx0XHRcdHZhciB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKHN0cmVhbSlcclxuXHRcdFx0XHR2aWRlby5zcmMgPSB1cmxcclxuXHRcdFx0XHR2aWRlby5wbGF5KClcclxuXHJcblx0XHRcdH0sXHJcblx0XHRcdGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbV2ViY2FtQ29udHJvbF0gZXJyb3InLCBlcnIpXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKCdtZXNzYWdlJywgZXJyLm5hbWUpXHJcblx0XHRcdH0pXHRcclxuXHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0dGFrZVBpY3R1cmVcclxuXHRcdFx0fVx0XHJcblx0XHR9XHJcblx0fSlcclxuXHJcbn0pKCk7Il19
