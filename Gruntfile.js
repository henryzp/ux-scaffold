module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        componentjs:{
            componentjs: {
                files: {
                    "build/components/": "components/"
                }
            }
        },
        jshint: {
            files: ['app/*.js','app/**/*.js','components/**/*.js'],
            options: {
                browser: true,
                curly: true,
                eqeqeq: false,
                immed: true,
                latedef: true,
                newcap: false,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                evil: true,
                expr: true,
                laxcomma: true,
                globals: {
                    exports: true,
                    module: false,
                    KISSY: true,
                    console: true,
                    print: true,
                    document: true,
                    window: true,
                    Brix:true,
                    Magix:true
                }
            }
        },
        connect: {
          server: {
            options: {
              port: 5000,
              base: '.',
              host: '0.0.0.0'
            }
          }
        },
        watch: {
            jshint:{
                files: ['app/*.js','app/**/*.js','components/**/*.js'],
                tasks: ['jshint']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    //tasks
    grunt.loadTasks('tasks');

    // Default task.
    grunt.registerTask('default', ['jshint','componentjs','connect','watch']);

};