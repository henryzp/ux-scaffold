KISSY.add("components/kwicks/ext1/index", function(S, Brick) {
    function Kwicks() {
        Kwicks.superclass.constructor.apply(this, arguments);
    }

    S.extend(Kwicks, Brick, {});
    return Kwicks;
}, {
    requires: ["../index"]
});