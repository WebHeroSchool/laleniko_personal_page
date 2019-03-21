const env = require('gulp-env');
const gulp = require('gulp');
const glob = require('glob');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');
const postcss = require('gulp-postcss');
const nested = require('postcss-nested');
const postcssShort = require('postcss-short');
const assets  = require('postcss-assets');
const postcssPresetEnv = require('postcss-preset-env');
const autoprefixer = require('autoprefixer');
const cssnano = require('gulp-cssnano');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const clean = require('gulp-clean');
const rename = require('gulp-rename');
const handlebars = require('gulp-compile-handlebars');
const eslint = require('gulp-eslint');
const stylelint = require('stylelint');
const reporter = require('postcss-reporter');
const filter = require('gulp-filter');

const templateContext = require('./src/templates/variables.json');
const rulesScripts = require('./eslintrc.json');
const rulesStyles = require('./stylelintrc.json');

const paths = {
	src: {
		dir: 'src/templates',
		styles: 'src/**/*.css',
		scripts: 'src/**/*.js'
	},
	build: {
		build: 'build',
		styles: 'build/style',
		scripts: 'build/script',
		fonts: 'build/fonts',
		images: 'build/img'
	},
	buildName: {
		styles: 'index.min.css',
		scripts: 'index.min.js'
	},
	templates: 'src/templates/**/*.hbs',
	lint: {
		scripts: ['*.js', '!node_modules/**/*', '!build/**/*']
	}
};

env({
  file: '.env',
  type: 'ini',
});

gulp.task('compile', () => {
	glob(paths.templates, (err, files) => {
		if (!err) {
			const options = {
				ignorePartials: true,
				batch: files.map(item => item.slice(0, item.lastIndexOf('/')))
			};
			return gulp.src(`${paths.src.dir}/index.hbs`)
				.pipe(handlebars(templateContext, options))
				.pipe(rename('index.html'))
				.pipe(gulp.dest(paths.build.build));

		}
	});
});

gulp.task('jsMove', () => {
	return gulp.src([paths.src.scripts])
		.pipe(sourcemaps.init())
			.pipe(concat(paths.buildName.scripts))
			.pipe(babel({
	            presets: ['@babel/env']
	        }))
			.pipe(gulpif(process.env.NODE_ENV === 'production', uglify()))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.build.scripts));
});

gulp.task('cssMove', () => {
	const plugins = [
		nested, 
		postcssShort,
		assets({
   		}),
   		postcssPresetEnv,
   		autoprefixer({browsers: ['last 1 version']})
		];

	return gulp.src([paths.src.styles])
		.pipe(sourcemaps.init())
			.pipe(postcss(plugins))
	        .pipe(concat(paths.buildName.styles))
	        .pipe(gulpif(process.env.NODE_ENV === 'production', cssnano()))
	    .pipe(sourcemaps.write()) 
		.pipe(gulp.dest(paths.build.styles));
});

gulp.task('fontsMove', () => {
    gulp.src('./src/fonts/**/*')
        .pipe(gulp.dest(paths.build.fonts));
});

gulp.task('imgMove', () => {
    glob('./src/img/**/*', (err, files) => {
        if (!err) {
            gulp.src(files)
                .pipe(gulp.dest(paths.build.images));
        }
    });
});

gulp.task('clean', () => {
	return gulp.src(paths.build.build, {read: false})
        .pipe(clean());
});

gulp.task('browser-sync', () => {
    browserSync.init({
        server: {
            baseDir: './build'
        }
    });

    gulp.watch(paths.src.styles, ['cssMove-watch']);
	gulp.watch(paths.src.scripts, ['jsMove-watch']);
	gulp.watch(paths.templates, ['compile-watch']);
});

gulp.task('cssMove-watch', ['cssMove'], () => browserSync.reload());
gulp.task('jsMove-watch', ['jsMove'], () => browserSync.reload());
gulp.task('compile-watch', ['compile'], () => browserSync.reload());

gulp.task('eslint', () => {
	gulp.src(paths.lint.scripts)
		.pipe (eslint(rulesScripts))
		.pipe(eslint.format());
});

gulp.task('stylelint', () => {
	gulp.src(paths.src.styles)
		.pipe(postcss([
			stylelint(rulesStyles),
			reporter({
				clegarMessages:true,
				throwError: false
			})

			]));
});

gulp.task('lint', ['eslint', 'stylelint']);
gulp.task('build', ['jsMove', 'cssMove', 'compile', 'fontsMove', 'imgMove']);
gulp.task('dev', ['build', 'browser-sync']);
gulp.task('prod', ['build']);

