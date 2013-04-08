KISSY.add("app/common/views/menus",function(S,View){
	return View.extend({
		init:function(){
			this.observeLocation({
				pathname:true
			});
		},
		render:function(){
			var loc=this.location;
			var pn=loc.pathname;
			var pns=pn.split('/');
			var root=pns[1];
			var sub=pns[2];

			this.setViewHTML(this.template.replace(/\{\{id\}\}/g,this.id));
			var link=S.one('#J_'+this.id+'_'+root);
			if(link){
				var ul=link.next('ul');
				if(ul){
					ul.removeClass('none');
					ul.all('a').each(function(i){
						var href=i.attr('href').replace(/(?:^.*#!|\/index$)/ig,'');
						if(S.startsWith(pn,href)){
							i.addClass('current');
						}
					});

					var arrow = link.children('.iconfont');
				    if(ul.hasClass('none')){
				   		arrow.html('&#402');
				    }else{
				   		arrow.html('&#405');
				    }
				}
			}
		},
		locationChange:function(e){
			//e.prevent();
			this.render();
		},
		events:{
			click:{
				toggleSubMenus:function(e){
				    var target = S.one('#' + e.targetId),
				        targetDOM = target.getDOMNode();

				    if(targetDOM.tagName.toUpperCase() === 'A') {
					    var ul = target.next('.subnav');
					    ul && ul.toggleClass('none');
					    target.toggleClass('hover');
					    if(ul){
							var arrow = target.children('.iconfont');
						    if(ul.hasClass('none')){
						   		arrow.html('&#402');
						    }else{
						   		arrow.html('&#405');
						    }
						}
				    }

				}
			}
		}
	});
},{
	requires:['magix/view']
})