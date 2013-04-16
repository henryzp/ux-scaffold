/*
 * Copyright (c) 2013 左莫
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
    grunt.registerMultiTask('componenttmpl', 'Compile Component TMPL files.', function() {
        var srcPath = this.nameArgs.split(':')[1];
        this.files.forEach(function(f) {
            //对tmpl的获取和替换
            var destPath = f.src[0];
            var str = file.read(destPath);
            var reg = /@TEMPLATE\|(.*?)\|TEMPLATE@/g;
            if (reg.test(str)) {
                str = str.replace(reg, function($1, $2, $3) {
                    var reg = /Brix\.absoluteFilePath\(.*(?:'|")(.*)?(?:'|")\)/g;
                    var result = reg.exec($2);
                    if (result) {
                        var fileName = result[1];
                        var html = file.read(path.join(srcPath, fileName));
                        html = html.replace(/>\s*?</g, '><') //
                        .replace(/\n+/g, '') //
                        .replace(/\r+/g, '') //
                        .replace(/\s{2,}/g, ' ') //
                        .replace(/<!\-\-.*?\-\->/g, ''); //;
                        return html;
                    }
                    return '';
                });
                file.write(destPath, str);
            }
        });
    });
};