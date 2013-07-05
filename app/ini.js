/**
 * @fileOverview 配置文件
 * @author 行列
 * @version 1.0
 */
KISSY.add("app/ini",function(S){
    var T = {
        routes: {
            'app/views/default': [
                '/home',
                '/adzone/adzone',
                '/adzone/my_fav_adzone',
                '/reports/account'
            ]
            //可以增加第二种view的配置
            // ,'app/views/default2': [
            //     '/data/xxxx'
            // ]
        }
    };
    return {
        //是否使用history state来进行url的管理
        //nativeHistory:true

        //动画效果
        /*effect:function(e){
            console.log(e);
            S.one(e.newViewNode).css({opacity:0,display:'none'});
            new S.Anim(e.oldViewNode,{opacity:0},0.25,0,function(){
                e.collectGarbage();
                S.one(e.newViewNode).css({display:''});
                new S.Anim(e.newViewNode,{opacity:1},0.2).run();
            }).run();
        },*/
        //配置文件加载完成，在开始应用前预加载的文件
        //preloads:["app/global"],

        //默认加载的view
        defaultView:'app/views/default',
        //默认的pathname
        defaultPathname:'/home',
        //404时显示的view，如果未启用，则404时显示defaultView
        notFoundView:'app/views/404',
        //映射规则，当更复杂时，请考虑下面routes为funciton的配置
        // routes:{
            // "/home":"app/common/views/default",
            // "/account":"app/common/views/default",
            // "/account/recharge":"app/common/views/default",
            // "/account/finance":"app/common/views/default",
            // "/account/operation":"app/common/views/default",
            // "/account/proxy":"app/common/views/default",
            // "/account/remind":"app/common/views/default"
        // }
        //或者routes配置为function如：
        //routes:function(pathname){
        //  if(pathname=='/home'){
        //      return "app/common/default"
        //  }
        //}
        routes: function(pathname){
            if (!S.isEmptyObject(T.routes)) {
                var s;
                S.each(T.routes, function(item, k) {
                    if (S.inArray(pathname, item)) {
                        s = k;
                    }
                });
                if (s) return s;
                return this.notFoundView;
            }
            return this.defaultView;
        }
    }
},{
    requires:["node"]
});