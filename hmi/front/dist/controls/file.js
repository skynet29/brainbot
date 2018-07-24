(function() {	

	$$.loadStyle('/controls/file.css')
})();
$$.registerControlEx('FileControl', {
	deps: ['FileService'], 
	props: {
		toolbar: {val: true},
		imageOnly: {val: false},
		maxUploadSize: {val: 2*1024*2014} // 2 Mo		
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




//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlcHMuanMiLCJmaWxlLmpzIiwiZmlsZXRyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcdFxyXG5cclxuXHQkJC5sb2FkU3R5bGUoJy9jb250cm9scy9maWxlLmNzcycpXHJcbn0pKCk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZpbGVDb250cm9sJywge1xyXG5cdGRlcHM6IFsnRmlsZVNlcnZpY2UnXSwgXHJcblx0cHJvcHM6IHtcclxuXHRcdHRvb2xiYXI6IHt2YWw6IHRydWV9LFxyXG5cdFx0aW1hZ2VPbmx5OiB7dmFsOiBmYWxzZX0sXHJcblx0XHRtYXhVcGxvYWRTaXplOiB7dmFsOiAyKjEwMjQqMjAxNH0gLy8gMiBNb1x0XHRcclxuXHR9LFxyXG5cdGV2ZW50czogJ2ZpbGVDbGljaycsXHJcblx0aWZhY2U6ICdnZXRGaWxlcygpJyxcclxuXHJcblx0XG5cdGxpYjogJ2ZpbGUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBmaWxlU3J2KSB7XHJcblxyXG5cdFx0dmFyIGN1dEZpbGVzID0gW11cclxuXHRcdHZhciBjdXREaXIgPSAnLydcclxuXHRcdHZhciBjb3B5ID0gdHJ1ZVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldFNlbEZpbGVzKCkge1xyXG5cdFx0XHR2YXIgc2VsRGl2ID0gZWx0LmZpbmQoJy50aHVtYm5haWwuc2VsZWN0ZWQgYScpXHJcblxyXG5cdFx0XHR2YXIgc2VsRmlsZSA9IFtdXHJcblx0XHRcdHNlbERpdi5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHNlbEZpbGUucHVzaChjdHJsLm1vZGVsLnJvb3REaXIgKyAkKHRoaXMpLmRhdGEoJ25hbWUnKSlcclxuXHRcdFx0fSlcclxuXHRcdFx0cmV0dXJuIHNlbEZpbGVcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0dmFyIGN0cmwgPSB3aW5kb3cuZmlsZUN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInRvb2xiYXJcXFwiIGJuLXNob3c9XFxcInNob3dUb29sYmFyXFxcIj5cXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uVG9nZ2xlU2VsTW9kZVxcXCIgXFxyXFxuXHRcdFx0dGl0bGU9XFxcIlNlbGVjdCBtb2RlXFxcIiBcXHJcXG5cdFx0XHRibi1jbGFzcz1cXFwic2VsZWN0ZWQ6IHNlbE1vZGVcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLWNoZWNrXFxcIj48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlxcclxcblxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25DYW5jZWxTZWxlY3Rpb25cXFwiIFxcclxcblx0XHRcdHRpdGxlPVxcXCJDYW5jZWwgc2VsZWN0aW9uXFxcIlxcclxcblx0XHRcdGJuLXByb3A9XFxcImRpc2FibGVkOiAhY2FuQ2FuY2VsXFxcIiAgXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLXRpbWVzXFxcIj48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlxcclxcblxcclxcblx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25EZWxldGVcXFwiIFxcclxcblx0XHRcdGJuLXByb3A9XFxcImRpc2FibGVkOiAhZmlsZVNlbGVjdGVkXFxcIiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiRGVsZXRlIHNlbGVjdGVkIGZpbGVzXFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS10cmFzaFxcXCIgPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdDxidXR0b24gXFxyXFxuXHRcdFx0dGl0bGU9XFxcIkN1dFxcXCIgXFxyXFxuXHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkN1dFxcXCIgXFxyXFxuXHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFmaWxlU2VsZWN0ZWRcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLWN1dFxcXCIgPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdDxidXR0b24gXFxyXFxuXHRcdFx0dGl0bGU9XFxcIkNvcHlcXFwiIFxcclxcblx0XHRcdGJuLXByb3A9XFxcImRpc2FibGVkOiAhZmlsZVNlbGVjdGVkXFxcIiBcXHJcXG5cdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uQ29weVxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY29weVxcXCIgPjwvaT5cXHJcXG5cdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdDxidXR0b24gXFxyXFxuXHRcdFx0dGl0bGU9XFxcIlBhc3RlXFxcIiBcXHJcXG5cdFx0XHRibi1wcm9wPVxcXCJkaXNhYmxlZDogIWNhblBhc3RlXFxcIiBcXHJcXG5cdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uUGFzdGVcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLXBhc3RlXFxcIiA+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uQ3JlYXRlRm9sZGVyXFxcIiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiTmV3IGZvbGRlclxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtZm9sZGVyLW9wZW5cXFwiID48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlxcclxcblx0XHRcXHJcXG5cdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHR0aXRsZT1cXFwiSW1wb3J0IGZpbGVcXFwiIFxcclxcblx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25JbXBvcnRGaWxlXFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS11cGxvYWRcXFwiID48L2k+XFxyXFxuXHRcdDwvYnV0dG9uPlx0XHRcXHJcXG5cXHJcXG5cdDwvZGl2Plxcclxcblx0PGRpdiBjbGFzcz1cXFwicGF0aFBhbmVsXFxcIj5cXHJcXG5cdFx0UGF0aDombmJzcDs8c3BhbiBibi10ZXh0PVxcXCJyb290RGlyXFxcIj48L3NwYW4+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDxkaXY+XFxyXFxuXHRcdDxidXR0b24gY2xhc3M9XFxcImJhY2tCdG5cXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25CYWNrQnRuXFxcIiB0aXRsZT1cXFwiQmFja1xcXCIgYm4tc2hvdz1cXFwiYmFja1Zpc2libGVcXFwiPlxcclxcblx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1hcnJvdy1jaXJjbGUtbGVmdFxcXCI+PC9pPlxcclxcblx0XHQ8L2J1dHRvbj5cdFx0XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDxkaXYgYm4tZWFjaD1cXFwiZiBvZiBmaWxlc1xcXCIgY2xhc3M9XFxcImNvbnRhaW5lclxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLmZvbGRlcjogb25Gb2xkZXIsIGNsaWNrLmZpbGU6IG9uRmlsZVxcXCI+XFxyXFxuXHRcdFxcclxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJ0aHVtYm5haWxcXFwiPlxcclxcblx0XHRcdFx0PGEgYm4taWY9XFxcImYuaXNJbWFnZVxcXCIgaHJlZj1cXFwiI1xcXCIgYm4tYXR0cj1cXFwidGl0bGU6IGYuc2l6ZVxcXCIgY2xhc3M9XFxcImZpbGVcXFwiIGJuLWRhdGE9XFxcIm5hbWU6IGYubmFtZVxcXCI+XFxyXFxuXHRcdFx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRcdFx0PGltZyBibi1hdHRyPVxcXCJzcmM6IGYuaW1nVXJsXFxcIj5cXHJcXG5cdFx0XHRcdFx0PC9kaXY+XFxyXFxuXHRcdFx0XHRcdFxcclxcblx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJmLm5hbWVcXFwiPjwvc3Bhbj5cXHJcXG5cdFx0XHRcdDwvYT5cdFx0XHRcXHJcXG5cdFx0XHRcdDxhIGJuLWlmPVxcXCJmLmlzRGlyXFxcIiBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiZm9sZGVyXFxcIiBibi1kYXRhPVxcXCJuYW1lOiBmLm5hbWVcXFwiPlxcclxcblx0XHRcdFx0XHQ8ZGl2Plxcclxcblx0XHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS00eCBmYS1mb2xkZXItb3BlbiB3My10ZXh0LWJsdWUtZ3JleVxcXCI+PC9pPlxcclxcblx0XHRcdFx0XHQ8L2Rpdj5cXHJcXG5cdFx0XHRcdFx0XFxyXFxuXHRcdFx0XHRcdDxzcGFuIGJuLXRleHQ9XFxcImYubmFtZVxcXCI+PC9zcGFuPlxcclxcblx0XHRcdFx0PC9hPlxcclxcblx0XHRcdFx0PGEgYm4taWY9XFxcImYuaXNGaWxlXFxcIiBocmVmPVxcXCIjXFxcIiBibi1kYXRhPVxcXCJuYW1lOiBmLm5hbWVcXFwiIGNsYXNzPVxcXCJmaWxlXFxcIiBibi1hdHRyPVxcXCJ0aXRsZTogZi5zaXplXFxcIj5cXHJcXG5cdFx0XHRcdFx0PGRpdj5cXHJcXG5cdFx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtNHggZmEtZmlsZSB3My10ZXh0LWJsdWUtZ3JleVxcXCI+PC9pPlxcclxcblx0XHRcdFx0XHQ8L2Rpdj5cXHJcXG5cdFx0XHRcdFx0XFxyXFxuXHRcdFx0XHRcdDxzcGFuIGJuLXRleHQ9XFxcImYubmFtZVxcXCI+PC9zcGFuPlxcclxcblx0XHRcdFx0PC9hPlx0XHRcdFxcclxcblx0XHRcdFxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdDwvZGl2PlxcclxcbjwvZGl2PlxcclxcblxcclxcblwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0ZmlsZXM6IFtdLFxyXG5cdFx0XHRcdGN1dEZpbGVzOiBbXSxcclxuXHRcdFx0XHRyb290RGlyOiAnLycsXHJcblx0XHRcdFx0Y3V0RGlyOiAnLycsXHJcblx0XHRcdFx0YmFja1Zpc2libGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMucm9vdERpciAhPSAnLydcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHNlbE1vZGU6IGZhbHNlLFxyXG5cdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXHJcblx0XHRcdFx0c2hvd1Rvb2xiYXI6IG9wdGlvbnMudG9vbGJhcixcclxuXHRcdFx0XHRjYW5DYW5jZWw6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuY3V0RmlsZXMubGVuZ3RoICE9IDAgfHwgdGhpcy5maWxlU2VsZWN0ZWRcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGNhblBhc3RlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmN1dEZpbGVzLmxlbmd0aCAhPSAwICYmIHRoaXMucm9vdERpciAhPSB0aGlzLmN1dERpclxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0b25Gb2xkZXI6IGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25Gb2xkZXInKVxyXG5cdFx0XHRcdFx0aWYgKGN0cmwubW9kZWwuc2VsTW9kZSkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygndGhpcycsICQodGhpcykuY2xvc2VzdCgnLnRodW1ibmFpbCcpKVxyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmNsb3Nlc3QoJy50aHVtYm5haWwnKS50b2dnbGVDbGFzcygnc2VsZWN0ZWQnKVxyXG5cclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKCdmaWxlU2VsZWN0ZWQnLCBnZXRTZWxGaWxlcygpLmxlbmd0aCAhPSAwKVxyXG5cdFx0XHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHR2YXIgZGlyTmFtZSA9ICQodGhpcykuZGF0YSgnbmFtZScpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkZvbGRlcicsIGRpck5hbWUpXHJcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRcdFx0XHRsb2FkRGF0YShjdHJsLm1vZGVsLnJvb3REaXIgKyBkaXJOYW1lICsgJy8nKVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25CYWNrQnRuOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHZhciBzcGxpdCA9IGN0cmwubW9kZWwucm9vdERpci5zcGxpdCgnLycpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkJhY2tCdG4nLCBzcGxpdClcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0c3BsaXQucG9wKClcclxuXHRcdFx0XHRcdHNwbGl0LnBvcCgpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3Jvb3REaXInLCByb290RGlyKVxyXG5cdFx0XHRcdFx0bG9hZERhdGEoc3BsaXQuam9pbignLycpICsgJy8nKVxyXG5cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uRmlsZTogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdHZhciBuYW1lID0gJCh0aGlzKS5kYXRhKCduYW1lJylcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uUGljdHVyZScsIG5hbWUpXHJcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRcdFx0XHQvL3ZhciBmaWxlUGF0aCA9IGZpbGVTcnYuZmlsZVVybChyb290RGlyICsgbmFtZSlcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZpbGVQYXRoJywgZmlsZVBhdGgpXHJcblx0XHRcdFx0XHRpZiAoY3RybC5tb2RlbC5zZWxNb2RlKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuY2xvc2VzdCgnLnRodW1ibmFpbCcpLnRvZ2dsZUNsYXNzKCdzZWxlY3RlZCcpXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSgnZmlsZVNlbGVjdGVkJywgZ2V0U2VsRmlsZXMoKS5sZW5ndGggIT0gMClcclxuXHRcdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHQudHJpZ2dlcignZmlsZUNsaWNrJywge25hbWUsIHJvb3REaXI6IGN0cmwubW9kZWwucm9vdERpcn0pXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvblRvZ2dsZVNlbE1vZGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKCdzZWxNb2RlJywgIWN0cmwubW9kZWwuc2VsTW9kZSlcclxuXHRcdFx0XHRcdGlmICghY3RybC5tb2RlbC5zZWxNb2RlKSB7XHJcblx0XHRcdFx0XHRcdGVsdC5maW5kKCcudGh1bWJuYWlsLnNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJylcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKCdmaWxlU2VsZWN0ZWQnLCBmYWxzZSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uRGVsZXRlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdCQkLnNob3dDb25maXJtKFwiQXJlIHlvdSBzdXJlID9cIiwgXCJEZWxldGUgZmlsZXNcIiwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHZhciBzZWxGaWxlID0gZ2V0U2VsRmlsZXMoKVxyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkRlbGV0ZScsIHNlbEZpbGUpXHJcblx0XHRcdFx0XHRcdGZpbGVTcnYucmVtb3ZlRmlsZXMoc2VsRmlsZSlcclxuXHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHRsb2FkRGF0YSgpXHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChyZXNwLnJlc3BvbnNlVGV4dCwgJ0Vycm9yJylcclxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9KVxyXG5cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uQ3JlYXRlRm9sZGVyOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHZhciByb290RGlyID0gY3RybC5tb2RlbC5yb290RGlyXHJcblx0XHRcdFx0XHQkJC5zaG93UHJvbXB0KCdGb2xkZXIgbmFtZTonLCAnTmV3IEZvbGRlcicsIGZ1bmN0aW9uKGZvbGRlck5hbWUpIHtcclxuXHRcdFx0XHRcdFx0ZmlsZVNydi5ta2Rpcihyb290RGlyICsgZm9sZGVyTmFtZSlcclxuXHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHRsb2FkRGF0YSgpXHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChyZXNwLnJlc3BvbnNlVGV4dCwgJ0Vycm9yJylcclxuXHRcdFx0XHRcdFx0fSlcdFxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uQ3V0OiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdFx0XHRjb3B5ID0gZmFsc2VcclxuXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkN1dCcsIGN1dEZpbGVzKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe1xyXG5cdFx0XHRcdFx0XHRzZWxNb2RlOiBmYWxzZSxcclxuXHRcdFx0XHRcdFx0ZmlsZVNlbGVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHRcdFx0Y3V0RmlsZXM6IGdldFNlbEZpbGVzKCksXHJcblx0XHRcdFx0XHRcdGN1dERpcjogY3RybC5tb2RlbC5yb290RGlyXHJcblx0XHRcdFx0XHR9KVxyXG5cclxuXHRcdFx0XHRcdGVsdC5maW5kKCcudGh1bWJuYWlsLnNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJykuYWRkQ2xhc3MoJ2N1dGVkJylcclxuXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkNvcHk6IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0XHRcdGNvcHkgPSB0cnVlXHJcblxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Db3B5JywgY3V0RmlsZXMpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0XHRcdHNlbE1vZGU6IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRjdXRGaWxlczogZ2V0U2VsRmlsZXMoKSxcclxuXHRcdFx0XHRcdFx0Y3V0RGlyOiBjdHJsLm1vZGVsLnJvb3REaXJcclxuXHRcdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdFx0ZWx0LmZpbmQoJy50aHVtYm5haWwuc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKS5hZGRDbGFzcygnY3V0ZWQnKVxyXG5cdFx0XHRcdH0sXHJcblxyXG5cdFx0XHRcdG9uUGFzdGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25QYXN0ZScpXHJcblx0XHRcdFx0XHR2YXIge3Jvb3REaXIsIGN1dEZpbGVzfSA9IGN0cmwubW9kZWxcclxuXHRcdFx0XHRcdHZhciBwcm9taXNlID0gKGNvcHkpID8gZmlsZVNydi5jb3B5RmlsZXMoY3V0RmlsZXMsIHJvb3REaXIpIDogZmlsZVNydi5tb3ZlRmlsZXMoY3V0RmlsZXMsIHJvb3REaXIpXHJcblx0XHRcdFx0XHRjb3B5ID0gZmFsc2VcclxuXHRcdFx0XHRcdHByb21pc2VcclxuXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoe2N1dEZpbGVzOiBbXX0pXHJcblx0XHRcdFx0XHRcdGxvYWREYXRhKClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7Y3V0RmlsZXM6IFtdfSlcclxuXHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVxyXG5cdFx0XHRcdFx0fSlcdFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25DYW5jZWxTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0ZWx0LmZpbmQoJy50aHVtYm5haWwnKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQgY3V0ZWQnKVxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdFx0ZmlsZVNlbGVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHRcdFx0Y3V0RmlsZXM6IFtdXHJcblx0XHRcdFx0XHR9KVx0XHRcdFx0XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkltcG9ydEZpbGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25JbXBvcnRGaWxlJylcclxuXHRcdFx0XHRcdHZhciByb290RGlyID0gY3RybC5tb2RlbC5yb290RGlyXHJcblxyXG5cdFx0XHRcdFx0JCQub3BlbkZpbGVEaWFsb2coZnVuY3Rpb24oZmlsZSkge1xyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmaWxlU2l6ZScsIGZpbGUuc2l6ZSAvIDEwMjQpXHJcblx0XHRcdFx0XHRcdGlmIChmaWxlLnNpemUgPiBvcHRpb25zLm1heFVwbG9hZFNpemUpIHtcclxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoJ0ZpbGUgdG9vIGJpZycsICdFcnJvcicpXHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0JCQucmVhZEZpbGVBc0RhdGFVUkwoZmlsZSwgZnVuY3Rpb24oZGF0YVVSTCkge1xyXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2RhdGFVUkwnLCBkYXRhVVJMKVxyXG5cdFx0XHRcdFx0XHRcdGZpbGVTcnYudXBsb2FkRmlsZShkYXRhVVJMLCBmaWxlLm5hbWUsIHJvb3REaXIpLnRoZW4oZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRsb2FkRGF0YSgpXHJcblx0XHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBcclxuXHRcdH0pXHJcblxyXG5cdFx0ZnVuY3Rpb24gbG9hZERhdGEocm9vdERpcikge1xyXG5cdFx0XHRpZiAocm9vdERpciA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRyb290RGlyID0gY3RybC5tb2RlbC5yb290RGlyXHJcblx0XHRcdH1cclxuXHRcdFx0ZmlsZVNydi5saXN0KHJvb3REaXIsIG9wdGlvbnMuaW1hZ2VPbmx5KS50aGVuKGZ1bmN0aW9uKGZpbGVzKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZmlsZXMnLCBmaWxlcylcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe1xyXG5cdFx0XHRcdFx0cm9vdERpcixcclxuXHRcdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXHJcblx0XHRcdFx0XHRmaWxlczogZmlsZXNcclxuXHRcdC8qXHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKGZpbGUpIHtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gIWZpbGUuaXNEaXJcclxuXHRcdFx0XHRcdFx0fSkqL1xyXG5cdFx0XHRcdFx0XHQubWFwKGZ1bmN0aW9uKGZpbGUsIGlkeCkge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBuYW1lID0gZmlsZS50aXRsZVxyXG5cdFx0XHRcdFx0XHRcdHZhciBpc0RpciA9IGZpbGUuZm9sZGVyXHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzSW1hZ2UgPSAkJC5pc0ltYWdlKG5hbWUpXHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdFx0XHRcdG5hbWUsXHJcblx0XHRcdFx0XHRcdFx0XHRzaXplOiAnU2l6ZSA6ICcgKyBNYXRoLmZsb29yKGZpbGUuc2l6ZS8xMDI0KSArICcgS28nLFxyXG5cdFx0XHRcdFx0XHRcdFx0aW1nVXJsOiAgaXNEaXIgPyAnJyA6IGZpbGVTcnYuZmlsZVVybChyb290RGlyICsgbmFtZSksXHJcblx0XHRcdFx0XHRcdFx0XHRpc0RpcixcclxuXHRcdFx0XHRcdFx0XHRcdGlzSW1hZ2UsIFxyXG5cdFx0XHRcdFx0XHRcdFx0aXNGaWxlOiAhaXNEaXIgJiYgIWlzSW1hZ2VcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fSlcdFx0XHJcblx0XHR9XHJcblxyXG5cdFx0bG9hZERhdGEoKVxyXG5cclxuXHRcdHRoaXMuZ2V0RmlsZXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIGN0cmwubW9kZWwuZmlsZXNcclxuXHRcdH1cclxuXHR9XHJcblxyXG59KTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuZnVuY3Rpb24gZ2V0Tm9kZVBhdGgobm9kZSkge1xyXG5cclxuXHR2YXIgcGF0aCA9IG5vZGUuZ2V0UGFyZW50TGlzdChmYWxzZSwgdHJ1ZSkubWFwKChub2RlKSA9PiBub2RlLmtleSA9PSAncm9vdCcgPyAnLycgOiBub2RlLnRpdGxlKVxyXG5cdHJldHVybiBwYXRoLmpvaW4oJy8nKVxyXG59XHJcblxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnRmlsZVRyZWVDb250cm9sJywge1xyXG5cdGRlcHM6IFsnRmlsZVNlcnZpY2UnXSxcclxuXHRpZmFjZTogJ3JlZnJlc2goKTtnZXRWYWx1ZSgpJyxcclxuXHRcblx0bGliOiAnZmlsZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGZpbGVTcnYpIHtcclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXY+XFxyXFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRyZWVDb250cm9sXFxcIiBibi1vcHRpb25zPVxcXCJ0cmVlT3B0aW9uc1xcXCIgYm4taWZhY2U9XFxcInRyZWVDdHJsXFxcIiBibi1ldmVudD1cXFwiY29udGV4dE1lbnVBY3Rpb246IG9uVHJlZUFjdGlvblxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XCIsXHRcdFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0dHJlZU9wdGlvbnM6IHtcclxuXHRcdFx0XHRcdHNvdXJjZTogW3t0aXRsZTogJ0hvbWUnLCBmb2xkZXI6IHRydWUsIGxhenk6IHRydWUsIGtleTogJ3Jvb3QnfV0sXHJcblxyXG5cdFx0XHRcdFx0bGF6eUxvYWQ6IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdsYXp5TG9hZCcsIGRhdGEubm9kZS5rZXkpXHJcblx0XHRcdFx0XHRcdHZhciBwYXRoID0gZ2V0Tm9kZVBhdGgoZGF0YS5ub2RlKVxyXG5cdFx0XHRcdFx0XHRkYXRhLnJlc3VsdCA9IGZpbGVTcnYubGlzdChwYXRoLCBmYWxzZSwgdHJ1ZSlcclxuXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0Y29udGV4dE1lbnU6IHtcclxuXHRcdFx0XHRcdFx0bWVudToge1xyXG5cdFx0XHRcdFx0XHRcdG5ld0ZvbGRlcjogeyduYW1lJzogJ05ldyBGb2xkZXInfVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRvblRyZWVBY3Rpb246IGZ1bmN0aW9uKG5vZGUsIGFjdGlvbikge1xyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25UcmVlQWN0aW9uJywgbm9kZS50aXRsZSwgYWN0aW9uKVxyXG5cdFx0XHRcdFx0JCQuc2hvd1Byb21wdCgnRm9sZGVyIG5hbWUnLCAnTmV3IEZvbGRlcicsIGZ1bmN0aW9uKGZvbGRlck5hbWUpIHtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdHZhciBwYXRoID0gZ2V0Tm9kZVBhdGgobm9kZSlcclxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZm9sZGVyTmFtZScsIGZvbGRlck5hbWUsICdwYXRoJywgcGF0aClcclxuXHRcdFx0XHRcdFx0ZmlsZVNydi5ta2RpcihwYXRoICsgJy8nICsgZm9sZGVyTmFtZSlcclxuXHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHRub2RlLmxvYWQodHJ1ZSlcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVxyXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVx0XHRcdFxyXG5cdFx0fSlcclxuXHJcblx0XHR0aGlzLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBnZXROb2RlUGF0aChjdHJsLnNjb3BlLnRyZWVDdHJsLmdldEFjdGl2ZU5vZGUoKSlcclxuXHRcdH0sXHJcblxyXG5cdFx0dGhpcy5yZWZyZXNoID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGNvbnN0IHJvb3QgPSBjdHJsLnNjb3BlLnRyZWVDdHJsLmdldFJvb3ROb2RlKCkuZ2V0Rmlyc3RDaGlsZCgpXHJcblx0XHRcdGlmIChyb290KSB7XHJcblx0XHRcdFx0cm9vdC5sb2FkKHRydWUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdFxyXG5cdH1cclxuXHJcbn0pO1xyXG5cclxuXHJcbn0pKCk7XHJcblxyXG5cclxuXHJcbiJdfQ==
