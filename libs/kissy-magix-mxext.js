KISSY.add("magix/body", function(S, IBody, Magix, Event) {
    var HAS = Magix.has;
    var MIX = Magix.mix;
    //不支持冒泡的事件
    var UnsupportBubble = {
        submit: 1,
        focusin: 1,
        focusout: 1,
        mouseenter: 1,
        mouseleave: 1,
        mousewheel: 1,
        change: 1
    };
    var RootNode = document.body;
    var RootEvents = {};
    var VframeTag = Magix.cfg.tagName;
    var MxHandler = 'mx-handler';
    var MxOwner = 'mx-owner';
    var MxIgnore = 'mx-ignore';
    var TypesRegCache = {};

    var Body = MIX({



        processEvent: function(e) {
            var me = this;
            var target = e.target || e.srcElement;
            while(target && target.nodeType != 1) {
                target = target.parentNode;
            }
            var current = target;
            var eventType = e.type;
            var eventReg = TypesRegCache[eventType] || (TypesRegCache[eventType] = new RegExp('(?:^|,)' + eventType + '(?:,|$)'));
            //
            if(!eventReg.test(target.getAttribute(MxIgnore))) {
                var type = 'mx' + eventType;
                var info;
                var ignore;
                var arr = [];
                while(current && current != RootNode) { //找事件附近有mx[a-z]+事件的DOM节点
                    info = current.getAttribute(type);
                    ignore = current.getAttribute(MxIgnore);
                    if(info || eventReg.test(ignore)) {
                        break;
                    } else {
                        //
                        arr.push(current);
                        current = current.parentNode;
                    }
                }
                if(info) { //有事件
                    //找处理事件的vframe
                    var handler = current.getAttribute(MxHandler) || current.getAttribute('mx-owner');
                    if(!handler) { //如果没有则找最近的vframe
                        var begin = current;
                        while(begin && begin != RootNode) {
                            if(begin.tagName.toUpperCase() == VframeTag) {
                                current.setAttribute(MxHandler, handler = begin.id);
                                break;
                            } else {
                                begin = begin.parentNode;
                            }
                        }
                    }
                    if(handler) { //有处理的vframe,派发事件，让对应的vframe进行处理
                        me.fire('event', {
                            info: info,
                            type: type,
                            domEvent: e,
                            target: target,
                            current: current,
                            handler: handler
                        });
                    } else {
                        throw new Error('miss mx-handler attribute:' + info);
                    }
                } else {
                    var node;
                    var ignore;
                    while(arr.length) {
                        node = arr.shift();
                        ignore = node.getAttribute(MxIgnore);
                        if(!eventReg.test(ignore)) {
                            ignore = ignore ? ignore + ',' + eventType : eventType;
                            node.setAttribute(MxIgnore, ignore);
                        }
                    }
                }
            }
        },
        attachEvent: function(type) {
            var me = this;
            if(!RootEvents[type]) {

                RootEvents[type] = 1;
                var unbubble = UnsupportBubble[type];
                if(unbubble) {
                    me.delegateUnbubble(RootNode, type);
                } else {
                    RootNode['on' + type] = function(e) {
                        e = e || window.event;
                        e && me.processEvent(e);
                    }
                }
            } else {
                RootEvents[type]++;
            }
        },
        detachEvent: function(type) {
            var me = this;
            var counter = RootEvents[type];
            if(counter > 0) {
                counter--;
                if(!counter) {
                    var unbubble = UnsupportBubble[type];
                    if(unbubble) {
                        me.undelegateUnbubble(RootNode, type);
                    } else {
                        RootNode['on' + type] = null;
                    }
                    delete RootEvents[type];
                } else {
                    RootEvents[type] = counter;
                }
            }
        }
    }, Event);
    return Magix.mix(Body, IBody);
}, {
    requires: ["magix/impl/body", "magix/magix", "magix/event"]
});
/**
 * @fileOverview 多播事件对象
 * @author 行列<xinglie.lkf@taobao.com>
 * @version 1.0
 **/
KISSY.add("magix/event", function(S, Magix) {
    /**
     * 根据名称生成事件数组的key
     * @param  {Strig} name 事件名称
     * @return {String} 包装后的key
     */
    var genKey = function(name) {
            return '~`' + name;
        };

    var safeExec = Magix.safeExec;
    /**
     * 多播事件对象
     * @name Event
     * @namespace
     */
    var Event = {
        /**
         * @lends Event
         */
        /**
         * 触发事件
         * @param {String} name 事件名称
         * @param {Object} data 事件对象
         * @param {Boolean} remove 事件触发完成后是否移除这个事件的所有监听
         * @param {Boolean} lastToFirst 是否从后向前触发事件的监听列表
         */
        fire: function(name, data, remove, lastToFirst) {
            var key = genKey(name),
                me = this,
                list = me[key];
            if(list) {
                if(!data) data = {};
                if(!data.type) data.type = name;
                var len = list.length - 1,
                    end = len + 1,
                    idx;
                while(end--) {
                    idx = lastToFirst ? end : len - end;
                    var fn = list[idx];
                    if(fn.d) {
                        list.splice(idx, 1);
                        len--;
                    }
                    if(safeExec(fn, data, me) === false) {
                        break;
                    }
                }
            }
            if(remove) {
                delete me[key];
            }
        },
        /**
         * 绑定事件
         * @param  {String}   name 事件名称
         * @param  {Function} fn   事件回调
         * @param {Interger|Boolean} insertOrRemove 事件监听插入的位置或触发后是否移除监听
         */
        on: function(name, fn, insertOrRemove) {
            var key = genKey(name);
            if(!this[key]) this[key] = [];
            if(Magix.isNumeric(insertOrRemove)) {
                this[key].splice(insertOrRemove, 0, fn);
            } else {
                fn.d = insertOrRemove;
                this[key].push(fn);
            }
        },
        /**
         * 解除事件绑定
         * @param  {String}   name 事件名称
         * @param  {Function} fn   事件回调
         */
        un: function(name, fn) {
            if(!Magix.isArray(name)) {
                name = [name];
            }
            for(var x = 0, u = name.length; x < u; x++) {
                var key = genKey(name[x]),
                    list = this[key];
                if(list) {
                    if(fn) {
                        for(var i = 0, j = list.length; i < j; i++) {
                            if(list[i] == fn) {
                                list.splice(i, 1);
                                break;
                            }
                        }
                    } else {
                        delete this[key];
                    }
                }
            }
        }
    };
    return Event;
}, {
    requires: ["magix/magix"]
});
KISSY.add("magix/impl/body", function(S) {
    return {
        delegateUnbubble: function(node, type) {
            var me = this;
            if(!me.$events) me.$events = {};
            node = S.one(node);
            node.delegate(type, '*[mx' + type + ']', me.$events[type] = function(e) {
                me.processEvent(e);
            });
        },
        undelegateUnbubble: function(node, type) {
            var me = this;
            var cache = me.$events;
            if(cache) {
                node = S.one(node);
                //
                node.undelegate(type, '*[mx' + type + ']', cache[type]);
                delete cache[type];
            }
        }
    }
}, {
    requires: ["node"]
});
/**
 * @fileOverview magix中根据底层类库需要重写的方法
 * @author 行列
 * @version 1.0
 */
KISSY.add('magix/impl/magix', function(S) {
    return {

        libRequire: function(name, fn) {
            var me = this;
            if(name) {
                var isFn = me.isFunction(fn);
                var isArr = me.isArray(name);

                S.use(isArr ? name.join(',') : name, isFn ?
                function(S) {
                    fn.apply(S, [].slice.call(arguments, 1));
                } : me.noop);
            } else {
                fn();
            }
        },
        libEnv: function(refToLib) {
            var me = this;
            var cfg = me.cfg;
            if(refToLib) {
                var buffer = [];
                var percent = 0;
                var last;
                var progress = refToLib.progress;
                if(progress) {
                    //
                    //0.02 0.06 0.1 0.31 0.32 0.34 0.62 [xx,xx,0.8] 0.82
                    //  0.3   0.6  0.8
                    //
                    //
                    var shiftValue = function() {
                            var len = buffer.length;
                            if(len) {
                                if(len > 8) buffer.splice(0, 2); //多于8个，删除2个，加速
                                Magix.safeExec(progress, buffer.shift(), cfg);
                                setTimeout(shiftValue, 15);
                            } else {
                                buffer.d = 0;
                            }
                        };
                    var updateProgress = function(p) {
                            if(p != last) {
                                buffer.push(last = p);
                                if(!buffer.d) {
                                    buffer.d = setTimeout(shiftValue, 15);
                                }
                            }
                        };
                    refToLib.vomLoad = function(pct) {
                        var p = Math.max(pct, percent);
                        while(percent < p) {
                            percent += Math.random() * 0.05;
                            updateProgress(percent = Math.min(percent, p));
                        }
                        percent = p;
                    };
                    var gS = S.getScript;
                    S.getScript = function() {
                        if(percent <= 0.95) {
                            percent += Math.random() * 0.04;
                        } else if(percent == 1) {
                            S.getScript = gS;
                            buffer.s = 1;
                        }
                        //
                        updateProgress(percent);
                        gS.apply(S, arguments);
                    };
                }
            } else {
                var appHome = cfg.appHome || './';
                var loc = location;
                var protocol = loc.protocol;
                var appName = cfg.appName || 'app';

                appHome = appHome.replace(new RegExp('(^|/)' + appName + '/?$', 'i'), function(a, b) {
                    return b || './';
                });

                if(!~appHome.indexOf(protocol)) {
                    appHome = me.path(loc.href, appHome);
                }

                if(!S.endsWith(appHome, '/')) {
                    appHome += '/';
                }
                cfg.appHome = appHome;
                if(cfg.debug) {
                    cfg.debug = appHome.indexOf(protocol + '//' + loc.host) == 0;
                }
                if(cfg.debug && Number(S.version) < 1.3) {
                    var reg = new RegExp("(" + appHome + appName + "/.+)-min\\.js(\\?[^?]+)?");
                    S.config({
                        map: [
                            [reg, '$1.js$2']
                        ]
                    });
                }
                var appTag = '';
                if(cfg.debug) {
                    appTag = S.now();
                } else {
                    appTag = cfg.appTag;
                }
                if(appTag) {
                    appTag += '.js';
                }
                var appCombine = cfg.appCombine;
                if(S.isUndefined(appCombine)) {
                    appCombine = S.config('combine');
                }
                S.config({
                    packages: [{
                        name: cfg.appName = appName,
                        path: appHome,
                        debug: cfg.debug,
                        combine: appCombine,
                        tag: appTag
                    }]
                });
            }
        },
        isArray: S.isArray,
        isFunction: S.isFunction,
        isObject: S.isObject,
        isRegExp: S.isRegExp,
        isString: S.isString,
        isNumber: S.isNumber
    }
});
/**
 * @fileOverview router中根据底层类库需要重写的方法
 * @author 行列
 * @version 1.0
 */
KISSY.add("magix/impl/router", function(S) {
    return {
        useHistoryState: function() {
            var me = this,
                initialURL = location.href;
            S.one(window).on('popstate', function(e) {
                var equal = location.href == initialURL;
                if(!me.$firedPop && equal) return;
                me.$firedPop = true;

                me.route();
            });
        },
        useLocationHash: function() {
            var me = this;
            S.one(window).on('hashchange', function(e) {
                me.route();
            });
        }
    }
}, {
    requires: ["node"]
});
/**
 * @fileOverview view中根据底层类库需要重写的方法
 * @author 行列
 * @version 1.0
 */
KISSY.add("magix/impl/view", function(S, io, Sizzle, Magix) {
    var IView = function() {

        };
    var StaticWhiteList = {
        wrapAsyn: 1,
        extend: 1
    };

    var processObject = function(props, proto, enterObject) {
            for(var p in proto) {
                if(S.isObject(proto[p])) {
                    if(!Magix.has(props, p)) props[p] = {};
                    processObject(props[p], proto[p], true);
                } else if(enterObject) {
                    props[p] = proto[p];
                }
            }
        };
    IView.extend = function(props, ctor) {
        var me = this;
        var BaseView = function() {
                BaseView.superclass.constructor.apply(this, arguments);
                if(ctor) {
                    Magix.safeExec(ctor, arguments, this);
                }
            }
        BaseView.extend = IView.extend;
        return S.extend(BaseView, me, props);
    };

    IView.prepare = function(oView) {
        var me = this;
        if(!oView.wrapAsyn) {
            for(var p in me) {
                if(Magix.has(StaticWhiteList, p)) {
                    oView[p] = me[p];
                }
            }
            var aimObject = oView.prototype;
            var start = oView;
            var temp;
            while(start.superclass) {
                temp = start.superclass.constructor;
                processObject(aimObject, temp.prototype);
                start = temp;
            }
        }
        oView.wrapAsyn();
    };

    Magix.mix(IView.prototype, {
        getTmplByXHR: function(path, fn) {
            io({
                url: path,
                dataType: 'html',
                success: function(tmpl) {
                    fn(tmpl);
                },
                error: function(e, msg) {
                    fn(msg);
                }
            });
        }
    });

    return IView;
}, {
    requires: ["ajax", "sizzle", "magix/magix"]
});
/**
 * @fileOverview Magix全局对象
 * @author 行列<xinglie.lkf@taobao.com>
 * @version 1.0
 **/
