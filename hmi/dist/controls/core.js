(function() {

	$$.registerControlEx('CarouselControl', {

		props: {
			width: {val: 300},
			height: {val: 200},
			animateDelay: {val: 1000},
			index: {
				val: 0,
				set: 'setIndex'
			} 
		},
		iface: 'setIndex(idx);refresh()',

		
	lib: 'core',
init: function(elt, options) {
	


			var width = options.width + 'px'
			var height = options.height + 'px'
			elt.css('width', width).css('height', height)

			console.log(`[CarouselControl] options`, options)

			var ctrl = null
			var items
			var idx


			function refresh() {
				//console.log('[CarouselControl] refresh')
				items = elt.children('div').remove().css('width', width).css('height', height)		

				idx = Math.max(0, Math.min(options.index, items.length))
				//console.log(`[CarouselControl] idx`, idx)

				function animate(direction) {
					ctrl.setData({leftDisabled: true, rightDisabled: true})
					var op = direction == 'left' ? '+=' : '-='
					idx = direction == 'left' ? idx-1 : idx+1

					ctrl.scope.items.animate({left: op + width}, options.animateDelay, function() {
						checkBtns()
					})
				}

				ctrl = $$.viewController(elt, {
					template: "<div class=\"container\">\r\n	<div class=\"viewport\">\r\n		<div class=\"items\" bn-bind=\"items\"></div>	\r\n	</div>\r\n	<div class=\"overlay\">\r\n		<div>\r\n			<button \r\n				bn-event=\"click: onLeft\" \r\n				bn-prop=\"hidden: leftDisabled\"\r\n				>\r\n				<i class=\"fa fa-2x fa-chevron-circle-left\"></i>\r\n			</button>			\r\n		</div>\r\n\r\n		<div>\r\n			<button \r\n				bn-event=\"click: onRight\" \r\n				bn-prop=\"hidden: rightDisabled\"\r\n			>\r\n				<i class=\"fa fa-2x fa-chevron-circle-right\"></i>\r\n			</button>			\r\n		</div>\r\n\r\n	</div>\r\n\r\n</div>",
					data: {
						leftDisabled: true,
						rightDisabled: false
					},
					init: function() {
						this.scope.items.append(items)
						this.scope.items.css('left', (-idx * options.width) + 'px')
						//checkBtns()
					},
					events: {
						onLeft: function() {
							animate('left')
						},
						onRight: function() {
							animate('right')
						}				
					}
				})
				checkBtns()		

			}		

			function setIndex(index) {
				console.log('[CarouselControl] setIndex', index)
				idx =  Math.max(0, Math.min(index, items.length))
				ctrl.scope.items.css('left', (-idx * options.width) + 'px')
				checkBtns(idx)
			}

			function checkBtns() {
				//console.log('checkBtns', idx, items.length)
				ctrl.setData({
					leftDisabled: idx == 0,
					rightDisabled: idx == items.length - 1
				})
			}		

	 		refresh()

			return {
				setIndex,
				refresh: refresh,
	/*			params: function() {
					return {index: idx}
				}*/
			}
		}

	})

})();

$$.registerControlEx('CheckGroupControl', {
	
	lib: 'core',
init: function(elt) {

		elt.on('click', 'input[type=checkbox]', function() {
			elt.trigger('input')
		})

		function getValue() {
			var ret = []
			elt.find('input[type=checkbox]:checked').each(function() {
				ret.push($(this).val())
			})	
			return ret	
		}

		function setValue(value) {
			if (Array.isArray(value)) {
				elt.find('input[type=checkbox]').each(function() {
					$(this).prop('checked', value.indexOf($(this).val()) >= 0)
				})
			}		
		}

		return {
			getValue: getValue,
			setValue: setValue
		}
	}

});







