KISSY.add("app/models/modelmanager",function(S,BaseManager,Model){
    var Manager=BaseManager.create(Model);
    Manager.registerModels([
        //查询当前是否有需要确认的协议
        {
            name:'Protocol_Query',
            uri:'protocol:query',
            cacheKey:'app/common/models/mm/protocol/query',
            after:function(m){
                var key=m.get('data');
                if(key){
                    Manager.clearCacheByKey(this.cacheKey);
                }
            }
        },
        //接受某个协议
        {
            name:'Protocol_Accept',
            uri:'protocol:accept'
        },
        {
            name:'Message_Number',
            uri:'message:number',
            cacheKey:'app/common/models/mm/message/number',
            cacheTime:60*1000
        },
        {
            name:'Home_Index',
            uri:'home:index'
        },
        {
            name:'Home_Change',
            uri:'home:change'
        },
        {
            name: 'Plan_Create',
            uri: 'plan:create'
        },
        {
            name: 'Plan_Get',
            uri: 'plan:get'
        }

    ]);
    return Manager;
},{
    requires:["mxext/mmanager","app/models/model"]
});