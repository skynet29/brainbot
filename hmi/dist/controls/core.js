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



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhcm91c2VsLmpzIiwiY2hlY2tncm91cC5qcyIsImVkaXRvci5qcyIsImZpbGUuanMiLCJmaWxldHJlZS5qcyIsImZpbHRlcmVkLXRhYmxlLmpzIiwiaGVhZGVyLmpzIiwiaW5wdXRncm91cC5qcyIsIm5hdmJhci5qcyIsInBpY3R1cmVjYXJvdXNlbC5qcyIsInJhZGlvZ3JvdXAuanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdDYXJvdXNlbENvbnRyb2wnLCB7XHJcblxyXG5cdFx0cHJvcHM6IHtcclxuXHRcdFx0d2lkdGg6IHt2YWw6IDMwMH0sXHJcblx0XHRcdGhlaWdodDoge3ZhbDogMjAwfSxcclxuXHRcdFx0YW5pbWF0ZURlbGF5OiB7dmFsOiAxMDAwfSxcclxuXHRcdFx0aW5kZXg6IHtcclxuXHRcdFx0XHR2YWw6IDAsXHJcblx0XHRcdFx0c2V0OiAnc2V0SW5kZXgnXHJcblx0XHRcdH0gXHJcblx0XHR9LFxyXG5cdFx0aWZhY2U6ICdzZXRJbmRleChpZHgpO3JlZnJlc2goKScsXHJcblxyXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblx0XHJcblxyXG5cclxuXHRcdFx0dmFyIHdpZHRoID0gb3B0aW9ucy53aWR0aCArICdweCdcclxuXHRcdFx0dmFyIGhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0ICsgJ3B4J1xyXG5cdFx0XHRlbHQuY3NzKCd3aWR0aCcsIHdpZHRoKS5jc3MoJ2hlaWdodCcsIGhlaWdodClcclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKGBbQ2Fyb3VzZWxDb250cm9sXSBvcHRpb25zYCwgb3B0aW9ucylcclxuXHJcblx0XHRcdHZhciBjdHJsID0gbnVsbFxyXG5cdFx0XHR2YXIgaXRlbXNcclxuXHRcdFx0dmFyIGlkeFxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIHJlZnJlc2goKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0Nhcm91c2VsQ29udHJvbF0gcmVmcmVzaCcpXHJcblx0XHRcdFx0aXRlbXMgPSBlbHQuY2hpbGRyZW4oJ2RpdicpLnJlbW92ZSgpLmNzcygnd2lkdGgnLCB3aWR0aCkuY3NzKCdoZWlnaHQnLCBoZWlnaHQpXHRcdFxyXG5cclxuXHRcdFx0XHRpZHggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihvcHRpb25zLmluZGV4LCBpdGVtcy5sZW5ndGgpKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coYFtDYXJvdXNlbENvbnRyb2xdIGlkeGAsIGlkeClcclxuXHJcblx0XHRcdFx0ZnVuY3Rpb24gYW5pbWF0ZShkaXJlY3Rpb24pIHtcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7bGVmdERpc2FibGVkOiB0cnVlLCByaWdodERpc2FibGVkOiB0cnVlfSlcclxuXHRcdFx0XHRcdHZhciBvcCA9IGRpcmVjdGlvbiA9PSAnbGVmdCcgPyAnKz0nIDogJy09J1xyXG5cdFx0XHRcdFx0aWR4ID0gZGlyZWN0aW9uID09ICdsZWZ0JyA/IGlkeC0xIDogaWR4KzFcclxuXHJcblx0XHRcdFx0XHRjdHJsLnNjb3BlLml0ZW1zLmFuaW1hdGUoe2xlZnQ6IG9wICsgd2lkdGh9LCBvcHRpb25zLmFuaW1hdGVEZWxheSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdGNoZWNrQnRucygpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInZpZXdwb3J0XFxcIj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiaXRlbXNcXFwiIGJuLWJpbmQ9XFxcIml0ZW1zXFxcIj48L2Rpdj5cdFxcclxcblx0PC9kaXY+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJvdmVybGF5XFxcIj5cXHJcXG5cdFx0PGRpdj5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkxlZnRcXFwiIFxcclxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiaGlkZGVuOiBsZWZ0RGlzYWJsZWRcXFwiXFxyXFxuXHRcdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hldnJvbi1jaXJjbGUtbGVmdFxcXCI+PC9pPlxcclxcblx0XHRcdDwvYnV0dG9uPlx0XHRcdFxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdFx0PGRpdj5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvblJpZ2h0XFxcIiBcXHJcXG5cdFx0XHRcdGJuLXByb3A9XFxcImhpZGRlbjogcmlnaHREaXNhYmxlZFxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hldnJvbi1jaXJjbGUtcmlnaHRcXFwiPjwvaT5cXHJcXG5cdFx0XHQ8L2J1dHRvbj5cdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRcdFx0bGVmdERpc2FibGVkOiB0cnVlLFxyXG5cdFx0XHRcdFx0XHRyaWdodERpc2FibGVkOiBmYWxzZVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLnNjb3BlLml0ZW1zLmFwcGVuZChpdGVtcylcclxuXHRcdFx0XHRcdFx0dGhpcy5zY29wZS5pdGVtcy5jc3MoJ2xlZnQnLCAoLWlkeCAqIG9wdGlvbnMud2lkdGgpICsgJ3B4JylcclxuXHRcdFx0XHRcdFx0Ly9jaGVja0J0bnMoKVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdFx0XHRvbkxlZnQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGFuaW1hdGUoJ2xlZnQnKVxyXG5cdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRvblJpZ2h0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRhbmltYXRlKCdyaWdodCcpXHJcblx0XHRcdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0Y2hlY2tCdG5zKClcdFx0XHJcblxyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gc2V0SW5kZXgoaW5kZXgpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW0Nhcm91c2VsQ29udHJvbF0gc2V0SW5kZXgnLCBpbmRleClcclxuXHRcdFx0XHRpZHggPSAgTWF0aC5tYXgoMCwgTWF0aC5taW4oaW5kZXgsIGl0ZW1zLmxlbmd0aCkpXHJcblx0XHRcdFx0Y3RybC5zY29wZS5pdGVtcy5jc3MoJ2xlZnQnLCAoLWlkeCAqIG9wdGlvbnMud2lkdGgpICsgJ3B4JylcclxuXHRcdFx0XHRjaGVja0J0bnMoaWR4KVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBjaGVja0J0bnMoKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY2hlY2tCdG5zJywgaWR4LCBpdGVtcy5sZW5ndGgpXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdGxlZnREaXNhYmxlZDogaWR4ID09IDAsXHJcblx0XHRcdFx0XHRyaWdodERpc2FibGVkOiBpZHggPT0gaXRlbXMubGVuZ3RoIC0gMVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cdFx0XHJcblxyXG5cdCBcdFx0cmVmcmVzaCgpXHJcblxyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdHNldEluZGV4LFxyXG5cdFx0XHRcdHJlZnJlc2g6IHJlZnJlc2gsXHJcblx0LypcdFx0XHRwYXJhbXM6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHtpbmRleDogaWR4fVxyXG5cdFx0XHRcdH0qL1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnQ2hlY2tHcm91cENvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0Lm9uKCdjbGljaycsICdpbnB1dFt0eXBlPWNoZWNrYm94XScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRlbHQudHJpZ2dlcignaW5wdXQnKVxyXG5cdFx0fSlcclxuXHJcblx0XHRmdW5jdGlvbiBnZXRWYWx1ZSgpIHtcclxuXHRcdFx0dmFyIHJldCA9IFtdXHJcblx0XHRcdGVsdC5maW5kKCdpbnB1dFt0eXBlPWNoZWNrYm94XTpjaGVja2VkJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXQucHVzaCgkKHRoaXMpLnZhbCgpKVxyXG5cdFx0XHR9KVx0XHJcblx0XHRcdHJldHVybiByZXRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHNldFZhbHVlKHZhbHVlKSB7XHJcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cdFx0XHRcdGVsdC5maW5kKCdpbnB1dFt0eXBlPWNoZWNrYm94XScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCB2YWx1ZS5pbmRleE9mKCQodGhpcykudmFsKCkpID49IDApXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVx0XHRcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRnZXRWYWx1ZTogZ2V0VmFsdWUsXHJcblx0XHRcdHNldFZhbHVlOiBzZXRWYWx1ZVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0pO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnSHRtbEVkaXRvckNvbnRyb2wnLCB7XHJcblxyXG5cdGlmYWNlOiAnaHRtbCgpJyxcclxuXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0LmFkZENsYXNzKCdibi1mbGV4LXJvdycpXHJcblxyXG5cdFx0dmFyIGNtZEFyZ3MgPSB7XHJcblx0XHRcdCdmb3JlQ29sb3InOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gY3RybC5tb2RlbC5jb2xvclxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxyXFxuXFxyXFxuXHQ8ZGl2IGJuLWV2ZW50PVxcXCJjbGljay5jbWQ6IG9uQ29tbWFuZFxcXCI+XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImJvbGRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1ib2xkXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaXRhbGljXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtaXRhbGljXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwidW5kZXJsaW5lXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtdW5kZXJsaW5lXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwic3RyaWtlVGhyb3VnaFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXN0cmlrZXRocm91Z2hcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JlQ29sb3JcXFwiIGJuLW1lbnU9XFxcImNvbG9ySXRlbXNcXFwiIGJuLWV2ZW50PVxcXCJtZW51Q2hhbmdlOiBvbkNvbG9yTWVudUNoYW5nZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXBlbmNpbFxcXCIgYm4tc3R5bGU9XFxcImNvbG9yOiBjb2xvclxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwianVzdGlmeUxlZnRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1hbGlnbi1sZWZ0XFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwianVzdGlmeUNlbnRlclxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFsaWduLWNlbnRlclxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImp1c3RpZnlSaWdodFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFsaWduLXJpZ2h0XFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plx0XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImluZGVudFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWluZGVudFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcIm91dGRlbnRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1vdXRkZW50XFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plx0XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImluc2VydEhvcml6b250YWxSdWxlXFxcIj5ocjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZvcm1hdEJsb2NrXFxcIiBkYXRhLWNtZC1hcmc9XFxcImgxXFxcIj5oMTwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZvcm1hdEJsb2NrXFxcIiBkYXRhLWNtZC1hcmc9XFxcImgyXFxcIj5oMjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZvcm1hdEJsb2NrXFxcIiBkYXRhLWNtZC1hcmc9XFxcImgzXFxcIj5oMzwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cdFx0XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImluc2VydFVub3JkZXJlZExpc3RcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1saXN0LXVsXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5zZXJ0T3JkZXJlZExpc3RcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1saXN0LW9sXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plxcclxcblxcclxcblx0PC9kaXY+XHRcXHJcXG5cdDxkaXYgY29udGVudGVkaXRhYmxlPVxcXCJ0cnVlXFxcIiBjbGFzcz1cXFwiYm4tZmxleC0xIGVkaXRvclxcXCIgYm4tYmluZD1cXFwiZWRpdG9yXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIixcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdGNvbG9yOiAnYmx1ZScsXHJcblx0XHRcdFx0Y29sb3JJdGVtczoge1xyXG5cdFx0XHRcdFx0YmxhY2s6IHtuYW1lOiAnQmxhY2snfSxcclxuXHRcdFx0XHRcdHJlZDoge25hbWU6ICdSZWQnfSxcclxuXHRcdFx0XHRcdGdyZWVuOiB7bmFtZTogJ0dyZWVuJ30sXHJcblx0XHRcdFx0XHRibHVlOiB7bmFtZTogJ0JsdWUnfSxcclxuXHRcdFx0XHRcdHllbGxvdzoge25hbWU6ICdZZWxsb3cnfSxcclxuXHRcdFx0XHRcdGN5YW46IHtuYW1lOiAnQ3lhbid9LFxyXG5cdFx0XHRcdFx0bWFnZW50YToge25hbWU6ICdNYWdlbnRhJ31cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdG9uQ29tbWFuZDogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRcdFx0dmFyIGNtZCA9ICQodGhpcykuZGF0YSgnY21kJylcclxuXHRcdFx0XHRcdHZhciBjbWRBcmcgPSAkKHRoaXMpLmRhdGEoJ2NtZEFyZycpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvbW1hbmQnLCBjbWQsIGNtZEFyZylcclxuXHJcblx0XHRcdFx0XHR2YXIgY21kQXJnID0gY21kQXJnIHx8IGNtZEFyZ3NbY21kXVxyXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjbWRBcmcgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRjbWRBcmcgPSBjbWRBcmcoKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Db21tYW5kJywgY21kLCBjbWRBcmcpXHJcblxyXG5cdFx0XHRcdFx0ZG9jdW1lbnQuZXhlY0NvbW1hbmQoY21kLCBmYWxzZSwgY21kQXJnKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25Db2xvck1lbnVDaGFuZ2U6IGZ1bmN0aW9uKGV2LCBjb2xvcikge1xyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Db2xvck1lbnVDaGFuZ2UnLCBjb2xvcilcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7Y29sb3J9KVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHR9KVxyXG5cclxuXHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0aHRtbDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIGN0cmwuc2NvcGUuZWRpdG9yLmh0bWwoKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSk7XHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdGaWxlQ29udHJvbCcsIHtcclxuXHRkZXBzOiBbJ0ZpbGVTZXJ2aWNlJ10sIFxyXG5cdHByb3BzOiB7XHJcblx0XHR0b29sYmFyOiB7dmFsOiB0cnVlfSxcclxuXHRcdGltYWdlT25seToge3ZhbDogZmFsc2V9LFxyXG5cdFx0bWF4VXBsb2FkU2l6ZToge3ZhbDogMioxMDI0KjIwMTR9IC8vIDIgTW9cdFx0XHJcblx0fSxcclxuXHRldmVudHM6ICdmaWxlQ2xpY2snLFxyXG5cdGlmYWNlOiAnZ2V0RmlsZXMoKScsXHJcblxyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgZmlsZVNydikge1xyXG5cclxuXHRcdHZhciBjdXRGaWxlcyA9IFtdXHJcblx0XHR2YXIgY3V0RGlyID0gJy8nXHJcblx0XHR2YXIgY29weSA9IHRydWVcclxuXHJcblx0XHRmdW5jdGlvbiBnZXRTZWxGaWxlcygpIHtcclxuXHRcdFx0dmFyIHNlbERpdiA9IGVsdC5maW5kKCcudGh1bWJuYWlsLnNlbGVjdGVkIGEnKVxyXG5cclxuXHRcdFx0dmFyIHNlbEZpbGUgPSBbXVxyXG5cdFx0XHRzZWxEaXYuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRzZWxGaWxlLnB1c2goY3RybC5tb2RlbC5yb290RGlyICsgJCh0aGlzKS5kYXRhKCduYW1lJykpXHJcblx0XHRcdH0pXHJcblx0XHRcdHJldHVybiBzZWxGaWxlXHJcblx0XHR9XHJcblxyXG5cclxuXHRcdHZhciBjdHJsID0gd2luZG93LmZpbGVDdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJ0b29sYmFyXFxcIiBibi1zaG93PVxcXCJzaG93VG9vbGJhclxcXCI+XFxyXFxuXHRcdDxidXR0b24gXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvblRvZ2dsZVNlbE1vZGVcXFwiIFxcclxcblx0XHRcdHRpdGxlPVxcXCJTZWxlY3QgbW9kZVxcXCIgXFxyXFxuXHRcdFx0Ym4tY2xhc3M9XFxcInNlbGVjdGVkOiBzZWxNb2RlXFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1jaGVja1xcXCI+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uQ2FuY2VsU2VsZWN0aW9uXFxcIiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiQ2FuY2VsIHNlbGVjdGlvblxcXCJcXHJcXG5cdFx0XHRibi1wcm9wPVxcXCJkaXNhYmxlZDogIWNhbkNhbmNlbFxcXCIgIFxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS10aW1lc1xcXCI+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uRGVsZXRlXFxcIiBcXHJcXG5cdFx0XHRibi1wcm9wPVxcXCJkaXNhYmxlZDogIWZpbGVTZWxlY3RlZFxcXCIgXFxyXFxuXHRcdFx0dGl0bGU9XFxcIkRlbGV0ZSBzZWxlY3RlZCBmaWxlc1xcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtdHJhc2hcXFwiID48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlxcclxcblxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdHRpdGxlPVxcXCJDdXRcXFwiIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25DdXRcXFwiIFxcclxcblx0XHRcdGJuLXByb3A9XFxcImRpc2FibGVkOiAhZmlsZVNlbGVjdGVkXFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1jdXRcXFwiID48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlxcclxcblxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdHRpdGxlPVxcXCJDb3B5XFxcIiBcXHJcXG5cdFx0XHRibi1wcm9wPVxcXCJkaXNhYmxlZDogIWZpbGVTZWxlY3RlZFxcXCIgXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkNvcHlcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLWNvcHlcXFwiID48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlxcclxcblxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdHRpdGxlPVxcXCJQYXN0ZVxcXCIgXFxyXFxuXHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFjYW5QYXN0ZVxcXCIgXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvblBhc3RlXFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1wYXN0ZVxcXCIgPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdDxidXR0b24gXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkNyZWF0ZUZvbGRlclxcXCIgXFxyXFxuXHRcdFx0dGl0bGU9XFxcIk5ldyBmb2xkZXJcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLWZvbGRlci1vcGVuXFxcIiA+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cXHJcXG5cdFx0XFxyXFxuXHRcdDxidXR0b24gXFxyXFxuXHRcdFx0dGl0bGU9XFxcIkltcG9ydCBmaWxlXFxcIiBcXHJcXG5cdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uSW1wb3J0RmlsZVxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtdXBsb2FkXFxcIiA+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cdFx0XFxyXFxuXFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInBhdGhQYW5lbFxcXCI+XFxyXFxuXHRcdFBhdGg6Jm5ic3A7PHNwYW4gYm4tdGV4dD1cXFwicm9vdERpclxcXCI+PC9zcGFuPlxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8ZGl2Plxcclxcblx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJiYWNrQnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQmFja0J0blxcXCIgdGl0bGU9XFxcIkJhY2tcXFwiIGJuLXNob3c9XFxcImJhY2tWaXNpYmxlXFxcIj5cXHJcXG5cdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtYXJyb3ctY2lyY2xlLWxlZnRcXFwiPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XHRcdFxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8ZGl2IGJuLWVhY2g9XFxcImYgb2YgZmlsZXNcXFwiIGNsYXNzPVxcXCJjb250YWluZXJcXFwiIGJuLWV2ZW50PVxcXCJjbGljay5mb2xkZXI6IG9uRm9sZGVyLCBjbGljay5maWxlOiBvbkZpbGVcXFwiPlxcclxcblx0XHRcXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwidGh1bWJuYWlsXFxcIj5cXHJcXG5cdFx0XHRcdDxhIGJuLWlmPVxcXCJmLmlzSW1hZ2VcXFwiIGhyZWY9XFxcIiNcXFwiIGJuLWF0dHI9XFxcInRpdGxlOiBmLnNpemVcXFwiIGNsYXNzPVxcXCJmaWxlXFxcIiBibi1kYXRhPVxcXCJuYW1lOiBmLm5hbWVcXFwiPlxcclxcblx0XHRcdFx0XHQ8ZGl2Plxcclxcblx0XHRcdFx0XHRcdDxpbWcgYm4tYXR0cj1cXFwic3JjOiBmLmltZ1VybFxcXCI+XFxyXFxuXHRcdFx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XHRcXHJcXG5cdFx0XHRcdFx0PHNwYW4gYm4tdGV4dD1cXFwiZi5uYW1lXFxcIj48L3NwYW4+XFxyXFxuXHRcdFx0XHQ8L2E+XHRcdFx0XFxyXFxuXHRcdFx0XHQ8YSBibi1pZj1cXFwiZi5pc0RpclxcXCIgaHJlZj1cXFwiI1xcXCIgY2xhc3M9XFxcImZvbGRlclxcXCIgYm4tZGF0YT1cXFwibmFtZTogZi5uYW1lXFxcIj5cXHJcXG5cdFx0XHRcdFx0PGRpdj5cXHJcXG5cdFx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtNHggZmEtZm9sZGVyLW9wZW4gdzMtdGV4dC1ibHVlLWdyZXlcXFwiPjwvaT5cXHJcXG5cdFx0XHRcdFx0PC9kaXY+XFxyXFxuXHRcdFx0XHRcdFxcclxcblx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJmLm5hbWVcXFwiPjwvc3Bhbj5cXHJcXG5cdFx0XHRcdDwvYT5cXHJcXG5cdFx0XHRcdDxhIGJuLWlmPVxcXCJmLmlzRmlsZVxcXCIgaHJlZj1cXFwiI1xcXCIgYm4tZGF0YT1cXFwibmFtZTogZi5uYW1lXFxcIiBjbGFzcz1cXFwiZmlsZVxcXCIgYm4tYXR0cj1cXFwidGl0bGU6IGYuc2l6ZVxcXCI+XFxyXFxuXHRcdFx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTR4IGZhLWZpbGUgdzMtdGV4dC1ibHVlLWdyZXlcXFwiPjwvaT5cXHJcXG5cdFx0XHRcdFx0PC9kaXY+XFxyXFxuXHRcdFx0XHRcdFxcclxcblx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJmLm5hbWVcXFwiPjwvc3Bhbj5cXHJcXG5cdFx0XHRcdDwvYT5cdFx0XHRcXHJcXG5cdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cIixcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdGZpbGVzOiBbXSxcclxuXHRcdFx0XHRjdXRGaWxlczogW10sXHJcblx0XHRcdFx0cm9vdERpcjogJy8nLFxyXG5cdFx0XHRcdGN1dERpcjogJy8nLFxyXG5cdFx0XHRcdGJhY2tWaXNpYmxlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnJvb3REaXIgIT0gJy8nXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRzZWxNb2RlOiBmYWxzZSxcclxuXHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdHNob3dUb29sYmFyOiBvcHRpb25zLnRvb2xiYXIsXHJcblx0XHRcdFx0Y2FuQ2FuY2VsOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmN1dEZpbGVzLmxlbmd0aCAhPSAwIHx8IHRoaXMuZmlsZVNlbGVjdGVkXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRjYW5QYXN0ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jdXRGaWxlcy5sZW5ndGggIT0gMCAmJiB0aGlzLnJvb3REaXIgIT0gdGhpcy5jdXREaXJcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdG9uRm9sZGVyOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uRm9sZGVyJylcclxuXHRcdFx0XHRcdGlmIChjdHJsLm1vZGVsLnNlbE1vZGUpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3RoaXMnLCAkKHRoaXMpLmNsb3Nlc3QoJy50aHVtYm5haWwnKSlcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5jbG9zZXN0KCcudGh1bWJuYWlsJykudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJylcclxuXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSgnZmlsZVNlbGVjdGVkJywgZ2V0U2VsRmlsZXMoKS5sZW5ndGggIT0gMClcclxuXHRcdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0dmFyIGRpck5hbWUgPSAkKHRoaXMpLmRhdGEoJ25hbWUnKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Gb2xkZXInLCBkaXJOYW1lKVxyXG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxyXG5cdFx0XHRcdFx0bG9hZERhdGEoY3RybC5tb2RlbC5yb290RGlyICsgZGlyTmFtZSArICcvJylcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uQmFja0J0bjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR2YXIgc3BsaXQgPSBjdHJsLm1vZGVsLnJvb3REaXIuc3BsaXQoJy8nKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25CYWNrQnRuJywgc3BsaXQpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdHNwbGl0LnBvcCgpXHJcblx0XHRcdFx0XHRzcGxpdC5wb3AoKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdyb290RGlyJywgcm9vdERpcilcclxuXHRcdFx0XHRcdGxvYWREYXRhKHNwbGl0LmpvaW4oJy8nKSArICcvJylcclxuXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkZpbGU6IGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHR2YXIgbmFtZSA9ICQodGhpcykuZGF0YSgnbmFtZScpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblBpY3R1cmUnLCBuYW1lKVxyXG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxyXG5cdFx0XHRcdFx0Ly92YXIgZmlsZVBhdGggPSBmaWxlU3J2LmZpbGVVcmwocm9vdERpciArIG5hbWUpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmaWxlUGF0aCcsIGZpbGVQYXRoKVxyXG5cdFx0XHRcdFx0aWYgKGN0cmwubW9kZWwuc2VsTW9kZSkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmNsb3Nlc3QoJy50aHVtYm5haWwnKS50b2dnbGVDbGFzcygnc2VsZWN0ZWQnKVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ2ZpbGVTZWxlY3RlZCcsIGdldFNlbEZpbGVzKCkubGVuZ3RoICE9IDApXHJcblx0XHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWx0LnRyaWdnZXIoJ2ZpbGVDbGljaycsIHtuYW1lLCByb290RGlyOiBjdHJsLm1vZGVsLnJvb3REaXJ9KVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25Ub2dnbGVTZWxNb2RlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSgnc2VsTW9kZScsICFjdHJsLm1vZGVsLnNlbE1vZGUpXHJcblx0XHRcdFx0XHRpZiAoIWN0cmwubW9kZWwuc2VsTW9kZSkge1xyXG5cdFx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSgnZmlsZVNlbGVjdGVkJywgZmFsc2UpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkRlbGV0ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQkJC5zaG93Q29uZmlybShcIkFyZSB5b3Ugc3VyZSA/XCIsIFwiRGVsZXRlIGZpbGVzXCIsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR2YXIgc2VsRmlsZSA9IGdldFNlbEZpbGVzKClcclxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25EZWxldGUnLCBzZWxGaWxlKVxyXG5cdFx0XHRcdFx0XHRmaWxlU3J2LnJlbW92ZUZpbGVzKHNlbEZpbGUpXHJcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0bG9hZERhdGEoKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHJcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fSlcclxuXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkNyZWF0ZUZvbGRlcjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR2YXIgcm9vdERpciA9IGN0cmwubW9kZWwucm9vdERpclxyXG5cdFx0XHRcdFx0JCQuc2hvd1Byb21wdCgnRm9sZGVyIG5hbWU6JywgJ05ldyBGb2xkZXInLCBmdW5jdGlvbihmb2xkZXJOYW1lKSB7XHJcblx0XHRcdFx0XHRcdGZpbGVTcnYubWtkaXIocm9vdERpciArIGZvbGRlck5hbWUpXHJcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0bG9hZERhdGEoKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHJcblx0XHRcdFx0XHRcdH0pXHRcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkN1dDogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRcdFx0Y29weSA9IGZhbHNlXHJcblxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25DdXQnLCBjdXRGaWxlcylcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdFx0c2VsTW9kZTogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGN1dEZpbGVzOiBnZXRTZWxGaWxlcygpLFxyXG5cdFx0XHRcdFx0XHRjdXREaXI6IGN0cmwubW9kZWwucm9vdERpclxyXG5cdFx0XHRcdFx0fSlcclxuXHJcblx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpLmFkZENsYXNzKCdjdXRlZCcpXHJcblxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25Db3B5OiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdFx0XHRjb3B5ID0gdHJ1ZVxyXG5cclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29weScsIGN1dEZpbGVzKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe1xyXG5cdFx0XHRcdFx0XHRzZWxNb2RlOiBmYWxzZSxcclxuXHRcdFx0XHRcdFx0ZmlsZVNlbGVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHRcdFx0Y3V0RmlsZXM6IGdldFNlbEZpbGVzKCksXHJcblx0XHRcdFx0XHRcdGN1dERpcjogY3RybC5tb2RlbC5yb290RGlyXHJcblx0XHRcdFx0XHR9KVxyXG5cclxuXHRcdFx0XHRcdGVsdC5maW5kKCcudGh1bWJuYWlsLnNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJykuYWRkQ2xhc3MoJ2N1dGVkJylcclxuXHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHRvblBhc3RlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uUGFzdGUnKVxyXG5cdFx0XHRcdFx0dmFyIHtyb290RGlyLCBjdXRGaWxlc30gPSBjdHJsLm1vZGVsXHJcblx0XHRcdFx0XHR2YXIgcHJvbWlzZSA9IChjb3B5KSA/IGZpbGVTcnYuY29weUZpbGVzKGN1dEZpbGVzLCByb290RGlyKSA6IGZpbGVTcnYubW92ZUZpbGVzKGN1dEZpbGVzLCByb290RGlyKVxyXG5cdFx0XHRcdFx0Y29weSA9IGZhbHNlXHJcblx0XHRcdFx0XHRwcm9taXNlXHJcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtjdXRGaWxlczogW119KVxyXG5cdFx0XHRcdFx0XHRsb2FkRGF0YSgpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoe2N1dEZpbGVzOiBbXX0pXHJcblx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChyZXNwLnJlc3BvbnNlVGV4dCwgJ0Vycm9yJylcclxuXHRcdFx0XHRcdH0pXHRcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uQ2FuY2VsU2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGVsdC5maW5kKCcudGh1bWJuYWlsJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkIGN1dGVkJylcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGN1dEZpbGVzOiBbXVxyXG5cdFx0XHRcdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25JbXBvcnRGaWxlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uSW1wb3J0RmlsZScpXHJcblx0XHRcdFx0XHR2YXIgcm9vdERpciA9IGN0cmwubW9kZWwucm9vdERpclxyXG5cclxuXHRcdFx0XHRcdCQkLm9wZW5GaWxlRGlhbG9nKGZ1bmN0aW9uKGZpbGUpIHtcclxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZmlsZVNpemUnLCBmaWxlLnNpemUgLyAxMDI0KVxyXG5cdFx0XHRcdFx0XHRpZiAoZmlsZS5zaXplID4gb3B0aW9ucy5tYXhVcGxvYWRTaXplKSB7XHJcblx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KCdGaWxlIHRvbyBiaWcnLCAnRXJyb3InKVxyXG5cdFx0XHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdCQkLnJlYWRGaWxlQXNEYXRhVVJMKGZpbGUsIGZ1bmN0aW9uKGRhdGFVUkwpIHtcclxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdkYXRhVVJMJywgZGF0YVVSTClcclxuXHRcdFx0XHRcdFx0XHRmaWxlU3J2LnVwbG9hZEZpbGUoZGF0YVVSTCwgZmlsZS5uYW1lLCByb290RGlyKS50aGVuKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0bG9hZERhdGEoKVxyXG5cdFx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChyZXNwLnJlc3BvbnNlVGV4dCwgJ0Vycm9yJylcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gXHJcblx0XHR9KVxyXG5cclxuXHRcdGZ1bmN0aW9uIGxvYWREYXRhKHJvb3REaXIpIHtcclxuXHRcdFx0aWYgKHJvb3REaXIgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0cm9vdERpciA9IGN0cmwubW9kZWwucm9vdERpclxyXG5cdFx0XHR9XHJcblx0XHRcdGZpbGVTcnYubGlzdChyb290RGlyLCBvcHRpb25zLmltYWdlT25seSkudGhlbihmdW5jdGlvbihmaWxlcykge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZpbGVzJywgZmlsZXMpXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdHJvb3REaXIsXHJcblx0XHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdFx0ZmlsZXM6IGZpbGVzXHJcblx0XHQvKlx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbihmaWxlKSB7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuICFmaWxlLmlzRGlyXHJcblx0XHRcdFx0XHRcdH0pKi9cclxuXHRcdFx0XHRcdFx0Lm1hcChmdW5jdGlvbihmaWxlLCBpZHgpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgbmFtZSA9IGZpbGUudGl0bGVcclxuXHRcdFx0XHRcdFx0XHR2YXIgaXNEaXIgPSBmaWxlLmZvbGRlclxyXG5cdFx0XHRcdFx0XHRcdHZhciBpc0ltYWdlID0gJCQuaXNJbWFnZShuYW1lKVxyXG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdFx0XHRuYW1lLFxyXG5cdFx0XHRcdFx0XHRcdFx0c2l6ZTogJ1NpemUgOiAnICsgTWF0aC5mbG9vcihmaWxlLnNpemUvMTAyNCkgKyAnIEtvJyxcclxuXHRcdFx0XHRcdFx0XHRcdGltZ1VybDogIGlzRGlyID8gJycgOiBmaWxlU3J2LmZpbGVVcmwocm9vdERpciArIG5hbWUpLFxyXG5cdFx0XHRcdFx0XHRcdFx0aXNEaXIsXHJcblx0XHRcdFx0XHRcdFx0XHRpc0ltYWdlLCBcclxuXHRcdFx0XHRcdFx0XHRcdGlzRmlsZTogIWlzRGlyICYmICFpc0ltYWdlXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH0pXHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdGxvYWREYXRhKClcclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRnZXRGaWxlczogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIGN0cmwubW9kZWwuZmlsZXNcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5mdW5jdGlvbiBnZXROb2RlUGF0aChub2RlKSB7XHJcblxyXG5cdHZhciBwYXRoID0gbm9kZS5nZXRQYXJlbnRMaXN0KGZhbHNlLCB0cnVlKS5tYXAoKG5vZGUpID0+IG5vZGUua2V5ID09ICdyb290JyA/ICcvJyA6IG5vZGUudGl0bGUpXHJcblx0cmV0dXJuIHBhdGguam9pbignLycpXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdGaWxlVHJlZUNvbnRyb2wnLCB7XHJcblx0ZGVwczogWydGaWxlU2VydmljZSddLFxyXG5cdGlmYWNlOiAncmVmcmVzaCgpO2dldFZhbHVlKCknLFxyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgZmlsZVNydikge1xyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdj5cXHJcXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiVHJlZUNvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcInRyZWVPcHRpb25zXFxcIiBibi1pZmFjZT1cXFwidHJlZUN0cmxcXFwiIGJuLWV2ZW50PVxcXCJjb250ZXh0TWVudUFjdGlvbjogb25UcmVlQWN0aW9uXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cIixcdFx0XHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHR0cmVlT3B0aW9uczoge1xyXG5cdFx0XHRcdFx0c291cmNlOiBbe3RpdGxlOiAnSG9tZScsIGZvbGRlcjogdHJ1ZSwgbGF6eTogdHJ1ZSwga2V5OiAncm9vdCd9XSxcclxuXHJcblx0XHRcdFx0XHRsYXp5TG9hZDogZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2xhenlMb2FkJywgZGF0YS5ub2RlLmtleSlcclxuXHRcdFx0XHRcdFx0dmFyIHBhdGggPSBnZXROb2RlUGF0aChkYXRhLm5vZGUpXHJcblx0XHRcdFx0XHRcdGRhdGEucmVzdWx0ID0gZmlsZVNydi5saXN0KHBhdGgsIGZhbHNlLCB0cnVlKVxyXG5cclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRjb250ZXh0TWVudToge1xyXG5cdFx0XHRcdFx0XHRtZW51OiB7XHJcblx0XHRcdFx0XHRcdFx0bmV3Rm9sZGVyOiB7J25hbWUnOiAnTmV3IEZvbGRlcid9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdG9uVHJlZUFjdGlvbjogZnVuY3Rpb24obm9kZSwgYWN0aW9uKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblRyZWVBY3Rpb24nLCBub2RlLnRpdGxlLCBhY3Rpb24pXHJcblx0XHRcdFx0XHQkJC5zaG93UHJvbXB0KCdGb2xkZXIgbmFtZScsICdOZXcgRm9sZGVyJywgZnVuY3Rpb24oZm9sZGVyTmFtZSkge1xyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0dmFyIHBhdGggPSBnZXROb2RlUGF0aChub2RlKVxyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmb2xkZXJOYW1lJywgZm9sZGVyTmFtZSwgJ3BhdGgnLCBwYXRoKVxyXG5cdFx0XHRcdFx0XHRmaWxlU3J2Lm1rZGlyKHBhdGggKyAnLycgKyBmb2xkZXJOYW1lKVxyXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdG5vZGUubG9hZCh0cnVlKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHJcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHRcdFx0XHJcblx0XHR9KVxyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGdldFZhbHVlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gZ2V0Tm9kZVBhdGgoY3RybC5zY29wZS50cmVlQ3RybC5nZXRBY3RpdmVOb2RlKCkpXHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRyZWZyZXNoOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zdCByb290ID0gY3RybC5zY29wZS50cmVlQ3RybC5nZXRSb290Tm9kZSgpLmdldEZpcnN0Q2hpbGQoKVxyXG5cdFx0XHRcdGlmIChyb290KSB7XHJcblx0XHRcdFx0XHRyb290LmxvYWQodHJ1ZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG59KSgpO1xyXG5cclxuXHJcblxyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdGZ1bmN0aW9uIGdldFRlbXBsYXRlKGhlYWRlcnMpIHtcclxuXHRcdHJldHVybiBgXHJcblx0XHRcdDxkaXYgY2xhc3M9XCJzY3JvbGxQYW5lbFwiPlxyXG5cdCAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInczLXRhYmxlLWFsbCB3My1zbWFsbFwiPlxyXG5cdCAgICAgICAgICAgICAgICA8dGhlYWQ+XHJcblx0ICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJ3My1ncmVlblwiPlxyXG5cdCAgICAgICAgICAgICAgICAgICAgXHQke2hlYWRlcnN9XHJcblx0ICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG5cdCAgICAgICAgICAgICAgICA8L3RoZWFkPlxyXG5cdCAgICAgICAgICAgICAgICA8dGJvZHk+PC90Ym9keT5cclxuXHQgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuXHRcdGBcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldEl0ZW1UZW1wbGF0ZShyb3dzKSB7XHJcblx0XHRyZXR1cm4gYFxyXG4gICAgICAgICAgICA8dHIgY2xhc3M9XCJpdGVtXCIgYm4tYXR0cj1cImRhdGEtaWQ6IF9pZFwiPlxyXG4gICAgICAgICAgICBcdCR7cm93c31cclxuICAgICAgICAgICAgPC90cj5cdFxyXG5cdFx0YFxyXG5cdH1cclxuXHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnRmlsdGVyZWRUYWJsZUNvbnRyb2wnLCB7XHJcblxyXG5cdFx0aWZhY2U6ICdhZGRJdGVtKGlkLCBkYXRhKTtyZW1vdmVJdGVtKGlkKTtyZW1vdmVBbGxJdGVtcygpO3NldEZpbHRlcnMoZmlsdGVycyk7Z2V0RGF0YXMoKTtnZXREaXNwbGF5ZWREYXRhcygpO29uKGV2ZW50LCBjYWxsYmFjayknLFxyXG5cdFx0ZXZlbnRzOiAnaXRlbUFjdGlvbicsXHJcblxyXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdFx0XHR2YXIgY29sdW1ucyA9ICAkJC5vYmoyQXJyYXkob3B0aW9ucy5jb2x1bW5zKVxyXG5cdFx0XHR2YXIgYWN0aW9ucyA9ICQkLm9iajJBcnJheShvcHRpb25zLmFjdGlvbnMpXHJcblx0XHRcdHZhciBoZWFkZXJzID0gY29sdW1ucy5tYXAoKGNvbHVtbikgPT4gYDx0aD4ke2NvbHVtbi52YWx1ZX08L3RoPmApXHRcdFxyXG5cdFx0XHR2YXIgcm93cyA9IGNvbHVtbnMubWFwKChjb2x1bW4pID0+IGA8dGQgYm4taHRtbD1cIiR7Y29sdW1uLmtleX1cIj48L3RkPmApXHJcblx0XHRcdGlmIChhY3Rpb25zLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0XHRoZWFkZXJzLnB1c2goYDx0aD5BY3Rpb248L3RoPmApXHJcblxyXG5cdFx0XHRcdHZhciBidXR0b25zID0gYWN0aW9ucy5tYXAoKGFjdGlvbikgPT4gYDxidXR0b24gZGF0YS1hY3Rpb249XCIke2FjdGlvbi5rZXl9XCIgY2xhc3M9XCJ3My1idXR0b25cIj48aSBjbGFzcz1cIiR7YWN0aW9uLnZhbHVlfVwiPjwvaT48L2J1dHRvbj5gKVxyXG5cdFx0XHRcdHJvd3MucHVzaChgPHRkPiR7YnV0dG9uc308L3RkPmApXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ3Jvd3MnLCByb3dzKVxyXG5cdFx0XHR2YXIgaXRlbVRlbXBsYXRlID0gZ2V0SXRlbVRlbXBsYXRlKHJvd3Muam9pbignJykpXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2l0ZW1UZW1wbGF0ZScsIGl0ZW1UZW1wbGF0ZSlcclxuXHJcblx0XHRcdGVsdC5hcHBlbmQoZ2V0VGVtcGxhdGUoaGVhZGVycy5qb2luKCcnKSkpXHJcblx0XHRcdGVsdC5hZGRDbGFzcygnYm4tZmxleC1jb2wnKVxyXG5cclxuXHRcdFx0bGV0IGRhdGFzID0ge31cclxuXHRcdFx0bGV0IGV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcclxuXHRcdFx0bGV0IF9maWx0ZXJzID0ge31cclxuXHRcdFx0bGV0IGRpc3BsYXllZEl0ZW1zID0ge31cclxuXHJcblx0XHRcdGNvbnN0IHRib2R5ID0gZWx0LmZpbmQoJ3Rib2R5JylcclxuXHRcdFx0dGJvZHkub24oJ2NsaWNrJywgJ1tkYXRhLWFjdGlvbl0nLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgaWQgPSAkKHRoaXMpLmNsb3Nlc3QoJy5pdGVtJykuZGF0YSgnaWQnKVxyXG5cdFx0XHRcdHZhciBhY3Rpb24gPSAkKHRoaXMpLmRhdGEoJ2FjdGlvbicpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ2NsaWNrJywgaWQsICdhY3Rpb24nLCBhY3Rpb24pXHJcblx0XHRcdFx0ZXZlbnRzLmVtaXQoJ2l0ZW1BY3Rpb24nLCBhY3Rpb24sIGlkKVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gYWRkSXRlbShpZCwgZGF0YSkge1xyXG5cdFx0XHRcdHZhciBpdGVtRGF0YSA9ICQuZXh0ZW5kKHsnX2lkJzogaWR9LCBkYXRhKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2FkZEl0ZW0nLCBpdGVtRGF0YSlcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoZGF0YXNbaWRdICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0dmFyIGl0ZW0gPSBkaXNwbGF5ZWRJdGVtc1tpZF1cclxuXHRcdFx0XHRcdGlmIChpdGVtICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0XHRpdGVtLnByb2Nlc3NUZW1wbGF0ZShpdGVtRGF0YSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBpZiAoaXNJbkZpbHRlcihkYXRhKSl7XHJcblx0XHRcdFx0XHR2YXIgaXRlbSA9ICQoaXRlbVRlbXBsYXRlKS5wcm9jZXNzVGVtcGxhdGUoaXRlbURhdGEpXHJcblx0XHRcdFx0XHRkaXNwbGF5ZWRJdGVtc1tpZF0gPSBpdGVtXHJcblx0XHRcdFx0XHR0Ym9keS5hcHBlbmQoaXRlbSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGF0YXNbaWRdID0gZGF0YVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiByZW1vdmVJdGVtKGlkKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygncmVtb3ZlSXRlbScsIGlkKVxyXG5cdFx0XHRcdGlmIChkYXRhc1tpZF0gIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRkZWxldGUgZGF0YXNbaWRdXHJcblx0XHRcdFx0XHR2YXIgaXRlbSA9IGRpc3BsYXllZEl0ZW1zW2lkXVxyXG5cdFx0XHRcdFx0aWYgKGl0ZW0gIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRcdGl0ZW0ucmVtb3ZlKClcclxuXHRcdFx0XHRcdFx0ZGVsZXRlIGRpc3BsYXllZEl0ZW1zW2lkXVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gcmVtb3ZlQWxsSXRlbXMoKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygncmVtb3ZlQWxsSXRlbXMnKVxyXG5cdFx0XHRcdGRhdGFzID0ge31cclxuXHRcdFx0XHRkaXNwbGF5ZWRJdGVtcyA9IHt9XHJcblx0XHRcdFx0dGJvZHkuZW1wdHkoKVx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gaXNJbkZpbHRlcihkYXRhKSB7XHJcblx0XHRcdFx0dmFyIHJldCA9IHRydWVcclxuXHRcdFx0XHRmb3IodmFyIGYgaW4gX2ZpbHRlcnMpIHtcclxuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IGRhdGFbZl1cclxuXHRcdFx0XHRcdHZhciBmaWx0ZXJWYWx1ZSA9IF9maWx0ZXJzW2ZdXHJcblx0XHRcdFx0XHRyZXQgJj0gKGZpbHRlclZhbHVlID09ICcnIHx8IHZhbHVlLnN0YXJ0c1dpdGgoZmlsdGVyVmFsdWUpKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcmV0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIHNldEZpbHRlcnMoZmlsdGVycykge1xyXG5cdFx0XHRcdF9maWx0ZXJzID0gZmlsdGVyc1xyXG5cdFx0XHRcdGRpc3BUYWJsZSgpXHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBkaXNwVGFibGUoKSB7XHJcblx0XHRcdFx0ZGlzcGxheWVkSXRlbXMgPSB7fVxyXG5cdFx0XHRcdGxldCBpdGVtcyA9IFtdXHJcblx0XHRcdFx0Zm9yKGxldCBpZCBpbiBkYXRhcykge1xyXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSBkYXRhc1tpZF1cclxuXHRcdFx0XHRcdGlmIChpc0luRmlsdGVyKGRhdGEpKSB7XHJcblx0XHRcdFx0XHRcdHZhciBpdGVtRGF0YSA9ICQuZXh0ZW5kKHsnX2lkJzogaWR9LCBkYXRhKVxyXG5cdFx0XHRcdFx0XHR2YXIgaXRlbSA9ICQoaXRlbVRlbXBsYXRlKS5wcm9jZXNzVGVtcGxhdGUoaXRlbURhdGEpXHRcdFx0XHJcblx0XHRcdFx0XHRcdGl0ZW1zLnB1c2goaXRlbSlcclxuXHRcdFx0XHRcdFx0ZGlzcGxheWVkSXRlbXNbaWRdID0gaXRlbVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0dGJvZHkuZW1wdHkoKS5hcHBlbmQoaXRlbXMpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGdldERhdGFzKCkge1xyXG5cdFx0XHRcdHJldHVybiBkYXRhc1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBnZXREaXNwbGF5ZWREYXRhcygpIHtcclxuXHRcdFx0XHR2YXIgcmV0ID0ge31cclxuXHRcdFx0XHRmb3IobGV0IGkgaW4gZGlzcGxheWVkSXRlbXMpIHtcclxuXHRcdFx0XHRcdHJldFtpXSA9IGRhdGFzW2ldXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiByZXRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRhZGRJdGVtOiBhZGRJdGVtLFxyXG5cdFx0XHRcdHJlbW92ZUl0ZW06IHJlbW92ZUl0ZW0sXHJcblx0XHRcdFx0cmVtb3ZlQWxsSXRlbXM6IHJlbW92ZUFsbEl0ZW1zLFxyXG5cdFx0XHRcdG9uOiBldmVudHMub24uYmluZChldmVudHMpLFxyXG5cdFx0XHRcdHNldEZpbHRlcnM6IHNldEZpbHRlcnMsXHJcblx0XHRcdFx0Z2V0RGF0YXM6IGdldERhdGFzLFxyXG5cdFx0XHRcdGdldERpc3BsYXllZERhdGFzOiBnZXREaXNwbGF5ZWREYXRhcyxcclxuXHRcdFx0XHRvcHRpb25zOiBvcHRpb25zXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdIZWFkZXJDb250cm9sJywge1xyXG5cdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLFxyXG5cdHByb3BzOiB7XHJcblx0XHR0aXRsZToge3ZhbDogJ0hlbGxvIFdvcmxkJ30sXHJcblx0XHR1c2VyTmFtZToge3ZhbDogJ3Vua25vd24nfVxyXG5cdH0sXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2ID5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcImJyYW5kXFxcIj48aDEgY2xhc3M9XFxcImJuLXhzLWhpZGVcXFwiIGJuLXRleHQ9XFxcInRpdGxlXFxcIj48L2gxPiA8L2Rpdj5cXHJcXG5cdDxkaXY+XFxyXFxuXHQgICAgPGkgYm4tYXR0cj1cXFwidGl0bGU6IHRpdGxlU3RhdGVcXFwiIGNsYXNzPVxcXCJmYSBmYS1sZyBjb25uZWN0aW9uU3RhdGVcXFwiIGJuLWNsYXNzPVxcXCJmYS1leWU6IGNvbm5lY3RlZCwgZmEtZXllLXNsYXNoOiAhY29ubmVjdGVkXFxcIj48L2k+XFxyXFxuXHQgICAgPGkgY2xhc3M9XFxcImZhIGZhLXVzZXIgZmEtbGdcXFwiPjwvaT5cXHJcXG5cdCAgICA8c3BhbiBibi10ZXh0PVxcXCJ1c2VyTmFtZVxcXCIgY2xhc3M9XFxcInVzZXJOYW1lXFxcIj48L3NwYW4+XFxyXFxuXHQgICAgPGEgaHJlZj1cXFwiL1xcXCIgdGl0bGU9XFxcImhvbWVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1ob21lIGZhLWxnXFxcIj48L2k+PC9hPiBcXHJcXG5cdDwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0Y29ubmVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHR0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBkaXNjb25uZWN0ZWRcIixcclxuXHRcdFx0XHR0aXRsZTogb3B0aW9ucy50aXRsZSxcclxuXHRcdFx0XHR1c2VyTmFtZTogb3B0aW9ucy51c2VyTmFtZVx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cclxuXHRcdGNsaWVudC5ldmVudHMub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tIZWFkZXJDb250cm9sXSBjbGllbnQgY29ubmVjdGVkJylcclxuXHRcdFx0Y3RybC5zZXREYXRhKHtjb25uZWN0ZWQ6IHRydWUsIHRpdGxlU3RhdGU6IFwiV2ViU29ja2V0IGNvbm5lY3RlZFwifSlcclxuXHJcblx0XHR9KVxyXG5cclxuXHRcdGNsaWVudC5ldmVudHMub24oJ2Rpc2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tIZWFkZXJDb250cm9sXSBjbGllbnQgZGlzY29ubmVjdGVkJylcclxuXHRcdFx0Y3RybC5zZXREYXRhKHtjb25uZWN0ZWQ6IGZhbHNlLCB0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBkaXNjb25uZWN0ZWRcIn0pXHJcblxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0lucHV0R3JvdXBDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdHZhciBpZCA9IGVsdC5jaGlsZHJlbignaW5wdXQnKS51bmlxdWVJZCgpLmF0dHIoJ2lkJylcclxuXHRcdC8vY29uc29sZS5sb2coJ1tJbnB1dEdyb3VwQ29udHJvbF0gaWQnLCBpZClcclxuXHRcdGVsdC5jaGlsZHJlbignbGFiZWwnKS5hdHRyKCdmb3InLCBpZClcclxuXHR9XHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdOYXZiYXJDb250cm9sJywge1xyXG5cclxuXHRcdHByb3BzOiB7XHJcblx0XHRcdGFjdGl2ZUNvbG9yOiB7dmFsOiAndzMtZ3JlZW4nfVxyXG5cdFx0fSxcclxuXHJcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRcdHZhciBhY3RpdmVDb2xvciA9IG9wdGlvbnMuYWN0aXZlQ29sb3JcclxuXHJcblxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbTmF2YmFyQ29udHJvbF0gb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdFx0XHRlbHQuYWRkQ2xhc3MoJ3czLWJhcicpXHJcblx0XHRcdGVsdC5jaGlsZHJlbignYScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5hZGRDbGFzcygndzMtYmFyLWl0ZW0gdzMtYnV0dG9uJylcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdCQod2luZG93KS5vbigncm91dGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZ0LCBuZXdSb3V0ZSkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tOYXZiYXJDb250cm9sXSByb3V0ZUNoYW5nZScsIG5ld1JvdXRlKVxyXG5cclxuXHRcdFx0XHRlbHQuY2hpbGRyZW4oYGEuJHthY3RpdmVDb2xvcn1gKS5yZW1vdmVDbGFzcyhhY3RpdmVDb2xvcilcdFxyXG5cdFx0XHRcdGVsdC5jaGlsZHJlbihgYVtocmVmPVwiIyR7bmV3Um91dGV9XCJdYCkuYWRkQ2xhc3MoYWN0aXZlQ29sb3IpXHJcblxyXG5cdFx0XHR9KVx0XHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG5cclxufSkoKTtcclxuXHJcblxyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnUGljdHVyZUNhcm91c2VsQ29udHJvbCcsIHtcclxuXHJcblx0cHJvcHM6IHtcclxuXHRcdHdpZHRoOiB7dmFsOiAzMDB9LFxyXG5cdFx0aGVpZ2h0OiB7dmFsOiAyMDB9LFxyXG5cdFx0YW5pbWF0ZURlbGF5OiB7dmFsOiAxMDAwfSxcclxuXHRcdGluZGV4OiB7dmFsOiAwLCBzZXQ6ICdzZXRJbmRleCd9LFxyXG5cdFx0aW1hZ2VzOiB7dmFsOiBbXSwgc2V0OiAnc2V0SW1hZ2VzJ30sXHJcblx0XHRjb2xvcjoge3ZhbDogJ3llbGxvdyd9XHJcblx0fSxcclxuXHJcblx0aWZhY2U6ICdzZXRJbWFnZXMoaW1hZ2VzKTtzZXRJbmRleChpZHgpJyxcclxuXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0Y29uc29sZS5sb2coYFtQaWN0dXJlQ2Fyb3VzZWxDb250cm9sXSBvcHRpb25zYCwgb3B0aW9ucylcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGJuLWNvbnRyb2w9XFxcIkNhcm91c2VsQ29udHJvbFxcXCIgYm4tb3B0aW9ucz1cXFwiY2Fyb3VzZWxDdHJsT3B0aW9uc1xcXCIgYm4tZWFjaD1cXFwiaSBvZiBpbWFnZXNcXFwiIGJuLWlmYWNlPVxcXCJjYXJvdXNlbEN0cmxcXFwiIGJuLWRhdGE9XFxcImluZGV4OiBpbmRleFxcXCI+XFxyXFxuXHQ8ZGl2IHN0eWxlPVxcXCJ0ZXh0LWFsaWduOiBjZW50ZXI7XFxcIiBibi1zdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjogYmFja0NvbG9yXFxcIj5cXHJcXG5cdFx0PGltZyBibi1hdHRyPVxcXCJzcmM6IGlcXFwiIHN0eWxlPVxcXCJoZWlnaHQ6IDEwMCVcXFwiPlxcclxcblx0PC9kaXY+XFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRjYXJvdXNlbEN0cmxPcHRpb25zOiBvcHRpb25zLFxyXG5cdFx0XHRcdGltYWdlczogb3B0aW9ucy5pbWFnZXMsXHJcblx0XHRcdFx0YmFja0NvbG9yOiBvcHRpb25zLmNvbG9yLFxyXG5cdFx0XHRcdGluZGV4OiBvcHRpb25zLmluZGV4XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0c2V0SW1hZ2VzOiBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tQaWN0dXJlQ2Fyb3VzZWxDb250cm9sXSBzZXRJbWFnZXMnLCB2YWx1ZSlcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoJ2ltYWdlcycsIHZhbHVlKVxyXG5cdFx0XHRcdGN0cmwuc2NvcGUuY2Fyb3VzZWxDdHJsLnJlZnJlc2goKVx0XHRcdFxyXG5cdFx0XHR9LFxyXG5cdFx0XHRzZXRJbmRleDogZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoJ2luZGV4JywgdmFsdWUpXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblx0fVxyXG59KTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbCgnUmFkaW9Hcm91cENvbnRyb2wnLCBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHRlbHQub24oJ2NsaWNrJywgJ2lucHV0W3R5cGU9cmFkaW9dJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ3JhZGlvZ3JvdXAgY2xpY2snKVxyXG5cdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1yYWRpb106Y2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSlcclxuXHRcdFx0JCh0aGlzKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSlcclxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0JylcclxuXHRcdH0pXHJcblx0XHRcclxuXHJcblx0XHRmdW5jdGlvbiBnZXRWYWx1ZSgpIHtcclxuXHRcdFx0cmV0dXJuIGVsdC5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXTpjaGVja2VkJykudmFsKClcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBzZXRWYWx1ZSh2YWx1ZSkge1xyXG5cdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1yYWRpb10nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHZhbHVlID09PSAkKHRoaXMpLnZhbCgpKVxyXG5cdFx0XHR9KVx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGdldFZhbHVlOiBnZXRWYWx1ZSxcclxuXHRcdFx0c2V0VmFsdWU6IHNldFZhbHVlXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG5cclxufSkoKTtcclxuXHJcblxyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdGZ1bmN0aW9uIG1hdGNoUm91dGUocm91dGUsIHBhdHRlcm4pIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ21hdGNoUm91dGUnLCByb3V0ZSwgcGF0dGVybilcclxuXHRcdHZhciByb3V0ZVNwbGl0ID0gcm91dGUuc3BsaXQoJy8nKVxyXG5cdFx0dmFyIHBhdHRlcm5TcGxpdCA9IHBhdHRlcm4uc3BsaXQoJy8nKVxyXG5cdFx0Ly9jb25zb2xlLmxvZyhyb3V0ZVNwbGl0LCBwYXR0ZXJuU3BsaXQpXHJcblx0XHR2YXIgcmV0ID0ge31cclxuXHJcblx0XHRpZiAocm91dGVTcGxpdC5sZW5ndGggIT0gcGF0dGVyblNwbGl0Lmxlbmd0aClcclxuXHRcdFx0cmV0dXJuIG51bGxcclxuXHJcblx0XHRmb3IodmFyIGlkeCA9IDA7IGlkeCA8IHBhdHRlcm5TcGxpdC5sZW5ndGg7IGlkeCsrKSB7XHJcblx0XHRcdHZhciBwYXRoID0gcGF0dGVyblNwbGl0W2lkeF1cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncGF0aCcsIHBhdGgpXHJcblx0XHRcdGlmIChwYXRoLnN1YnN0cigwLCAxKSA9PT0gJzonKSB7XHJcblx0XHRcdFx0aWYgKHJvdXRlU3BsaXRbaWR4XS5sZW5ndGggPT09IDApXHJcblx0XHRcdFx0XHRyZXR1cm4gbnVsbFxyXG5cdFx0XHRcdHJldFtwYXRoLnN1YnN0cigxKV0gPSByb3V0ZVNwbGl0W2lkeF1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChwYXRoICE9PSByb3V0ZVNwbGl0W2lkeF0pIHtcclxuXHRcdFx0XHRyZXR1cm4gbnVsbFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdSb3V0ZXJDb250cm9sJywge1xyXG5cclxuXHRcdHByb3BzOiB7XHJcblx0XHRcdHJvdXRlczoge3ZhbDogW119XHJcblx0XHR9LFxyXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cclxuXHJcblx0XHRcdHZhciByb3V0ZXMgPSBvcHRpb25zLnJvdXRlc1xyXG5cclxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHJvdXRlcykpIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1tSb3V0ZXJDb250cm9sXSBiYWQgb3B0aW9ucycpXHJcblx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBwcm9jZXNzUm91dGUoaW5mbykge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbUm91dGVyQ29udHJvbF0gcHJvY2Vzc1JvdXRlJywgaW5mbylcclxuXHJcblx0XHRcdFx0dmFyIG5ld1JvdXRlID0gaW5mby5jdXJSb3V0ZVxyXG5cclxuXHRcdFx0XHRmb3IodmFyIHJvdXRlIG9mIHJvdXRlcykge1xyXG5cdFx0XHRcdFx0dmFyIHBhcmFtcyA9IG1hdGNoUm91dGUobmV3Um91dGUsIHJvdXRlLmhyZWYpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGByb3V0ZTogJHtyb3V0ZS5ocmVmfSwgcGFyYW1zYCwgcGFyYW1zKVxyXG5cdFx0XHRcdFx0aWYgKHBhcmFtcyAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1tSb3V0ZXJDb250cm9sXSBwYXJhbXMnLCBwYXJhbXMpXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygcm91dGUucmVkaXJlY3QgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0XHRsb2NhdGlvbi5ocmVmID0gJyMnICsgcm91dGUucmVkaXJlY3RcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2Ygcm91dGUuY29udHJvbCA9PSAnc3RyaW5nJykge1xyXG5cclxuXHRcdFx0XHRcdFx0XHR2YXIgY3VyQ3RybCA9IGVsdC5maW5kKCcuQ3VzdG9tQ29udHJvbCcpLmludGVyZmFjZSgpXHJcblx0XHRcdFx0XHRcdFx0dmFyIGNhbkNoYW5nZSA9IHRydWVcclxuXHRcdFx0XHRcdFx0XHRpZiAoY3VyQ3RybCAmJiB0eXBlb2YgY3VyQ3RybC5jYW5DaGFuZ2UgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0Y2FuQ2hhbmdlID0gY3VyQ3RybC5jYW5DaGFuZ2UoKVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRpZiAoY2FuQ2hhbmdlKSB7XHJcblx0XHRcdFx0XHRcdFx0XHQkKHdpbmRvdykudHJpZ2dlcigncm91dGVDaGFuZ2VkJywgbmV3Um91dGUpXHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgY29uZmlnID0gJC5leHRlbmQoeyRwYXJhbXM6IHBhcmFtc30sIHJvdXRlLm9wdGlvbnMpXHRcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBodG1sID0gJChgPGRpdiBibi1jb250cm9sPVwiJHtyb3V0ZS5jb250cm9sfVwiIGJuLW9wdGlvbnM9XCJjb25maWdcIiBjbGFzcz1cImJuLWZsZXgtY29sIGJuLWZsZXgtMVwiPjwvZGl2PmApXHJcblx0XHRcdFx0XHRcdFx0XHRlbHQuZGlzcG9zZSgpLmh0bWwoaHRtbClcclxuXHRcdFx0XHRcdFx0XHRcdGh0bWwucHJvY2Vzc1VJKHtjb25maWc6IGNvbmZpZ30pXHRcdFxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRlbHNlIGlmIChpbmZvLnByZXZSb3V0ZSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0aGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sICcnLCAnIycgKyBpbmZvLnByZXZSb3V0ZSlcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdC8vZWx0Lmh0bWwoaHRtbClcclxuXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0XHRcdH1cdFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHJcblx0XHRcdH1cdFx0XHJcblxyXG5cdFx0XHQkKHdpbmRvdykub24oJ3JvdXRlQ2hhbmdlJywgZnVuY3Rpb24oZXYsIGluZm8pIHtcclxuXHRcdFx0XHRpZiAoIXByb2Nlc3NSb3V0ZShpbmZvKSkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbUm91dGVyQ29udHJvbF0gbm8gYWN0aW9uIGRlZmluZWQgZm9yIHJvdXRlICcke25ld1JvdXRlfSdgKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuXHJcblxyXG4iXX0=
