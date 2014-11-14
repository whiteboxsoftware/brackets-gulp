/*jshint -W101 */
/*global $, define, brackets */

define(function (require, exports, module) {
  'use strict';

  var cmd;

  var ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
    CommandManager = brackets.getModule('command/CommandManager'),
    KeyBindingManager = brackets.getModule('command/KeyBindingManager'),
    NodeDomain     = brackets.getModule('utils/NodeDomain'),
    DocumentManager = brackets.getModule('document/DocumentManager'),
    ProjectManager = brackets.getModule('project/ProjectManager'),
    WorkspaceManager = brackets.getModule('view/WorkspaceManager'),
    FileSystem = brackets.getModule('filesystem/FileSystem'),
    FileUtils = brackets.getModule('file/FileUtils'),
    Menus = brackets.getModule('command/Menus'),
    AppInit = brackets.getModule('utils/AppInit'),
    icon = require.toUrl('gulp.png');



  var gulpMenu, root, hasGulp, tasks, bracketsOnsave;

  var gulpDomain = new NodeDomain('gulpDomain', ExtensionUtils.getModulePath(module, 'backend.js'));

  $(gulpDomain.connection).on('gulp.update', function (evt, data) {
    //console.log('evntData', '|'+data+'|');
    formOutput.appendOutput(data);
    if (data.match(/error/) || data.match(/Error/)) {
      formOutput.panelOut.show();
    }
  });
  
  $(gulpDomain.connection).on('gulp.error', function (evt, data) {
    console.log('error', '|'+data+'|');
    formOutput.appendOutput(data);
    formOutput.panelOut.show();
  });
  
  $(gulpDomain.connection).on('gulp.tasks', function (evt, data) {
    tasks = data.split(/\n/);
    bracketsOnsave = tasks.indexOf('brackets-onsave');
    if (bracketsOnsave === -1) {bracketsOnsave = null;}
    tasks.forEach(function(task) {
      if (task && task !== 'default') {
        if (!CommandManager.get('djb.brackets-gulp.'+task)) {
          CommandManager.register(task, 'djb.brackets-gulp.'+task, function () {
            gulpDomain.exec('gulp', task, root, false);
          });
        }
        gulpMenu.addMenuItem('djb.brackets-gulp.'+task);
      }
    });
  });
  
  var $icon  = $('<a id="brackets-gulp-toggle" title="Gulp" class="brackets-gulp-icon" style="background-size:contain;background-image:url(\''+icon+'\');" href="#"> </a>')
  .appendTo($('#main-toolbar .buttons'));
  
  var formOutput = {
    panelOutHtml: require('text!panel_output.html'),
    panelOut: null,
    elem: null,
    boton: null,
    actual: null,
    actualizar: function(src,txt){},
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
    root = ProjectManager.getInitialProjectPath();
    FileSystem.resolve(root+'gulpfile.js', function(exist) {
      if (exist !== 'NotFound') {
        hasGulp = true;
        $(DocumentManager).on('documentSaved', function() {
          if (hasGulp && bracketsOnsave) {
            gulpDomain.exec('gulp','brackets-onsave', root, false);
          }
        });
        gulpMenu = Menus.addMenu('Gulp', 'djb.gulp-menu');
        if (!Menus.getMenuItem('djb.brackets-gulp.gulp')) {
          if (!CommandManager.get('djb.brackets-gulp.gulp')) {
            CommandManager.register('default', 'djb.brackets-gulp.gulp', function () {
                gulpDomain.exec('gulp', '', root, false);
            });
          }
          gulpMenu.addMenuItem('djb.brackets-gulp.gulp', 'Alt-G');
          gulpMenu.addMenuDivider();
        }
        gulpDomain.exec('gulp', '--tasks-simple', root, false);

      } else {
        hasGulp = false;
      }
    });
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
    $(ProjectManager).on('projectOpen', function() {
      loadMenu();
    });
  });

    
});
