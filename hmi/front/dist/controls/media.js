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

			this.takePicture = function() {
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

	
		}
	})

})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZpZGVvLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtZWRpYS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ1dlYmNhbUNvbnRyb2wnLCB7XHJcblxyXG5cdFx0ZXZlbnRzOiAnbWVkaWFSZWFkeScsXHJcblx0XHRpZmFjZTogJ3Rha2VQaWN0dXJlKCk6ZGF0YVVSTCcsXHJcblxyXG5cdFx0XG5cdGxpYjogJ21lZGlhJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHJcblx0XHRcdHZhciBjYW52YXNcclxuXHRcdFx0dmFyIHZpZGVvXHJcblxyXG5cdFx0XHRjb25zdCBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdj5cXHJcXG5cdDxkaXY+PHNwYW4gYm4tdGV4dD1cXFwibWVzc2FnZVxcXCI+PC9zcGFuPjwvZGl2Plxcclxcblx0PHZpZGVvIGJuLWJpbmQ9XFxcInZpZGVvXFxcIiBibi1ldmVudD1cXFwiY2FucGxheTogb25DYW5QbGF5XFxcIj48L3ZpZGVvPlxcclxcblx0PGNhbnZhcyBibi1iaW5kPVxcXCJjYW52YXNcXFwiIGhpZGRlbj1cXFwiXFxcIj48L2NhbnZhcz5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRcdG9uQ2FuUGxheTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBbV2ViY2FtQ29udHJvbF0gb25DYW5QbGF5LCB3aWR0aDogJHt0aGlzLnZpZGVvV2lkdGh9LCBoZWlnaHQ6ICR7dGhpcy52aWRlb0hlaWdodH1gKVxyXG5cdFx0XHRcdFx0XHRjYW52YXMud2lkdGggPSB0aGlzLnZpZGVvV2lkdGhcclxuXHRcdFx0XHRcdFx0Y2FudmFzLmhlaWdodCA9IHRoaXMudmlkZW9IZWlnaHRcclxuXHRcdFx0XHRcdFx0ZWx0LnRyaWdnZXIoJ21lZGlhUmVhZHknKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0aW5pdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR2aWRlbyA9IHRoaXMuc2NvcGUudmlkZW8uZ2V0KDApXHJcblx0XHRcdFx0XHRjYW52YXMgPSB0aGlzLnNjb3BlLmNhbnZhcy5nZXQoMClcclxuXHRcdFx0XHR9IFxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0dGhpcy50YWtlUGljdHVyZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKHZpZGVvLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG5cdFx0XHQgICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKHt2aWRlbzogdHJ1ZX0sIGZ1bmN0aW9uKHN0cmVhbSkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3N0cmVhbScpXHJcblxyXG5cdFx0XHRcdHZhciB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKHN0cmVhbSlcclxuXHRcdFx0XHR2aWRlby5zcmMgPSB1cmxcclxuXHRcdFx0XHR2aWRlby5wbGF5KClcclxuXHJcblx0XHRcdH0sXHJcblx0XHRcdGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbV2ViY2FtQ29udHJvbF0gZXJyb3InLCBlcnIpXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKCdtZXNzYWdlJywgZXJyLm5hbWUpXHJcblx0XHRcdH0pXHRcclxuXHJcblx0XHJcblx0XHR9XHJcblx0fSlcclxuXHJcbn0pKCk7Il19