$$.registerControlEx('HtmlEditorControl', {

	iface: 'html()',

	
	lib: 'core',
init: function(elt) {

		elt.addClass('bn-flex-row')

		var cmdArgs = {
			'foreColor': function() {
				return ctrl.model.color
			}
		}


		var ctrl = $$.viewController(elt, {
			template: "<div class=\"bn-flex-col bn-flex-1\">\r\n\r\n	<div bn-event=\"click.cmd: onCommand\">\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"bold\"><i class=\"fa fa-bold\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"italic\"><i class=\"fa fa-italic\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"underline\"><i class=\"fa fa-underline\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"strikeThrough\"><i class=\"fa fa-strikethrough\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"foreColor\" bn-menu=\"colorItems\" bn-event=\"menuChange: onColorMenuChange\"><i class=\"fa fa-pencil\" bn-style=\"color: color\"></i></button>\r\n		</div>\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"justifyLeft\"><i class=\"fa fa-align-left\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"justifyCenter\"><i class=\"fa fa-align-center\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"justifyRight\"><i class=\"fa fa-align-right\"></i></button>\r\n		</div>	\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"indent\"><i class=\"fa fa-indent\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"outdent\"><i class=\"fa fa-outdent\"></i></button>\r\n		</div>	\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"insertHorizontalRule\">hr</button>\r\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h1\">h1</button>\r\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h2\">h2</button>\r\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h3\">h3</button>\r\n		</div>		\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"insertUnorderedList\"><i class=\"fa fa-list-ul\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"insertOrderedList\"><i class=\"fa fa-list-ol\"></i></button>\r\n		</div>\r\n\r\n	</div>	\r\n	<div contenteditable=\"true\" class=\"bn-flex-1 editor\" bn-bind=\"editor\"></div>\r\n</div>\r\n",
			data: {
				color: 'blue',
				colorItems: {
					black: {name: 'Black'},
					red: {name: 'Red'},
					green: {name: 'Green'},
					blue: {name: 'Blue'},
					yellow: {name: 'Yellow'},
					cyan: {name: 'Cyan'},
					magenta: {name: 'Magenta'}
				}
			},
			events: {
				onCommand: function() {

					var cmd = $(this).data('cmd')
					var cmdArg = $(this).data('cmdArg')
					//console.log('onCommand', cmd, cmdArg)

					var cmdArg = cmdArg || cmdArgs[cmd]
					if (typeof cmdArg == 'function') {
						cmdArg = cmdArg()
					}
					//console.log('onCommand', cmd, cmdArg)

					document.execCommand(cmd, false, cmdArg)
				
				},
				onColorMenuChange: function(ev, color) {
					//console.log('onColorMenuChange', color)
					ctrl.setData({color})
				}

			}

		})



		return {
			html: function() {
				return ctrl.scope.editor.html()
			}
		}
	}

});

