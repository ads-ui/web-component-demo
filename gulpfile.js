var gulp = require('gulp');
var babel = require('gulp-babel');
var sass = require('gulp-sass');
var webpack = require("webpack");
var eslint = require('gulp-eslint');
var path = require('path');
var childProcess = require('child_process');
var del = require('del');
var source = require('vinyl-source-stream');
var vinylBuffer = require('vinyl-buffer');
var nsGen = require('ns-gen');

require('babel/register');

//get the bin path of package
function getBinPath(name) {
  if(process.platform === 'win32') name += '.cmd';
  return path.resolve(__dirname, 'node_modules/.bin/', name);
}

// Run npm package bin command, such as 'karma'
function runNpmCmd(cmdName, args, options, callback) {
  if(!Array.isArray(args)) {
    callback = options;
    options = args;
    args = [];
  }
  if(typeof options !== 'object') {
    callback = options;
    options = {};
  }
  options = Object.assign({}, options, {stdio: 'inherit'});
  var cp = childProcess.spawn(getBinPath(cmdName), args, options);
  cp.on('close', function() { callback && callback(); });
  cp.on('error', function(err) { callback && callback(err); });
}

gulp.task('generate-ns:js', () => {
  var stream = source('nsName.js');
  stream.write(nsGen.generateJsFile());
  stream.end();
  return stream.pipe(vinylBuffer()).pipe(gulp.dest('src/'));
});

gulp.task('generate-ns:sass', () => {
  var stream = source('ns-name.scss');
  stream.write(nsGen.generateSassFile('css-ns'));
  stream.end();
  return stream.pipe(vinylBuffer()).pipe(gulp.dest('styles/'));
});

gulp.task('generate-ns', ['generate-ns:js', 'generate-ns:sass'])

gulp.task('build-babel', ['generate-ns'], function() {
  var fs = require('fs');
  var config = JSON.parse(fs.readFileSync('./.babelrc'));
  return gulp.src('src/**/*.js')
    .pipe(babel(config))
    .pipe(gulp.dest('lib/'));
});

gulp.task('build-sass', ['generate-ns'], function() {
  return gulp.src('styles/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['build-babel', 'build-sass']);

gulp.task('webpack:build-minimize', ['generate-ns'], function(callback) {
  runNpmCmd('webpack', ['-p'], callback);
});

gulp.task('webpack:build', ['generate-ns'], function(callback) {
  runNpmCmd('webpack', callback);
});

gulp.task('dist', ['webpack:build', 'webpack:build-minimize']);

gulp.task('lint', function() {
  return gulp.src('src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('test', ['generate-ns'], function(callback) {
  runNpmCmd('karma', ['start', '--single-run'], callback);
});

gulp.task('test-coverage', ['generate-ns'], function(callback) {
  var options = {env: {'COVERAGE': true}};
  runNpmCmd('karma', ['start', '--single-run'], options, callback);
});

gulp.task('test-watch', ['generate-ns'], function(callback) {
  runNpmCmd('karma', ['start'], callback);
});

gulp.task('clean', function(callback) {
  return del(['dist/', 'lib/']);
});

gulp.task('default', ['build', 'dist']);
