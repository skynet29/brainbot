(function() {

	function polar2Cart(radius, angleDeg) {
		var angleRad = (angleDeg -90) * Math.PI/180
		return {
			x: radius * Math.cos(angleRad),
			y: radius * Math.sin(angleRad)
		}
	}



	function getArcPath(innerRadius, radius, startAngle, endAngle) {
		var p1 = polar2Cart(innerRadius, endAngle)
		var p2 = polar2Cart(innerRadius, startAngle)
		var p3 = polar2Cart(radius, startAngle)
		var p4 = polar2Cart(radius, endAngle)

		var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

		var d = [
			'M', p1.x, p1.y,
			'A', innerRadius, innerRadius, 0, largeArcFlag, 0, p2.x, p2.y,
			'L', p3.x, p3.y,
			'A', radius, radius, 0, largeArcFlag, 1, p4.x, p4.y,
			'z'


		].join(' ')


		return d

	}


	$$.registerControlEx('CircularMenuControl', {
		deps: ['TweenMaxService'], 
		events: 'menuSelected,menuClosed',
		options: {
			hasTrigger: true,
			triggerRadius: 20,
			triggerPos: {left: 100, top: 100},
			innerRadius: 0,
			radius: 90,
			iconPos: 60,
			iconSize: 40,
			gap: 0
		},
		iface: 'showMenu(x, y);closeMenu();on(event, callback);select(idx)',

		
	lib: 'circular',
init: function(elt, options) {

			var events = new EventEmitter2()

			if (!Array.isArray(options.menus)) {
				console.warn(`mission field 'menus' in CircularMenuControl config`)
				return
			}
			var open = false

			var triggerLabel = $.extend({open: '\uf068', close:'\uf067'}, options.triggerLabel)

			var triggerRadius = options.triggerRadius
			var innerRadius = options.innerRadius
			var radius = options.radius
			var iconPos = options.iconPos
			var iconSize = options.iconSize
			var gap = options.gap

			var menus = options.menus
			if (menus.length < 3) {
				menus = menus.concat(new Array(3 - menus.length).fill({}))
			}
			//console.log('menus', menus)		

			var sectorAngle = 360 / menus.length - gap
			//console.log('sectorAngle', sectorAngle)
			var p = polar2Cart(iconPos, 0)
			var arcPath = getArcPath(innerRadius, radius, -sectorAngle/2, sectorAngle/2)
			//console.log('arcPath', arcPath)


			var width = triggerRadius * 2
			var height = triggerRadius * 2
			var x = triggerRadius
			var y = triggerRadius		


			elt.css('position', 'relative')


			var sectors = menus.map(function(info, idx) {
				//console.log('config', info, idx)
				var angle = (sectorAngle + gap)  * idx
				var info = $.extend({fill: 'white', color: 'black', text: ''}, info)
				return {
					transform1: `rotate(${angle})`,
					info: info,
					transform2: `translate(${p.x}, ${p.y}) rotate(${-angle})` 
				}
			})

			var ctrl = $$.viewController(elt, {
				template: "<svg bn-attr=\"width: width, height: height\" class=\"circularMenu\" style=\"position: absolute; z-index: 1000000; overflow: visible; cursor: context-menu\">\r\n	<g bn-attr=\"transform: transform1\">\r\n		<g class=\"items\" data-svg-origin=\"0 0\" bn-each=\"s of sectors\" bn-event=\"click.item: onItemClicked\">\r\n				<g class=\"item\" data-svg-origin=\"0 0\">\r\n					<g bn-attr=\"transform: s.transform1\">\r\n						<path bn-attr=\"d: arcPath, fill: s.info.fill\" class=\"sector\" stroke=\"black\"/>			\r\n						<g  bn-attr=\"transform: s.transform2\">\r\n\r\n							<text bn-attr=\"fill: s.info.color\" text-anchor=\"middle\" alignment-baseline=\"middle\" bn-text=\"s.info.text\"></text>			\r\n						</g>\r\n					</g>\r\n				</g>			\r\n		</g>\r\n		<g class=\"trigger\" bn-if=\"hasTrigger\" bn-event=\"click: onTriggerClick\">\r\n			<circle bn-attr=\"r: triggerRadius\" fill=\"red\" />\r\n			<text class=\"label\" text-anchor=\"middle\" alignment-baseline=\"middle\" bn-text=\"triggerLabel\"></text>\r\n		</g>\r\n		\r\n	</g>\r\n</svg>",
				data : {
					hasTrigger: options.hasTrigger,
					width: width,
					height: height,
					triggerRadius: triggerRadius,
					transform1: `translate(${x}, ${y})`,
					triggerLabel: triggerLabel.close,
					arcPath: arcPath,
					sectors: sectors
				},
				events: {
					onTriggerClick: function(ev) {
						//console.log('onTriggerClick')
					    ev.stopPropagation()
					    if (!open) {
					    	openMenu()
					    } 
					    else {
					    	closeMenu()
					    }				
					},
					onItemClicked: function(ev) {
						//console.log('onItemClicked')
						var idx = item.index(this)
						//console.log('click', idx)
						events.emit('menuSelected', options.menus[idx])				
					}

				}
			})

			var svg = ctrl.elt

			var item = svg.find('.item')
			var items = svg.find('.items')
			TweenLite.set(item, {scale:0, visibility:"visible"})


			$(document).on('click', closeMenu)

			if (options.hasTrigger) {
				show(options.triggerPos.left, options.triggerPos.top)
			}



			function show(x, y) {
				//console.log('show', left, top)
				var left = x - (width/2)
				var top = y - (height/2)

				svg.css({left: left + 'px', top: top+'px'}).show()
			}


			function showMenu(x, y) {
				show(x, y)
				openMenu()
			}


			function openMenu() {
				console.log('openMenu')

				if (!open) {
			        TweenMax.staggerTo(item, 0.7, {scale:1, ease:Elastic.easeOut}, 0.05);
			        ctrl.setData({triggerLabel: triggerLabel.open})
			      	open = true
		      	}
			}

			function closeMenu() {
				console.log('closeMenu')
				if (open) {
				    TweenMax.staggerTo(item, .3, {scale:0, ease:Back.easeIn}, 0.05, function() {
				    	//console.log('finished !!')
				    	if (!options.hasTrigger) {
				    		svg.hide()
				    		events.emit('menuClosed')
				    	}
				    });
				    ctrl.setData({triggerLabel: triggerLabel.close})
				    open = false
				}
			}

			this.select = function(idx) {
				items.find('.item.active').removeClass('active')
				if (idx >= 0) {
					item.eq(idx).addClass('active')
				}
			}

			this.on = events.on.bind(events)
			this.showMenu = showMenu
			this.closeMenu = closeMenu

	
		}

	})


})();
(function() {	

	$$.loadStyle('/controls/circular.css')
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNpcmN1bGFyLmpzIiwiZGVwcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xOQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjaXJjdWxhci5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcclxuXHJcblx0ZnVuY3Rpb24gcG9sYXIyQ2FydChyYWRpdXMsIGFuZ2xlRGVnKSB7XHJcblx0XHR2YXIgYW5nbGVSYWQgPSAoYW5nbGVEZWcgLTkwKSAqIE1hdGguUEkvMTgwXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHR4OiByYWRpdXMgKiBNYXRoLmNvcyhhbmdsZVJhZCksXHJcblx0XHRcdHk6IHJhZGl1cyAqIE1hdGguc2luKGFuZ2xlUmFkKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG5cclxuXHRmdW5jdGlvbiBnZXRBcmNQYXRoKGlubmVyUmFkaXVzLCByYWRpdXMsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlKSB7XHJcblx0XHR2YXIgcDEgPSBwb2xhcjJDYXJ0KGlubmVyUmFkaXVzLCBlbmRBbmdsZSlcclxuXHRcdHZhciBwMiA9IHBvbGFyMkNhcnQoaW5uZXJSYWRpdXMsIHN0YXJ0QW5nbGUpXHJcblx0XHR2YXIgcDMgPSBwb2xhcjJDYXJ0KHJhZGl1cywgc3RhcnRBbmdsZSlcclxuXHRcdHZhciBwNCA9IHBvbGFyMkNhcnQocmFkaXVzLCBlbmRBbmdsZSlcclxuXHJcblx0XHR2YXIgbGFyZ2VBcmNGbGFnID0gZW5kQW5nbGUgLSBzdGFydEFuZ2xlIDw9IDE4MCA/ICcwJyA6ICcxJ1xyXG5cclxuXHRcdHZhciBkID0gW1xyXG5cdFx0XHQnTScsIHAxLngsIHAxLnksXHJcblx0XHRcdCdBJywgaW5uZXJSYWRpdXMsIGlubmVyUmFkaXVzLCAwLCBsYXJnZUFyY0ZsYWcsIDAsIHAyLngsIHAyLnksXHJcblx0XHRcdCdMJywgcDMueCwgcDMueSxcclxuXHRcdFx0J0EnLCByYWRpdXMsIHJhZGl1cywgMCwgbGFyZ2VBcmNGbGFnLCAxLCBwNC54LCBwNC55LFxyXG5cdFx0XHQneidcclxuXHJcblxyXG5cdFx0XS5qb2luKCcgJylcclxuXHJcblxyXG5cdFx0cmV0dXJuIGRcclxuXHJcblx0fVxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0NpcmN1bGFyTWVudUNvbnRyb2wnLCB7XHJcblx0XHRkZXBzOiBbJ1R3ZWVuTWF4U2VydmljZSddLCBcclxuXHRcdGV2ZW50czogJ21lbnVTZWxlY3RlZCxtZW51Q2xvc2VkJyxcclxuXHRcdG9wdGlvbnM6IHtcclxuXHRcdFx0aGFzVHJpZ2dlcjogdHJ1ZSxcclxuXHRcdFx0dHJpZ2dlclJhZGl1czogMjAsXHJcblx0XHRcdHRyaWdnZXJQb3M6IHtsZWZ0OiAxMDAsIHRvcDogMTAwfSxcclxuXHRcdFx0aW5uZXJSYWRpdXM6IDAsXHJcblx0XHRcdHJhZGl1czogOTAsXHJcblx0XHRcdGljb25Qb3M6IDYwLFxyXG5cdFx0XHRpY29uU2l6ZTogNDAsXHJcblx0XHRcdGdhcDogMFxyXG5cdFx0fSxcclxuXHRcdGlmYWNlOiAnc2hvd01lbnUoeCwgeSk7Y2xvc2VNZW51KCk7b24oZXZlbnQsIGNhbGxiYWNrKTtzZWxlY3QoaWR4KScsXHJcblxyXG5cdFx0XG5cdGxpYjogJ2NpcmN1bGFyJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdFx0dmFyIGV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcclxuXHJcblx0XHRcdGlmICghQXJyYXkuaXNBcnJheShvcHRpb25zLm1lbnVzKSkge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgbWlzc2lvbiBmaWVsZCAnbWVudXMnIGluIENpcmN1bGFyTWVudUNvbnRyb2wgY29uZmlnYClcclxuXHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgb3BlbiA9IGZhbHNlXHJcblxyXG5cdFx0XHR2YXIgdHJpZ2dlckxhYmVsID0gJC5leHRlbmQoe29wZW46ICdcXHVmMDY4JywgY2xvc2U6J1xcdWYwNjcnfSwgb3B0aW9ucy50cmlnZ2VyTGFiZWwpXHJcblxyXG5cdFx0XHR2YXIgdHJpZ2dlclJhZGl1cyA9IG9wdGlvbnMudHJpZ2dlclJhZGl1c1xyXG5cdFx0XHR2YXIgaW5uZXJSYWRpdXMgPSBvcHRpb25zLmlubmVyUmFkaXVzXHJcblx0XHRcdHZhciByYWRpdXMgPSBvcHRpb25zLnJhZGl1c1xyXG5cdFx0XHR2YXIgaWNvblBvcyA9IG9wdGlvbnMuaWNvblBvc1xyXG5cdFx0XHR2YXIgaWNvblNpemUgPSBvcHRpb25zLmljb25TaXplXHJcblx0XHRcdHZhciBnYXAgPSBvcHRpb25zLmdhcFxyXG5cclxuXHRcdFx0dmFyIG1lbnVzID0gb3B0aW9ucy5tZW51c1xyXG5cdFx0XHRpZiAobWVudXMubGVuZ3RoIDwgMykge1xyXG5cdFx0XHRcdG1lbnVzID0gbWVudXMuY29uY2F0KG5ldyBBcnJheSgzIC0gbWVudXMubGVuZ3RoKS5maWxsKHt9KSlcclxuXHRcdFx0fVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdtZW51cycsIG1lbnVzKVx0XHRcclxuXHJcblx0XHRcdHZhciBzZWN0b3JBbmdsZSA9IDM2MCAvIG1lbnVzLmxlbmd0aCAtIGdhcFxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdzZWN0b3JBbmdsZScsIHNlY3RvckFuZ2xlKVxyXG5cdFx0XHR2YXIgcCA9IHBvbGFyMkNhcnQoaWNvblBvcywgMClcclxuXHRcdFx0dmFyIGFyY1BhdGggPSBnZXRBcmNQYXRoKGlubmVyUmFkaXVzLCByYWRpdXMsIC1zZWN0b3JBbmdsZS8yLCBzZWN0b3JBbmdsZS8yKVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdhcmNQYXRoJywgYXJjUGF0aClcclxuXHJcblxyXG5cdFx0XHR2YXIgd2lkdGggPSB0cmlnZ2VyUmFkaXVzICogMlxyXG5cdFx0XHR2YXIgaGVpZ2h0ID0gdHJpZ2dlclJhZGl1cyAqIDJcclxuXHRcdFx0dmFyIHggPSB0cmlnZ2VyUmFkaXVzXHJcblx0XHRcdHZhciB5ID0gdHJpZ2dlclJhZGl1c1x0XHRcclxuXHJcblxyXG5cdFx0XHRlbHQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpXHJcblxyXG5cclxuXHRcdFx0dmFyIHNlY3RvcnMgPSBtZW51cy5tYXAoZnVuY3Rpb24oaW5mbywgaWR4KSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY29uZmlnJywgaW5mbywgaWR4KVxyXG5cdFx0XHRcdHZhciBhbmdsZSA9IChzZWN0b3JBbmdsZSArIGdhcCkgICogaWR4XHJcblx0XHRcdFx0dmFyIGluZm8gPSAkLmV4dGVuZCh7ZmlsbDogJ3doaXRlJywgY29sb3I6ICdibGFjaycsIHRleHQ6ICcnfSwgaW5mbylcclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0dHJhbnNmb3JtMTogYHJvdGF0ZSgke2FuZ2xlfSlgLFxyXG5cdFx0XHRcdFx0aW5mbzogaW5mbyxcclxuXHRcdFx0XHRcdHRyYW5zZm9ybTI6IGB0cmFuc2xhdGUoJHtwLnh9LCAke3AueX0pIHJvdGF0ZSgkey1hbmdsZX0pYCBcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxzdmcgYm4tYXR0cj1cXFwid2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodFxcXCIgY2xhc3M9XFxcImNpcmN1bGFyTWVudVxcXCIgc3R5bGU9XFxcInBvc2l0aW9uOiBhYnNvbHV0ZTsgei1pbmRleDogMTAwMDAwMDsgb3ZlcmZsb3c6IHZpc2libGU7IGN1cnNvcjogY29udGV4dC1tZW51XFxcIj5cXHJcXG5cdDxnIGJuLWF0dHI9XFxcInRyYW5zZm9ybTogdHJhbnNmb3JtMVxcXCI+XFxyXFxuXHRcdDxnIGNsYXNzPVxcXCJpdGVtc1xcXCIgZGF0YS1zdmctb3JpZ2luPVxcXCIwIDBcXFwiIGJuLWVhY2g9XFxcInMgb2Ygc2VjdG9yc1xcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLml0ZW06IG9uSXRlbUNsaWNrZWRcXFwiPlxcclxcblx0XHRcdFx0PGcgY2xhc3M9XFxcIml0ZW1cXFwiIGRhdGEtc3ZnLW9yaWdpbj1cXFwiMCAwXFxcIj5cXHJcXG5cdFx0XHRcdFx0PGcgYm4tYXR0cj1cXFwidHJhbnNmb3JtOiBzLnRyYW5zZm9ybTFcXFwiPlxcclxcblx0XHRcdFx0XHRcdDxwYXRoIGJuLWF0dHI9XFxcImQ6IGFyY1BhdGgsIGZpbGw6IHMuaW5mby5maWxsXFxcIiBjbGFzcz1cXFwic2VjdG9yXFxcIiBzdHJva2U9XFxcImJsYWNrXFxcIi8+XHRcdFx0XFxyXFxuXHRcdFx0XHRcdFx0PGcgIGJuLWF0dHI9XFxcInRyYW5zZm9ybTogcy50cmFuc2Zvcm0yXFxcIj5cXHJcXG5cXHJcXG5cdFx0XHRcdFx0XHRcdDx0ZXh0IGJuLWF0dHI9XFxcImZpbGw6IHMuaW5mby5jb2xvclxcXCIgdGV4dC1hbmNob3I9XFxcIm1pZGRsZVxcXCIgYWxpZ25tZW50LWJhc2VsaW5lPVxcXCJtaWRkbGVcXFwiIGJuLXRleHQ9XFxcInMuaW5mby50ZXh0XFxcIj48L3RleHQ+XHRcdFx0XFxyXFxuXHRcdFx0XHRcdFx0PC9nPlxcclxcblx0XHRcdFx0XHQ8L2c+XFxyXFxuXHRcdFx0XHQ8L2c+XHRcdFx0XFxyXFxuXHRcdDwvZz5cXHJcXG5cdFx0PGcgY2xhc3M9XFxcInRyaWdnZXJcXFwiIGJuLWlmPVxcXCJoYXNUcmlnZ2VyXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uVHJpZ2dlckNsaWNrXFxcIj5cXHJcXG5cdFx0XHQ8Y2lyY2xlIGJuLWF0dHI9XFxcInI6IHRyaWdnZXJSYWRpdXNcXFwiIGZpbGw9XFxcInJlZFxcXCIgLz5cXHJcXG5cdFx0XHQ8dGV4dCBjbGFzcz1cXFwibGFiZWxcXFwiIHRleHQtYW5jaG9yPVxcXCJtaWRkbGVcXFwiIGFsaWdubWVudC1iYXNlbGluZT1cXFwibWlkZGxlXFxcIiBibi10ZXh0PVxcXCJ0cmlnZ2VyTGFiZWxcXFwiPjwvdGV4dD5cXHJcXG5cdFx0PC9nPlxcclxcblx0XHRcXHJcXG5cdDwvZz5cXHJcXG48L3N2Zz5cIixcclxuXHRcdFx0XHRkYXRhIDoge1xyXG5cdFx0XHRcdFx0aGFzVHJpZ2dlcjogb3B0aW9ucy5oYXNUcmlnZ2VyLFxyXG5cdFx0XHRcdFx0d2lkdGg6IHdpZHRoLFxyXG5cdFx0XHRcdFx0aGVpZ2h0OiBoZWlnaHQsXHJcblx0XHRcdFx0XHR0cmlnZ2VyUmFkaXVzOiB0cmlnZ2VyUmFkaXVzLFxyXG5cdFx0XHRcdFx0dHJhbnNmb3JtMTogYHRyYW5zbGF0ZSgke3h9LCAke3l9KWAsXHJcblx0XHRcdFx0XHR0cmlnZ2VyTGFiZWw6IHRyaWdnZXJMYWJlbC5jbG9zZSxcclxuXHRcdFx0XHRcdGFyY1BhdGg6IGFyY1BhdGgsXHJcblx0XHRcdFx0XHRzZWN0b3JzOiBzZWN0b3JzXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRcdG9uVHJpZ2dlckNsaWNrOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblRyaWdnZXJDbGljaycpXHJcblx0XHRcdFx0XHQgICAgZXYuc3RvcFByb3BhZ2F0aW9uKClcclxuXHRcdFx0XHRcdCAgICBpZiAoIW9wZW4pIHtcclxuXHRcdFx0XHRcdCAgICBcdG9wZW5NZW51KClcclxuXHRcdFx0XHRcdCAgICB9IFxyXG5cdFx0XHRcdFx0ICAgIGVsc2Uge1xyXG5cdFx0XHRcdFx0ICAgIFx0Y2xvc2VNZW51KClcclxuXHRcdFx0XHRcdCAgICB9XHRcdFx0XHRcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRvbkl0ZW1DbGlja2VkOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkl0ZW1DbGlja2VkJylcclxuXHRcdFx0XHRcdFx0dmFyIGlkeCA9IGl0ZW0uaW5kZXgodGhpcylcclxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY2xpY2snLCBpZHgpXHJcblx0XHRcdFx0XHRcdGV2ZW50cy5lbWl0KCdtZW51U2VsZWN0ZWQnLCBvcHRpb25zLm1lbnVzW2lkeF0pXHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0dmFyIHN2ZyA9IGN0cmwuZWx0XHJcblxyXG5cdFx0XHR2YXIgaXRlbSA9IHN2Zy5maW5kKCcuaXRlbScpXHJcblx0XHRcdHZhciBpdGVtcyA9IHN2Zy5maW5kKCcuaXRlbXMnKVxyXG5cdFx0XHRUd2VlbkxpdGUuc2V0KGl0ZW0sIHtzY2FsZTowLCB2aXNpYmlsaXR5OlwidmlzaWJsZVwifSlcclxuXHJcblxyXG5cdFx0XHQkKGRvY3VtZW50KS5vbignY2xpY2snLCBjbG9zZU1lbnUpXHJcblxyXG5cdFx0XHRpZiAob3B0aW9ucy5oYXNUcmlnZ2VyKSB7XHJcblx0XHRcdFx0c2hvdyhvcHRpb25zLnRyaWdnZXJQb3MubGVmdCwgb3B0aW9ucy50cmlnZ2VyUG9zLnRvcClcclxuXHRcdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBzaG93KHgsIHkpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdzaG93JywgbGVmdCwgdG9wKVxyXG5cdFx0XHRcdHZhciBsZWZ0ID0geCAtICh3aWR0aC8yKVxyXG5cdFx0XHRcdHZhciB0b3AgPSB5IC0gKGhlaWdodC8yKVxyXG5cclxuXHRcdFx0XHRzdmcuY3NzKHtsZWZ0OiBsZWZ0ICsgJ3B4JywgdG9wOiB0b3ArJ3B4J30pLnNob3coKVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gc2hvd01lbnUoeCwgeSkge1xyXG5cdFx0XHRcdHNob3coeCwgeSlcclxuXHRcdFx0XHRvcGVuTWVudSgpXHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBvcGVuTWVudSgpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnb3Blbk1lbnUnKVxyXG5cclxuXHRcdFx0XHRpZiAoIW9wZW4pIHtcclxuXHRcdFx0ICAgICAgICBUd2Vlbk1heC5zdGFnZ2VyVG8oaXRlbSwgMC43LCB7c2NhbGU6MSwgZWFzZTpFbGFzdGljLmVhc2VPdXR9LCAwLjA1KTtcclxuXHRcdFx0ICAgICAgICBjdHJsLnNldERhdGEoe3RyaWdnZXJMYWJlbDogdHJpZ2dlckxhYmVsLm9wZW59KVxyXG5cdFx0XHQgICAgICBcdG9wZW4gPSB0cnVlXHJcblx0XHQgICAgICBcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gY2xvc2VNZW51KCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdjbG9zZU1lbnUnKVxyXG5cdFx0XHRcdGlmIChvcGVuKSB7XHJcblx0XHRcdFx0ICAgIFR3ZWVuTWF4LnN0YWdnZXJUbyhpdGVtLCAuMywge3NjYWxlOjAsIGVhc2U6QmFjay5lYXNlSW59LCAwLjA1LCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQgICAgXHQvL2NvbnNvbGUubG9nKCdmaW5pc2hlZCAhIScpXHJcblx0XHRcdFx0ICAgIFx0aWYgKCFvcHRpb25zLmhhc1RyaWdnZXIpIHtcclxuXHRcdFx0XHQgICAgXHRcdHN2Zy5oaWRlKClcclxuXHRcdFx0XHQgICAgXHRcdGV2ZW50cy5lbWl0KCdtZW51Q2xvc2VkJylcclxuXHRcdFx0XHQgICAgXHR9XHJcblx0XHRcdFx0ICAgIH0pO1xyXG5cdFx0XHRcdCAgICBjdHJsLnNldERhdGEoe3RyaWdnZXJMYWJlbDogdHJpZ2dlckxhYmVsLmNsb3NlfSlcclxuXHRcdFx0XHQgICAgb3BlbiA9IGZhbHNlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnNlbGVjdCA9IGZ1bmN0aW9uKGlkeCkge1xyXG5cdFx0XHRcdGl0ZW1zLmZpbmQoJy5pdGVtLmFjdGl2ZScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxyXG5cdFx0XHRcdGlmIChpZHggPj0gMCkge1xyXG5cdFx0XHRcdFx0aXRlbS5lcShpZHgpLmFkZENsYXNzKCdhY3RpdmUnKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5vbiA9IGV2ZW50cy5vbi5iaW5kKGV2ZW50cylcclxuXHRcdFx0dGhpcy5zaG93TWVudSA9IHNob3dNZW51XHJcblx0XHRcdHRoaXMuY2xvc2VNZW51ID0gY2xvc2VNZW51XHJcblxyXG5cdFxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1x0XHJcblxyXG5cdCQkLmxvYWRTdHlsZSgnL2NvbnRyb2xzL2NpcmN1bGFyLmNzcycpXHJcbn0pKCk7Il19
