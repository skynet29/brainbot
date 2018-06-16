'use strict'

const K2MS = 1852/3600 // knots to m/s
const D2R = Math.PI/180 // ° to rad

const formules = require('./formules')

class Simulator {

	constructor(options) {

		options = options || {}

		this.curPos = {x: 0, y: 0}
		this.heading = 0
		this.gyrSpeed = options.gyrSpeed || 8; // en °/s
		this.speed = 4 // en noeud
		this.prevTime = null
		this.warpFactor = options.warpFactor || 1 
	}

	start() {
		this.prevTime = null
	}

	update(headingCmd) {
		if (this.prevTime == null) {
			this.prevTime = Date.now()
			return
		}

		// compute deltaT

		var now = Date.now()
		var deltaT = (now - this.prevTime)/1000
		//console.log('deltaT', deltaT)
		deltaT *= this.warpFactor
		this.prevTime = now

		var speedMS = this.speed * K2MS

		var deltaHeading = formules.headingErrorProcessing(this.heading, headingCmd)
		var sign = (deltaHeading < 0) ? -1 : 1
		this.heading += Math.min(Math.abs(deltaHeading), this.gyrSpeed * deltaT) * sign

		var alpha = (90 - this.heading) * D2R
		var speedX = speedMS * Math.cos(alpha)
		var speedY = speedMS * Math.sin(alpha)

		this.curPos.x += speedX * deltaT		
		this.curPos.y += speedY * deltaT	

	}
}

module.exports = Simulator