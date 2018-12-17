var gulp 			= require("gulp");
var sass 			= require("gulp-sass");			// Compile SCSS into CSS
var cleanCSS 		= require("gulp-clean-css");	// Minify CSS
var postcss      	= require('gulp-postcss');		// Post CSS processing
var autoprefixer 	= require('autoprefixer');		// PostCSS plugin - Adds vendor prefixes
var concat 			= require("gulp-concat");
var uglifyjs 		= require("uglify-js");
var minifier 		= require("gulp-uglify/minifier");
var pump 			= require("pump");
var rename 			= require("gulp-rename");
var log 			= require("fancy-log");
var babel 			= require('gulp-babel');

var paths = {
	name: "app",
	scss: {
		directoryName: "scss",
		source: ["./scss/**/*.scss", "./scss/**/*.sass"]
	},
	css: {
		destination: "./public/css/"
	},
	js: {
		source: ["./src/**/*.js"],
		destination: "./public/js/",
	}
};

gulp.task("default", ["watch", "scss", "js"]);
gulp.task("compile", ["scss", "js"]);

gulp.task("scss", function (done) {
	gulp.src(paths.scss.source).on("error", log.error)
		.pipe(sass().on("error", sass.logError))
		.pipe(gulp.dest(paths.css.destination).on("error", log.error))
		.pipe(postcss([ autoprefixer() ]).on("error", log.error))
		.pipe(cleanCSS({ relativeTo: paths.scss.directoryName }).on("error", log.error))
		.pipe(rename({ extname: ".min.css" }).on("error", log.error))
		.pipe(gulp.dest(paths.css.destination).on("error", log.error))
		.on("end", done);
});

gulp.task("sass", ["scss"]);

gulp.task("js", function (done) {
	pump([
		gulp.src(paths.js.source).on("error", log.error)
			.pipe(babel({ presets: ['env'] }).on("error", log.error))
			.pipe(concat(paths.name + ".js").on("error", log.error))
			.pipe(gulp.dest(paths.js.destination).on("error", log.error))
			.pipe(rename({ extname: ".min.js" }).on("error", log.error)),
		minifier({ mangle: false }, uglifyjs).on("error", log.error),
		gulp.dest(paths.js.destination).on("error", log.error)
	], done);
});

gulp.task("watch", function () {
	gulp.watch(paths.scss.source, ["scss"]);
	gulp.watch(paths.js.source, ["js"]);
});