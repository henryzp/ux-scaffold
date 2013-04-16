module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['app/*.js','app/*/*.js'],
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    //tasks
    //grunt.loadTasks('tasks');

    // Default task.
    grunt.registerTask('default', ['jshint']);
};