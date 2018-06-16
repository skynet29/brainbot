(function() {


	function distance(pos1, pos2) {
		var deltaX = pos1.x - pos2.x
		var deltaY = pos1.y - pos2.y
		return Math.sqrt(deltaX*deltaX + deltaY*deltaY)
	}

	function angle(pos1, pos2) {
		var deltaX = pos2.x - pos1.x
		var deltaY = pos2.y - pos1.y
		var ret = 90-(180*Math.atan2(deltaY, deltaX)/Math.PI)
		return (ret + 360) % 360
	}

	function route(pos1, pos2) {
		return {
			heading: angle(pos1, pos2),
			dist: distance(pos1, pos2)
		}
	}

	function routeToAxe(a,b,R,h)
	//---------------------
	// Calcule la route a suivre pour arriver au point de dernier virage a la distance R
	// du point d'entrée d'un axe
	// a : from, b: to
	//  R, rayon de virage EN NAUTIQUES
	// h : heading souhaite au point b (determinera le demi secteur choisi
	// deux centres de rotation possibles, on choisit le plus proche sauf si on est déja dans le cercle
	{
		console.log("routeToAxe", a,b,R,h)
		var alpha = (90-h)*Math.PI/180 // Angle en radians dans le repere x,y
		// Points de rotation possibles, R est en nautique, on divise par 60
		var cos = Math.cos(alpha)
		var sin = Math.sin(alpha)
		var p1 ={y:b.y+R*cos,x:b.x-R*sin}
		console.log('p1', p1)
		var p2 ={y:b.y-R*cos,x:b.x+R*sin}
		console.log('p2', p2)

		var r1 = route(p1,a) // Calcul des deux routes possibles
		var r2 = route(p2,a)
		// Choix du point de rotation
		var turn = 1 // Sens de rotation sur le cercle qu'on rejoint
		if(R>r1.dist){ // On est a l'intérieur du cercle proche, il faut obligatoirement prendre le cercle opposé
			p1 = p2
			r1 = r2
			turn = -1 // Mémorise qu'on a choisi le point opposé
		} else if(R<r2.dist && r1.dist > r2.dist){
			p1 = p2
			r1 = r2
			turn = -1 // Mémorise qu'on a choisi le point opposé
		}
		// Calcul du point de tangence il y a deux points de tangence, mais un seul emmene a tourner dans le bon sens
		var beta =(90- r1.heading)*Math.PI/180 // direction du centre vu de l'avion => repère cartesien direct (lng,lat)
		var gamma = Math.acos(R/r1.dist) // norme de l'angle du point de tangeance vu du centre par rapport a beta
		// On verifie le sens du point de tangence => en tournant de 90Â° dans le sens de rotation on doit etre colinéaire au cap
		// Vecteur centre vers point de tangence
		var dx = Math.cos(beta+gamma)*R
		var dy = Math.sin(beta+gamma)*R
		// Point de tangence
		// Vecteur avion vers premier point de tangence
		var x = p1.x+dx-a.x
		var y = p1.y+dy-a.y
		// Produit vectoriel (* coslat) des deux vecteurs: x et y nuls (meme plan) z va donner le sens de rotation
		var z = x*dy - y*dx ;
		if(turn*z>0){ // On prend l'autre point
			dx = Math.cos(beta-gamma)*R
			dy = Math.sin(beta-gamma)*R
			turn = - turn ;// du coup le sens de rotation va changer
		}
		var p={ // Point de tangence
			y : p1.y+dy
			,x: p1.x+dx
		}
		result= route(a,p)
		result.p1 =p1
		result.turn = turn
		result.p = p	;// Rend aussi p dans le résultat
		console.log("routeToAxe result:",result)
		return result ;
	}

	function headingErrorProcessing(heading, headingCmd) {

		if (headingCmd > 180)
			headingCmd -= 360;

		var headingErr = headingCmd - heading;

		if (headingErr > 180)
			headingErr -= 360;
		else if (headingErr < -180)
			headingErr += 360;

		return headingErr;

	}

	function dot(a, b) { // produit scalaire de 2 vecteurs
		return (a.x * b.x) + (a.y * b.y)
	}

	function vector(a, b) { // retourne coordonnees du vecteur ab
		return {
			x: b.x - a.x,
			y: b.y - a.y
		}
	}

	function unitVector(a, b) {
		var d = distance(a, b)
		//console.log('unitVector d', d)
		var ab = vector(a, b)
		return {
			x: ab.x / d,
			y: ab.y / d
		}
	}

	function proj(a, b, c) { // retourne les coordonnees de la projection du point C sur la droite (AB)

		var u = unitVector(a, b)
		var ac = vector(a, c)
		var d = dot(ac, u)
		//console.log('d', d)

		return pointFrom(a, b, d)
	}

	function closestPtToSegment(a, b, c) {
		var u = unitVector(a, b)
		var ac = vector(a, c)
		var d = dot(ac, u)
		//console.log('d', d)
		var ret
		if (d < 0) {
			ret = Object.assign({}, a)
		}
		else if (d > distance(a, b)) {
			ret = Object.assign({}, b)
		}
		else {
			ret = pointFrom(a, b, d)
		}

		return ret		
	}

	function closestPtToPolyline(pts, c) {
		var ret = null
		var prev = null
		var minDist = 0

		for(var pt of pts) {
			if (prev != null) {
				var p = closestPtToSegment(prev, pt, c)
				var d = distance(p, c)
				if (d < minDist) {
					ret = p
					minDist = d
				}	
			}
			else {
				minDist = distance(pt, c)
				ret = Object.assign({}, pt)
			}
			prev = pt
			
		}

		return ret		
	}



	function pointFrom(a, b, dist) {
		var L = distance(a, b)
		var r = dist /  L
		var ab = vector(a, b)
		return {
			x: a.x + r * ab.x,
			y: a.y + r * ab.y
		}
	}

	function rotate(a, angle) {
		var alpha = angle * Math.PI/180

		var cos = Math.cos(alpha)
		var sin = Math.sin(alpha)
		return {
			x: a.x * cos - a.y * sin,
			y: a.x * sin + a.y * cos
		}
	}

	function headTo(pos,range,heading) {
		var alpha =  heading * Math.PI/180
		return {
			x: pos.x + range * Math.sin(alpha),
			y: pos.y + range * Math.cos(alpha)
		}
	}	

	function isInPolygon(poly, p) {
		var nbPoints = poly.length

		var ret = false

		for(var i = 0, j = nbPoints-1; i < nbPoints; j = i++) {
			if ((((poly[i].y <= p.y) && (p.y < poly[j].y)) || 
				((poly[j].y <= p.y) && (p.y < poly[i].y))) && 
				(p.x < (poly[j].x - poly[i].x) * (p.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)) {
				ret = !ret
			}
		}

		return ret
	}

	var interface = {
		distance: distance,
		angle: angle,
		route: route,
		routeToAxe: routeToAxe,
		headingErrorProcessing: headingErrorProcessing,
		dot: dot,
		vector: vector,
		unitVector: unitVector,
		proj: proj,
		pointFrom: pointFrom,
		rotate: rotate,
		headTo: headTo,
		isInPolygon: isInPolygon,
		closestPtToSegment: closestPtToSegment,
		closestPtToPolyline: closestPtToPolyline
	}

	if (typeof module != 'undefined') {
		module.exports = interface
	}
	else if (typeof window != 'undefined') {
		window.formules = interface
	}
})()