KISSY.add("app/models/model",function(S,BaseModel){
    return BaseModel.extend({
        urlMap:{
            home:{
                index:'api/home.json',
                change: 'api/change.json'
            },
            message:{
                number:'api/getUnreadNum.json'
            }
        }
    });
},{
    requires:["app/models/basemodel"]
});