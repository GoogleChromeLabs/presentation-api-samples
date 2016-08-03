'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var path = require('path');


var DIST = 'dist';

var dist = function(subpath) {
  return !subpath ? DIST : path.join(DIST, subpath);
};

var styleTask = function(stylesPath, srcs) {
  return gulp
      .src(
          srcs.map(function(src) { return path.join('app', stylesPath, src); }))
      .pipe($.changed(stylesPath, {extension: '.css'}))
      .pipe(gulp.dest('.tmp/' + stylesPath))
      .pipe($.minifyCss())
      .pipe(gulp.dest(dist(stylesPath)));
};

var optimizeHtmlTask = function(src, dest) {
  var assets = $.useref.assets({searchPath: ['.tmp', 'app']});

  return gulp.src(src)
      .pipe(assets)
      // Concatenate and minify JavaScript
      .pipe($.if ('*.js', $.uglify()))
      // Concatenate and minify styles
      .pipe($.if ('*.css', $.minifyCss()))
      .pipe(assets.restore())
      .pipe($.useref())
      // Minify any HTML
      .pipe($.if ('*.html', $.minifyHtml({
                    quotes: true,
                    empty: true,
                    spare: true
                  })))
      // Output files
      .pipe(gulp.dest(dest));
};

// Compile stylesheets.
gulp.task('styles', function() { return styleTask('styles', ['**/*.css']); });

// Copy all files at the root level.
gulp.task('copy', function() {
  return gulp
      .src(
          ['app/*', '!app/elements', '!app/bower_components', '!**/.DS_Store'],
          {dot: true})
      .pipe(gulp.dest(dist()));
});

// Optimise HTML assets.
gulp.task('html', function() {
  return optimizeHtmlTask(
      ['app/**/*.html', '!app/{elements,bower_components}/**/*.html'], dist());
});

// Vulcanize HTML imports.
gulp.task('vulcanize', function() {
  return gulp.src('app/elements/elements.html')
      .pipe($.vulcanize(
          {stripComments: true, inlineCss: true, inlineScripts: true}))
      .pipe(gulp.dest(dist('elements')));
});

// Clean output directory.
gulp.task('clean', function() { return del(['.tmp', dist()]); });

// Start dev server.
gulp.task('serve', function() {
  browserSync({server: 'app'});

  // Watch files for changes & reload.
  gulp.watch(['app/**/*.html', '!app/bower_components/**/*.html'], reload);
  gulp.watch(['app/styles/**/*.css'], ['styles', reload]);
  gulp.watch(['app/scripts/**/*.js'], reload);
});

// Build and serve the output from the dist build.
gulp.task(
    'serve:dist', ['default'], function() { browserSync({server: dist()}); });

// Build production files, the default task.
gulp.task('default', ['clean'], function(cb) {
  runSequence(['copy', 'styles'], 'html', 'vulcanize', cb);
});
