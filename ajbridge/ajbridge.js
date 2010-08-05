/**
 * @author kingfo  oicuicu@gmail.com
 */

KISSY.add('ajbridge', function(S) {
	
	
	
	var Flash = S.Flash,
		ALWAY_ALLOW_SCRIPT_ACCESS= "always",
		EVENT_HANDLER = 'KISSY.AJBridge.eventHandler';
	
	// 创建纯 的命名空间 ajb
	S.namespace("ajb");
	
	/**
	 * AJBridge
	 * @param {String} id
	 * @param {Object} config
	 * @param {Function} fallback
	 */
	function AJBridge(id,config,fallback){
		var self = this,
			params,
			flashvars,
			traget = "#"+id,
			callback = function(data){
							if(data.status != 1){
								fallback&&fallback(data);
								return;
							}
							S.mix(self,data);
						};
		
		//注册应用实例
		AJBridge.instances[id] = self;	
		
		//标准化参数关键字
		config = F._normalize(config||{});
		
		config.params = config.params || {};
		//	强制打开 JS 访问授权 
		config.params.allowscriptaccess = ALWAY_ALLOW_SCRIPT_ACCESS;
		
		config.params.flashvars = config.params.flashvars ||{};
		
		//	 AJBridge基本配置 
		config.params.flashvars.jsEntry = EVENT_HANDLER;
		config.params.flashvars.swfID = id;
		
		
		
		Flash.add(traget,config,callback);
		
		
	}
	
	AJBridge.instances = (S.AJBridge || { }).instances || { };
	
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
	
	
	S.augment(AJBridge, S.EventTarget, {

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
