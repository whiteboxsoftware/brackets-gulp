/*global $, define, brackets */

define(function (require, exports, module) {
  'use strict';

  var cmd;

  var ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
    CommandManager = brackets.getModule('command/CommandManager'),
    NodeDomain     = brackets.getModule('utils/NodeDomain'),
    DocumentManager = brackets.getModule('document/DocumentManager'),
    ProjectManager = brackets.getModule('project/ProjectManager'),
    FileSystem = brackets.getModule('filesystem/FileSystem'),
    FileUtils = brackets.getModule('file/FileUtils'),
    Menus = brackets.getModule('command/Menus'),
    AppInit = brackets.getModule('utils/AppInit');

  var GulpMenu, root, hasGulp, tasks;

  var gulpDomain = new NodeDomain('gulpDomain', ExtensionUtils.getModulePath(module, 'backend.js'));

  $(gulpDomain.connection).on('gulp.update', function (evt, data) {
    console.log('evntData', '|'+data+'|');
    //if (data.trim().substr(0,5) === 'error') {
        formOutput.appendOutput(data);
        formOutput.panelOut.show();
    //}
  });
  
  $(gulpDomain.connection).on('gulp.tasks', function (evt, data) {
      console.log('evntTasks', '|'+data+'|');
      tasks = data.split(/\n/);
      GulpMenu.addMenuDivider();
      tasks.forEach(function(task) {
        if (task && task !== 'default') {
          CommandManager.register(task, 'brackets-gulp.'+task, function () {
            gulpDomain.exec('gulp', task, root, false);
          });
          GulpMenu.addMenuItem('brackets-gulp.'+task);
        }
      });
  });

  $(gulpDomain.connection).on('gulp.tasks', function (evt, data) {
    console.log('evntTasks', '|'+data+'|');
  });
  
  
  var formOutput = {
    WorkspaceManager: brackets.getModule('view/WorkspaceManager'),
    panelOutHtml: require('text!panel_output.html'),
    panelOut: null,
    elem: null,
    boton: null,
    actual: null,
    actualizar: function(src,txt){},
    appendOutput: function (output) {
      if (!this.panelOut) {
        this.panelOut = this.WorkspaceManager.createBottomPanel('brackets.gulp.output', $(this.panelOutHtml));
        $('.close', $('#brackets-gulp-output')).click(function () {
        formOutput.panelOut.hide();
        });
        $('#status-indicators').prepend('<div id="brackets-gulp-toggle">Gulp</div>');
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
    root = ProjectManager.getInitialProjectPath();
    FileSystem.resolve(root+'gulpfile.js', function(exist) {
      if (exist !== 'NotFound') {
        hasGulp = true;
        $(DocumentManager).on('documentSaved', function() {
          if (hasGulp) {
            gulpDomain.exec('gulp','brackets-onsave', root, false);
          }
        });
        GulpMenu = Menus.addMenu('Gulp', 'gulp-menu');
        CommandManager.register('default', 'brackets-gulp.gulp', function () {
            gulpDomain.exec('gulp', '', root, false);
        });
        GulpMenu.addMenuItem('brackets-gulp.gulp', 'Alt-G');
        gulpDomain.exec('gulp', '--tasks-simple', root, false);

      } else {
        hasGulp = false;
        if (GulpMenu) {
          GulpMenu.removeMenuItem('brackets-gulp.gulp');
          tasks.forEach(function(task) {
            if (task && task !== 'default') {
              GulpMenu.remveMenuItem('brackets-gulp.'+task);
            }
          });
          Menus.removeMenu('gulp-menu');
        }
      }
    });
	} 
	
	AppInit.appReady(function () {

      var $icon  = $('<a class="brackets-gulp-icon" style="background: url(./extension/dev/gulp.png);" href="#"> </a>')
      .attr('title', 'Gulp')
      .appendTo($('#main-toolbar .buttons'));

      loadMenu();
      $(ProjectManager).on('projectOpen', function() { 
        loadMenu();
      });
	});
	
	
	

    
});