$$.registerControlEx('FileControl', {
	deps: ['FileService'], 
	props: {
		toolbar: {val: true},
		imageOnly: {val: false},
		maxUploadSize: {val: 2*1024*2014} // 2 Mo		
	},
	events: 'fileClick',
	iface: 'getFiles()',

	
	lib: 'core',
init: function(elt, options, fileSrv) {

		var cutFiles = []
		var cutDir = '/'
		var copy = true

		function getSelFiles() {
			var selDiv = elt.find('.thumbnail.selected a')

			var selFile = []
			selDiv.each(function() {
				selFile.push(ctrl.model.rootDir + $(this).data('name'))
			})
			return selFile
		}


		var ctrl = window.fileCtrl = $$.viewController(elt, {
			template: "<div class=\"bn-flex-col bn-flex-1\">\r\n	<div class=\"toolbar\" bn-show=\"showToolbar\">\r\n		<button \r\n			bn-event=\"click: onToggleSelMode\" \r\n			title=\"Select mode\" \r\n			bn-class=\"selected: selMode\"\r\n			>\r\n				<i class=\"fa fa-2x fa-check\"></i>\r\n		</button>\r\n\r\n		<button \r\n			bn-event=\"click: onCancelSelection\" \r\n			title=\"Cancel selection\"\r\n			bn-prop=\"disabled: !canCancel\"  \r\n			>\r\n				<i class=\"fa fa-2x fa-times\"></i>\r\n		</button>\r\n\r\n		<button \r\n			bn-event=\"click: onDelete\" \r\n			bn-prop=\"disabled: !fileSelected\" \r\n			title=\"Delete selected files\"\r\n			>\r\n				<i class=\"fa fa-2x fa-trash\" ></i>\r\n		</button>\r\n\r\n		<button \r\n			title=\"Cut\" \r\n			bn-event=\"click: onCut\" \r\n			bn-prop=\"disabled: !fileSelected\"\r\n			>\r\n				<i class=\"fa fa-2x fa-cut\" ></i>\r\n		</button>\r\n\r\n		<button \r\n			title=\"Copy\" \r\n			bn-prop=\"disabled: !fileSelected\" \r\n			bn-event=\"click: onCopy\"\r\n			>\r\n				<i class=\"fa fa-2x fa-copy\" ></i>\r\n		</button>\r\n\r\n		<button \r\n			title=\"Paste\" \r\n			bn-prop=\"disabled: !canPaste\" \r\n			bn-event=\"click: onPaste\"\r\n			>\r\n				<i class=\"fa fa-2x fa-paste\" ></i>\r\n		</button>\r\n\r\n		<button \r\n			bn-event=\"click: onCreateFolder\" \r\n			title=\"New folder\"\r\n			>\r\n				<i class=\"fa fa-2x fa-folder-open\" ></i>\r\n		</button>\r\n		\r\n		<button \r\n			title=\"Import file\" \r\n			bn-event=\"click: onImportFile\"\r\n			>\r\n				<i class=\"fa fa-2x fa-upload\" ></i>\r\n		</button>		\r\n\r\n	</div>\r\n	<div class=\"pathPanel\">\r\n		Path:&nbsp;<span bn-text=\"rootDir\"></span>\r\n	</div>\r\n\r\n	<div>\r\n		<button class=\"backBtn\" bn-event=\"click: onBackBtn\" title=\"Back\" bn-show=\"backVisible\">\r\n			<i class=\"fa fa-2x fa-arrow-circle-left\"></i>\r\n		</button>		\r\n	</div>\r\n\r\n	<div bn-each=\"f of files\" class=\"container\" bn-event=\"click.folder: onFolder, click.file: onFile\">\r\n		\r\n		<div class=\"thumbnail\">\r\n				<a bn-if=\"f.isImage\" href=\"#\" bn-attr=\"title: f.size\" class=\"file\" bn-data=\"name: f.name\">\r\n					<div>\r\n						<img bn-attr=\"src: f.imgUrl\">\r\n					</div>\r\n					\r\n					<span bn-text=\"f.name\"></span>\r\n				</a>			\r\n				<a bn-if=\"f.isDir\" href=\"#\" class=\"folder\" bn-data=\"name: f.name\">\r\n					<div>\r\n						<i class=\"fa fa-4x fa-folder-open w3-text-blue-grey\"></i>\r\n					</div>\r\n					\r\n					<span bn-text=\"f.name\"></span>\r\n				</a>\r\n				<a bn-if=\"f.isFile\" href=\"#\" bn-data=\"name: f.name\" class=\"file\" bn-attr=\"title: f.size\">\r\n					<div>\r\n						<i class=\"fa fa-4x fa-file w3-text-blue-grey\"></i>\r\n					</div>\r\n					\r\n					<span bn-text=\"f.name\"></span>\r\n				</a>			\r\n			\r\n		</div>\r\n	</div>\r\n</div>\r\n\r\n",
			data: {
				files: [],
				cutFiles: [],
				rootDir: '/',
				cutDir: '/',
				backVisible: function() {
					return this.rootDir != '/'
				},
				selMode: false,
				fileSelected: false,
				showToolbar: options.toolbar,
				canCancel: function() {
					return this.cutFiles.length != 0 || this.fileSelected
				},
				canPaste: function() {
					return this.cutFiles.length != 0 && this.rootDir != this.cutDir
				}
			},
			events: {
				onFolder: function(ev) {
					console.log('onFolder')
					if (ctrl.model.selMode) {
						console.log('this', $(this).closest('.thumbnail'))
						$(this).closest('.thumbnail').toggleClass('selected')

						ctrl.setData('fileSelected', getSelFiles().length != 0)
						return
					}

					var dirName = $(this).data('name')
					//console.log('onFolder', dirName)
					ev.preventDefault()
					loadData(ctrl.model.rootDir + dirName + '/')
				},
				onBackBtn: function() {
					var split = ctrl.model.rootDir.split('/')
					//console.log('onBackBtn', split)
					
					split.pop()
					split.pop()
					
					//console.log('rootDir', rootDir)
					loadData(split.join('/') + '/')

				},
				onFile: function(ev) {
					var name = $(this).data('name')
					//console.log('onPicture', name)
					ev.preventDefault()
					//var filePath = fileSrv.fileUrl(rootDir + name)
					//console.log('filePath', filePath)
					if (ctrl.model.selMode) {
						$(this).closest('.thumbnail').toggleClass('selected')
						ctrl.setData('fileSelected', getSelFiles().length != 0)
						return
					}
					elt.trigger('fileClick', {name, rootDir: ctrl.model.rootDir})
				},
				onToggleSelMode: function() {
					ctrl.setData('selMode', !ctrl.model.selMode)
					if (!ctrl.model.selMode) {
						elt.find('.thumbnail.selected').removeClass('selected')
						ctrl.setData('fileSelected', false)
					}
				},
				onDelete: function() {
					$$.showConfirm("Are you sure ?", "Delete files", function() {
						var selFile = getSelFiles()
						//console.log('onDelete', selFile)
						fileSrv.removeFiles(selFile)
						.then(function(resp) {
							console.log('resp', resp)
							loadData()
						})
						.catch(function(resp) {
							console.log('resp', resp)
							$$.showAlert(resp.responseText, 'Error')
						})					
					})

				},
				onCreateFolder: function() {
					var rootDir = ctrl.model.rootDir
					$$.showPrompt('Folder name:', 'New Folder', function(folderName) {
						fileSrv.mkdir(rootDir + folderName)
						.then(function(resp) {
							console.log('resp', resp)
							loadData()
						})
						.catch(function(resp) {
							console.log('resp', resp)
							$$.showAlert(resp.responseText, 'Error')
						})	
					})
				},
				onCut: function() {

					copy = false

					//console.log('onCut', cutFiles)
					
					ctrl.setData({
						selMode: false,
						fileSelected: false,
						cutFiles: getSelFiles(),
						cutDir: ctrl.model.rootDir
					})

					elt.find('.thumbnail.selected').removeClass('selected').addClass('cuted')

				},
				onCopy: function() {

					copy = true

					//console.log('onCopy', cutFiles)
					
					ctrl.setData({
						selMode: false,
						fileSelected: false,
						cutFiles: getSelFiles(),
						cutDir: ctrl.model.rootDir
					})

					elt.find('.thumbnail.selected').removeClass('selected').addClass('cuted')
				},

				onPaste: function() {
					//console.log('onPaste')
					var {rootDir, cutFiles} = ctrl.model
					var promise = (copy) ? fileSrv.copyFiles(cutFiles, rootDir) : fileSrv.moveFiles(cutFiles, rootDir)
					copy = false
					promise
					.then(function(resp) {
						console.log('resp', resp)
						ctrl.setData({cutFiles: []})
						loadData()
					})
					.catch(function(resp) {
						console.log('resp', resp)
						ctrl.setData({cutFiles: []})
						$$.showAlert(resp.responseText, 'Error')
					})	
				},
				onCancelSelection: function() {
					elt.find('.thumbnail').removeClass('selected cuted')
					ctrl.setData({
						fileSelected: false,
						cutFiles: []
					})				
				},
				onImportFile: function() {
					//console.log('onImportFile')
					var rootDir = ctrl.model.rootDir

					$$.openFileDialog(function(file) {
						//console.log('fileSize', file.size / 1024)
						if (file.size > options.maxUploadSize) {
							$$.showAlert('File too big', 'Error')
							return
						}
						$$.readFileAsDataURL(file, function(dataURL) {
							//console.log('dataURL', dataURL)
							fileSrv.uploadFile(dataURL, file.name, rootDir).then(function() {
								loadData()
							})
							.catch(function(resp) {
								console.log('resp', resp)
								$$.showAlert(resp.responseText, 'Error')							
							})
						})					
					})
				}
			} 
		})

		function loadData(rootDir) {
			if (rootDir == undefined) {
				rootDir = ctrl.model.rootDir
			}
			fileSrv.list(rootDir, options.imageOnly).then(function(files) {
				//console.log('files', files)
				ctrl.setData({
					rootDir,
					fileSelected: false,
					files: files
		/*				.filter(function(file) {
							return !file.isDir
						})*/
						.map(function(file, idx) {
							var name = file.title
							var isDir = file.folder
							var isImage = $$.isImage(name)
							return {
								name,
								size: 'Size : ' + Math.floor(file.size/1024) + ' Ko',
								imgUrl:  isDir ? '' : fileSrv.fileUrl(rootDir + name),
								isDir,
								isImage, 
								isFile: !isDir && !isImage
							}
						})
				})
			})		
		}

		loadData()

		return {
			getFiles: function() {
				return ctrl.model.files
			}
		}
	}

});

