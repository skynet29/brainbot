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
