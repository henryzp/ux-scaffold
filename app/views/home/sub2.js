KISSY.add("app/views/home/sub2", function(S, View, MM) {
    return View.extend({
        init : function(e) {
            // this.MesModel = e.MesModel.$attrs;
            //监听url参数
            this.observeLocation(['c']);
        },
        render: function() {
            var self = this;
            self.setViewPagelet({});
            self.postMessageTo('magix_vf_main', {a:1}); //往其他view传递数据
        },
        receiveMessage: function(data) {
            console.log(data);
        },
        events: {
            change: {
                gopage: function(e) {
                    var v = e.domEvent.target.value;
                    e.view.navigate('page=' + v);
                }
            },
            click: {
                post: function(e) {
                    e.view.postMessageTo('magix_vf_main', {d:4});
                }
            }
        }
    });
}, {
    requires: ["mxext/view", "app/models/modelmanager"]
});