KISSY.add('magix/magix', function(S, IMagix) {
    var PathRelativeReg = /\/\.\/|\/[^\/]+?\/\.{2}\/|([^:\/])\/\/+/;
    var PathTrimFileReg = /[^\/]*$/;
    var PathTrimParamsReg = /[#?].*$/;
    var EMPTY = '';
    var ParamsReg = /([^=&?\/#]+)=([^&=#?]*)/g;
    var PATHNAME = 'pathname';
    var ProtocalReg = /^https?:\/\//i;
    var Templates = {};

    /**
     * 检测某个对象是否拥有某个属性
     * @param  {Object}  owner 检测对象
     * @param  {String}  prop  属性
     * @return {Boolean} 是否拥有prop属性
     */
    var has = function(owner, prop) {
            if(!owner) return false; //false 0 null '' undefined
            return Object.prototype.hasOwnProperty.call(owner, prop);
        };

    /**
     * 混合对象的属性
     * @param  {Object} aim    要mix的目标对象
     * @param  {Object} src    mix的来源对象
     * @param  {Object} ignore 在复制时，忽略的值
     * @return {Object}
     */
    var mix = function(aim, src, ignore) {
            for(var p in src) {
                if(ignore === true) {
                    aim[p] = src[p];
                } else if(has(src, p) && (!ignore || !has(ignore, p))) {
                    aim[p] = src[p];
                }
            }
            return aim;
        };

    /**
     * 以try cache方式执行方法，忽略掉任何异常
     * @param  {Array} fns     函数数组
     * @param  {Array} args    参数数组
     * @param  {Object} context 在待执行的方法内部，this的指向
     * @return {Object} 返回执行的最后一个方法的返回值
     */
    var safeExec = function(fns, args, context, i, r, e) {
            if(!Magix.isArray(fns)) {
                fns = [fns];
            }
            if(!args || (!Magix.isArray(args) && !args.callee)) {
                args = [args];
            }
            for(i = 0; i < fns.length; i++) {

                e = fns[i];
                r = Magix.isFunction(e) && e.apply(context, args);



            }
            return r;
        };
    /**
待重写的方法
@method imimpl
**/
    var unimpl = function() {
            throw new Error("unimplement method");
        };
    /**
     * 空方法
     */
    var noop = function() {};


    /**
     * Magix全局对象
     * @name Magix
     * @namespace
     */
    var Magix = {
        /**
         * @lends Magix
         */
        /**
         * 判断o是否为数组
         * @function
         * @param {Object} o 待检测的对象
         * @return {Boolean}
         */

        /**
         * 判断o是否为对象
         * @function
         * @param {Object} o 待检测的对象
         * @return {Boolean}
         */

        /**
         * 判断o是否为函数
         * @function
         * @param {Object} o 待检测的对象
         * @return {Boolean}
         */

        /**
         * 判断o是否为正则
         * @function
         * @param {Object} o 待检测的对象
         * @return {Boolean}
         */

        /**
         * 判断o是否为字符串
         * @function
         * @param {Object} o 待检测的对象
         * @return {Boolean}
         */

        /**
         * 判断o是否为数字
         * @function
         * @param {Object} o 待检测的对象
         * @return {Boolean}
         */

        /**
         * 判断是否可转为数字
         * @param  {Object}  o 待检测的对象
         * @return {Boolean}
         */
        isNumeric: function(o) {
            return !isNaN(parseFloat(o)) && isFinite(o);
        },
        /**
         * 利用底层类库的包机制加载js文件，仅Magix内部使用，不推荐在app中使用
         * @function
         * @param {String} name 形如app/views/home这样的字符串
         * @param {Function} fn 加载完成后的回调方法
         * @private
         */

        /**
         * 通过xhr同步获取文件的内容，仅开发magix时使用
         * @function
         * @param {String} path 文件路径
         * @return {String} 文件内容
         * @private
         */

        /**
         * 设置底层类库的环境
         * @function
         * @private
         */

        /**
         * 把src对象的值混入到aim对象上
         * @function
         * @param  {Object} aim    要mix的目标对象
         * @param  {Object} src    mix的来源对象
         * @param  {Object} [ignore] 在复制时，需要忽略的key
         * @return {Object}
         */
        mix: mix,
        /**
         * 未实现的方法
         * @function
         * @type {Function}
         */

        /**
         * 检测某个对象是否拥有某个属性
         * @function
         * @param  {Object}  owner 检测对象
         * @param  {String}  prop  属性
         * @return {Boolean} 是否拥有prop属性
         */
        has: has,
        /**
         * 以try catch的方式执行方法，忽略掉任何异常
         * @function
         * @param  {Array} fns     函数数组
         * @param  {Array} args    参数数组
         * @param  {Object} context 在待执行的方法内部，this的指向
         * @return {Object} 返回执行的最后一个方法的返回值
         * @example
         * var f1=function(){
         *      throw new Error('msg');
         * };
         *
         * var f2=function(msg){
         *      return 'new_'+msg;
         * };
         *
         * var result=Magix.safeExec([f1,f2],new Date().getTime());
         *
         * S.log(result);//得到f2的返回值
         */
        safeExec: safeExec,
        /**
         * 空方法
         * @function
         */
        noop: noop,
        /**
         * 配置信息对象
         */
        cfg: {
            debug: '%DEV%',
            tagName: 'VFRAME'
        },
        /**
    全局缓存对象
    **/
        locals: {},
        /**
         * 设置或获取配置信息
         * @param {Object} [cfg] 配置信息对象
         * @return {Object} 配置信息对象
         * @example
         * Magix.config({
         *      naviveHistory:true,
         *      appHome:'./test/app'
         * });
         *
         * var config=Magix.config();
         *
         * S.log(config.appHome);
         */
        config: function(cfg) {
            var me = this;
            var oldCfg = me.cfg;
            if(cfg) {
                oldCfg = mix(oldCfg, cfg);
            }
            return oldCfg;
        },
        /**
         * magix开始工作
         * @param  {Object} cfg 初始化配置参数对象
         * @param {String} cfg.appHome 当前app所在的文件夹路径 http 形式的 如：http://etao.com/srp/app/
         * @param {Boolean} cfg.debug 指定当前app是否是发布版本，当使用发布版本时，view的html和js应该打包成一个 view-min.js文件，否则Magix在加载view时会分开加载view.js和view.html(view.hasTemplate为true的情况下)
         * @param {Boolean} cfg.nativeHistory 是否使用history state,当为true，并且浏览器支持的情况下会用history.pushState修改url，您应该确保服务器能给予支持。如果nativeHistory为false将使用hash修改url
         * @param {String} cfg.defaultView 默认加载的view
         * @param {String} cfg.defaultPathname 默认view对应的pathname
         * @param {String} cfg.appName 应用的包名，默认app
         * @param {String} cfg.notFoundView 404时加载的view
         * @param {Object} cfg.routes pathname与view映射关系表
         * @param {String} cfg.appTag app的资源获取时的后缀tag，增量更新时，清除缓存用
         * @param {Boolean} cfg.hasIniFile 是否有配置文件,默认为true，默认配置文件的位置为{cfg.appName}/ini.js，暂不提供修改ini文件位置的配置
         * @param {Function} cfg.ready Magix完成配置后触发
         * @param {Array} cfg.extensions 需要加载的扩展
         * @example
         * Magix.start({
         *      useHistoryState:true,
         *      appHome:'http://etao.com/srp/app/',
         *      debug:true,
         *      appTag:'20121205',
         *      hasIniFile:false,//是否有ini配置文件
         *      defaultView:'app/views/layouts/default',//默认加载的view
         *      defaultPathname:'/home',
         *      routes:{
         *          "/home":"app/views/layouts/default"
         *      }
         * });
         */
        start: function(cfg) {
            var me = this;
            cfg = me.config(cfg);
            me.libEnv();
            if(cfg.ready) {
                safeExec(cfg.ready);
                delete cfg.ready;
            }
            var hasIniFile = cfg.hasIniFile;
            var loadIniFile = function(cb) {
                    if(hasIniFile !== false) {
                        me.libRequire(cfg.appName + '/ini', cb);
                    } else {
                        cb();
                    }
                };
            loadIniFile(function(I) {
                me.cfg = mix(cfg, I, cfg);
                var refToLib = {
                    progress: me.cfg.progress,
                    vomLoad: noop
                };

                me.libEnv(refToLib);

                me.libRequire(['magix/router', 'magix/vom'], function(R, V) {
                    R.on('locationChanged', function(e) {
                        if(e.slient) {
                            V.locationUpdated(e.loc);
                        } else {
                            if(e.changed.isView()) {
                                V.remountRoot(e);
                            } else {
                                V.locationChanged(e);
                            }
                        }
                    });
                    V.on('progress', function(e) {
                        refToLib.vomLoad(e.percent);
                    });
                    me.libRequire(cfg.extensions, function() {
                        R.start();
                    })
                });
            });
        },
        /**
         * 获取对象的keys
         * @param  {Object} obj 要获取key的对象
         * @return {Array}
         */
        keys: function(obj) {
            var keys;
            if(Object.keys) {
                keys = Object.keys(obj);
            } else {
                keys = [];
                for(var p in obj) {
                    if(has(obj, p)) {
                        keys.push(p);
                    }
                }
            }
            return keys;
        },
        /**
         * 获取或设置Magix.locals，您可以把整个app需要共享的数据，通过该方法进行全局存储，方便您在任意view中访问这份数据
         * @param {String|Object} key 获取或设置Magix.locals时的key 或者 设置Magix.locals的对象
         * @param {[type]} [val] 设置的对象
         * @return {Object|Undefined}
         * @example
         * Magix.local({//以对象的形式存值
         *      userId:'58782'
         * });
         *
         * Magix.local('userName','xinglie.lkf');
         *
         * var userId=Magix.local('userId');//获取userId
         *
         * var locals=Magix.local();//获取所有的值
         *
         * S.log(locals);
         */
        local: function(key, val) {
            var args = arguments;
            var me = this;
            var locals = me.locals;
            if(args.length == 0) {
                return locals;
            } else if(args.length == 1) {
                if(me.isObject(key)) {
                    mix(locals, key)
                } else {
                    return locals[key];
                }
            } else {
                locals[key] = val;
            }
        },
        /**
         * 路径
         * @private
         * @param  {String} url  参考地址
         * @param  {String} part 相对参考地址的片断
         * @return {String}
         * http://www.a.com/a/b.html?a=b#!/home?e=f   /
         * http://www.a.com/a/b.html?a=b#!/home?e=f   ./
         * http://www.a.com/a/b.html?a=b#!/home?e=f   ../../
         * http://www.a.com/a/b.html?a=b#!/home?e=f   ./../
         */
        path: function(url, part) {
            url = url.replace(PathTrimParamsReg, EMPTY).replace(PathTrimFileReg, EMPTY);
            var result = EMPTY;
            //
            if(part.charAt(0) == '/') {
                var ds = url.indexOf('://');
                if(ds == -1) {
                    result = part;
                } else {
                    var fs = url.indexOf('/', ds + 3);
                    if(fs == -1) {
                        result = url + part;
                    } else {
                        result = url.substring(0, fs) + part;
                    }
                }
            } else {
                result = url + part;
            }
            //
            while(PathRelativeReg.test(result)) {
                //
                result = result.replace(PathRelativeReg, '$1/');
            }
            return result;
        },
        /**
         * 把路径字符串转换成对象
         * @param  {String} path 路径字符串
         * @return {Object} 解析后的对象
         */
        pathToObject: function(path) {
            //把形如 /xxx/a=b&c=d 转换成对象 {pathname:'/xxx/',params:{a:'b',c:'d'}}
            //1. /xxx/a.b.c.html?a=b&c=d  pathname /xxx/a.b.c.html
            //2. /xxx/?a=b&c=d  pathname /xxx/
            //3. /xxx/#?a=b => pathname /xxx/
            //4. /xxx/index.html# => pathname /xxx/index.html
            //5. /xxx/index.html  => pathname /xxx/index.html
            //6. /xxx/#           => pathname /xxx/
            //7. a=b&c=d          => pathname ''
            //8. /s?src=b#        => pathname /s params:{src:'b'}
            var me = this;
            var obj = {};
            var params = {};

            var pathname = EMPTY;
            if(PathTrimParamsReg.test(path)) { //有#?号，表示有pathname
                pathname = path.replace(PathTrimParamsReg, EMPTY)
            } else if(!~path.indexOf('=')) { //没有=号，路径可能是 xxx 相对路径
                pathname = path;
            }

            if(pathname) {
                if(ProtocalReg.test(pathname)) { //解析以https?:开头的网址
                    var first = pathname.indexOf('/', 8); //找最近的 /
                    if(first == -1) { //未找到，比如 http://etao.com
                        pathname = '/'; //则pathname为  /
                    } else {
                        pathname = pathname.substring(first); //截取
                    }
                }
            }
            path.replace(ParamsReg, function(match, name, value) {
                params[name] = value;
            });
            obj[PATHNAME] = pathname;
            obj.params = params;
            return obj;
        },
        /**
         * 把对象内容转换成字符串路径
         * @param  {Object} obj 对象
         * @return {String} 字符串路径
         */
        objectToPath: function(obj) { //上个方法的逆向
            var pn = obj[PATHNAME];
            var params = [];
            for(var p in obj.params) {
                if(has(obj.params, p)) {
                    //if(obj.params[p]){//我们在此过滤掉了空字符串这样的参数
                    params.push(p + '=' + obj.params[p]);
                    //}
                }
            }
            return pn + (params.length ? '?' : EMPTY) + params.join('&');
        },
        /**
         * 读取或设置view的模板
         * @param  {String} key   形如app/common/footer的字符串
         * @param  {String} [value] 模板字符串
         * @return {String}
         */
        tmpl: function(key, value) {
            if(arguments.length == 1) {
                return Templates[key];
            }
            return Templates[key] = value;
        }
    };

    return Magix.mix(Magix, IMagix);
}, {
    requires: ["magix/impl/magix"]
});
/**
 * @fileOverview 路由
 * @author 行列
 * @version 1.0
 */
KISSY.add('magix/router', function(S, IRouter, Magix, Event) {

    var HAS = Magix.has;
    var MIX = Magix.mix;
    var D = document;
    var isUtf8 = /^UTF-8$/i.test(D.charset || D.characterSet || 'UTF-8');
    var mxConfig = Magix.cfg;

    var isParam = function(params) {
            var r;
            var ps = this.params;
            if(!Magix.isArray(params)) params = String(params).split(',');
            for(var i = 0; i < params.length; i++) {
                r = HAS(ps, params[i]);
                if(r) break;
            }
            return r;
        };
    var isPathname = function() {
            return HAS(this, PATHNAME);
        };
    var isView = function() {
            return HAS(this, 'view');
        };
    /*var isParamChangedExcept=function(args){
    if(Magix.isString(args)){
        args=args.split(',');
    }else if(!Magix.isArray(args)){
        args=[args];
    }
    var temp={};
    for(var i=0;i<args.length;i++){
        temp[args[i]]=true;
    }
    var keys=Magix.keys(this.params);
    for(i=0;i<keys.length;i++){
        if(!HAS(temp,keys[i])){
            return true;
        }
    }
    return false;
};*/
    var isPathnameDiff = function() {
            var me = this;
            var hash = me.hash;
            var query = me.query;
            return hash[PATHNAME] != query[PATHNAME];
        };
    var isParamDiff = function(param) {
            var me = this;
            var hash = me.hash;
            var query = me.query;
            return hash.params[param] != query.params[param];
        };
    var hashParamsOwn = function(key) {
            var me = this;
            var hash = me.hash;
            return HAS(hash.params, key);
        };
    var queryParamsOwn = function(key) {
            var me = this;
            var query = me.query;
            return HAS(query.params, key);
        };

    var getParam = function(key) {
            var me = this;
            var params = me.params;
            return params[key];
        };

    var safeExec = Magix.safeExec;

    var WIN = window;
    var ENCODE = encodeURIComponent;
    var DECODE = decodeURIComponent;


    var EMPTY = '';
    var PATHNAME = 'pathname';

    //var PathTrimFileParamsReg=/(\/)?[^\/]*[=#]$/;//).replace(,'$1').replace(,EMPTY);
    //var PathTrimSearch=/\?.*$/;
    /**
     * @name Router
     * @namespace
     * @borrows Event.on as on
     * @borrows Event.fire as fire
     * @borrows Event.un as un
     */
    var Router = MIX({
        /**
         * @lends Router
         */
        qH: {},
        /**
         * 使用history state做为改变url的方式来保存当前页面的状态
         * @function
         */

        /**
         * 使用hash做为改变url的方式来保存当前页面的状态
         * @function
         */

        /**
         * 比较2个参数对象值是否一样，浅比较
         * @param  {Object} p1 给定的第一个对象
         * @param  {Object} p2 给定的第二个对象
         * @return {Boolean} 2个对象的内容是否一样
         */
        compareObject: function(p1, p2) {
            var keys = [];
            keys = keys.concat(Magix.keys(p1));
            keys = keys.concat(Magix.keys(p2));
            for(var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if(p1[key] != p2[key]) {
                    return false;
                }
            }
            return true;
        },
        /**
         * 获取route映射关系
         * @return {Object}
         */
        getRoutes: function() {
            var me = this;
            if(me.$pnr) return me.$pnr;
            var temp = {
                routes: mxConfig.routes || {}
            };

            //var home=pathCfg.defaultView;//处理默认加载的view
            //var dPathname=pathCfg.defaultPathname||EMPTY;
            var defaultView = mxConfig.defaultView;
            if(!defaultView) {
                throw new Error('unset defaultView');
            }
            temp.home = defaultView;
            var defaultPathname = mxConfig.defaultPathname || EMPTY;
            //if(!Magix.isFunction(temp.routes)){
            temp.routes[defaultPathname] = defaultView;
            //}
            // temp.home=home;
            temp[PATHNAME] = defaultPathname;


            //关于notFound
            //当用户配置了notFound则认为找不到相应的前端view时显示notFound的view
            //如果没有配置，则在找不到相应的view时，显示默认的首页view
            //temp.hasNotFound=HAS(pathCfg,'notFound');
            temp.nfView = mxConfig.notFoundView;

            return me.$pnr = temp;
        },
        /**
         * 根据地址栏中的pathname获取对应的前端view
         * @param  {String} pathname 形如/list/index这样的pathname
         * @return {String} 返回形如app/views/layouts/index这样的字符串
         */
        getViewPath: function(pathname) {
            var me = this;
            var pnr = me.getRoutes();
            var result;

            if(!pathname) pathname = pnr[PATHNAME];
            //
            if(Magix.isFunction(pnr.routes)) {
                result = pnr.routes(pathname);
            } else {
                result = pnr.routes[pathname]; //简单的在映射表中找
            }

            return {
                view: result ? result : pnr.nfView || pnr.home,
                pathname: result ? pathname : (pnr.nfView ? pathname : pnr[PATHNAME])
            }
        },
        /**
         * 开始路由工作
         */
        start: function() {
            var me = this;
            if(me.supportState()) {
                me.useHistoryState();
            } else {
                me.useLocationHash();
            }
            me.route(); //页面首次加载，初始化整个页面
        },
        /**
         * 检测当前环境是否允许使用history state
         */
        supportState: function() {
            var H = WIN.history;
            return mxConfig.nativeHistory && H.pushState && H.replaceState;
        },
        /**
         * 解析path
         * @param  {String} path /a/b/c?a=b&c=d的字符串
         * @return {Object}
         */
        parsePath: function(path) {
            var obj = Magix.pathToObject(path);
            var pn = obj[PATHNAME];
            var me = this;
            if(pn.charAt(0) != '/' && mxConfig.nativeHistory && !me.supportState()) { //如果不是以/开头的并且要使用history state,当前浏览器又不支持history state则放hash中的pathname要进行处理
                obj[PATHNAME] = Magix.path(WIN.location[PATHNAME], pn);
            }
            return obj;
        },
        /**
         * 解析href的query和hash，默认href为window.location.href
         * @param {String} [href] href
         * @return {Object} 解析的对象
         */
        parseQueryAndHash: function(href) {
            href = href || WIN.location.href;

            var me = this;
            var cache = me.qH;
            if(isUtf8) {
                try {
                    href = DECODE(href);
                } catch(ignore) {

                }
            }
            /*var cfg=Magix.config();
        if(!cfg.originalHREF){
            try{
                href=DECODE(href);//解码有问题 http://fashion.s.etao.com/search?q=%CF%CA%BB%A8&initiative_id=setao_20120529&tbpm=t => error:URIError: malformed URI sequence
            }catch(ignore){

            }
        }*/
            if(HAS(cache, href)) {
                return cache[href];
            }
            var tPathname;
            var params = href.replace(/^[^?#]+/g, function(m) {
                tPathname = me.parsePath(m)[PATHNAME];
                return EMPTY;
            });
            var query = tPathname + params.replace(/^([^#]+).*$/g, '$1');
            var hash = params.replace(/^[^#]*#?!?/g, EMPTY); //原始hash
            //
            var queryObj = me.parsePath(query);
            //
            var hashObj = me.parsePath(hash); //去掉可能的！开始符号
            //
            var comObj = {}; //把query和hash解析的参数进行合并，用于hash和pushState之间的过度
            MIX(comObj, queryObj.params);
            MIX(comObj, hashObj.params);
            return cache[href] = {
                isPathnameDiff: isPathnameDiff,
                isParamDiff: isParamDiff,
                hashParamsOwn: hashParamsOwn,
                queryParamsOwn: queryParamsOwn,
                get: getParam,
                originalQuery: query,
                originalHash: hash,
                query: queryObj,
                hash: hashObj,
                params: comObj
            };
        },
        /**
         * 解析href字符串为对象,默认为window.location.href
         * @param {String} [href] href
         * @return {Object}
         */
        parseLocation: function(href) {
            var me = this;
            var queryHash = me.parseQueryAndHash(href);

            //
            var tempPathname;
            /*
            1.在选择pathname时，不能简单的把hash中的覆盖query中的。有可能是从不支持history state浏览器上拷贝链接到支持的浏览器上，分情况而定：
            如果hash中存在pathname则使用hash中的，否则用query中的

            2.如果指定不用history state则直接使用hash中的pathname

            以下是对第1条带hash的讨论
            // http://etao.com/list/?a=b#!/home?page=2&rows=20
            //  /list/index
            //  /home
            //   http://etao.com/list?page=3#!/home?page=2;
            // 情形A. pathname不变 http://etao.com/list?page=3#!/list?page=2 到支持history state的浏览器上 参数合并;
            // 情形B .pathname有变化 http://etao.com/list?page=3#!/home?page=2 到支持history state的浏览器上 参数合并,pathname以hash中的为准;
        */
            if(mxConfig.nativeHistory) { //指定使用history state
                /*
            if(me.supportState()){//当前浏览器也支持
                if(hashObj[PATHNAME]){//优先使用hash中的，理由见上1
                    tempPathname=hashObj[PATHNAME];
                }else{
                    tempPathname=queryObj[PATHNAME];
                }
            }else{//指定使用history 但浏览器不支持 说明服务器支持这个路径，规则同上
                if(hashObj[PATHNAME]){//优先使用hash中的，理由见上1
                    tempPathname=hashObj[PATHNAME];
                }else{
                    tempPathname=queryObj[PATHNAME];
                }
            }
            合并后如下：
            */
                //
                if(queryHash.hash[PATHNAME]) {
                    tempPathname = queryHash.hash[PATHNAME];
                } else {
                    tempPathname = queryHash.query[PATHNAME];
                }
            } else { //指定不用history state ，那咱还能说什么呢，直接用hash
                tempPathname = queryHash.hash[PATHNAME];
            }
            var view = me.getViewPath(tempPathname);
            return MIX(queryHash, view);
            /*return MIX(queryHash,{ //先不加referrer
            referrer:me.$referrer||EMPTY,
            referrerLocation:me.$lLoc||null
        });*/
        },
        /**
         * 获取2个location对象之间的差异部分
         * @param  {Object} oldLocation 原始的location对象
         * @param  {Object} newLocation 当前的location对象
         * @return {Object} 返回包含差异信息的对象
         */
        getChangedLocation: function(oldLocation, newLocation) {
            var temp = {
                params: {}
            };
            if(oldLocation[PATHNAME] != newLocation[PATHNAME]) {
                temp[PATHNAME] = true;
            }
            if(oldLocation.view != newLocation.view) {
                temp.view = true;
            }
            var keys = Magix.keys(oldLocation.params);
            keys = keys.concat(Magix.keys(newLocation.params));
            for(var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if(oldLocation.params[key] !== newLocation.params[key]) {
                    temp.params[key] = true;
                }
            }
            temp.isParam = isParam;
            temp.isPathname = isPathname;
            temp.isView = isView;
            //temp.isParamChangedExcept=isParamChangedExcept;
            return temp;
        },
        /**
         * 根据window.location.href路由并派发相应的事件
         */
        route: function() {
            var me = this;
            var location = me.parseLocation();
            var oldLocation = me.$lLoc || {
                params: {}
            };
            var firstFire = !me.$lLoc; //是否强制触发的locationChange，对于首次加载会强制触发一次
            me.$lLoc = location;

            var oldViewPath = oldLocation.view || EMPTY;
            var fire;
            if(location.view == oldViewPath) { //要加载的根view路径没变化
                if(!me.compareLocation(oldLocation, location)) { //比较参数是否有变化
                    fire = true;
                }
            } else {
                fire = true;
            }
            if(fire) {
                me.$tLoc = location;
                var changed = me.getChangedLocation(oldLocation, location);
                me.fire('locationChanged', {
                    location: location,
                    changed: changed,
                    firstFire: firstFire
                });
            }
            //me.$loc=location;
            //
        },
        /**
         * 比较2个location值内容是否一样
         * @param {Object} oldLocation 原有的location对象
         * @param {Object} newLocation 现在的location对象
         * @return {Object} 是否一样
         */
        compareLocation: function(oldLocation, newLocation) {
            if(oldLocation[PATHNAME] != newLocation[PATHNAME]) {
                return false;
            }
            return this.compareObject(oldLocation.params, newLocation.params);
        },
        /**
         * 导航到当前的路径
         * @param  {String} path 路径
         */
        navigate2: function(path) {
            var me = this;
            if(path && Magix.isString(path)) {
                var pathObj = me.parsePath(path);

                if(pathObj[PATHNAME]) {
                    if(mxConfig.nativeHistory && !me.supportState()) { //指定使用history state但浏览器不支持，需要把query中的存在的参数以空格替换掉
                        var query = me.$tLoc.query;
                        if(query && (query = query.params)) {
                            for(var p in query) {
                                if(HAS(query, p) && !HAS(pathObj.params, p)) {
                                    pathObj.params[p] = EMPTY;
                                }
                            }
                        }
                    }
                } else { //如果解析出来的不包含pathname则表示只传递的参数
                    //
                    var tempParams = MIX({}, me.$tLoc.params);
                    tempParams = MIX(tempParams, pathObj.params);
                    pathObj.params = tempParams;
                    pathObj[PATHNAME] = me.$tLoc[PATHNAME]; //使用原始的pathname
                }
                //
                if(!me.compareLocation(pathObj, me.$tLoc)) {
                    me.$tLoc = pathObj;

                    var tempPath = Magix.objectToPath(pathObj);
                    if(me.supportState()) { //如果使用pushState
                        me.$firedPop = true;
                        history.pushState(new Date(), D.title, tempPath); //new Date属于yy出来的
                        me.route();
                    } else {
                        /*
                        window.onhashchange=function(e){

                        };
                        (function(){
                            location.hash='a';
                            location.hash='b';
                            location.hash='c';
                        }());


                     */
                        var loc = me.parseLocation(tempPath);
                        me.fire('locationChanged', {
                            loc: loc,
                            slient: true
                        });
                        location.hash = '#!' + tempPath;
                    }
                }
            }
        },
        /**
         * 根据参数进行有选择的导航
         * @param  {Object|String} params 对象
         * @param {String} [pathname] 可选的pathname
         * @example
         * KISSY.use('magix/router',function(S,R){
         *      R.navigate('/list?page=2&rows=20');//改变pathname和相关的参数，地址栏上的其它参数会进行丢弃，不会保留
         *      R.navigate('page=2&rows=20');//只修改参数，地址栏上的其它参数会保留
         *      R.navigate({//通过对象修改参数，地址栏上的其它参数会保留
         *          page:2,
         *          rows:20
         *      });
         *
         *      R.navigate({
         *          page:2,
         *          rows:20
         *      },'/list');//导航到 /list?page=2&rows=20
         * });
         */
        /*
        1.
            render:function(){

            },
            events:{
                click:{
                    changeHash:function(e){
                        Router.navigate('a='+S.now());
                        Router.navigate('b='+S.now());
                        e.view.render();
                    }
                }
            }
     */
        navigate: function(params, pathname) {
            if(Magix.isObject(params)) {
                var arr = [];
                for(var p in params) {
                    arr.push(p + '=' + (isUtf8 ? ENCODE(params[p]) : params[p]));
                }
                params = arr.join('&');
                if(pathname) {
                    params = pathname + '?' + params;
                }
            }

            this.navigate2(params);
        }

        /**
         * 当window.location.href有改变化时触发
         * @name Router.locationChanged
         * @event
         * @param {Object} e 事件对象
         * @param {Object} e.location 地址解析出来的对象，包括query hash 以及 query和hash合并出来的params等
         * @param {Object} e.changed 有哪些值发生改变的对象
         * @param {Boolean} e.firstFire 标识是否是第一次强制触发的locationChanged，对于首次加载完Magix，会强制触发一次locationChanged
         */

    }, Event);
    return Magix.mix(Router, IRouter);
}, {
    requires: ["magix/impl/router", "magix/magix", "magix/event"]
});
/**
 * @fileOverview Vframe类
 * @author 行列
 * @version 1.0
 */
KISSY.add('magix/vframe', function(S, Magix, Event, BaseView) {
    var D = document;
    var VframeIdCounter = 0;
    var WIN = window;
    var CollectGarbage = WIN.CollectGarbage || Magix.noop;
    var safeExec = Magix.safeExec;
    var Mix = Magix.mix;
    var TagName = Magix.cfg.tagName;

    var DataView = 'mx-view';

    var $ = function(id) {
            return typeof id == 'object' ? id : D.getElementById(id);
        };
    var $$ = function(id, tag) {
            return $(id).getElementsByTagName(tag);
        };
    var $C = function(tag) {
            return D.createElement(tag);
        };
    $C(TagName);

    var ViewLoad = 'viewLoad';

    var DestroySubVframes = function(anim) {
            var me = this;
            me.rC = 0;
            me.rM = {};
            me.parentAlter();
            var view = me.view;
            safeExec(view.fire, 'childrenAlter', view);
            me.unmountZoneVframes(0, anim);
        };
    var ScriptsReg = /<script[^>]*>[\s\S]*?<\/script>/ig
    /**
     * Vframe类
     * @name Vframe
     * @class
     * @constructor
     * @borrows Event.on as this.on
     * @borrows Event.fire as this.fire
     * @borrows Event.un as this.un
     * @param {HTMLElement} element dom节点
     * @property {String} id vframe id
     * @property {Array} children 子vframes
     * @property {View} view view对象
     * @property {VOM} owner VOM对象
     */
    var Vframe = function(element) {
            var me = this;
            me.id = Vframe.idIt(element);
            me.vId = me.id + '_view';
            me.cS = {};
            me.cC = 0;
            me.view = null;
            me.rC = 0;
            me.rM = {};
        };

    Mix(Vframe, {
        /**
         * @lends Vframe
         */
        /**
         * 给dom元素添加id
         * @param {HTMLElement} dom dom节点
         * @return {String} 节点的id
         */
        idIt: function(dom) {
            return dom.id || (dom.id = 'magix_vf_' + (VframeIdCounter++));
        },
        /**
         * 创建Vframe对象
         * @param {HTMLElement|String} element dom节点
         * @param {Object} ops     其它属性
         * @return {Vframe} 返回Vframe对象
         */
        create: function(element, ops) {
            element = $(element);
            var vf = new Vframe(element);
            Mix(vf, ops);
            return vf;
        },
        /**
         * 创建vframe DOM节点
         * @param {String} id     节点id
         * @param {HTMLElement} before 插入在哪个节点前面
         */
        createNode: function(id, before) {
            var vfNode = $C(TagName);
            vfNode.id = id;
            before.parentNode.insertBefore(vfNode, before);
        }
    });
    /*
    修正IE下标签问题
    @2012.11.23
    暂时先不修正，如果页面上有vframe标签先create一下好了，用这么多代码代替一个document.createElement('vframe')太不值得
 */
    /*(function(){
    var badVframes=$$(D,'/'+Vframe.tagName);
    var temp=[];
    for(var i=0,j=badVframes.length;i<j;i++){
        temp.push(badVframes[i]);
    }
    badVframes=temp;
    for(var i=0,j=badVframes.length;i<j;i++){
        var bVf=badVframes[i];
        var pv=bVf.previousSibling;
        var rVf=$C(Vframe.tagName);
        var pNode=pv.parentNode;
        var anchorNode=bVf.nextSibling;
        var vframeId;
        var vframeViewName;
        pNode.removeChild(bVf);
        temp=[];
        while(pv){
            if(pv.tagName&&pv.tagName.toLowerCase()==Vframe.tagName){
                vframeId=pv.id;
                vframeViewName=pv.getAttribute(DataView);
                pNode.removeChild(pv);
                break;
            }else{
                temp.push(pv);
                pv=pv.previousSibling;
            }
        }
        while(temp.length){
            rVf.appendChild(temp.pop());
        }
        pNode.insertBefore(rVf,anchorNode);
        if(vframeId){
            rVf.id=vframeId;
        }
        if(vframeViewName){
            rVf.setAttribute(DataView,vframeViewName);
        }
    }
}());*/
    //
    Mix(Vframe.prototype, Event);
    Mix(Vframe.prototype, {
        /**
         * @lends Vframe#
         */
        /**
         * 是否启用场景转场动画，相关的动画并未在该类中实现，如需动画，需要mxext/vfanim扩展来实现，设计为方法而不是属性可方便针对某些vframe使用动画
         * @return {Boolean}
         * @default false
         */
        useAnimUpdate: function() {
            return false;
        },
        /**
         * 转场动画时或当view启用刷新动画时，旧的view销毁时调用
         * @function
         */
        oldViewDestroy: Magix.noop,
        /**
         * 转场动画时或当view启用刷新动画时，为新view准备好填充的容器
         * @function
         */
        prepareNextView: Magix.noop,
        /**
         * 转场动画时或当view启用刷新动画时，新的view创建完成时调用
         * @function
         */
        newViewCreated: Magix.noop,
        /**
         * 加载对应的view
         * @param {String} viewPath 形如:app/views/home?type=1&page=2 这样的名称
         * @param {Object|Null} viewInitParams view在调用init时传递的参数
         */
        mountView: function(viewPath, viewInitParams) {
            var me = this;
            var node = $(me.id);
            if(!node._dataBak) {
                node._dataBak = 1;
                node._dataTmpl = node.innerHTML.replace(ScriptsReg, '');
            } else {
                node._dataChged = 1;
            }
            var useTurnaround = me.$vN && me.useAnimUpdate();
            me.unmountView(useTurnaround, true);
            if(viewPath) {
                var path = Magix.pathToObject(viewPath);
                var vn = path.pathname;
                me.$vN = vn;
                var callback = function(View) {
                        if(vn != me.$vN) {
                            return; //有可能在view载入后，vframe已经卸载了
                        }
                        BaseView.prepare(View);

                        var vId;
                        if(useTurnaround) {
                            vId = me.vId;
                            me.prepareNextView();
                        } else {
                            vId = me.id;
                        }
                        var view = new View({
                            $: $,
                            path: vn,
                            owner: me,
                            ownerVOM: me.owner,
                            id: vId,
                            vId: me.vId,
                            vfId: me.id,
                            location: me.owner.getLocation()
                        });
                        view.on('interact', function(e) { //view准备好后触发
                            me.fire(ViewLoad, {
                                view: view
                            }, me.vced = true);
                            /*
                        Q:为什么在interact中就进行动画，而不是在rendered之后？
                        A:可交互事件发生后，到渲染出来view的界面还是有些时间的，但这段时间可长可短，比如view所需要的数据都在内存中，则整个过程就是同步的，渲染会很快，也有可能每次数据都从服务器拉取（假设时间非常长），这时候渲染显示肯定会慢，如果到rendered后才进行动画，就会有相当长的一个时间停留在前一个view上，无法让用户感觉到程序在运行。通常这时候的另外一个解决办法是，切换到拉取时间较长的view时，这个view会整一个loading动画，也就是保证每个view及时的显示交互或状态内容，这样动画在做转场时，从上一个view转到下一个view时都会有内容，即使下一个view没内容也能及时的显示出白板页面，跟无动画时是一样的，所以这个点是最好的一个触发点
                     */
                            if(useTurnaround) {
                                me.newViewCreated(true);
                            }

                            if(!e.tmpl) {
                                if(!useTurnaround && node._dataChged) {
                                    node.innerHTML = node._dataTmpl;
                                }
                                me.mountZoneVframes();
                            }
                            view.on('rendered', function() { //再绑定rendered
                                me.mountZoneVframes();
                            });
                            view.on('prerender', function(e) {
                                DestroySubVframes.call(me, e.anim);
                            });
                        }, 0);

                        me.view = view;
                        var pVframe = me.owner.getVframe(me.pId);
                        if(pVframe && pVframe.view) {
                            path.params.view = pVframe.view;
                        }
                        view.load(Mix(path.params, viewInitParams, true));
                    };
                Magix.libRequire(vn, callback);
            }
            //me.owner.resume();
        },
        /**
         * 销毁对应的view
         * @param {Boolean} useAnim 是否启用动画，在启用动画的情况下，需要保持节点内容，不能删除
         * @param {Boolean} isOutermostView 是否是最外层的view改变，不对内层的view处理
         */
        unmountView: function(useAnim, isOutermostView) {
            var me = this;
            //me.owner.suspend();
            var me = this;

            if(me.view) {
                DestroySubVframes.call(me, useAnim);

                me.view.destroy();
                me.vced = false;
                var node = $(me.id);
                if(!useAnim && node._dataBak) {
                    node.innerHTML = node._dataTmpl;
                }
                if(useAnim && isOutermostView) { //在动画启用的情况下才调用相关接口
                    me.oldViewDestroy();
                }
                CollectGarbage();
                delete me.view;
                delete me.viewName;
            } else if(me.viewName) { //view有可能在未载入就进行了unmoutView
                me.un(ViewLoad);
                delete me.viewName;
            }
            //me.owner.resume();
        },
        /**
         * 加载当前view下面的子view，因为view的持有对象是vframe，所以是加载vframes
         * @param {zoneId} HTMLElement|String 节点对象或id
         */
        mountZoneVframes: function(zoneId, viewInitParams, _byHand) {
            var me = this;
            var owner = me.owner;
            var node;
            if(!zoneId) {
                node = $(me.vId) || $(me.id);
            } else {
                node = $(zoneId);
            }
            var vframes = $$(node, TagName);
            var count = vframes.length;
            if(count) {
                for(var i = 0, vframe, mxView; i < count; i++) {
                    vframe = vframes[i];
                    mxView = vframe.getAttribute(DataView);
                    vframe = Vframe.create(vframe, {
                        owner: me.owner,
                        pId: me.id
                    });
                    if(!Magix.has(me.cS, vframe.id)) {
                        me.cC++;
                    }
                    me.cS[vframe.id] = _byHand;
                    vframe.mountView(mxView, viewInitParams);
                    owner.add(vframe);
                }
            } else {
                me.childrenCreated();
            }
        },
        /**
         * 销毁某个区域下面的所有子vframes
         * @param {zoneId} HTMLElement|String 节点对象或id
         * @param {Boolean} useAnim 是否使用动画，使用动画时DOM节点不销毁
         */
        unmountZoneVframes: function(zoneId, useAnim) {
            var me = this;
            var children;
            if(zoneId) {
                children = $$(zoneId, TagName);
            } else {
                children = Magix.keys(me.cS);
            }
            var child, cId;
            for(var i = 0, j = children.length; i < j; i++) {
                cId = children[i];
                if(zoneId) cId = cId.id;
                if(cId) {
                    child = me.owner.getVframe(cId);
                    child.unmountView(useAnim);
                    me.owner.remove(cId);
                    $(cId).id = '';

                    delete me.cS[cId];
                    me.cC--;
                }
            }
            if(!zoneId) {
                me.cS = {};
                me.cC = 0;
            }
        },
        /**
         * 通知当前vframe，地址栏发生变化
         * @param {Object} e 事件对象
         * @param {Object} e.location window.location.href解析出来的对象
         * @param {Object} e.changed 包含有哪些变化的对象
         */
        locationChanged: function(e) {
            var me = this;
            var view = me.view;
            /*
            重点：
                所有手动mountView的都应该在合适的地方中断消息传递：
            示例：
                <div id="magix_vf_root">
                    <vframe mx-view="app/views/leftmenus" id="magix_vf_lm"></vframe>
                    <vframe id="magix_vf_main"></vframe>
                </div>
            默认view中自动渲染左侧菜单，右侧手动渲染

            考虑右侧vframe嵌套并且缓存的情况下，如果未中断消息传递，有可能造成新渲染的view接收到消息后不能做出正确反映，当然左侧菜单是不需要中断的，此时我们在locationChange中
              return ["magix_vf_lm"];

            假设右侧要这样渲染：
                <vframe mx-view="app/views/home/a" id="vf1"></vframe>

            接收消息渲染main时：
                locChanged(先通知main有loc变化，此时已经知道main下面有vf1了)
                    |
                mountMainView(渲染main)
                    |
                unmountMainView(清除以前渲染的)
                    |
                unmountVf1View(清除vf1)
                    |
                mountVf1View(main渲染完成后渲染vf1)
                    |
                locChangedToA(继续上面的循环到Vf1)

                error;
            方案：
                0.3版本中采取的是在mount某个view时，先做销毁时，直接把下面的子view递归出来，一次性销毁，但依然有问题，销毁完，再渲染，此时消息还要向后走（看了0.3的源码，这块理解的并不正确）

                0.3把块放在view中了，在vom中取出vframe，但这块的职责应该在vframe中做才对，view只管显示，vframe负责父子关系
         */
            if(view && view.sign) {
                view.location = e.location;
                if(view.rendered) { //存在view时才进行广播，对于加载中的可在加载完成后通过调用view.location拿到对应的window.location.href对象，对于销毁的也不需要广播
                    var isChanged = view.olChanged(e);
                    var args = Mix({
                        prevent: function() {
                            this.cs = [];
                        },
                        toChildViews: function(c) {
                            c = c || [];
                            if(Magix.isString(c)) {
                                c = c.split(',');
                            }
                            this.cs = c;
                        }
                    }, e);
                    if(isChanged) { //检测view所关注的相应的参数是否发生了变化
                        //safeExec(view.render,[],view);//如果关注的参数有变化，默认调用render方法
                        //否定了这个想法，有时关注的参数有变化，不一定需要调用render方法
                        safeExec(view.locationChange, args, view);
                    }
                    var cs = args.cs || Magix.keys(me.cS);

                    for(var i = 0, j = cs.length, vom = me.owner, vf; i < j; i++) {
                        vf = vom.getVframe(cs[i]);
                        if(vf) {
                            vf.locationChanged(e);
                        }
                    }
                }
            }
        },
        /**
         * 通知location更新
         * @param  {Object} loc location
         */
        locationUpdated: function(loc) {
            var me = this;
            var view = me.view;
            if(view && view.sign) {
                view.location = loc;
                var children = me.cS;
                var vf;
                var vom = me.owner;
                for(var p in children) {
                    if(Magix.has(children, p)) {
                        vf = vom.getVframe(p);
                        if(vf) {
                            vf.locationUpdated(loc);
                        }
                    }
                }
            }
        },
        /**
         * 通知所有的子view创建完成
         */
        childrenCreated: function() {
            var me = this;
            var view = me.view;
            if(view && !me.fcc) {
                me.fcc = 1;
                view.fire('childrenCreated');
                me.fire('childrenCreated');
            }
            me.owner.childCreated();
            me.parentAlter(true);
        },
        /**
         * 通知父vframe有变化
         * @param {Boolean} rendered 是否是view的渲染完成
         */
        parentAlter: function(rendered) {
            var me = this;
            var pId = me.pId;
            if(pId) {
                var parent = me.owner.getVframe(pId);
                if(rendered) {
                    if(!Magix.has(parent.rM, me.id)) {
                        parent.rM[me.id] = parent.cS[me.id];
                        parent.rC++;
                        if(parent.rC == parent.cC) {

                            delete parent.fca;
                            parent.childrenCreated();
                        }
                        /*else{无需求，暂时不加
                        parent.view.fire('childrenProgress',{complete:parent.rC/parent.cC});

                        view1 view2  childrenCreated;
                        mountZoneViews: view3
                        xx childrenCreated;

                        unmountZoneViews:view3

                        xx childrenAlter;

                    }*/
                    }
                } else {
                    if(Magix.has(parent.rM, me.id)) {
                        var byHand = parent.rM[me.id];
                        delete parent.rM[me.id];
                        parent.rC--;

                        if(!byHand && !parent.fca) { //childrenAlter只触发一次
                            parent.fca = 1;
                            delete parent.fcc;

                            parent.view.fire('childrenAlter');
                            parent.fire('childrenAlter');
                        }
                        if(!byHand) {
                            parent.parentAlter(rendered);
                        }
                    }
                }
            }
        } //,
        /**
         * 向当前vframe发送消息
         * @param {Object} args 消息对象
         */
        /*message:function(args){
        var me=this;
        var view=me.view;
        if(view&&me.vced){*/
        //表明属于vframe的view对象已经加载完成
        /*
                考虑
                <vframe id="v1" mx-view="..."></vframe>
                <vframe id="v2" mx-view="..."></vframe>
                <vframe id="v3" mx-view="..."></vframe>

                v1渲染后postMessage向v2 v3发消息，此时v2 v3的view对象是构建好了，但它对应的模板可能并未就绪，需要等待到view创建完成后再发消息过去
             */
        //if(view.rendered){
        //safeExec(view.receiveMessage,args,view);
        /*}else{ //使用ViewLoad
                view.on('created',function(){
                    safeExec(this.receiveMessage,args,this);
                });
            }   */
        //}else{//经过上面的判断，到这一步说明开始加载view但尚未加载完成
        /*
                Q:当vframe没有view属性但有viewName表明属于这个vframe的view异步加载尚未完成，但为什么还要向这个view发送消息呢，丢弃不可以吗？

                A:考虑这样的情况，页面上有A B两个view，A在拿到数据完成渲染后会向B发送一个消息，B收到消息后才渲染。在加载A B两个view时，是同时加载的，这两个加载是异步，A在加载、渲染完成向B发送消息时，B view对应的js文件很有可能尚未载入完成，所以这个消息会由B vframe先持有，等B对应的view载入后再传递这个消息过去。如果不传递这个消息则Bview无法完成后续的渲染。vframe是通过对内容分析立即就构建出来的，view是对应的js加载完成才存在的，因异步的存在，所以需要这样的处理。
             */
        /*
            me.on(ViewLoad,function(e){
                safeExec(e.view.receiveMessage,args,e.view);
            });
        }
    }*/
        /**
         * view加载完成时触发
         * @name Vframe#viewLoad
         * @event
         * @param {Object} e view加载完成后触发
         * @param {Object} e.view 加载的view对象
         */

        /**
         * 子孙view修改时触发
         * @name Vframe#childrenAlter
         * @event
         * @param {Object} e
         */

        /**
         * 子孙view创建完成时触发
         * @name Vframe#childrenCreated
         * @event
         * @param {Object} e
         */
    });
    return Vframe;
}, {
    requires: ["magix/magix", "magix/event", "magix/view"]
});
/**
 * @fileOverview view类
 * @author 行列
 * @version 1.0
 */
KISSY.add('magix/view', function(S, IView, Magix, Event, Body) {
    var IdCounter = 1;
    var safeExec = Magix.safeExec;
    var HAS = Magix.has;
    var COMMA = ',';
    var EMPTY_ARRAY = [];
    var MxConfig = Magix.cfg;
    /**
     * View类
     * @name View
     * @class
     * @constructor
     * @borrows Event.on as this.on
     * @borrows Event.fire as this.fire
     * @borrows Event.un as this.un
     * @param {Object} ops 创建view时，需要附加到view对象上的其它属性
     * @property {Object} events 事件对象
     * @property {String} id 当前view与页面vframe节点对应的id
     * @property {Vframe} owner 拥有当前view的vframe对象
     * @property {Object} ownerVOM vom对象
     * @property {Integer} sign view的签名，用于刷新，销毁等的异步标识判断
     * @property {String} template 当前view对应的模板字符串(当hasTemplate为true时)，该属性在created事件触发后才存在
     * @property {Boolean} rendered 标识当前view有没有渲染过，即created事件有没有触发过
     * @property {Object} location window.locaiton.href解析出来的对象
     * @example
     * 关于View.prototype.events:
     * 示例：
     *   html写法：
     *
     *   &lt;input type="button" mxclick="test:100@id:xinglie@name" value="test" /&gt;
     *   &lt;a href="http://etao.com" mxclick="test:etao.com:_prevent_"&gt;http://etao.com&lt;/a&gt;
     *
     *   view写法：
     *
     *   events:{
     *      click:{
     *          test:function(e){
     *              //e.view  当前view对象
     *              //e.currentId 处理事件的dom节点id
     *              //e.targetId 触发事件的dom节点id
     *              //e.events  view.events对象，可访问其它事件对象，如：e.events.mousedown.test
     *              //e.params  传递的参数
     *              //如果在html上写：mxclick="test:etao.com:_prevent_"，用冒号分割的一个字符串，第1个冒号前的表示要调用的方法。当最后一个是_prevent_（调用e.preventDefault）,_stop_（调用e.stopPropagation）,_halt_（阻止默认行为和冒泡）时，丢弃最后一个，把etao.com做为参数传入，可以用e.params[0]获取
     *              //如果是mxclick="test:100@id:xinglie@name"时，可以用e.params.id e.params.name取得相应的值，这样更直观些
     *          }
     *      },
     *      mousedown:{
     *          test:function(e){
     *
     *          }
     *      }
     *   }
     */
    var WrapAsynUpdateNames = {
        render: 1,
        renderUI: 1,
        updateUI: 1
    };
    var WrapKey = '~~';
    var WrapFn = function(fn) {
            return function() {
                var me = this;
                var r;
                if(me.sign) {
                    me.sign++;
                    me.fire('asyncall');
                    r = fn.apply(me, arguments);
                    me.fire('asyncalled');
                }
                return r;
            }
        };

    var View = function(ops) {
            var me = this;
            Magix.mix(me, ops);
            me.sign = 1; //标识view是否刷新过，对于托管的函数资源，在回调这个函数时，不但要确保view没有销毁，而且要确保view没有刷新过，如果刷新过则不回调
        };
    var BaseViewProto = View.prototype;
    Magix.mix(View, {
        /**
         * @lends View
         */
        /**
         * 给dom节点添加id
         * @param {HTMLElement} dom html节点
         * @return {String} 节点id
         * @private
         */
        idIt: function(dom) {
            return dom.id || (dom.id = 'magix_mxe_' + (IdCounter++));
        },
        /**
         * 对异步更新view的方法进行一次包装
         * @private
         */
        wrapAsyn: function() {
            var view = this;
            if(!view[WrapKey]) { //只处理一次
                view[WrapKey] = 1;
                var prop = view.prototype;
                var old;
                for(var p in prop) {
                    old = prop[p];
                    var wrap = null;
                    if(Magix.isFunction(old) && old != Magix.noop && !old[WrapKey] && HAS(WrapAsynUpdateNames, p)) {
                        wrap = WrapFn(old);
                        wrap[WrapKey] = old;
                        prop[p] = wrap;
                    }
                }
            }
        }
    });


    var VProto = View.prototype;
    var CollectGarbage = window.CollectGarbage || Magix.noop;
    var MxEvent = /\smx[a-z]+\s*=/g;

    Magix.mix(VProto, Event);

    Magix.mix(VProto, {
        /**
         * @lends View#
         */
        /**
         * 使用xhr获取当前view对应的模板内容，仅在开发app阶段时使用，打包上线后html与js打包在一起，不会调用这个方法
         * @function
         * @param {String} path 路径
         * @param {Function} fn 获取完成后的回调
         */

        /**
         * 渲染view，供最终view开发者覆盖
         * @function
         */
        render: Magix.noop,
        /**
         * 当window.location.href有变化时调用该方法（如果您通过observeLocation指定了相关参数，则这些相关参数有变化时才调用locationChange，否则不会调用），供最终的view开发人员进行覆盖
         * @function
         * @param {Object} e 事件对象
         * @param {Object} e.location window.location.href解析出来的对象
         * @param {Object} e.changed 包含有哪些变化的对象
         * @param {Function} e.prevent 阻止向所有子view传递locationChange的消息
         * @param {Function} e.toChildViews 向特定的子view传递locationChange的消息
         * @example
         * //example1
         * locationChange:function(e){
         *     if(e.changed.isPathname()){//pathname的改变
         *         //...
         *         e.prevent();//阻止向所有子view传递改变的消息
         *     }
         * }
         *
         * //example2
         * locationChange:function(e){
         *     if(e.changed.isParam('menu')){//menu参数发生改变
         *         e.toChildViews('magix_vf_menus');//只向id为 magix_vf_menus的view传递这个消息
         *     }
         * }
         *
         * //example3
         * //当不调用e的阻止或指定子view时，默认向所有子view传递消息
         * locationChange:function(e){
         *     //...
         * }
         */
        locationChange: Magix.noop,
        /**
         * 初始化方法，供最终的view开发人员进行覆盖
         * @function
         */
        init: Magix.noop,
        /**
         * 标识当前view是否有模板文件
         * @default true
         */
        hasTemplate: true,
        /**
         * 是否启用DOM事件(events对象指定的事件是否生效)
         * @default true
         * @example
         * 该属性在做浏览器兼容时有用：支持pushState的浏览器阻止a标签的默认行为，转用pushState，不支持时直接a标签跳转，view不启用事件
         * Q:为什么不支持history state的浏览器上还要使用view？
         * A:考虑 http://etao.com/list?page=2#!/list?page=3; 在IE6上，实际的页码是3，但后台生成时候生成的页码是2，<br />所以需要magix/view载入后对相应的a标签链接进行处理成实际的3。用户点击链接时，由于view没启用事件，不会阻止a标签的默认行为，后续才是正确的结果
         */
        enableEvent: true,
        /**
         * view刷新时是否采用动画
         * @type {Boolean}
         */
        enableAnim: false,
        /**
         * 加载view内容
         * @private
         */
        load: function() {
            var me = this;
            var hasTemplate = me.hasTemplate;
            var args = arguments;
            var ready = function() {
                    me.delegateEvents();
                    /*
                关于interact事件的设计 ：
                首先这个事件是对内的，当然外部也可以用，API文档上就不再体现了

                interact : view准备好，让外部尽早介入，进行其它事件的监听 ，当这个事件触发时，view有可能已经有html了(无模板的情况)，所以此时外部可以去加载相应的子view了，同时要考虑在调用render方法后，有可能在该方法内通过setViewHTML更新html，所以在使用setViewHTML更新界面前，一定要先监听prerender rendered事件，因此设计了该  interact事件

             */
                    me.fire('interact', {
                        tmpl: hasTemplate
                    }, true); //可交互
                    safeExec(me.init, args, me);
                    safeExec(me.render, EMPTY_ARRAY, me);
                    //
                    var noTemplateAndNoRendered = !hasTemplate && !me.rendered; //没模板，调用render后，render里面也没调用setViewHTML
                    if(noTemplateAndNoRendered) { //监视有没有在调用render方法内使用setViewHTML更新view，对于没有模板的view，是不需要调用的，此时我们需要添加不冒泡的事件处理，如果调用了，则在setViewHTML中处理，首次就不再处理了，只有冒泡的事件才适合在首次处理
                        me.rendered = true;
                        me.fire('created', null, true); //created事件只触发一次
                    }
                };
            if(hasTemplate) {
                var sign = me.sign;
                me.getTemplate(function(tmpl) { //模板获取也是异步的，防止模板没取回来时，view已经销毁
                    if(sign == me.sign) {
                        me.template = tmpl;
                        ready();
                    }
                });
            } else {
                ready();
            }
        },
        /**
         * 更新view的id，在启用动画的情况下，内部会做id转换
         * @private
         */
        updateViewId: function() {
            var me = this;
            if(me.$(me.vId)) {
                me.id = me.vId;
            } else {
                me.id = me.vfId;
            }
        },
        /**
         * @private
         */
        beginUpdateHTML: function() {
            var me = this;
            if(me.sign) {
                var isRendered = me.rendered;
                if(isRendered) { //渲染过才使用动画
                    var enableAnim = me.enableAnim; //
                    //me.fire('refresh',null,true,true);//从最后注册的事件一直清到最先注册的事件
                    me.fire('prerender', {
                        anim: enableAnim
                    });
                    var owner = me.owner;
                    if(enableAnim) {
                        safeExec(owner.oldViewDestroy, EMPTY_ARRAY, owner);
                        safeExec(owner.prepareNextView, EMPTY_ARRAY, owner);
                        me.updateViewId();
                    }
                }
            }
        },
        /**
         * @private
         */
        endUpdateHTML: function() {
            var me = this;
            if(me.sign) {
                if(me.rendered && me.enableAnim) {
                    safeExec(owner.newViewCreated, EMPTY_ARRAY, owner);
                }
                if(!me.rendered) { //触发一次created事件
                    me.fire('created', null, true);
                }
                me.rendered = true;
                me.fire('rendered'); //可以在rendered事件中访问view.rendered属性
                CollectGarbage();
            }
        },
        /**
         * @private
         */
        wrapMxEvent: function(html) {
            return html ? String(html).replace(MxEvent, ' mx-owner="' + this.vfId + '"$&') : html;
        },
        /**
         * 设置view的html内容
         * @param {Strig} html html字符串
         */
        /*
        1.首次调用：
            setNodeHTML -> delegate unbubble events -> rendered(事件) -> created(事件)

        2.再次调用
            refresh(事件) -> prerender(事件) -> undelegate unbubble events -> anim... -> setNodeHTML -> delegate unbubble events -> rendered(事件)

        当prerender、rendered事件触发时，在vframe中

        prerender : unloadSubVframes

        rendered : loadSubVframes
     */
        setViewHTML: function(html) {
            var me = this;
            me.beginUpdateHTML();
            me.$(me.id).innerHTML = me.wrapMxEvent(html);
            me.endUpdateHTML();
        },
        /**
         * 指定要监视地址栏中的哪些值有变化时，或pathname有变化时，当前view的locationChange才会被调用。通常情况下location有变化就会引起当前view的locationChange被调用，但这会带来一些不必要的麻烦，所以你可以指定地址栏中哪些值有变化时才引起locationChange调用，使得view只关注与自已需要刷新有关的参数
         * @param {Array|String|Object} args  数组字符串或对象
         * @example
         * return View.extend({
         *      init:function(){
         *          this.observeLocation('page,rows');//关注地址栏中的page rows2个参数的变化，当其中的任意一个改变时，才引起当前view的locationChange被调用
         *          this.observeLocation({
         *              pathname:true//关注pathname的变化
         *          });
         *          //也可以写成下面的形式
         *          //this.observeLocation({
         *          //    keys:['page','rows'],
         *          //    pathname:true
         *          //})
         *      },
         *      locationChange:function(e){
         *          if(e.changed.isParam('page')){};//检测是否是page发生的改变
         *          if(e.changed.isParam('rows')){};//检测是否是rows发生的改变
         *      }
         * });
         */
        observeLocation: function(args) {
            var me = this;
            if(!me.$loc) me.$loc = {};
            if(Magix.isString(args)) {
                me.$loc.keys = args.split(COMMA)
            } else if(Magix.isArray(args)) {
                me.$loc.keys = args;
            } else if(Magix.isObject(args)) {
                me.$loc.pn = args.pathname;
                me.observeLocation(args.keys);
            }
        },
        /**
         * 指定监控地址栏中pathname的改变
         * @example
         * return View.extend({
         *      init:function(){
         *          this.observePathname();//关注地址栏中pathname的改变，pathname改变才引起当前view的locationChange被调用
         *      },
         *      locationChange:function(e){
         *          if(e.changed.isPathname()){};//是否是pathname发生的改变
         *      }
         * });
         */
        /*observePathname:function(){
        var me=this;
        if(!me.$loc)me.$loc={};
        me.$loc.pn=true;
    },*/
        /**
         * 指定要监视地址栏中的哪些值有变化时，当前view的locationChange才会被调用。通常情况下location有变化就会引起当前view的locationChange被调用，但这会带来一些不必要的麻烦，所以你可以指定地址栏中哪些值有变化时才引起locationChange调用，使得view只关注与自已需要刷新有关的参数
         * @param {Array|String} keys            key数组或字符串
         * @param {Boolean} observePathname 是否监视pathname
         * @example
         * return View.extend({
         *      init:function(){
         *          this.observeParams('page,rows');//关注地址栏中的page rows2个参数的变化，当其中的任意一个改变时，才引起当前view的locationChange被调用
         *      },
         *      locationChange:function(e){
         *          if(e.changed.isParam('page')){};//检测是否是page发生的改变
         *          if(e.changed.isParam('rows')){};//检测是否是rows发生的改变
         *      }
         * });
         */
        /*observeParams:function(keys){
        var me=this;
        if(!me.$loc)me.$loc={};
        me.$loc.keys=Magix.isArray(keys)?keys:String(keys).split(COMMA);
    },*/
        /**
         * 检测通过observeLocation方法指定的key对应的值有没有发生变化
         * @param {Object} e Router.locationChanged事件对象
         * @return {Boolean} 是否发生改变
         * @private
         */
        olChanged: function(e) {
            var me = this;
            var location = me.$loc;
            var changed = e.changed;
            if(location) {
                var res = false;
                if(location.pn) {
                    res = changed.isPathname();
                }
                if(!res) {
                    var keys = location.keys;
                    res = changed.isParam(keys);
                }
                return res;
            }
            return true;
        },
        /**
         * 销毁当前view内的iframes
         */
        /*destroyFrames:function(){
        /*var me=this;
        var node=$(me.id),
            iframes=node.getElementsByTagName('iframe'),
            iframe, parent;
        while (iframes.length) {
            iframe = iframes[0];
            parent = iframe.parentNode;
            iframe.src = EMPTY; // 似乎是关键步骤
            parent.removeChild(iframe);
            //parent.parentNode.removeChild(parent);
            iframe = parent = null;
        }*/
        /*if(WIN.CollectGarbage){
            WIN.CollectGarbage();
        }
    },*/
        /**
         * 销毁当前view
         * @private
         */
        destroy: function() {
            var me = this;
            //me.fire('refresh',null,true,true);//先清除绑定在上面的app中的刷新
            me.fire('destroy', null, true, true); //同上
            me.delegateEvents(true);
            //if(!keepContent){
            //me.destroyFrames();
            //var node=$(me.vfId);
            //if(node._dataBak){
            //node.innerHTML=node._dataTmpl;
            //}
            //}
            //me.un('prerender',null,true); 销毁的话也就访问不到view对象了，这些事件不解绑也没问题
            //me.un('rendered',null,true);
            me.sign = 0;
            //
        },
        /**
         * 获取当前view对应的模板
         * @param {Function} fn 取得模板后的回调方法
         */
        getTemplate: function(fn) {
            var me = this;
            if(me.template) {
                fn(me.template);
            } else {
                var tmpl = Magix.tmpl(me.path);
                if(tmpl) {
                    fn(tmpl);
                } else {
                    var isDebug = MxConfig.debug;
                    var suffix = '.html';
                    var path = MxConfig.appHome + me.path + suffix;
                    if(isDebug) {
                        path += '?_=' + new Date().getTime() + suffix;
                    }
                    me.getTmplByXHR(path, function(tmpl) {
                        fn(Magix.tmpl(me.path, tmpl));
                    });
                }
            }
        },
        /**
         * 处理dom事件
         * @param {Event} e dom事件对象
         * @private
         */
        processEvent: function(e) {
            var me = this;
            if(me.enableEvent && me.sign) {
                var target = e.target;
                var current = e.current;
                var info = e.info;
                var type = e.type;
                var domEvent = e.domEvent;

                if(info) {
                    var infos = info.split(':');
                    var evtName = infos.shift();
                    var flag = infos[infos.length - 1];
                    var popLast;

                    /*
                    考虑到与第三方组件集成，所以暂试点取消事件冒泡的功能
                    @2012.11.30 对于弹出层内删除节点的问题，似乎只有取消冒泡能解决，所以还是恢复原来的样子，晕哦
                 */
                    if(flag == '_halt_' || flag == '_stop_') {
                        if(domEvent.stopPropagation) {
                            domEvent.stopPropagation();
                        } else {
                            domEvent.cancelBubble = true;
                        }
                        popLast = true;
                    }
                    if(flag == '_halt_' || flag == '_prevent_') {
                        if(domEvent.preventDefault) {
                            domEvent.preventDefault();
                        } else {
                            domEvent.returnValue = false;
                        }
                        popLast = true;
                    }
                    if(popLast) infos.pop();

                    var id = View.idIt(current);
                    var events = me.events;
                    var eventsType = events[domEvent.type];
                    //
                    for(var i = 0, atPos; i < infos.length; i++) {
                        atPos = infos[i].lastIndexOf('@');
                        if(atPos > -1) {
                            infos[infos[i].substring(atPos + 1)] = infos[i].substring(0, atPos);
                        }
                    }
                    if(eventsType[evtName]) {
                        safeExec(eventsType[evtName], {
                            view: me,
                            currentId: id,
                            targetId: View.idIt(target),
                            domEvent: domEvent,
                            events: events,
                            params: infos
                        }, eventsType);
                        //
                    }
                }
            }
        },
        /**
         * 处理代理事件
         * @param {Boolean} bubble  是否冒泡的事件
         * @param {Boolean} dispose 是否销毁
         * @private
         */
        delegateEvents: function(destroy) {
            var me = this;
            var events = me.events;
            var fn = destroy ? Body.detachEvent : Body.attachEvent;
            for(var p in events) {
                fn.call(Body, p);
            }
        },
        /**
         * 当您采用setViewHTML方法异步更新html时，通知view做好异步更新的准备，<b>注意:该方法最好和manage，setViewHTML一起使用。当您采用其它方式异步更新整个view的html时，仍需调用该方法</b>，建议对所有的异步更新回调使用manage方法托管，对更新整个view html前，调用beginAsyncUpdate进行更新通知
         * @example
         * // 什么是异步更新html？
         * render:function(){
         *      var _self=this;
         *      var m=new Model({uri:'user:list'});
         *      m.load({
         *          success:_self.manage(function(data){
         *              var html=Mu.to_html(_self.template,data);
         *              _self.setViewHTML(html);
         *          }),
         *          error:_self.manage(function(msg){
         *              _self.setViewHTML(msg);
         *          })
         *      })
         * }
         *
         * //如上所示，当调用render方法时，render方法内部使用model异步获取数据后才完成html的更新则这个render就是采用异步更新html的
         *
         * //异步更新带来的问题：
         * //view对象监听地址栏中的某个参数，当这个参数发生变化时，view调用render方法进行刷新，因为是异步的，所以并不能立即更新界面，
         * //当监控的这个参数连续变化时，view会多次调用render方法进行刷新，由于异步，你并不能保证最后刷新时发出的异步请求最后返回，
         * //有可能先发出的请求后返回，这样就会出现界面与url并不符合的情况，比如tabs的切换和tabPanel的更新，连续点击tab1 tab2 tab3
         * //会引起tabPanel这个view刷新，但是异步返回有可能3先回来2最后回来，会导致明明选中的是tab3，却显示着tab2的内容
         * //所以要么你自已在回调中做判断，要么把上面的示例改写成下面这样的：
         *  render:function(){
         *      var _self=this;
         *      _self.beginAsyncUpdate();//开始异步更新
         *      var m=new Model({uri:'user:list'});
         *      m.load({
         *          success:_self.manage(function(data){
         *              var html=Mu.to_html(_self.template,data);
         *              _self.setViewHTML(html);
         *          }),
         *          error:_self.manage(function(msg){
         *              _self.setViewHTML(msg);
         *          })
         *      });
         *      _self.endAsyncUpdate();//结束异步更新
         * }
         * //其中endAsyncUpdate是备用的，把你的异步更新的代码放begin end之间即可
         * //当然如果在每个异步更新的都需要这样写的话来带来差劲的编码体验，所以View会对render,renderUI,updateUI三个方法自动进行异步更新包装
         * //您在使用这三个方法异步更新html时无须调用beginAsyncUpdate和endAsyncUpdate方法
         * //如果除了这三个方法外你还要添加其它的异步更新方法，可调用View静态方法View.registerAsyncUpdateName来注册自已的方法
         * //请优先考虑使用render renderUI updateUI 这三个方法来实现view的html更新，其中render方法magix会自动调用，您就考虑后2个方法吧
         * //比如这样：
         *
         * renderUI:function(){//当方法名为 render renderUI updateUI时您不需要考虑异步更新带来的问题
         *      var _self=this;
         *      setTimeout(this.manage(function(){
         *          _self.setViewHTML(_self.template);
         *      }),5000);
         * },
         *
         * receiveMessage:function(e){
         *      if(e.action=='render'){
         *          this.renderUI();
         *      }
         * }
         *
         * //当您需要自定义异步更新方法时，可以这样：
         * KISSY.add("app/views/list",function(S,MxView){
         *      var ListView=MxView.extend({
         *          updateHTMLByXHR:function(){
         *              var _self=this;
         *              S.io({
         *                  success:_self.manage(function(html){
         *                      //TODO
         *                      _self.setViewHTML(html);
         *                  })
         *              });
         *          },
         *          receiveMessage:function(e){
         *              if(e.action=='update'){
         *                  this.updateHTMLByXHR();
         *              }
         *          }
         *      });
         *      ListView.registerAsyncUpdateName('updateHTMLByXHR');//注册异步更新html的方法名
         *      return ListView;
         * },{
         *      requires:["magix/view"]
         * })
         * //当您不想托管回调方法，又想消除异步更新带来的隐患时，可以这样：
         *
         * updateHTML:function(){
         *      var _self=this;
         *      var begin=_self.beginAsyncUpdate();//记录异步更新标识
         *      S.io({
         *          success:function(html){
         *              //if(_self.sign){//不托管方法时，您需要自已判断view有没有销毁(使用异步更新标识时，不需要判断exist)
         *                  var end=_self.endAsyncUpdate();//结束异步更新
         *                  if(begin==end){//开始和结束时的标识一样，表示view没有更新过
         *                      _self.setViewHTML(html);
         *                  }
         *              //}
         *          }
         *      });
         * }
         *
         * //顺带说一下signature
         * //并不是所有的异步更新都需要托管，考虑这样的情况：
         *
         * render:function(){
         *      ModelFactory.fetchAll({
         *          type:'User_List',
         *          cacheKey:'User_List'
         *      },function(m){
         *          //render
         *      });
         * },
         * //...
         * click:{
         *      addUser:function(e){
         *          var m=ModelFactory.getIf('User_List');
         *          var userList=m.get("userList");
         *          m.beginTransaction();
         *          userList.push({
         *              id:'xinglie',
         *              name:'xl'
         *          });
         *
         *          m.save({
         *              success:function(){//该回调不太适合托管
         *                  m.endTransaction();
         *                  Helper.tipMsg('添加成功')
         *              },
         *              error:function(msg){//该方法同样不适合托管，当数据保存失败时，需要回滚数据，而如果此时view有刷新或销毁，会导致该方法不被调用，无法达到数据的回滚
         *                  m.rollbackTransaction();
         *                  Helper.tipMsg('添加失败')
         *              }
         *          })
         *
         *      }
         * }
         *
         * //以上click中的方法这样写较合适：
         *
         * click:{
         *      addUser:function(e){
         *          var m=ModelFactory.getIf('User_List');
         *          var userList=m.get("userList");
         *          m.beginTransaction();
         *          userList.push({
         *              id:'xinglie',
         *              name:'xl'
         *          });
         *
         *          var sign=e.view.signature();//获取签名
         *
         *          m.save({
         *              success:function(){//该回调不太适合托管
         *                  m.endTransaction();
         *                  if(sign==e.view.signature()){//相等时表示view即没刷新也没销毁，此时才提示
         *                      Helper.tipMsg('添加成功')
         *                  }
         *              },
         *              error:function(msg){//该方法同样不适合托管，当数据保存失败时，需要回滚数据，而如果此时view有刷新或销毁，会导致该方法不被调用，无法达到数据的回滚
         *                  m.rollbackTransaction();
         *                  if(sign==e.view.signature()){//view即没刷新也没销毁
         *                      Helper.tipMsg('添加失败')
         *                  }
         *              }
         *          })
         *
         *      }
         * }
         *
         * //如果您无法识别哪些需要托管，哪些需要签名，统一使用托管方法就好了
         */
        /*beginAsyncUpdate:function(){
        return this.sign++;//更新sign
    },*/
        /**
         * 获取view在当前状态下的签名，view在刷新或销毁时，均会更新签名。(通过签名可识别view有没有搞过什么动作)
         */
        /*    signature:function(){
        return this.sign;
    },*/
        /**
         * 通知view结束异步更新html
         * @see View#beginAsyncUpdate
         */
        /*endAsyncUpdate:function(){
        return this.sign;
    },*/
        /**
         * 渲染某个区域下的所有views
         * @param {zoneId} HTMLElement|String 节点对象或id
         * @param {Object} [extra] 初始化时的参数
         * @param {Boolean} [asOrphanVframe] 是否作为孤立节点，默认为true
         */
        mountZoneViews: function(zoneId, extra, asOrphanVframe) {
            this.owner.mountZoneVframes(zoneId, extra, asOrphanVframe !== false);
        },
        /**
         * 卸载某个区域下的所有views
         * @param {zoneId} HTMLElement|String 节点对象或id
         */
        unmountZoneViews: function(zoneId) {
            this.owner.unmountZoneVframes(zoneId);
        },
        /**
         * 渲染一个view
         * @param {key} String vframe节点key
         * @param {path} String view的路径
         * @param {initParams} Object 初始化时传递的参数
         * @return {Vframe}
         **/
        mountView: function(key, path, initParams) {
            var me = this;
            var vom = me.ownerVOM;
            var vf = vom.getVframe(key);
            if(vf) {
                vf.mountView(path, initParams);
            }
            return vf;
        }
        /**
         * 当view调用setViewHTML刷新前触发
         * @name View#prerender
         * @event
         * @param {Object} e
         */

        /**
         * 当view首次完成界面的html设置后触发，view有没有模板均会触发该事件，对于有模板的view，会等到模板取回，第一次调用setViewHTML更新界面后才触发，总之该事件触发后，您就可以访问view的HTML DOM节点对象（该事件仅代表自身的html创建完成，如果需要对整个子view也要监控，请使用childrenCreated事件）
         * @name View#created
         * @event
         * @param {Object} e view首次调用render完成界面的创建后触发
         */

        /**
         * 每次调用setViewHTML更新view内容完成后触发
         * @name View#rendered
         * @event
         * @param {Object} e view每次调用setViewHTML完成后触发，当hasTemplate属性为false时，并不会触发该事 件，但会触发created首次完成创建界面的事件
         */

        /**
         * view销毁时触发
         * @name View#destroy
         * @event
         * @param {Object} e
         */

        /**
         * view自身和所有子孙view创建完成后触发，常用于要在某个view中统一绑定事件或统一做字段校验，而这个view是由许多子孙view组成的，通过监听该事件可知道子孙view什么时间创建完成（注意：当view中有子view，且该子view是通过程序动态mountView而不是通过mx-view指定时，该事件会也会等待到view创建完成触发，而对于您在某个view中有如下代码：<div><vframe></vframe></div>，有一个空的vframe且未指定mx-view属性，同时您在这个view中没有动态渲染vframe对应的view，则该事件不会触发，magix无法识别出您留空vframe的意图，到底是需要动态mount还是手误，不过在具体应用中，出现空vframe且没有动态mount几乎是不存在的^_^）
         * @name View#childrenCreated
         * @event
         * @param {Object} e
         * @example
         * init:function(){
         *      this.on('childrenCreated',function(){
         *          //
         *      })
         * }
         */

        /**
         * view自身和所有子孙view有改动时触发，改动包括刷新和重新mountView，与childrenCreated一起使用，当view自身和所有子孙view创建完成会触发childrenCreated，当其中的一个view刷新或重新mountView，会触发childrenAlter，当是刷新时，刷新完成会再次触发childrenCreated事件，因此这2个事件不只触发一次！！但这2个事件会成对触发，比如触发几次childrenAlter就会触发几次childrenCreated
         * @name View#childrenAlter
         * @event
         * @param {Object} e
         */

        /**
         * 异步更新ui的方法(render,updateUI,renderUI)被调用前触发
         * @name View#asyncall
         * @event
         * @param {Object} e
         */

        /**
         * 异步更新ui的方法(render,updateUI,renderUI)被调用后触发
         * @name View#asyncalled
         * @event
         * @param {Object} e
         */
    });
    Magix.mix(View, IView, {
        prototype: true
    });
    Magix.mix(View.prototype, IView.prototype);
    return View;
}, {
    requires: ["magix/impl/view", "magix/magix", "magix/event", "magix/body"]
});
/**
 * @fileOverview VOM
 * @author 行列
 * @version 1.0
 */
KISSY.add("magix/vom", function(S, Vframe, Magix, Event, Body) {
    var D = document;
    var safeExec = Magix.safeExec;
    var rootVframeId = 'magix_vf_root';
    var has = Magix.has;
    var vframesCount = 0;
    var firstVframesLoaded = 0;
    var lastPercent = 0;
    var firstReady = 0;
    var Vframes = {};
    var Loc;
    /**
     * VOM对象
     * @name VOM
     * @namespace
     */
    var VOM = Magix.mix({
        /**
         * @lends VOM
         */
        /**
         * 注册vframe对象
         * @param {Vframe} vf Vframe对象
         */
        add: function(vf) {
            if(!has(Vframes, vf.id)) {
                vframesCount++;
                Vframes[vf.id] = vf;
                VOM.fire('add', {
                    vframe: vf
                });
            }
        },
        /**
         * 根据vframe的id获取vframe对象
         * @param {String} id vframe的id
         * @return {Vframe} vframe对象
         */
        getVframe: function(id) {
            return Vframes[id];
        },
        /**
         * 删除已注册的vframe对象
         * @param {Vframe|String} vf vframe对象或对象的id
         */
        remove: function(vf) {
            var id = Magix.isString(vf) ? vf : vf.id;
            var vf = Vframes[id];
            if(vf) {
                vframesCount--;
                delete Vframes[id];
                VOM.fire('remove', {
                    vframe: vf
                });
            }
        },
        /**
         * 通知其中的一个view创建完成
         */
        childCreated: function() {
            if(!firstReady) {
                firstVframesLoaded++;
                var np = firstVframesLoaded / vframesCount;
                if(lastPercent < np) {
                    VOM.fire('progress', {
                        percent: lastPercent = np
                    });
                    if(np == 1) {
                        firstReady = 1;
                        VOM.un('progress');
                    }
                }
            }
        },
        /**
         * 构建根vframe对象
         */
        getRoot: function() {
            var vf = VOM.getVframe(rootVframeId);
            if(!vf) {
                var rootVframeNode = D.getElementById(rootVframeId);
                if(!rootVframeNode) { //当发现不存在的节点时，由Vframe对象负责创建
                    Vframe.createNode(rootVframeId, D.body.firstChild);
                }
                vf = Vframe.create(rootVframeId, {
                    owner: VOM
                });
                VOM.add(vf);
            }
            return vf;
        },
        /**
         * 重新渲染根vframe
         * @param {Object} e Router.locationChanged事件对象
         * @param {Object} e.location window.location.href解析出来的对象
         * @param {Object} e.changed 包含有哪些变化的对象
         */
        remountRoot: function(e) {
            //
            var vf = VOM.getRoot();
            //me.$loc=e.location;
            //
            Loc = e.location;
            vf.mountView(Loc.view);
        },
        /**
         * 向vframe通知地址栏发生变化
         * @param {Object} e 事件对象
         * @param {Object} e.location window.location.href解析出来的对象
         * @param {Object} e.changed 包含有哪些变化的对象
         */
        locationChanged: function(e) {
            Loc = e.location;
            var vf = VOM.getRoot();
            vf.locationChanged(e);
        },
        /**
         * 更新view的location对象
         * @param  {Object} loc location
         */
        locationUpdated: function(loc) {
            Loc = loc;
            var vf = VOM.getRoot();
            vf.locationUpdated(loc);
        },
        /**
         * 获取window.location.href解析后的对象
         * @return {Object}
         */
        getLocation: function() {
            return Loc;
        }
        /**
         * view加载完成进度
         * @name VOM.progress
         * @event
         * @param {Object} e
         * @param {Object} e.precent 百分比
         */
        /**
         * 注册vframe对象时触发
         * @name VOM.add
         * @event
         * @param {Object} e
         * @param {Vframe} e.vframe
         */
        /**
         * 删除vframe对象时触发
         * @name VOM.remove
         * @event
         * @param {Object} e
         * @param {Vframe} e.vframe
         */
    }, Event);
    Body.on('event', function(e) {
        var vframe = VOM.getVframe(e.handler);
        if(vframe && vframe.view) {
            vframe.view.processEvent(e);
        }
    });
    return VOM;
}, {
    requires: ["magix/vframe", "magix/magix", "magix/event", "magix/body"]
});
/**
 * @fileOverview model管理工厂，可方便的对Model进行缓存和更新
 * @author 行列
 * @version 1.0
 **/
KISSY.add("mxext/mmanager", function(S, Magix) {
    var HAS = Magix.has;
    var safeExec = Magix.safeExec;
    var deleteCacheKey = function(models) {
            if(!Magix.isArray(models)) {
                models = [models];
            }
            for(var i = 0, m; i < models.length; i++) {
                m = models[i];
                delete m.cacheKey;
            }
            return models;
        };
    /**
     * Model管理对象，可方便的对Model进行缓存和更新
     * @name MManager
     * @class
     * @namespace
     * @param {Model} modelClass Model类
     */
    var MManager = function(modelClass) {
            var me = this;
            me.$modelClass = modelClass;
        };

    var Slice = Array.prototype.slice;
    var WhiteList = {
        urlParams: 1,
        postParams: 1,
        cacheKey: 1,
        cacheTime: 1,
        before: 1,
        after: 1
    };
    var getOptions = function(obj) {
            var r = {};
            for(var p in obj) {
                if(!WhiteList[p]) {
                    r[p] = obj[p];
                }
            }
            return r;
        };
    var wrapDone = function(fn, context) {
            var a = Slice.call(arguments, 2);
            return function() {

                return fn.apply(context, a.concat(Slice.call(arguments)));
            }
        };
    Magix.mix(MManager, {
        /**
         * @lends MManager
         */
        /**
         * 创建Model类管理对象
         * @param {Model} modelClass Model类
         */
        create: function(modelClass) {
            var me = this;
            if(!modelClass) {
                throw new Error('MManager.create modelClass ungiven');
            }
            return new MManager(modelClass);
        }
    });
    var FetchFlags = {
        ALL: 1,
        ANY: 2,
        ONE: 4
    };
    /**
     * model请求类
     * @name MRequest
     * @class
     * @namespace
     * @param {MManager} host
     */
    var MRequest = function(host) {
            this.$host = host;
            this.$task = false;
        };

    Magix.mix(MRequest.prototype, {
        /**
         * @lends MRequest#
         */
        /**
         * 创建model对象
         * @param {Object} modelAttrs           model描述信息对象
         * @private
         * @return {Model} model对象
         */
        create: function(modelAttrs) {
            var me = this;
            var host = me.$host;
            if(S.isString(modelAttrs)) {
                modelAttrs = {
                    name: modelAttrs
                };
            }
            var meta = host[modelAttrs.name];

            if(!meta) {
                throw new Error('Not found:' + modelAttrs.name);
            }

            var cacheKey = modelAttrs.cacheKey || meta.cacheKey;
            var entity;

            var cacheTime = modelAttrs.cacheTime || meta.cacheTime || 0;


            if(!host.$modelsCache) host.$modelsCache = {};
            var modelsCache = host.$modelsCache;
            var metaParams = modelAttrs.metaParams || [];
            var needUpdate;

            if(cacheKey && HAS(modelsCache, cacheKey)) { //缓存
                entity = modelsCache[cacheKey];
                if(cacheTime > 0) {

                    if(S.now() - entity._doneAt > cacheTime) {
                        delete modelsCache[cacheKey]; //当有更新时，从缓存中删除，防止多次获取该缓存对象导致数据错误
                        needUpdate = true;
                    }
                }
            } else {
                entity = new host.$modelClass(getOptions(meta));
                entity._after = meta.after;
                entity._cacheKey = cacheKey;
                entity._meta = meta;
                needUpdate = true;
            }

            entity.metaParams = metaParams;

            if(needUpdate) {
                entity.reset();
                entity.set(getOptions(modelAttrs));
                //默认设置的
                entity.setUrlParams(meta.urlParams);
                entity.setPostParams(meta.postParams);

                //临时传递的
                entity.setUrlParams(modelAttrs.urlParams);
                entity.setPostParams(modelAttrs.postParams);
                if(S.isFunction(meta.before)) {
                    safeExec(meta.before, [entity].concat(metaParams), meta);
                }
            }
            return {
                entity: entity,
                needUpdate: needUpdate
            }
        },
        /**
         * 获取models，该用缓存的用缓存，该发起请求的请求
         * @private
         * @param {Object|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2},params:[]}
         * @param {Function} done   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @param {Integer} flag   获取哪种类型的models
         * @return {MRequest}
         */
        fetchModels: function(models, done, error, progress, flag) {
            var me = this;
            if(me.$task) {
                me.next(function(request) {
                    request.fetchModels(models, done, error, progress, flag);
                });
                return me;
            }
            me.$task = true;
            var host = me.$host;
            if(!host.$modelsCache) host.$modelsCache = {};
            if(!host.$modelsCacheKeys) host.$modelsCacheKeys = {};
            if(!me.$reqModels) me.$reqModels = {};

            var modelsCache = host.$modelsCache;
            var modelsCacheKeys = host.$modelsCacheKeys;
            var reqModels = me.$reqModels;

            if(!Magix.isArray(models)) {
                models = [models];
            }
            var total = models.length;
            var current = 0;
            var errorMsg;

            var doneArr = [];
            var hasOneSuccess;

            var doneFn = function(idx, isFail, model, args) {
                    if(me.$destroy) return; //销毁，啥也不做
                    current++;
                    delete reqModels[model.id];
                    var cacheKey = model._cacheKey;
                    var oneArgs;
                    var onePreSuccess;

                    if(isFail) {
                        errorMsg = args || 'fetch data error @ mxext/mmanager line 199';
                        if(flag == FetchFlags.ONE) { //如果是其中一个成功，则每次成功回调一次
                            model.set('msg', errorMsg);
                            if(error) {
                                oneArgs = safeExec(error, model);
                            }
                            onePreSuccess = false;
                        }
                    } else {
                        hasOneSuccess = true;

                        doneArr[idx] = model;
                        if(cacheKey && !HAS(modelsCache, cacheKey)) {
                            modelsCache[cacheKey] = model;
                        }

                        var metaParams = model.metaParams;
                        model._doneAt = S.now();
                        if(model._after) { //有after
                            safeExec(model._after, [model].concat(metaParams), model._meta);
                        }

                        if(flag == FetchFlags.ONE) { //如果是其中一个成功，则每次成功回调一次
                            if(done) {
                                oneArgs = safeExec(done, model);
                            }
                            onePreSuccess = true;
                        }
                    }

                    if(cacheKey && HAS(modelsCacheKeys, cacheKey)) {
                        var fns = modelsCacheKeys[cacheKey];
                        delete modelsCacheKeys[cacheKey];
                        safeExec(fns, [isFail, model, args], model);
                    }

                    if(current >= total) {
                        if(flag != FetchFlags.ONE) {
                            var method = errorMsg ? error : done;
                            var args = errorMsg ? [errorMsg] : doneArr;
                            onePreSuccess = !errorMsg;
                            if(flag == FetchFlags.ANY) {
                                method = hasOneSuccess ? done : error;
                                args = hasOneSuccess ? doneArr : [errorMsg];
                                onePreSuccess = hasOneSuccess;
                            }
                            oneArgs = safeExec(method, args, me);
                        }
                        me.$ntId = setTimeout(function() { //前面的任务可能从缓存中来，执行很快
                            me.$task = false;
                            me.doNext(oneArgs, onePreSuccess);
                        }, 30);
                    }

                    if(progress) {
                        safeExec(progress, {
                            total: total,
                            current: current,
                            error: errorMsg
                        });
                    }
                };
            //
            for(var i = 0, model; i < models.length; i++) {
                model = models[i];

                var cacheKey = model.cacheKey;
                var modelEntity, modelInfo;

                if(cacheKey && HAS(modelsCacheKeys, cacheKey)) {
                    modelsCacheKeys[cacheKey].push(wrapDone(doneFn, me, i));
                } else {
                    modelInfo = me.create(model);
                    modelEntity = modelInfo.entity;

                    if(modelInfo.needUpdate) {

                        reqModels[modelEntity.id] = modelEntity;

                        if(cacheKey) {
                            modelsCacheKeys[cacheKey] = [];
                        }
                        modelEntity.request({
                            success: wrapDone(doneFn, modelEntity, i, false, modelEntity),
                            error: wrapDone(doneFn, modelEntity, i, true, modelEntity)
                        });
                    } else {
                        doneFn(i, false, modelEntity);
                    }
                }
            }
            return me;
        },
        /**
         * 获取models，所有成功才回调done，任意一个失败最终会回调error
         * @param {String|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} done   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        fetchAll: function(models, done, error, progress) {
            return this.fetchModels(models, done, error, progress, FetchFlags.ALL);
        },
        /**
         * 保存models，所有成功才回调done，任意一个失败最终会回调error
         * @param {String|Array} models 保存models时的描述信息，如:{name:'Home'urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} done   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        saveAll: function(models, done, error, progress) {
            models = deleteCacheKey(models);
            return this.fetchModels(models, done, error, progress, FetchFlags.ALL);
        },
        /**
         * 保存models，其中任意一个成功最终回调done，全部失败才回调error
         * @param {String|Array} models 保存models时的描述信息，如:{name:'Home',urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} done   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        saveAny: function(models, done, error, progress) {
            models = deleteCacheKey(models);
            return this.reqModels(models, done, error, progress, FetchFlags.ANY);
        },
        /**
         * 获取models，其中任意一个成功最终回调done，全部失败才回调error
         * @param {String|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} done   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        fetchAny: function(models, done, error, progress) {
            return this.reqModels(models, done, error, progress, FetchFlags.ANY);
        },
        /**
         * 保存models，其中任意一个成功均立即回调，回调会被调用多次
         * @param {String|Array} models 保存models时的描述信息，如:{name:'Home',urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} callback   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        saveOne: function(models, callback, error, progress) {
            models = deleteCacheKey(models);
            return this.reqModels(models, callback, error, progress, FetchFlags.ONE);
        },
        /**
         * 获取models，其中任意一个成功均立即回调，回调会被调用多次
         * @param {String|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} callback   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        fetchOne: function(models, callback, error, progress) {
            return this.fetchModels(models, callback, error, progress, FetchFlags.ONE);
        },
        /**
         * 中止所有model的请求
         * 注意：调用该方法后会中止请求，并回调error方法
         */
        abort: function() {
            var me = this;
            clearTimeout(me.$ntId);
            var host = me.$host;
            var reqModels = me.$reqModels;
            var modelsCacheKeys = host.$modelsCacheKeys;

            if(reqModels) {
                for(var p in reqModels) {
                    var m = reqModels[p];
                    var cacheKey = m._cacheKey;
                    if(cacheKey && HAS(modelsCacheKeys, cacheKey)) {
                        var fns = modelsCacheKeys[cacheKey];
                        delete modelsCacheKeys[cacheKey];
                        safeExec(fns, [true, m, 'aborted'], m);
                    }
                    m.abort();
                }
            }
            me.$reqModels = {};
            me.$queue = [];
            me.$task = false;
        },
        /**
         * 前一个fetchX或saveX任务做完后的下一个任务
         * @param  {Function} fn 回调
         * @param {MRequest} fn@request MRequest对象，用于发起下一个请求
         * @param {Object} fn@preReturned 前一个任务成功或失败回调的返回值
         * @param {Object} fn@preSuccess 前一个任务是否成功执行
         * @return {MRequest}
         */
        next: function(fn) {
            var me = this;
            if(!me.$queue) me.$queue = [];
            me.$queue.push(fn);
            if(!me.$task) {
                var args = me.$latest || [null, true];
                me.doNext.apply(me, args);
            }
            return me;
        },
        /**
         * 做下一个任务
         * @private
         */
        doNext: function(preArgs, preSuccess) {
            var me = this;
            var queue = me.$queue;
            if(queue) {
                var one = queue.shift();
                if(one) {
                    safeExec(one, [me, preArgs, preSuccess], me);
                }
            }
            me.$latest = [preArgs, preSuccess];
        },
        /**
         * 销毁当前请求，与abort的区别是：abort后还可以继续发起新请求，而destroy后则不可以，而且不再回调相应的error方法
         */
        destroy: function() {
            var me = this;
            me.$destroy = true;
            me.abort();
        }
    });

    Magix.mix(MManager.prototype, {
        /**
         * @lends MManager#
         */
        /**
         * 注册APP中用到的model
         * @param {Object|Array} models 模块描述信息
         * @param {String} models.name app中model的唯一标识
         * @param {Object} models.options 传递的参数信息，如{uri:'test',isJSONP:true,updateIdent:true}
         * @param {Object} models.urlParams 发起请求时，默认的get参数对象
         * @param {Object} models.postParams 发起请求时，默认的post参数对象
         * @param {String} models.cacheKey 指定model缓存的key，当指定后，该model会进行缓存，下次不再发起请求
         * @param {Integer} models.cacheTime 缓存过期时间，以毫秒为单位，当过期后，再次使用该model时会发起新的请求(前提是该model指定cacheKey被缓存后cacheTime才有效)
         * @param {Function} models.before model在发起请求前的回调
         * @param {Function} models.after model在发起请求，并且通过Model.sync调用doneess后的回调
         * @example
         * KISSY.add("app/base/mmanager",function(S,MManager,Model){
                var MM=MManager.create(Model);
                MM.registerModels([
                    {
                        name:'Home_List',
                        options:{
                            uri:'test'
                        },
                        urlParams:{
                            a:'12'
                        },
                        cacheKey:'',
                        cacheTime:20000,//缓存多久
                        before:function(m){

                        },
                        after:function(m){

                        }
                    },
                    {
                        name:'Home_List1',
                        options:{
                            uri:'test'
                        },
                        before:function(m){

                        },
                        after:function(m){

                        }
                    }
                ]);
                return MM;
            },{
                requires:["mxext/mmanager","app/base/model"]
            });

            //使用

            KISSY.use('app/base/mmanager',function(S,MM){
                MM.fetchAll([
                    {name:'Home_List',cacheKey:'aaa',urlParams:{e:'f'}},
                    {name:'Home_List1',urlParams:{a:'b'}}
                ],function(m1,m2){

                },function(msg){

                });
            });
         */
        registerModels: function(models) {
            /*
                name:'',
                options:{
                    uri:'',
                    jsonp:'true'
                },
                urlParams:'',
                postParams:'',
                cacheTime:20000,//缓存多久
                before:function(m){

                },
                after:function(m){

                }
             */
            var me = this;
            if(!Magix.isArray(models)) {
                models = [models];
            }
            for(var i = 0, model; i < models.length; i++) {
                model = models[i];
                if(!model.name) {
                    throw new Error('model must own a name attribute');
                }
                me[model.name] = model;
            }
        },
        /**
         * 注册方法，前面是参数，后面2个是成功和失败的回调
         * @param {Object} methods 方法对象
         */
        registerMethods: function(methods) {
            var me = this;
            for(var p in methods) {
                if(HAS(methods, p)) {
                    me[p] = (function(fn) {
                        return function() {
                            var aborted;
                            var args = arguments;
                            var arr = [];
                            for(var i = 0, a; i < args.length; i++) {
                                a = args[i];
                                if(Magix.isFunction(a)) {
                                    arr.push((function(f) {
                                        return function() {
                                            if(aborted) return;
                                            f.apply(f, arguments);
                                        }
                                    }(a)));
                                } else {
                                    arr.push(a);
                                }
                            }
                            var result = fn.apply(me, arr);
                            return {
                                abort: function() {
                                    if(result && result.abort) {
                                        safeExec(result.abort, ['aborted'], result);
                                    }
                                    aborted = true;
                                }
                            }
                        }
                    }(methods[p]));
                }
            }
        },
        /**
         * 调用当前Manager注册的多个方法
         * @param {Array} args 要调用的方法列表，形如：[{name:'x',params:['o']},{name:'y',params:['z']}]
         * @param {Function} done 成功时的回调，传入参数跟args数组中对应的成功方法的值
         * @param {Function} error 失败回调，参数同上
         * @return {Object} 返回一个带abort方法的对象，用于取消这些方法的调用
         * @example
         * var MM=MManager.create(Model);
         * MM.registerMethods({
         *     methodA:function(args,done,error){
         *
         *     },
         *     methodB:function(args,done,error){
         *
         *     }
         * });
         *
         * //...
         * //使用时：
         *
         * MM.callMethods([
         *     {name:'methodA',params:['a']},
         *     {name:'methodB',params:['b']}
         * ],function(f1Result,f2Result){
         *
         * },function(msg){
         *     alert(msg)
         * })
         */
        callMethods: function(args, done, error) {
            var me = this,
                doneArgs = [],
                errorMsg = '',
                total = args.length,
                exec = 0,
                aborted, doneCheck = function(args, idx, isFail) {
                    if(aborted) return;
                    exec++;
                    if(isFail) {
                        errorMsg = args;
                    } else {
                        doneArgs[idx] = args;
                    }
                    if(total <= exec) {
                        if(!errorMsg) {
                            if(S.isFunction(done)) {
                                done.apply(done, doneArgs);
                            }
                        } else {
                            if(S.isFunction(error)) {
                                error(errorMsg);
                            }
                        }
                    }
                },
                check = function(idx, isSucc) {
                    return function(args) {
                        doneCheck(args, idx, !isSucc);
                    };
                };
            for(var i = 0, one; i < args.length; i++) {
                one = args[i];
                var fn;
                if(S.isFunction(one.name)) {
                    fn = one.name;
                } else {
                    fn = me[one.name];
                }
                if(fn) {
                    if(!one.params) one.params = [];
                    if(!S.isArray(one.params)) one.params = [one.params];

                    one.params.push(check(i, true), check(i));
                    fn.apply(me, one.params);
                } else {
                    doneCheck('unfound:' + one.name, i, true);
                }
            }
            return {
                abort: function() {
                    aborted = true;
                }
            }
        },
        /**
         * 保存models，所有成功才回调done，任意一个失败最终会回调error
         * @param {String|Array} models 保存models时的描述信息，如:{name:'Home'urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} done   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        saveAll: function(models, done, error, progress) {
            return new MRequest(this).saveAll(models, done, error, progress);
        },
        /**
         * 获取models，所有成功才回调done，任意一个失败最终会回调error
         * @param {String|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} done   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        fetchAll: function(models, done, error, progress) {
            return new MRequest(this).fetchAll(models, done, error, progress);
        },
        /**
         * 保存models，其中任意一个成功最终回调done，全部失败才回调error
         * @param {String|Array} models 保存models时的描述信息，如:{name:'Home',urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} done   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        saveAny: function(models, done, error, progress) {
            return new MRequest(this).saveAny(models, done, error, progress);
        },
        /**
         * 获取models，其中任意一个成功最终回调done，全部失败才回调error
         * @param {String|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} done   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        fetchAny: function(models, done, error, progress) {
            return new MRequest(this).fetchAny(models, done, error, progress);
        },
        /**
         * 保存models，其中任意一个成功均立即回调，回调会被调用多次
         * @param {String|Array} models 保存models时的描述信息，如:{name:'Home',urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} callback   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        saveOne: function(models, callback, error, progress) {
            return new MRequest(this).saveOne(models, callback, error, progress);
        },
        /**
         * 获取models，其中任意一个成功均立即回调，回调会被调用多次
         * @param {String|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
         * @param {Function} callback   成功时的回调
         * @param {Function} error   失败时的回调
         * @param {Function} progress 加载进度
         * @return {MRequest}
         */
        fetchOne: function(models, callback, error, progress) {
            return new MRequest(this).fetchOne(models, callback, error, progress);
        },
        /**
         * 根据key清除缓存的models
         * @param  {String|RegExp} key 字符串或正则
         */
        clearCacheByKey: function(key) {
            var me = this;
            var modelsCache = me.$modelsCache;
            if(modelsCache) {
                if(S.isString(key)) {
                    if(HAS(modelsCache, key)) {
                        delete modelsCache[key];
                    }
                } else if(S.isRegExp(key)) {
                    for(var p in modelsCache) {
                        if(key.test(p)) {
                            delete modelClass[p];
                        }
                    }
                }
            }
        },
        /**
         * 根据name清除缓存的models
         * @param  {String|RegExp} name 字符串或正则
         */
        clearCacheByName: function(name) {
            var me = this;
            var modelsCache = me.$modelsCache;
            var test;
            if(S.isRegExp(name)) {
                test = function(x) {
                    return name.test(x)
                }
            } else {
                test = function(x) {
                    return x == name
                }
            }
            if(modelsCache) {
                for(var p in modelsCache) {
                    var m = modelsCache[p];
                    var meta = m._meta;
                    if(test(meta.name)) {
                        delete modelsCache[p];
                    }
                }
            }
        },
        /**
         * 获取model的url
         * @param  {String|Object} name model元信息名称
         * @return {String}
         */
        getModelUrl: function(name) {
            var me = this;
            var meta;
            if(S.isString(name)) {
                meta = me[name];
            } else {
                meta = name;
            }
            return me.$modelClass.prototype.url(meta.uri);
        }
    });
    return MManager;
}, {
    requires: ["magix/magix"]
});
/**
 * @fileOverview Model
 * @version 1.0
 * @author 行列
 */
KISSY.add("mxext/model", function(S, Magix) {
    /**
     * Model类
     * @name Model
     * @namespace
     * @class
     * @constructor
     * @param {Object} ops 初始化Model时传递的其它参数对象
     * @property {String} uri 与后台接口对应的前端url key
     * @example
     * 项目中对Model的引用及配置：
     * KISSY.add("app/base/model",function(S,Model,io){
            return Model.extend(
                urlMap:{
                    'modules':{
                        'get':'/modules.jsp?action=get',
                        'set':'/modules.jsp?action=set'
                    }
                },
                parse:function(resp){
                    return resp;//可对返回的结果在这地方进行简单的处理
                },
                sync:function(model,ops){
                    var url=model.url();
                    var isJSONP=model.get('isJSONP');
                    return io({
                        url:url,
                        success:function(resp){
                            ops.success(resp);
                        }
                    });
                }
            });
        },{
            requires:["mxext/model","ajax"]
        });

        在view中的具体使用：

        render:function(){
            var m=new Model({
                uri:'modules:get'
            });
            m.load({
                success:function(data){
                    //TODO
                },
                error:function(msg){
                    //TODO
                }
            })
        }
     */
    var processObject = function(props, proto, enterObject) {
            for(var p in proto) {
                if(S.isObject(proto[p])) {
                    if(!Magix.has(props, p)) props[p] = {};
                    processObject(props[p], proto[p], true);
                } else if(enterObject) {
                    props[p] = proto[p];
                }
            }
        };
    var Model = function(ops) {
            if(ops) {
                this.set(ops);
            }
            this.id = S.guid('m');
        };
    var ex = function(props, ctor) {
            var BaseModel = function() {
                    BaseModel.superclass.constructor.apply(this, arguments);
                    if(ctor) {
                        Magix.safeExec(ctor, [], this);
                    }
                }
            Magix.mix(BaseModel, this, {
                prototype: true
            });
            processObject(props, this.prototype);
            return S.extend(BaseModel, this, props);
        };
    Magix.mix(Model, {
        /**
         * @lends Model
         */
        /**
         * GET枚举
         * @type {String}
         */
        GET: 'GET',
        /**
         * POST枚举
         * @type {String}
         */
        POST: 'POST',
        /**
         * 继承
         * @function
         * @param {Object} props 方法对象
         * @param {Function} ctor 继承类的构造方法
         */
        extend: ex
    });


    Magix.mix(Model.prototype, {
        /**
         * @lends Model#
         */
        /**
         * url映射对象
         * @type {Object}
         */
        urlMap: {

        },
        /**
         * Model调用save或load方法后，与服务器同步的方法，供应用开发人员覆盖
         * @function
         * @param {Model} model model对象
         * @param {Object} ops 包含success error的参数信息对象
         * @return {XHR} 最好返回异步请求的对象
         */
        sync: Magix.noop,
        /**
         * 处理Model.sync成功后返回的数据
         * @function
         * @param {Object|String} resp 返回的数据
         * @return {Object}
         */
        parse: Magix.noop,
        /**
         * 获取参数对象
         * @param  {String} [type] 参数分组的key[Model.GET,Model.POST]，默认为Model.GET
         * @return {Object}
         */
        getParamsObject: function(type) {
            if(!type) type = Model.GET;
            return this['$' + type] || null;
        },
        /**
         * 获取参数对象
         * @return {Object}
         */
        getUrlParamsObject: function() {
            return this.getParamsObject(Model.GET);
        },
        /**
         * 获取Post参数对象
         * @return {Object}
         */
        getPostParamsObject: function() {
            return this.getParamsObject(Model.POST);
        },
        /**
         * 获取通过setPostParams放入的参数
         * @return {String}
         */
        getPostParams: function() {
            return this.getParams(Model.POST);
        },
        /**
         * 获取通过setUrlParams放入的参数
         * @return {String}
         */
        getUrlParams: function() {
            return this.getParams(Model.GET);
        },
        /**
         * 获取参数
         * @param {String} [type] 参数分组的key[Model.GET,Model.POST]，默认为Model.GET
         * @return {String}
         */
        getParams: function(type) {
            var me = this;
            if(!type) {
                type = Model.GET;
            } else {
                type = type.toUpperCase();
            }
            var k = '$' + type;
            var params = me[k];
            var arr = [];
            var v;
            if(params) {
                for(var p in params) {
                    v = params[p];
                    if(S.isArray(v)) {
                        for(var i = 0; i < v.length; i++) {
                            arr.push(p + '=' + encodeURIComponent(v[i]));
                        }
                    } else {
                        arr.push(p + '=' + encodeURIComponent(v));
                    }
                }
            }
            return arr.join('&');
        },
        /**
         * 设置url参数，只有未设置过的参数才进行设置
         * @param {Object|String} obj1 参数对象或者参数key
         * @param {String} [obj2] 参数内容
         */
        setUrlParamsIf: function(obj1, obj2) {
            this.setParams(obj1, obj2, Model.GET, true);
        },
        /**
         * 设置post参数，只有未设置过的参数才进行设置
         * @param {Object|String} obj1 参数对象或者参数key
         * @param {String} [obj2] 参数内容
         */
        setPostParamsIf: function(obj1, obj2) {
            var me = this;
            me.setParams(obj1, obj2, Model.POST, true);
        },
        /**
         * 设置参数
         * @param {Object|String} obj1 参数对象或者参数key
         * @param {String} [obj2] 参数内容
         * @param {String}   type      参数分组的key
         * @param {Boolean}   ignoreIfExist   如果存在同名的参数则不覆盖，忽略掉这次传递的参数
         * @param {Function} callback 对每一项参数设置时的回调
         */
        setParams: function(obj1, obj2, type, ignoreIfExist) {
            if(!type) {
                type = Model.GET;
            } else {
                type = type.toUpperCase();
            }
            var me = this;
            if(!me.$keysCache) me.$keysCache = {};
            me.$keysCache[type] = true;

            var k = '$' + type;
            if(!me[k]) me[k] = {};
            if(S.isObject(obj1)) {
                for(var p in obj1) {
                    if(!ignoreIfExist || !me[k][p]) {
                        me[k][p] = obj1[p];
                    }
                }
            } else if(obj1 && obj2) {
                if(!ignoreIfExist || !me[k][obj1]) {
                    me[k][obj1] = obj2;
                }
            }
        },
        /**
         * 设置post参数
         * @param {Object|String} obj1 参数对象或者参数key
         * @param {String} [obj2] 参数内容
         */
        setPostParams: function(obj1, obj2) {
            var me = this;
            me.setParams(obj1, obj2, Model.POST);
        },
        /**
         * 设置url参数
         * @param {Object|String} obj1 参数对象或者参数key
         * @param {String} [obj2] 参数内容
         */
        setUrlParams: function(obj1, obj2) {
            this.setParams(obj1, obj2, Model.GET);
        },
        /**
         * @private
         */
        removeParamsObject: function(type) {
            if(!type) type = Model.GET;
            delete this['$' + type];
        },
        /**
         * @private
         */
        removePostParamsObject: function() {
            this.removeParamsObject(Model.POST);
        },
        /**
         * @private
         */
        removeUrlParamsObject: function() {
            this.removeParamsObject(Model.GET);
        },
        /**
         * 重置缓存的参数对象，对于同一个model反复使用前，最好能reset一下，防止把上次请求的参数也带上
         */
        reset: function() {
            var me = this;
            var keysCache = me.$keysCache;
            if(keysCache) {
                for(var p in keysCache) {
                    if(Magix.has(keysCache, p)) {
                        delete me['$' + p];
                    }
                }
                delete me.$keysCache;
            }
            var keys = me.$keys;
            var attrs = me.$attrs;
            if(keys) {
                for(var i = 0; i < keys.length; i++) {
                    delete attrs[keys[i]];
                }
                delete me.$keys;
            }
        },
        /**
         * 获取model对象请求时的后台地址
         * @return {String}
         */
        url: function(url) {
            var self = this,
                uri = url || self.get('uri'),
                uris;
            if(uri) {
                uris = uri.split(':');
                var maps = self.urlMap;
                if(maps) {
                    for(var i = 0, parent = maps, j = uris.length; i < j; i++) {
                        parent = parent[uris[i]];
                        if(parent === undefined) {
                            break;
                        } else if(i == j - 1) {
                            uri = parent;
                        }
                    }
                }
            } else {

                throw new Error('model not set uri');
            }
            return uri;
        },
        /**
         * 获取属性
         * @param {String} type type
         * @return {Object}
         */
        get: function(type) {
            var me = this;
            var attrs = me.$attrs;
            if(attrs) {
                return attrs[type];
            }
            return null;
        },
        /**
         * 设置属性
         * @param {String|Object} key 属性对象或属性key
         * @param {Object} [val] 属性值
         */
        set: function(key, val, saveKeyList) {
            var me = this;
            if(!me.$attrs) me.$attrs = {};
            if(saveKeyList && !me.$keys) {
                me.$keys = [];
            }
            if(S.isObject(key)) {
                for(var p in key) {
                    if(saveKeyList) {
                        me.$keys.push(p);
                    }
                    me.$attrs[p] = key[p];
                }
            } else if(key) {
                if(saveKeyList) {
                    me.$keys.push(key);
                }
                me.$attrs[key] = val;
            }
        },
        /**
         * 加载model数据
         * @param {Object} ops 请求选项
         */
        load: function(ops) {
            this.request(ops);
        },
        /**
         * 保存model数据
         * @param {Object} ops 请求选项
         */
        save: function(ops) {
            this.request(ops);
        },
        /**
         * 向服务器请求，加载或保存数据
         * @param {Object} ops 请求选项
         * @param {Function} ops.success 成功后的回调
         * @param {Function} ops.error 失败后的回调
         */
        request: function(ops) {
            if(!ops) ops = {};
            var success = ops.success;
            var error = ops.error;
            var me = this;
            me.$abort = false;
            ops.success = function(resp) {
                if(!me.$abort) {
                    if(resp) {
                        var val = me.parse(resp);
                        if(val) {
                            if(S.isArray(val)) {
                                val = {
                                    list: val
                                };
                            }
                            me.set(val, null, true);
                        }
                    }
                    if(success) {
                        success.apply(this, arguments);
                    }
                }
            };
            ops.error = function() {
                if(!me.$abort) {
                    if(error) error.apply(this, arguments);
                }
            };
            me.$trans = me.sync(ops);
        },
        /**
         * 中止请求
         */
        abort: function() {
            var me = this;
            if(me.$trans && me.$trans.abort) {
                me.$trans.abort();
            }
            delete me.$trans;
            me.$abort = true;
        },
        /**
         * 开始事务
         * @example
         * //...
         * var userList=m.get('userList');//从model中取出userList数据
         * m.beginTransaction();//开始更改的事务
         * userList.push({userId:'58782',userName:'xinglie.lkf'});//添加一个新用户
         * m.save({
         *     //...
         *     success:function(){
         *           m.endTransaction();//成功后通知model结束事务
         *     },
         *     error:function(){
         *         m.rollbackTransaction();//出错，回滚到原始数据状态
         *     }
         * });
         * //应用场景：
         * //前端获取用户列表，添加，删除或修改用户后
         * //把新的数据提交到数据库，因model是数据的载体
         * //可能会直接在model原有的数据上修改，提交修改后的数据
         * //如果前端提交到服务器，发生失败时，需要把
         * //model中的数据还原到修改前的状态(当然也可以再次提交)
         * //
         * //注意：
         * //可能添加，删除不太容易应用这个方法，修改没问题
         * //
         */
        beginTransaction: function() {
            var me = this;
            me.$bakAttrs = S.clone(me.$attrs);
        },
        /**
         * 回滚对model数据做的更改
         */
        rollbackTransaction: function() {
            var me = this;
            var bakAttrs = me.$bakAttrs;
            if(bakAttrs) {
                me.$attrs = bakAttrs;
                delete me.$bakAttrs;
            }
        },
        /**
         * 结束事务
         */
        endTransaction: function() {
            delete this.$bakAttrs;
        }
    });
    return Model;
}, {
    requires: ["magix/magix"]
});
/**
 * @fileOverview 对magix/view的扩展
 * @version 1.0
 * @author 行列
 */
KISSY.add('mxext/view', function(S, View, Router, VM) {
    var WIN = window;
    var COMMA = ',';
    var DestroyManagedTryList = 'destroy,abort,stop,cancel,remove'.split(COMMA);
    var ResCounter = 0;
    var safeExec = Magix.safeExec;
    var HAS = Magix.has;
    var Pagelet;
    var VOMEventsObject = {};
    var PrepareVOMMessage = function(vom) {
            if(!PrepareVOMMessage.d) {
                PrepareVOMMessage.d = 1;
                vom.on('add', function(e) {
                    var vf = e.vframe;
                    var list = VOMEventsObject[vf.id];
                    if(list) {
                        for(var i = 0; i < list.length; i++) {
                            PostMessage(vf, list[i]);
                        }
                        delete VOMEventsObject[vf.id];
                    }
                });
                vom.on('remove', function(e) {
                    delete VOMEventsObject[e.vframe.id];
                });
                var vf = vom.buildRoot();
                vf.on('childrenCreated', function() {
                    VOMEventsObject = {};
                });
            }
        };
    var PostMessage = function(vframe, args) {
            var view = vframe.view;
            if(view && vframe.vced) {
                safeExec(view.receiveMessage, args, view);
            } else {
                vframe.on('viewLoad', function(e) {
                    safeExec(e.view.receiveMessage, args, e.view);
                });
            }
        };
    /*
        推荐使用的事件，KISSY这块的
        queryEvents:{
            mouseover:{
                '#id':function(){

                },
                '.title':function(){//  S.one('.title').click(); S.one().delegate();

                }
            },
            mouseenter:{
                '#id':function(e){

                }
            }
        }
     */
    /**
     * @name MxView
     * @namespace
     * @property {ViewModel} vm ViewModel对象
     * @requires View
     * @augments View
     */
    return View.extend({
        /**
         * @lends MxView#
         */
        /**
         * 根据选择器来注册事件
         * @type {Object}
         * @example
         * queryEvents:{
         *      click:{
         *          '#name':function(e){
         *
         *          },
         *          '#name .label':function(e){
         *
         *          }
         *      }
         * }
         */
        queryEvents: null,
        /**
         * 调用magix/router的navigate方法
         * @param {Object|String} params 参数字符串或参数对象
         */
        navigate: function(params) {
            Router.navigate(params);
        },
        /**
         * 根据选择器添加事件
         */
        attachQueryEvents: function() {
            var me = this;
            var queryEvents = me.queryEvents;
            if(queryEvents) {
                me.$queryEventsCache = {};
                for(var p in queryEvents) {
                    var evts = queryEvents[p];
                    for(var q in evts) {

                        S.all('#' + me.id + ' ' + q).on(p, me.$queryEventsCache[p + '_' + q] = (function(fn) {
                            return function(e) {
                                if(me.enableEvent) {
                                    var targetId = View.idIt(e.target);
                                    var currentId = View.idIt(e.currentTarget);
                                    Magix.safeExec(fn, {
                                        view: me,
                                        targetId: targetId,
                                        currentId: currentId,
                                        queryEvents: queryEvents,
                                        domEvent: e
                                    }, queryEvents);
                                }
                            }
                        }(evts[q])));
                    }
                }
            }

        },
        /**
         * 清除根据选择器添加的事件
         */
        detachQueryEvents: function() {
            var me = this;
            var queryEvents = me.queryEvents;
            if(queryEvents) {
                for(var p in queryEvents) {
                    var evts = queryEvents[p];
                    for(var q in evts) {
                        S.all('#' + me.id + ' ' + q).detach(p, me.$queryEventsCache[p + '_' + q]);
                    }
                }
                delete me.$queryEventsCache;
            }
        },
        setData: function(data) {
            this.data = this.wrapMustachData(data);
        },
        wrapMustachData: function(data) {
            var self = this,
                rr = this.renderer,
                mcName, wrapperName;
            if(rr) {
                for(mcName in rr) {
                    for(wrapperName in rr[mcName]) {
                        (function() {
                            var mn = mcName,
                                wn = wrapperName;
                            var fn = rr[mn][wn];
                            data[mn + "_" + wn] = function() {
                                return fn.call(this, self, mn);
                            };
                        })();
                    }
                }
            }
            return data;
        },
        /**
         * 让view帮你管理资源，对于异步回调函数更应该调用该方法进行托管
         * 当调用该方法后，您不需要在异步回调方法内判断当前view是否已经销毁
         * 同时对于view刷新后，上个异步请求返回刷新界面的问题也得到很好的解决。<b>强烈建议对异步回调函数，组件等进行托管</b>
         * @param {String|Object} key 托管的资源或要共享的资源标识key
         * @param {Object} [res] 要托管的资源
         * @return {Object} 返回传入的资源，对于函数会自动进行一次包装
         * @example
         * init:function(){
         *      this.manage('user_list',[//管理对象资源
         *          {id:1,name:'a'},
         *          {id:2,name:'b'}
         *      ]);
         * },
         * render:function(){
         *      var _self=this;
         *      var m=new Model();
         *      m.load({
         *          success:_self.manage(function(resp){//管理匿名函数
         *              //TODO
         *              var brix=new BrixDropdownList();
         *
         *              _self.manage(brix);//管理组件
         *
         *              var pagination=_self.manage(new BrixPagination());//也可以这样
         *
         *              var timer=_self.manage(setTimeout(function(){
         *                  S.log('timer');
         *              },2000));//也可以管理定时器
         *
         *
         *              var userList=_self.getManaged('user_list');//通过key取托管的资源
         *
         *              S.log(userList);
         *          }),
         *          error:_self.manage(function(msg){
         *              //TODO
         *          })
         *      })
         * }
         */
        manage: function(key, res) {
            var me = this;
            var args = arguments;
            var hasKey = true;
            if(args.length == 1) {
                res = key;
                key = 'res_' + (ResCounter++);
                hasKey = false;
            }
            if(!me.$resCache) me.$resCache = {};
            var wrapObj = {
                hasKey: hasKey,
                res: res
            };
            me.$resCache[key] = wrapObj;
            return res;
        },
        /**
         * 获取托管的资源
         * @param {String} key 托管资源时传入的标识key
         * @return {[type]} [description]
         */
        getManaged: function(key) {
            var me = this;
            var cache = me.$resCache;
            var sign = me.sign;
            if(cache && HAS(cache, key)) {
                var wrapObj = cache[key];
                var resource = wrapObj.res;
                return resource;
            }
            return null;
        },
        /**
         * 移除托管的资源
         * @param {String|Object} param 托管时标识key或托管的对象
         * @return {Object} 返回移除的资源
         */
        removeManaged: function(param) {
            var me = this,
                res = null;
            var cache = me.$resCache;
            if(cache) {
                if(HAS(cache, param)) {
                    res = cache[param].res;
                    delete cache[param];
                } else {
                    for(var p in cache) {
                        if(cache[p].res === param) {
                            res = cache[p].res;
                            delete cache[p];
                            break;
                        }
                    }
                }
            }
            return res;
        },
        /**
         * 销毁托管的资源
         * @param {Boolean} [byRefresh] 是否是刷新时的销毁
         * @private
         */
        destroyManaged: function(byRefresh) {
            var me = this;
            var cache = me.$resCache;
            //
            if(cache) {
                for(var p in cache) {
                    var o = cache[p];
                    //var processed=false;
                    var res = o.res;
                    if(Magix.isNumber(res)) { //数字，有可能是定时器
                        WIN.clearTimeout(res);
                        WIN.clearInterval(res);
                        //processed=true;
                    } else if(res) {
                        if(res.nodeType && res.parentNode) {
                            S.one(res).remove();
                            //processed=true;
                        } else {
                            for(var i = 0; i < DestroyManagedTryList.length; i++) {
                                if(Magix.isFunction(res[DestroyManagedTryList[i]])) {
                                    safeExec(res[DestroyManagedTryList[i]], [], res);
                                    //processed=true;
                                    //不进行break,比如有时候可能存在abort 和  destroy
                                }
                            }
                        }
                    }
                    /*me.fire('destroyResource',{
                        resource:res,
                        processed:processed
                    });*/
                    if(byRefresh && !o.hasKey) { //如果是刷新且托管时没有给key值，则表示这是一个不会在其它方法内共享托管的资源，view刷新时可以删除掉
                        delete cache[p];
                    }
                }
                if(!byRefresh) { //如果不是刷新，则是view的销毁
                    //me.un('destroyResource');
                    delete me.$resCache;
                }
            }
        },
        /**
         * 销毁MRequest
         */
        destroyAsyncall: function() {
            var me = this;
            var cache = me.$resCache;
            if(cache) {
                for(var p in cache) {
                    var o = cache[p];
                    var res = o.res;

                    if(res.fetchOne && res.fetchAll) {
                        res.destroy();
                        delete cache[p];
                    } else if(Magix.isNumber(res)) {
                        WIN.clearTimeout(res);
                        WIN.clearInterval(res);
                        delete cache[p];
                    }
                }
            }
        },
        /**
         * 用于接受其它view通过postMessageTo方法发来的消息，供最终的view开发人员进行覆盖
         * @function
         * @param {Object} e 通过postMessageTo传递的第二个参数
         */
        receiveMessage: Magix.noop,
        /**
         * 向某个vframe发送消息
         * @param {Array|String} aims  目标vframe id数组
         * @param {Object} args 消息对象
         */
        postMessageTo: function(aims, args) {
            var vom = this.ownerVOM;
            PrepareVOMMessage(vom);

            if(!Magix.isArray(aims)) {
                aims = [aims];
            }
            if(!args) args = {};
            for(var i = 0, it; i < aims.length; i++) {
                it = aims[i];
                var vframe = vom.get(it);
                if(vframe) {
                    PostMessage(vframe, args);
                } else {
                    if(!VOMEventsObject[it]) {
                        VOMEventsObject[it] = [];
                    }
                    VOMEventsObject[it].push(args);
                }
            }
        },
        /**
         * 设置view的pagelet，与brix深度整合
         * @param {Object} data  数据对象
         * @param {Function} ready pagelet就绪后的回调
         * @example
         * //template
         *
         * <div bx-tmpl="x" bx-datakey="x">
         *     {{x}}
         * </div>
         *
         * <div bx-tmpl="xy" bx-datakey="x,y">
         *     {{y}}--{{x}}
         * </div>
         *
         * <div bx-name="xx" bx-config="{}">
         *
         * </div>
         * // view code
         *
         *
         * render:function(){
         *     //...
         *     this.setViewPagelet({
         *         param1:'x',
         *         param2:'y'
         *     },function(pagelet){
         *         var brix=pagelet.getBrick('xx');
         *         //brix....
         *     })
         * }
         */
        setViewPagelet: function(data, ready) {
            var me = this;
            var sign = me.sign;
            var getPagelet = function(fn) {
                    if(Pagelet) {
                        fn(Pagelet);
                    } else {
                        S.use('brix/core/pagelet', function(S, P) {
                            fn(Pagelet = P);
                        });
                    }
                };
            var pagelet = me.getManaged('pagelet');
            if(pagelet) {
                pagelet.ready(function() {
                    pagelet.setChunkData(data); //
                });
            } else {
                getPagelet(function(Pglt) {
                    if(sign == me.sign) {
                        S.one('#' + me.id).html('');
                        me.beginUpdateHTML();
                        pagelet = new Pglt({
                            container: '#' + me.id,
                            tmpl: me.wrapMxEvent(me.template),
                            data: me.wrapMustachData(data),
                            destroyAction: 'empty'
                        });
                        me.endUpdateHTML();
                        me.manage('pagelet', pagelet);
                        if(ready) {
                            pagelet.on('beforeRefreshTmpl', function(e) {
                                me.unmountZoneViews(e.node[0]);
                            });
                            pagelet.ready(function() {
                                if(sign == me.sign) {
                                    ready.call(me, pagelet);
                                }
                            });
                        }
                    }
                });
            }
        }
    }, function() {
        var me = this;
        me.vm = new VM();


        me.on('interact', function() {
            me.on('asyncall', function() {
                me.destroyAsyncall();
            });
            me.on('prerender', function() {
                me.destroyManaged(true);
                me.detachQueryEvents();
            });
            me.on('rendered', function() {
                me.attachQueryEvents();
            });
            me.on('destroy', function() {
                me.destroyManaged();
            });
        });
    });
    /**
     * view销毁托管资源时发生
     * @name MxView#destroyResource
     * @event
     * @param {Object} e
     * @param {Object} e.resource 托管的资源
     * @param {Boolean} e.processed 表示view是否对这个资源做过销毁处理，目前view仅对带 abort destroy dispose方法的资源进行自动处理，其它资源需要您响应该事件自已处理
     */
}, {
    requires: ["magix/view", "magix/router", "mxext/viewmodel"]
});
/**
 * @fileOverview viewmodel类
 * @version 1.0
 * @author 李牧
 */
KISSY.add("mxext/viewmodel", function(S) {
    /**
     * @name ViewModel
     * @namespace
     * @see 继承自KISSY.Base:<a href="http://docs.kissyui.com/docs/html/api/core/base/" target="_blank">http://docs.kissyui.com/docs/html/api/core/base/</a>
     */
    var ViewModel = function(config) {
            ViewModel.superclass.constructor.call(this, config);
            this.addAttrs(config);
        };
    S.extend(ViewModel, S.Base, {
        /**
         * @lends ViewModel#
         */
        /**
         * 注册datakey
         * @param  {Array} dataKey datakey数组
         */
        registerDataKey: function(dataKey) {
            var o = {};
            for(var i = 0; i < dataKey.length; i++) {
                o[dataKey[i]] = {};
            }
            this.addAttrs(o);
        },
        /**
         * 注册模板帮助方法
         * @param {Object} obj 包含方法的对象
         **/
        registerHelpers: function(obj) {
            var baseSet = this.constructor.superclass.set;
            for(var p in obj) {
                baseSet.call(this, p, obj[p], {
                    slient: true
                });
            }
        },
        /**
         * 你懂的
         * @return {Object}
         */
        toJSON: function() {
            return this.getAttrVals();
        },
        /**
         * 设置key对应的值
         * @param {String|Object} name  字符串或对象
         * @param {Object} value 值
         * @param {Object} opts
         */
        set: function(name, value, opts) {
            var obj = name;
            if(!S.isPlainObject(obj)) {
                obj = {};
                obj[name] = value;
            }
            //
            for(var key in obj) {
                if(!this.hasAttr(key)) {
                    throw Error("The DataKey: '" + key + "' has not been registed in current ViewModel!");
                }
            }
            return this.constructor.superclass.set.call(this, name, value, opts);
        }
    });
    return ViewModel;
}, {
    requires: ["base"]
});
/**
 * @fileOverview Magix启动入口
 * @author 行列<xinglie.lkf@taobao.com>
 * @version 1.0
 **/
(function(W) {
    var noop = function() {};
    if(!W.console) {
        W.console = {
            log: noop,
            warn: noop,
            error: noop,
            debug: noop
        }
    };
    var tempCfg;
    if(!W.Magix) {
        W.Magix = {
            start: function(cfg) {
                tempCfg = cfg;
            }
        }
        KISSY.use('magix/magix', function(S, M) {
            W.Magix = M;
            if(tempCfg) {
                M.start(tempCfg);
            }
        });
    }
})(this);