'use strict';

const gulp = require('gulp');
const jasmine = require('gulp-jasmine');

gulp.task('test', function () {
    return gulp.src('spec/*_spec.js')
        .pipe(jasmine());
});