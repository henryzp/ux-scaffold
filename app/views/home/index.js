KISSY.add("app/views/home/index", function(S, View, MM, Mustache) {
    return View.extend({
        init : function(e) {
            console.log(e.type);
            //监听url参数
            this.observeLocation(['type']);
        },
        render: function() {
            var self = this;
            MM.fetchAll([{
                name: self.location.params.type || "Home_Index",
                urlParams: self.location.params
            }], function(data) {
                // self.setViewHTML(Mustache.to_html(self.template, {
                //     count: data.get('count'),
                //     list: data.get('list'),
                //     type: self.location.get('type')
                // }));
                self.setViewPagelet({
                    count: data.get('count'),
                    list: data.get('list'),
                    type: self.location.get('type')
                });
                self.ownerVOM.getVframe('mx_vf_subView').mountView('app/views/home/sub', {
                    data:  data.$attrs
                });

            }, function(msg) {
                //读取数据错误
                self.setViewHTML(msg);
            });
            // self.manage(request);
        },
        locationChange: function(e) {
            this.owner.mountView(this.path, {
                type: e.location.get('type') //传递给VIEW的数据
            });
        },
        events: {
            change: {
                gopage: function(e) {
                    var v = e.domEvent.target.value;
                    e.view.navigate('type=' + v);
                }
            }
        }
    });
}, {
    requires: ["mxext/view", "app/models/modelmanager", 'brix/core/mustache']
});