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


			this.refresh = function() {
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

			this.setIndex = function(index) {
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

	 		this.refresh()

		}

	})

})();

$$.registerControlEx('CheckGroupControl', {
	
	lib: 'core',
init: function(elt) {

		elt.on('click', 'input[type=checkbox]', function() {
			elt.trigger('input')
		})

		this.getValue = function() {
			var ret = []
			elt.find('input[type=checkbox]:checked').each(function() {
				ret.push($(this).val())
			})	
			return ret	
		}

		this.setValue = function(value) {
			if (Array.isArray(value)) {
				elt.find('input[type=checkbox]').each(function() {
					$(this).prop('checked', value.indexOf($(this).val()) >= 0)
				})
			}		
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

		this.html = function() {
			return ctrl.scope.editor.html()
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

		this.getFiles = function() {
			return ctrl.model.files
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

		this.getValue = function() {
			return getNodePath(ctrl.scope.treeCtrl.getActiveNode())
		},

		this.refresh = function() {
			const root = ctrl.scope.treeCtrl.getRootNode().getFirstChild()
			if (root) {
				root.load(true)
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

			this.addItem = function(id, data) {

				var itemData = $.extend({'_id': id}, data)
				//console.log('addItem', itemData)
				
				if (datas[id] != undefined) {
					var item = displayedItems[id]
					if (item != undefined) {
						item.elt.updateTemplate(item.ctx, itemData)
					}
				}
				else if (isInFilter(data)){
					var elt = $(itemTemplate)
					var ctx = elt.processTemplate(itemData)
					displayedItems[id] = {elt, ctx}
					tbody.append(elt)
				}
				datas[id] = data
			}

			this.removeItem = function(id) {
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

			this.removeAllItems = function() {
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

			this.setFilters = function(filters) {
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
						var elt = $(itemTemplate)
						var ctx = elt.processTemplate(itemData)			
						items.push(elt)
						displayedItems[id] = {elt, ctx}
					}

				}
				
				
				tbody.empty().append(items)
			}

			this.getDatas = function() {
				return datas
			}

			this.getDisplayedDatas = function() {
				var ret = {}
				for(let i in displayedItems) {
					ret[i] = datas[i]
				}
				return ret
			}

			this.on = events.on.bind(events)


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

		this.setImages = function(value) {
			//console.log('[PictureCarouselControl] setImages', value)
			ctrl.setData('images', value)
			ctrl.scope.carouselCtrl.refresh()			
		},
		this.setIndex = function(value) {
			ctrl.setData('index', value)
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
		

		this.getValue = function() {
			return elt.find('input[type=radio]:checked').val()
		}

		this.setValue = function(value) {
			elt.find('input[type=radio]').each(function() {
				$(this).prop('checked', value === $(this).val())
			})			
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



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhcm91c2VsLmpzIiwiY2hlY2tncm91cC5qcyIsImVkaXRvci5qcyIsImZpbGUuanMiLCJmaWxldHJlZS5qcyIsImZpbHRlcmVkLXRhYmxlLmpzIiwiaGVhZGVyLmpzIiwiaW5wdXRncm91cC5qcyIsIm5hdmJhci5qcyIsInBpY3R1cmVjYXJvdXNlbC5qcyIsInJhZGlvZ3JvdXAuanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0Nhcm91c2VsQ29udHJvbCcsIHtcclxuXHJcblx0XHRwcm9wczoge1xyXG5cdFx0XHR3aWR0aDoge3ZhbDogMzAwfSxcclxuXHRcdFx0aGVpZ2h0OiB7dmFsOiAyMDB9LFxyXG5cdFx0XHRhbmltYXRlRGVsYXk6IHt2YWw6IDEwMDB9LFxyXG5cdFx0XHRpbmRleDoge1xyXG5cdFx0XHRcdHZhbDogMCxcclxuXHRcdFx0XHRzZXQ6ICdzZXRJbmRleCdcclxuXHRcdFx0fSBcclxuXHRcdH0sXHJcblx0XHRpZmFjZTogJ3NldEluZGV4KGlkeCk7cmVmcmVzaCgpJyxcclxuXHJcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHRcclxuXHJcblxyXG5cdFx0XHR2YXIgd2lkdGggPSBvcHRpb25zLndpZHRoICsgJ3B4J1xyXG5cdFx0XHR2YXIgaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgKyAncHgnXHJcblx0XHRcdGVsdC5jc3MoJ3dpZHRoJywgd2lkdGgpLmNzcygnaGVpZ2h0JywgaGVpZ2h0KVxyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coYFtDYXJvdXNlbENvbnRyb2xdIG9wdGlvbnNgLCBvcHRpb25zKVxyXG5cclxuXHRcdFx0dmFyIGN0cmwgPSBudWxsXHJcblx0XHRcdHZhciBpdGVtc1xyXG5cdFx0XHR2YXIgaWR4XHJcblxyXG5cclxuXHRcdFx0dGhpcy5yZWZyZXNoID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0Nhcm91c2VsQ29udHJvbF0gcmVmcmVzaCcpXHJcblx0XHRcdFx0aXRlbXMgPSBlbHQuY2hpbGRyZW4oJ2RpdicpLnJlbW92ZSgpLmNzcygnd2lkdGgnLCB3aWR0aCkuY3NzKCdoZWlnaHQnLCBoZWlnaHQpXHRcdFxyXG5cclxuXHRcdFx0XHRpZHggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihvcHRpb25zLmluZGV4LCBpdGVtcy5sZW5ndGgpKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coYFtDYXJvdXNlbENvbnRyb2xdIGlkeGAsIGlkeClcclxuXHJcblx0XHRcdFx0ZnVuY3Rpb24gYW5pbWF0ZShkaXJlY3Rpb24pIHtcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7bGVmdERpc2FibGVkOiB0cnVlLCByaWdodERpc2FibGVkOiB0cnVlfSlcclxuXHRcdFx0XHRcdHZhciBvcCA9IGRpcmVjdGlvbiA9PSAnbGVmdCcgPyAnKz0nIDogJy09J1xyXG5cdFx0XHRcdFx0aWR4ID0gZGlyZWN0aW9uID09ICdsZWZ0JyA/IGlkeC0xIDogaWR4KzFcclxuXHJcblx0XHRcdFx0XHRjdHJsLnNjb3BlLml0ZW1zLmFuaW1hdGUoe2xlZnQ6IG9wICsgd2lkdGh9LCBvcHRpb25zLmFuaW1hdGVEZWxheSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdGNoZWNrQnRucygpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInZpZXdwb3J0XFxcIj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiaXRlbXNcXFwiIGJuLWJpbmQ9XFxcIml0ZW1zXFxcIj48L2Rpdj5cdFxcclxcblx0PC9kaXY+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJvdmVybGF5XFxcIj5cXHJcXG5cdFx0PGRpdj5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkxlZnRcXFwiIFxcclxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiaGlkZGVuOiBsZWZ0RGlzYWJsZWRcXFwiXFxyXFxuXHRcdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hldnJvbi1jaXJjbGUtbGVmdFxcXCI+PC9pPlxcclxcblx0XHRcdDwvYnV0dG9uPlx0XHRcdFxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdFx0PGRpdj5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvblJpZ2h0XFxcIiBcXHJcXG5cdFx0XHRcdGJuLXByb3A9XFxcImhpZGRlbjogcmlnaHREaXNhYmxlZFxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hldnJvbi1jaXJjbGUtcmlnaHRcXFwiPjwvaT5cXHJcXG5cdFx0XHQ8L2J1dHRvbj5cdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRcdFx0bGVmdERpc2FibGVkOiB0cnVlLFxyXG5cdFx0XHRcdFx0XHRyaWdodERpc2FibGVkOiBmYWxzZVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLnNjb3BlLml0ZW1zLmFwcGVuZChpdGVtcylcclxuXHRcdFx0XHRcdFx0dGhpcy5zY29wZS5pdGVtcy5jc3MoJ2xlZnQnLCAoLWlkeCAqIG9wdGlvbnMud2lkdGgpICsgJ3B4JylcclxuXHRcdFx0XHRcdFx0Ly9jaGVja0J0bnMoKVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdFx0XHRvbkxlZnQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGFuaW1hdGUoJ2xlZnQnKVxyXG5cdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRvblJpZ2h0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRhbmltYXRlKCdyaWdodCcpXHJcblx0XHRcdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0Y2hlY2tCdG5zKClcdFx0XHJcblxyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHRcdFx0dGhpcy5zZXRJbmRleCA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1tDYXJvdXNlbENvbnRyb2xdIHNldEluZGV4JywgaW5kZXgpXHJcblx0XHRcdFx0aWR4ID0gIE1hdGgubWF4KDAsIE1hdGgubWluKGluZGV4LCBpdGVtcy5sZW5ndGgpKVxyXG5cdFx0XHRcdGN0cmwuc2NvcGUuaXRlbXMuY3NzKCdsZWZ0JywgKC1pZHggKiBvcHRpb25zLndpZHRoKSArICdweCcpXHJcblx0XHRcdFx0Y2hlY2tCdG5zKGlkeClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gY2hlY2tCdG5zKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2NoZWNrQnRucycsIGlkeCwgaXRlbXMubGVuZ3RoKVxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0XHRsZWZ0RGlzYWJsZWQ6IGlkeCA9PSAwLFxyXG5cdFx0XHRcdFx0cmlnaHREaXNhYmxlZDogaWR4ID09IGl0ZW1zLmxlbmd0aCAtIDFcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHQgXHRcdHRoaXMucmVmcmVzaCgpXHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0NoZWNrR3JvdXBDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdGVsdC5vbignY2xpY2snLCAnaW5wdXRbdHlwZT1jaGVja2JveF0nLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0JylcclxuXHRcdH0pXHJcblxyXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgcmV0ID0gW11cclxuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdOmNoZWNrZWQnKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldC5wdXNoKCQodGhpcykudmFsKCkpXHJcblx0XHRcdH0pXHRcclxuXHRcdFx0cmV0dXJuIHJldFx0XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cdFx0XHRcdGVsdC5maW5kKCdpbnB1dFt0eXBlPWNoZWNrYm94XScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCB2YWx1ZS5pbmRleE9mKCQodGhpcykudmFsKCkpID49IDApXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVx0XHRcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cclxufSk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdIdG1sRWRpdG9yQ29udHJvbCcsIHtcclxuXHJcblx0aWZhY2U6ICdodG1sKCknLFxyXG5cclxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHRlbHQuYWRkQ2xhc3MoJ2JuLWZsZXgtcm93JylcclxuXHJcblx0XHR2YXIgY21kQXJncyA9IHtcclxuXHRcdFx0J2ZvcmVDb2xvcic6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiBjdHJsLm1vZGVsLmNvbG9yXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblxyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIj5cXHJcXG5cXHJcXG5cdDxkaXYgYm4tZXZlbnQ9XFxcImNsaWNrLmNtZDogb25Db21tYW5kXFxcIj5cXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiYm9sZFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWJvbGRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpdGFsaWNcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1pdGFsaWNcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJ1bmRlcmxpbmVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS11bmRlcmxpbmVcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJzdHJpa2VUaHJvdWdoXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtc3RyaWtldGhyb3VnaFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZvcmVDb2xvclxcXCIgYm4tbWVudT1cXFwiY29sb3JJdGVtc1xcXCIgYm4tZXZlbnQ9XFxcIm1lbnVDaGFuZ2U6IG9uQ29sb3JNZW51Q2hhbmdlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtcGVuY2lsXFxcIiBibi1zdHlsZT1cXFwiY29sb3I6IGNvbG9yXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5TGVmdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFsaWduLWxlZnRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5Q2VudGVyXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tY2VudGVyXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwianVzdGlmeVJpZ2h0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tcmlnaHRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5kZW50XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtaW5kZW50XFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwib3V0ZGVudFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLW91dGRlbnRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5zZXJ0SG9yaXpvbnRhbFJ1bGVcXFwiPmhyPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDFcXFwiPmgxPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDJcXFwiPmgyPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDNcXFwiPmgzPC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plx0XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5zZXJ0VW5vcmRlcmVkTGlzdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWxpc3QtdWxcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbnNlcnRPcmRlcmVkTGlzdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWxpc3Qtb2xcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8L2Rpdj5cdFxcclxcblx0PGRpdiBjb250ZW50ZWRpdGFibGU9XFxcInRydWVcXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgZWRpdG9yXFxcIiBibi1iaW5kPVxcXCJlZGl0b3JcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0Y29sb3I6ICdibHVlJyxcclxuXHRcdFx0XHRjb2xvckl0ZW1zOiB7XHJcblx0XHRcdFx0XHRibGFjazoge25hbWU6ICdCbGFjayd9LFxyXG5cdFx0XHRcdFx0cmVkOiB7bmFtZTogJ1JlZCd9LFxyXG5cdFx0XHRcdFx0Z3JlZW46IHtuYW1lOiAnR3JlZW4nfSxcclxuXHRcdFx0XHRcdGJsdWU6IHtuYW1lOiAnQmx1ZSd9LFxyXG5cdFx0XHRcdFx0eWVsbG93OiB7bmFtZTogJ1llbGxvdyd9LFxyXG5cdFx0XHRcdFx0Y3lhbjoge25hbWU6ICdDeWFuJ30sXHJcblx0XHRcdFx0XHRtYWdlbnRhOiB7bmFtZTogJ01hZ2VudGEnfVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0b25Db21tYW5kOiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgY21kID0gJCh0aGlzKS5kYXRhKCdjbWQnKVxyXG5cdFx0XHRcdFx0dmFyIGNtZEFyZyA9ICQodGhpcykuZGF0YSgnY21kQXJnJylcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29tbWFuZCcsIGNtZCwgY21kQXJnKVxyXG5cclxuXHRcdFx0XHRcdHZhciBjbWRBcmcgPSBjbWRBcmcgfHwgY21kQXJnc1tjbWRdXHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNtZEFyZyA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdGNtZEFyZyA9IGNtZEFyZygpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvbW1hbmQnLCBjbWQsIGNtZEFyZylcclxuXHJcblx0XHRcdFx0XHRkb2N1bWVudC5leGVjQ29tbWFuZChjbWQsIGZhbHNlLCBjbWRBcmcpXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkNvbG9yTWVudUNoYW5nZTogZnVuY3Rpb24oZXYsIGNvbG9yKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvbG9yTWVudUNoYW5nZScsIGNvbG9yKVxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtjb2xvcn0pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdH0pXHJcblxyXG5cdFx0dGhpcy5odG1sID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBjdHJsLnNjb3BlLmVkaXRvci5odG1sKClcclxuXHRcdH1cclxuXHJcblxyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnRmlsZUNvbnRyb2wnLCB7XHJcblx0ZGVwczogWydGaWxlU2VydmljZSddLCBcclxuXHRwcm9wczoge1xyXG5cdFx0dG9vbGJhcjoge3ZhbDogdHJ1ZX0sXHJcblx0XHRpbWFnZU9ubHk6IHt2YWw6IGZhbHNlfSxcclxuXHRcdG1heFVwbG9hZFNpemU6IHt2YWw6IDIqMTAyNCoyMDE0fSAvLyAyIE1vXHRcdFxyXG5cdH0sXHJcblx0ZXZlbnRzOiAnZmlsZUNsaWNrJyxcclxuXHRpZmFjZTogJ2dldEZpbGVzKCknLFxyXG5cclxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGZpbGVTcnYpIHtcclxuXHJcblx0XHR2YXIgY3V0RmlsZXMgPSBbXVxyXG5cdFx0dmFyIGN1dERpciA9ICcvJ1xyXG5cdFx0dmFyIGNvcHkgPSB0cnVlXHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U2VsRmlsZXMoKSB7XHJcblx0XHRcdHZhciBzZWxEaXYgPSBlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCBhJylcclxuXHJcblx0XHRcdHZhciBzZWxGaWxlID0gW11cclxuXHRcdFx0c2VsRGl2LmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0c2VsRmlsZS5wdXNoKGN0cmwubW9kZWwucm9vdERpciArICQodGhpcykuZGF0YSgnbmFtZScpKVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRyZXR1cm4gc2VsRmlsZVxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHR2YXIgY3RybCA9IHdpbmRvdy5maWxlQ3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPlxcclxcblx0PGRpdiBjbGFzcz1cXFwidG9vbGJhclxcXCIgYm4tc2hvdz1cXFwic2hvd1Rvb2xiYXJcXFwiPlxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25Ub2dnbGVTZWxNb2RlXFxcIiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiU2VsZWN0IG1vZGVcXFwiIFxcclxcblx0XHRcdGJuLWNsYXNzPVxcXCJzZWxlY3RlZDogc2VsTW9kZVxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hlY2tcXFwiPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdDxidXR0b24gXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkNhbmNlbFNlbGVjdGlvblxcXCIgXFxyXFxuXHRcdFx0dGl0bGU9XFxcIkNhbmNlbCBzZWxlY3Rpb25cXFwiXFxyXFxuXHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFjYW5DYW5jZWxcXFwiICBcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtdGltZXNcXFwiPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdDxidXR0b24gXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkRlbGV0ZVxcXCIgXFxyXFxuXHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFmaWxlU2VsZWN0ZWRcXFwiIFxcclxcblx0XHRcdHRpdGxlPVxcXCJEZWxldGUgc2VsZWN0ZWQgZmlsZXNcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLXRyYXNoXFxcIiA+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiQ3V0XFxcIiBcXHJcXG5cdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uQ3V0XFxcIiBcXHJcXG5cdFx0XHRibi1wcm9wPVxcXCJkaXNhYmxlZDogIWZpbGVTZWxlY3RlZFxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY3V0XFxcIiA+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiQ29weVxcXCIgXFxyXFxuXHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFmaWxlU2VsZWN0ZWRcXFwiIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25Db3B5XFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1jb3B5XFxcIiA+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiUGFzdGVcXFwiIFxcclxcblx0XHRcdGJuLXByb3A9XFxcImRpc2FibGVkOiAhY2FuUGFzdGVcXFwiIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25QYXN0ZVxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtcGFzdGVcXFwiID48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlxcclxcblxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25DcmVhdGVGb2xkZXJcXFwiIFxcclxcblx0XHRcdHRpdGxlPVxcXCJOZXcgZm9sZGVyXFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1mb2xkZXItb3BlblxcXCIgPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XFxyXFxuXHRcdFxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdHRpdGxlPVxcXCJJbXBvcnQgZmlsZVxcXCIgXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkltcG9ydEZpbGVcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLXVwbG9hZFxcXCIgPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XHRcdFxcclxcblxcclxcblx0PC9kaXY+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJwYXRoUGFuZWxcXFwiPlxcclxcblx0XHRQYXRoOiZuYnNwOzxzcGFuIGJuLXRleHQ9XFxcInJvb3REaXJcXFwiPjwvc3Bhbj5cXHJcXG5cdDwvZGl2Plxcclxcblxcclxcblx0PGRpdj5cXHJcXG5cdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYmFja0J0blxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkJhY2tCdG5cXFwiIHRpdGxlPVxcXCJCYWNrXFxcIiBibi1zaG93PVxcXCJiYWNrVmlzaWJsZVxcXCI+XFxyXFxuXHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLWFycm93LWNpcmNsZS1sZWZ0XFxcIj48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlx0XHRcXHJcXG5cdDwvZGl2Plxcclxcblxcclxcblx0PGRpdiBibi1lYWNoPVxcXCJmIG9mIGZpbGVzXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIiBibi1ldmVudD1cXFwiY2xpY2suZm9sZGVyOiBvbkZvbGRlciwgY2xpY2suZmlsZTogb25GaWxlXFxcIj5cXHJcXG5cdFx0XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcInRodW1ibmFpbFxcXCI+XFxyXFxuXHRcdFx0XHQ8YSBibi1pZj1cXFwiZi5pc0ltYWdlXFxcIiBocmVmPVxcXCIjXFxcIiBibi1hdHRyPVxcXCJ0aXRsZTogZi5zaXplXFxcIiBjbGFzcz1cXFwiZmlsZVxcXCIgYm4tZGF0YT1cXFwibmFtZTogZi5uYW1lXFxcIj5cXHJcXG5cdFx0XHRcdFx0PGRpdj5cXHJcXG5cdFx0XHRcdFx0XHQ8aW1nIGJuLWF0dHI9XFxcInNyYzogZi5pbWdVcmxcXFwiPlxcclxcblx0XHRcdFx0XHQ8L2Rpdj5cXHJcXG5cdFx0XHRcdFx0XFxyXFxuXHRcdFx0XHRcdDxzcGFuIGJuLXRleHQ9XFxcImYubmFtZVxcXCI+PC9zcGFuPlxcclxcblx0XHRcdFx0PC9hPlx0XHRcdFxcclxcblx0XHRcdFx0PGEgYm4taWY9XFxcImYuaXNEaXJcXFwiIGhyZWY9XFxcIiNcXFwiIGNsYXNzPVxcXCJmb2xkZXJcXFwiIGJuLWRhdGE9XFxcIm5hbWU6IGYubmFtZVxcXCI+XFxyXFxuXHRcdFx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTR4IGZhLWZvbGRlci1vcGVuIHczLXRleHQtYmx1ZS1ncmV5XFxcIj48L2k+XFxyXFxuXHRcdFx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XHRcXHJcXG5cdFx0XHRcdFx0PHNwYW4gYm4tdGV4dD1cXFwiZi5uYW1lXFxcIj48L3NwYW4+XFxyXFxuXHRcdFx0XHQ8L2E+XFxyXFxuXHRcdFx0XHQ8YSBibi1pZj1cXFwiZi5pc0ZpbGVcXFwiIGhyZWY9XFxcIiNcXFwiIGJuLWRhdGE9XFxcIm5hbWU6IGYubmFtZVxcXCIgY2xhc3M9XFxcImZpbGVcXFwiIGJuLWF0dHI9XFxcInRpdGxlOiBmLnNpemVcXFwiPlxcclxcblx0XHRcdFx0XHQ8ZGl2Plxcclxcblx0XHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS00eCBmYS1maWxlIHczLXRleHQtYmx1ZS1ncmV5XFxcIj48L2k+XFxyXFxuXHRcdFx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XHRcXHJcXG5cdFx0XHRcdFx0PHNwYW4gYm4tdGV4dD1cXFwiZi5uYW1lXFxcIj48L3NwYW4+XFxyXFxuXHRcdFx0XHQ8L2E+XHRcdFx0XFxyXFxuXHRcdFx0XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRmaWxlczogW10sXHJcblx0XHRcdFx0Y3V0RmlsZXM6IFtdLFxyXG5cdFx0XHRcdHJvb3REaXI6ICcvJyxcclxuXHRcdFx0XHRjdXREaXI6ICcvJyxcclxuXHRcdFx0XHRiYWNrVmlzaWJsZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5yb290RGlyICE9ICcvJ1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0c2VsTW9kZTogZmFsc2UsXHJcblx0XHRcdFx0ZmlsZVNlbGVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHRzaG93VG9vbGJhcjogb3B0aW9ucy50b29sYmFyLFxyXG5cdFx0XHRcdGNhbkNhbmNlbDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jdXRGaWxlcy5sZW5ndGggIT0gMCB8fCB0aGlzLmZpbGVTZWxlY3RlZFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0Y2FuUGFzdGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuY3V0RmlsZXMubGVuZ3RoICE9IDAgJiYgdGhpcy5yb290RGlyICE9IHRoaXMuY3V0RGlyXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRvbkZvbGRlcjogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbkZvbGRlcicpXHJcblx0XHRcdFx0XHRpZiAoY3RybC5tb2RlbC5zZWxNb2RlKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCd0aGlzJywgJCh0aGlzKS5jbG9zZXN0KCcudGh1bWJuYWlsJykpXHJcblx0XHRcdFx0XHRcdCQodGhpcykuY2xvc2VzdCgnLnRodW1ibmFpbCcpLnRvZ2dsZUNsYXNzKCdzZWxlY3RlZCcpXHJcblxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ2ZpbGVTZWxlY3RlZCcsIGdldFNlbEZpbGVzKCkubGVuZ3RoICE9IDApXHJcblx0XHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdHZhciBkaXJOYW1lID0gJCh0aGlzKS5kYXRhKCduYW1lJylcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uRm9sZGVyJywgZGlyTmFtZSlcclxuXHRcdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcclxuXHRcdFx0XHRcdGxvYWREYXRhKGN0cmwubW9kZWwucm9vdERpciArIGRpck5hbWUgKyAnLycpXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkJhY2tCdG46IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dmFyIHNwbGl0ID0gY3RybC5tb2RlbC5yb290RGlyLnNwbGl0KCcvJylcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQmFja0J0bicsIHNwbGl0KVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRzcGxpdC5wb3AoKVxyXG5cdFx0XHRcdFx0c3BsaXQucG9wKClcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygncm9vdERpcicsIHJvb3REaXIpXHJcblx0XHRcdFx0XHRsb2FkRGF0YShzcGxpdC5qb2luKCcvJykgKyAnLycpXHJcblxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25GaWxlOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0dmFyIG5hbWUgPSAkKHRoaXMpLmRhdGEoJ25hbWUnKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25QaWN0dXJlJywgbmFtZSlcclxuXHRcdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcclxuXHRcdFx0XHRcdC8vdmFyIGZpbGVQYXRoID0gZmlsZVNydi5maWxlVXJsKHJvb3REaXIgKyBuYW1lKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZmlsZVBhdGgnLCBmaWxlUGF0aClcclxuXHRcdFx0XHRcdGlmIChjdHJsLm1vZGVsLnNlbE1vZGUpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5jbG9zZXN0KCcudGh1bWJuYWlsJykudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJylcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKCdmaWxlU2VsZWN0ZWQnLCBnZXRTZWxGaWxlcygpLmxlbmd0aCAhPSAwKVxyXG5cdFx0XHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsdC50cmlnZ2VyKCdmaWxlQ2xpY2snLCB7bmFtZSwgcm9vdERpcjogY3RybC5tb2RlbC5yb290RGlyfSlcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uVG9nZ2xlU2VsTW9kZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ3NlbE1vZGUnLCAhY3RybC5tb2RlbC5zZWxNb2RlKVxyXG5cdFx0XHRcdFx0aWYgKCFjdHJsLm1vZGVsLnNlbE1vZGUpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LmZpbmQoJy50aHVtYm5haWwuc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ2ZpbGVTZWxlY3RlZCcsIGZhbHNlKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25EZWxldGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0JCQuc2hvd0NvbmZpcm0oXCJBcmUgeW91IHN1cmUgP1wiLCBcIkRlbGV0ZSBmaWxlc1wiLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dmFyIHNlbEZpbGUgPSBnZXRTZWxGaWxlcygpXHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uRGVsZXRlJywgc2VsRmlsZSlcclxuXHRcdFx0XHRcdFx0ZmlsZVNydi5yZW1vdmVGaWxlcyhzZWxGaWxlKVxyXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdGxvYWREYXRhKClcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVxyXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25DcmVhdGVGb2xkZXI6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dmFyIHJvb3REaXIgPSBjdHJsLm1vZGVsLnJvb3REaXJcclxuXHRcdFx0XHRcdCQkLnNob3dQcm9tcHQoJ0ZvbGRlciBuYW1lOicsICdOZXcgRm9sZGVyJywgZnVuY3Rpb24oZm9sZGVyTmFtZSkge1xyXG5cdFx0XHRcdFx0XHRmaWxlU3J2Lm1rZGlyKHJvb3REaXIgKyBmb2xkZXJOYW1lKVxyXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdGxvYWREYXRhKClcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVxyXG5cdFx0XHRcdFx0XHR9KVx0XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25DdXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0XHRcdGNvcHkgPSBmYWxzZVxyXG5cclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ3V0JywgY3V0RmlsZXMpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0XHRcdHNlbE1vZGU6IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRjdXRGaWxlczogZ2V0U2VsRmlsZXMoKSxcclxuXHRcdFx0XHRcdFx0Y3V0RGlyOiBjdHJsLm1vZGVsLnJvb3REaXJcclxuXHRcdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdFx0ZWx0LmZpbmQoJy50aHVtYm5haWwuc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKS5hZGRDbGFzcygnY3V0ZWQnKVxyXG5cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uQ29weTogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRcdFx0Y29weSA9IHRydWVcclxuXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvcHknLCBjdXRGaWxlcylcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdFx0c2VsTW9kZTogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGN1dEZpbGVzOiBnZXRTZWxGaWxlcygpLFxyXG5cdFx0XHRcdFx0XHRjdXREaXI6IGN0cmwubW9kZWwucm9vdERpclxyXG5cdFx0XHRcdFx0fSlcclxuXHJcblx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpLmFkZENsYXNzKCdjdXRlZCcpXHJcblx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0b25QYXN0ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblBhc3RlJylcclxuXHRcdFx0XHRcdHZhciB7cm9vdERpciwgY3V0RmlsZXN9ID0gY3RybC5tb2RlbFxyXG5cdFx0XHRcdFx0dmFyIHByb21pc2UgPSAoY29weSkgPyBmaWxlU3J2LmNvcHlGaWxlcyhjdXRGaWxlcywgcm9vdERpcikgOiBmaWxlU3J2Lm1vdmVGaWxlcyhjdXRGaWxlcywgcm9vdERpcilcclxuXHRcdFx0XHRcdGNvcHkgPSBmYWxzZVxyXG5cdFx0XHRcdFx0cHJvbWlzZVxyXG5cdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7Y3V0RmlsZXM6IFtdfSlcclxuXHRcdFx0XHRcdFx0bG9hZERhdGEoKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtjdXRGaWxlczogW119KVxyXG5cdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHJcblx0XHRcdFx0XHR9KVx0XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkNhbmNlbFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCBjdXRlZCcpXHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe1xyXG5cdFx0XHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRjdXRGaWxlczogW11cclxuXHRcdFx0XHRcdH0pXHRcdFx0XHRcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uSW1wb3J0RmlsZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkltcG9ydEZpbGUnKVxyXG5cdFx0XHRcdFx0dmFyIHJvb3REaXIgPSBjdHJsLm1vZGVsLnJvb3REaXJcclxuXHJcblx0XHRcdFx0XHQkJC5vcGVuRmlsZURpYWxvZyhmdW5jdGlvbihmaWxlKSB7XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZpbGVTaXplJywgZmlsZS5zaXplIC8gMTAyNClcclxuXHRcdFx0XHRcdFx0aWYgKGZpbGUuc2l6ZSA+IG9wdGlvbnMubWF4VXBsb2FkU2l6ZSkge1xyXG5cdFx0XHRcdFx0XHRcdCQkLnNob3dBbGVydCgnRmlsZSB0b28gYmlnJywgJ0Vycm9yJylcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHQkJC5yZWFkRmlsZUFzRGF0YVVSTChmaWxlLCBmdW5jdGlvbihkYXRhVVJMKSB7XHJcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZGF0YVVSTCcsIGRhdGFVUkwpXHJcblx0XHRcdFx0XHRcdFx0ZmlsZVNydi51cGxvYWRGaWxlKGRhdGFVUkwsIGZpbGUubmFtZSwgcm9vdERpcikudGhlbihmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGxvYWREYXRhKClcclxuXHRcdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IFxyXG5cdFx0fSlcclxuXHJcblx0XHRmdW5jdGlvbiBsb2FkRGF0YShyb290RGlyKSB7XHJcblx0XHRcdGlmIChyb290RGlyID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHJvb3REaXIgPSBjdHJsLm1vZGVsLnJvb3REaXJcclxuXHRcdFx0fVxyXG5cdFx0XHRmaWxlU3J2Lmxpc3Qocm9vdERpciwgb3B0aW9ucy5pbWFnZU9ubHkpLnRoZW4oZnVuY3Rpb24oZmlsZXMpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmaWxlcycsIGZpbGVzKVxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0XHRyb290RGlyLFxyXG5cdFx0XHRcdFx0ZmlsZVNlbGVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHRcdGZpbGVzOiBmaWxlc1xyXG5cdFx0LypcdFx0XHRcdC5maWx0ZXIoZnVuY3Rpb24oZmlsZSkge1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiAhZmlsZS5pc0RpclxyXG5cdFx0XHRcdFx0XHR9KSovXHJcblx0XHRcdFx0XHRcdC5tYXAoZnVuY3Rpb24oZmlsZSwgaWR4KSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIG5hbWUgPSBmaWxlLnRpdGxlXHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzRGlyID0gZmlsZS5mb2xkZXJcclxuXHRcdFx0XHRcdFx0XHR2YXIgaXNJbWFnZSA9ICQkLmlzSW1hZ2UobmFtZSlcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRcdFx0bmFtZSxcclxuXHRcdFx0XHRcdFx0XHRcdHNpemU6ICdTaXplIDogJyArIE1hdGguZmxvb3IoZmlsZS5zaXplLzEwMjQpICsgJyBLbycsXHJcblx0XHRcdFx0XHRcdFx0XHRpbWdVcmw6ICBpc0RpciA/ICcnIDogZmlsZVNydi5maWxlVXJsKHJvb3REaXIgKyBuYW1lKSxcclxuXHRcdFx0XHRcdFx0XHRcdGlzRGlyLFxyXG5cdFx0XHRcdFx0XHRcdFx0aXNJbWFnZSwgXHJcblx0XHRcdFx0XHRcdFx0XHRpc0ZpbGU6ICFpc0RpciAmJiAhaXNJbWFnZVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9KVx0XHRcclxuXHRcdH1cclxuXHJcblx0XHRsb2FkRGF0YSgpXHJcblxyXG5cdFx0dGhpcy5nZXRGaWxlcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gY3RybC5tb2RlbC5maWxlc1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5mdW5jdGlvbiBnZXROb2RlUGF0aChub2RlKSB7XHJcblxyXG5cdHZhciBwYXRoID0gbm9kZS5nZXRQYXJlbnRMaXN0KGZhbHNlLCB0cnVlKS5tYXAoKG5vZGUpID0+IG5vZGUua2V5ID09ICdyb290JyA/ICcvJyA6IG5vZGUudGl0bGUpXHJcblx0cmV0dXJuIHBhdGguam9pbignLycpXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdGaWxlVHJlZUNvbnRyb2wnLCB7XHJcblx0ZGVwczogWydGaWxlU2VydmljZSddLFxyXG5cdGlmYWNlOiAncmVmcmVzaCgpO2dldFZhbHVlKCknLFxyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgZmlsZVNydikge1xyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdj5cXHJcXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiVHJlZUNvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcInRyZWVPcHRpb25zXFxcIiBibi1pZmFjZT1cXFwidHJlZUN0cmxcXFwiIGJuLWV2ZW50PVxcXCJjb250ZXh0TWVudUFjdGlvbjogb25UcmVlQWN0aW9uXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cIixcdFx0XHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHR0cmVlT3B0aW9uczoge1xyXG5cdFx0XHRcdFx0c291cmNlOiBbe3RpdGxlOiAnSG9tZScsIGZvbGRlcjogdHJ1ZSwgbGF6eTogdHJ1ZSwga2V5OiAncm9vdCd9XSxcclxuXHJcblx0XHRcdFx0XHRsYXp5TG9hZDogZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2xhenlMb2FkJywgZGF0YS5ub2RlLmtleSlcclxuXHRcdFx0XHRcdFx0dmFyIHBhdGggPSBnZXROb2RlUGF0aChkYXRhLm5vZGUpXHJcblx0XHRcdFx0XHRcdGRhdGEucmVzdWx0ID0gZmlsZVNydi5saXN0KHBhdGgsIGZhbHNlLCB0cnVlKVxyXG5cclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRjb250ZXh0TWVudToge1xyXG5cdFx0XHRcdFx0XHRtZW51OiB7XHJcblx0XHRcdFx0XHRcdFx0bmV3Rm9sZGVyOiB7J25hbWUnOiAnTmV3IEZvbGRlcid9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdG9uVHJlZUFjdGlvbjogZnVuY3Rpb24obm9kZSwgYWN0aW9uKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblRyZWVBY3Rpb24nLCBub2RlLnRpdGxlLCBhY3Rpb24pXHJcblx0XHRcdFx0XHQkJC5zaG93UHJvbXB0KCdGb2xkZXIgbmFtZScsICdOZXcgRm9sZGVyJywgZnVuY3Rpb24oZm9sZGVyTmFtZSkge1xyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0dmFyIHBhdGggPSBnZXROb2RlUGF0aChub2RlKVxyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmb2xkZXJOYW1lJywgZm9sZGVyTmFtZSwgJ3BhdGgnLCBwYXRoKVxyXG5cdFx0XHRcdFx0XHRmaWxlU3J2Lm1rZGlyKHBhdGggKyAnLycgKyBmb2xkZXJOYW1lKVxyXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdG5vZGUubG9hZCh0cnVlKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHJcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHRcdFx0XHJcblx0XHR9KVxyXG5cclxuXHRcdHRoaXMuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIGdldE5vZGVQYXRoKGN0cmwuc2NvcGUudHJlZUN0cmwuZ2V0QWN0aXZlTm9kZSgpKVxyXG5cdFx0fSxcclxuXHJcblx0XHR0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0Y29uc3Qgcm9vdCA9IGN0cmwuc2NvcGUudHJlZUN0cmwuZ2V0Um9vdE5vZGUoKS5nZXRGaXJzdENoaWxkKClcclxuXHRcdFx0aWYgKHJvb3QpIHtcclxuXHRcdFx0XHRyb290LmxvYWQodHJ1ZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0XHJcblx0fVxyXG5cclxufSk7XHJcblxyXG5cclxufSkoKTtcclxuXHJcblxyXG5cclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRmdW5jdGlvbiBnZXRUZW1wbGF0ZShoZWFkZXJzKSB7XHJcblx0XHRyZXR1cm4gYFxyXG5cdFx0XHQ8ZGl2IGNsYXNzPVwic2Nyb2xsUGFuZWxcIj5cclxuXHQgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ3My10YWJsZS1hbGwgdzMtc21hbGxcIj5cclxuXHQgICAgICAgICAgICAgICAgPHRoZWFkPlxyXG5cdCAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzPVwidzMtZ3JlZW5cIj5cclxuXHQgICAgICAgICAgICAgICAgICAgIFx0JHtoZWFkZXJzfVxyXG5cdCAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuXHQgICAgICAgICAgICAgICAgPC90aGVhZD5cclxuXHQgICAgICAgICAgICAgICAgPHRib2R5PjwvdGJvZHk+XHJcblx0ICAgICAgICAgICAgPC90YWJsZT5cclxuICAgICAgICAgICAgPC9kaXY+XHJcblx0XHRgXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRJdGVtVGVtcGxhdGUocm93cykge1xyXG5cdFx0cmV0dXJuIGBcclxuICAgICAgICAgICAgPHRyIGNsYXNzPVwiaXRlbVwiIGJuLWF0dHI9XCJkYXRhLWlkOiBfaWRcIj5cclxuICAgICAgICAgICAgXHQke3Jvd3N9XHJcbiAgICAgICAgICAgIDwvdHI+XHRcclxuXHRcdGBcclxuXHR9XHJcblxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZpbHRlcmVkVGFibGVDb250cm9sJywge1xyXG5cclxuXHRcdGlmYWNlOiAnYWRkSXRlbShpZCwgZGF0YSk7cmVtb3ZlSXRlbShpZCk7cmVtb3ZlQWxsSXRlbXMoKTtzZXRGaWx0ZXJzKGZpbHRlcnMpO2dldERhdGFzKCk7Z2V0RGlzcGxheWVkRGF0YXMoKTtvbihldmVudCwgY2FsbGJhY2spJyxcclxuXHRcdGV2ZW50czogJ2l0ZW1BY3Rpb24nLFxyXG5cclxuXHRcdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coJ29wdGlvbnMnLCBvcHRpb25zKVxyXG5cclxuXHRcdFx0dmFyIGNvbHVtbnMgPSAgJCQub2JqMkFycmF5KG9wdGlvbnMuY29sdW1ucylcclxuXHRcdFx0dmFyIGFjdGlvbnMgPSAkJC5vYmoyQXJyYXkob3B0aW9ucy5hY3Rpb25zKVxyXG5cdFx0XHR2YXIgaGVhZGVycyA9IGNvbHVtbnMubWFwKChjb2x1bW4pID0+IGA8dGg+JHtjb2x1bW4udmFsdWV9PC90aD5gKVx0XHRcclxuXHRcdFx0dmFyIHJvd3MgPSBjb2x1bW5zLm1hcCgoY29sdW1uKSA9PiBgPHRkIGJuLWh0bWw9XCIke2NvbHVtbi5rZXl9XCI+PC90ZD5gKVxyXG5cdFx0XHRpZiAoYWN0aW9ucy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdFx0aGVhZGVycy5wdXNoKGA8dGg+QWN0aW9uPC90aD5gKVxyXG5cclxuXHRcdFx0XHR2YXIgYnV0dG9ucyA9IGFjdGlvbnMubWFwKChhY3Rpb24pID0+IGA8YnV0dG9uIGRhdGEtYWN0aW9uPVwiJHthY3Rpb24ua2V5fVwiIGNsYXNzPVwidzMtYnV0dG9uXCI+PGkgY2xhc3M9XCIke2FjdGlvbi52YWx1ZX1cIj48L2k+PC9idXR0b24+YClcclxuXHRcdFx0XHRyb3dzLnB1c2goYDx0ZD4ke2J1dHRvbnN9PC90ZD5gKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdyb3dzJywgcm93cylcclxuXHRcdFx0dmFyIGl0ZW1UZW1wbGF0ZSA9IGdldEl0ZW1UZW1wbGF0ZShyb3dzLmpvaW4oJycpKVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdpdGVtVGVtcGxhdGUnLCBpdGVtVGVtcGxhdGUpXHJcblxyXG5cdFx0XHRlbHQuYXBwZW5kKGdldFRlbXBsYXRlKGhlYWRlcnMuam9pbignJykpKVxyXG5cdFx0XHRlbHQuYWRkQ2xhc3MoJ2JuLWZsZXgtY29sJylcclxuXHJcblx0XHRcdGxldCBkYXRhcyA9IHt9XHJcblx0XHRcdGxldCBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblx0XHRcdGxldCBfZmlsdGVycyA9IHt9XHJcblx0XHRcdGxldCBkaXNwbGF5ZWRJdGVtcyA9IHt9XHJcblxyXG5cdFx0XHRjb25zdCB0Ym9keSA9IGVsdC5maW5kKCd0Ym9keScpXHJcblx0XHRcdHRib2R5Lm9uKCdjbGljaycsICdbZGF0YS1hY3Rpb25dJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIGlkID0gJCh0aGlzKS5jbG9zZXN0KCcuaXRlbScpLmRhdGEoJ2lkJylcclxuXHRcdFx0XHR2YXIgYWN0aW9uID0gJCh0aGlzKS5kYXRhKCdhY3Rpb24nKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdjbGljaycsIGlkLCAnYWN0aW9uJywgYWN0aW9uKVxyXG5cdFx0XHRcdGV2ZW50cy5lbWl0KCdpdGVtQWN0aW9uJywgYWN0aW9uLCBpZClcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdHRoaXMuYWRkSXRlbSA9IGZ1bmN0aW9uKGlkLCBkYXRhKSB7XHJcblxyXG5cdFx0XHRcdHZhciBpdGVtRGF0YSA9ICQuZXh0ZW5kKHsnX2lkJzogaWR9LCBkYXRhKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2FkZEl0ZW0nLCBpdGVtRGF0YSlcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoZGF0YXNbaWRdICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0dmFyIGl0ZW0gPSBkaXNwbGF5ZWRJdGVtc1tpZF1cclxuXHRcdFx0XHRcdGlmIChpdGVtICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0XHRpdGVtLmVsdC51cGRhdGVUZW1wbGF0ZShpdGVtLmN0eCwgaXRlbURhdGEpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2UgaWYgKGlzSW5GaWx0ZXIoZGF0YSkpe1xyXG5cdFx0XHRcdFx0dmFyIGVsdCA9ICQoaXRlbVRlbXBsYXRlKVxyXG5cdFx0XHRcdFx0dmFyIGN0eCA9IGVsdC5wcm9jZXNzVGVtcGxhdGUoaXRlbURhdGEpXHJcblx0XHRcdFx0XHRkaXNwbGF5ZWRJdGVtc1tpZF0gPSB7ZWx0LCBjdHh9XHJcblx0XHRcdFx0XHR0Ym9keS5hcHBlbmQoZWx0KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkYXRhc1tpZF0gPSBkYXRhXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uKGlkKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygncmVtb3ZlSXRlbScsIGlkKVxyXG5cdFx0XHRcdGlmIChkYXRhc1tpZF0gIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRkZWxldGUgZGF0YXNbaWRdXHJcblx0XHRcdFx0XHR2YXIgaXRlbSA9IGRpc3BsYXllZEl0ZW1zW2lkXVxyXG5cdFx0XHRcdFx0aWYgKGl0ZW0gIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRcdGl0ZW0ucmVtb3ZlKClcclxuXHRcdFx0XHRcdFx0ZGVsZXRlIGRpc3BsYXllZEl0ZW1zW2lkXVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5yZW1vdmVBbGxJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3JlbW92ZUFsbEl0ZW1zJylcclxuXHRcdFx0XHRkYXRhcyA9IHt9XHJcblx0XHRcdFx0ZGlzcGxheWVkSXRlbXMgPSB7fVxyXG5cdFx0XHRcdHRib2R5LmVtcHR5KClcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGlzSW5GaWx0ZXIoZGF0YSkge1xyXG5cdFx0XHRcdHZhciByZXQgPSB0cnVlXHJcblx0XHRcdFx0Zm9yKHZhciBmIGluIF9maWx0ZXJzKSB7XHJcblx0XHRcdFx0XHR2YXIgdmFsdWUgPSBkYXRhW2ZdXHJcblx0XHRcdFx0XHR2YXIgZmlsdGVyVmFsdWUgPSBfZmlsdGVyc1tmXVxyXG5cdFx0XHRcdFx0cmV0ICY9IChmaWx0ZXJWYWx1ZSA9PSAnJyB8fCB2YWx1ZS5zdGFydHNXaXRoKGZpbHRlclZhbHVlKSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHJldFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnNldEZpbHRlcnMgPSBmdW5jdGlvbihmaWx0ZXJzKSB7XHJcblx0XHRcdFx0X2ZpbHRlcnMgPSBmaWx0ZXJzXHJcblx0XHRcdFx0ZGlzcFRhYmxlKClcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGRpc3BUYWJsZSgpIHtcclxuXHRcdFx0XHRkaXNwbGF5ZWRJdGVtcyA9IHt9XHJcblx0XHRcdFx0bGV0IGl0ZW1zID0gW11cclxuXHRcdFx0XHRmb3IobGV0IGlkIGluIGRhdGFzKSB7XHJcblx0XHRcdFx0XHR2YXIgZGF0YSA9IGRhdGFzW2lkXVxyXG5cdFx0XHRcdFx0aWYgKGlzSW5GaWx0ZXIoZGF0YSkpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGl0ZW1EYXRhID0gJC5leHRlbmQoeydfaWQnOiBpZH0sIGRhdGEpXHJcblx0XHRcdFx0XHRcdHZhciBlbHQgPSAkKGl0ZW1UZW1wbGF0ZSlcclxuXHRcdFx0XHRcdFx0dmFyIGN0eCA9IGVsdC5wcm9jZXNzVGVtcGxhdGUoaXRlbURhdGEpXHRcdFx0XHJcblx0XHRcdFx0XHRcdGl0ZW1zLnB1c2goZWx0KVxyXG5cdFx0XHRcdFx0XHRkaXNwbGF5ZWRJdGVtc1tpZF0gPSB7ZWx0LCBjdHh9XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR0Ym9keS5lbXB0eSgpLmFwcGVuZChpdGVtcylcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5nZXREYXRhcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiBkYXRhc1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmdldERpc3BsYXllZERhdGFzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIHJldCA9IHt9XHJcblx0XHRcdFx0Zm9yKGxldCBpIGluIGRpc3BsYXllZEl0ZW1zKSB7XHJcblx0XHRcdFx0XHRyZXRbaV0gPSBkYXRhc1tpXVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcmV0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXHJcblxyXG5cclxuXHRcdH1cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdIZWFkZXJDb250cm9sJywge1xyXG5cdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLFxyXG5cdHByb3BzOiB7XHJcblx0XHR0aXRsZToge3ZhbDogJ0hlbGxvIFdvcmxkJ30sXHJcblx0XHR1c2VyTmFtZToge3ZhbDogJ3Vua25vd24nfVxyXG5cdH0sXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2ID5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcImJyYW5kXFxcIj48aDEgY2xhc3M9XFxcImJuLXhzLWhpZGVcXFwiIGJuLXRleHQ9XFxcInRpdGxlXFxcIj48L2gxPiA8L2Rpdj5cXHJcXG5cdDxkaXY+XFxyXFxuXHQgICAgPGkgYm4tYXR0cj1cXFwidGl0bGU6IHRpdGxlU3RhdGVcXFwiIGNsYXNzPVxcXCJmYSBmYS1sZyBjb25uZWN0aW9uU3RhdGVcXFwiIGJuLWNsYXNzPVxcXCJmYS1leWU6IGNvbm5lY3RlZCwgZmEtZXllLXNsYXNoOiAhY29ubmVjdGVkXFxcIj48L2k+XFxyXFxuXHQgICAgPGkgY2xhc3M9XFxcImZhIGZhLXVzZXIgZmEtbGdcXFwiPjwvaT5cXHJcXG5cdCAgICA8c3BhbiBibi10ZXh0PVxcXCJ1c2VyTmFtZVxcXCIgY2xhc3M9XFxcInVzZXJOYW1lXFxcIj48L3NwYW4+XFxyXFxuXHQgICAgPGEgaHJlZj1cXFwiL1xcXCIgdGl0bGU9XFxcImhvbWVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1ob21lIGZhLWxnXFxcIj48L2k+PC9hPiBcXHJcXG5cdDwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0Y29ubmVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHR0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBkaXNjb25uZWN0ZWRcIixcclxuXHRcdFx0XHR0aXRsZTogb3B0aW9ucy50aXRsZSxcclxuXHRcdFx0XHR1c2VyTmFtZTogb3B0aW9ucy51c2VyTmFtZVx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cclxuXHRcdGNsaWVudC5ldmVudHMub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tIZWFkZXJDb250cm9sXSBjbGllbnQgY29ubmVjdGVkJylcclxuXHRcdFx0Y3RybC5zZXREYXRhKHtjb25uZWN0ZWQ6IHRydWUsIHRpdGxlU3RhdGU6IFwiV2ViU29ja2V0IGNvbm5lY3RlZFwifSlcclxuXHJcblx0XHR9KVxyXG5cclxuXHRcdGNsaWVudC5ldmVudHMub24oJ2Rpc2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tIZWFkZXJDb250cm9sXSBjbGllbnQgZGlzY29ubmVjdGVkJylcclxuXHRcdFx0Y3RybC5zZXREYXRhKHtjb25uZWN0ZWQ6IGZhbHNlLCB0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBkaXNjb25uZWN0ZWRcIn0pXHJcblxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0lucHV0R3JvdXBDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdHZhciBpZCA9IGVsdC5jaGlsZHJlbignaW5wdXQnKS51bmlxdWVJZCgpLmF0dHIoJ2lkJylcclxuXHRcdC8vY29uc29sZS5sb2coJ1tJbnB1dEdyb3VwQ29udHJvbF0gaWQnLCBpZClcclxuXHRcdGVsdC5jaGlsZHJlbignbGFiZWwnKS5hdHRyKCdmb3InLCBpZClcclxuXHR9XHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdOYXZiYXJDb250cm9sJywge1xyXG5cclxuXHRcdHByb3BzOiB7XHJcblx0XHRcdGFjdGl2ZUNvbG9yOiB7dmFsOiAndzMtZ3JlZW4nfVxyXG5cdFx0fSxcclxuXHJcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRcdHZhciBhY3RpdmVDb2xvciA9IG9wdGlvbnMuYWN0aXZlQ29sb3JcclxuXHJcblxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbTmF2YmFyQ29udHJvbF0gb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdFx0XHRlbHQuYWRkQ2xhc3MoJ3czLWJhcicpXHJcblx0XHRcdGVsdC5jaGlsZHJlbignYScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5hZGRDbGFzcygndzMtYmFyLWl0ZW0gdzMtYnV0dG9uJylcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdCQod2luZG93KS5vbigncm91dGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZ0LCBuZXdSb3V0ZSkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tOYXZiYXJDb250cm9sXSByb3V0ZUNoYW5nZScsIG5ld1JvdXRlKVxyXG5cclxuXHRcdFx0XHRlbHQuY2hpbGRyZW4oYGEuJHthY3RpdmVDb2xvcn1gKS5yZW1vdmVDbGFzcyhhY3RpdmVDb2xvcilcdFxyXG5cdFx0XHRcdGVsdC5jaGlsZHJlbihgYVtocmVmPVwiIyR7bmV3Um91dGV9XCJdYCkuYWRkQ2xhc3MoYWN0aXZlQ29sb3IpXHJcblxyXG5cdFx0XHR9KVx0XHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG5cclxufSkoKTtcclxuXHJcblxyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnUGljdHVyZUNhcm91c2VsQ29udHJvbCcsIHtcclxuXHJcblx0cHJvcHM6IHtcclxuXHRcdHdpZHRoOiB7dmFsOiAzMDB9LFxyXG5cdFx0aGVpZ2h0OiB7dmFsOiAyMDB9LFxyXG5cdFx0YW5pbWF0ZURlbGF5OiB7dmFsOiAxMDAwfSxcclxuXHRcdGluZGV4OiB7dmFsOiAwLCBzZXQ6ICdzZXRJbmRleCd9LFxyXG5cdFx0aW1hZ2VzOiB7dmFsOiBbXSwgc2V0OiAnc2V0SW1hZ2VzJ30sXHJcblx0XHRjb2xvcjoge3ZhbDogJ3llbGxvdyd9XHJcblx0fSxcclxuXHJcblx0aWZhY2U6ICdzZXRJbWFnZXMoaW1hZ2VzKTtzZXRJbmRleChpZHgpJyxcclxuXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0Y29uc29sZS5sb2coYFtQaWN0dXJlQ2Fyb3VzZWxDb250cm9sXSBvcHRpb25zYCwgb3B0aW9ucylcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGJuLWNvbnRyb2w9XFxcIkNhcm91c2VsQ29udHJvbFxcXCIgYm4tb3B0aW9ucz1cXFwiY2Fyb3VzZWxDdHJsT3B0aW9uc1xcXCIgYm4tZWFjaD1cXFwiaSBvZiBpbWFnZXNcXFwiIGJuLWlmYWNlPVxcXCJjYXJvdXNlbEN0cmxcXFwiIGJuLWRhdGE9XFxcImluZGV4OiBpbmRleFxcXCI+XFxyXFxuXHQ8ZGl2IHN0eWxlPVxcXCJ0ZXh0LWFsaWduOiBjZW50ZXI7XFxcIiBibi1zdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjogYmFja0NvbG9yXFxcIj5cXHJcXG5cdFx0PGltZyBibi1hdHRyPVxcXCJzcmM6IGlcXFwiIHN0eWxlPVxcXCJoZWlnaHQ6IDEwMCVcXFwiPlxcclxcblx0PC9kaXY+XFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRjYXJvdXNlbEN0cmxPcHRpb25zOiBvcHRpb25zLFxyXG5cdFx0XHRcdGltYWdlczogb3B0aW9ucy5pbWFnZXMsXHJcblx0XHRcdFx0YmFja0NvbG9yOiBvcHRpb25zLmNvbG9yLFxyXG5cdFx0XHRcdGluZGV4OiBvcHRpb25zLmluZGV4XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cdFx0dGhpcy5zZXRJbWFnZXMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbUGljdHVyZUNhcm91c2VsQ29udHJvbF0gc2V0SW1hZ2VzJywgdmFsdWUpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSgnaW1hZ2VzJywgdmFsdWUpXHJcblx0XHRcdGN0cmwuc2NvcGUuY2Fyb3VzZWxDdHJsLnJlZnJlc2goKVx0XHRcdFxyXG5cdFx0fSxcclxuXHRcdHRoaXMuc2V0SW5kZXggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHJsLnNldERhdGEoJ2luZGV4JywgdmFsdWUpXHJcblx0XHR9XHJcblxyXG5cdH1cclxufSk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2woJ1JhZGlvR3JvdXBDb250cm9sJywgZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0Lm9uKCdjbGljaycsICdpbnB1dFt0eXBlPXJhZGlvXScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdyYWRpb2dyb3VwIGNsaWNrJylcclxuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dOmNoZWNrZWQnKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpXHJcblx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHRydWUpXHJcblx0XHRcdGVsdC50cmlnZ2VyKCdpbnB1dCcpXHJcblx0XHR9KVxyXG5cdFx0XHJcblxyXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dOmNoZWNrZWQnKS52YWwoKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1yYWRpb10nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHZhbHVlID09PSAkKHRoaXMpLnZhbCgpKVxyXG5cdFx0XHR9KVx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHJcblx0fSlcclxuXHJcblxyXG59KSgpO1xyXG5cclxuXHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0ZnVuY3Rpb24gbWF0Y2hSb3V0ZShyb3V0ZSwgcGF0dGVybikge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnbWF0Y2hSb3V0ZScsIHJvdXRlLCBwYXR0ZXJuKVxyXG5cdFx0dmFyIHJvdXRlU3BsaXQgPSByb3V0ZS5zcGxpdCgnLycpXHJcblx0XHR2YXIgcGF0dGVyblNwbGl0ID0gcGF0dGVybi5zcGxpdCgnLycpXHJcblx0XHQvL2NvbnNvbGUubG9nKHJvdXRlU3BsaXQsIHBhdHRlcm5TcGxpdClcclxuXHRcdHZhciByZXQgPSB7fVxyXG5cclxuXHRcdGlmIChyb3V0ZVNwbGl0Lmxlbmd0aCAhPSBwYXR0ZXJuU3BsaXQubGVuZ3RoKVxyXG5cdFx0XHRyZXR1cm4gbnVsbFxyXG5cclxuXHRcdGZvcih2YXIgaWR4ID0gMDsgaWR4IDwgcGF0dGVyblNwbGl0Lmxlbmd0aDsgaWR4KyspIHtcclxuXHRcdFx0dmFyIHBhdGggPSBwYXR0ZXJuU3BsaXRbaWR4XVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdwYXRoJywgcGF0aClcclxuXHRcdFx0aWYgKHBhdGguc3Vic3RyKDAsIDEpID09PSAnOicpIHtcclxuXHRcdFx0XHRpZiAocm91dGVTcGxpdFtpZHhdLmxlbmd0aCA9PT0gMClcclxuXHRcdFx0XHRcdHJldHVybiBudWxsXHJcblx0XHRcdFx0cmV0W3BhdGguc3Vic3RyKDEpXSA9IHJvdXRlU3BsaXRbaWR4XVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHBhdGggIT09IHJvdXRlU3BsaXRbaWR4XSkge1xyXG5cdFx0XHRcdHJldHVybiBudWxsXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJldFxyXG5cdH1cclxuXHJcblxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ1JvdXRlckNvbnRyb2wnLCB7XHJcblxyXG5cdFx0cHJvcHM6IHtcclxuXHRcdFx0cm91dGVzOiB7dmFsOiBbXX1cclxuXHRcdH0sXHJcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblxyXG5cclxuXHRcdFx0dmFyIHJvdXRlcyA9IG9wdGlvbnMucm91dGVzXHJcblxyXG5cdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkocm91dGVzKSkge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybignW1JvdXRlckNvbnRyb2xdIGJhZCBvcHRpb25zJylcclxuXHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIHByb2Nlc3NSb3V0ZShpbmZvKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1tSb3V0ZXJDb250cm9sXSBwcm9jZXNzUm91dGUnLCBpbmZvKVxyXG5cclxuXHRcdFx0XHR2YXIgbmV3Um91dGUgPSBpbmZvLmN1clJvdXRlXHJcblxyXG5cdFx0XHRcdGZvcih2YXIgcm91dGUgb2Ygcm91dGVzKSB7XHJcblx0XHRcdFx0XHR2YXIgcGFyYW1zID0gbWF0Y2hSb3V0ZShuZXdSb3V0ZSwgcm91dGUuaHJlZilcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coYHJvdXRlOiAke3JvdXRlLmhyZWZ9LCBwYXJhbXNgLCBwYXJhbXMpXHJcblx0XHRcdFx0XHRpZiAocGFyYW1zICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW1JvdXRlckNvbnRyb2xdIHBhcmFtcycsIHBhcmFtcylcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiByb3V0ZS5yZWRpcmVjdCA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSAnIycgKyByb3V0ZS5yZWRpcmVjdFxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGVsc2UgaWYgKHR5cGVvZiByb3V0ZS5jb250cm9sID09ICdzdHJpbmcnKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRcdHZhciBjdXJDdHJsID0gZWx0LmZpbmQoJy5DdXN0b21Db250cm9sJykuaW50ZXJmYWNlKClcclxuXHRcdFx0XHRcdFx0XHR2YXIgY2FuQ2hhbmdlID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRcdGlmIChjdXJDdHJsICYmIHR5cGVvZiBjdXJDdHJsLmNhbkNoYW5nZSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRjYW5DaGFuZ2UgPSBjdXJDdHJsLmNhbkNoYW5nZSgpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdGlmIChjYW5DaGFuZ2UpIHtcclxuXHRcdFx0XHRcdFx0XHRcdCQod2luZG93KS50cmlnZ2VyKCdyb3V0ZUNoYW5nZWQnLCBuZXdSb3V0ZSlcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBjb25maWcgPSAkLmV4dGVuZCh7JHBhcmFtczogcGFyYW1zfSwgcm91dGUub3B0aW9ucylcdFxyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGh0bWwgPSAkKGA8ZGl2IGJuLWNvbnRyb2w9XCIke3JvdXRlLmNvbnRyb2x9XCIgYm4tb3B0aW9ucz1cImNvbmZpZ1wiIGNsYXNzPVwiYm4tZmxleC1jb2wgYm4tZmxleC0xXCI+PC9kaXY+YClcclxuXHRcdFx0XHRcdFx0XHRcdGVsdC5kaXNwb3NlKCkuaHRtbChodG1sKVxyXG5cdFx0XHRcdFx0XHRcdFx0aHRtbC5wcm9jZXNzVUkoe2NvbmZpZzogY29uZmlnfSlcdFx0XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdGVsc2UgaWYgKGluZm8ucHJldlJvdXRlKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRoaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgJycsICcjJyArIGluZm8ucHJldlJvdXRlKVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0Ly9lbHQuaHRtbChodG1sKVxyXG5cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHRcdFx0fVx0XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cclxuXHRcdFx0fVx0XHRcclxuXHJcblx0XHRcdCQod2luZG93KS5vbigncm91dGVDaGFuZ2UnLCBmdW5jdGlvbihldiwgaW5mbykge1xyXG5cdFx0XHRcdGlmICghcHJvY2Vzc1JvdXRlKGluZm8pKSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtSb3V0ZXJDb250cm9sXSBubyBhY3Rpb24gZGVmaW5lZCBmb3Igcm91dGUgJyR7bmV3Um91dGV9J2ApXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cclxuXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG5cclxuXHJcbiJdfQ==
