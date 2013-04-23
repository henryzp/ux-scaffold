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
            }, function(pagelet) {
                var sidenav = pagelet.getBricks('sidenav')[0];
                // debugger;
                // sidenav.destroy();
            });



        }
    });
}, {
    requires: ['mxext/view', 'components/sidenav/index.css']
});