$$.configReady(function(config) {


	var dialogCtrl = $$.formDialogController('Create new user', {
		template: "<fieldset>\r\n	<div bn-control=\"InputGroupControl\">\r\n	  <label>Name</label>\r\n	  <input type=\"text\" name=\"name\" value=\"Jane Smith\" required=\"\">\r\n	</div>\r\n\r\n	<div bn-control=\"InputGroupControl\">\r\n	  <label >Email</label>\r\n	  <input type=\"text\" name=\"email\" value=\"jane@smith.com\" required=\"\">		     		\r\n	</div>\r\n\r\n	<div bn-control=\"InputGroupControl\">\r\n	  <label>Password</label>\r\n	  <input type=\"password\" name=\"password\" value=\"xxxxxxx\">		     		\r\n	</div>\r\n\r\n</fieldset>\r\n",
		onApply: function(data) {
			console.log('onApply', data)
		}
	})

	var ctrl = window.app = $$.viewController('body', {
		template: "<div id=\"main\" style=\"padding: 10px\" class=\"scrollPanel\">\r\n\r\n	<h1>PictureCarouselControl</h1>\r\n	<div bn-control=\"PictureCarouselControl\" data-animate-delay=\"1000\" data-index=\"1\" bn-data=\"images: images\">\r\n\r\n	</div>\r\n\r\n	<h1>SliderControl</h1>\r\n	<p>Range: <span bn-text=\"range\"></span></p>\r\n	<div bn-control=\"SliderControl\" data-max=\"150\" data-orientation=\"horizontal\" data-range=\"false\" bn-val=\"sliderValue\" bn-update=\"input\"></div>\r\n\r\n	<h1>DialogControl</h1>\r\n 	<button bn-event=\"click: onOpenDialog\">Open Dialog</button>\r\n 	<div bn-control=\"DialogControl\" title=\"Dialog\" bn-iface=\"dialogCtrl\" bn-options=\"dialogCtrlOptions\">\r\n 		<p>Hello World</p>\r\n 	</div>\r\n\r\n 	<h1>FormDialogController</h1>\r\n 	<button bn-event=\"click: onCreateNewUser\">Create new user</button>\r\n\r\n\r\n 	<h1>AccordionControl</h1>\r\n 	<div bn-control=\"AccordionControl\" bn-options=\"accordionCtrlOptions\">\r\n 		<div title=\"Section 1\">\r\n 			<p>\r\n 			Mauris mauris ante, blandit et, ultrices a, suscipit eget, quam. Integer\r\n    		ut neque. Vivamus nisi metus, molestie vel, gravida in, condimentum sit\r\n    		amet, nunc. Nam a nibh. Donec suscipit eros. Nam mi. Proin viverra leo ut\r\n    		odio. Curabitur malesuada. Vestibulum a velit eu ante scelerisque vulputate.\r\n	    	</p>\r\n 		</div>\r\n	<div title=\"Section 2\">\r\n 			<p>    Sed non urna. Donec et ante. Phasellus eu ligula. Vestibulum sit amet\r\n    purus. Vivamus hendrerit, dolor at aliquet laoreet, mauris turpis porttitor\r\n    velit, faucibus interdum tellus libero ac justo. Vivamus non quam. In\r\n    suscipit faucibus urna.\r\n	    	</p>\r\n 		</div>\r\n 	 </div>\r\n\r\n\r\n	<h1>TabControl</h1>\r\n\r\n	<div bn-control=\"TabControl\" bn-iface=\"tabCtrl\" bn-event=\"activate: onTabCtrlActivate\">\r\n		<div title=\"Circle\">\r\n			<svg width=\"200\" height=\"100\">\r\n				<circle r=\"20\" cx=\"100\" cy=\"50\"></circle>	\r\n			</svg>\r\n		</div>\r\n		<div title=\"Rectangle\" data-removable=\"true\">\r\n			<svg width=\"200\" height=\"100\">\r\n				<rect x=\"10\" y=\"10\" width=\"100\" height=\"50\"></rect>	\r\n			</svg>\r\n			\r\n		</div>\r\n	</div>\r\n\r\n	<button bn-event=\"click: onAddTab\">Add Tab...</button>\r\n	<button bn-event=\"click: onRemoveSelTab\">Remove selected Tab</button>\r\n\r\n	<h1>TreeControl</h1>\r\n	<div bn-control=\"TreeControl\" bn-iface=\"treeCtrl\" bn-event=\"activate: onTreeCtrlActivate, contextMenuAction: onTreeCtrlContextMenuAction\" data-checkbox=\"true\" bn-options=\"treeCtrlOptions\">\r\n<!-- 		<ul>\r\n			<li class=\"folder\">Node 1\r\n				<ul>\r\n					<li>Node 1.1</li>\r\n					<li>Node 1.2</li>\r\n				</ul>\r\n			</li>\r\n\r\n			<li>Node 2</li>\r\n		</ul>\r\n -->	</div>\r\n\r\n 	<button bn-event=\"click: onAddNode\">Add Node...</button>\r\n 	<button bn-event=\"click: onRemoveSelNode\">Remove selected node</button>\r\n\r\n 	<h1>ToolbarControl</h1>\r\n\r\n 	<div bn-control=\"ToolbarControl\">\r\n 		<button title=\"Open\" bn-event=\"click: onOpenFile\"><i class=\"fa fa-folder-open\"></i></button>\r\n\r\n 		<button title=\"Cut\"><i class=\"fa fa-cut\"></i></button>\r\n 		<button title=\"Copy\"><i class=\"fa fa-copy\"></i></button>\r\n 		<button title=\"Paste\"><i class=\"fa fa-paste\"></i></button>\r\n		<select id=\"car-type\">\r\n			<option>Compact car</option>\r\n			<option>Midsize car</option>\r\n			<option>Full size car</option>\r\n			<option>SUV</option>\r\n			<option>Luxury</option>\r\n			<option>Truck</option>\r\n			<option>Van</option>\r\n		</select> 		\r\n\r\n 	</div>\r\n\r\n 	<h1>DatePickerControl</h1>\r\n 	<p>Date: <input type=\"text\" bn-control=\"DatePickerControl\" data-show-button-panel=\"true\" bn-event=\"change: onDatePickerChange\" bn-val=\"date\"></p>\r\n\r\n 	<h1>InputGroupControl</h1>\r\n 	<div bn-control=\"InputGroupControl\">\r\n 		<label>Name</label>\r\n 		<input type=\"text\">\r\n 	</div>\r\n\r\n 	<h1>SpinnerControl</h1>\r\n 	<p>\r\n 		<label>Value</label>\r\n 		<input type=\"number\" bn-control=\"SpinnerControl\" bn-event=\"spinstop: onSpinnerValueChange\" value=\"5\" max=\"10\" step=\"0.01\"> 		\r\n 	</p>\r\n\r\n<!--  	<h1>TimeSpinnerControl</h1>\r\n 	<p>\r\n 		<label>Value</label>\r\n 		<input bn-control=\"TimeSpinnerControl\"> 		\r\n 	</p> -->\r\n\r\n</div>",
		events: {
			onAddTab: function() {
				$$.showPrompt('Tab title', 'Add Tab', function(title) {
					ctrl.scope.tabCtrl.addTab(title, {removable: false})
				})					
				
			},
			onRemoveSelTab: function() {
				var tabIndex = ctrl.scope.tabCtrl.getSelectedTabIndex()
				console.log('tabIndex', tabIndex)
				ctrl.scope.tabCtrl.removeTab(tabIndex)
			},
			onTabCtrlActivate: function() {
				console.log('onTabCtrlActivate', this.getSelectedTabIndex())
			},
			onTreeCtrlActivate: function() {
				console.log('onTreeCtrlActivate', this.getActiveNode().title)
			},
			onAddNode: function() {
				var activeNode = ctrl.scope.treeCtrl.getActiveNode()
				if (activeNode != null) {
					$$.showPrompt('Node title', 'Add Node', function(value) {
						activeNode.addNode({title: value})
						activeNode.setExpanded(true)
					})					
				}

			},
			onRemoveSelNode: function() {
				var activeNode = ctrl.scope.treeCtrl.getActiveNode()
				if (activeNode != null) {
					activeNode.remove()
				}
			},
			onTreeCtrlContextMenuAction: function(node, action) {
				console.log('onTreeCtrlContextMenuAction', node.title, action)
			},
			onDatePickerChange: function() {
				console.log('onDatePickerChange', $(this).getValue())
			},
			onSpinnerValueChange: function() {
				console.log('onSpinnerValueChange', $(this).getValue())	
			},
			onCreateNewUser: function() {
				console.log('onCreateNewUser')	

				dialogCtrl.show({name: 'Marc Delomez', email:'marc.delomez@thalesgroup.com'})
			},
			onOpenFile: function() {
				console.log('onOpenFile')
				$$.openFileDialog(function(fileName) {
					console.log('fileName', fileName)
					$$.readTextFile(fileName, function(text) {
						console.log('text', text)
					})
				})
			},
			onOpenDialog: function() {
				console.log('onOpenDialog')
				ctrl.scope.dialogCtrl.open()
			}

		},
		rules: {
			range: 'sliderValue'
		},
		data: {
			range: function() {
				return `${this.sliderValue[0]} - ${this.sliderValue[1]}`
			},
			date: new Date(1972, 0, 3),
			treeCtrlOptions: {
				selectMode: 1,
				source: [
					{title: 'Node 1', folder: true, children: [
						{title: 'Node 1.1'},
						{title: 'Node 1.2'}
					]},
					{title: 'Node 2'}
				],
				contextMenu: {
					menu: {
						edit: {name: 'Edit', icon: 'edit'},
						cut: {name: 'Cut', icon: 'cut'}
					}
/*					menu: function(node) {
						console.log('menu', node)
						return {
							paste: {name: 'Paste', icon: 'paste'},

						}
					}
*/				}
			},
			accordionCtrlOptions: {
				icons: {
      				header: "ui-icon-circle-arrow-e",
			      	activeHeader: "ui-icon-circle-arrow-s"
    			}
			},
			dialogCtrlOptions: {
				buttons: {
					'Cancel': function() {
						this.close()
					}
				}
			},
			sliderValue: [30, 60],
			images: ['image1.png', 'image2.png', 'image3.png', 'image4.png'].map((i) => '/pages/test-controls/assets/' + i)
		}

	})
})

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQuY29uZmlnUmVhZHkoZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cclxuXHR2YXIgZGlhbG9nQ3RybCA9ICQkLmZvcm1EaWFsb2dDb250cm9sbGVyKCdDcmVhdGUgbmV3IHVzZXInLCB7XHJcblx0XHR0ZW1wbGF0ZTogXCI8ZmllbGRzZXQ+XFxyXFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIklucHV0R3JvdXBDb250cm9sXFxcIj5cXHJcXG5cdCAgPGxhYmVsPk5hbWU8L2xhYmVsPlxcclxcblx0ICA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmFtZT1cXFwibmFtZVxcXCIgdmFsdWU9XFxcIkphbmUgU21pdGhcXFwiIHJlcXVpcmVkPVxcXCJcXFwiPlxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIklucHV0R3JvdXBDb250cm9sXFxcIj5cXHJcXG5cdCAgPGxhYmVsID5FbWFpbDwvbGFiZWw+XFxyXFxuXHQgIDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBuYW1lPVxcXCJlbWFpbFxcXCIgdmFsdWU9XFxcImphbmVAc21pdGguY29tXFxcIiByZXF1aXJlZD1cXFwiXFxcIj5cdFx0ICAgICBcdFx0XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiSW5wdXRHcm91cENvbnRyb2xcXFwiPlxcclxcblx0ICA8bGFiZWw+UGFzc3dvcmQ8L2xhYmVsPlxcclxcblx0ICA8aW5wdXQgdHlwZT1cXFwicGFzc3dvcmRcXFwiIG5hbWU9XFxcInBhc3N3b3JkXFxcIiB2YWx1ZT1cXFwieHh4eHh4eFxcXCI+XHRcdCAgICAgXHRcdFxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuPC9maWVsZHNldD5cXHJcXG5cIixcclxuXHRcdG9uQXBwbHk6IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ29uQXBwbHknLCBkYXRhKVxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG5cdHZhciBjdHJsID0gd2luZG93LmFwcCA9ICQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xyXG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBpZD1cXFwibWFpblxcXCIgc3R5bGU9XFxcInBhZGRpbmc6IDEwcHhcXFwiIGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxyXFxuXFxyXFxuXHQ8aDE+UGljdHVyZUNhcm91c2VsQ29udHJvbDwvaDE+XFxyXFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlBpY3R1cmVDYXJvdXNlbENvbnRyb2xcXFwiIGRhdGEtYW5pbWF0ZS1kZWxheT1cXFwiMTAwMFxcXCIgZGF0YS1pbmRleD1cXFwiMVxcXCIgYm4tZGF0YT1cXFwiaW1hZ2VzOiBpbWFnZXNcXFwiPlxcclxcblxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8aDE+U2xpZGVyQ29udHJvbDwvaDE+XFxyXFxuXHQ8cD5SYW5nZTogPHNwYW4gYm4tdGV4dD1cXFwicmFuZ2VcXFwiPjwvc3Bhbj48L3A+XFxyXFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlNsaWRlckNvbnRyb2xcXFwiIGRhdGEtbWF4PVxcXCIxNTBcXFwiIGRhdGEtb3JpZW50YXRpb249XFxcImhvcml6b250YWxcXFwiIGRhdGEtcmFuZ2U9XFxcImZhbHNlXFxcIiBibi12YWw9XFxcInNsaWRlclZhbHVlXFxcIiBibi11cGRhdGU9XFxcImlucHV0XFxcIj48L2Rpdj5cXHJcXG5cXHJcXG5cdDxoMT5EaWFsb2dDb250cm9sPC9oMT5cXHJcXG4gXHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25PcGVuRGlhbG9nXFxcIj5PcGVuIERpYWxvZzwvYnV0dG9uPlxcclxcbiBcdDxkaXYgYm4tY29udHJvbD1cXFwiRGlhbG9nQ29udHJvbFxcXCIgdGl0bGU9XFxcIkRpYWxvZ1xcXCIgYm4taWZhY2U9XFxcImRpYWxvZ0N0cmxcXFwiIGJuLW9wdGlvbnM9XFxcImRpYWxvZ0N0cmxPcHRpb25zXFxcIj5cXHJcXG4gXHRcdDxwPkhlbGxvIFdvcmxkPC9wPlxcclxcbiBcdDwvZGl2PlxcclxcblxcclxcbiBcdDxoMT5Gb3JtRGlhbG9nQ29udHJvbGxlcjwvaDE+XFxyXFxuIFx0PGJ1dHRvbiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQ3JlYXRlTmV3VXNlclxcXCI+Q3JlYXRlIG5ldyB1c2VyPC9idXR0b24+XFxyXFxuXFxyXFxuXFxyXFxuIFx0PGgxPkFjY29yZGlvbkNvbnRyb2w8L2gxPlxcclxcbiBcdDxkaXYgYm4tY29udHJvbD1cXFwiQWNjb3JkaW9uQ29udHJvbFxcXCIgYm4tb3B0aW9ucz1cXFwiYWNjb3JkaW9uQ3RybE9wdGlvbnNcXFwiPlxcclxcbiBcdFx0PGRpdiB0aXRsZT1cXFwiU2VjdGlvbiAxXFxcIj5cXHJcXG4gXHRcdFx0PHA+XFxyXFxuIFx0XHRcdE1hdXJpcyBtYXVyaXMgYW50ZSwgYmxhbmRpdCBldCwgdWx0cmljZXMgYSwgc3VzY2lwaXQgZWdldCwgcXVhbS4gSW50ZWdlclxcclxcbiAgICBcdFx0dXQgbmVxdWUuIFZpdmFtdXMgbmlzaSBtZXR1cywgbW9sZXN0aWUgdmVsLCBncmF2aWRhIGluLCBjb25kaW1lbnR1bSBzaXRcXHJcXG4gICAgXHRcdGFtZXQsIG51bmMuIE5hbSBhIG5pYmguIERvbmVjIHN1c2NpcGl0IGVyb3MuIE5hbSBtaS4gUHJvaW4gdml2ZXJyYSBsZW8gdXRcXHJcXG4gICAgXHRcdG9kaW8uIEN1cmFiaXR1ciBtYWxlc3VhZGEuIFZlc3RpYnVsdW0gYSB2ZWxpdCBldSBhbnRlIHNjZWxlcmlzcXVlIHZ1bHB1dGF0ZS5cXHJcXG5cdCAgICBcdDwvcD5cXHJcXG4gXHRcdDwvZGl2Plxcclxcblx0PGRpdiB0aXRsZT1cXFwiU2VjdGlvbiAyXFxcIj5cXHJcXG4gXHRcdFx0PHA+ICAgIFNlZCBub24gdXJuYS4gRG9uZWMgZXQgYW50ZS4gUGhhc2VsbHVzIGV1IGxpZ3VsYS4gVmVzdGlidWx1bSBzaXQgYW1ldFxcclxcbiAgICBwdXJ1cy4gVml2YW11cyBoZW5kcmVyaXQsIGRvbG9yIGF0IGFsaXF1ZXQgbGFvcmVldCwgbWF1cmlzIHR1cnBpcyBwb3J0dGl0b3JcXHJcXG4gICAgdmVsaXQsIGZhdWNpYnVzIGludGVyZHVtIHRlbGx1cyBsaWJlcm8gYWMganVzdG8uIFZpdmFtdXMgbm9uIHF1YW0uIEluXFxyXFxuICAgIHN1c2NpcGl0IGZhdWNpYnVzIHVybmEuXFxyXFxuXHQgICAgXHQ8L3A+XFxyXFxuIFx0XHQ8L2Rpdj5cXHJcXG4gXHQgPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXHQ8aDE+VGFiQ29udHJvbDwvaDE+XFxyXFxuXFxyXFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRhYkNvbnRyb2xcXFwiIGJuLWlmYWNlPVxcXCJ0YWJDdHJsXFxcIiBibi1ldmVudD1cXFwiYWN0aXZhdGU6IG9uVGFiQ3RybEFjdGl2YXRlXFxcIj5cXHJcXG5cdFx0PGRpdiB0aXRsZT1cXFwiQ2lyY2xlXFxcIj5cXHJcXG5cdFx0XHQ8c3ZnIHdpZHRoPVxcXCIyMDBcXFwiIGhlaWdodD1cXFwiMTAwXFxcIj5cXHJcXG5cdFx0XHRcdDxjaXJjbGUgcj1cXFwiMjBcXFwiIGN4PVxcXCIxMDBcXFwiIGN5PVxcXCI1MFxcXCI+PC9jaXJjbGU+XHRcXHJcXG5cdFx0XHQ8L3N2Zz5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHRcdDxkaXYgdGl0bGU9XFxcIlJlY3RhbmdsZVxcXCIgZGF0YS1yZW1vdmFibGU9XFxcInRydWVcXFwiPlxcclxcblx0XHRcdDxzdmcgd2lkdGg9XFxcIjIwMFxcXCIgaGVpZ2h0PVxcXCIxMDBcXFwiPlxcclxcblx0XHRcdFx0PHJlY3QgeD1cXFwiMTBcXFwiIHk9XFxcIjEwXFxcIiB3aWR0aD1cXFwiMTAwXFxcIiBoZWlnaHQ9XFxcIjUwXFxcIj48L3JlY3Q+XHRcXHJcXG5cdFx0XHQ8L3N2Zz5cXHJcXG5cdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkFkZFRhYlxcXCI+QWRkIFRhYi4uLjwvYnV0dG9uPlxcclxcblx0PGJ1dHRvbiBibi1ldmVudD1cXFwiY2xpY2s6IG9uUmVtb3ZlU2VsVGFiXFxcIj5SZW1vdmUgc2VsZWN0ZWQgVGFiPC9idXR0b24+XFxyXFxuXFxyXFxuXHQ8aDE+VHJlZUNvbnRyb2w8L2gxPlxcclxcblx0PGRpdiBibi1jb250cm9sPVxcXCJUcmVlQ29udHJvbFxcXCIgYm4taWZhY2U9XFxcInRyZWVDdHJsXFxcIiBibi1ldmVudD1cXFwiYWN0aXZhdGU6IG9uVHJlZUN0cmxBY3RpdmF0ZSwgY29udGV4dE1lbnVBY3Rpb246IG9uVHJlZUN0cmxDb250ZXh0TWVudUFjdGlvblxcXCIgZGF0YS1jaGVja2JveD1cXFwidHJ1ZVxcXCIgYm4tb3B0aW9ucz1cXFwidHJlZUN0cmxPcHRpb25zXFxcIj5cXHJcXG48IS0tIFx0XHQ8dWw+XFxyXFxuXHRcdFx0PGxpIGNsYXNzPVxcXCJmb2xkZXJcXFwiPk5vZGUgMVxcclxcblx0XHRcdFx0PHVsPlxcclxcblx0XHRcdFx0XHQ8bGk+Tm9kZSAxLjE8L2xpPlxcclxcblx0XHRcdFx0XHQ8bGk+Tm9kZSAxLjI8L2xpPlxcclxcblx0XHRcdFx0PC91bD5cXHJcXG5cdFx0XHQ8L2xpPlxcclxcblxcclxcblx0XHRcdDxsaT5Ob2RlIDI8L2xpPlxcclxcblx0XHQ8L3VsPlxcclxcbiAtLT5cdDwvZGl2PlxcclxcblxcclxcbiBcdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkFkZE5vZGVcXFwiPkFkZCBOb2RlLi4uPC9idXR0b24+XFxyXFxuIFx0PGJ1dHRvbiBibi1ldmVudD1cXFwiY2xpY2s6IG9uUmVtb3ZlU2VsTm9kZVxcXCI+UmVtb3ZlIHNlbGVjdGVkIG5vZGU8L2J1dHRvbj5cXHJcXG5cXHJcXG4gXHQ8aDE+VG9vbGJhckNvbnRyb2w8L2gxPlxcclxcblxcclxcbiBcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcbiBcdFx0PGJ1dHRvbiB0aXRsZT1cXFwiT3BlblxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbk9wZW5GaWxlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtZm9sZGVyLW9wZW5cXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cXHJcXG4gXHRcdDxidXR0b24gdGl0bGU9XFxcIkN1dFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWN1dFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcbiBcdFx0PGJ1dHRvbiB0aXRsZT1cXFwiQ29weVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWNvcHlcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG4gXHRcdDxidXR0b24gdGl0bGU9XFxcIlBhc3RlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtcGFzdGVcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PHNlbGVjdCBpZD1cXFwiY2FyLXR5cGVcXFwiPlxcclxcblx0XHRcdDxvcHRpb24+Q29tcGFjdCBjYXI8L29wdGlvbj5cXHJcXG5cdFx0XHQ8b3B0aW9uPk1pZHNpemUgY2FyPC9vcHRpb24+XFxyXFxuXHRcdFx0PG9wdGlvbj5GdWxsIHNpemUgY2FyPC9vcHRpb24+XFxyXFxuXHRcdFx0PG9wdGlvbj5TVVY8L29wdGlvbj5cXHJcXG5cdFx0XHQ8b3B0aW9uPkx1eHVyeTwvb3B0aW9uPlxcclxcblx0XHRcdDxvcHRpb24+VHJ1Y2s8L29wdGlvbj5cXHJcXG5cdFx0XHQ8b3B0aW9uPlZhbjwvb3B0aW9uPlxcclxcblx0XHQ8L3NlbGVjdD4gXHRcdFxcclxcblxcclxcbiBcdDwvZGl2PlxcclxcblxcclxcbiBcdDxoMT5EYXRlUGlja2VyQ29udHJvbDwvaDE+XFxyXFxuIFx0PHA+RGF0ZTogPGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGJuLWNvbnRyb2w9XFxcIkRhdGVQaWNrZXJDb250cm9sXFxcIiBkYXRhLXNob3ctYnV0dG9uLXBhbmVsPVxcXCJ0cnVlXFxcIiBibi1ldmVudD1cXFwiY2hhbmdlOiBvbkRhdGVQaWNrZXJDaGFuZ2VcXFwiIGJuLXZhbD1cXFwiZGF0ZVxcXCI+PC9wPlxcclxcblxcclxcbiBcdDxoMT5JbnB1dEdyb3VwQ29udHJvbDwvaDE+XFxyXFxuIFx0PGRpdiBibi1jb250cm9sPVxcXCJJbnB1dEdyb3VwQ29udHJvbFxcXCI+XFxyXFxuIFx0XHQ8bGFiZWw+TmFtZTwvbGFiZWw+XFxyXFxuIFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCI+XFxyXFxuIFx0PC9kaXY+XFxyXFxuXFxyXFxuIFx0PGgxPlNwaW5uZXJDb250cm9sPC9oMT5cXHJcXG4gXHQ8cD5cXHJcXG4gXHRcdDxsYWJlbD5WYWx1ZTwvbGFiZWw+XFxyXFxuIFx0XHQ8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiBibi1jb250cm9sPVxcXCJTcGlubmVyQ29udHJvbFxcXCIgYm4tZXZlbnQ9XFxcInNwaW5zdG9wOiBvblNwaW5uZXJWYWx1ZUNoYW5nZVxcXCIgdmFsdWU9XFxcIjVcXFwiIG1heD1cXFwiMTBcXFwiIHN0ZXA9XFxcIjAuMDFcXFwiPiBcdFx0XFxyXFxuIFx0PC9wPlxcclxcblxcclxcbjwhLS0gIFx0PGgxPlRpbWVTcGlubmVyQ29udHJvbDwvaDE+XFxyXFxuIFx0PHA+XFxyXFxuIFx0XHQ8bGFiZWw+VmFsdWU8L2xhYmVsPlxcclxcbiBcdFx0PGlucHV0IGJuLWNvbnRyb2w9XFxcIlRpbWVTcGlubmVyQ29udHJvbFxcXCI+IFx0XHRcXHJcXG4gXHQ8L3A+IC0tPlxcclxcblxcclxcbjwvZGl2PlwiLFxyXG5cdFx0ZXZlbnRzOiB7XHJcblx0XHRcdG9uQWRkVGFiOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkJC5zaG93UHJvbXB0KCdUYWIgdGl0bGUnLCAnQWRkIFRhYicsIGZ1bmN0aW9uKHRpdGxlKSB7XHJcblx0XHRcdFx0XHRjdHJsLnNjb3BlLnRhYkN0cmwuYWRkVGFiKHRpdGxlLCB7cmVtb3ZhYmxlOiBmYWxzZX0pXHJcblx0XHRcdFx0fSlcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHJcblx0XHRcdH0sXHJcblx0XHRcdG9uUmVtb3ZlU2VsVGFiOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgdGFiSW5kZXggPSBjdHJsLnNjb3BlLnRhYkN0cmwuZ2V0U2VsZWN0ZWRUYWJJbmRleCgpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ3RhYkluZGV4JywgdGFiSW5kZXgpXHJcblx0XHRcdFx0Y3RybC5zY29wZS50YWJDdHJsLnJlbW92ZVRhYih0YWJJbmRleClcclxuXHRcdFx0fSxcclxuXHRcdFx0b25UYWJDdHJsQWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvblRhYkN0cmxBY3RpdmF0ZScsIHRoaXMuZ2V0U2VsZWN0ZWRUYWJJbmRleCgpKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRvblRyZWVDdHJsQWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvblRyZWVDdHJsQWN0aXZhdGUnLCB0aGlzLmdldEFjdGl2ZU5vZGUoKS50aXRsZSlcclxuXHRcdFx0fSxcclxuXHRcdFx0b25BZGROb2RlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgYWN0aXZlTm9kZSA9IGN0cmwuc2NvcGUudHJlZUN0cmwuZ2V0QWN0aXZlTm9kZSgpXHJcblx0XHRcdFx0aWYgKGFjdGl2ZU5vZGUgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0JCQuc2hvd1Byb21wdCgnTm9kZSB0aXRsZScsICdBZGQgTm9kZScsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGFjdGl2ZU5vZGUuYWRkTm9kZSh7dGl0bGU6IHZhbHVlfSlcclxuXHRcdFx0XHRcdFx0YWN0aXZlTm9kZS5zZXRFeHBhbmRlZCh0cnVlKVxyXG5cdFx0XHRcdFx0fSlcdFx0XHRcdFx0XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fSxcclxuXHRcdFx0b25SZW1vdmVTZWxOb2RlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgYWN0aXZlTm9kZSA9IGN0cmwuc2NvcGUudHJlZUN0cmwuZ2V0QWN0aXZlTm9kZSgpXHJcblx0XHRcdFx0aWYgKGFjdGl2ZU5vZGUgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0YWN0aXZlTm9kZS5yZW1vdmUoKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0b25UcmVlQ3RybENvbnRleHRNZW51QWN0aW9uOiBmdW5jdGlvbihub2RlLCBhY3Rpb24pIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnb25UcmVlQ3RybENvbnRleHRNZW51QWN0aW9uJywgbm9kZS50aXRsZSwgYWN0aW9uKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRvbkRhdGVQaWNrZXJDaGFuZ2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvbkRhdGVQaWNrZXJDaGFuZ2UnLCAkKHRoaXMpLmdldFZhbHVlKCkpXHJcblx0XHRcdH0sXHJcblx0XHRcdG9uU3Bpbm5lclZhbHVlQ2hhbmdlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnb25TcGlubmVyVmFsdWVDaGFuZ2UnLCAkKHRoaXMpLmdldFZhbHVlKCkpXHRcclxuXHRcdFx0fSxcclxuXHRcdFx0b25DcmVhdGVOZXdVc2VyOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnb25DcmVhdGVOZXdVc2VyJylcdFxyXG5cclxuXHRcdFx0XHRkaWFsb2dDdHJsLnNob3coe25hbWU6ICdNYXJjIERlbG9tZXonLCBlbWFpbDonbWFyYy5kZWxvbWV6QHRoYWxlc2dyb3VwLmNvbSd9KVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRvbk9wZW5GaWxlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnb25PcGVuRmlsZScpXHJcblx0XHRcdFx0JCQub3BlbkZpbGVEaWFsb2coZnVuY3Rpb24oZmlsZU5hbWUpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdmaWxlTmFtZScsIGZpbGVOYW1lKVxyXG5cdFx0XHRcdFx0JCQucmVhZFRleHRGaWxlKGZpbGVOYW1lLCBmdW5jdGlvbih0ZXh0KSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCd0ZXh0JywgdGV4dClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fSxcclxuXHRcdFx0b25PcGVuRGlhbG9nOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnb25PcGVuRGlhbG9nJylcclxuXHRcdFx0XHRjdHJsLnNjb3BlLmRpYWxvZ0N0cmwub3BlbigpXHJcblx0XHRcdH1cclxuXHJcblx0XHR9LFxyXG5cdFx0cnVsZXM6IHtcclxuXHRcdFx0cmFuZ2U6ICdzbGlkZXJWYWx1ZSdcclxuXHRcdH0sXHJcblx0XHRkYXRhOiB7XHJcblx0XHRcdHJhbmdlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gYCR7dGhpcy5zbGlkZXJWYWx1ZVswXX0gLSAke3RoaXMuc2xpZGVyVmFsdWVbMV19YFxyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYXRlOiBuZXcgRGF0ZSgxOTcyLCAwLCAzKSxcclxuXHRcdFx0dHJlZUN0cmxPcHRpb25zOiB7XHJcblx0XHRcdFx0c2VsZWN0TW9kZTogMSxcclxuXHRcdFx0XHRzb3VyY2U6IFtcclxuXHRcdFx0XHRcdHt0aXRsZTogJ05vZGUgMScsIGZvbGRlcjogdHJ1ZSwgY2hpbGRyZW46IFtcclxuXHRcdFx0XHRcdFx0e3RpdGxlOiAnTm9kZSAxLjEnfSxcclxuXHRcdFx0XHRcdFx0e3RpdGxlOiAnTm9kZSAxLjInfVxyXG5cdFx0XHRcdFx0XX0sXHJcblx0XHRcdFx0XHR7dGl0bGU6ICdOb2RlIDInfVxyXG5cdFx0XHRcdF0sXHJcblx0XHRcdFx0Y29udGV4dE1lbnU6IHtcclxuXHRcdFx0XHRcdG1lbnU6IHtcclxuXHRcdFx0XHRcdFx0ZWRpdDoge25hbWU6ICdFZGl0JywgaWNvbjogJ2VkaXQnfSxcclxuXHRcdFx0XHRcdFx0Y3V0OiB7bmFtZTogJ0N1dCcsIGljb246ICdjdXQnfVxyXG5cdFx0XHRcdFx0fVxyXG4vKlx0XHRcdFx0XHRtZW51OiBmdW5jdGlvbihub2RlKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdtZW51Jywgbm9kZSlcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdFx0XHRwYXN0ZToge25hbWU6ICdQYXN0ZScsIGljb246ICdwYXN0ZSd9LFxyXG5cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG4qL1x0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRhY2NvcmRpb25DdHJsT3B0aW9uczoge1xyXG5cdFx0XHRcdGljb25zOiB7XHJcbiAgICAgIFx0XHRcdFx0aGVhZGVyOiBcInVpLWljb24tY2lyY2xlLWFycm93LWVcIixcclxuXHRcdFx0ICAgICAgXHRhY3RpdmVIZWFkZXI6IFwidWktaWNvbi1jaXJjbGUtYXJyb3ctc1wiXHJcbiAgICBcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdGRpYWxvZ0N0cmxPcHRpb25zOiB7XHJcblx0XHRcdFx0YnV0dG9uczoge1xyXG5cdFx0XHRcdFx0J0NhbmNlbCc6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLmNsb3NlKClcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdHNsaWRlclZhbHVlOiBbMzAsIDYwXSxcclxuXHRcdFx0aW1hZ2VzOiBbJ2ltYWdlMS5wbmcnLCAnaW1hZ2UyLnBuZycsICdpbWFnZTMucG5nJywgJ2ltYWdlNC5wbmcnXS5tYXAoKGkpID0+ICcvcGFnZXMvdGVzdC1jb250cm9scy9hc3NldHMvJyArIGkpXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcbn0pXHJcbiJdfQ==
