KISSY.add("app/views/home/index", function(S, View, MM) {
    return View.extend({
    	init : function() {
    		//监听url参数
			//this.observeLocation(['start', 'end', 'tab']);
		},
        render: function() {
            var me = this;
            var request = MM.fetchAll([{
                name: "Home_Index"
            }], function(MesModel) {
                me.setViewPagelet({xx:MesModel.get("xx")});
            }, function(msg) {
                //读取数据错误
                me.setViewHTML(msg);
            });
        },
        locationChange: function(e) {
        	this.render();
        }
    })
}, {
    requires: ["mxext/view", "app/models/modelmanager"]
});