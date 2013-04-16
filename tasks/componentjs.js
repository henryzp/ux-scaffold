/*
 * Copyright (c) 2012 左莫
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
    // Grunt utilities.
    var task = grunt.task;
    var file = grunt.file;
    var utils = grunt.utils;
    var log = grunt.log;
    var verbose = grunt.verbose;
    var fail = grunt.fail;
    var option = grunt.option;
    var config = grunt.config;
    var template = grunt.template;

    // external dependencies
    var fs = require('fs');
    var path = require('path');

    // ==========================================================================
    // TASKS
    // ==========================================================================
    grunt.registerMultiTask('componentjs', 'Compile Component JS files.', function() {
        var concatConfig = {
            options: {
                separator: '\n'
            }
        };
        var uglifyConfig = {
            options: {
                beautify: {
                    ascii_only: true
                }
            }
        };

        function foo(srcPath, destPath) {
            var srcFile = path.join(srcPath, 'index.js');
            var destFile = path.join(destPath, 'index.js');
            if (fs.existsSync(srcFile)) {
                var arr = [srcFile];
                var tempArr = fs.readdirSync(srcPath);
                tempArr.forEach(function(f) {
                    if (file.isDir(srcPath, f)) {
                        //递归查找所有配置
                        foo(path.join(srcPath, f), path.join(destPath, f));
                    } else if (path.extname(f) == '.js' && path.basename(f) != 'index.js') {
                        arr.push(srcPath + f);
                    }
                });

                if (arr.length > 1) {
                    concatConfig[srcPath] = {
                        src: arr,
                        dest: destFile
                    }
                } else {
                    file.copy(srcFile, destFile)
                }

                uglifyConfig[srcPath] = {
                    files: {}
                };

                uglifyConfig[srcPath].files[path.join(destPath, 'index-min.js')] = [destFile];
            }
        }
        this.files.forEach(function(f) {
            var src = f.src[0];
            var dest = f.dest;

            var self = this;
            var files = fs.readdirSync(src);

            files.forEach(function(p) {
                var srcPath = path.join(src, p),
                    destPath = path.join(dest, p);
                foo(srcPath, destPath);
            });
            config('concat', concatConfig);
            task.run('concat');

            //对tmpl的获取和替换
            config('componenttmpl', uglifyConfig)
            task.run('componenttmpl');

            config('uglify', uglifyConfig);
            task.run('uglify');
        });
    });
};