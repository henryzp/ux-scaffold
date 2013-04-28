KISSY.add("app/views/home/sub2", function(S, View, MM) {
    return View.extend({
        init : function(e) {
            // this.MesModel = e.MesModel.$attrs;
            //监听url参数
            this.observeLocation(['c']);
        },
        render: function() {
            var self = this;
            self.setViewPagelet();
        },
        receiveMessage: function(data) {
            console.log(data);
        },
        events: {
            click: {
                post: function(e) {
                    e.view.postMessageTo('mx_vf_subView', 'subview2 post出来的数据');
                }
            }
        }
    });
}, {
    requires: ["mxext/view", "app/models/modelmanager"]
});