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
             * �Ƿ��ڱ��ύʱ��֤
             * @type {Boolean}
             */
            onSubmit: true,
            
            /**
             * ��֤ǰ���һ����ȡ�����Ԫ�ػ��һ����֤ʧ�ܵ�Ԫ���Զ���ȡ����
             * @type {Boolean}
             */
            autoFocus: true,
            
            /**
             * ��Ԫ�ػ�ȡ����ʱ�Ƿ�������֤��Ϣ
             * ע��������autoFocus����ͬʱʹ�ã�������Ч
             * @type {Boolen}
             */
            focusCleanup: false,
            
            /**
             * �Ƿ�Ϊ����֤ģʽ������֤ģʽ�£���Ԫ��ֵ�ı�󲻻ᴥ����֤
             * @type {Boolean}
             */
            isLazy: false,
            
            /**
             * �����б������б��е�Ԫ�ؽ�������֤
             * @type {Array}
             */
            ignoreList: [],
            
            /**
             * Ԫ����֤ͨ�������ʽ���
             * @type {String}
             */
            validClass: "valid",
            
            /**
             * Ԫ����֤��ͨ�������ʽ���
             * @type {String}
             */
            invalidClass: "invalid",
            
            /**
             * ��ʾ��ϢԪ��
             * @type {String}
             */
            messageElement: "LABEL",
            
            /**
             * ��ʾ��ϢԪ�����ٰ���һ��Ԫ��
             * @type {String}
             */
            messageWrapper: null,
            
            /**
             * ����ʾ��ϢԪ�ط���һ����������ʾ
             * @type {String}
             */
            messageContainer: null,
            
            /**
             * Ĭ�ϴ�����Ϣ
             * ����֤���û�ж�Ӧ�Ĵ�������Ϣʱ������ʾ������Ϣ��
             */
            defaultErrorMessage: "���ݸ�ʽ����ȷ��",
        
            /**
             * ��֤����
             * @type {Object}
             */
            rules: {},
            
            /**
             * ��֤����
             * @type {Object}
             */
            methods: {}, 
                
            /**
             * Ĭ����ʾ��Ϣ
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
         * ��ʼ��
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
                         * ��checkbox��radio�����⴦����ȡͬname�ĵ�һ��Ԫ��
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
         * ִ����֤
         * @param {Selector | HTMLElement} elements (optional) 
         * Ҫ��֤��Ԫ�أ���ָ������֤����Ԫ��
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
             * ��ÿ����Ҫ��֤��Ԫ�ؽ�����֤
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
         * ������֤���
         */
        reset: function(){ 
            this.successList = [];
            this.errorList = [];
        },
        
        /**
         * ��ȡ��������б�
         * [{element: element, message: message},{... ...}]
         * @return Array
         */
        getInvalid: function(){
            return this.errorList ;
        },
        
        /**
         * �жϱ���֤�Ƿ�ͨ��
         * @return {Boolean}
         */
        isValid: function(){
            return this.errorList.length === 0 ;
        },
        
        /**
         * ������֤����
         * @private
         */
        _check: function(element){
            var self = this ;
            var rules = self.getRules(element), preconditionFailure = false;
            for(method in rules){
                var rule = {method: method, parameters: rules[method]} ;
                try{
                    //ִ����֤
                    var result = self.config.methods[method].call(self, element.value, element, rule.parameters);
                    /**
                     * ǰ���ж�
                     * ǰ��������������ֱ�������ù������֤
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
             * ���й����ǰ��������������ʱ������Ԫ�ص���֤
             */
            //if (preconditionFailure){return;}
            
            //if (objectLength(rules)){
                /**
                 * ȫ��������֤ͨ��
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
         * ��ȡ������Ϣ����İ���Ԫ��
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
         * ���Ԫ�ض�Ӧ�Ĵ�����Ϣ�����ı�������
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
         * ��ȡ��ǰ��������nameƥ���Ԫ��
         * @private
         */
        _findByName: function(name){
            var self = this ;
            return S.filter(document.getElementsByName(name), function(ele){
                return ele.form == self.currentForm && !ele.disabled;
            });
        },
        
        /**
         * ��ȡ�û��Զ���message��Ϣ
         * @private
         */
        _getCustomMessage: function(id, method ) {
            var m = this.config.messages[id];
            return m && (m.constructor == String
                ? m
                : m[method]);
        },
        /**
         * ��ȡ��Ҫ��֤�����б�Ԫ��
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
                     * ���������û�й����Ԫ��Ҳ���˵��Ļ���
                     * ������Ϊ��ʱ������Ѿ���ʾ�˴�����Ϣ���ᵼ�´�����Ϣ�޷����أ�
                     * ��û���뵫�����취ǰ�ݲ�����
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
         * �жϵ�ǰԪ���Ƿ�Ҫ������֤
         * @private
         * TODO �������� b
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
         * ��ȡ�󶨵���ǰԪ���ϵ�������֤����
         * @param {Selector | HTMLElement} ��Ԫ��
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
             * ����������
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
             * ��֤requried��������ǰ��
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
     * ����Ĭ������
     * @param {Object} config ������Ϣ
     * @static
     * @return Validator
     */
    Validator.setDefaults = function(config){
        defaultConfig = S.merge(defaultConfig,config);
        return Validator ;
    }
    
    /**
     * ģ���滻����
     * @param {String} source Ҫ�滻��ģ��
     * @param {Array} params ����
     * @static
     * @return {String} source �滻���ģ��
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
     * ���һ��У���� 
     * @static
     * @return Validator
     */
    Validator.add = function(name, method, message){
        defaultConfig.methods[name] = method;
        defaultConfig.messages[name] = message != undefined ? message : defaultConfig.messages[name];
        return Validator
    }
    
    /**
     * �жϱ�Ԫ���Ƿ��ǿɹ�ѡԪ��
     * @return Boolean
     */
    Validator.checkable = function(element){
        return /radio|checkbox/i.test(element.type);
    }
    
    
    S.augment(Validator, S.EventTarget, false);
    S.Validator = Validator;
});