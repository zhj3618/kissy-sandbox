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
	 * @param {Object} flashConfig
	 * @param {Boolean} useCompression
	 * @param {Boolean} baseOnBrowser
	 */
	function Store(flashConfig,useCompression,baseOnBrowser){
		if(!flashConfig)return;
		
		var flashvars={};
		
		if(baseOnBrowser !== undefined){
			if (UA.ie) flashvars.browser = 'ie';
	        else if (UA.gecko) flashvars.browser = 'gecko';
	        else if (UA.webkit) flashvars.browser = 'webkit';
	        else if (UA.opera) flashvars.browser = 'opera';
		}
		//// Boolean.toString()
		flashvars.useCompression = (useCompression !== undefined ? useCompression : true) + '';
		
		flashConfig.flashvars = S.merge(flashConfig.flashvars,flashvars);
		
		Store.superclass.constructor.call(this, flashConfig);
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