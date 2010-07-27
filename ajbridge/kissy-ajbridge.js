/**
 * @author kingfo  oicuicu@gmail.com
 */

KISSY.add('ajbridge', function(S) {
	
	
	
	var Flash = S.Flash,
		ALWAY_ALLOW_SCRIPT_ACCESS= "always",
		EVENT_HANDLER = 'KISSY.AJBridge.eventHandler',
		defaultConfig = {
			dynamic:true,
			ver:"9.0.0",
			id:null,
			params:null,
			flashvars:null,
			attrs:null,
			xi:null
		};
	
	// 创建纯 的命名空间 ajb
	S.namespace("ajb");
	
	function AJBridge(config){
		var self = this,
			id = (config||{}).id,
			params,
			flashvars,
			callback = function(r){
							S.mix(self,r);
						};
		
		if(!id)return;	
		
		AJBridge.instances[id] = self;	
		
		config = S.merge(defaultConfig,config);
		if(config.dynamic){
			params = config.params || {};
			//	强制打开 JS 访问授权 
			params.allowscriptaccess = ALWAY_ALLOW_SCRIPT_ACCESS;
			//	配置 AJB 基本通信
			flashvars = config.flashvars ||{};
			flashvars.jsEntry = EVENT_HANDLER;
			flashvars.swfID = id;
			
			Flash.embed(id,
						config.src,
						config.width,
						config.height,
						config.ver,
						params,
						flashvars,
						config.attrs,
						config.xi,
						callback
						);
		}else{
			//TODO: 暂时不支持静态注册.AJB的swf将在下一个版本增加 "静态发布SWF,动态初始化AJBridge"  2010/7/22
			Flash.register( config.id,
							config.ver,
							config.xi,
							callback
						
			);
		}
	}
	
	AJBridge.instances = (AJBridge.SWF || { }).instances || { };
	
	/**
	 * 静态方法
	 * 处理来自 AJBridge 已定义的事件
	 * @param {Object} event
	 */
	 AJBridge.eventHandler = function(event) {
	 	AJBridge.instances[event.id]._eventHandler(event);
    };
	/**
	 * 批量注册 SWF 公开的方法
	 * @param {Array} methods
	 * @param {Class} C
	 */
	AJBridge.addMethods = function (methods,C){
		if(!S.isArray(methods))return;
		S.each(methods,function(methodName) {
			 C.prototype[methodName] = function() {
	            try {
	                return this.callSWF(methodName, S.makeArray(arguments));
	            }catch(e) { // 当 swf 异常时，进一步捕获信息
	                this.fire('error', { message: e });
	            }
	        }
		});
	}
	/**
	 * 注册 SWF 公开的方法
	 * @param {String} method
	 * @param {Class} C
	 */
	AJBridge.addMethod = function(method,C){
		C.prototype[method] = function() {
            try {
                return this.callSWF(method, S.makeArray(arguments));
            }catch(e) { // 当 swf 异常时，进一步捕获信息
                this.fire('error', { message: e });
            }
        }
	}
	
	
	S.augment(AJBridge, S.EventTarget);
	S.augment(AJBridge, {

        _eventHandler: function(event) {
            var self = this,
                type = event.type;
            if (type === 'log') {
                S.log(event.message);
            } else if (type) {
                self.fire(type, event);
            }
        },

        /**
         * Calls a specific function exposed by the SWF's ExternalInterface.
         * @param func {String} the name of the function to call
         * @param args {Array} the set of arguments to pass to the function.
         */
        callSWF: function (func, args) {
            var self = this;
            args = args || [];

            try {
                if (self.ref[func]) {
                    return self.ref[func].apply(self.ref, args);
                }
            }
                // some version flash function is odd in ie: property or method not supported by object
            catch(e) {
                var params = '';
                if (args.length !== 0) {
                    params = "'" + args.join("','") + "'";
                }
                //avoid eval for compressiong
                return (new Function('self', 'return self.swf.' + func + '(' + params + ');'))(self);
            }

        }
    });
	
	S.AJBridge = AJBridge;
	
});

/**
 * NOTES:
 * 		>2010/07/22		完成基本代码
 * 		>	
 * 
 */
