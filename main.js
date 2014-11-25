/*jshint -W101 */
/*global $, define, brackets */

define(function (require, exports, module) {
	'use strict';

	var cmd;

	var ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
		CommandManager = brackets.getModule('command/CommandManager'),
		KeyBindingManager = brackets.getModule('command/KeyBindingManager'),
		NodeDomain = brackets.getModule('utils/NodeDomain'),
		DocumentManager = brackets.getModule('document/DocumentManager'),
		ProjectManager = brackets.getModule('project/ProjectManager'),
		WorkspaceManager = brackets.getModule('view/WorkspaceManager'),
		FileSystem = brackets.getModule('filesystem/FileSystem'),
		FileUtils = brackets.getModule('file/FileUtils'),
		Menus = brackets.getModule('command/Menus'),
		AppInit = brackets.getModule('utils/AppInit'),
		icon = require.toUrl('gulp.png');

	//bracketsOnSave: index in tasks array of brackets-onsave, task to run whenever a document is saved, or null if task not defined.
	//bracketsDefault: index in the tasks array of brackets-default, task to run as default when gulp is run from within Brackets, or null if task not defined.
	var gulpMenu, path, hasGulp, tasks, bracketsOnsave, bracketsDefault,
		gulpDomain = new NodeDomain('gulpDomain', ExtensionUtils.getModulePath(module, 'backend.js'));

	$(gulpDomain.connection).on('gulp.update', function (evt, data) {
		//console.log('evntData', '|'+data+'|');
		formOutput.appendOutput(data);
		if (data.match(/error/) || data.match(/Error/)) {
			formOutput.panelOut.show();
		}
	});

	$(gulpDomain.connection).on('gulp.error', function (evt, data) {
		console.log('error', '|' + data + '|');
		formOutput.appendOutput(data);
		formOutput.panelOut.show();
	});

	$(gulpDomain.connection).on('gulp.tasks', function (evt, data) {
		tasks = data.split(/\n/);
		bracketsOnsave = tasks.indexOf('brackets-onsave');
		if (bracketsOnsave === -1) {
			bracketsOnsave = null;
		}
		bracketsDefault = tasks.indexOf('brackets-default');
		if (bracketsDefault === -1) {
			bracketsDefault = null;
		}
		tasks.forEach(function (task) {
			if (task && task !== (bracketsDefault !== null ? 'brackets-default' : 'default')) {
				if (!CommandManager.get('djb.brackets-gulp.' + task)) {
					CommandManager.register(task, 'djb.brackets-gulp.' + task, function () {
						gulpDomain.exec('gulp', task, path, false);
					});
				}
				gulpMenu.addMenuItem('djb.brackets-gulp.' + task);
			}
		});
	});

	var $icon = $('<a id="brackets-gulp-toggle" title="Gulp" class="brackets-gulp-icon" style="background-size:contain;background-image:url(\'' + icon + '\');" href="#"> </a>')
		.appendTo($('#main-toolbar .buttons'));

	var formOutput = {
		panelOutHtml: require('text!panel_output.html'),
		panelOut: null,
		elem: null,
		boton: null,
		actual: null,
		actualizar: function (src, txt) {},
		appendOutput: function (output) {
			if (!this.panelOut) {
				this.panelOut = WorkspaceManager.createBottomPanel('brackets.gulp.output', $(this.panelOutHtml));
				$('.close', $('#brackets-gulp-output')).click(function () {
					formOutput.panelOut.hide();
				});
				//$('#status-indicators').prepend('<div id="brackets-gulp-toggle">Gulp</div>');
				this.boton = $('#brackets-gulp-toggle');
				this.boton.click(function () {
					if (formOutput.panelOut.isVisible()) {
						formOutput.panelOut.hide();
					} else {
						formOutput.panelOut.show();
					}
				});
				this.elem = $('#brackets-gulp-console');
			}
			output = output.trim() || '';
			this.elem.append('<p>' + output + '</p>');
			this.elem[0].scrollTop = this.elem[0].scrollHeight;
		}
	};


	function loadMenu(tasks) {
		destroyMenu();
		locateGulpRoot(ProjectManager.getProjectRoot().fullPath, function (err, gulpRoot) {
			if (err || gulpRoot === null) {
				hasGulp = false;
				return;
			}

			hasGulp = true;
			$(DocumentManager).on('documentSaved', function () {
				if (hasGulp && bracketsOnsave) {
					gulpDomain.exec('gulp', 'brackets-onsave', gulpRoot, false);
				}
			});
			destroyMenu();
			gulpMenu = Menus.addMenu('Gulp', 'djb.gulp-menu');
			if (!Menus.getMenuItem('djb.brackets-gulp.gulp')) {
				if (!CommandManager.get('djb.brackets-gulp.gulp')) {
					var defaultTitle, defaultTask;
					if (bracketsDefault !== null){
						defaultTitle = 'Default (brackets-default)'; defaultTask = 'brackets-default';
					} else {
						defaultTitle = 'Default'; defaultTask = '';
					}
					CommandManager.register(defaultTitle, 'djb.brackets-gulp.gulp', function () {
							gulpDomain.exec('gulp', defaultTask, gulpRoot, false);
						});

				}
				gulpMenu.addMenuItem('djb.brackets-gulp.gulp', 'Alt-G');
				gulpMenu.addMenuDivider();
			}
			gulpDomain.exec('gulp', '--tasks-simple', gulpRoot, false);
		});
	}

	function locateGulpRoot(candidatePath, foundCallback) {

		var gulpfileNotFound = function () {
				console.log("Gulpfile not found.");
				foundCallback(null, null);
				return undefined;
			},
			locate = function (candidatePath) {
				if (!candidatePath)
					return gulpfileNotFound(foundCallback);

				console.log("Looking for gulpfile in '%s'", candidatePath);
				FileSystem.resolve(candidatePath + 'gulpfile.js', function (exist) {
					if (exist !== 'NotFound')
						return foundCallback(null, candidatePath);
					if (candidatePath.split('/').length - 1 === 1)
						return gulpfileNotFound(foundCallback);

					FileSystem.resolve(candidatePath + "..", function (err, entry) {
						locate(err ? null : entry.fullPath);
					});
				});
			};

		locate(candidatePath);
	}


	function destroyMenu() {
		tasks = [];
		if (Menus.getMenu('djb.gulp-menu')) {
			KeyBindingManager.removeBinding('Alt-G');
			Menus.removeMenu('djb.gulp-menu');
		}
		bracketsOnsave = null;
	}


	AppInit.appReady(function () {
		loadMenu();
		$(ProjectManager).on('projectOpen', function () {
			loadMenu();
		});
	});


});
