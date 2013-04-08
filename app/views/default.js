KISSY.add("app/views/default",function(S,View,VOM,UA,Node){
    return View.extend({
        init:function(){
            var me=this;
            //me.on('__PAHTNAME__',)
            //observePathname
            //ovserveParams
            
            //me.observeLocation('',PATHNAME);

            //me.observeLocation(['name','page']);
            //1 数据预读取
            //2.事件绑定
            //3. observe
            //4. context 当前view所需的template已准备好（如果有）
            me.observeLocation({
                pathname:true
            });
            if(UA.ie<8){
                me.fixLowerIE();
                me.on('destroy',function(){
                    me.unfixLowerIE();
                });
            }
            me.on('childrenAlter',function(e){
                //console.log('正在加载页面...');
                //bar.show('正在加载页面...');
            });
            me.on('childrenCreated',function(e){
                //bar.hide()
            });
        },
        /**
         * 兼容低版本的IE
         * @param  {String|HTMLElement} zone 修正的区块
         */
        fixLowerIE:function(){
            var zone=S.one(document.body);
            var focus=function(e){
                S.one(e.target).addClass('focus');
            };
            var blur=function(e){
                S.one(e.target).removeClass('focus');
            };

            zone.delegate('focusin','input,textarea',this.$ieFocus=focus);
            zone.delegate('focusout','input,textarea',this.$ieBlur=blur);
        },
        unfixLowerIE:function(zone){
            var zone=S.one(document.body);
            zone.undelegate('focusin','input,textarea',this.$ieFocus);
            zone.undelegate('focusout','input,textarea',this.$ieBlur);
        },
        render:function(){
            var me=this;
            me.setViewPagelet({staticFilePrefix:Magix.config().appHome});
            me.mountMainFrame();
        },
        mountMainFrame:function(){
            var me=this;
            var loc=me.location;
            console.log(loc);
            var pathname=loc.pathname;
            var vframe=VOM.getVframe('magix_vf_main');
            if(vframe){
                var pns=pathname.split('/');
                pns.shift();
                var folder=pns.shift()||'home';
                var view=pns.join('/')||'index';
                if(S.endsWith(view,'/')){
                    view+='index';
                }
                var CSSLoader=Magix.local('CSSLoader');
                var viewPath='app/'+folder+'/views/'+view;
                if(CSSLoader){
                    var appCSS='app/'+folder+'/assets/css/all';
                    if(CSSLoader.isComplete()){
                        CSSLoader.fetch(appCSS,function(){
                            vframe.mountView(viewPath);
                        });
                    }else{
                        vframe.mountView(viewPath);
                    }
                    vframe.on('viewLoad',function(){
                        setTimeout(function(){
                            CSSLoader.lazyload(function(){
                                CSSLoader.fetch(appCSS);
                            });
                        },0);
                    });
                }else{
                    vframe.mountView(viewPath);
                }
            }
        },
        locationChange:function(e){
            this.mountMainFrame();
            e.toChildViews('magix_vf_menus,magix_vf_header');
        }
    });
},{
    requires:['mxext/view','magix/vom','ua','node']
})