/**
 * @fileOverview 配置文件
 * @author 行列
 * @version 1.0
 */
KISSY.add("app/ini",function(S){
    var T = {
        startChecker: function(){
            var me = this;
            me.$checker = setTimeout(function(){
                //alert('呃...您的网络不给力，资源加载不成功，点击确定重试');
                location.reload();
            },2*60*1000);
        },
        stopChecker: function(){
            var me = this;
            clearTimeout(me.$checker);
        },
        progress: function(p){
            var progressBarNode = S.one('.progress_bar_content'),
                progressBarText=S.one('.progress_bar_text');
            var width=(p * 100).toFixed(0) + '%';
            progressBarNode.css({'width': width});
            progressBarText.text(width);
            if(p==1){
                setTimeout(function(){
                    S.one('.app_progress_bar').remove();
                },100);
                T.stopChecker();
            }
        },
        routes:{

        }
    };
    T.startChecker();
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

        //view的加载进度
        progress:function(p){
            T.progress(p);
        },
        //默认加载的view
        defaultView:'app/views/default',
        //默认的pathname
        defaultPathname:'/home',
        //404时显示的view，如果未启用，则404时显示defaultView
        notFoundView:'app/views/404',
        //映射规则，当更复杂时，请考虑下面routes为funciton的配置
        // routes:{
        //     '/home': 'app/views/default',
        //     '/adzone/adzone': 'app/views/default',
        //     '/adzone/my_fav_adzone': 'app/views/default',
        //     '/reports/account': 'app/views/default',
        // }
        //或者routes配置为function如：
        //routes:function(pathname){
        //  if(pathname=='/home'){
        //      return "app/common/default"
        //  }
        //}
        routes: function(pathname){
            /**begin:support sc load app views**/
            if(/^app\//.test(pathname)){
                return pathname;
            }
            /**end**/
            if(!S.isEmptyObject(T.routes)&&!T.routes[pathname]){
                return 'app/views/404';
            }
            return 'app/views/default';
        }
    };
},{
    requires:["node"]
});