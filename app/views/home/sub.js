KISSY.add("app/views/home/sub", function(S, View, MM) {
    return View.extend({
        init : function(e) {
            this.data = e.data;
            //监听url参数
            this.observeLocation(['c']);
        },
        render: function() {
            var self = this;
            self.setViewPagelet(self.data);
        },
        events: {
            change: {
                gopage: function(e) {
                    var v = e.domEvent.target.value;
                    e.view.navigate('page=' + v);
                }
            }
        }
    });
}, {
    requires: ["mxext/view", "app/models/modelmanager"]
});