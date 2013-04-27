KISSY.add("app/views/home/index", function(S, View, MM, Mustache) {
    return View.extend({
        init : function(e) {
            //监听url参数
            this.observeLocation(['type']);
            this.on('childrenCreated', function(e) {
                // debugger;
                // 当前view及子孙view全部加载完毕时
            });
            this.on('childrenAlter', function(e) {
                // debugger;
                // 当前view及子孙view有变化时
            });
            this.on('created', function(e) {
                // debugger;
                // 当前view加载完毕
            });
        },
        render: function(type) {
            type && alert(type); //type可以来自刷新自己时传进来的值

            var self = this;
            //MM.fetchAll的返回值交由manage管理，避免风险
            //其他异步的回调函数都要交由manage管理
            self.manage(MM.fetchAll([{
                name: self.location.params.type || "Home_Index",
                urlParams: self.location.params
            }], function(MesModel, err) {
                if (err) {
                    self.setViewHTML(err.msg);
                    return;
                }
                self.setViewPagelet({
                    count: MesModel.get('count'),
                    list: MesModel.get('list'),
                    type: self.location.get('type')
                });
                self.mountView('mx_vf_subView', 'app/views/home/sub', {MesModel : MesModel});

                self.postMessageTo('mx_vf_subView', {b:2});
            }));


        },
        locationChange: function(e) {
            //局部刷新在template里加个bx-tmpl="xxx" bx-datakey="xxx"
            this.render(e.location.get('type')); //可以自我刷新时，传给自己的改变的值
        },

        receiveMessage : function(data) {
            //接收到其他VIEW的数据
            console.log(data);
        },

        renderer: {
            list: {
                test: function(self) {
                    return this.status + '_test';
                }
            }
        },
        events: {
            change: {
                gopage: function(e) {
                    var v = e.domEvent.target.value;
                    e.view.navigate('type=' + v);
                    console.log(e.params.id);
                }
            },
            click: {
                post: function(e) {
                    e.view.postMessageTo('mx_vf_subView', {c:3});
                }
            }
        }
    });
}, {
    requires: ["mxext/view", "app/models/modelmanager", 'brix/core/mustache']
});