(function() {

function getNodePath(node) {

	var path = node.getParentList(false, true).map((node) => node.key == 'root' ? '/' : node.title)
	return path.join('/')
}

$$.registerControlEx('FileTreeControl', {
	deps: ['FileService'],
	iface: 'refresh();getValue()',
	
	lib: 'core',
init: function(elt, options, fileSrv) {
		var ctrl = $$.viewController(elt, {
			template: "<div>\r\n	<div bn-control=\"TreeControl\" bn-options=\"treeOptions\" bn-iface=\"treeCtrl\" bn-event=\"contextMenuAction: onTreeAction\"></div>\r\n</div>",		
			data: {
				treeOptions: {
					source: [{title: 'Home', folder: true, lazy: true, key: 'root'}],

					lazyLoad: function(event, data) {
						
						//console.log('lazyLoad', data.node.key)
						var path = getNodePath(data.node)
						data.result = fileSrv.list(path, false, true)

					},
					contextMenu: {
						menu: {
							newFolder: {'name': 'New Folder'}
						}
					}
				}
			},
			events: {
				onTreeAction: function(node, action) {
					//console.log('onTreeAction', node.title, action)
					$$.showPrompt('Folder name', 'New Folder', function(folderName) {
						
						var path = getNodePath(node)
						//console.log('folderName', folderName, 'path', path)
						fileSrv.mkdir(path + '/' + folderName)
						.then(function(resp) {
							console.log('resp', resp)
							node.load(true)
						})
						.catch(function(resp) {
							console.log('resp', resp)
							$$.showAlert(resp.responseText, 'Error')
						})							
					})
				}
			}			
		})

		return {
			getValue: function() {
				return getNodePath(ctrl.scope.treeCtrl.getActiveNode())
			},

			refresh: function() {
				const root = ctrl.scope.treeCtrl.getRootNode().getFirstChild()
				if (root) {
					root.load(true)
				}
			}
		}
	}

});


})();




