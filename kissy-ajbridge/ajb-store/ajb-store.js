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
	 * @param {String} id									需要注册的SWF应用ID。 
	 * @param {Object} config								配置项
	 * @param {Boolean} config.useCompression					配置项中的压缩标记。默认true，表示存储数据采用压缩。
	 * @param {Boolean} config.baseOnBrowser					配置项中的浏览器专署标记。默认为 false
	 */
	function Store(id,config){
		var flashvars={},
			useCompression,
			baseOnBrowser;
			
		config = config||{};
		// 1.Store 基本配置
		useCompression = config.useCompression;					
		baseOnBrowser = config.baseOnBrowser;
		
		if(baseOnBrowser){
			if (UA.ie) flashvars.browser = 'ie';
	        else if (UA.gecko) flashvars.browser = 'gecko';
	        else if (UA.webkit) flashvars.browser = 'webkit';
	        else if (UA.opera) flashvars.browser = 'opera';
		}
		//// Boolean.toString()
		flashvars.useCompression = (useCompression !== undefined ? useCompression : true) + '';
		
		config.params.flashvars = S.merge((config.params.flashvars||{}),flashvars);
		
		
		Store.superclass.constructor.call(this, id,config);
	}
	
	S.extend(Store,AJB);	////	继承自 AJBridge
	
	////	批量注册 SWFStore的方法
	AJB.addMethods(
		[
			"getItem",
			"setItem",
			"removeItem",
			"getLength",
			"key",
			"clear",
			"getModificationDate",
			"hasAdequateDimensions",
			"displaySettings",
			"getUseCompression",
			"getSize",
			"setMinDiskSpace"
		],
		Store
	);
	
	S.augment(Store,{
		version:"1.0.2"			//版本信息
	});
	
	
	S.ajb.Store = Store;
});

/**
 * NOTES:
 * 2010/08/12		重构了代码，基于AJBridge 1.0.10
 * 
 */