//启动magix
KISSY.config({combine:/*S_combine*/false/*S_combine*/});
window.Site = {
    debug: ~location.search.indexOf('debug'),
    mock: ~location.search.indexOf('mock'),
    cdn: ''
}
Magix.start({
    appHome:'./', //默认app
    appCombine:false,
    appTag:'20130106',//配置加载js时的时间戳
    iniFile:'app/ini',
    extensions:["app/extview"],
    debug:true,
    ready:function(){
        Magix.local("BPENV",{ //local方法提供全局存储数据的功能
            loginUser:{
                nickName:'xinglie'
            }
        });
    }
});


//进度条
(function(S){
    var pNode=document.getElementById('magix_percent');
    var wNode=pNode.getElementsByTagName('span')[0];
    var tNode=pNode.getElementsByTagName('b')[0];

    var T = {
        startChecker: function(){
            var me = this;
            me.$checker = setTimeout(function(){
                //alert('呃...您的网络不给力，资源加载不成功，点击确定重试');
                location.reload();
            },3*60*1000);
        },
        stopChecker: function(){
            var me = this;
            clearTimeout(me.$checker);
        },
        progress: function(p){
            var me = this;
            var width=(p * 100).toFixed(0) + '%';
            wNode.style.width=width;
            tNode.innerHTML=width;
            if(p==1){
                setTimeout(function(){
                    pNode.parentNode.removeChild(pNode);
                    //T=null;
                    pNode=null;
                    wNode=null;
                    tNode=null;
                    Magix.config('progress',0,1);
                },100);
                T.stopChecker();
            }
        },
        hookScript:function(){
            var gS=S.getScript;
            S.getScript=function(){
                if(T.percent<=0.97){
                    T.percent+=Math.random()*0.02;
                }else if(T.percent>=1){
                    S.getScript=gS;
                    T.percent=1;
                    T.buffer.s=1;
                }
                T.updateProgress(T.percent);
                gS.apply(S,arguments);
            };
        },
        shiftValue:function(){
            var len=T.buffer.length;
            if(len){
                if(len>8)T.buffer.splice(0,2);//多于8个，删除2个，加速
                T.progress(T.buffer.shift());
                setTimeout(T.shiftValue,15);
            }else{
                T.buffer.d=0;
            }
        },
        updateProgress:function(p){
            if(p!=T.last){
                T.buffer.push(T.last=p);
                if(!T.buffer.d){
                    T.buffer.d=setTimeout(T.shiftValue,15);
                }
            }
        },
        buffer:[],
        percent:0,
        last:-1
    };
    Magix.config({
        progress:function(e){
            var p=Math.max(e.percent,T.percent);
            while(T.percent<p){
                T.percent+=Math.random()*0.03;
                T.updateProgress(T.percent=Math.min(T.percent,p));
            }
            T.percent=p;
        }
    });
    T.hookScript();
    T.startChecker();
}(KISSY));