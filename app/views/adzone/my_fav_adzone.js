KISSY.add("app/views/adzone/my_fav_adzone", function(S, View, MM) {
    return View.extend({
        init : function() {
            //监听url参数
            //this.observeLocation(['start', 'end', 'tab']);
        },
        render: function() {
            var me = this;
            var request = MM.fetchAll([{
                name: "Home_Index"
            }], function(data) {
                me.setViewPagelet({
                    count: data.get('count'),
                    list: data.get('list')
                });
            }, function(msg) {
                //读取数据错误
                me.setViewHTML(msg);
            });
        }
    });
}, {
    requires: ["mxext/view", "app/models/modelmanager"]
});