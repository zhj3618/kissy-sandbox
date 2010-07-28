/**
 * swf 嵌入到页面中的 js
 * @author kingfo  oicuicu@gmail.com
 */
KISSY.add('flash-embed', function(S) {
	
	var UA = S.UA,
		DOM = S.DOM,
		Flash = S.Flash,
		SWF_SUCCESS = 1,
		FP_LOW =0,
		FP_UNINSTALL = -1,
		TARGET_NOT_FOUND = -2,			//// 	指定ID的对象未找到
		SWF_SRC_UNDEFINED =-3,			////	SWF的地址未指定
		SWF_ID_UNDEFINED =-4,			////	SWF的ID未定义
		VERSION = 9,
		CID = "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000",
		TYPE = 'application/x-shockwave-flash',
		OBJECT_NODE_NAME ="object"
		EMBED_NODE_NAME="embed",
		DEFAULT_SWF_WIDTH = 400,
		DEFAULT_SWF_HEIGHT = 300;
	
	var	prefix = "ks-flash-",
		////	flash player 参数范围
		////	请确保全小写
		fp_params = {
			//////////////////////////	高频率使用的参数
			"flashvars":null,
			"wmode":"",
			"allowscriptaccess":"",
			"allownetworking":"",
			"allowfullscreen":"",
			/////////////////////////	显示 控制 删除 
			"play":"false",
			"loop":"",
			"menu":"",
			"quality":"",
			"scale":"",
			"salign":"",
			"bgcolor":"",
			"devicefont":"",
			/////////////////////////	其他控制参数
			"base":"",
			"swliveconnect":"",
			"seamlesstabbing":""
		},
		////	SWF HTML属性可选范围
		////	请确保全小写
		html_attributes = {
			"id":'',
			"width":'',
			"height":'',
			"name":'',
			'class':'',
			"align":''
		},
		defaultConifg ={
//			src:null,					////	动态安装属性。swf路径
//			flashvars:null,				////	动态安装属性。swf传入的第三方数据。支持复杂的 Object/XML数据/JSON字符串
//			params:null,				////	动态安装属性。Flash Player的配置参数
//			attribs:null,				////	动态安装属性。SWF 嵌入的HTML标签属性
//			xi:null,					////	动态安装属性。快速安装。全称 express install
			version:9					////	要求Flash Player 的版本  
		};
	
	
	S.mix(Flash,{
		/////////////////////////////////////////////////////// public
		/**
		 * 与 KISSY.UA.FPV相同
		 */
		getFPV:function (){return UA.fpv;},
		getLength:function (){return Flash.names.length;},
		/**
		 * 添加SWF对象
		 * @param {String} id				指定swf的id。如果对象是swf替换入口，则会自动尝试替换
		 * @param {Object} config
		 */
		add:function(id,config,callback){
			var self=this,
				el,
				nodeName,
				ver,
				key,
				k,
				value,
				xi,
				version;  // 如果未在config定义 version 则默认以flash player 9作为参考。
			
			///// 外部定义的config 关键字不区分大小写实现
			////  内部则全小写
			////	外宽 内忌? LOL
			config = config ||{};
			for (key in config){
				value = config[key];
				config[key] = null
				delete config[key];
				key=key.toLowerCase();
				config[key] = value;				
			}
			config = S.merge(defaultConifg,config);
			//// 获取关键配置属性
			ver  = config.version;		//请求版本号
			xi = config.xi;				//快速安装
			
			version = 	hasFlashPlayerVersion(ver);
			
			
			
			////	只有当前客户端版本高于或等于指定版本才能使用flash
			switch(version){
				case -1:
					self._fallback(callback,FP_UNINSTALL,id);
					return;
				break;
				case 0:
					////将SRC 替换为  快速安装
					self._fallback(callback,FP_LOW,id);
					if(!xi&&!S.isString(xi))return;
					config.src = xi;
				break;
			}	
			if(!id||!S.isString(id)){
				self._fallback(callback,SWF_ID_UNDEFINED,id);
				return; 
			}
			
			// 依赖 DOM
			S.ready(function(S){
				el = DOM.get("#"+id);
				if(!el){
					self._fallback(callback,TARGET_NOT_FOUND,id);
					return ;
				}
				
				config.id = id;
				
				nodeName = (el.nodeName+"").toLowerCase();
				
				if(nodeName === OBJECT_NODE_NAME || nodeName === EMBED_NODE_NAME){
					//	对已有HTML结构的 SWF进行注册使用。
					self._register(el,config,callback);
					
				}else{
					//	嵌入并替换获取到的HTML为SWF嵌入对象。
					if(!config.src || !S.isString(config.src)){
						if(!!xi)self._fallback(callback,SWF_SRC_UNDEFINED,id);  //// 忽略快速安装未指定
					}
					self._embed(el,config,callback);
				}
			});
			
		},
		/**
		 * 检测是否存在已注册的swf 。
		 * 请在 KISSY.ready() 中使用。
		 *  注意，只有执行过 KISSY.Flash.embed() 或 KISSY.Flash.register()的 SWF才可以被获取到。
		 * @param {String,Number,Object} target
		 * @return {Number}	存在返回存档的序号.不存在则返回 -1
		 */
		contain:function(target){
			var self = this,
				id,
				i,
				len = Flash.names.length;
			if(S.isString(target)){
				return S.indexOf(target,Flash.names);
			}else if(S.isNumber(target)){
				id = Flash.names[target];
				self.contain(id);
			}else{
				for(i=0;i<len;i++){
					id = Flash.names[i];
					if(Flash.swfs[id] == target)return i;
				}
			}
			return -1;
		},
		/**
		 * 获得已注册到 KISSY.Flash 的 SWF。
		 * 请在 KISSY.ready() 中使用。
		 * 注意，请不要混淆 DOM.get() 和 Flash.get().
		 * 只有执行过 KISSY.Flash.embed() 或 KISSY.Flash.register()的 SWF才可以被获取。
		 * 此方法只是封装了获取SWF的方式。
		 * 您可以通过id，以 Kissy.Flash.swfs[id]方式访问匹配的SWF。
		 * @param {String,Number} 			
		 * @return {Object} 				存在返回SWF的HTML元素，否则返回 null
		 */
		get:function(target){
			var self = this,
				index = self.contain(target);
			if (index == -1)return null;
			return Flash.swfs[Flash.names[index]];
		},
		/**
		 * 移除已注册到 KISSY.Flash 的 SWF 和 DOM中对应的HTML元素 。
		 * 请在 KISSY.ready() 中使用。
		 * 注意，请不要混淆 KISSY.DOM.remove() 和 KISSY.Flash.remove().
		 * 只有执行过 KISSY.Flash.embed() 或 KISSY.Flash.register()的 SWF才可以被移除
		 * @param {String,Number,Object} target
		 * @return {Object}		存在返回SWF的HTML元素，否则返回 null
		 */
		remove:function(target){
			var self = this;
			return self._remove(target);
		},
		///////////////////////////////////////////////////////	 protected
		
		/**
		 * 
		 * @param {Object} callback
		 * @param {Object} type
		 * @param {Object} id
		 * @param {Object} ref
		 * @param {Object} index
		 */
		_fallback: function(callback,type,id,index,ref){
			var result = {};
			if(!callback || !type)return;
			result.success = type;
			if(id)result.id = id;
			if(ref)result.ref = ref;
			if(!S.isNumber(index))result.index= index;
			callback && callback(result);
		},
		/**
		 * [受保护]添加SWF至静态的存档组和实例组中。
		 * @param {String} id
		 * @param {Object} swf
		 */
		_addSWF:function(id,swf){
			var self = this,
				index = self.contain(id);
			if(index == -1){
				Flash.swfs[id] = swf;
				index = Flash.names.length;
				Flash.names[Flash.names.length] = id;
			}
			return index;
		},
		/**
		 * [受保护]注册已存在页面中的SWF。
		 * 调用务必包含在 S.ready() 中 
		 * @param {HTMLElement} el
		 * @param {Object} swf
		 */
		_register:function(el,config,callback){
			var self = this,
				result={},
				index,
				id = config.id;
			config = S.merge(defaultConifg,config);	
			//// 添加至Kissy.Flash中
			index = self._addSWF(id,el);
			
			self._fallback(callback,SWF_SUCCESS,id,index,el);

			
		},
		_embed:function (el,config,callback){
			var self =this,
				src = config.src,
				swf,
				index,
				id,
				contianer = el;
			//替换元素一定要存在，且有ID
			
			////	合成配置 HTML标签 属性
			attribs = config.attribs || {};
			id = attribs.id = config.id;
			attribs.width = config.width || attribs.width || DEFAULT_SWF_WIDTH;
			attribs.height = config.height || attribs.height || DEFAULT_SWF_HEIGHT;
			
			S.mix(attribs,html_attributes,false);
			
			///		合成配置Flash Player属性 
			params = config.params || {};
			if(!S.isEmptyObject(config.flashvars))params.flashvars = config.flashvars;
			
			S.mix(params,fp_params,false);
			
			
			////	获取SWF的 HTML结构
			////	未了统一性，使用了 <object/> 舍弃了 embed
			swf = self._getSWF(src,attribs,params);
			
			if(UA.ie){
				//// 当在ie下，返回的 swf 之外还包装了一个容器。
				//// 为的是如下的龌龊的方法。。。。
				el.outerHTML = swf.innerHTML; // 无奈IE 不支持 替换元素replaceChild 用了这个看上去很龌龊的方法
				
				swf = DOM.get("#"+id); //// 重新获取。由于之前hack，外包了容器
			}else{
				el.parentNode.replaceChild(swf,el);
			}
			//// 添加至Kissy.Flash中
			index = self._addSWF(id,swf);
			////	通知回调
			
			self._fallback(callback,SWF_SUCCESS,id,index,swf);
			
		},
		_remove:function(target){
			var self = this,
				name,
				swf = self.get(target),
				index = self.contain(target);
			if (!swf)return null;			
			DOM.remove(swf);
			name = Flash.swfs[name];
			Flash.names.splice(index,1);
			delete Flash.swfs[name];
			return swf;
		},
		_getSWF:function (swf,attribs,params){
			var self = this,
				flashvars,
				flashvar,
				param,
				value,
				attr,
				p,
				isEmptyObject = true,
				vars,
				so = document.createElement('object');
			for (attr in html_attributes) {
              attr = attr.toLowerCase();
			  if(attribs[attr]==null || attribs[attr]=="")continue;
			  so.setAttribute(attr,attribs[attr]);
            }
			
			if(UA.ie){
				so.setAttribute('classid',CID);	
				so.appendChild(getParam('movie',swf));
				p =  document.createElement('div');
				p.appendChild(so);
			}else{
				so.setAttribute('type',TYPE);	
				so.setAttribute('data',swf);	
				so.setAttribute('name',attribs.id);	
			}
			
			
			
			for (param in fp_params) {
             	 param = param.toLowerCase();
				  if(params[param]==null || params[param]=="" )continue;
				 switch(param){
				 	case "flashvars":
						flashvars = params[param];
						
						for (flashvar in flashvars) {
							if (flashvars[flashvar] !== null && flashvars[flashvar]!="") {
								
								if(!vars){
									vars = "";
								}else{
									vars += "&";
								}
								
								vars += flashvar +'='+(typeof flashvars[flashvar] == 'object' ? asString(flashvars[flashvar]) : encodeURIComponent(flashvars[flashvar])) ;
								
							}
						}
					
					break;
					default:
						vars = params[param];
				 }
				//so.innerHTML += "<param name='"+param +"' value='"+vars+"'/>";
				
				so.appendChild(getParam(param,vars));
            }
			
			
			if(UA.ie)so=p; //hack for ie 
			
			return so;
		}
		/*	TODO: 是否能实现替换原有元素
		_getHTML:function(swf,attribs,params){
			var self =this,
				html =  '<object',
				flashvars,
				flashvar,
				param,
				attr,
				vars ="";
			if(UA.ie)html += ' classid="' + CID + '"';
			else html += ' type="' + TYPE + '" data="' + swf + '"';
			for (attr in html_attributes) {
              attr = attr.toLowerCase();
			  if(attribs[attr]==null || attribs[attr]=="")continue;
			  html += ' '+attr+'="' + attribs[attr]  + '"';
            }
			html += ' >';	/// <object> start
			
			if(UA.ie)html += '<param name="movie" value="' + swf + '"/>';
			
			for (param in fp_params) {
             	 param = param.toLowerCase();
				  if(params[param]==null || params[param]=="")continue;
				 switch(param){
				 	case "flashvars":
						flashvars = params[param];
						for (flashvar in flashvars) {
							if (flashvars[flashvar] !== null) {
								vars += flashvar +'='+ encodeURIComponent((typeof flashvars[flashvar] == 'object' ? asString(flashvars[flashvar]) : flashvars[flashvar])) + '&';
							}
						}
						html += '<param name="' + param + '" value="' + params[param] + '" />';
					break;
					default:
						html += '<param name="' + param + '" value="' + params[param] + '" />';
				 }
            }
			
			html += '</object>';	/// <object> end
			return html;
		}
		*/
	});
	
	

	function getParam(key,value){
		var e =  document.createElement("param");
		e.setAttribute("name", key);	
		e.setAttribute("value", value);
		return e;
	}

	/**
	 * 类似 JSON.toStriong()
	 * 将任意数据类型以 JSON的字符串输出
	 * 注意：
	 * 		请不要用 Kissy 的JSON的替换。
	 * 		因为我们需要对 string 的内容做进一步过滤。如 "&"符号。
	 * @param {any} obj
	 */
	function asString(obj){
		var a = [];
		switch (typeOf(obj)){
			case 'string':
				obj = obj.replace(new RegExp('(["\\\\])', 'g'), '\\$1');
				
				return  '"' +encodeURIComponent(obj)+ '"';   //// 对值进行进一步过滤。
				
			case 'array':
				S.each(obj, function(el) {
					a.push(asString(el));
				})
				return '['+ a.join(',') +']'; 
			case 'function':
				return '"function()"';
			case 'object':
				var str = [];
				for (var prop in obj) {
					if (obj.hasOwnProperty(prop)) {
						str.push('"'+prop+'":'+ asString(obj[prop]));
					}
				}
				return '{'+str.join(',')+'}';
		}
	
		// replace ' --> "  and remove spaces
		return String(obj).replace(/\s/g, " ").replace(/\'/g, "\"");
	}
	
	
	function typeOf(obj) {
		if (obj === null || obj === undefined) { return false; }
		var type = typeof obj;
		return (type == 'object' && obj.push) ? 'array' : type;
	}
	/**
	 * 验证客户端是否满足播放器版本
	 * 请确保 
	 * 		当传值是 字符串时是以  .分隔。
	 * 			如 "9.0.124"
	 * 		当传值是 数字则，请按  "任意位主版本号+"."+3位次版本号+5位修正版本号“  
	 * 			如 9.0.124 对应数字表达法为  9.00000124
	 * @param {String Number} rv		请求版本号
	 */
	function hasFlashPlayerVersion(rv){
		//rv 的全称   request version
		var pv = UA.fpv;
		if(pv == -1)return pv;
		if(!rv)rv = VERSION;
		if(S.isString(rv)){
			//// 字符串如 "9.0.124" 转为标准 UA的 fpv  9.00000124
			rv = parseFloat(numerify(rv.split(".")));
		}
		return pv < rv ? 0 : 1;
	}
	
	
	function numerify(arr) {
		////	不用for补0是节省部分开销
        var ret = arr[0] + '.';
		arr[1]=arr[1]||0;
		switch (arr[1].toString().length) {
            case 1:
                ret += '00';
                break;
            case 2:
                ret += '0';
                break;
        }
		ret += arr[1];
		arr[2]=arr[2]||0;
        switch (arr[2].toString().length) {
            case 1:
                ret += '0000';
                break;
            case 2:
                ret += '000';
                break;
			case 3:
	            ret += '00';
	            break;
			case 4:
                ret += '0';
                break;
        }
        return (ret += arr[2]);
    }
	
});



/**
 * NOTEs:
 * 		> 2010/07/21	向google code 提交了基础代码
 * 		> 2010/07/22	修正了 embed 始终都有 callback 尝试性调用。
 * 						避免了未定义 el/id 或 swfurl 时无法获知错误。
 *      > 2010/07/27	迁移至github做版本管理。向 kissy-sandbox 提交了代码。
 *      > 2010/07/28	合并了公开方法 Flash.register 和 Flash.embed 为新的函数  Flash.add();
 *      				修改 Flash.length() 为 Flash.getLength() ，使其看上去更像方法而非属性方式获取。
 *      				修改 Flash.fpv() 为 fpv Flash.getFPV(),使其看上去更像方法而非属性方式获取。
 */