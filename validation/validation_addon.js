/**
 * KISSY Validator ��֤��
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
     * ѡ���ֶ���֤��
     * 
     */
    function optional(element){
        return !required.call(window, KISSY.trim(element.value), element) && "precondition-failure";
    }
    
    /**
     * �����ֶ���֤
     * @param {Sting} value
     * @param {HTMLElement} element
     * @param {Mix} apram 
     * @return Boolean
     */
    function required(value, element, param){
        /**
         * ���ַ�����true���͡�required��ת���ɲ�����
         * ����֧��Ԫ��required="true"��required="required"�����Զ���������ʽ
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
     * ���һЩ��������֤��
     * ======================================================
     */
    if(KISSY.Validator) {
        /**
         * ��������֤
         */
        KISSY.Validator.add("required", function(value, element, param){ 
            return required(value, element, param);
        }, "���������ݣ�");    
        
        /**
         * ���������ʽ��֤
         */
        KISSY.Validator.add("email", function(value, element){
            // contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
            return optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value);
        }, "��������Ч��Email��ַ��");
        
        /**
         * rul��ַ��ʽ��֤
         */
        KISSY.Validator.add("url", function(value, element){
            // contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
            return optional(element) || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
        }, "��������Ч��rul��ַ��");
        
        /**
         * ����ַ���������֤
         */
        KISSY.Validator.add("minlength", function(value, element, param){
            return optional(element) || getLength(KISSY.trim(value), element) >= param;
        }, KISSY.Validator.format("Please enter at least {0} characters."));
        
        /**
         * ��ַ���������֤
         */
        KISSY.Validator.add("maxlength", function(value, element, param){
            var length = getLength(KISSY.trim(value), element);
            return optional(element) || ( length >= param[0] && length <= param[1] );
        }, KISSY.Validator.format("Please enter no more than {0} characters."));
        
        /**
         * �ַ������ȷ�Χ��֤
         */
        KISSY.Validator.add("rangelength", function(value, element, param){
            return optional(element) || (value >= param[0] && value <= param[1]);
        }, KISSY.Validator.format("Please enter a value between {0} and {1} characters long."));
        
        /**
         * ��С������֤
         */
        KISSY.Validator.add("min", function(value, element, param){
            return optional(element) || value >= param;
        }, KISSY.Validator.format("������С�ڵ���{0}�����֣�"));
        
        /**
         * ���������֤
         */
        KISSY.Validator.add("max", function(value, element, param){
            return optional(element) || value <= param;
        }, KISSY.Validator.format("��������ڵ���{0}�����֣�"));
        
        /**
         * ���Χ��֤
         */
        KISSY.Validator.add("range", function(value, element, param){
            return optional(element) || (value >= param[0] && value <= param[1]);
        }, KISSY.Validator.format("���������{0}��{1}֮������֣�"));
    }
})();
/*
    number: "������һ����Ч�����֣�",
    digits: "��������Ч��������",
    equalTo: "������������ݲ���ͬ��",
    pattern: "��������ȷ������",
    alpha��"������Ӣ����ĸ��",
    mobile��"��������Ч���ֻ����룡",
    postcode "��������Ч���������룡",
*/