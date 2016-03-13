/*
Reading material:

http://chris.house/blog/grunt-configuration-for-react-browserify-babelify/
https://www.reddit.com/r/javascript/comments/352f83/using_browserify_babelify_with_es6_modules_anyway/
http://www.sitepoint.com/setting-up-es6-project-using-babel-browserify/
https://babeljs.io/docs/setup/#browserify

https://github.com/babel/babelify
https://github.com/jmreidy/grunt-browserify
https://github.com/substack/watchify
https://github.com/vuejs/vueify
*/

var SSI = require('node-ssi')
var ssi = new SSI({baseDir: './dist', encoding: 'utf-8'})
var fs = require('fs')
var path = require('path')
var url = require('url')
var S = require('string')

module.exports = grunt => {
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: { // https://github.com/gruntjs/grunt-contrib-watch
      browserify: {
        files: ['<%= browserify.dist.files["dist/app.js"] %>'],
        tasks: ['browserify']
      },
      livereload: {
        options: { livereload: true }, // port 35729 by default
        files: ['dist/**/*']
      }
    },

    browserify: {
      dist: {
        options: {
          transform: [['babelify', {presets: ['es2015', 'stage-3']}]]
        },
        files: { 'dist/app.js': ['frontend/**/*.js', '!frontend/_static/**'] }
      }
    },

    copy: {
      resources: { // TODO: these might be moved to a git submodule later
        cwd: 'frontend/_static/',
        src: ['css/**', 'images/**', 'js/vendor/**'],
        dest: 'dist',
        expand: true
      },
      frontend: {
        cwd: 'frontend/',
        src: ['**', '!_*/**', '!**/*.md'], // folders with _ don't get copied
        dest: 'dist',
        expand: true
      }
    },

    clean: { dist: ['dist/*'] },

    connect: { // https://github.com/gruntjs/grunt-contrib-connect
      options: {
        port: 8000,
        base: 'dist',
        livereload: true,
        middleware: (connect, opts, middlewares) => {
          middlewares.unshift((req, res, next) => {
            var f = url.parse(req.url).pathname
            f = path.join('dist', S(f).endsWith('/') ? f + 'index.html' : f)
            // grunt.log.writeln(`request for: ${req.url}`)
            if (S(f).endsWith('.html') && fs.existsSync(f)) {
              ssi.compileFile(f, (err, content) => {
                if (err) {
                  console.error(err.stack)
                  throw err
                }
                console.log(`Req: ${req.url} => sending node-ssi parsed file: ${f}`)
                res.end(content)
              })
            } else {
              next()
            }
          })
          return middlewares
        }
      },
      dev: {}
    }

    // TODO: see also
    //       https://github.com/vuejs/vueify
    //       https://github.com/lud2k/grunt-serve
    //       https://github.com/substack/watchify
    //       https://github.com/AgentME/browserify-hmr
    //       https://medium.com/@dan_abramov/the-death-of-react-hot-loader-765fa791d7c4

  })
  grunt.registerTask('default', [])
    // TODO: run npm scripts from package.json using: grunt-shell + grunt-execute
    //       you can also take a page from DNSChain:
    //       https://github.com/okTurtles/dnschain/blob/ea2eddd62c8e42322eaea86db304783a47049802/Gruntfile.coffee#L51-L79
  grunt.registerTask('dev', ['connect', 'watch'])
  grunt.registerTask('build', ['copy', 'browserify'])
  grunt.registerTask('dist', ['build'])
}