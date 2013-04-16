/*
    @墨智
    1. 压缩 HTML、JS、CSS。
    2. 合并 Magix View 的 HTML 模板和 JS。
*/
'use strict';
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        componentjs: {
            componentjs: {
                files: {
                    "build/components/": "components/"
                }
            }
        },
        clean: {
            before: ["build/"],
            after: {
                expand: true,
                cwd: 'build/',
                src: ['**/*-min.js', '**/*-min.html']
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            dist: {}
        },
        viewconcat: {
            options: {},
            view: {
                expand: true,
                cwd: 'build/app/',
                src: ['**/*.html'],
                dest: 'build/app/',
                ext: '.js'
            }
        },
        uglify: {
            options: {
                // banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            app: {
                expand: true,
                cwd: 'app/',
                src: ['**/*.js', '!**/*-min.js'],
                dest: 'build/app/',
                ext: '.js' // '-min.js'
            },
            boot: {
                expand: true,
                cwd: 'boot/',
                src: ['**/*.js', '!**/*-min.js'],
                dest: 'boot/',
                ext: '-min.js'
            },
            libs: {
                expand: true,
                cwd: 'libs/',
                src: ['**/*.js', '!**/*-min.js'],
                dest: 'libs/',
                ext: '-min.js'
            },
            log: {
                expand: true,
                cwd: 'log/',
                src: ['**/*.js', '!**/*-min.js'],
                dest: 'log/',
                ext: '-min.js'
            }
        },
        cssmin: {
            options: {},
            assets: {
                expand: true,
                cwd: 'assets/',
                src: ['**/*.css', '!**/*-min.css'],
                dest: 'assets/',
                ext: '-min.css'
            }
        },
        htmlmin: {
            options: {
                removeComments: true,
                collapseWhitespace: true,
                collapseBooleanAttributes: true
            },
            app: {
                expand: true,
                cwd: 'app/',
                src: ['**/*.html'], // , '!**/*-min.html'
                dest: 'build/app/',
                ext: '.html'
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'package.json', 'tasks/**/*.js', 'app/**/*.js', 'components/**/*.js'], // 
            options: {
                jshintrc: '.jshintrc'
            }
        },
        qunit: {
            files: ['test/**/*.html']
        },
        watch: {
            files: ['<%= jshint.files %>', 'app/**/*.*'],
            tasks: [
                'jshint',
                'clean:before', 'qunit', 'uglify',
                'cssmin', 'htmlmin',
                'viewconcat',
                'clean:after']
        },
        connect: {
            server: {
                options: {
                    port: 5000,
                    base: '.',
                    host: '0.0.0.0'
                }
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
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-clean');

    //tasks
    grunt.loadTasks('tasks');

    // Default task.
    grunt.registerTask('default', [
        'jshint',
        'clean:before', 'qunit', 'uglify',
        'cssmin', 'htmlmin',
        'viewconcat',
        'clean:after',
        'connect', 'watch']);

};