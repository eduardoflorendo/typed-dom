const gulp = require('gulp');
const shell = cmd => require('child_process').execSync(cmd, {stdio:[0,1,2]});
const del = require('del');
const extend = require('extend');
const seq = require('run-sequence');
const $ = require('gulp-load-plugins')({
  //pattern: ['gulp-*', 'gulp.*'],
  //replaceString: /\bgulp[\-.]/
});
const Server = require('karma').Server;

const pkg = require('./package.json');
const karmaconfig = require('./karma.conf.js');
const config = {
  ts: {
    options: extend(require('./tsconfig.json').compilerOptions, {
      typescript: require('typescript')
    }),
    source: {
      src: [
        'typings/*.d.ts',
        '*.ts',
        'src/**/*.ts'
      ],
      dest: 'dist/'
    },
    dist: {
      src: [
        'typings/*.d.ts',
        '*.ts',
        'src/**/*.d.ts',
        'src/**/+([!.]).ts'
      ],
      dest: 'dist/'
    },
    test: {
      src: [
        'typings/*.d.ts',
        'test/**/*.ts'
      ],
      dest: 'test/'
    }
  },
  banner: [
    `/*! ${pkg.name} v${pkg.version} ${pkg.repository.url} | (c) 2016, ${pkg.author} | ${pkg.license.type} License (${pkg.license.url}) */`,
    ''
  ].join('\n'),
  exporter:
`define = typeof define === 'function' && define.amd
  ? define
  : (function () {
    'use strict';
    var name = '${pkg.name}',
        workspace = {};
    return function define(m, rs, f) {
      return !f
        ? void define(name, m, rs)
        : void f.apply(this, rs.map(function (r) {
          switch (r) {
            case 'require': {
              return typeof require === 'function' ? require : void 0;
            }
            case 'exports': {
              return m.indexOf('/') === -1
                ? workspace[m] = typeof exports === 'undefined' ? self[m] = self[m] || {} : exports
                : workspace[m] = workspace.hasOwnProperty(m) ? workspace[m] : {};
            }
            default: {
              return r.slice(-2) === '.d' && {}
                  || workspace.hasOwnProperty(r) && workspace[r]
                  || typeof require === 'function' && require(r)
                  || self[r];
            }
          }
        }));
    };
  })();
`,
  clean: {
    src: 'src/**/*.js',
    dist: 'dist',
    test: 'test/**/*.js',
    bench: 'benchmark/**/*.js',
    cov: 'coverage'
  },
  karma: {
    watch: extend({}, require('./karma.conf.js'), {
      browsers: ['Chrome'],
      preprocessors: {
        'dist/*.js': ['espower'],
        'test/**/*.js': ['espower']
      },
      singleRun: false
    }),
    test: extend({}, require('./karma.conf.js'), {
      browsers: ['Chrome', 'Firefox', 'IE11', 'IE10', 'IE9'],
      reporters: ['dots'],
      preprocessors: {
        'dist/*.js': ['espower'],
        'test/**/*.js': ['espower']
      },
      singleRun: true
    }),
    server: extend({}, require('./karma.conf.js'), {
      browsers: ['Chromium', 'Firefox'],
      reporters: ['dots'],
      preprocessors: {
        'dist/*.js': ['espower'],
        'test/**/*.js': ['espower']
      },
      singleRun: true
    })
  }
};

gulp.task('ts:source', function () {
  return gulp.src(config.ts.source.src)
    .pipe($.typescript(Object.assign({
      outFile: `${pkg.name}.js`
    }, config.ts.options)))
    .pipe($.header(config.exporter))
    .pipe(gulp.dest(config.ts.source.dest));
});

gulp.task('ts:dist', function () {
  return gulp.src(config.ts.dist.src)
    .pipe($.typescript(Object.assign({
      outFile: `${pkg.name}.js`
    }, config.ts.options)))
    .once("error", function () {
      this.once("finish", () => process.exit(1));
    })
    .pipe($.unassert())
    .pipe($.header(config.exporter))
    .pipe($.header(config.banner))
    .pipe(gulp.dest(config.ts.dist.dest))
    .pipe($.uglify({ preserveComments: 'license' }))
    .pipe($.rename({ extname: '.min.js' }))
    .pipe(gulp.dest(config.ts.dist.dest));
});

gulp.task('ts:test', function () {
  return gulp.src(config.ts.test.src)
    .pipe($.typescript(Object.assign({
    }, config.ts.options)))
    .pipe(gulp.dest(config.ts.test.dest));
});

gulp.task('ts:watch', function () {
  gulp.watch(config.ts.source.src, ['ts:source']);
  gulp.watch(config.ts.test.src, ['ts:test']);
});

gulp.task('mocha:watch', function () {
  gulp.watch(config.ts.source.dest + '*.js', ['mocha:test']);
});

gulp.task('mocha:test', function () {
  return gulp.src(config.ts.source.dest + '*.js', { read: false })
    .pipe($.mocha({
      require: ['intelli-espower-loader'],
      reporter: 'dot'
    }));
});

gulp.task('karma:watch', function (done) {
  new Server(config.karma.watch, done).start();
});

gulp.task('karma:test', function (done) {
  new Server(config.karma.test, done).start();
});

gulp.task('karma:server', function (done) {
  new Server(config.karma.server, done).start();
});

gulp.task('clean', function () {
  return del([config.clean.src, config.clean.dist, config.clean.test, config.clean.bench]);
});

gulp.task('install', function () {
  shell('npm i');
  shell('tsd install --save --overwrite');
});

gulp.task('update', function () {
  shell('npm-check-updates -u');
  shell('npm i');
  //shell('tsd update --save --overwrite');
});

gulp.task('build', ['clean'], function (done) {
  seq(
    ['ts:source', 'ts:test'],
    done
  );
});

gulp.task('watch', ['build'], function () {
  seq([
    'ts:watch',
    'karma:watch'
  ]);
});

gulp.task('test', ['build'], function (done) {
  seq(
    'karma:test',
    function () {
      done();
    }
  );
});

gulp.task('dist', ['clean'], function (done) {
  seq(
    'ts:dist',
    done
  );
});

gulp.task('server', function (done) {
  seq(
    'build',
    'karma:server',
    'dist',
    function () {
      done();
    }
  );
});
