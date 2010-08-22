/**
 * KISSY Validation
 * @module      Validatotion
 * @class       Validator
 * @creator     ada <zhj3618@gmail.com>
 * @depends     kissy-core, kissy-dom, kissy-event
 */
KISSY.add("validator", function(S) {
        var Event = S.Event, Dom = S.DOM ,
        EVENT_BEFORE_VALIDATE = "beforeValidate" ,
        EVENT_VALID           = "valid" ,
        EVENT_INVALID         = "invalid" ,
        EVENT_VALIDATE        = "validate" ,
        defaultConfig = {            
            /**
             * 是否在表单提交时验证
             * @type {Boolean}
             */
            onSubmit: true,
            
            /**
             * 验证前最后一个获取焦点的元素或第一个验证失败的元素自动获取焦点
             * @type {Boolean}
             */
            autoFocus: true,
            
            /**
             * 在元素获取焦点时是否隐藏验证信息
             * 注：不能与autoFocus参数同时使用，否则无效
             * @type {Boolen}
             */
            focusCleanup: false,
            
            /**
             * 是否为懒验证模式，懒验证模式下，当元素值改变后不会触发验证
             * @type {Boolean}
             */
            isLazy: false,
            
            /**
             * 忽略列表，忽略列表中的元素将跳过验证
             * @type {Array}
             */
            ignoreList: [],
            
            /**
             * 元素验证通过后的样式标记
             * @type {String}
             */
            validClass: "valid",
            
            /**
             * 元素验证不通过后的样式标记
             * @type {String}
             */
            invalidClass: "invalid",
            
            /**
             * 提示信息元素
             * @type {String}
             */
            messageElement: "LABEL",
            
            /**
             * 提示信息元素外再包裹一层元素
             * @type {String}
             */
            messageWrapper: null,
            
            /**
             * 将提示信息元素放在一个区域集中显示
             * @type {String}
             */
            messageContainer: null,
            
            /**
             * 默认错误信息
             * 当验证规格没有对应的错误反馈信息时，将显示这条信息。
             */
            defaultErrorMessage: "内容格式不正确！",
        
            /**
             * 验证规则
             * @type {Object}
             */
            rules: {},
            
            /**
             * 验证函数
             * @type {Object}
             */
            methods: {}, 
                
            /**
             * 默认提示信息
             * @type {Object}
             */
            messages: {}
        },
        
        objectLength = function(o){            
            var count = 0;
            for (var i in o)
                count++;
            return count;
        }

    /**
     * Validator
     * @constructor
     */
    function Validator(form, config) {
        if (!(this instanceof arguments.callee)) {
            return new arguments.callee(form, config);
        }
        this.currentForm = S.get("form");
        this.config = S.merge(defaultConfig, config || {});
        this._init();
    }
    
    
    S.mix(Validator.prototype, {

        /**
         * 初始化
         * @private
         */
        _init: function() {            
            var self = this ;
            self.messageContainer = S.get(self.config.messageContainer) ;
            self.submitted = {};
            self.lastActive = null ;
            
            /**
             * event delegation
             */
            if(!self.config.isLazy){
                var focusTypes = {"text":true,"password":true,"file":true,"textarea":true,"select":true},
                    clickType = {"radio":true,"checkbox":true,"select":true,"option":true} ;
                Event.add(self.currentForm, "click", function(e){
                    var target = e.target ;
                    if(clickType[target.type] && target.name && !target.disabled && self.submitted[target.name]) {
                        /**
                         * 对checkbox和radio做特殊处理，获取同name的第一个元素
                         */
                        if(S.Validator.checkable(target)){
                            target = self._findByName(target.name)[0];
                        }
                        self.validate(target);
                    }                    
                });
                Event.add(self.currentForm, "focusout keyup", function(e){
                    var target = e.target ;
                    if(focusTypes[target.type] && target.name && !target.disabled && self.submitted[target.name]) {
                        self.validate(target);
                    }
                });
                Event.add(self.currentForm, "focusin", function(e){
                    var target = e.target ;                    
                    if(focusTypes[target.type] && target.name && !target.disabled) {
                        self.lastActive = target ;
                        if(self.config.focusCleanup && !self.config.autoFocus) {
                            self._hideValid(target);
                        }
                    }
                });
            }
            
            /**
             * form submit Event handle
             */
            if (self.currentForm && self.config.onSubmit) {
                Event.add(self.currentForm, "submit", function(e){
                    if(!self.validate()){
                        e.preventDefault() ;
                    };
                });
            }
            
            self.reset();
        },
        
        /**
         * 执行验证
         * @param {Selector | HTMLElement} elements (optional) 
         * 要验证的元素，不指定就验证所有元素
         */
        validate: function(elements){          
            var self = this ;
            
            self.reset();
            
            if(self.fire(EVENT_BEFORE_VALIDATE, {form: self.currentForm}) === false){
                return false ;
            };
            
            elements = S.query(elements) ;
            if(!elements.length) {
                elements = self._getElemts();
            }
            /**
             * 对每个需要验证的元素进行验证
             */
            for(var i = 0, n = elements.length; i < n; i++) {
                self.submitted[elements[i].name] = true ;
                self._check(elements[i]);
            }
            
            /**
             * auto focus
             */
            if(self.config.autoFocus && !self.isValid()) {
                var _last = self.errorList[0].element ;
                S.filter(self.errorList, function(item){
                    if(item.element === self.lastActive) {
                        _last = self.lastActive;
                        return ;
                    }
                });
                try{
                    _last.focus();
                }catch(e){}
            }
            
            self.showError(); 
            self.fire(EVENT_VALIDATE);
            return self.isValid() ;
        },
        
        /**
         * 重置验证组件
         */
        reset: function(){ 
            this.successList = [];
            this.errorList = [];
        },
        
        /**
         * 获取错误对象列表
         * [{element: element, message: message},{... ...}]
         * @return Array
         */
        getInvalid: function(){
            return this.errorList ;
        },
        
        /**
         * 判断表单验证是否通过
         * @return {Boolean}
         */
        isValid: function(){
            return this.errorList.length === 0 ;
        },
        
        /**
         * 核心验证函数
         * @private
         */
        _check: function(element){
            var self = this ;
            var rules = self.getRules(element), preconditionFailure = false;
            for(method in rules){
                var rule = {method: method, parameters: rules[method]} ;
                try{
                    //执行验证
                    var result = self.config.methods[method].call(self, element.value, element, rule.parameters);
                    /**
                     * 前置判断
                     * 前置条件不满足则直接跳过该规则的验证
                     */
                    if (result == "precondition-failure") {
                        preconditionFailure = true;
                        continue;
                    }
                    preconditionFailure = false;  
                    if(!result) {                  
                            var message = self._getCustomMessage(element.id, method) || defaultConfig.messages[method] || self.config.defaultErrorMessage, theregex = /\$?\{(\d+)\}/g;
                            if (typeof message == "function") {
                                message = message.call(self, rule.parameters, element);
                            } else if (theregex.test(message)) {
                                message = KISSY.Validator.format(message.replace(theregex, '{$1}'), rule.parameters);
                            }           
                            self.errorList.push({
                                message: message,
                                element: element
                            });
                        return false;
                    }
                } catch(e){S.log(e)}
            }
            /**
             * 所有规则的前置条件都不满足时跳过该元素的验证
             */
            //if (preconditionFailure){return;}
            
            //if (objectLength(rules)){
                /**
                 * 全部规则验证通过
                 */
                self.successList.push({element:element});
            //}
        },
        
        showError: function(errors){
            var self = this ;
            if(errors) {
                self.errorList = [];
                for ( var name in errors ) {
                    self.errorList.push({
                        message: errors[name],
                        element: self._findByName[0]
                    });
                }
                // remove items from success list
                self.successList = S.filter(self.successList, function(element) {
                    return !(element.element.name in errors);
                });
            }
            for ( var i = 0; self.errorList[i]; i++ ) {
                var error = self.errorList[i];
                Dom.addClass(error.element, self.config.invalidClass);   
                Dom.removeClass(error.element, self.config.validClass);             
                self._showLabel( error.element, error.message );
            }
            
            for ( var i = 0; self.successList[i]; i++ ) {
                var success = self.successList[i];
                self._hideValid(success.element);
            }
            
        },   
        
        _showLabel: function(element, message){
            var self = this, label = this._getMessageForElement(element);
            if(label.length){
                self._showInvalid(label);
                if(Dom.attr(label, "generated")) {
                    Dom.html(label, message ,false);
                }
                label = self._getMessageElementWrapper(label)[0] ;
            } else {
                label = Dom.create("<" + self.config.messageElement + ">", { "for": element.name, "generated": "generated", "class": self.config.invalidClass});
                label.innerHTML = message ;
                Dom.html(label, message ,false);
                if(self.config.messageWrapper){
                    var _labelInner = label ;
                    label = Dom.create("<" + self.config.messageWrapper + ">");
                    label.appendChild(_labelInner);
                    _labelInner = null;
                }
                if(self.messageContainer) {
                    self.messageContainer.appendChild(label);
                } else {
                    Dom.insertAfter(label, element) ;
                }
            }
            self.fire(EVENT_INVALID,{label:label, element:element})

        },
        
        _hideValid: function(element){   
            var self = this, label = self._getMessageForElement(element);
            Dom.addClass(element, self.config.validClass);
            Dom.removeClass(element, self.config.invalidClass); 
            if(label){
                Dom.addClass(self._getMessageElementWrapper(label), "hidden");
            }
            self.fire(EVENT_VALID, {label:label}) ;
        },
        
        _showInvalid: function(label){  
            var self = this;
            Dom.removeClass(label, self.config.validClass);
            Dom.addClass(label, self.config.invalidClass);
            Dom.removeClass(self._getMessageElementWrapper(label),"hidden");
        },
        
        /**
         * 获取错误信息对象的包裹元素
         * @private
         * @return HTMLElement
         */
        _getMessageElementWrapper: function(label){
            var self = this;
            if(self.config.messageWrapper) {
                label = Dom.parent(label, self.config.messageWrapper) ;
            }
            return label ;
        },
        
        /**
         * 获得元素对应的错误信息对象（文本容器）
         * @private
         * @return HTMLElement
         */
        _getMessageForElement: function(element){
            var self = this, selector = self.config.messageElement + "." +self.config.invalidClass,
            co = self.messageContainer || document.body,
            label = Dom.filter(selector, function(ele){
                return Dom.contains(co, ele) && Dom.attr(ele, "for") == element.name ;             
            });
            return label ;
        },
        
        /**
         * 获取当前表单内所以name匹配的元素
         * @private
         */
        _findByName: function(name){
            var self = this ;
            return S.filter(document.getElementsByName(name), function(ele){
                return ele.form == self.currentForm && !ele.disabled;
            });
        },
        
        /**
         * 获取用户自定的message信息
         * @private
         */
        _getCustomMessage: function(id, method ) {
            var m = this.config.messages[id];
            return m && (m.constructor == String
                ? m
                : m[method]);
        },
        /**
         * 获取需要验证的所有表单元素
         * @private
         */
        _getElemts: function(){
            var self = this, elements = [] ;
            
            if(self.currentForm) {
                var _elements = self.currentForm.elements, cache = {} ;
                for(var i = 0, n = _elements.length; i < n; i++){
                    var _valiable = true ;
                    switch(_elements[i].type) {
                        case "submit" : 
                        case "reset" : 
                        case "image" : 
                            _valiable = false ;
                    }
                    if(_elements[i].disabled || 
                    !_elements[i].name || 
                    self._isIgnore(_elements[i]) || 
                    cache[_elements[i].name]
                    /**
                     * 这里如果把没有规则的元素也过滤掉的话，
                     * 当依赖为真时，如果已经显示了错误信息，会导致错误信息无法隐藏，
                     * 在没有想但其它办法前暂不过滤
                     */
                    /* || 
                    !objectLength(self.getRules(_elements[i]))*/) {
                        _valiable = false ;
                    }
                    if(_valiable) {
                        elements.push(_elements[i]) ;
                        cache[_elements[i].name] = true;
                    }
                }
            }
            return elements ;
        },
        
        /**
         * 判断当前元素是否要忽略验证
         * @private
         * TODO 提升性能 b
         */
        _isIgnore: function(element){
            var self = this, ignoreList = [] ;
            if(S.isArray(self.config.ignoreList)) {
                S.each(self.config.ignoreList,function(el){
                    ignoreList.push(S.get(el));
                });
            } else {            
                ignoreList = S.query(self.config.ignoreList);
            }
            
            for(var i = 0, n = ignoreList.length; i < n; i++){
                if(ignoreList[i] == element) {
                    return true ;
                }
            }
            return false ;
        },
        
        /**
         * 获取绑定到当前元素上的所有验证规则
         * @param {Selector | HTMLElement} 表单元素
         * @private
         */
        getRules: function(element){
            element = S.get(element) ;
            if(!element){return {}};
            var self = this, rules = {} ;
            rules = S.merge(
                self._getDateTypeRules(element),
                self._getAttributeRules(element),
                self._getStaicRules(element)
            ) ;
            /**
             * 依赖规则处理
             */
            S.each(rules, function(val, prop){
                if(val == false) {
                    delete rules[prop];
                    return;
                }
                if (val.param || val.depends) {
                    var keepRule = true;
                    switch (typeof val.depends) {
                        case "string":
                            keepRule = !!S.get(val.depends).length;
                            break;
                        case "function":
                            keepRule = val.depends.call(element, element);
                            break;
                    }
                    if (keepRule) {
                        rules[prop] = val.param !== undefined ? val.param : true;
                    } else {
                        delete rules[prop];
                    }
                }
            });
            
            // evaluate parameters
            S.each(rules, function(val, prop) {
                rules[prop] = S.isFunction(val) ? val(element) : val;
            });
            
            /**
             * 保证requried规则在最前面
             */
            if (rules.required) {
                var param = rules.required;
                delete rules.required;
                rules = S.merge({required: param}, rules);
            }
            return rules
        },
        /**
         * 
         * @private
         */
        _getDateTypeRules: function(element){
            var self = this, rules = {};
            var dt = Dom.attr(element, "data-type");
            dt && S.each(dt.split(' '), function(item) {
                if (item in self.config.methods) {
                    rules[item] = true ;
                }
            });
            
            return rules;
        },
        
        /**
         * 
         * @private
         */
        _getAttributeRules: function(element){
            var self = this, rules = {};            
            for (method in self.config.methods) {
                var value = Dom.attr(element, method);
                if (value) {
                    rules[method] = value;
                }
            }
            // maxlength may be returned as -1, 2147483647 (IE) and 524288 (safari) for text inputs
            if (rules.maxlength && /-1|2147483647|524288/.test(rules.maxlength)) {
                delete rules.maxlength;
            }
            return rules;
        },
        /**
         * 
         * @private
         */
        _getStaicRules: function(element){
            var self = this, rules = {} ;   
            rules = self.config.rules[element.id] ? self.config.rules[element.id] : {} ;
            return rules ;
        }
        
    });

    
    /**
     * 重置默认配置
     * @param {Object} config 配置信息
     * @static
     * @return Validator
     */
    Validator.setDefaults = function(config){
        defaultConfig = S.merge(defaultConfig,config);
        return Validator ;
    }
    
    /**
     * 模板替换工具
     * @param {String} source 要替换的模板
     * @param {Array} params 数据
     * @static
     * @return {String} source 替换后的模板
     */
    Validator.format = function(source, params){
        if(arguments.length == 1) 
            return function() {
                var args = S.makeArray(arguments);
                args.unshift(source);
                return Validator.format.apply( this, args );
            };
        if (arguments.length > 2 && params.constructor != Array ) {
            params = S.makeArray(arguments).slice(1);
        }
        if (params.constructor != Array) {
            params = [ params ];
        }
        S.each(params, function(n, i) {
            source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
        });
        return source;
    }
    
    /**
     * 添加一个校验器 
     * @static
     * @return Validator
     */
    Validator.add = function(name, method, message){
        defaultConfig.methods[name] = method;
        defaultConfig.messages[name] = message != undefined ? message : defaultConfig.messages[name];
        return Validator
    }
    
    /**
     * 判断表单元素是否是可勾选元素
     * @return Boolean
     */
    Validator.checkable = function(element){
        return /radio|checkbox/i.test(element.type);
    }
    
    
    S.augment(Validator, S.EventTarget, false);
    S.Validator = Validator;
});