(function() {

	function getTemplate(headers) {
		return `
			<div class="scrollPanel">
	            <table class="w3-table-all w3-small">
	                <thead>
	                    <tr class="w3-green">
	                    	${headers}
	                    </tr>
	                </thead>
	                <tbody></tbody>
	            </table>
            </div>
		`
	}

	function getItemTemplate(rows) {
		return `
            <tr class="item" bn-attr="data-id: _id">
            	${rows}
            </tr>	
		`
	}



	$$.registerControlEx('FilteredTableControl', {

		iface: 'addItem(id, data);removeItem(id);removeAllItems();setFilters(filters);getDatas();getDisplayedDatas();on(event, callback)',
		events: 'itemAction',

		
	lib: 'core',
init: function(elt, options) {

			console.log('options', options)

			var columns =  $$.obj2Array(options.columns)
			var actions = $$.obj2Array(options.actions)
			var headers = columns.map((column) => `<th>${column.value}</th>`)		
			var rows = columns.map((column) => `<td bn-html="${column.key}"></td>`)
			if (actions.length > 0) {
				headers.push(`<th>Action</th>`)

				var buttons = actions.map((action) => `<button data-action="${action.key}" class="w3-button"><i class="${action.value}"></i></button>`)
				rows.push(`<td>${buttons}</td>`)
			}

			//console.log('rows', rows)
			var itemTemplate = getItemTemplate(rows.join(''))
			//console.log('itemTemplate', itemTemplate)

			elt.append(getTemplate(headers.join('')))
			elt.addClass('bn-flex-col')

			let datas = {}
			let events = new EventEmitter2()
			let _filters = {}
			let displayedItems = {}

			const tbody = elt.find('tbody')
			tbody.on('click', '[data-action]', function() {
				var id = $(this).closest('.item').data('id')
				var action = $(this).data('action')
				console.log('click', id, 'action', action)
				events.emit('itemAction', action, id)
			})

			function addItem(id, data) {
				var itemData = $.extend({'_id': id}, data)
				//console.log('addItem', itemData)
				
				if (datas[id] != undefined) {
					var item = displayedItems[id]
					if (item != undefined) {
						item.processTemplate(itemData)
					}
				}
				else if (isInFilter(data)){
					var item = $(itemTemplate).processTemplate(itemData)
					displayedItems[id] = item
					tbody.append(item)
				}
				datas[id] = data
			}

			function removeItem(id) {
				//console.log('removeItem', id)
				if (datas[id] != undefined) {
					delete datas[id]
					var item = displayedItems[id]
					if (item != undefined) {
						item.remove()
						delete displayedItems[id]
					}
				}			
			}

			function removeAllItems() {
				//console.log('removeAllItems')
				datas = {}
				displayedItems = {}
				tbody.empty()		
			}

			function isInFilter(data) {
				var ret = true
				for(var f in _filters) {
					var value = data[f]
					var filterValue = _filters[f]
					ret &= (filterValue == '' || value.startsWith(filterValue))
				}
				return ret
			}

			function setFilters(filters) {
				_filters = filters
				dispTable()
			}


			function dispTable() {
				displayedItems = {}
				let items = []
				for(let id in datas) {
					var data = datas[id]
					if (isInFilter(data)) {
						var itemData = $.extend({'_id': id}, data)
						var item = $(itemTemplate).processTemplate(itemData)			
						items.push(item)
						displayedItems[id] = item
					}

				}
				
				
				tbody.empty().append(items)
			}

			function getDatas() {
				return datas
			}

			function getDisplayedDatas() {
				var ret = {}
				for(let i in displayedItems) {
					ret[i] = datas[i]
				}
				return ret
			}

			return {
				addItem: addItem,
				removeItem: removeItem,
				removeAllItems: removeAllItems,
				on: events.on.bind(events),
				setFilters: setFilters,
				getDatas: getDatas,
				getDisplayedDatas: getDisplayedDatas,
				options: options
			}
		}
	})

})();


