KISSY.add("app/views/home/sub", function(S, View, MM) {
    return View.extend({
        init : function(e) {
            this.MesModel = e.MesModel.$attrs;
            //监听url参数
            this.observeLocation(['c']);
        },
        render: function() {
            var self = this;
            self.setViewPagelet(self.MesModel);
        },
        receiveMessage: function(data) {
            console.log(data);
        },
        events: {
            click: {
                post: function(e) {
                    //往其他view传递数据
                    e.view.postMessageTo('mx_vf_subView2', 'subview post出来的数据');
                }
            }
        }
    });
}, {
    requires: ["mxext/view", "app/models/modelmanager"]
});