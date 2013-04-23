KISSY.add("app/views/home", function(S, View, MM) {
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
            me.manage(request);
        },
        locationChange: function() {
            this.render();
        }
    });
}, {
    requires: ["mxext/view", "app/models/modelmanager", 'components/mock/index']
});