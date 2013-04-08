KISSY.add("app/views/footer",function(S,View){
	return View.extend({
		render:function(){
			this.setViewHTML(this.template);
		}
	})
},{
	requires:["mxext/view","brix/gallery/footer/index.css"]
});