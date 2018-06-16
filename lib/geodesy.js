(function() {

	function interface(proj4) {

		function Geodesy(org) {
			this.org = org

			var zone = (Math.floor((org.lng + 180)/6) + 1) % 60

			var proj_utm = "+proj=utm +ellps=WGS84 +zone=" + zone
			console.log('proj_utm', proj_utm)

			var pj_latlong ="+proj=longlat +ellps=WGS84 +units=degrees"


			this.proj = proj4(pj_latlong, proj_utm)

			this.pos = this.proj.forward([org.lng, org.lat])		

		}

		Geodesy.prototype.gps2pos = function(a) {
			var pos = this.proj.forward([a.lng, a.lat])

			return {
				x: pos[0] - this.pos[0],
				y: pos[1] - this.pos[1]
			}
		}

		Geodesy.prototype.pos2gps = function(a) {

			var tx = a.x + this.pos[0]
			var ty = a.y + this.pos[1]

			var gps = this.proj.inverse([tx, ty])

			return {
				lng: gps[0],
				lat: gps[1]
			}
		}	

		return Geodesy		

	}



	if (typeof module != 'undefined') {
		console.log('server')
		module.exports = interface(require('./proj4.js'))
	}
	else if (typeof window != 'undefined') {
		console.log('client')
		window.Geodesy = interface(window.proj4)
	}

})()


