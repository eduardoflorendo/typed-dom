const gulp = require('gulp');
const { series, parallel } = gulp;
const glob = require('glob');
const shell = cmd => require('child_process').execSync(cmd, { stdio: [0, 1, 2] });
const del = require('del');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const $ = require('gulp-load-plugins')();
const browserify = require('browserify');
const tsify = require('tsify');
const minify = require('gulp-uglify/composer')(require('uglify-es'), console);
const Server = require('karma').Server;

const pkg = require('./package.json');
const config = {
  browsers: ['Chrome', 'Firefox'].concat((os => {
    switch (os) {
      case 'Windows_NT':
        return [];
      case 'Darwin':
        return [];
     default:
        return [];
    }
  })(require('os').type())),
  ts: {
    dist: {
      src: [
        '*.ts'
      ],
      dest: 'dist'
    },
    test: {
      src: [
        '*.ts',
        'src/**/*.ts',
        'test/**/*.ts'
      ],
      dest: 'dist'
    }
  },
  banner: [
    `/*! ${pkg.name} v${pkg.version} ${pkg.repository.url} | (c) 2016, ${pkg.author} | ${pkg.license} License */`,
    ''
  ].join('\n'),
  module: `
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory);
  } else if (typeof module === 'object' && module.exports) {
      module.exports = factory();
  } else {
      //root.returnExports = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  return require('${pkg.name}');
}));
`,
  clean: [
    'dist',
  ]
};

function compile(src, watch = false) {
  let done = true;
  const b = browserify(Object.values(src).map(p => glob.sync(p)), {
    cache: {},
    packageCache: {},
  })
    .require(`./index.ts`, { expose: pkg.name })
    .plugin(tsify, { global: true, ...require('./tsconfig.json').compilerOptions });
  return bundle();

  function bundle() {
    console.time('bundle');
    return b
      .bundle()
      .on("error", err => done = console.log(err + '') || watch)
      .pipe(source(`${pkg.name}.js`))
      .pipe(buffer())
      .pipe($.derequire())
      .once('finish', () => console.timeEnd('bundle'))
      .once("finish", () => done || process.exit(1))
      .pipe($.footer(config.module));
  }
}

gulp.task('ts:dev', () =>
  gulp.watch(config.ts.test.src, { ignoreInitial: false }, () =>
    compile(config.ts.test.src, true)
      .pipe($.rename({ extname: '.test.js' }))
      .pipe(gulp.dest(config.ts.test.dest))));

gulp.task('ts:test', () =>
  compile(config.ts.test.src)
    .pipe($.rename({ extname: '.test.js' }))
    .pipe(gulp.dest(config.ts.test.dest)));

gulp.task('ts:dist', () =>
  compile(config.ts.dist.src)
    .pipe($.unassert())
    .pipe($.header(config.banner))
    .pipe(gulp.dest(config.ts.dist.dest))
    .pipe($.rename({ extname: '.min.js' }))
    .pipe(minify({ output: { comments: /^!/ } }))
    .pipe(gulp.dest(config.ts.dist.dest)));

gulp.task('karma:dev', done =>
  void new Server({
    configFile: __dirname + '/karma.conf.js',
    browsers: config.browsers,
    preprocessors: {
      'dist/*.js': ['espower']
    },
  }, done).start());

gulp.task('karma:test', done =>
  void new Server({
    configFile: __dirname + '/karma.conf.js',
    browsers: config.browsers,
    preprocessors: {
      'dist/*.js': ['coverage', 'espower']
    },
    reporters: ['dots', 'coverage'],
    concurrency: 1,
    singleRun: true
  }, done).start());

gulp.task('karma:ci', done =>
  void new Server({
    configFile: __dirname + '/karma.conf.js',
    browsers: config.browsers,
    preprocessors: {
      'dist/*.js': ['coverage', 'espower']
    },
    reporters: ['dots', 'coverage', 'coveralls'],
    concurrency: 1,
    singleRun: true
  }, done).start());

gulp.task('clean', () =>
  del(config.clean));

gulp.task('install', done => {
  shell('npm i --no-shrinkwrap');
  done();
});

gulp.task('update', done => {
  shell('ncu -ux del');
  shell('npm i -DE typescript@next --no-shrinkwrap');
  shell('npm i --no-shrinkwrap');
  done();
});

gulp.task('dev',
  series(
    'clean',
    parallel(
      'ts:dev',
      'karma:dev',
    )));

gulp.task('test',
  series(
    'clean',
    series(
      'ts:test',
      'karma:test',
      'ts:dist',
    )));

gulp.task('dist',
  series(
    'clean',
    series(
      'ts:dist',
    )));

gulp.task('ci',
  series(
    'clean',
    series(
      'ts:test',
      'karma:ci',
      'karma:ci',
      'karma:ci',
      'dist',
    )));
