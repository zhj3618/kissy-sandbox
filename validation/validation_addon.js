/**
 * KISSY Validator 验证器
 * @author ada <zhj3618@gmail.com>
 * @depends kissy-validator
 */
(function(){
    /**
     * 
     */
    var dependTypes = {
        "boolean": function(param, element) { return param; },
        "string": function(param, element) { return !!KISSY.query(param, element.form).length; },
        "function": function(param, element) { return param(element); }
    }
    function depend(param, element) {
        var _key = typeof(param) ;
        return dependTypes[_key] ? dependTypes[_key](param, element) : true;
    }
    
    
    function getLength(value, element) {
        switch(element.nodeName.toLowerCase()) {
            case 'select':
                var l = 0 ;
                for(var i = 0 ,n = element.options.length ; i < n ; i++){
                    if(element.options[i].selected){
                        i++ ;
                    }
                }
                return l ;
            case 'input':
                if(KISSY.Validator.checkable(element)){
                    var allchk = document.getElementsByName(element.name), l = 0 ;
                    for(var i = 0 ,n = allchk.length ; i < n ; i++){
                        if(allchk[i].checked && allchk[i].form == element.form){                        
                            l++ ;
                        }
                    }
                    return l ;
                }
        }
        return value.length ;
    }  
    
    /**
     * 选填字段验证，
     * 
     */
    function optional(element){
        return !required.call(window, KISSY.trim(element.value), element) && "precondition-failure";
    }
    
    /**
     * 必填字段验证
     * @param {Sting} value
     * @param {HTMLElement} element
     * @param {Mix} apram 
     * @return Boolean
     */
    function required(value, element, param){
        /**
         * 将字符串“true”和“required”转换成布尔真
         * 用以支持元素required="true"和required="required"两种自定义属性形式
         */
        param = param == "true" || param == "required" ? true : param; 
        if ( !depend(param, element) ){
            return "precondition-failure";
        }
        
        switch( element.nodeName.toLowerCase() ) {
            case 'select':
                // could be an array for select-multiple or a string, both are fine this way
                var val = element.options[element.selectedIndex].value;
                return val && val.length > 0;
            case 'input':
                if ( KISSY.Validator.checkable(element) )
                    return getLength(value, element) > 0;
            default:
                return KISSY.trim(value).length > 0;
        }
    }  
    
    /**
     * ======================================================
     * 添加一些常见的验证器
     * ======================================================
     */
    if(KISSY.Validator) {
        /**
         * 必填项验证
         */
        KISSY.Validator.add("required", function(value, element, param){ 
            return required(value, element, param);
        }, "请输入内容！");    
        
        /**
         * 电子邮箱格式验证
         */
        KISSY.Validator.add("email", function(value, element){
            // contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
            return optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value);
        }, "请输入有效的Email地址！");
        
        /**
         * rul地址格式验证
         */
        KISSY.Validator.add("url", function(value, element){
            // contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
            return optional(element) || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
        }, "请输入有效的rul地址！");
        
        /**
         * 最短字符串长度验证
         */
        KISSY.Validator.add("minlength", function(value, element, param){
            return optional(element) || getLength(KISSY.trim(value), element) >= param;
        }, KISSY.Validator.format("限制为最少{0}字 ！"));
        
        /**
         * 最长字符串长度验证
         */
        KISSY.Validator.add("maxlength", function(value, element, param){
            var length = getLength(KISSY.trim(value), element);
            return optional(element) || ( length >= param[0] && length <= param[1] );
        }, KISSY.Validator.format("限制为最多{0}字！"));
        
        /**
         * 字符串长度范围验证
         */
        KISSY.Validator.add("rangelength", function(value, element, param){
            return optional(element) || (value >= param[0] && value <= param[1]);
        }, KISSY.Validator.format("限制为{0}-{1}字！"));
        
        /**
         * 最小数字验证
         */
        KISSY.Validator.add("min", function(value, element, param){
            return optional(element) || value >= param;
        }, KISSY.Validator.format("请输入小于等于{0}的数字！"));
        
        /**
         * 最大数字验证
         */
        KISSY.Validator.add("max", function(value, element, param){
            return optional(element) || value <= param;
        }, KISSY.Validator.format("请输入大于等于{0}的数字！"));
        
        /**
         * 最大范围验证
         */
        KISSY.Validator.add("range", function(value, element, param){
            return optional(element) || (value >= param[0] && value <= param[1]);
        }, KISSY.Validator.format("请输入介于{0}和{1}之间的数字！"));
        
        /**
         * 数字格式验证
         */
        KISSY.Validator.add("number", function(value, element){
            return optional(element) || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value);
        }, KISSY.Validator.format("请输入一个有效的数字！"));
        
        /**
         * 整数格式验证
         */
        KISSY.Validator.add("digits", function(value, element){
            return optional(element) || /^\d+$/.test(value);
        }, KISSY.Validator.format("请输入有效的整数！"));
        
        /**
         * 英文字母格式验证
         */
        KISSY.Validator.add("alpha", function(value, element){
            return optional(element) || /^[a-zA-Z]+$/.test(v);
        }, KISSY.Validator.format("请输入英文字母！"));
        
        /**
         * 中国手机号码格式验证
         */
        KISSY.Validator.add("mobileCN", function(value, element){
            return optional(element) || /^\+?(86)*0*1[3|5|6|8]\d{9}$/.test(v);
        }, KISSY.Validator.format("请输入正确的手机号码！"));
        
        /**
         * 中国手机号码格式验证
         */
        KISSY.Validator.add("postcodeCN", function(value, element){
            return optional(element) || /^[1-9]{1}(\d+){5}$/.test(v);
        }, KISSY.Validator.format("请输入正确的邮政编码！"));
    }
})();
/*
    equalTo: "两次输入的内容不相同！",
    pattern: "请输入正确的内容",
*/