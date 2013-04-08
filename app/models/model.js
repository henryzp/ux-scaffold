KISSY.add("app/models/model",function(S,BaseModel){
    return BaseModel.extend({
        urlMap:{
            protocol:{
                query:'protocol/getProtocol.json',
                accept:'protocol/acceptProtocol.json'
            },
            message:{
                number:'api/getUnreadNum.json'
            }
        }
    })
},{
    requires:["app/models/basemodel"]
})