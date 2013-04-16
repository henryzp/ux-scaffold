KISSY.add('components/componentname/index',function(S,Brick){
    return Brick.extend({
        /**
         * 初始化函数，在构造函数内部调用
         */
        initializer:function(){
            //xx = ss;
        },
        /**
         * 组件放置到dom后触发的方法调用
         */
        bindUI:function(){

        },
        /**
         * 析构函数，在组件destroy时候主动调用
         */
        destructor:function(){

        }
    },{
        ATTRS:{
            x:{
                value:'xxxx'
            }
        },
        EVENTS:{
            //事件代理，
            ".selector":{
                //时间类型
                "eventType":{

                }
            },
            //空选择器，直接绑定事件在el节点上
            "":{

            }
        },
        DOCEVENTS:{
            //同EVENTS
        },
        WINEVENTS:{
            resize:function(){
                S.log('componentname\'s resize');
            }
        },
        RENDERERS:{

        }
    },'componentname');//最后一个参数是组件名称
},{
    requires:['brix/core/brick']
});