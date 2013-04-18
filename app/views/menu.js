KISSY.add("app/views/menu", function(S, View, Sidenav, SS) {
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
                sidebar: '#sidebar',
                inmain: '#inmain',
                index: '#!/home/',
                duration: 0.25
            });
        }
    });
}, {
    requires: ['mxext/view', 'components/sidenav/', 'components/sidenav/index.css']
});