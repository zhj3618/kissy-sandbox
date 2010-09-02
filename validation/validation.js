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
    HIDDEN_CLASS_NAME     = "S-hidden" ,
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
    },
    
    /**
     * 自定义属性限制
     * 这有这些自定义属性才会被识别
     */
    attrLimit = {
        min: true,
        max: true,
        range: true,
        minlength: true,
        maxlength: true,
        rangelength: true,
        //required: true, //webkit内核浏览器的内置requried验证通过前不会触发表单的onsubmit事件！
        pattern: true
    },
    
    getId = function(el){
        if(!el){return ;}
        var id = el.id ;
        if(!id){
            id = el.id = S.guid("S_VALIDADOR_ELEMENT") ;
        }
        return id ;
    };
    
    /**
     * .HIDDEN_CLASS_NAME{display:none;}}插入到页面head，备用！
     */
    S.ready(function(){
        Dom.addStyleSheet("." + HIDDEN_CLASS_NAME + "{display:none;}");
    });

    /**
     * KISSY Validator
     * @class Validator
     * @constructor
     */
    function Validator(form, config) {
        if (!(this instanceof arguments.callee)) {
            return new arguments.callee(form, config);
        }
        this.currentForm = S.get(form);
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
                var focusKeyTypes = {"text":true,"password":true,"file":true,"textarea":true,"select-one":true,"select-multiple":true},
                    clickType = {"radio":true,"checkbox":true},
                    changeType = {"select-one":true,"select-multiple":true}
                    
                /**
                 * 绑定表单的click事件
                 * 当满足一些基本条件后进行实时校验
                 */
                Event.add(self.currentForm, "click", function(e){
                    var target = e.target ;
                    if(target.name && !target.disabled && self.submitted[target.name]) {
                            if(clickType[target.type]) {
                            /**
                             * 对checkbox和radio做特殊处理，获取同name的第一个元素
                             */
                            if(S.Validator.checkable(target)){
                                target = self._findByName(target.name)[0];
                            }
                            self.validate(target);
                        } else if(changeType[target.type]){
                            /**
                             * 如果是下拉框元素，则在点击是绑定change事件，
                             * 并通过自定义属性data-event-change标记是否已经绑定过change事件
                             */
                            if(!Dom.attr(target,"data-event-change")){
                                Dom.attr(target,"data-event-change","true");
                                Event.add(target,"change",function(){
                                    self.validate(target);
                                });
                            }
                        }
                    } 
                });
                
                /**
                 * 绑定表单的focusout keyup事件
                 * 当满足一些基本条件后进行实时校验
                 */
                Event.add(self.currentForm, "focusout keyup", function(e){
                    var target = e.target ;
                    if(focusKeyTypes[target.type] && target.name && !target.disabled && self.submitted[target.name]) {
                        self.validate(target);
                    }
                });
                
                /**
                 * 绑定表单的focusin事件
                 */
                Event.add(self.currentForm, "focusin", function(e){
                    var target = e.target ;                    
                    if(focusKeyTypes[target.type] && target.name && !target.disabled) {
                        self.lastActive = target ;
                        if(self.config.focusCleanup && !self.config.autoFocus) {
                            self._hideValid(target);
                        }
                    }
                });
            }
            
            /**
             * 绑定到表单reset事件
             * TODO 去掉元素上的样式和隐藏提示信息
             */
            Event.add(self.currentForm, "reset", function(e){
                self.reset();
                return true ;
            });
            /**
             * form submit Event handle
             */
            if (self.currentForm && self.config.onSubmit) {
                Event.add(self.currentForm, "submit", function(e){ 
                    if(!self.validate()){
                        e.preventDefault() ;
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
                            }catch(e){S.log(e)}
                        }
                    };
                });
            }
            
            self.reset();
        },
        
        /**
         * 执行验证
         * @param {Selector | HTMLElement} elements (optional) 
         * 要验证的元素，不指定就验证所有元素
         * @return Boolean
         */
        validate: function(elements){          
            var self = this, isFormValid = false ;
            
            self.reset();
            
            elements = S.query(elements) ;
            if(!elements.length) {
                elements = self._getElemts();
                isFormValid = true ;
            }
            
            if(isFormValid && self.fire(EVENT_BEFORE_VALIDATE, {form: self.currentForm}) === false){
                return false ;
            };
            /**
             * 对每个需要验证的元素进行验证
             */
            for(var i = 0, n = elements.length; i < n; i++) {
                self.submitted[elements[i].name] = true ;
                self._check(elements[i]);
            }
            
            
            self.showMessage(); 
            if(isFormValid) {
                self.fire(EVENT_VALIDATE, {form: self.currentForm});
            }
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
            var self = this , rules = self._getRules(element), _id = getId(element);
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
                        continue;
                    }
                    if(!result) {                  
                            var message = self._getCustomMessage(_id, method) || defaultConfig.messages[method] || self.config.defaultErrorMessage, theregex = /\$?\{(\d+)\}/g;
                            if (S.isFunction(message)) {
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
            self.successList.push({element:element});
        },
        
        /**
         * 显示验证信息
         * @param {Object} messages
         * @public
         */
        showMessage: function(messages){
            var self = this ;
            if(messages) {
                self.errorList = [];
                for ( var name in messages ) {
                    self.errorList.push({
                        message: messages[name],
                        element: self._findByName[0]
                    });
                }
                // remove items from success list
                self.successList = S.filter(self.successList, function(element) {
                    return !(element.element.name in messages);
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
            var self = this, label = this._getLabelForElement(element);
            if(label){
                self._showInvalid(label);
                if(Dom.attr(label, "generated")) {
                    Dom.html(label, message ,false);
                }
            } else {
                label = Dom.create("<" + self.config.messageElement + ">", { "for": element.name, "generated": "generated", "class": self.config.invalidClass});
                label.innerHTML = message ;
                Dom.html(label, message ,false);
                if(self.config.messageWrapper){
                    var _labelInner = label ;
                    if(self.config.messageWrapper.indexOf("<") == 0) {
                        label = Dom.create(self.config.messageWrapper);
                    } else {
                        label = Dom.create("<" + self.config.messageWrapper + ">");
                    }
                    label.appendChild(_labelInner);
                }
                if(self.messageContainer) {
                    self.messageContainer.appendChild(label);
                } else {
                    element.parentNode.appendChild(label);
                    //Dom.insertAfter(label, element) ;
                }
                if(_labelInner) {
                    label = _labelInner ;
                    _labelInner = null ;
                }
            }
            self.fire(EVENT_INVALID,{label:label, element:element})

        },
        
        /**
         * 隐藏那些通过验证元素对应的信息
         * @private
         * @param {HTMLElement} element
         */
        _hideValid: function(element){   
            var self = this, label = self._getLabelForElement(element);
            Dom.addClass(element, self.config.validClass);
            Dom.removeClass(element, self.config.invalidClass); 
            if(label){
                Dom.addClass(self._getMessageElementWrapper(label), HIDDEN_CLASS_NAME);
            }
            self.fire(EVENT_VALID, {label:label,element:element}) ;
        },
        
        /**
         * 显示那些未通过验证元素对应的信息
         * @private
         * 
         */
        _showInvalid: function(label){  
            var self = this;
            Dom.removeClass(label, self.config.validClass);
            Dom.addClass(label, self.config.invalidClass);
            Dom.removeClass(self._getMessageElementWrapper(label), HIDDEN_CLASS_NAME);
        },
        
        /**
         * 获取错误信息对象的包裹元素
         * @private
         * @return HTMLElement
         */
        _getMessageElementWrapper: function(label){
            var self = this;
            if(self.config.messageWrapper) {
                label = Dom.parent(label) ;
            }
            return label ;
        },
        
        /**
         * 获得元素对应的错误信息对象（文本容器）
         * @private
         * @return HTMLElement
         * TODO 性能提升
         */
        _getLabelForElement: function(element){
            var self = this, selector = self.config.messageElement + "." +self.config.invalidClass,
            co = self.messageContainer || document.body,
            label = Dom.filter(selector, function(ele){
                return Dom.contains(co, ele) && Dom.attr(ele, "for") == element.name ;             
            });
            return label[0] ;
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
        _getCustomMessage: function(id, method) {
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
        _getRules: function(element){
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
         * 添加规则
         */
        addRule: function(element, rule, value, message) {
            var self = this, allRules = self.config.rules, allMessages = self.config.messages ;
            if(arguments.length <= 3) {
                message = value ;
                value = true ;
            }
            var _id = getId(S.get(element));
            if(_id && rule){
                allRules[_id] = allRules[_id] ? allRules[_id] : {} ;
                allRules[_id][rule] = value ;
                if(message) {
                    allMessages[_id] = allMessages[_id] ? allMessages[_id] : {} ;
                    allMessages[_id][rule] = message ;
                }
            }
        },
        
        /**
         * 获取通过data-type属性绑定的验证规则
         * data-type属性支持xxx:xxx:xxx型式；规则名:规则值:规则提示信息，示例：
         * data-type="requried:#J_NeedInvoice[checked=true]:请填写发票抬头" 
         * //当需要发票的checkbox被选中时，要求发票抬头字段必填
         * @private
         */
        _getDateTypeRules: function(element){
            var self = this, rules = {}, defVaule = true ;
            var dt = Dom.attr(element, "data-type");
            dt && S.each(dt.split(' '), function(item) {
                var nm = item.toLowerCase().split(":");
                if (nm[0] in self.config.methods) {
                    /**
                     * 数组化data-type中的字符串
                     */
                    //rules[nm[0]] = nm[1] ? eval("(" + nm[1] + ")") : defVaule ;
                    if(nm[1] && nm[1].indexOf("[") == 0 && nm[1].indexOf("]")==nm[1].length - 1) {
                        nm[1] = nm[1].slice(1,-1).split(',');
                    }
                    rules[nm[0]] = nm[1] ? nm[1] : defVaule ;
                    
                    //如果指定了自定义信息
                    if(nm[2]){
                        var _id = getId(element);
                        if(!self.config.messages[_id]){
                            self.config.messages[_id] = {} ;
                        }
                        self.config.messages[_id][nm[0]] = nm[2] ;
                    }
                }
            });
            
            return rules;
        },
        
        /**
         * 获取自定义属性规则，仅支持sttrLimit对象中定义的属性
         * @private
         */
        _getAttributeRules: function(element){
            var self = this, rules = {};            
            for (method in /*self.config.methods*/attrLimit) {
                var value = Dom.attr(element, method);
                if (self.config.methods[method] && value) {
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
         * 获取当前元素的静态验证规则
         * @private
         */
        _getStaicRules: function(element){
            var _id = getId(element);
            var self = this, rules = self.config.rules[_id] ;   
            rules = rules ? rules : {} ;
            return rules ;
        }
        
    });

    /**
     * =========================================================================
     * 一些工具方法
     * =========================================================================
     */
    
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