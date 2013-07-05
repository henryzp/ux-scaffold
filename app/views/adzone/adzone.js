KISSY.add("app/views/adzone/adzone", function(S, View, MM, R) {
    return View.extend({
        init : function() {
            //监听url参数
            //this.observeLocation(['start', 'end', 'tab']);
        },

        render: function() {
            var self = this;
            var params = {
                id: self.location.get('id') || 10000
            };

            var r = MM.fetchAll([{
                name: 'Plan_Get',
                urlParams: params
            }], function(MesModel, err) {
                if (err) {
                    self.setViewHTML(err.msg);
                    return;
                }
                self.setViewPagelet(MesModel.$attrs);
            });
            self.manage('r', r);
        },

        locationChange: function(e) {
            this.render();
        },

        events: {
            click: {
                submit: function(e) {
                    var self = e.view;
                    var params = S.unparam(S.IO.serialize('#form'));
                    self.getManaged('r').saveAll({
                        name: 'Plan_Create',
                        urlParams: params
                    }, function(MesModel, err) {
                        if (err) {
                            alert(err.msg)
                            return;
                        }
                        self.setViewHTML('创建成功');
                    });
                }
            }
        }
    });
}, {
    requires: ["mxext/view", "app/models/modelmanager", 'magix/router']
});