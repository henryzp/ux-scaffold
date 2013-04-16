KISSY.add("components/kwicks/index", function(S, Brick) {
    var TMPL = '@TEMPLATE|'+Brix.absoluteFilePath(this,'template.html')+'|TEMPLATE@';
    function Kwicks() {
        Kwicks.superclass.constructor.apply(this, arguments);
    }
    Kwicks.ATTRS = {
        tmpl:{
            value:TMPL
        }
    };
    S.extend(Kwicks, Brick, {
        initialize: function() {
            S.log('Kwicks initialize');
        },
        destructor:function(){
            S.log('Kwicks destroy');
        }
    });
    return Kwicks;
}, {
    requires: ["brix/gallery/kwicks/index"]
});