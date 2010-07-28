/**
 * @author kingfo  oicuicu@gmail.com
 */
KISSY.add("ajb-store",function(S){
	
	var NAME="swfstore",
		AJB = S.AJBridge,
		UA = S.UA;
	
	S.namespace("ajb.Store");
	/**
	 * 本地存储类
	 * @param {String} id
	 * @param {Object} config
	 * @param {Boolean} config.useCompression
	 * @param {Boolean} config.baseOnBrowser
	 */
	function Store(id,config){
		var flashvars={},
			useCompression,
			baseOnBrowser;
			
		config = config||{};
		useCompression = config.useCompression;
		baseOnBrowser = config.baseOnBrowser;
		
		if(baseOnBrowser !== undefined){
			if (UA.ie) flashvars.browser = 'ie';
	        else if (UA.gecko) flashvars.browser = 'gecko';
	        else if (UA.webkit) flashvars.browser = 'webkit';
	        else if (UA.opera) flashvars.browser = 'opera';
		}
		//// Boolean.toString()
		flashvars.useCompression = (useCompression !== undefined ? useCompression : true) + '';
		
		config.flashvars = S.merge((config.flashvars||{}),flashvars);
		
		
		Store.superclass.constructor.call(this, id,config);
	}
	
	S.extend(Store,AJB);	////	继承自 AJBridge
	
	////	批量注册 SWFStore的方法
	AJB.addMethods(
		[
			"getItem",
			"key",
			"length",
			"getModificationDate",
			"getSize",
			"setItem",
			"removeItem",
			"clear",
			"setMinDiskSpace",
			"displaySettings",
			"getUseCompression",
			"hasAdequateDimensions"
		],
		Store
	);
	
	
	S.ajb.Store = Store;
});