KISSY.add("app/views/menu", function(S, View, Sidenav) {
    return View.extend({
        init: function() {
            this.observeLocation({
                pathname: true
            });
        },
        render: function() {
            var me = this;
            me.setViewPagelet({
                //动态数据
            }, function() {});

             new Sidenav({
                el: '#sidebar',
                index: '#!/promotion/index/',
                duration: 0.25,
                pathMap: {
                    '#!/promotion/campaign/': '#!/promotion/index/',
                    '#!/promotion/taokeaudit_history/': '#!/promotion/index/'
                }
            });
        }
    });
}, {
    requires: ['mxext/view', 'brix/gallery/sidenav/index', 'brix/gallery/sidenav/index.css']
});