$$.registerControlEx('HeaderControl', {
	deps: ['WebSocketService'],
	props: {
		title: {val: 'Hello World'},
		userName: {val: 'unknown'}
	},
	
	lib: 'core',
init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: "<div >\r\n	<div class=\"brand\"><h1 class=\"bn-xs-hide\" bn-text=\"title\"></h1> </div>\r\n	<div>\r\n	    <i bn-attr=\"title: titleState\" class=\"fa fa-lg connectionState\" bn-class=\"fa-eye: connected, fa-eye-slash: !connected\"></i>\r\n	    <i class=\"fa fa-user fa-lg\"></i>\r\n	    <span bn-text=\"userName\" class=\"userName\"></span>\r\n	    <a href=\"/\" title=\"home\"><i class=\"fa fa-home fa-lg\"></i></a> \r\n	</div>\r\n</div>",
			data: {
				connected: false,
				titleState: "WebSocket disconnected",
				title: options.title,
				userName: options.userName				
			}
		})


		client.events.on('connect', function() {
			console.log('[HeaderControl] client connected')
			ctrl.setData({connected: true, titleState: "WebSocket connected"})

		})

		client.events.on('disconnect', function() {
			console.log('[HeaderControl] client disconnected')
			ctrl.setData({connected: false, titleState: "WebSocket disconnected"})

		})
	}

});




$$.registerControlEx('InputGroupControl', {
	
	lib: 'core',
init: function(elt) {

		var id = elt.children('input').uniqueId().attr('id')
		//console.log('[InputGroupControl] id', id)
		elt.children('label').attr('for', id)
	}
});

(function() {

	$$.registerControlEx('NavbarControl', {

		props: {
			activeColor: {val: 'w3-green'}
		},

		
	lib: 'core',
init: function(elt, options) {

			var activeColor = options.activeColor


			//console.log('[NavbarControl] options', options)

			elt.addClass('w3-bar')
			elt.children('a').each(function() {
				$(this).addClass('w3-bar-item w3-button')
			})

			$(window).on('routeChanged', function(evt, newRoute) {
				//console.log('[NavbarControl] routeChange', newRoute)

				elt.children(`a.${activeColor}`).removeClass(activeColor)	
				elt.children(`a[href="#${newRoute}"]`).addClass(activeColor)

			})	
		}

	})


})();



