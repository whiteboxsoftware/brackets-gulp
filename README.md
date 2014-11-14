![gulp](gulpx.png) 
#brackets-gulp

A extension for Brackets to integrate `Gulp.js` to the editor.

## Usage

If there is a `gulpfile.js` in the root directory of the project, a new menu `Gulp` is added.

* `default` item in menu runs the default task.
* The others tasks in gulpfile.js are listed in the menu.

Use the keyboard shortcut `Alt`+`G` to run the `default` task.

If there is a task `brackets-onsave` in the gulpfile.js, it will run when a document is saved, or alternatively, the task `watch` can be used.
