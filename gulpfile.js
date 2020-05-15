'use strict'

// IMPORT
// ----------------------------------------------------------------------------
	const gulp = require('gulp')
	const gulpTS = require('gulp-typescript')
	const gulpTSLint = require('gulp-tslint').default
	const gulpSourcemaps = require('gulp-sourcemaps')
	const gulpNodemon = require('gulp-nodemon')
	const tsLint = require('tslint')
	const del = require('del')
	const path = require('path')

// PREPARE PROJECT
// ----------------------------------------------------------------------------
	const project = gulpTS.createProject('tsconfig.json')
	const typeCheck = tsLint.Linter.createProgram('tsconfig.json')

// LINT TASK
// ----------------------------------------------------------------------------
	gulp.task('lint', () => {
		return gulp.src('./src/**/*.ts')
			.pipe(gulpTSLint({
				configuration: 'tslint.json',
				formatter: 'verbose',
				program: typeCheck
			}))
			.pipe(gulpTSLint.report())
	})

// BUILD
// ----------------------------------------------------------------------------
	gulp.task('build', ['lint'], () => {
		// => Delete old files
			del.sync(['./build/**/*.*'])
		// => Copy files
			gulp.src('./src/**/*.yml')
				.pipe(gulp.dest('build/'))
		// => Compile TS files
			const tsCompile = gulp.src('./src/**/*.ts')
				.pipe(gulpSourcemaps.init())
				.pipe(project())
			return tsCompile.js
				.pipe(gulpSourcemaps.write({
					sourceRoot: file => path.relative(path.join(file.cwd, file.path),
					file.base)
				}))
				.pipe(gulp.dest('build/'))
	})

// WATCH
// ----------------------------------------------------------------------------
	gulp.task('watch', ['build'], function() {
		gulp.watch('./src/**/*.ts', ['build'])
	})

// START
// ----------------------------------------------------------------------------
	gulp.task('start', ['build'], function() {
		return gulpNodemon({
			script: './build/index.js',
			watch: './build/index.js'
		})
	})

// SERVER
// ----------------------------------------------------------------------------
	gulp.task('serve', ['watch'], function() {
		return gulpNodemon({
			script: './build/index.js',
			watch: './build/'
		})
	});