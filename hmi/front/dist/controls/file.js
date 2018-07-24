(function() {	

	$$.loadStyle('/controls/file.css')
})();
$$.registerControlEx('FileControl', {
	deps: ['FileService'], 
	options: {
		toolbar: true,
		imageOnly: false,
		maxUploadSize: 2*1024*2014 // 2 Mo		
	},
	events: 'fileClick',
	iface: 'getFiles()',

	
	lib: 'file',
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
	
	lib: 'file',
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




//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlcHMuanMiLCJmaWxlLmpzIiwiZmlsZXRyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcdFxyXG5cclxuXHQkJC5sb2FkU3R5bGUoJy9jb250cm9scy9maWxlLmNzcycpXHJcbn0pKCk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZpbGVDb250cm9sJywge1xyXG5cdGRlcHM6IFsnRmlsZVNlcnZpY2UnXSwgXHJcblx0b3B0aW9uczoge1xyXG5cdFx0dG9vbGJhcjogdHJ1ZSxcclxuXHRcdGltYWdlT25seTogZmFsc2UsXHJcblx0XHRtYXhVcGxvYWRTaXplOiAyKjEwMjQqMjAxNCAvLyAyIE1vXHRcdFxyXG5cdH0sXHJcblx0ZXZlbnRzOiAnZmlsZUNsaWNrJyxcclxuXHRpZmFjZTogJ2dldEZpbGVzKCknLFxyXG5cclxuXHRcblx0bGliOiAnZmlsZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGZpbGVTcnYpIHtcclxuXHJcblx0XHR2YXIgY3V0RmlsZXMgPSBbXVxyXG5cdFx0dmFyIGN1dERpciA9ICcvJ1xyXG5cdFx0dmFyIGNvcHkgPSB0cnVlXHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U2VsRmlsZXMoKSB7XHJcblx0XHRcdHZhciBzZWxEaXYgPSBlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCBhJylcclxuXHJcblx0XHRcdHZhciBzZWxGaWxlID0gW11cclxuXHRcdFx0c2VsRGl2LmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0c2VsRmlsZS5wdXNoKGN0cmwubW9kZWwucm9vdERpciArICQodGhpcykuZGF0YSgnbmFtZScpKVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRyZXR1cm4gc2VsRmlsZVxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHR2YXIgY3RybCA9IHdpbmRvdy5maWxlQ3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPlxcclxcblx0PGRpdiBjbGFzcz1cXFwidG9vbGJhclxcXCIgYm4tc2hvdz1cXFwic2hvd1Rvb2xiYXJcXFwiPlxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25Ub2dnbGVTZWxNb2RlXFxcIiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiU2VsZWN0IG1vZGVcXFwiIFxcclxcblx0XHRcdGJuLWNsYXNzPVxcXCJzZWxlY3RlZDogc2VsTW9kZVxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hlY2tcXFwiPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdDxidXR0b24gXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkNhbmNlbFNlbGVjdGlvblxcXCIgXFxyXFxuXHRcdFx0dGl0bGU9XFxcIkNhbmNlbCBzZWxlY3Rpb25cXFwiXFxyXFxuXHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFjYW5DYW5jZWxcXFwiICBcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtdGltZXNcXFwiPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdDxidXR0b24gXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkRlbGV0ZVxcXCIgXFxyXFxuXHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFmaWxlU2VsZWN0ZWRcXFwiIFxcclxcblx0XHRcdHRpdGxlPVxcXCJEZWxldGUgc2VsZWN0ZWQgZmlsZXNcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLXRyYXNoXFxcIiA+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiQ3V0XFxcIiBcXHJcXG5cdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uQ3V0XFxcIiBcXHJcXG5cdFx0XHRibi1wcm9wPVxcXCJkaXNhYmxlZDogIWZpbGVTZWxlY3RlZFxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY3V0XFxcIiA+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiQ29weVxcXCIgXFxyXFxuXHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFmaWxlU2VsZWN0ZWRcXFwiIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25Db3B5XFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1jb3B5XFxcIiA+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiUGFzdGVcXFwiIFxcclxcblx0XHRcdGJuLXByb3A9XFxcImRpc2FibGVkOiAhY2FuUGFzdGVcXFwiIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25QYXN0ZVxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtcGFzdGVcXFwiID48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlxcclxcblxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25DcmVhdGVGb2xkZXJcXFwiIFxcclxcblx0XHRcdHRpdGxlPVxcXCJOZXcgZm9sZGVyXFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1mb2xkZXItb3BlblxcXCIgPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XFxyXFxuXHRcdFxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdHRpdGxlPVxcXCJJbXBvcnQgZmlsZVxcXCIgXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkltcG9ydEZpbGVcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLXVwbG9hZFxcXCIgPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XHRcdFxcclxcblxcclxcblx0PC9kaXY+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJwYXRoUGFuZWxcXFwiPlxcclxcblx0XHRQYXRoOiZuYnNwOzxzcGFuIGJuLXRleHQ9XFxcInJvb3REaXJcXFwiPjwvc3Bhbj5cXHJcXG5cdDwvZGl2Plxcclxcblxcclxcblx0PGRpdj5cXHJcXG5cdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYmFja0J0blxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkJhY2tCdG5cXFwiIHRpdGxlPVxcXCJCYWNrXFxcIiBibi1zaG93PVxcXCJiYWNrVmlzaWJsZVxcXCI+XFxyXFxuXHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLWFycm93LWNpcmNsZS1sZWZ0XFxcIj48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlx0XHRcXHJcXG5cdDwvZGl2Plxcclxcblxcclxcblx0PGRpdiBibi1lYWNoPVxcXCJmIG9mIGZpbGVzXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIiBibi1ldmVudD1cXFwiY2xpY2suZm9sZGVyOiBvbkZvbGRlciwgY2xpY2suZmlsZTogb25GaWxlXFxcIj5cXHJcXG5cdFx0XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcInRodW1ibmFpbFxcXCI+XFxyXFxuXHRcdFx0XHQ8YSBibi1pZj1cXFwiZi5pc0ltYWdlXFxcIiBocmVmPVxcXCIjXFxcIiBibi1hdHRyPVxcXCJ0aXRsZTogZi5zaXplXFxcIiBjbGFzcz1cXFwiZmlsZVxcXCIgYm4tZGF0YT1cXFwibmFtZTogZi5uYW1lXFxcIj5cXHJcXG5cdFx0XHRcdFx0PGRpdj5cXHJcXG5cdFx0XHRcdFx0XHQ8aW1nIGJuLWF0dHI9XFxcInNyYzogZi5pbWdVcmxcXFwiPlxcclxcblx0XHRcdFx0XHQ8L2Rpdj5cXHJcXG5cdFx0XHRcdFx0XFxyXFxuXHRcdFx0XHRcdDxzcGFuIGJuLXRleHQ9XFxcImYubmFtZVxcXCI+PC9zcGFuPlxcclxcblx0XHRcdFx0PC9hPlx0XHRcdFxcclxcblx0XHRcdFx0PGEgYm4taWY9XFxcImYuaXNEaXJcXFwiIGhyZWY9XFxcIiNcXFwiIGNsYXNzPVxcXCJmb2xkZXJcXFwiIGJuLWRhdGE9XFxcIm5hbWU6IGYubmFtZVxcXCI+XFxyXFxuXHRcdFx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTR4IGZhLWZvbGRlci1vcGVuIHczLXRleHQtYmx1ZS1ncmV5XFxcIj48L2k+XFxyXFxuXHRcdFx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XHRcXHJcXG5cdFx0XHRcdFx0PHNwYW4gYm4tdGV4dD1cXFwiZi5uYW1lXFxcIj48L3NwYW4+XFxyXFxuXHRcdFx0XHQ8L2E+XFxyXFxuXHRcdFx0XHQ8YSBibi1pZj1cXFwiZi5pc0ZpbGVcXFwiIGhyZWY9XFxcIiNcXFwiIGJuLWRhdGE9XFxcIm5hbWU6IGYubmFtZVxcXCIgY2xhc3M9XFxcImZpbGVcXFwiIGJuLWF0dHI9XFxcInRpdGxlOiBmLnNpemVcXFwiPlxcclxcblx0XHRcdFx0XHQ8ZGl2Plxcclxcblx0XHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS00eCBmYS1maWxlIHczLXRleHQtYmx1ZS1ncmV5XFxcIj48L2k+XFxyXFxuXHRcdFx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XHRcXHJcXG5cdFx0XHRcdFx0PHNwYW4gYm4tdGV4dD1cXFwiZi5uYW1lXFxcIj48L3NwYW4+XFxyXFxuXHRcdFx0XHQ8L2E+XHRcdFx0XFxyXFxuXHRcdFx0XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRmaWxlczogW10sXHJcblx0XHRcdFx0Y3V0RmlsZXM6IFtdLFxyXG5cdFx0XHRcdHJvb3REaXI6ICcvJyxcclxuXHRcdFx0XHRjdXREaXI6ICcvJyxcclxuXHRcdFx0XHRiYWNrVmlzaWJsZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5yb290RGlyICE9ICcvJ1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0c2VsTW9kZTogZmFsc2UsXHJcblx0XHRcdFx0ZmlsZVNlbGVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHRzaG93VG9vbGJhcjogb3B0aW9ucy50b29sYmFyLFxyXG5cdFx0XHRcdGNhbkNhbmNlbDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jdXRGaWxlcy5sZW5ndGggIT0gMCB8fCB0aGlzLmZpbGVTZWxlY3RlZFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0Y2FuUGFzdGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuY3V0RmlsZXMubGVuZ3RoICE9IDAgJiYgdGhpcy5yb290RGlyICE9IHRoaXMuY3V0RGlyXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRvbkZvbGRlcjogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbkZvbGRlcicpXHJcblx0XHRcdFx0XHRpZiAoY3RybC5tb2RlbC5zZWxNb2RlKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCd0aGlzJywgJCh0aGlzKS5jbG9zZXN0KCcudGh1bWJuYWlsJykpXHJcblx0XHRcdFx0XHRcdCQodGhpcykuY2xvc2VzdCgnLnRodW1ibmFpbCcpLnRvZ2dsZUNsYXNzKCdzZWxlY3RlZCcpXHJcblxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ2ZpbGVTZWxlY3RlZCcsIGdldFNlbEZpbGVzKCkubGVuZ3RoICE9IDApXHJcblx0XHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdHZhciBkaXJOYW1lID0gJCh0aGlzKS5kYXRhKCduYW1lJylcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uRm9sZGVyJywgZGlyTmFtZSlcclxuXHRcdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcclxuXHRcdFx0XHRcdGxvYWREYXRhKGN0cmwubW9kZWwucm9vdERpciArIGRpck5hbWUgKyAnLycpXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkJhY2tCdG46IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dmFyIHNwbGl0ID0gY3RybC5tb2RlbC5yb290RGlyLnNwbGl0KCcvJylcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQmFja0J0bicsIHNwbGl0KVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRzcGxpdC5wb3AoKVxyXG5cdFx0XHRcdFx0c3BsaXQucG9wKClcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygncm9vdERpcicsIHJvb3REaXIpXHJcblx0XHRcdFx0XHRsb2FkRGF0YShzcGxpdC5qb2luKCcvJykgKyAnLycpXHJcblxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25GaWxlOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0dmFyIG5hbWUgPSAkKHRoaXMpLmRhdGEoJ25hbWUnKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25QaWN0dXJlJywgbmFtZSlcclxuXHRcdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcclxuXHRcdFx0XHRcdC8vdmFyIGZpbGVQYXRoID0gZmlsZVNydi5maWxlVXJsKHJvb3REaXIgKyBuYW1lKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZmlsZVBhdGgnLCBmaWxlUGF0aClcclxuXHRcdFx0XHRcdGlmIChjdHJsLm1vZGVsLnNlbE1vZGUpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5jbG9zZXN0KCcudGh1bWJuYWlsJykudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJylcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKCdmaWxlU2VsZWN0ZWQnLCBnZXRTZWxGaWxlcygpLmxlbmd0aCAhPSAwKVxyXG5cdFx0XHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsdC50cmlnZ2VyKCdmaWxlQ2xpY2snLCB7bmFtZSwgcm9vdERpcjogY3RybC5tb2RlbC5yb290RGlyfSlcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uVG9nZ2xlU2VsTW9kZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ3NlbE1vZGUnLCAhY3RybC5tb2RlbC5zZWxNb2RlKVxyXG5cdFx0XHRcdFx0aWYgKCFjdHJsLm1vZGVsLnNlbE1vZGUpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LmZpbmQoJy50aHVtYm5haWwuc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ2ZpbGVTZWxlY3RlZCcsIGZhbHNlKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25EZWxldGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0JCQuc2hvd0NvbmZpcm0oXCJBcmUgeW91IHN1cmUgP1wiLCBcIkRlbGV0ZSBmaWxlc1wiLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dmFyIHNlbEZpbGUgPSBnZXRTZWxGaWxlcygpXHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uRGVsZXRlJywgc2VsRmlsZSlcclxuXHRcdFx0XHRcdFx0ZmlsZVNydi5yZW1vdmVGaWxlcyhzZWxGaWxlKVxyXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdGxvYWREYXRhKClcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVxyXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25DcmVhdGVGb2xkZXI6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dmFyIHJvb3REaXIgPSBjdHJsLm1vZGVsLnJvb3REaXJcclxuXHRcdFx0XHRcdCQkLnNob3dQcm9tcHQoJ0ZvbGRlciBuYW1lOicsICdOZXcgRm9sZGVyJywgZnVuY3Rpb24oZm9sZGVyTmFtZSkge1xyXG5cdFx0XHRcdFx0XHRmaWxlU3J2Lm1rZGlyKHJvb3REaXIgKyBmb2xkZXJOYW1lKVxyXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdGxvYWREYXRhKClcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVxyXG5cdFx0XHRcdFx0XHR9KVx0XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25DdXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0XHRcdGNvcHkgPSBmYWxzZVxyXG5cclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ3V0JywgY3V0RmlsZXMpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0XHRcdHNlbE1vZGU6IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRjdXRGaWxlczogZ2V0U2VsRmlsZXMoKSxcclxuXHRcdFx0XHRcdFx0Y3V0RGlyOiBjdHJsLm1vZGVsLnJvb3REaXJcclxuXHRcdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdFx0ZWx0LmZpbmQoJy50aHVtYm5haWwuc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKS5hZGRDbGFzcygnY3V0ZWQnKVxyXG5cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uQ29weTogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRcdFx0Y29weSA9IHRydWVcclxuXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvcHknLCBjdXRGaWxlcylcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdFx0c2VsTW9kZTogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGN1dEZpbGVzOiBnZXRTZWxGaWxlcygpLFxyXG5cdFx0XHRcdFx0XHRjdXREaXI6IGN0cmwubW9kZWwucm9vdERpclxyXG5cdFx0XHRcdFx0fSlcclxuXHJcblx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpLmFkZENsYXNzKCdjdXRlZCcpXHJcblx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0b25QYXN0ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblBhc3RlJylcclxuXHRcdFx0XHRcdHZhciB7cm9vdERpciwgY3V0RmlsZXN9ID0gY3RybC5tb2RlbFxyXG5cdFx0XHRcdFx0dmFyIHByb21pc2UgPSAoY29weSkgPyBmaWxlU3J2LmNvcHlGaWxlcyhjdXRGaWxlcywgcm9vdERpcikgOiBmaWxlU3J2Lm1vdmVGaWxlcyhjdXRGaWxlcywgcm9vdERpcilcclxuXHRcdFx0XHRcdGNvcHkgPSBmYWxzZVxyXG5cdFx0XHRcdFx0cHJvbWlzZVxyXG5cdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7Y3V0RmlsZXM6IFtdfSlcclxuXHRcdFx0XHRcdFx0bG9hZERhdGEoKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtjdXRGaWxlczogW119KVxyXG5cdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHJcblx0XHRcdFx0XHR9KVx0XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkNhbmNlbFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCBjdXRlZCcpXHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe1xyXG5cdFx0XHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRjdXRGaWxlczogW11cclxuXHRcdFx0XHRcdH0pXHRcdFx0XHRcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uSW1wb3J0RmlsZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkltcG9ydEZpbGUnKVxyXG5cdFx0XHRcdFx0dmFyIHJvb3REaXIgPSBjdHJsLm1vZGVsLnJvb3REaXJcclxuXHJcblx0XHRcdFx0XHQkJC5vcGVuRmlsZURpYWxvZyhmdW5jdGlvbihmaWxlKSB7XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZpbGVTaXplJywgZmlsZS5zaXplIC8gMTAyNClcclxuXHRcdFx0XHRcdFx0aWYgKGZpbGUuc2l6ZSA+IG9wdGlvbnMubWF4VXBsb2FkU2l6ZSkge1xyXG5cdFx0XHRcdFx0XHRcdCQkLnNob3dBbGVydCgnRmlsZSB0b28gYmlnJywgJ0Vycm9yJylcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHQkJC5yZWFkRmlsZUFzRGF0YVVSTChmaWxlLCBmdW5jdGlvbihkYXRhVVJMKSB7XHJcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZGF0YVVSTCcsIGRhdGFVUkwpXHJcblx0XHRcdFx0XHRcdFx0ZmlsZVNydi51cGxvYWRGaWxlKGRhdGFVUkwsIGZpbGUubmFtZSwgcm9vdERpcikudGhlbihmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGxvYWREYXRhKClcclxuXHRcdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IFxyXG5cdFx0fSlcclxuXHJcblx0XHRmdW5jdGlvbiBsb2FkRGF0YShyb290RGlyKSB7XHJcblx0XHRcdGlmIChyb290RGlyID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHJvb3REaXIgPSBjdHJsLm1vZGVsLnJvb3REaXJcclxuXHRcdFx0fVxyXG5cdFx0XHRmaWxlU3J2Lmxpc3Qocm9vdERpciwgb3B0aW9ucy5pbWFnZU9ubHkpLnRoZW4oZnVuY3Rpb24oZmlsZXMpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmaWxlcycsIGZpbGVzKVxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0XHRyb290RGlyLFxyXG5cdFx0XHRcdFx0ZmlsZVNlbGVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHRcdGZpbGVzOiBmaWxlc1xyXG5cdFx0LypcdFx0XHRcdC5maWx0ZXIoZnVuY3Rpb24oZmlsZSkge1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiAhZmlsZS5pc0RpclxyXG5cdFx0XHRcdFx0XHR9KSovXHJcblx0XHRcdFx0XHRcdC5tYXAoZnVuY3Rpb24oZmlsZSwgaWR4KSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIG5hbWUgPSBmaWxlLnRpdGxlXHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzRGlyID0gZmlsZS5mb2xkZXJcclxuXHRcdFx0XHRcdFx0XHR2YXIgaXNJbWFnZSA9ICQkLmlzSW1hZ2UobmFtZSlcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRcdFx0bmFtZSxcclxuXHRcdFx0XHRcdFx0XHRcdHNpemU6ICdTaXplIDogJyArIE1hdGguZmxvb3IoZmlsZS5zaXplLzEwMjQpICsgJyBLbycsXHJcblx0XHRcdFx0XHRcdFx0XHRpbWdVcmw6ICBpc0RpciA/ICcnIDogZmlsZVNydi5maWxlVXJsKHJvb3REaXIgKyBuYW1lKSxcclxuXHRcdFx0XHRcdFx0XHRcdGlzRGlyLFxyXG5cdFx0XHRcdFx0XHRcdFx0aXNJbWFnZSwgXHJcblx0XHRcdFx0XHRcdFx0XHRpc0ZpbGU6ICFpc0RpciAmJiAhaXNJbWFnZVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9KVx0XHRcclxuXHRcdH1cclxuXHJcblx0XHRsb2FkRGF0YSgpXHJcblxyXG5cdFx0dGhpcy5nZXRGaWxlcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gY3RybC5tb2RlbC5maWxlc1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5mdW5jdGlvbiBnZXROb2RlUGF0aChub2RlKSB7XHJcblxyXG5cdHZhciBwYXRoID0gbm9kZS5nZXRQYXJlbnRMaXN0KGZhbHNlLCB0cnVlKS5tYXAoKG5vZGUpID0+IG5vZGUua2V5ID09ICdyb290JyA/ICcvJyA6IG5vZGUudGl0bGUpXHJcblx0cmV0dXJuIHBhdGguam9pbignLycpXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdGaWxlVHJlZUNvbnRyb2wnLCB7XHJcblx0ZGVwczogWydGaWxlU2VydmljZSddLFxyXG5cdGlmYWNlOiAncmVmcmVzaCgpO2dldFZhbHVlKCknLFxyXG5cdFxuXHRsaWI6ICdmaWxlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgZmlsZVNydikge1xyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdj5cXHJcXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiVHJlZUNvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcInRyZWVPcHRpb25zXFxcIiBibi1pZmFjZT1cXFwidHJlZUN0cmxcXFwiIGJuLWV2ZW50PVxcXCJjb250ZXh0TWVudUFjdGlvbjogb25UcmVlQWN0aW9uXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cIixcdFx0XHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHR0cmVlT3B0aW9uczoge1xyXG5cdFx0XHRcdFx0c291cmNlOiBbe3RpdGxlOiAnSG9tZScsIGZvbGRlcjogdHJ1ZSwgbGF6eTogdHJ1ZSwga2V5OiAncm9vdCd9XSxcclxuXHJcblx0XHRcdFx0XHRsYXp5TG9hZDogZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2xhenlMb2FkJywgZGF0YS5ub2RlLmtleSlcclxuXHRcdFx0XHRcdFx0dmFyIHBhdGggPSBnZXROb2RlUGF0aChkYXRhLm5vZGUpXHJcblx0XHRcdFx0XHRcdGRhdGEucmVzdWx0ID0gZmlsZVNydi5saXN0KHBhdGgsIGZhbHNlLCB0cnVlKVxyXG5cclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRjb250ZXh0TWVudToge1xyXG5cdFx0XHRcdFx0XHRtZW51OiB7XHJcblx0XHRcdFx0XHRcdFx0bmV3Rm9sZGVyOiB7J25hbWUnOiAnTmV3IEZvbGRlcid9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdG9uVHJlZUFjdGlvbjogZnVuY3Rpb24obm9kZSwgYWN0aW9uKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblRyZWVBY3Rpb24nLCBub2RlLnRpdGxlLCBhY3Rpb24pXHJcblx0XHRcdFx0XHQkJC5zaG93UHJvbXB0KCdGb2xkZXIgbmFtZScsICdOZXcgRm9sZGVyJywgZnVuY3Rpb24oZm9sZGVyTmFtZSkge1xyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0dmFyIHBhdGggPSBnZXROb2RlUGF0aChub2RlKVxyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmb2xkZXJOYW1lJywgZm9sZGVyTmFtZSwgJ3BhdGgnLCBwYXRoKVxyXG5cdFx0XHRcdFx0XHRmaWxlU3J2Lm1rZGlyKHBhdGggKyAnLycgKyBmb2xkZXJOYW1lKVxyXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdG5vZGUubG9hZCh0cnVlKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHJcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHRcdFx0XHJcblx0XHR9KVxyXG5cclxuXHRcdHRoaXMuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIGdldE5vZGVQYXRoKGN0cmwuc2NvcGUudHJlZUN0cmwuZ2V0QWN0aXZlTm9kZSgpKVxyXG5cdFx0fSxcclxuXHJcblx0XHR0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0Y29uc3Qgcm9vdCA9IGN0cmwuc2NvcGUudHJlZUN0cmwuZ2V0Um9vdE5vZGUoKS5nZXRGaXJzdENoaWxkKClcclxuXHRcdFx0aWYgKHJvb3QpIHtcclxuXHRcdFx0XHRyb290LmxvYWQodHJ1ZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0XHJcblx0fVxyXG5cclxufSk7XHJcblxyXG5cclxufSkoKTtcclxuXHJcblxyXG5cclxuIl19
