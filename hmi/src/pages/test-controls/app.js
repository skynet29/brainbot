$$.configReady(function(config) {


	var dialogCtrl = $$.formDialogController('Create new user', {
		template: {gulp_inject: './dialog.html'},
		onApply: function(data) {
			console.log('onApply', data)
		}
	})

	var ctrl = window.app = $$.viewController('body', {
		template: {gulp_inject: './app.html'},
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