$$.registerControlEx('PictureCarouselControl', {

	props: {
		width: {val: 300},
		height: {val: 200},
		animateDelay: {val: 1000},
		index: {val: 0, set: 'setIndex'},
		images: {val: [], set: 'setImages'},
		color: {val: 'yellow'}
	},

	iface: 'setImages(images);setIndex(idx)',

	
	lib: 'core',
init: function(elt, options) {

		console.log(`[PictureCarouselControl] options`, options)

		var ctrl = $$.viewController(elt, {
			template: "<div bn-control=\"CarouselControl\" bn-options=\"carouselCtrlOptions\" bn-each=\"i of images\" bn-iface=\"carouselCtrl\" bn-data=\"index: index\">\r\n	<div style=\"text-align: center;\" bn-style=\"background-color: backColor\">\r\n		<img bn-attr=\"src: i\" style=\"height: 100%\">\r\n	</div>\r\n</div>",
			data: {
				carouselCtrlOptions: options,
				images: options.images,
				backColor: options.color,
				index: options.index
			}
		})

		return {
			setImages: function(value) {
				//console.log('[PictureCarouselControl] setImages', value)
				ctrl.setData('images', value)
				ctrl.scope.carouselCtrl.refresh()			
			},
			setIndex: function(value) {
				ctrl.setData('index', value)
			}

		}
	}
});
(function() {

	$$.registerControl('RadioGroupControl', function(elt) {

		elt.on('click', 'input[type=radio]', function() {
			//console.log('radiogroup click')
			elt.find('input[type=radio]:checked').prop('checked', false)
			$(this).prop('checked', true)
			elt.trigger('input')
		})
		

		function getValue() {
			return elt.find('input[type=radio]:checked').val()
		}

		function setValue(value) {
			elt.find('input[type=radio]').each(function() {
				$(this).prop('checked', value === $(this).val())
			})			
		}

		return {
			getValue: getValue,
			setValue: setValue
		}

	})


})();



(function() {

	function matchRoute(route, pattern) {
		//console.log('matchRoute', route, pattern)
		var routeSplit = route.split('/')
		var patternSplit = pattern.split('/')
		//console.log(routeSplit, patternSplit)
		var ret = {}

		if (routeSplit.length != patternSplit.length)
			return null

		for(var idx = 0; idx < patternSplit.length; idx++) {
			var path = patternSplit[idx]
			//console.log('path', path)
			if (path.substr(0, 1) === ':') {
				if (routeSplit[idx].length === 0)
					return null
				ret[path.substr(1)] = routeSplit[idx]
			}
			else if (path !== routeSplit[idx]) {
				return null
			}

		}

		return ret
	}




	$$.registerControlEx('RouterControl', {

		props: {
			routes: {val: []}
		},
		
	lib: 'core',
init: function(elt, options) {



			var routes = options.routes

			if (!Array.isArray(routes)) {
				console.warn('[RouterControl] bad options')
				return
			}


			function processRoute(info) {
				console.log('[RouterControl] processRoute', info)

				var newRoute = info.curRoute

				for(var route of routes) {
					var params = matchRoute(newRoute, route.href)
					//console.log(`route: ${route.href}, params`, params)
					if (params != null) {
						//console.log('[RouterControl] params', params)
						if (typeof route.redirect == 'string') {
							location.href = '#' + route.redirect
						}
						else if (typeof route.control == 'string') {

							var curCtrl = elt.find('.CustomControl').interface()
							var canChange = true
							if (curCtrl && typeof curCtrl.canChange == 'function') {
								canChange = curCtrl.canChange()
							}
							if (canChange) {
								$(window).trigger('routeChanged', newRoute)
								var config = $.extend({$params: params}, route.options)	
								var html = $(`<div bn-control="${route.control}" bn-options="config" class="bn-flex-col bn-flex-1"></div>`)
								elt.dispose().html(html)
								html.processUI({config: config})		
							}
							else if (info.prevRoute) {
								history.replaceState({}, '', '#' + info.prevRoute)
							}

							//elt.html(html)

						}
						return true
					}	
				}
				return false

			}		

			$(window).on('routeChange', function(ev, info) {
				if (!processRoute(info)) {
					console.warn(`[RouterControl] no action defined for route '${newRoute}'`)
				}
			})


		}

	})

})();


