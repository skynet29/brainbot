var convertTo5 = false

module.exports = {
	'externals-js': {
		src: [
		'./externals/jquery.min.js',
		'./externals/jquery-ui-1.12.1.custom/jquery-ui.min.js',
		'./externals/jquery-ui-1.12.1.custom/i18n/datepicker-fr.js',
		'./externals/jquery-contextMenu/jquery.contextMenu.min.js',
		'./externals/eventemitter2.js',
		'./externals/notify.min.js',
		],
		options: {concat: 'externals.js'}

	},
	'externals-css': {
		src: [
		'./externals/jquery-ui-1.12.1.custom/jquery-ui.min.css',
		'./externals/jquery-contextMenu/jquery.contextMenu.css',		
		'./externals/font-awesome-4.7.0/css/font-awesome.min.css',
		'./externals/w3.css'
		],
		dest: './dist/css',
		options: {concat: 'externals.css'}
	},
	'externals-images': {
		src: [
		'./externals/leaflet-1.0.3/images/*',
		'./externals/leaflet-draw/dist/images/*',
		'./externals/jquery-ui-1.12.1.custom/images/*'				
		],
		dest: './dist/css/images'
	},
	'externals-fonts': {
		src: [
		'./externals/font-awesome-4.7.0/fonts/*'
		],
		dest: './dist/fonts/'
	},
	'externals-fonts2': {
		src: [
		'./externals/jquery-contextMenu/font/*'
		],
		dest: './dist/css/font'
	},	
	'milsymbol': {
		src: './externals/milsymbol.js'
	},	
	'tween-js': {
		src: './externals/TweenMax.min.js',
		options: {concat: 'tween.js'}
	},	
	'ol-js': {
		src: './externals/ol/ol.js'
	},
	'ol-css': {
		src: './externals/ol/ol.css',
		dest: './dist/css'
	},
	'tree-js': {
		src: [
			'./externals/fancytree/dist/jquery.fancytree-all.min.js',
			'./externals/fancytree/3rd-party/extensions/contextmenu/js/jquery.fancytree.contextMenu.js'
		],
		options: {concat: 'tree.js'}
	},
	'tree-css': {
		src: './externals/fancytree/dist/skin-lion/ui.fancytree.min.css',
		dest: './dist/css/tree',
		options: {concat: 'tree.css'}
	},
	'tree-images': {
		src: './externals/fancytree/dist/skin-lion/*.gif',
		dest: './dist/css/tree'
	},
	'aframe-js': {
		src: './externals/aframe/**/*.js',
		options: {concat: 'aframe.js'}
	},	
	'aframe-font': {
		src: ['./externals/aframe/*.json', './externals/aframe/*.png'],
		dest: './dist/fonts'
	},	
	'leaflet-js': {
		src: [
		'./externals/leaflet-1.0.3/leaflet.js',
		'./externals/leaflet.contextmenu.min.js',
		'./externals/Leaflet.Coordinates.min.js',
		'./externals/leaflet.rotatedMarker.js',
		'./externals/leaflet-draw/dist/leaflet.draw.js',
		'./externals/Semicircle.js',
		'./externals/leaflet.markercluster.js',
		'./externals/leaflet.latlng-graticule.js'
		],
		options: {concat: 'leaflet.js'}
	},
	'leaflet-css': {
		src: [
			'./externals/leaflet-1.0.3/leaflet.css',
			'./externals/leaflet.contextmenu.min.css',
			'./externals/Leaflet.Coordinates.css',
			'./externals/leaflet-draw/dist/leaflet.draw.css',
			'./externals/MarkerCluster.css',
			'./externals/MarkerCluster.Default.css'
			],
		dest: './dist/css',
		options: {concat: 'leaflet.css'}
	},

	'drone': {
		src: ['../../node_modules/dronestream/dist/nodecopter-client.js'],
	},

	'services': {
		src: ['../lib/client.js', './src/services/*.js'],
		options: {concat: 'services.js', to5: convertTo5},
		watch: true
	},

	'view': {
		src: [
		'./externals/jquery.min.js',
		'./externals/jquery-ui-1.12.1.custom/jquery-ui.min.js',
		'./externals/jquery-ui-1.12.1.custom/i18n/datepicker-fr.js',
		'./externals/jquery-contextMenu/jquery.contextMenu.min.js',
		'./externals/eventemitter2.js',
		'./src/lib/**/*.js',
		'!./src/lib/core2.js',
		'!./src/lib/boot/*.js'],
		options: {concat: 'view.js', to5: convertTo5},
		watch: true
	},
	'core': {
		src: [
		'./src/lib/**/*.js',
		'!./src/lib/core2.js',
		],
		options: {concat: 'core.js', to5: convertTo5},
		watch: true
	},
	'styles': {
		src: './src/styles/*.css',
		dest: './dist/css',
		watch: true
	},
	'app-js': {
		src: 'src/pages',
		dest: './dist/pages/',
		ext: 'js',
		options: {concat: 'app.js', injectHTML: true, to5: convertTo5},
		watch: true
	},
	'app-css': {
		src: 'src/pages',
		dest: './dist/pages/',
		ext: 'css',
		options: {concat: 'app.css'},
		watch: true
	},
	'app-assets': {
		src: 'src/pages',
		subdir: 'assets',
		dest: './dist/pages/'
	},
	'controls-js': {
		src: './src/controls',
		dest: './dist/controls',
		ext: 'js',
		options: {concat: '$folder', injectHTML: true, to5: convertTo5, lib: true},
		watch: true
	},	
	'controls-css': {
		src: './src/controls',
		dest: './dist/controls',
		ext: 'css',
		options: {concat: '$folder'},
		watch: true
	},		

}


