(function() {
  /**
   * @return {undefined}
   */
  function EventEmitter() {
  }
  /**
   * @param {Array} listeners
   * @param {Function} listener
   * @return {?}
   */
  function indexOfListener(listeners, listener) {
    var i = listeners.length;
    for (;i--;) {
      if (listeners[i].listener === listener) {
        return i;
      }
    }
    return-1;
  }
  var proto = EventEmitter.prototype;
  /**
   * @param {(RegExp|string)} arg
   * @return {?}
   */
  proto.getListeners = function(arg) {
    var ent;
    var p;
    var instance = this._getEvents();
    if ("object" == typeof arg) {
      ent = {};
      for (p in instance) {
        if (instance.hasOwnProperty(p)) {
          if (arg.test(p)) {
            ent[p] = instance[p];
          }
        }
      }
    } else {
      ent = instance[arg] || (instance[arg] = []);
    }
    return ent;
  };
  /**
   * @param {Array} listeners
   * @return {?}
   */
  proto.flattenListeners = function(listeners) {
    var i;
    /** @type {Array} */
    var flatListeners = [];
    /** @type {number} */
    i = 0;
    for (;listeners.length > i;i += 1) {
      flatListeners.push(listeners[i].listener);
    }
    return flatListeners;
  };
  /**
   * @param {string} evt
   * @return {?}
   */
  proto.getListenersAsObject = function(evt) {
    var response;
    var listeners = this.getListeners(evt);
    return listeners instanceof Array && (response = {}, response[evt] = listeners), response || listeners;
  };
  /**
   * @param {string} evt
   * @param {Function} listener
   * @return {?}
   */
  proto.addListener = function(evt, listener) {
    var key;
    var listeners = this.getListenersAsObject(evt);
    /** @type {boolean} */
    var listenerIsWrapped = "object" == typeof listener;
    for (key in listeners) {
      if (listeners.hasOwnProperty(key)) {
        if (-1 === indexOfListener(listeners[key], listener)) {
          listeners[key].push(listenerIsWrapped ? listener : {
            /** @type {Function} */
            listener : listener,
            once : false
          });
        }
      }
    }
    return this;
  };
  /** @type {function (string, Function): ?} */
  proto.on = proto.addListener;
  /**
   * @param {string} evt
   * @param {Function} listener
   * @return {?}
   */
  proto.addOnceListener = function(evt, listener) {
    return this.addListener(evt, {
      /** @type {Function} */
      listener : listener,
      once : true
    });
  };
  /** @type {function (string, Function): ?} */
  proto.once = proto.addOnceListener;
  /**
   * @param {(Node|string)} evt
   * @return {?}
   */
  proto.defineEvent = function(evt) {
    return this.getListeners(evt), this;
  };
  /**
   * @param {Array} evts
   * @return {?}
   */
  proto.defineEvents = function(evts) {
    /** @type {number} */
    var i = 0;
    for (;evts.length > i;i += 1) {
      this.defineEvent(evts[i]);
    }
    return this;
  };
  /**
   * @param {string} evt
   * @param {Function} listener
   * @return {?}
   */
  proto.removeListener = function(evt, listener) {
    var index;
    var key;
    var listeners = this.getListenersAsObject(evt);
    for (key in listeners) {
      if (listeners.hasOwnProperty(key)) {
        index = indexOfListener(listeners[key], listener);
        if (-1 !== index) {
          listeners[key].splice(index, 1);
        }
      }
    }
    return this;
  };
  /** @type {function (string, Function): ?} */
  proto.off = proto.removeListener;
  /**
   * @param {Object} walkers
   * @param {Object} listeners
   * @return {?}
   */
  proto.addListeners = function(walkers, listeners) {
    return this.manipulateListeners(false, walkers, listeners);
  };
  /**
   * @param {Object} walkers
   * @param {Object} listeners
   * @return {?}
   */
  proto.removeListeners = function(walkers, listeners) {
    return this.manipulateListeners(true, walkers, listeners);
  };
  /**
   * @param {boolean} remove
   * @param {Object} obj
   * @param {Array} listeners
   * @return {?}
   */
  proto.manipulateListeners = function(remove, obj, listeners) {
    var i;
    var value;
    var single = remove ? this.removeListener : this.addListener;
    var multiple = remove ? this.removeListeners : this.addListeners;
    if ("object" != typeof obj || obj instanceof RegExp) {
      i = listeners.length;
      for (;i--;) {
        single.call(this, obj, listeners[i]);
      }
    } else {
      for (i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (value = obj[i]) {
            if ("function" == typeof value) {
              single.call(this, i, value);
            } else {
              multiple.call(this, i, value);
            }
          }
        }
      }
    }
    return this;
  };
  /**
   * @param {RegExp} evt
   * @return {?}
   */
  proto.removeEvent = function(evt) {
    var key;
    /** @type {string} */
    var type = typeof evt;
    var events = this._getEvents();
    if ("string" === type) {
      delete events[evt];
    } else {
      if ("object" === type) {
        for (key in events) {
          if (events.hasOwnProperty(key)) {
            if (evt.test(key)) {
              delete events[key];
            }
          }
        }
      } else {
        delete this._events;
      }
    }
    return this;
  };
  /**
   * @param {string} evt
   * @param {Array} args
   * @return {?}
   */
  proto.emitEvent = function(evt, args) {
    var listener;
    var i;
    var fileName;
    var response;
    var files = this.getListenersAsObject(evt);
    for (fileName in files) {
      if (files.hasOwnProperty(fileName)) {
        i = files[fileName].length;
        for (;i--;) {
          listener = files[fileName][i];
          response = listener.listener.apply(this, args || []);
          if (response === this._getOnceReturnValue() || listener.once === true) {
            this.removeListener(evt, files[fileName][i].listener);
          }
        }
      }
    }
    return this;
  };
  /** @type {function (string, Array): ?} */
  proto.trigger = proto.emitEvent;
  /**
   * @param {string} evt
   * @return {?}
   */
  proto.emit = function(evt) {
    /** @type {Array.<?>} */
    var args = Array.prototype.slice.call(arguments, 1);
    return this.emitEvent(evt, args);
  };
  /**
   * @param {?} value
   * @return {?}
   */
  proto.setOnceReturnValue = function(value) {
    return this._onceReturnValue = value, this;
  };
  /**
   * @return {?}
   */
  proto._getOnceReturnValue = function() {
    return this.hasOwnProperty("_onceReturnValue") ? this._onceReturnValue : true;
  };
  /**
   * @return {?}
   */
  proto._getEvents = function() {
    return this._events || (this._events = {});
  };
  if ("function" == typeof define && define.amd) {
    define(function() {
      return EventEmitter;
    });
  } else {
    if ("undefined" != typeof module && module.exports) {
      /** @type {function (): undefined} */
      module.exports = EventEmitter;
    } else {
      /** @type {function (): undefined} */
      this.EventEmitter = EventEmitter;
    }
  }
}).call(this), function(spec) {
  /** @type {Element} */
  var docElem = document.documentElement;
  /**
   * @return {undefined}
   */
  var bind = function() {
  };
  if (docElem.addEventListener) {
    /**
     * @param {HTMLElement} obj
     * @param {string} type
     * @param {?} fn
     * @return {undefined}
     */
    bind = function(obj, type, fn) {
      obj.addEventListener(type, fn, false);
    };
  } else {
    if (docElem.attachEvent) {
      /**
       * @param {HTMLElement} obj
       * @param {string} type
       * @param {Function} fn
       * @return {undefined}
       */
      bind = function(obj, type, fn) {
        /** @type {function (): undefined} */
        obj[type + fn] = fn.handleEvent ? function() {
          var event = spec.event;
          event.target = event.target || event.srcElement;
          fn.handleEvent.call(fn, event);
        } : function() {
          var event = spec.event;
          event.target = event.target || event.srcElement;
          fn.call(obj, event);
        };
        obj.attachEvent("on" + type, obj[type + fn]);
      };
    }
  }
  /**
   * @return {undefined}
   */
  var unbind = function() {
  };
  if (docElem.removeEventListener) {
    /**
     * @param {?} el
     * @param {string} type
     * @param {?} fn
     * @return {undefined}
     */
    unbind = function(el, type, fn) {
      el.removeEventListener(type, fn, false);
    };
  } else {
    if (docElem.detachEvent) {
      /**
       * @param {?} obj
       * @param {string} type
       * @param {string} fn
       * @return {undefined}
       */
      unbind = function(obj, type, fn) {
        obj.detachEvent("on" + type, obj[type + fn]);
        try {
          delete obj[type + fn];
        } catch (i) {
          obj[type + fn] = void 0;
        }
      };
    }
  }
  var eventie = {
    /** @type {function (): undefined} */
    bind : bind,
    /** @type {function (): undefined} */
    unbind : unbind
  };
  if ("function" == typeof define && define.amd) {
    define(eventie);
  } else {
    spec.eventie = eventie;
  }
}(this), function(root) {
  /**
   * @param {Object} a
   * @param {Object} b
   * @return {?}
   */
  function extend(a, b) {
    var prop;
    for (prop in b) {
      a[prop] = b[prop];
    }
    return a;
  }
  /**
   * @param {Array} it
   * @return {?}
   */
  function isArray(it) {
    return "[object Array]" === ostring.call(it);
  }
  /**
   * @param {Array} a
   * @return {?}
   */
  function makeArray(a) {
    /** @type {Array} */
    var r = [];
    if (isArray(a)) {
      /** @type {Array} */
      r = a;
    } else {
      if ("number" == typeof a.length) {
        /** @type {number} */
        var j = 0;
        /** @type {number} */
        var al = a.length;
        for (;al > j;j++) {
          r.push(a[j]);
        }
      } else {
        r.push(a);
      }
    }
    return r;
  }
  /**
   * @param {?} EventEmitter
   * @param {(Object|string)} eventie
   * @return {?}
   */
  function defineImagesLoaded(EventEmitter, eventie) {
    /**
     * @param {?} elem
     * @param {?} options
     * @param {?} onAlways
     * @return {?}
     */
    function ImagesLoaded(elem, options, onAlways) {
      if (!(this instanceof ImagesLoaded)) {
        return new ImagesLoaded(elem, options);
      }
      if ("string" == typeof elem) {
        /** @type {NodeList} */
        elem = document.querySelectorAll(elem);
      }
      this.elements = makeArray(elem);
      this.options = extend({}, this.options);
      if ("function" == typeof options) {
        /** @type {Function} */
        onAlways = options;
      } else {
        extend(this.options, options);
      }
      if (onAlways) {
        this.on("always", onAlways);
      }
      this.getImages();
      if ($) {
        this.jqDeferred = new $.Deferred;
      }
      var engineTools = this;
      setTimeout(function() {
        engineTools.check();
      });
    }
    /**
     * @param {Image} img
     * @return {undefined}
     */
    function LoadingImage(img) {
      /** @type {Image} */
      this.img = img;
    }
    ImagesLoaded.prototype = new EventEmitter;
    ImagesLoaded.prototype.options = {};
    /**
     * @return {undefined}
     */
    ImagesLoaded.prototype.getImages = function() {
      /** @type {Array} */
      this.images = [];
      /** @type {number} */
      var i = 0;
      var l = this.elements.length;
      for (;l > i;i++) {
        var node = this.elements[i];
        if ("IMG" === node.nodeName) {
          this.addImage(node);
        }
        var imgs = node.querySelectorAll("img");
        /** @type {number} */
        var src = 0;
        var imgsLen = imgs.length;
        for (;imgsLen > src;src++) {
          var img = imgs[src];
          this.addImage(img);
        }
      }
    };
    /**
     * @param {?} img
     * @return {undefined}
     */
    ImagesLoaded.prototype.addImage = function(img) {
      var loadingImage = new LoadingImage(img);
      this.images.push(loadingImage);
    };
    /**
     * @return {?}
     */
    ImagesLoaded.prototype.check = function() {
      /**
       * @param {?} image
       * @param {?} message
       * @return {?}
       */
      function onConfirm(image, message) {
        return _this.options.debug && (tab && console.log("confirm", image, message)), _this.progress(image), out++, out === a && _this.complete(), true;
      }
      var _this = this;
      /** @type {number} */
      var out = 0;
      var a = this.images.length;
      if (this.hasAnyBroken = false, !a) {
        return this.complete(), void 0;
      }
      /** @type {number} */
      var i = 0;
      for (;a > i;i++) {
        var loadingImage = this.images[i];
        loadingImage.on("confirm", onConfirm);
        loadingImage.check();
      }
    };
    /**
     * @param {?} image
     * @return {undefined}
     */
    ImagesLoaded.prototype.progress = function(image) {
      this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
      var _this = this;
      setTimeout(function() {
        _this.emit("progress", _this, image);
        if (_this.jqDeferred) {
          _this.jqDeferred.notify(_this, image);
        }
      });
    };
    /**
     * @return {undefined}
     */
    ImagesLoaded.prototype.complete = function() {
      /** @type {string} */
      var eventName = this.hasAnyBroken ? "fail" : "done";
      /** @type {boolean} */
      this.isComplete = true;
      var _this = this;
      setTimeout(function() {
        if (_this.emit(eventName, _this), _this.emit("always", _this), _this.jqDeferred) {
          /** @type {string} */
          var jqMethod = _this.hasAnyBroken ? "reject" : "resolve";
          _this.jqDeferred[jqMethod](_this);
        }
      });
    };
    if ($) {
      /**
       * @param {Array} options
       * @param {boolean} callback
       * @return {?}
       */
      $.fn.imagesLoaded = function(options, callback) {
        var instance = new ImagesLoaded(this, options, callback);
        return instance.jqDeferred.promise($(this));
      };
    }
    var cache = {};
    return LoadingImage.prototype = new EventEmitter, LoadingImage.prototype.check = function() {
      var cached = cache[this.img.src];
      if (cached) {
        return this.useCached(cached), void 0;
      }
      if (cache[this.img.src] = this, this.img.complete && void 0 !== this.img.naturalWidth) {
        return this.confirm(0 !== this.img.naturalWidth, "naturalWidth"), void 0;
      }
      /** @type {Image} */
      var proxyImage = this.proxyImage = new Image;
      eventie.bind(proxyImage, "load", this);
      eventie.bind(proxyImage, "error", this);
      proxyImage.src = this.img.src;
    }, LoadingImage.prototype.useCached = function(cached) {
      if (cached.isConfirmed) {
        this.confirm(cached.isLoaded, "cached was confirmed");
      } else {
        var _this = this;
        cached.on("confirm", function(image) {
          return _this.confirm(image.isLoaded, "cache emitted confirmed"), true;
        });
      }
    }, LoadingImage.prototype.confirm = function(isLoaded, message) {
      /** @type {boolean} */
      this.isConfirmed = true;
      /** @type {boolean} */
      this.isLoaded = isLoaded;
      this.emit("confirm", this, message);
    }, LoadingImage.prototype.handleEvent = function(event) {
      /** @type {string} */
      var method = "on" + event.type;
      if (this[method]) {
        this[method](event);
      }
    }, LoadingImage.prototype.onload = function() {
      this.confirm(true, "onload");
      this.unbindProxyEvents();
    }, LoadingImage.prototype.onerror = function() {
      this.confirm(false, "onerror");
      this.unbindProxyEvents();
    }, LoadingImage.prototype.unbindProxyEvents = function() {
      eventie.unbind(this.proxyImage, "load", this);
      eventie.unbind(this.proxyImage, "error", this);
    }, ImagesLoaded;
  }
  var $ = root.jQuery;
  /** @type {(Console|null)} */
  var console = root.console;
  /** @type {boolean} */
  var tab = console !== void 0;
  /** @type {function (this:*): string} */
  var ostring = Object.prototype.toString;
  if ("function" == typeof define && define.amd) {
    define(["eventEmitter/EventEmitter", "eventie/eventie"], defineImagesLoaded);
  } else {
    root.imagesLoaded = defineImagesLoaded(root.EventEmitter, root.eventie);
  }
}(window);
eval(function(s, opt_attributes, key, pairs, filter, params) {
  /**
   * @param {number} event
   * @return {?}
   */
  filter = function(event) {
    return event;
  };
  if (!"".replace(/^/, String)) {
    for (;key--;) {
      /** @type {(number|string)} */
      params[key] = pairs[key] || key;
    }
    /** @type {Array} */
    pairs = [function(urlParam) {
      return params[urlParam];
    }];
    /**
     * @return {?}
     */
    filter = function() {
      return "\\w+";
    };
    /** @type {number} */
    key = 1;
  }
  for (;key--;) {
    if (pairs[key]) {
      /** @type {string} */
      s = s.replace(new RegExp("\\b" + filter(key) + "\\b", "g"), pairs[key]);
    }
  }
  return s;
}("(6(84){11(55 90==='6'&&90.133)90(['132'],84);54 84(131)}(6($){32 12,91,17;17=6(82,104){25 6(){25 82.81(104,135)}};91={64:'114',105:63,86:45,23:$('138'),61:53,97:30,13:0,117:63,19:0,8:2,41:0,72:53,137:[],108:50,43:53};32 102=56.130||6(103){103()},$56=$(56);6 80(20){102(6(){32 4,9;33(4=0;4<20.15;4++){9=20[4];9.78.22(9.22)}})}6 126(101){25 $.129(101).127()}12=(6(){6 12(35,38){3.35=35;3.7=3.79=3.74=45;3.77=0;3.47=30;3.46=[];$.99(30,3,91,38);3.43=3.43||3.8;3.75=17(3.75,3);3.59=17(3.59,3);3.49=17(3.49,3);3.70=17(3.70,3);3.44=17(3.44,3);3.65=17(3.65,3);3.73=17(3.73,3);3.76=17(3.76,3);3.60=17(3.60,3);3.71=17(3.71,3);3.67=17(3.67,3);11(3.105)$56.106('119.24',3.59);3.23.106('110',3.49)}12.21.75=6(38){3.47=30;$.99(30,3,38)};12.21.59=6(){112(3.74);3.47=3.19!==0;3.74=136(3.44,3.108)};12.21.49=6(){3.47=30;3.44()};12.21.71=6(14,29){32 4=3.46.15,$37,$51,83=3.7.15,27,28,26,66,107=3.23.152();33(;4<83;4++){$37=$('<140 151=\"24-37\"/>').150(3.23);3.46.52($37)}66=3.8+153(3.46[0].22('154'),10)*2;33(4=0;4<3.46.15;4++){$37=3.46[4];27=3.7[4];11(4>=83||!27[27.15-1]){$37.22('93','92')}54{$51=27[27.15-1];11(!$51)149;26=$51.20('24-26')+$51.20('24-28')+3.43;28=107-26-66;$37.22({123:'113',93:28>0?'143':'92',89:4*14+29,26:26,69:14-66,28:28})}}};12.21.60=6(){25 3.97?3.35.142('.141'):3.35};12.21.70=6(){32 13=3.13,34=3.23.69()-2*3.41,111=3.35.115(0),19=3.19;11(3.13===53||3.13===0&&!3.19){13=111.145()}54 11(55 3.13=='98'&&3.13.96('%')>=0){13=95(3.13)/100*34}11(19){11(55 19=='98'&&19.96('%')>=0){19=95(19)/100*34}32 88=(34+3.8),109=~~(0.5+88/(19+3.8)),118=~~(88/(13+3.8)),7=31.58(109,118),14=31.116(19,~~((34-(7-1)*3.8)/7));13=31.58(13,14);3.35.22('69',13)}25 13};12.21.44=6(122){11(!3.23.146(':147'))25;32 14=3.70()+3.8,79=3.23.69(),34=79-2*3.41,7=~~((34+3.8)/14),8=0,68=0,4=0,36=3.60(),57=36.15,$9;11(3.47||!3.23.20('124')){33(;4<57;4++){$9=36.115(4);$9.20('24-28',$9.148())}3.47=63;3.23.20('124',30)}7=31.58(1,31.116(7,57));8=3.41;11(3.64=='114'){8+=~~(0.5+(34-(7*14-3.8))>>1)}3.61=3.61||(3.64=='120'?'120':'89');11(!122&&3.7!==45&&3.7.15==7&&3.77==57){68=3.73(14,8)}54{68=3.65(14,7,8)}3.77=57;3.23.22('28',68);11(3.117){3.71(14,8)}11(3.72!==53&&55 3.72==='6'){3.72()}};12.21.67=6(87){25 55(3.86)==='6'?87.139(3.86):87};12.21.65=6(14,7,8){32 $9,4=0,18=0,36=$.134(3.60()),15=36.15,40=45,39=45,29,16=[],42=[],121=3.64=='89'?30:63;3.7=[];36=3.67(36);144(16.15<7){16.52(3.41);3.7.52([])}33(;4<15;4++){$9=$(36[4]);40=16[0];39=0;33(18=0;18<7;18++){11(16[18]<40){40=16[18];39=18}}$9.20('24-26',40);29=8;11(39>0||!121)29+=39*14;(42[4]={78:$9,22:{123:'113',26:40}}).22[3.61]=29;16[39]+=$9.20('24-28')+3.43;3.7[39].52($9)}80(42);25 31.58.81(31,16)};12.21.73=6(14,8){32 16=[],42=[],4=0,18=0,85=0,48,27,$9,125,29;33(;4<3.7.15;4++){16.52(3.41);27=3.7[4];29=4*14+8;48=16[4];33(18=0;18<27.15;18++,85++){$9=27[18].20('24-26',48);(42[85]={78:$9,22:{26:48}}).22[3.61]=29;48+=$9.20('24-28')+3.43}16[4]=48}80(42);25 31.58.81(31,16)};12.21.76=6(){112(3.74);$56.94('119.24',3.59);3.23.94('110',3.49);3.35.62=45};25 12})();$.82.24=6(38){11(!3.62){3.62=155 12(3,38||{})}54{3.62.75(38||{})}3.62.44(30);25 3.128()}}));",
10, 156, "|||this|i||function|columns|offset|item||if|Wookmark|itemWidth|columnWidth|length|heights|__bind|k|flexibleWidth|data|prototype|css|container|wookmark|return|top|column|height|sideOffset|true|Math|var|for|innerWidth|handler|activeItems|placeholder|options|shortestIndex|shortest|outerOffset|itemBulkCSS|verticalOffset|layout|null|placeholders|itemHeightsDirty|currentHeight|onRefresh||lastColumnItem|push|undefined|else|typeof|window|activeItemsLength|max|onResize|getActiveItems|direction|wookmarkInstance|false|align|layoutFull|innerOffset|sortElements|maxHeight|width|getItemWidth|refreshPlaceholders|onLayoutChanged|layoutColumns|resizeTimer|update|clear|activeItemCount|obj|containerWidth|bulkUpdateCSS|apply|fn|columnsLength|factory|j|comparator|elements|paddedInnerWidth|left|define|defaultOptions|none|display|unbind|parseFloat|indexOf|ignoreInactiveItems|string|extend||filterName|executeNextFrame|callback|me|autoResize|bind|containerHeight|resizeDelay|flexibleColumns|refreshWookmark|firstElement|clearTimeout|absolute|center|eq|min|fillEmptySpace|fixedColumns|resize|right|leftAligned|force|position|itemHeightsInitialized|itemData|cleanFilterName|toLowerCase|show|trim|requestAnimationFrame|jQuery|jquery|amd|makeArray|arguments|setTimeout|possibleFilters|body|sort|div|inactive|not|block|while|outerWidth|is|visible|outerHeight|continue|appendTo|class|innerHeight|parseInt|borderLeftWidth|new".split("|"),
0, {}));
eval(function(s, opt_attributes, key, pairs, filter, params) {
  /**
   * @param {number} event
   * @return {?}
   */
  filter = function(event) {
    return event;
  };
  if (!"".replace(/^/, String)) {
    for (;key--;) {
      /** @type {(number|string)} */
      params[key] = pairs[key] || key;
    }
    /** @type {Array} */
    pairs = [function(urlParam) {
      return params[urlParam];
    }];
    /**
     * @return {?}
     */
    filter = function() {
      return "\\w+";
    };
    /** @type {number} */
    key = 1;
  }
  for (;key--;) {
    if (pairs[key]) {
      /** @type {string} */
      s = s.replace(new RegExp("\\b" + filter(key) + "\\b", "g"), pairs[key]);
    }
  }
  return s;
}(";(9(178){5(179 264==='9'&&264.375){264(['290'],178)}19 5(179 378==='383'){178(381('290'))}19{178(107.273||107.360)}}(9($){11 125='353',272='369',299='363',296='366',187='412',194='410',251='409',174='4',48='.'+174,181='4-120',221='4-398',173='4-392-51';11 4,145=9(){},208=!!(107.273),184,89=$(107),61,146,91,263;11 42=9(147,287){4.130.41(174+147+48,287)},57=9(171,104,77,284){11 12=45.166('33');12.171='4-'+171;5(77){12.397=77}5(!284){12=$(12);5(104){12.104(104)}}19 5(104){104.285(12)}18 12},32=9(24,20){4.130.388(174+24,20);5(4.13.269){24=24.212(0).399()+24.167(1);5(4.13.269[24]){4.13.269[24].355(4,$.323(20)?20:[20])}}},191=9(23){5(23!==263||!4.38.140){4.38.140=$(4.13.311.64('%53%',4.13.351));263=23}18 4.38.140},161=9(){5(!$.30.119){4=401 145();4.201();$.30.119=4}},336=9(){11 93=45.166('151').227,152=['368','370','379','377'];5(93['371']!==115){18 14}389(152.29){5(152.386()+'391'354 93){18 14}}18 25};145.234={390:145,201:9(){11 109=325.109;4.95=109.254(\"326 7.\")!==-1;4.266=109.254(\"326 8.\")!==-1;4.162=4.95||4.266;4.335=(/411/87).245(109);4.198=(/400|365|367/87).245(109);4.319=336();4.322=(4.335||4.198||/(339 382)|374|376|384|(339 372)|(380 403)|385/28.245(325.405));61=$(45);4.158={}},135:9(20){11 28;5(20.148===25){4.22=20.22.406();4.15=0;11 22=20.22,6;143(28=0;28<22.29;28++){6=22[28];5(6.182){6=6.12[0]}5(6===20.12[0]){4.15=28;292}}}19{4.22=$.323(20.22)?20.22:[20.22];4.15=20.15||0}5(4.114){4.123();18}4.81=[];91='';5(20.177&&20.177.29){4.130=20.177.238(0)}19{4.130=61}5(20.71){5(!4.158[20.71]){4.158[20.71]={}}4.38=4.158[20.71]}19{4.38={}}4.13=$.133(14,{},$.30.139,20);4.69=4.13.69==='111'?!4.322:4.13.69;5(4.13.320){4.13.150=25;4.13.229=25;4.13.137=25;4.13.230=25}5(!4.74){4.74=57('302').41('99'+48,9(){4.51()});4.31=57('31').44('387',-1).41('99'+48,9(24){5(4.315(24.67)){4.51()}});4.54=57('54',4.31)}4.190=57('35');5(4.13.80){4.80=57('80',4.54,4.13.243)}11 117=$.30.117;143(28=0;28<117.29;28++){11 127=117[28];127=127.212(0).303()+127.167(1);4['201'+127].134(4)}32('396');5(4.13.137){5(!4.13.156){4.31.168(191())}19{42(187,9(24,34,78,6){78.393=191(6.23)});91+=' 4-51-394-354'}}5(4.13.278){91+=' 4-407-164'}5(4.69){4.31.49({121:4.13.149,364:'219',149:4.13.149})}19{4.31.49({164:89.408(),226:'224'})}5(4.13.241===25||(4.13.241==='111'&&!4.69)){4.74.49({52:61.52(),226:'224'})}5(4.13.230){61.41('295'+48,9(24){5(24.265===27){4.51()}})}89.41('344'+48,9(){4.204()});5(!4.13.150){91+=' 4-111-122'}5(91)4.31.55(91);11 233=4.144=89.52();11 96={};5(4.69){5(4.318(233)){11 93=4.310();5(93){96.294=93}}}5(4.69){5(!4.95){96.121='219'}19{$('90, 77').49('121','219')}}11 169=4.13.155;5(4.95){169+=' 4-402'}5(169){4.186(169)}4.123();32('317');$('77').49(96);4.74.209(4.31).239(4.13.239||$(45.90));4.205=45.395;165(9(){5(4.35){4.186(181);4.220()}19{4.74.55(181)}61.41('293'+48,4.312)},16);4.114=14;4.204(233);32(194);18 20},51:9(){5(!4.114)18;32(272);4.114=25;5(4.13.240&&!4.162&&4.319){4.186(221);165(9(){4.218()},4.13.240)}19{4.218()}},218:9(){32(125);11 213=221+' '+181+' ';4.74.98();4.31.98();4.54.404();5(4.13.155){213+=4.13.155+' '}4.316(213);5(4.69){11 96={294:''};5(4.95){$('90, 77').49('121','')}19{96.121=''}$('77').49(96)}61.63('295'+48+' 293'+48);4.130.63(48);4.31.44('36','4-31').361('227');4.74.44('36','4-302');4.54.44('36','4-54');5(4.13.137&&(!4.13.156||4.38[4.66.23]===14)){5(4.38.140)4.38.140.98()}5(4.205){$(4.205).132()}4.66=76;4.35=76;4.38=76;4.373=0;32(299)},204:9(176){5(4.198){11 300=45.425.279/107.473;11 52=107.472*300;4.31.49('52',52);4.144=52}19{4.144=176||89.52()}5(!4.69){4.31.49('52',4.144)}32('345')},123:9(){11 6=4.22[4.15];4.190.98();5(4.35)4.35.98();5(!6.182){6=4.231(4.15)}11 23=6.23;32('277',[4.66?4.66.23:'',23]);4.66=6;5(!4.38[23]){11 56=4.13[23]?4.13[23].56:25;32('471',56);5(56){4.38[23]=$(56)}19{4.38[23]=14}}5(146&&146!==6.23){4.54.94('4-'+146+'-291')}11 106=4['470'+23.212(0).303()+23.167(1)](6,4.38[23]);4.297(106,23);6.253=14;32(251,6);146=6.23;4.54.474(4.190);32('341')},297:9(106,23){4.35=106;5(106){5(4.13.137&&4.13.156&&4.38[23]===14){5(!4.35.58('.4-51').29){4.35.168(191())}}19{4.35=106}}19{4.35=''}32(296);4.54.55('4-'+23+'-291');4.190.168(4.35)},231:9(15){11 6=4.22[15],23;5(6.330){6={12:$(6)}}19{23=6.23;6={20:6,26:6.26}}5(6.12){11 81=4.81;143(11 28=0;28<81.29;28++){5(6.12.244('4-'+81[28])){23=81[28];292}}6.26=6.12.44('20-4-26');5(!6.26){6.26=6.12.44('334')}}6.23=23||4.13.23||'199';6.15=15;6.182=14;4.22[15]=6;32('475',6);18 4.22[15]},348:9(12,17){11 175=9(24){24.232=46;4.237(24,12,17)};5(!17){17={}}11 70='99.30';17.177=12;5(17.22){17.148=14;12.63(70).41(70,175)}19{17.148=25;5(17.112){12.63(70).41(70,17.112,175)}19{17.22=12;12.63(70).41(70,175)}}},237:9(24,12,17){11 116=17.116!==115?17.116:$.30.139.116;5(!116&&(24.479===2||24.478||24.477)){18}11 79=17.79!==115?17.79:$.30.139.79;5(79){5($.321(79)){5(!79.134(4)){18 14}}19{5(89.260()<79){18 14}}}5(24.23){24.476();5(4.114){24.469()}}17.12=$(24.232);5(17.112){17.22=12.58(17.112)}4.135(17)},65:9(75,47){5(4.80){5(184!==75){4.54.94('4-93-'+184)}5(!47&&75==='101'){47=4.13.243}11 20={75:75,47:47};32('304',20);75=20.75;47=20.47;4.80.77(47);4.80.58('136').41('99',9(24){24.468()});4.54.55('4-93-'+75);184=75}},315:9(67){5($(67).244(173)){18}11 236=4.13.150;11 235=4.13.229;5(236&&235){18 14}19{5(!4.35||$(67).244('4-51')||(4.80&&67===4.80[0])){18 14}5((67!==4.35[0]&&!$.242(4.35[0],67))){5(235){5($.242(45,67)){18 14}}}19 5(236){18 14}}18 25},186:9(105){4.74.55(105);4.31.55(105)},316:9(105){46.74.94(105);4.31.94(105)},318:9(176){18((4.95?61.52():45.90.460)>(176||89.52()))},220:9(){(4.13.132?4.35.58(4.13.132).238(0):4.31).132()},312:9(24){5(24.67!==4.31[0]&&!$.242(4.31[0],24.67)){4.220();18 25}},185:9(34,78,6){11 108;5(6.20){78=$.133(6.20,78)}32(187,[34,78,6]);$.308(78,9(71,84){5(84===115||84===25){18 14}108=71.459('457');5(108.29>1){11 12=34.58(48+'-'+108[0]);5(12.29>0){11 44=108[1];5(44==='216'){5(12[0]!==84[0]){12.216(84)}}19 5(44==='21'){5(12.328('21')){12.44('26',84)}19{12.216('<21 26=\"'+84+'\" 36=\"'+12.44('36')+'\" />')}}19{12.44(108[1],84)}}}19{34.58(48+'-'+71).77(84)}})},310:9(){5(4.225===115){11 118=45.166(\"33\");118.227.458='260: 275; 52: 275; 121: 462; 226: 224; 164: -463;';45.90.285(118);4.225=118.467-118.279;45.90.466(118)}18 4.225}};$.30={119:76,103:145.234,117:[],135:9(17,15){161();5(!17){17={}}19{17=$.133(14,{},17)}17.148=14;17.15=15||0;18 46.119.135(17)},51:9(){18 $.30.119&&$.30.119.51()},129:9(147,154){5(154.17){$.30.139[147]=154.17}$.133(46.103,154.103);46.117.193(147)},139:{79:0,71:76,116:25,155:'',80:14,132:'',150:25,229:14,156:14,137:14,230:14,320:25,278:25,240:0,239:76,69:'111',241:'111',149:'111',311:'<110 53=\"%53%\" 23=\"110\" 36=\"4-51\">&481;</110>',351:'353 (413)',243:'464...'}};$.301.30=9(17){161();11 72=$(46);5(179 17===\"307\"){5(17==='135'){11 22,113=208?72.20('30'):72[0].30,15=202(359[1],10)||0;5(113.22){22=113.22[15]}19{22=72;5(113.112){22=22.58(113.112)}22=22.238(15)}4.237({232:22},72,113)}19{5(4.114)4[17].355(4,480.234.167.134(359,1))}}19{17=$.133(14,{},17);5(208){72.20('30',17)}19{72[0].30=17}4.348(72,17)}18 72};11 172='199',102,131,128,197=9(){5(128){131.332(128.55(102)).98();128=76}};$.30.129(172,{17:{331:'495',56:'',347:'492 342 493'},103:{494:9(){4.81.193(172);42(125+'.'+172,9(){197()})},490:9(6,34){197();5(6.26){11 211=4.13.199,12=$(6.26);5(12.29){11 206=12[0].484;5(206&&206.330){5(!131){102=211.331;131=57(102);102='4-'+102}128=12.332(131).98().94(102)}4.65('120')}19{4.65('141',211.347);12=$('<33>')}6.491=12;18 12}4.65('120');4.185(34,{},6);18 34}}});11 73,346=9(6){5(6.20&&6.20.53!==115)18 6.20.53;11 26=4.13.68.333;5(26){5($.321(26)){18 26.134(4,6)}19 5(6.12){18 6.12.44(26)||''}}18''};$.30.129('68',{17:{56:'<33 36=\"4-203\">'+'<33 36=\"4-51\"></33>'+'<203>'+'<33 36=\"4-21\"></33>'+'<324>'+'<33 36=\"4-338-485\">'+'<33 36=\"4-53\"></33>'+'<33 36=\"4-85\"></33>'+'</33>'+'</324>'+'</203>'+'</33>',122:'4-486-489-488',333:'53',340:14,261:'<136 334=\"%270%\">487 68</136> 465 342 455 258.'},103:{428:9(){11 92=4.13.68,43='.68';4.81.193('68');42(194+43,9(){5(4.66.23==='68'&&92.122){$(45.90).55(92.122)}});42(125+43,9(){5(92.122){$(45.90).94(92.122)}89.63('344'+48)});42('345'+43,4.170);5(4.162){42('341',4.170)}},170:9(){11 6=4.66;5(!6||!6.21)18;5(4.13.68.340){11 222=0;5(4.162){222=202(6.21.49('337-164'),10)+202(6.21.49('337-338'),10)}6.21.49('427-52',4.144-222)}},160:9(6){5(6.21){6.83=14;5(73){157(73)}6.426=25;32('456',6);5(6.271){5(4.35)4.35.94('4-101');6.271=25}}},356:9(6){11 85=0,21=6.21[0],142=9(343){5(73){157(73)}73=429(9(){5(21.329>0){4.160(6);18}5(85>200){157(73)}85++;5(85===3){142(10)}19 5(85===40){142(50)}19 5(85===100){142(430)}},343)};142(1)},433:9(6,34){11 259=0,255=9(){5(6){5(6.21[0].432){6.21.63('.124');5(6===4.66){4.160(6);4.65('120')}6.83=14;6.258=14;32('431')}19{259++;5(259<200){165(255,100)}19{249()}}}},249=9(){5(6){6.21.63('.124');5(6===4.66){4.160(6);4.65('141',92.261.64('%270%',6.26))}6.83=14;6.258=14;6.210=14}},92=4.13.68;11 12=34.58('.4-21');5(12.29){11 21=45.166('21');21.171='4-21';5(6.12&&6.12.58('21').29){21.327=6.12.58('21').44('327')}6.21=$(21).41('305.124',255).41('141.124',249);21.26=6.26;5(12.328('21')){6.21=6.21.424()}21=6.21[0];5(21.329>0){6.83=14}19 5(!21.260){6.83=25}}4.185(34,{53:346(6),423:6.21},6);4.170();5(6.83){5(73)157(73);5(6.210){34.55('4-101');4.65('141',92.261.64('%270%',6.26))}19{34.94('4-101');4.65('120')}18 34}4.65('101');6.101=14;5(!6.83){6.271=14;34.55('4-101');4.356(6)}18 34}}});11 86='97',358='//288:283',192=9(267){5(4.38[86]){11 12=4.38[86].58('97');5(12.29){5(!267){12[0].26=358}5(4.266){12.49('415',267?'414':'418')}}}};$.30.129(86,{17:{56:'<33 36=\"4-97-419\">'+'<33 36=\"4-51\"></33>'+'<97 36=\"4-97\" 26=\"//288:283\" 422=\"0\" 421></97>'+'</33>',248:'420',306:{252:{15:'252.153',60:'152=',26:'//434.252.153/276/%60%?280=1'},262:{15:'262.153/',60:'/',26:'//435.262.153/449/%60%?280=1'},448:{15:'//447.450.',26:'%60%&451=276'}}},103:{454:9(){4.81.193(86);42('277',9(24,256,257){5(256!==257){5(256===86){192()}19 5(257===86){192(14)}}});42(125+'.'+86,9(){192()})},452:9(6,34){11 59=6.26;11 188=4.13.97;$.308(188.306,9(){5(59.254(46.15)>-1){5(46.60){5(179 46.60==='307'){59=59.446(59.445(46.60)+46.60.29,59.29)}19{59=46.60.134(46,59)}}59=46.26.64('%60%',59);18 25}});11 246={};5(188.248){246[188.248]=59}4.185(34,246,6);4.65('120');18 34}}});11 180=9(15){11 183=4.22.29;5(15>183-1){18 15-183}19 5(15<0){18 183+15}18 15},250=9(47,195,196){18 47.64(/%195%/87,195+1).64(/%196%/87,196)};$.30.129('138',{17:{298:25,309:'<110 53=\"%53%\" 23=\"110\" 36=\"4-189 4-189-%268%\"></110>',274:[0,2],357:14,313:14,289:'438 (437 189 71)',281:'436 (440 189 71)',314:'%195% 441 %196%'},103:{444:9(){11 82=4.13.138,43='.4-138',207=443($.301.352);4.126=14;5(!82||!82.298)18 25;91+=' 4-138';42(194+43,9(){5(82.357){4.31.41('99'+43,'.4-21',9(){5(4.22.29>1){4.159();18 25}})}61.41('442'+43,9(24){5(24.265===37){4.214()}19 5(24.265===39){4.159()}})});42('304'+43,9(24,20){5(20.47){20.47=250(20.47,4.66.15,4.22.29)}});42(187+43,9(24,439,78,6){11 247=4.22.29;78.85=247>1?250(82.314,6.15,247):''});42('317'+43,9(){5(4.22.29>1&&82.313&&!4.62){11 56=82.309,62=4.62=$(56.64(/%53%/87,82.289).64(/%268%/87,'453')).55(173),88=4.88=$(56.64(/%53%/87,82.281).64(/%268%/87,'416')).55(173);11 70=207?'352':'99';62[70](9(){4.214()});88[70](9(){4.159()});5(4.95){57('350',62[0],25,14);57('136',62[0],25,14);57('350',88[0],25,14);57('136',88[0],25,14)}4.54.168(62.209(88))}});42(251+43,9(){5(4.163)417(4.163);4.163=165(9(){4.349();4.163=76},16)});42(125+43,9(){61.63(43);4.31.63('99'+43);5(4.62&&207){4.62.209(4.88).482()}4.88=4.62=76})},159:9(){4.126=14;4.15=180(4.15+1);4.123()},214:9(){4.126=25;4.15=180(4.15-1);4.123()},483:9(215){4.126=(215>=4.15);4.15=215;4.123()},349:9(){11 151=4.13.138.274,228=282.286(151[0],4.22.29),223=282.286(151[1],4.22.29),28;143(28=1;28<=(4.126?223:228);28++){4.217(4.15+28)}143(28=1;28<=(4.126?228:223);28++){4.217(4.15-28)}},217:9(15){15=180(15);5(4.22[15].253){18}11 6=4.22[15];5(!6.182){6=4.231(15)}32('461',6);5(6.23==='68'){6.21=$('<21 36=\"4-21\" />').41('305.124',9(){6.83=14}).41('141.124',9(){6.83=14;6.210=14;32('362',6)}).44('26',6.26)}6.253=14}}});161()}));",
10, 496, "||||mfp|if|item|||function||var|el|st|true|index||options|return|else|data|img|items|type|e|false|src||i|length|magnificPopup|wrap|_mfpTrigger|div|template|content|class||currTemplate|||on|_mfpOn|ns|attr|document|this|text|EVENT_NS|css||close|height|title|container|addClass|markup|_getEl|find|embedSrc|id|_document|arrowLeft|off|replace|updateStatus|currItem|target|image|fixedContentPos|eName|key|jqEl|_imgInterval|bgOverlay|status|null|html|values|disableOn|preloader|types|gSt|hasSize|value|counter|IFRAME_NS|gi|arrowRight|_window|body|_wrapClasses|imgSt|s|removeClass|isIE7|windowStyles|iframe|detach|click||loading|_hiddenClass|proto|appendTo|cName|newContent|window|arr|appVersion|button|auto|delegate|itemOpts|isOpen|undefined|midClick|modules|scrollDiv|instance|ready|overflow|cursor|updateItemHTML|mfploader|CLOSE_EVENT|direction|n|_lastInlineElement|registerModule|ev|_inlinePlaceholder|focus|extend|call|open|a|showCloseBtn|gallery|defaults|closeBtn|error|mfpSetInterval|for|wH|MagnificPopup|_prevContentType|name|isObj|overflowY|closeOnContentClick|p|v|com|module|mainClass|closeBtnInside|clearInterval|popupsCache|next|_onImageHasSize|_checkInstance|isLowIE|_preloadTimeout|top|setTimeout|createElement|slice|append|classesToadd|resizeImage|className|INLINE_NS|PREVENT_CLOSE_CLASS|NS|eHandler|winHeight|mainEl|factory|typeof|_getLoopedId|READY_CLASS|parsed|numSlides|_prevStatus|_parseMarkup|_addClassToMFP|MARKUP_PARSE_EVENT|iframeSt|arrow|contentContainer|_getCloseBtn|_fixIframeBugs|push|OPEN_EVENT|curr|total|_putInlineElementsBack|isIOS|inline||init|parseInt|figure|updateSize|_lastFocusedEl|parent|supportsFastClick|_isJQ|add|loadError|inlineSt|charAt|classesToRemove|prev|newIndex|replaceWith|_preloadItem|_close|hidden|_setFocus|REMOVING_CLASS|decr|preloadAfter|absolute|scrollbarSize|position|style|preloadBefore|closeOnBgClick|enableEscapeKey|parseEl|mfpEl|windowHeight|prototype|closeOnBg|closeOnContent|_openClick|eq|prependTo|removalDelay|fixedBgPos|contains|tLoading|hasClass|test|dataObj|l|srcAction|onLoadError|_replaceCurrTotal|CHANGE_EVENT|youtube|preloaded|indexOf|onLoadComplete|prevType|newType|loaded|guard|width|tError|vimeo|_currPopupType|define|keyCode|isIE8|isShowing|dir|callbacks|url|imgHidden|BEFORE_CLOSE_EVENT|jQuery|preload|99px|embed|BeforeChange|alignTop|clientWidth|autoplay|tNext|Math|blank|raw|appendChild|min|f|about|tPrev|jquery|holder|break|focusin|marginRight|keyup|BEFORE_APPEND_EVENT|appendContent|enabled|AFTER_CLOSE_EVENT|zoomLevel|fn|bg|toUpperCase|UpdateStatus|load|patterns|string|each|arrowMarkup|_getScrollbarSize|closeMarkup|_onFocusIn|arrows|tCounter|_checkIfClose|_removeClassFromMFP|BuildControls|_hasScrollBar|supportsTransition|modal|isFunction|probablyMobile|isArray|figcaption|navigator|MSIE|alt|is|naturalWidth|tagName|hiddenClass|after|titleSrc|href|isAndroid|supportsTransitions|padding|bottom|Opera|verticalFit|AfterChange|not|delay|resize|Resize|_getTitle|tNotFound|addGroup|preloadNearbyImages|b|tClose|mfpFastClick|Close|in|apply|findImageSize|navigateByImgClick|_emptyPage|arguments|Zepto|removeAttr|LazyLoadError|AfterClose|overflowX|ipad|BeforeAppend|ipod|ms|BeforeClose|O|transition|Mobi|prevHeight|Kindle|amd|webOS|Webkit|exports|Moz|Windows|require|Mini|object|BlackBerry|IEMobile|pop|tabindex|triggerHandler|while|constructor|Transition|prevent|close_replaceWith|btn|activeElement|BeforeOpen|innerHTML|removing|toLowerCase|iphone|new|ie7|Phone|empty|userAgent|toArray|align|scrollTop|Change|Open|android|MarkupParse|Esc|block|display|right|clearTimeout|none|scaler|iframe_src|allowfullscreen|frameborder|img_replaceWith|clone|documentElement|isCheckingImgSize|max|initImage|setInterval|500|ImageLoadComplete|complete|getImage|www|player|Next|Left|Previous|element|Right|of|keydown|Boolean|initGallery|lastIndexOf|substr|maps|gmaps|video|google|output|getIframe|left|initIframe|be|ImageHasSize|_|cssText|split|scrollHeight|LazyLoad|scroll|9999px|Loading|could|removeChild|offsetWidth|stopImmediatePropagation|stopPropagation|get|FirstMarkupParse|innerHeight|innerWidth|prepend|ElementParse|preventDefault|metaKey|ctrlKey|which|Array|times|destroyMfpFastClick|goTo|parentNode|bar|zoom|The|cur|out|getInline|inlineElement|Content|found|initInline|hide".split("|"),
0, {}));
/** @type {Array} */
var _0x509b = ["famax_global_options", "data", "fanPageId", "//graph.facebook.com/v2.4/", "/posts?limit=", "maxResults", "&access_token=", "accessToken", "&fields=type,message,object_id,picture,name,description,link,from,comments.limit(1).summary(true),likes.limit(1).summary(true),shares,created_time", "GET", "jsonp", "ajax", "/tagged?limit=", "&fields=type,message,object_id,picture,name,description,link,from,comments.limit(1).summary(true),likes.limit(1).summary(true),shares", "length", "//graph.facebook.com/v2.4/?ids=",
"&fields=id,picture", "//graph.facebook.com/v2.5/", "/comments?access_token=", "&limit=", "maxComments", "/likes?access_token=", "&fields=name", "&fields=id,attachments,type,object_id,picture", "&fields=id,images", "&fields=id,length,format", "/photos?limit=", "&fields=id,images,link,name,picture,source,comments.limit(1).summary(true),likes.limit(1).summary(true),shares", "/videos/uploaded?limit=", "&fields=id,description,embed_html,picture,length,source,status,link,thumbnails,format,comments.limit(1).summary(true),likes.limit(1).summary(true),shares",
"/photos/uploaded?limit=", "/albums?limit=", "&fields=id,name,cover_photo,count,link", '<div id="famax-header"><div id="famax-header-wrapper"><div id="famax-stat-holder"></div></div></div>', "append", '<div id="famax-tabs"></div>', '<div id="famax-select-box"><select id="famax-select"></select></div>', '<div id="famax-showing-title"></div>', '<div id="famax-video-list-div"><ul id="tiles"></ul></div>', '<button id="famax-load-more-div">Load More</button>', '<div id="famax-comment-block" class="white-popup mfp-hide"><div id="famax-encloser-comment-wrapper" class="famax-encloser-comment-wrapper-popup"><div id="famax-encloser-comment-holder" class="famax-encloser-comment-holder-popup"><div class="famax-video-comment"><textarea class="famax-comment-textbox" placeholder="Share your Thoughts..."></textarea><button class="famax-add-comment-button"><i class="fa fa-facebook-square fa-lg"></i>&nbsp; Login</button></div><div id="famax-encloser-comments"></div><div class="famax-encloser-button famax-more-comments-button">Load More Comments</div></div></div></div>',
'<div id="famax-like-block" class="white-popup mfp-hide"><div id="famax-encloser-like-wrapper" class="famax-encloser-like-wrapper-popup"><div id="famax-encloser-like-holder" class="famax-encloser-like-holder-popup"><div class="famax-video-like"><button class="famax-add-like-button"><i class="fa fa-facebook-square fa-lg"></i>&nbsp; Login</button></div><div id="famax-encloser-likes"></div><div class="famax-encloser-button famax-more-likes-button">Load More Likes</div></div></div></div>', "#famax-load-more-div",
"find", "click", ".famax-tab", "id", "on", "#famax-tabs", "onClickAction", "popup", 'li[id^="photos_"]', "famax_current_playlist_id", "text", ".famax-video-list-title", "famax_current_playlist_name", "#famax-video-list-div", ".famax-show-comments", "attr", "first", "li", "parents", ".famax-show-likes", ".famax-more-comments-button", ".famax-more-likes-button", ".famax-add-comment-button", ".famax-add-like-button", "val", ":selected", "change", "#famax-select", "alwaysUseDropdown", "display", "block",
"css", "#famax-select-box", "hide", ".famax-hover-icon", "#famax-back-to-albums", "span[id^=albums_].famax-tab", '<div class="famax-loading-div"><br><br><br><br><br>Loading...<br><br><br><br><br></div>', "empty", "#famax-encloser-comments", "#famax-comment-block", "inline", "get", "open", "magnificPopup", "#famax-encloser-likes", "#famax-like-block", "LOADING...", "famax-load-more-div-click", "addClass", "nextpageapiurl", "undefined", "", ".famax-tab-hover", "tagged", "indexOf", "posts", "feed",
"photos", "videos", "albums", "pstream", "ALL DONE", "removeClass", ".famax-encloser-button.famax-more-comments-button", "Loading...", "famax-load-more-comments-clicked", "All Done", "Load More Comments", ".famax-encloser-button.famax-more-likes-button", "famax-load-more-likes-clicked", "Load More Likes", "?access_token=", "&fields=talking_about_count,cover,likes,name", "overrideMimeType", "application/j-son;charset=UTF-8", "round", "K", "toFixed", "M", "B", "disabled", "posting..", "famaxUserAccessToken",
".famax-comment-textbox", "trim", "Please enter a valid comment..", "POST", "removeAttr", "postid", "processing..", "status", "connected", "authResponse", '<i class="fa fa-facebook-square fa-lg"></i>&nbsp; POST', "html", '<i class="fa fa-facebook-square fa-lg"></i>&nbsp; LIKE', "not_authorized", "publish_actions", "login", "/me", "name", "api", "/me/picture", "picture", "url", "/comments", "post", "Content-Type", "application/x-www-form-urlencoded", "setRequestHeader", '<div class="famax-video-comment ',
'"><div class="famax-comment-from"><div class="famax-comment-from-img" style="background-image:url(\'', '\');"></div><div class="famax-comment-from-name">', '</div><div class="famax-published">just now</div></div><div class="famax-comment"><span class="famax-comment-content">', "</span><div></div>", "prepend", "Could not Post - ", "/likes", '<div class="famax-video-like ', '"><div class="famax-like-from"><div class="famax-like-from-img" style="background-image:url(\'', '\');"></div><div class="famax-like-from-name">',
"</div></div></div>", "Could not add Like - ", "likes", "talking_about_count", "cover", "source", "background-image", "url(", ")", "#famax-header", '<a href="//www.facebook.com/', '" target="_blank"><div class="famax-channel-icon"><img src="//graph.facebook.com/v2.4/', "/picture?type=normal&access_token=", '"/></div><div class="famax-channel-title">', "</div></a>", "#famax-header-wrapper", '&nbsp;&nbsp;&nbsp;&nbsp;<div class="famax-subscribe"><iframe src="//www.facebook.com/plugins/like.php?href=http%3A%2F%2Fwww.facebook.com%2F',
'&amp;layout=box_count&amp;show_faces=true&amp;action=like&amp;colorscheme=light&amp" style="overflow:hidden;width:100%;height:80px;" scrolling="no" frameborder="0" allowTransparency="true"></iframe></div>', '<div class="famax-stat"><span class="famax-stat-count">', '</span><br/> TALKING </div><div class="famax-stat"><span class="famax-stat-count">', "</span><br/>LIKES</div>", "#famax-stat-holder", '<span id="pstream_', '" class="famax-tab" >Photos</span>', '<option value="pstream_', '" class="famax-option-highlight" >Photos</span>',
'<span id="videos_', '" class="famax-tab" >Videos</span>', '<option value="videos_', '" class="famax-option-highlight" >Videos</span>', '<span id="albums_', '" class="famax-tab" >Albums</span>', '<option value="albums_', '" class="famax-option-highlight" >Albums</span>', '<span id="tagged_', '" class="famax-tab" >Tags</span>', '<option value="tagged_', '" class="famax-option-highlight" >Tags</span>', '<span id="posts_', '" class="famax-tab" >Posts</span>', '<option value="posts_', '" class="famax-option-highlight" >Posts</span>',
"charAt", "selectedTab", "p", "#posts_", "t", "#tagged_", "l", "#albums_", "v", "#videos_", "h", "#pstream_", "fanPageTitle", "error", "code", "expired", "message", "Session expired. Please reload the page.", "ul", "maxItemsDisplayed", "paging", "next", '<li id="tags-not-found"><p><span class="famax-video-list-title">No More Tags Found..</span></p></li>', "type", "link", "#", '<a class="famax-onclick-link" target="_blank" href="', '">', "</a>", "from", '<div class="famax-from"><div class="famax-from-img" style="background-image:url(\'',
'\');"></div><div class="famax-from-name">', "</div></div>", "attachments", "title", "description", "via ", "displayMetricsForTags", "displayMetricsForPosts", "total_count", "summary", "comments", "shares", "count", '<div class="famax-likes-shares-comments-string"><div class="famax-show-likes"><i class="fa fa-thumbs-up"></i><div class="famax-likes-count">', '</div></div><div class="famax-show-comments"><i class="fa fa-comment"></i><div class="famax-comments-count">', "photo", "push", "object_id",
'<li id="', '<div class="famax-image-wrapper"><img class="mfp-image famax-gallery-item" href="', '" src="', '"><div class="famax-hover-icon famax-hover-icon-search"><i class="fa fa-search"></i></div></div>', '<p><span class="famax-video-list-title">', "</span></p>", "</li>", "notFoundImage", '<a class="famax-link-post" href="', '" target="_blank"><div class="famax-image-wrapper"><img src="', '" href="', '" class="mfp-image"><div class="famax-hover-icon famax-hover-icon-link"><i class="fa fa-link fa-lg"></i></div></div></a><p><span class="famax-link-title">',
'</span><span class="famax-link-description">', '</span><span class="famax-video-list-title">', "video", "facebook.com", "/videos/", "/video.php?v=", "replace", '<div class="famax-image-wrapper"><img data-lowresimage="', '" id="', '" class="mfp-iframe famax-gallery-item" href="', '"><div class="famax-hover-icon famax-hover-icon-play"><i class="fa fa-play"></i></div></div>', "#famax-video-list-div .", "images", "data-hdpicture", "src", "clearTimeout", "refreshTimeout", "subattachments", '<div class="famax-attachment-holder">',
'<div class="famax-attachment mfp-image famax-gallery-item" href="', "image", "media", '" style="background-image:url(\'', "');\"></div>", "maxAttachments", "</div>", " img.mfp-image", " .famax-video-list-title", "via", "/picture?type=normal&width=500&access_token=", "href", "after", " img.mfp-iframe", ".", " .famax-", "-from-img", "like", "created_time", '</div><div class="famax-published">', ' </div></div><div class="famax-comment"><span class="famax-comment-content">', "comment", '<li id="tags-not-found"><p><span class="famax-video-list-title">No More Videos Found..</span></p></li>',
"//www.facebook.com/video.php?v=", "format", '<div class="famax-image-wrapper"><img class="mfp-iframe famax-gallery-item" data-hdpicture="', "show", '<div id="', '" class="famax-tab famax-tab-hover"><i title="Back to Albums" id="famax-back-to-albums" class="fa fa-chevron-circle-left fa-lg"></i>Showing Album - ', "#famax-showing-title", '" data-hdpicture="', "famax-gallery-item", "getElementsByClassName", "mfp-image", "getAttribute", "cover_photo", '<li id="photos_', '<img class="mfp-image ',
'" src=""><div class="famax-album-photo-count-wrapper"><div class="famax-album-photo-count-box"><span class="famax-album-photo-count">', '</span><br>PHOTOS<br><div class="famax-album-line-wrapper"><span class="famax-album-line"></span><br><span class="famax-album-line"></span><br><span class="famax-album-line"></span></div></div></div>', "</span></p></li>", "bit.ly", "goo.gl", "youtubeshare.com", "youtu.be", "tinyurl.com", "//api.longurl.org/v2/expand?format=json&url=", "long-url", " img", "youtube.com",
"vimeo.com", '<a target="_blank" class="famax-link-post" href="', "wrap", "vimeo.com/ondemand/", '"></a>', "match", '<a target="_blank" href="', '" class="famax-link">', "<br>", "safe_image.php", "url=", "substring", "&", "?", "http", "https", "width", "abs", " year ago", " years ago", " month ago", " months ago", " day ago", " days ago", "just now", " hour ago", " hours ago", "remove", ".famax-loading-div", "innerOffset", "minItemWidth", "maxItemWidth", "outerOffset", "wookmark", "always", "imagesLoaded",
"isLoaded", 'img[src="', "img", '"]', "lowresimage", "progress", "Load More", ".famax-gallery-item", '<div class="mfp-iframe-scaler">', '<div class="famax-iframe-icon-play"><i class="fa fa-play fa-1x"></i></div>', '<div class="mfp-close"></div>', '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>', "youtube.com/", "v=", "split", "//www.youtube.com/embed/%id%?rel=0&autoplay=1", "facebook.com/", "?v=", "//www.facebook.com/video/embed?video_id=%id%", "vimeo.com/", "/", "http://player.vimeo.com/video/%id%?autoplay=1",
" ", ".famax-fb-fix", "el", "naturalWidth", "context", "naturalHeight", '<style class="famax-fb-fix">.mfp-content { max-width: ', "px !important; } .famax-iframe-icon-play{display: inline-block !important;}</style>", "html > head", "#famax-video-list-div #tiles", "#famax-video-list-div>ul", '<div class="famax-loading-div"><br><br><br><br><br><br>loading HD...<br><br><br><br><br><br></div>', "//graph.facebook.com/v2.4/oauth/access_token?client_id=", "appId", "&client_secret=", "appSecret", "&grant_type=client_credentials",
"=", "|", "Cannot find access token", "albumIdArray", "maxAlbumNameLength", "..", '<span id="photos_', '" class="famax-tab" >', "</span>", '<option value="photos_', '" >', "</option>", "a", "#photos_", "_", "famax-tab-hover", "famax", "fn", "createStyleSheet", "//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css", "<link rel='stylesheet' href='//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css' type='text/css' />", "head", "skin", "white", "grey", "black",
"./css/famax_", ".min.css", "<link rel='stylesheet' href='./css/famax_", ".min.css' type='text/css' />", "fanPage", "lastIndexOf", "maxContainerWidth", "max-width", "px", "<style>#famax-stat-holder {display:none;}.famax-subscribe {left:initial;}#famax-select-box{display:block;}#famax-tabs {display:none;}</style>", "body", "<style>#famax-stat-holder {display:none;}.famax-subscribe {display:none;}.famax-tab {width: 42%;text-align: center;}</style>", "<style>.famax-tab {width: 90%;text-align: center;}</style>",
"album", "isArray", "?set=a.", "fail", "v2.4", "init", "done", "//connect.facebook.net/en_US/sdk.js", "getScript"];
var famaxLoggedInUser = {};
(function($) {
  var abortTimeout;
  /**
   * @param {?} result
   * @param {Function} state
   * @return {undefined}
   */
  var next = function(result, state) {
    /** @type {boolean} */
    var REQ = false;
    var _0x57cfx41 = result[_0x509b[1]](_0x509b[0]);
    if (null == _0x57cfx41[_0x509b[2]]) {
      return;
    }
    if (null == state) {
      apiUrl = _0x509b[3] + _0x57cfx41[_0x509b[2]] + _0x509b[4] + _0x57cfx41[_0x509b[5]] + _0x509b[6] + _0x57cfx41[_0x509b[7]] + _0x509b[8];
    } else {
      /** @type {Function} */
      apiUrl = state;
      /** @type {boolean} */
      REQ = true;
    }
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} jqXHR
       * @return {undefined}
       */
      success : function(jqXHR) {
        onError(jqXHR, false, REQ, result);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} handler
   * @param {Object} state
   * @return {undefined}
   */
  var test = function(handler, state) {
    /** @type {boolean} */
    var REQ = false;
    var _0x57cfx41 = handler[_0x509b[1]](_0x509b[0]);
    if (null == _0x57cfx41[_0x509b[2]]) {
      return;
    }
    if (null == state) {
      apiUrl = _0x509b[3] + _0x57cfx41[_0x509b[2]] + _0x509b[12] + (_0x57cfx41[_0x509b[5]] < 10 ? 10 : _0x57cfx41[_0x509b[5]]) + _0x509b[6] + _0x57cfx41[_0x509b[7]] + _0x509b[13];
    } else {
      /** @type {Object} */
      apiUrl = state;
      /** @type {boolean} */
      REQ = true;
    }
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} jqXHR
       * @return {undefined}
       */
      success : function(jqXHR) {
        onError(jqXHR, true, REQ, handler);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {Object} success
   * @param {?} data
   * @param {?} req
   * @return {undefined}
   */
  var getJSON = function(success, data, req) {
    var _0x57cfx41 = data[_0x509b[1]](_0x509b[0]);
    if (null == success || success[_0x509b[14]] == 0) {
      return;
    }
    apiUrl = _0x509b[15] + success + _0x509b[6] + _0x57cfx41[_0x509b[7]] + _0x509b[16];
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} evt
       * @return {undefined}
       */
      success : function(evt) {
        cb(evt, success, data, req);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} isXML
   * @param {?} results
   * @param {Function} callback
   * @return {undefined}
   */
  var find = function(isXML, results, callback) {
    /** @type {boolean} */
    var restoreScript = false;
    var _0x57cfx41 = results[_0x509b[1]](_0x509b[0]);
    if (null == _0x57cfx41[_0x509b[2]]) {
      return;
    }
    if (null == callback) {
      apiUrl = _0x509b[17] + isXML + _0x509b[18] + _0x57cfx41[_0x509b[7]] + _0x509b[19] + _0x57cfx41[_0x509b[20]];
    } else {
      /** @type {Function} */
      apiUrl = callback;
      /** @type {boolean} */
      restoreScript = true;
    }
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} message
       * @return {undefined}
       */
      success : function(message) {
        update(message, isXML, restoreScript, results);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} isXML
   * @param {?} i
   * @param {Function} callback
   * @return {undefined}
   */
  var render = function(isXML, i, callback) {
    /** @type {boolean} */
    var typePattern = false;
    var _0x57cfx41 = i[_0x509b[1]](_0x509b[0]);
    if (null == _0x57cfx41[_0x509b[2]]) {
      return;
    }
    if (null == callback) {
      apiUrl = _0x509b[3] + isXML + _0x509b[21] + _0x57cfx41[_0x509b[7]] + _0x509b[19] + _0x57cfx41[_0x509b[20]] + _0x509b[22];
    } else {
      /** @type {Function} */
      apiUrl = callback;
      /** @type {boolean} */
      typePattern = true;
    }
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} page
       * @return {undefined}
       */
      success : function(page) {
        queue(page, isXML, typePattern, i);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} data
   * @param {?} result
   * @return {undefined}
   */
  var success = function(data, result) {
    var _0x57cfx41 = result[_0x509b[1]](_0x509b[0]);
    if (null == _0x57cfx41[_0x509b[2]]) {
      return;
    }
    if (null == data || data[_0x509b[14]] == 0) {
      return;
    }
    apiUrl = _0x509b[15] + data + _0x509b[6] + _0x57cfx41[_0x509b[7]] + _0x509b[23];
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} res
       * @return {undefined}
       */
      success : function(res) {
        onSuccess(res, data, result);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {Object} callback
   * @param {?} cb
   * @return {undefined}
   */
  var request = function(callback, cb) {
    var _0x57cfx41 = cb[_0x509b[1]](_0x509b[0]);
    if (null == _0x57cfx41[_0x509b[2]]) {
      return;
    }
    if (null == callback || callback[_0x509b[14]] == 0) {
      return;
    }
    apiUrl = _0x509b[15] + callback + _0x509b[6] + _0x57cfx41[_0x509b[7]] + _0x509b[24];
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} data
       * @return {undefined}
       */
      success : function(data) {
        handler(data, callback, cb);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {Object} json
   * @param {?} callback
   * @return {undefined}
   */
  var load = function(json, callback) {
    var _0x57cfx41 = callback[_0x509b[1]](_0x509b[0]);
    if (null == _0x57cfx41[_0x509b[2]]) {
      return;
    }
    if (null == json || json[_0x509b[14]] == 0) {
      return;
    }
    apiUrl = _0x509b[15] + json + _0x509b[6] + _0x57cfx41[_0x509b[7]] + _0x509b[25];
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} status
       * @return {undefined}
       */
      success : function(status) {
        onComplete(status, json, callback);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {Array} opt_scope
   * @param {?} callback
   * @param {Function} fn
   * @return {undefined}
   */
  var register = function(opt_scope, callback, fn) {
    /** @type {boolean} */
    var udataCur = false;
    var _0x57cfx41 = callback[_0x509b[1]](_0x509b[0]);
    if (null == fn) {
      apiUrl = _0x509b[3] + opt_scope + _0x509b[26] + _0x57cfx41[_0x509b[5]] + _0x509b[6] + _0x57cfx41[_0x509b[7]] + _0x509b[27];
    } else {
      /** @type {Function} */
      apiUrl = fn;
      /** @type {boolean} */
      udataCur = true;
    }
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} arg
       * @return {undefined}
       */
      success : function(arg) {
        add(arg, udataCur, callback);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} opts
   * @param {Function} var_args
   * @return {undefined}
   */
  var create = function(opts, var_args) {
    /** @type {boolean} */
    var which = false;
    var _0x57cfx41 = opts[_0x509b[1]](_0x509b[0]);
    if (null == var_args) {
      apiUrl = _0x509b[3] + _0x57cfx41[_0x509b[2]] + _0x509b[28] + _0x57cfx41[_0x509b[5]] + _0x509b[6] + _0x57cfx41[_0x509b[7]] + _0x509b[29];
    } else {
      /** @type {Function} */
      apiUrl = var_args;
      /** @type {boolean} */
      which = true;
    }
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} count
       * @return {undefined}
       */
      success : function(count) {
        start(count, which, opts);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} callback
   * @param {Object} response
   * @return {undefined}
   */
  var connect = function(callback, response) {
    /** @type {boolean} */
    var udataCur = false;
    var _0x57cfx41 = callback[_0x509b[1]](_0x509b[0]);
    if (null == response) {
      apiUrl = _0x509b[3] + _0x57cfx41[_0x509b[2]] + _0x509b[30] + _0x57cfx41[_0x509b[5]] + _0x509b[6] + _0x57cfx41[_0x509b[7]] + _0x509b[27];
    } else {
      /** @type {Object} */
      apiUrl = response;
      /** @type {boolean} */
      udataCur = true;
    }
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} arg
       * @return {undefined}
       */
      success : function(arg) {
        add(arg, udataCur, callback);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} value
   * @param {Object} a
   * @return {undefined}
   */
  var isArray = function(value, a) {
    /** @type {boolean} */
    var udataCur = false;
    var _0x57cfx41 = value[_0x509b[1]](_0x509b[0]);
    if (null == a) {
      apiUrl = _0x509b[3] + _0x57cfx41[_0x509b[2]] + _0x509b[31] + _0x57cfx41[_0x509b[5]] + _0x509b[6] + _0x57cfx41[_0x509b[7]] + _0x509b[32];
    } else {
      /** @type {Object} */
      apiUrl = a;
      /** @type {boolean} */
      udataCur = true;
    }
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} obj
       * @return {undefined}
       */
      success : function(obj) {
        save(obj, udataCur, value);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} type
   * @return {undefined}
   */
  var run = function(type) {
    var _0x57cfx41 = type[_0x509b[1]](_0x509b[0]);
    type[_0x509b[34]](_0x509b[33]);
    type[_0x509b[34]](_0x509b[35]);
    type[_0x509b[34]](_0x509b[36]);
    type[_0x509b[34]](_0x509b[37]);
    type[_0x509b[34]](_0x509b[38]);
    type[_0x509b[34]](_0x509b[39]);
    type[_0x509b[34]](_0x509b[40]);
    type[_0x509b[34]](_0x509b[41]);
    $famaxLoadMoreDiv = type[_0x509b[43]](_0x509b[42]);
    $famaxLoadMoreDiv[_0x509b[44]](function() {
      each(type);
    });
    type[_0x509b[43]](_0x509b[48])[_0x509b[47]](_0x509b[44], _0x509b[45], function() {
      setup(this[_0x509b[46]], type);
    });
    if (_0x57cfx41[_0x509b[49]] == _0x509b[50]) {
      type[_0x509b[43]](_0x509b[56])[_0x509b[47]](_0x509b[44], _0x509b[51], function() {
        type[_0x509b[1]](_0x509b[52], this[_0x509b[46]]);
        var r20 = $(this)[_0x509b[43]](_0x509b[54])[_0x509b[53]]();
        type[_0x509b[1]](_0x509b[55], r20);
        setup(this[_0x509b[46]], type);
      });
    }
    type[_0x509b[43]](_0x509b[56])[_0x509b[47]](_0x509b[44], _0x509b[57], function() {
      itemId = $(this)[_0x509b[61]](_0x509b[60])[_0x509b[59]]()[_0x509b[58]](_0x509b[46]);
      fn(itemId, type);
    });
    type[_0x509b[43]](_0x509b[56])[_0x509b[47]](_0x509b[44], _0x509b[62], function() {
      itemId = $(this)[_0x509b[61]](_0x509b[60])[_0x509b[59]]()[_0x509b[58]](_0x509b[46]);
      remove(itemId, type);
    });
    type[_0x509b[47]](_0x509b[44], _0x509b[63], function() {
      emit(type);
    });
    type[_0x509b[47]](_0x509b[44], _0x509b[64], function() {
      finish(type);
    });
    type[_0x509b[47]](_0x509b[44], _0x509b[65], function() {
      f(this, type);
    });
    type[_0x509b[47]](_0x509b[44], _0x509b[66], function() {
      show(this, type);
    });
    type[_0x509b[43]](_0x509b[70])[_0x509b[69]](function() {
      var suiteView = $(this)[_0x509b[43]](_0x509b[68])[_0x509b[67]]();
      setup(suiteView, type);
    });
    if (_0x57cfx41[_0x509b[71]]) {
      type[_0x509b[43]](_0x509b[75])[_0x509b[74]](_0x509b[72], _0x509b[73]);
      type[_0x509b[43]](_0x509b[48])[_0x509b[76]]();
    }
    type[_0x509b[47]](_0x509b[44], _0x509b[77], function() {
      return true;
    });
    type[_0x509b[47]](_0x509b[44], _0x509b[78], function() {
      type[_0x509b[43]](_0x509b[79])[_0x509b[44]]();
    });
  };
  /**
   * @param {?} isXML
   * @param {?} key
   * @return {undefined}
   */
  var fn = function(isXML, key) {
    key[_0x509b[43]](_0x509b[82])[_0x509b[81]]()[_0x509b[34]](_0x509b[80]);
    find(isXML, key, null);
    $[_0x509b[87]][_0x509b[86]]({
      items : {
        src : _0x509b[83],
        type : _0x509b[84]
      },
      prependTo : key[_0x509b[85]]()
    });
  };
  /**
   * @param {?} ret
   * @param {?} classNames
   * @return {undefined}
   */
  var remove = function(ret, classNames) {
    classNames[_0x509b[43]](_0x509b[88])[_0x509b[81]]()[_0x509b[34]](_0x509b[80]);
    render(ret, classNames, null);
    $[_0x509b[87]][_0x509b[86]]({
      items : {
        src : _0x509b[89],
        type : _0x509b[84]
      },
      prependTo : classNames[_0x509b[85]]()
    });
  };
  /**
   * @param {?} handler
   * @return {undefined}
   */
  var each = function(handler) {
    var _0x57cfx4d = handler[_0x509b[43]](_0x509b[42]);
    _0x57cfx4d[_0x509b[53]](_0x509b[90]);
    _0x57cfx4d[_0x509b[92]](_0x509b[91]);
    var doc = _0x57cfx4d[_0x509b[1]](_0x509b[93]);
    if (null != doc && (doc != _0x509b[94] && doc != _0x509b[95])) {
      var _0x57cfx4e = handler[_0x509b[43]](_0x509b[96])[_0x509b[58]](_0x509b[46]);
      if (_0x57cfx4e[_0x509b[98]](_0x509b[97]) != -1) {
        test(handler, doc);
      } else {
        if (_0x57cfx4e[_0x509b[98]](_0x509b[99]) != -1) {
          next(handler, doc);
        } else {
          if (_0x57cfx4e[_0x509b[98]](_0x509b[100]) != -1) {
          } else {
            if (_0x57cfx4e[_0x509b[98]](_0x509b[101]) != -1) {
              register(null, handler, doc);
            } else {
              if (_0x57cfx4e[_0x509b[98]](_0x509b[102]) != -1) {
                create(handler, doc);
              } else {
                if (_0x57cfx4e[_0x509b[98]](_0x509b[103]) != -1) {
                  isArray(handler, doc);
                } else {
                  if (action[_0x509b[98]](_0x509b[104]) != -1) {
                    connect(handler, doc);
                  }
                }
              }
            }
          }
        }
      }
    } else {
      _0x57cfx4d[_0x509b[106]](_0x509b[91])[_0x509b[53]](_0x509b[105]);
    }
  };
  /**
   * @param {?} data
   * @return {undefined}
   */
  var emit = function(data) {
    var _0x57cfx4f = data[_0x509b[43]](_0x509b[107]);
    _0x57cfx4f[_0x509b[53]](_0x509b[108]);
    _0x57cfx4f[_0x509b[92]](_0x509b[109]);
    var which = _0x57cfx4f[_0x509b[1]](_0x509b[93]);
    if (null != which && (which != _0x509b[94] && which != _0x509b[95])) {
      find(null, data, which);
    } else {
      _0x57cfx4f[_0x509b[53]](_0x509b[110]);
    }
  };
  /**
   * @param {?} arg1
   * @return {undefined}
   */
  var write = function(arg1) {
    var _0x57cfx4f = arg1[_0x509b[43]](_0x509b[107]);
    _0x57cfx4f[_0x509b[106]](_0x509b[109]);
    _0x57cfx4f[_0x509b[53]](_0x509b[111]);
  };
  /**
   * @param {?} context
   * @return {undefined}
   */
  var finish = function(context) {
    var _0x57cfx50 = context[_0x509b[43]](_0x509b[112]);
    _0x57cfx50[_0x509b[53]](_0x509b[108]);
    _0x57cfx50[_0x509b[92]](_0x509b[113]);
    var which = _0x57cfx50[_0x509b[1]](_0x509b[93]);
    if (null != which && (which != _0x509b[94] && which != _0x509b[95])) {
      render(null, context, which);
    } else {
      _0x57cfx50[_0x509b[53]](_0x509b[110]);
    }
  };
  /**
   * @param {?} buffer
   * @return {undefined}
   */
  var flush = function(buffer) {
    var _0x57cfx50 = buffer[_0x509b[43]](_0x509b[112]);
    _0x57cfx50[_0x509b[106]](_0x509b[113]);
    _0x57cfx50[_0x509b[53]](_0x509b[114]);
  };
  /**
   * @param {?} position
   * @return {undefined}
   */
  var init = function(position) {
    var _0x57cfx41 = position[_0x509b[1]](_0x509b[0]);
    if (null == _0x57cfx41[_0x509b[2]]) {
      return;
    }
    apiUrl = _0x509b[3] + _0x57cfx41[_0x509b[2]] + _0x509b[115] + _0x57cfx41[_0x509b[7]] + _0x509b[116];
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} data
       * @return {undefined}
       */
      success : function(data) {
        template(data, position);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {(Node|string)} object
   * @return {undefined}
   */
  var seal = function(object) {
    if (object && object[_0x509b[117]]) {
      object[_0x509b[117]](_0x509b[118]);
    }
  };
  /**
   * @param {number} a
   * @return {?}
   */
  var extend = function(a) {
    /** @type {number} */
    a = parseInt(a, 10);
    if (a < 1E3) {
    } else {
      if (a < 1E6) {
        a = Math[_0x509b[119]](a / 1E3) + _0x509b[120];
      } else {
        if (a < 1E9) {
          a = (a / 1E6)[_0x509b[121]](1) + _0x509b[122];
        } else {
          a = (a / 1E9)[_0x509b[121]](1) + _0x509b[123];
        }
      }
    }
    return a;
  };
  /**
   * @param {?} param
   * @param {?} name
   * @return {undefined}
   */
  var f = function(param, name) {
    $(param)[_0x509b[53]](_0x509b[125])[_0x509b[58]](_0x509b[124], _0x509b[124]);
    var _0x57cfx41 = name[_0x509b[1]](_0x509b[0]);
    var failuresLink = famaxLoggedInUser[_0x509b[126]];
    if (null != failuresLink && failuresLink != _0x509b[95]) {
      var suiteView = name[_0x509b[43]](_0x509b[127])[_0x509b[67]]();
      if (null == suiteView || suiteView[_0x509b[128]]() == _0x509b[95]) {
        alert(_0x509b[129]);
        name[_0x509b[43]](_0x509b[65])[_0x509b[131]](_0x509b[124])[_0x509b[53]](_0x509b[130]);
        return;
      } else {
        suiteView = suiteView[_0x509b[128]]();
      }
      var oldconfig = name[_0x509b[43]](_0x509b[107])[_0x509b[1]](_0x509b[132]);
      func(name, oldconfig, failuresLink, suiteView);
    } else {
      done();
    }
  };
  /**
   * @param {?} elems
   * @param {?} event
   * @return {undefined}
   */
  var show = function(elems, event) {
    $(elems)[_0x509b[53]](_0x509b[133])[_0x509b[58]](_0x509b[124], _0x509b[124]);
    var _0x57cfx41 = event[_0x509b[1]](_0x509b[0]);
    var pdataCur = famaxLoggedInUser[_0x509b[126]];
    if (null != pdataCur && pdataCur != _0x509b[95]) {
      var failuresLink = event[_0x509b[43]](_0x509b[112])[_0x509b[1]](_0x509b[132]);
      activate(event, failuresLink, pdataCur);
    } else {
      done();
    }
  };
  /**
   * @return {undefined}
   */
  var done = function() {
    FB[_0x509b[142]](function(dataAndEvents) {
      if (dataAndEvents[_0x509b[134]] === _0x509b[135]) {
        famaxLoggedInUser[_0x509b[126]] = dataAndEvents[_0x509b[136]][_0x509b[7]];
        fail();
        $(_0x509b[65])[_0x509b[131]](_0x509b[124])[_0x509b[138]](_0x509b[137]);
        $(_0x509b[66])[_0x509b[131]](_0x509b[124])[_0x509b[138]](_0x509b[139]);
      } else {
        if (dataAndEvents[_0x509b[134]] === _0x509b[140]) {
        } else {
        }
      }
    }, {
      scope : _0x509b[141]
    });
  };
  /**
   * @return {undefined}
   */
  var fail = function() {
    FB[_0x509b[145]](_0x509b[143], function(dataAndEvents) {
      famaxLoggedInUser[_0x509b[144]] = dataAndEvents[_0x509b[144]];
      famaxLoggedInUser[_0x509b[46]] = dataAndEvents[_0x509b[46]];
    });
    FB[_0x509b[145]](_0x509b[146], function(dataAndEvents) {
      famaxLoggedInUser[_0x509b[147]] = dataAndEvents[_0x509b[1]][_0x509b[148]];
    });
  };
  /**
   * @param {?} keepData
   * @param {?} b
   * @param {?} el
   * @param {string} obj
   * @return {undefined}
   */
  var func = function(keepData, b, el, obj) {
    var _0x57cfx41 = keepData[_0x509b[1]](_0x509b[0]);
    var appFrontendUrl = _0x509b[3] + b + _0x509b[149];
    $[_0x509b[11]]({
      url : appFrontendUrl,
      type : _0x509b[150],
      crossDomain : true,
      data : {
        message : obj,
        access_token : el
      },
      /**
       * @param {?} xhr
       * @return {undefined}
       */
      beforeSend : function(xhr) {
        xhr[_0x509b[153]](_0x509b[151], _0x509b[152]);
      },
      /**
       * @param {?} textStatus
       * @param {?} products
       * @return {undefined}
       */
      success : function(textStatus, products) {
        keepData[_0x509b[43]](_0x509b[82])[_0x509b[159]](_0x509b[154] + famaxLoggedInUser[_0x509b[46]] + _0x509b[155] + famaxLoggedInUser[_0x509b[147]] + _0x509b[156] + famaxLoggedInUser[_0x509b[144]] + _0x509b[157] + obj + _0x509b[158]);
        keepData[_0x509b[43]](_0x509b[65])[_0x509b[131]](_0x509b[124])[_0x509b[138]](_0x509b[137]);
        keepData[_0x509b[43]](_0x509b[127])[_0x509b[67]](_0x509b[95]);
      },
      /**
       * @param {?} jqXHR
       * @param {?} origError
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(jqXHR, origError, textStatus) {
        alert(_0x509b[160] + textStatus);
      }
    });
  };
  /**
   * @param {?} container
   * @param {?} el
   * @param {?} data
   * @return {undefined}
   */
  var activate = function(container, el, data) {
    var _0x57cfx41 = container[_0x509b[1]](_0x509b[0]);
    var appFrontendUrl = _0x509b[3] + el + _0x509b[161];
    $[_0x509b[11]]({
      url : appFrontendUrl,
      type : _0x509b[150],
      crossDomain : true,
      data : {
        access_token : data
      },
      /**
       * @param {?} xhr
       * @return {undefined}
       */
      beforeSend : function(xhr) {
        xhr[_0x509b[153]](_0x509b[151], _0x509b[152]);
      },
      /**
       * @param {?} textStatus
       * @param {?} products
       * @return {undefined}
       */
      success : function(textStatus, products) {
        container[_0x509b[43]](_0x509b[88])[_0x509b[159]](_0x509b[162] + famaxLoggedInUser[_0x509b[46]] + _0x509b[163] + famaxLoggedInUser[_0x509b[147]] + _0x509b[164] + famaxLoggedInUser[_0x509b[144]] + _0x509b[165]);
        container[_0x509b[43]](_0x509b[66])[_0x509b[131]](_0x509b[124])[_0x509b[138]](_0x509b[139]);
      },
      /**
       * @param {?} jqXHR
       * @param {?} origError
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(jqXHR, origError, textStatus) {
        alert(_0x509b[166] + textStatus);
        container[_0x509b[43]](_0x509b[66])[_0x509b[131]](_0x509b[124])[_0x509b[138]](_0x509b[139]);
      }
    });
  };
  /**
   * @param {?} text
   * @param {?} c
   * @return {undefined}
   */
  var template = function(text, c) {
    var _0x57cfx41 = c[_0x509b[1]](_0x509b[0]);
    var raw = text;
    pageId = raw[_0x509b[46]];
    pageTitle = raw[_0x509b[144]];
    pageLikes = raw[_0x509b[167]];
    pageTalkingAbout = raw[_0x509b[168]];
    if (null != raw[_0x509b[169]]) {
      pageBackgroundImage = raw[_0x509b[169]][_0x509b[170]];
    } else {
      pageBackgroundImage = _0x509b[95];
    }
    c[_0x509b[43]](_0x509b[174])[_0x509b[74]](_0x509b[171], _0x509b[172] + pageBackgroundImage + _0x509b[173]);
    c[_0x509b[43]](_0x509b[180])[_0x509b[34]](_0x509b[175] + pageId + _0x509b[176] + pageId + _0x509b[177] + _0x57cfx41[_0x509b[7]] + _0x509b[178] + pageTitle + _0x509b[179]);
    c[_0x509b[43]](_0x509b[180])[_0x509b[34]](_0x509b[181] + pageId + _0x509b[182]);
    c[_0x509b[43]](_0x509b[186])[_0x509b[34]](_0x509b[183] + extend(pageTalkingAbout) + _0x509b[184] + extend(pageLikes) + _0x509b[185]);
    c[_0x509b[43]](_0x509b[48])[_0x509b[159]](_0x509b[187] + pageId + _0x509b[188]);
    c[_0x509b[43]](_0x509b[70])[_0x509b[159]](_0x509b[189] + pageId + _0x509b[190]);
    c[_0x509b[43]](_0x509b[48])[_0x509b[159]](_0x509b[191] + pageId + _0x509b[192]);
    c[_0x509b[43]](_0x509b[70])[_0x509b[159]](_0x509b[193] + pageId + _0x509b[194]);
    c[_0x509b[43]](_0x509b[48])[_0x509b[159]](_0x509b[195] + pageId + _0x509b[196]);
    c[_0x509b[43]](_0x509b[70])[_0x509b[159]](_0x509b[197] + pageId + _0x509b[198]);
    c[_0x509b[43]](_0x509b[48])[_0x509b[159]](_0x509b[199] + pageId + _0x509b[200]);
    c[_0x509b[43]](_0x509b[70])[_0x509b[159]](_0x509b[201] + pageId + _0x509b[202]);
    c[_0x509b[43]](_0x509b[48])[_0x509b[159]](_0x509b[203] + pageId + _0x509b[204]);
    c[_0x509b[43]](_0x509b[70])[_0x509b[159]](_0x509b[205] + pageId + _0x509b[206]);
    if (_0x57cfx41[_0x509b[208]][_0x509b[207]](0) == _0x509b[209]) {
      $(_0x509b[210] + pageId)[_0x509b[44]]();
    } else {
      if (_0x57cfx41[_0x509b[208]][_0x509b[207]](0) == _0x509b[211]) {
        $(_0x509b[212] + pageId)[_0x509b[44]]();
      } else {
        if (_0x57cfx41[_0x509b[208]][_0x509b[207]](0) == _0x509b[213]) {
          $(_0x509b[214] + pageId)[_0x509b[44]]();
        } else {
          if (_0x57cfx41[_0x509b[208]][_0x509b[207]](0) == _0x509b[215]) {
            $(_0x509b[216] + pageId)[_0x509b[44]]();
          } else {
            if (_0x57cfx41[_0x509b[208]][_0x509b[207]](0) == _0x509b[217]) {
              $(_0x509b[218] + pageId)[_0x509b[44]]();
            }
          }
        }
      }
    }
    _0x57cfx41[_0x509b[2]] = pageId;
    _0x57cfx41[_0x509b[219]] = pageTitle;
  };
  /**
   * @param {?} jqXHR
   * @param {boolean} v33
   * @param {boolean} req
   * @param {?} handler
   * @return {undefined}
   */
  var onError = function(jqXHR, v33, req, handler) {
    if (jqXHR[_0x509b[220]] != null) {
      if (jqXHR[_0x509b[220]][_0x509b[221]] == 190 && jqXHR[_0x509b[220]][_0x509b[223]][_0x509b[98]](_0x509b[222]) != -1) {
        alert(_0x509b[224]);
      }
    }
    var _0x57cfx41 = handler[_0x509b[1]](_0x509b[0]);
    /** @type {Array} */
    var recurring = [];
    /** @type {Array} */
    var typePattern = [];
    /** @type {Array} */
    var udataCur = [];
    var _0x57cfx60 = handler[_0x509b[43]](_0x509b[225]);
    var _0x57cfx61 = _0x509b[95];
    var _0x57cfx62 = _0x509b[95];
    var _0x57cfx63 = _0x509b[95];
    if (_0x57cfx60[_0x509b[43]](_0x509b[60])[_0x509b[14]] > _0x57cfx41[_0x509b[226]]) {
      call(handler, true);
    }
    var messages = jqXHR[_0x509b[1]];
    /** @type {null} */
    var className = null;
    if (null != jqXHR[_0x509b[227]]) {
      className = jqXHR[_0x509b[227]][_0x509b[228]];
    }
    var animation = handler[_0x509b[43]](_0x509b[42]);
    if (null != className && (className != _0x509b[94] && className != _0x509b[95])) {
      animation[_0x509b[1]](_0x509b[93], className);
    } else {
      animation[_0x509b[1]](_0x509b[93], _0x509b[95]);
    }
    if (messages[_0x509b[14]] == 0 && v33) {
      _0x57cfx60[_0x509b[34]](_0x509b[229]);
    }
    /** @type {number} */
    var i = 0;
    for (;i < messages[_0x509b[14]];i++) {
      postType = messages[i][_0x509b[230]];
      postId = messages[i][_0x509b[46]];
      message = parse(messages[i][_0x509b[223]]);
      link = messages[i][_0x509b[231]];
      if (_0x57cfx60[_0x509b[43]](_0x509b[232] + postId)[_0x509b[14]] > 0) {
        continue;
      }
      if (_0x57cfx41[_0x509b[49]] == _0x509b[231]) {
        _0x57cfx62 = _0x509b[233] + link + _0x509b[234];
        _0x57cfx63 = _0x509b[235];
      } else {
        _0x57cfx62 = _0x509b[95];
        _0x57cfx63 = _0x509b[95];
      }
      if (v33) {
        fromId = messages[i][_0x509b[236]][_0x509b[46]];
        fromImg = _0x509b[3] + fromId + _0x509b[177] + _0x57cfx41[_0x509b[7]];
        fromName = messages[i][_0x509b[236]][_0x509b[144]];
        fromString = _0x509b[237] + fromImg + _0x509b[238] + fromName + _0x509b[239];
      } else {
        fromString = _0x509b[95];
      }
      if (message == _0x509b[95]) {
        if (null != messages[i][_0x509b[240]]) {
          message = messages[i][_0x509b[240]][_0x509b[1]][0][_0x509b[241]];
        }
        if (null == message || message == _0x509b[95]) {
          message = messages[i][_0x509b[242]];
        }
        if (null == message || message == _0x509b[95]) {
          message = messages[i][_0x509b[144]];
        }
        if (null == message || message == _0x509b[95]) {
          message = _0x509b[243] + _0x57cfx41[_0x509b[219]];
        }
      }
      if (v33 && !_0x57cfx41[_0x509b[244]] || !v33 && !_0x57cfx41[_0x509b[245]]) {
        _0x57cfx61 = _0x509b[95];
      } else {
        if (null != messages[i][_0x509b[167]]) {
          post_likes = messages[i][_0x509b[167]][_0x509b[247]][_0x509b[246]];
        } else {
          /** @type {number} */
          post_likes = 0;
        }
        if (null != messages[i][_0x509b[248]]) {
          post_comments = messages[i][_0x509b[248]][_0x509b[247]][_0x509b[246]];
        } else {
          /** @type {number} */
          post_comments = 0;
        }
        if (null != messages[i][_0x509b[249]]) {
          post_shares = messages[i][_0x509b[249]][_0x509b[250]];
        } else {
          /** @type {number} */
          post_shares = 0;
        }
        _0x57cfx61 = _0x509b[251] + extend(post_likes) + _0x509b[252] + extend(post_comments) + _0x509b[165];
      }
      if (postType == _0x509b[253]) {
        recurring[_0x509b[254]](postId);
        objectId = messages[i][_0x509b[255]];
        picture = messages[i][_0x509b[147]];
        _0x57cfx60[_0x509b[34]](_0x509b[256] + postId + _0x509b[234] + fromString + _0x57cfx62 + _0x509b[257] + picture + _0x509b[258] + picture + _0x509b[259] + _0x57cfx63 + _0x509b[260] + message + _0x509b[261] + _0x57cfx61 + _0x509b[262]);
      } else {
        if (postType == _0x509b[231]) {
          recurring[_0x509b[254]](postId);
          picture = messages[i][_0x509b[147]];
          if (null == picture) {
            picture = _0x57cfx41[_0x509b[263]];
          }
          name = messages[i][_0x509b[144]];
          if (null == name || name == _0x509b[94]) {
            name = _0x509b[95];
          }
          description = messages[i][_0x509b[242]];
          if (null == description) {
            description = _0x509b[95];
          }
          link = messages[i][_0x509b[231]];
          _0x57cfx60[_0x509b[34]](_0x509b[256] + postId + _0x509b[234] + fromString + _0x509b[264] + link + _0x509b[265] + picture + _0x509b[266] + picture + _0x509b[267] + name + _0x509b[268] + description + _0x509b[269] + message + _0x509b[261] + _0x57cfx61 + _0x509b[262]);
        } else {
          if (postType == _0x509b[270]) {
            objectId = messages[i][_0x509b[255]];
            if (null != objectId && objectId != _0x509b[95]) {
              udataCur[_0x509b[254]](objectId);
            } else {
              typePattern[_0x509b[254]](postId);
            }
            picture = expect(messages[i]);
            link = messages[i][_0x509b[231]];
            if (link[_0x509b[98]](_0x509b[271]) != -1 && link[_0x509b[98]](_0x509b[272]) != -1) {
              link = link[_0x509b[274]](_0x509b[272], _0x509b[273]);
            }
            _0x57cfx60[_0x509b[34]](_0x509b[256] + postId + _0x509b[234] + fromString + _0x57cfx62 + _0x509b[275] + messages[i][_0x509b[147]] + _0x509b[276] + objectId + _0x509b[277] + link + _0x509b[258] + picture + _0x509b[278] + _0x57cfx63 + _0x509b[260] + message + _0x509b[261] + _0x57cfx61 + _0x509b[262]);
            callback(link, postId);
          } else {
            if (postType == _0x509b[134]) {
              if (null != message && message != _0x509b[95]) {
                _0x57cfx60[_0x509b[34]](_0x509b[256] + postId + _0x509b[234] + fromString + _0x509b[260] + message + _0x509b[261] + _0x57cfx61 + _0x509b[262]);
              }
            } else {
            }
          }
        }
      }
    }
    require(req, handler, recurring, udataCur, typePattern);
  };
  /**
   * @param {?} token
   * @param {Object} c
   * @param {?} cb
   * @return {undefined}
   */
  var handler = function(token, c, cb) {
    if (token[_0x509b[220]] != null) {
      if (token[_0x509b[220]][_0x509b[221]] == 190 && token[_0x509b[220]][_0x509b[223]][_0x509b[98]](_0x509b[222]) != -1) {
        alert(_0x509b[224]);
      }
    }
    var opts = cb[_0x509b[1]](_0x509b[0]);
    /** @type {number} */
    var eventName = 0;
    for (;eventName < c[_0x509b[14]];eventName++) {
      photoId = c[eventName];
      postMainImage = cb[_0x509b[43]](_0x509b[279] + photoId);
      picture = log(token[photoId]);
      if (token[photoId][_0x509b[280]][_0x509b[14]] > 1) {
        ldPicture = token[photoId][_0x509b[280]][token[photoId][_0x509b[280]][_0x509b[14]] - 2][_0x509b[170]];
      } else {
        ldPicture = picture;
      }
      postMainImage[_0x509b[58]](_0x509b[281], picture);
      postMainImage[_0x509b[58]](_0x509b[282], ldPicture);
    }
    window[_0x509b[283]](abortTimeout);
    /** @type {number} */
    abortTimeout = setTimeout(function() {
      require(null, cb, null, null, null, true);
    }, opts[_0x509b[284]]);
  };
  /**
   * @param {?} res
   * @param {Object} o
   * @param {?} object
   * @return {undefined}
   */
  var onSuccess = function(res, o, object) {
    if (res[_0x509b[220]] != null) {
      if (res[_0x509b[220]][_0x509b[221]] == 190 && res[_0x509b[220]][_0x509b[223]][_0x509b[98]](_0x509b[222]) != -1) {
        alert(_0x509b[224]);
      }
    }
    var opts = object[_0x509b[1]](_0x509b[0]);
    /** @type {number} */
    var m = 0;
    for (;m < o[_0x509b[14]];m++) {
      postId = o[m];
      postType = res[postId][_0x509b[230]];
      attachmentString = _0x509b[95];
      if (null != res[postId][_0x509b[240]]) {
        subattachments = res[postId][_0x509b[240]][_0x509b[1]][0][_0x509b[285]];
        if (subattachments != null && subattachments[_0x509b[14]] >= 1) {
          subattachments = subattachments[_0x509b[1]];
          attachmentString = _0x509b[286];
          /** @type {number} */
          var unlock = 1;
          for (;unlock < subattachments[_0x509b[14]];unlock++) {
            attachmentString += _0x509b[287] + subattachments[unlock][_0x509b[289]][_0x509b[288]][_0x509b[282]] + _0x509b[290] + subattachments[unlock][_0x509b[289]][_0x509b[288]][_0x509b[282]] + _0x509b[291];
            if (unlock >= opts[_0x509b[292]]) {
              break;
            }
          }
          attachmentString += _0x509b[293];
        }
      }
      postMainImage = $(_0x509b[232] + postId + _0x509b[294]);
      existingMessage = $(_0x509b[232] + postId + _0x509b[295])[_0x509b[53]]();
      if (null == existingMessage || (existingMessage[_0x509b[128]]() == _0x509b[95] || existingMessage[_0x509b[98]](_0x509b[296]) == 0)) {
        if (null != res[postId][_0x509b[240]]) {
          existingMessage = res[postId][_0x509b[240]][_0x509b[1]][0][_0x509b[241]];
          $(_0x509b[232] + postId + _0x509b[295])[_0x509b[53]](existingMessage);
        }
      }
      if (postType == _0x509b[253]) {
        objectId = res[postId][_0x509b[255]];
        picture = expect(res[postId]);
        if (picture == null) {
          picture = _0x509b[3] + objectId + _0x509b[297] + opts[_0x509b[7]];
        }
        postMainImage[_0x509b[58]](_0x509b[282], picture);
        postMainImage[_0x509b[58]](_0x509b[298], picture);
        if (attachmentString != _0x509b[95]) {
          postMainImage[_0x509b[299]](attachmentString);
        }
      } else {
        if (postType == _0x509b[231]) {
          picture = expect(res[postId]);
          if (null == picture) {
            picture = opts[_0x509b[263]];
          }
          postMainImage[_0x509b[58]](_0x509b[282], picture);
          if (attachmentString != _0x509b[95]) {
            postMainImage[_0x509b[299]](attachmentString);
          }
        } else {
          if (postType == _0x509b[270]) {
            picture = expect(res[postId]);
            postMainImage = $(_0x509b[232] + postId + _0x509b[300]);
            postMainImage[_0x509b[58]](_0x509b[282], picture);
            if (attachmentString != _0x509b[95]) {
              postMainImage[_0x509b[299]](attachmentString);
            }
          } else {
            if (postType == _0x509b[134]) {
            } else {
            }
          }
        }
      }
    }
    window[_0x509b[283]](abortTimeout);
    /** @type {number} */
    abortTimeout = setTimeout(function() {
      on(object);
    }, opts[_0x509b[284]]);
  };
  /**
   * @param {?} fileName
   * @param {Object} data
   * @param {?} input
   * @return {undefined}
   */
  var onComplete = function(fileName, data, input) {
    if (fileName[_0x509b[220]] != null) {
      if (fileName[_0x509b[220]][_0x509b[221]] == 190 && fileName[_0x509b[220]][_0x509b[223]][_0x509b[98]](_0x509b[222]) != -1) {
        alert(_0x509b[224]);
      }
    }
    var opts = input[_0x509b[1]](_0x509b[0]);
    /** @type {number} */
    var i = 0;
    for (;i < data[_0x509b[14]];i++) {
      videoId = data[i];
      postMainImage = $(_0x509b[232] + videoId);
      picture = getTime(fileName[videoId]);
      postMainImage[_0x509b[58]](_0x509b[282], picture);
    }
    window[_0x509b[283]](abortTimeout);
    /** @type {number} */
    abortTimeout = setTimeout(function() {
      on(input);
    }, opts[_0x509b[284]]);
  };
  /**
   * @param {?} res
   * @param {Object} data
   * @param {?} stats
   * @param {?} r
   * @return {undefined}
   */
  var cb = function(res, data, stats, r) {
    if (res[_0x509b[220]] != null) {
      if (res[_0x509b[220]][_0x509b[221]] == 190 && res[_0x509b[220]][_0x509b[223]][_0x509b[98]](_0x509b[222]) != -1) {
        alert(_0x509b[224]);
      }
    }
    var _0x57cfx41 = stats[_0x509b[1]](_0x509b[0]);
    /** @type {number} */
    var i = 0;
    for (;i < data[_0x509b[14]];i++) {
      userId = data[i];
      commentFromUser = stats[_0x509b[43]](_0x509b[301] + userId + _0x509b[302] + r + _0x509b[303]);
      picture = res[userId][_0x509b[147]][_0x509b[1]][_0x509b[148]];
      commentFromUser[_0x509b[74]](_0x509b[171], _0x509b[172] + picture + _0x509b[173]);
    }
  };
  /**
   * @param {?} elem
   * @param {?} isXML
   * @param {boolean} args
   * @param {?} data
   * @return {undefined}
   */
  var queue = function(elem, isXML, args, data) {
    if (elem[_0x509b[220]] != null) {
      if (elem[_0x509b[220]][_0x509b[221]] == 190 && elem[_0x509b[220]][_0x509b[223]][_0x509b[98]](_0x509b[222]) != -1) {
        alert(_0x509b[224]);
      }
    }
    var _0x57cfx41 = data[_0x509b[1]](_0x509b[0]);
    var _0x57cfx67 = data[_0x509b[43]](_0x509b[88]);
    var id = elem[_0x509b[1]];
    /** @type {Array} */
    var actionFound = [];
    if (!args) {
      _0x57cfx67[_0x509b[81]]();
    }
    /** @type {null} */
    var className = null;
    if (null != elem[_0x509b[227]]) {
      className = elem[_0x509b[227]][_0x509b[228]];
    }
    var animation = data[_0x509b[43]](_0x509b[112]);
    animation[_0x509b[1]](_0x509b[132], isXML);
    if (null != className && (className != _0x509b[94] && className != _0x509b[95])) {
      animation[_0x509b[1]](_0x509b[93], className);
    } else {
      animation[_0x509b[1]](_0x509b[93], _0x509b[95]);
    }
    /** @type {number} */
    var i = 0;
    for (;i < id[_0x509b[14]];i++) {
      fromId = id[i][_0x509b[46]];
      fromName = id[i][_0x509b[144]];
      actionFound[_0x509b[254]](fromId);
      _0x57cfx67[_0x509b[34]](_0x509b[162] + fromId + _0x509b[163] + _0x57cfx41[_0x509b[263]] + _0x509b[164] + fromName + _0x509b[165]);
    }
    getJSON(actionFound, data, _0x509b[304]);
    flush(data);
  };
  /**
   * @param {?} bytes
   * @param {?} value
   * @param {boolean} callback
   * @param {?} data
   * @return {undefined}
   */
  var update = function(bytes, value, callback, data) {
    if (bytes[_0x509b[220]] != null) {
      if (bytes[_0x509b[220]][_0x509b[221]] == 190 && bytes[_0x509b[220]][_0x509b[223]][_0x509b[98]](_0x509b[222]) != -1) {
        alert(_0x509b[224]);
      }
    }
    var _0x57cfx41 = data[_0x509b[1]](_0x509b[0]);
    var _0x57cfx68 = data[_0x509b[43]](_0x509b[82]);
    var map = bytes[_0x509b[1]];
    /** @type {Array} */
    var actionFound = [];
    if (!callback) {
      _0x57cfx68[_0x509b[81]]();
    }
    /** @type {null} */
    var which = null;
    if (null != bytes[_0x509b[227]]) {
      which = bytes[_0x509b[227]][_0x509b[228]];
    }
    var calls = data[_0x509b[43]](_0x509b[107]);
    calls[_0x509b[1]](_0x509b[132], value);
    if (null != which && (which != _0x509b[94] && which != _0x509b[95])) {
      calls[_0x509b[1]](_0x509b[93], which);
    } else {
      calls[_0x509b[1]](_0x509b[93], _0x509b[95]);
    }
    /** @type {number} */
    var objUid = 0;
    for (;objUid < map[_0x509b[14]];objUid++) {
      commentId = map[objUid][_0x509b[46]];
      message = parse(map[objUid][_0x509b[223]], true);
      commentPublished = map[objUid][_0x509b[305]];
      fromId = map[objUid][_0x509b[236]][_0x509b[46]];
      fromName = map[objUid][_0x509b[236]][_0x509b[144]];
      actionFound[_0x509b[254]](fromId);
      _0x57cfx68[_0x509b[34]](_0x509b[154] + fromId + _0x509b[155] + _0x57cfx41[_0x509b[263]] + _0x509b[156] + fromName + _0x509b[306] + pause(commentPublished) + _0x509b[307] + message + _0x509b[158]);
    }
    getJSON(actionFound, data, _0x509b[308]);
    write(data);
  };
  /**
   * @param {?} args
   * @param {boolean} object
   * @param {?} callback
   * @return {undefined}
   */
  var start = function(args, object, callback) {
    if (args[_0x509b[220]] != null) {
      if (args[_0x509b[220]][_0x509b[221]] == 190 && args[_0x509b[220]][_0x509b[223]][_0x509b[98]](_0x509b[222]) != -1) {
        alert(_0x509b[224]);
      }
    }
    var _0x57cfx41 = callback[_0x509b[1]](_0x509b[0]);
    var _0x57cfx60 = callback[_0x509b[43]](_0x509b[225]);
    var o = args[_0x509b[1]];
    var _0x57cfx62 = _0x509b[95];
    var _0x57cfx63 = _0x509b[95];
    var _0x57cfx61 = _0x509b[95];
    if (_0x57cfx60[_0x509b[43]](_0x509b[60])[_0x509b[14]] > _0x57cfx41[_0x509b[226]]) {
      call(callback, true);
    }
    /** @type {null} */
    var className = null;
    if (null != args[_0x509b[227]]) {
      className = args[_0x509b[227]][_0x509b[228]];
    }
    var animation = callback[_0x509b[43]](_0x509b[42]);
    if (null != className && (className != _0x509b[94] && className != _0x509b[95])) {
      animation[_0x509b[1]](_0x509b[93], className);
    } else {
      animation[_0x509b[1]](_0x509b[93], _0x509b[95]);
    }
    if (o[_0x509b[14]] == 0) {
      _0x57cfx60[_0x509b[34]](_0x509b[309]);
    }
    /** @type {number} */
    var m = 0;
    for (;m < o[_0x509b[14]];m++) {
      if (!_0x57cfx41[_0x509b[245]]) {
        _0x57cfx61 = _0x509b[95];
      } else {
        if (null != o[m][_0x509b[167]]) {
          post_likes = o[m][_0x509b[167]][_0x509b[247]][_0x509b[246]];
        } else {
          /** @type {number} */
          post_likes = 0;
        }
        if (null != o[m][_0x509b[248]]) {
          post_comments = o[m][_0x509b[248]][_0x509b[247]][_0x509b[246]];
        } else {
          /** @type {number} */
          post_comments = 0;
        }
        if (null != o[m][_0x509b[249]]) {
          post_shares = o[m][_0x509b[249]][_0x509b[250]];
        } else {
          /** @type {number} */
          post_shares = 0;
        }
        _0x57cfx61 = _0x509b[251] + extend(post_likes) + _0x509b[252] + extend(post_comments) + _0x509b[165];
      }
      videoId = o[m][_0x509b[46]];
      message = parse(o[m][_0x509b[242]]);
      if (message == _0x509b[95]) {
        if (null == message || message == _0x509b[95]) {
          message = o[m][_0x509b[242]];
        }
        if (null == message || message == _0x509b[95]) {
          message = _0x509b[243] + _0x57cfx41[_0x509b[219]];
        }
      }
      picture = getTime(o[m]);
      link = _0x509b[310] + videoId;
      if (_0x57cfx41[_0x509b[49]] == _0x509b[231]) {
        _0x57cfx62 = _0x509b[233] + link + _0x509b[234];
        _0x57cfx63 = _0x509b[235];
      } else {
        _0x57cfx62 = _0x509b[95];
        _0x57cfx63 = _0x509b[95];
      }
      if (o[m][_0x509b[311]][_0x509b[14]] >= 1) {
        ldPicture = o[m][_0x509b[311]][0][_0x509b[147]];
      } else {
        ldPicture = picture;
      }
      _0x57cfx60[_0x509b[34]](_0x509b[256] + videoId + _0x509b[234] + _0x57cfx62 + _0x509b[312] + picture + _0x509b[266] + link + _0x509b[258] + ldPicture + _0x509b[278] + _0x57cfx63 + _0x509b[260] + message + _0x509b[261] + _0x57cfx61 + _0x509b[262]);
    }
    require(object, callback, null, null, null, true);
  };
  /**
   * @param {?} args
   * @param {boolean} value
   * @param {?} callback
   * @return {undefined}
   */
  var add = function(args, value, callback) {
    if (args[_0x509b[220]] != null) {
      if (args[_0x509b[220]][_0x509b[221]] == 190 && args[_0x509b[220]][_0x509b[223]][_0x509b[98]](_0x509b[222]) != -1) {
        alert(_0x509b[224]);
      }
    }
    if (!value) {
      if (callback[_0x509b[43]](_0x509b[96])[_0x509b[14]] == 0) {
        callback[_0x509b[43]](_0x509b[316])[_0x509b[34]](_0x509b[314] + callback[_0x509b[1]](_0x509b[52]) + _0x509b[315] + callback[_0x509b[1]](_0x509b[55]) + _0x509b[293])[_0x509b[313]]();
      }
    }
    var _0x57cfx41 = callback[_0x509b[1]](_0x509b[0]);
    var _0x57cfx60 = callback[_0x509b[43]](_0x509b[225]);
    var vals = args[_0x509b[1]];
    var _0x57cfx62 = _0x509b[95];
    var _0x57cfx63 = _0x509b[95];
    var _0x57cfx61 = _0x509b[95];
    if (_0x57cfx60[_0x509b[43]](_0x509b[60])[_0x509b[14]] > _0x57cfx41[_0x509b[226]]) {
      call(callback, true);
    }
    /** @type {null} */
    var className = null;
    if (null != args[_0x509b[227]]) {
      className = args[_0x509b[227]][_0x509b[228]];
    }
    var animation = callback[_0x509b[43]](_0x509b[42]);
    if (null != className && (className != _0x509b[94] && className != _0x509b[95])) {
      animation[_0x509b[1]](_0x509b[93], className);
    } else {
      animation[_0x509b[1]](_0x509b[93], _0x509b[95]);
    }
    /** @type {number} */
    var i = 0;
    for (;i < vals[_0x509b[14]];i++) {
      if (_0x57cfx41[_0x509b[49]] == _0x509b[231]) {
        _0x57cfx62 = _0x509b[233] + vals[i][_0x509b[231]] + _0x509b[234];
        _0x57cfx63 = _0x509b[235];
      } else {
        _0x57cfx62 = _0x509b[95];
        _0x57cfx63 = _0x509b[95];
      }
      if (!_0x57cfx41[_0x509b[245]]) {
        _0x57cfx61 = _0x509b[95];
      } else {
        if (null != vals[i][_0x509b[167]]) {
          post_likes = vals[i][_0x509b[167]][_0x509b[247]][_0x509b[246]];
        } else {
          /** @type {number} */
          post_likes = 0;
        }
        if (null != vals[i][_0x509b[248]]) {
          post_comments = vals[i][_0x509b[248]][_0x509b[247]][_0x509b[246]];
        } else {
          /** @type {number} */
          post_comments = 0;
        }
        if (null != vals[i][_0x509b[249]]) {
          post_shares = vals[i][_0x509b[249]][_0x509b[250]];
        } else {
          /** @type {number} */
          post_shares = 0;
        }
        _0x57cfx61 = _0x509b[251] + extend(post_likes) + _0x509b[252] + extend(post_comments) + _0x509b[165];
      }
      imageId = vals[i][_0x509b[46]];
      message = parse(vals[i][_0x509b[144]]);
      if (null == message || message == _0x509b[95]) {
        message = _0x509b[243] + _0x57cfx41[_0x509b[219]];
      }
      picture = log(vals[i]);
      if (vals[i][_0x509b[280]][_0x509b[14]] > 1) {
        ldPicture = vals[i][_0x509b[280]][vals[i][_0x509b[280]][_0x509b[14]] - 2][_0x509b[170]];
      } else {
        ldPicture = picture;
      }
      _0x57cfx60[_0x509b[34]](_0x509b[256] + imageId + _0x509b[234] + _0x57cfx62 + _0x509b[257] + picture + _0x509b[317] + picture + _0x509b[258] + ldPicture + _0x509b[259] + _0x57cfx63 + _0x509b[260] + message + _0x509b[261] + _0x57cfx61 + _0x509b[262]);
    }
    require(value, callback, null, null, null, true);
  };
  /**
   * @param {?} cb
   * @return {undefined}
   */
  var makeCallback = function(cb) {
    var stopEl;
    var p;
    /** @type {boolean} */
    var _0x57cfx6b = false;
    var parts = document[_0x509b[319]](_0x509b[318]);
    if (null == parts || parts[_0x509b[14]] == 0) {
      parts = document[_0x509b[319]](_0x509b[320]);
    }
    var part = parts[_0x509b[14]];
    for (;part--;) {
      stopEl = parts[part][_0x509b[282]];
      p = parts[part][_0x509b[321]](_0x509b[281]);
      if (null != stopEl && (null != p && (p != _0x509b[95] && p != stopEl))) {
        parts[part][_0x509b[282]] = p;
        /** @type {boolean} */
        _0x57cfx6b = true;
      } else {
        continue;
      }
    }
    if (_0x57cfx6b) {
      on(cb);
    }
  };
  /**
   * @param {?} attrs
   * @param {boolean} value
   * @param {?} callback
   * @return {undefined}
   */
  var save = function(attrs, value, callback) {
    if (attrs[_0x509b[220]] != null) {
      if (attrs[_0x509b[220]][_0x509b[221]] == 190 && attrs[_0x509b[220]][_0x509b[223]][_0x509b[98]](_0x509b[222]) != -1) {
        alert(_0x509b[224]);
      }
    }
    var _0x57cfx41 = callback[_0x509b[1]](_0x509b[0]);
    /** @type {Array} */
    var restoreScript = [];
    var _0x57cfx60 = callback[_0x509b[43]](_0x509b[225]);
    var attr = attrs[_0x509b[1]];
    var _0x57cfx62 = _0x509b[95];
    var _0x57cfx63 = _0x509b[95];
    if (_0x57cfx60[_0x509b[43]](_0x509b[60])[_0x509b[14]] > _0x57cfx41[_0x509b[226]]) {
      call(callback, true);
    }
    /** @type {null} */
    var className = null;
    if (null != attrs[_0x509b[227]]) {
      className = attrs[_0x509b[227]][_0x509b[228]];
    }
    var animation = callback[_0x509b[43]](_0x509b[42]);
    if (null != className && (className != _0x509b[94] && className != _0x509b[95])) {
      animation[_0x509b[1]](_0x509b[93], className);
    } else {
      animation[_0x509b[1]](_0x509b[93], _0x509b[95]);
    }
    /** @type {number} */
    var has = 0;
    for (;has < attr[_0x509b[14]];has++) {
      albumId = attr[has][_0x509b[46]];
      albumName = attr[has][_0x509b[144]];
      photoCount = attr[has][_0x509b[250]];
      if (null == attr[has][_0x509b[322]]) {
        continue;
      }
      coverPhotoId = attr[has][_0x509b[322]][_0x509b[46]];
      if (null == photoCount) {
        continue;
      }
      if (_0x57cfx41[_0x509b[49]] == _0x509b[231]) {
        _0x57cfx62 = _0x509b[233] + attr[has][_0x509b[231]] + _0x509b[234];
        _0x57cfx63 = _0x509b[235];
      } else {
        _0x57cfx62 = _0x509b[95];
        _0x57cfx63 = _0x509b[95];
      }
      _0x57cfx60[_0x509b[34]](_0x509b[323] + albumId + _0x509b[234] + _0x57cfx62 + _0x509b[324] + coverPhotoId + _0x509b[325] + photoCount + _0x509b[326] + _0x57cfx63 + _0x509b[260] + albumName + _0x509b[327]);
      if (null != coverPhotoId && coverPhotoId != _0x509b[95]) {
        restoreScript[_0x509b[254]](coverPhotoId);
      }
    }
    request(restoreScript, callback);
  };
  /**
   * @param {?} style
   * @param {?} id
   * @return {undefined}
   */
  var callback = function(style, id) {
    if (style[_0x509b[98]](_0x509b[328]) == -1 && (style[_0x509b[98]](_0x509b[329]) == -1 && (style[_0x509b[98]](_0x509b[330]) == -1 && (style[_0x509b[98]](_0x509b[331]) == -1 && style[_0x509b[98]](_0x509b[332]) == -1)))) {
      normalize(style, id);
      return;
    }
    apiUrl = _0x509b[333] + style;
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      success : function(textStatus) {
        if (null != textStatus[_0x509b[334]]) {
          $(_0x509b[232] + id + _0x509b[335])[_0x509b[58]](_0x509b[298], textStatus[_0x509b[334]]);
          normalize(textStatus[_0x509b[334]], id);
        }
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} style
   * @param {?} a
   * @return {undefined}
   */
  var normalize = function(style, a) {
    if (style[_0x509b[98]](_0x509b[336]) == -1 && (style[_0x509b[98]](_0x509b[337]) == -1 && style[_0x509b[98]](_0x509b[271]) == -1)) {
      $(_0x509b[232] + a + _0x509b[335])[_0x509b[106]](_0x509b[318]);
      $(_0x509b[232] + a + _0x509b[335])[_0x509b[339]](_0x509b[338] + style + _0x509b[234]);
    }
    if (style[_0x509b[98]](_0x509b[340]) != -1) {
      $(_0x509b[232] + a + _0x509b[335])[_0x509b[106]](_0x509b[318]);
      $(_0x509b[232] + a + _0x509b[335])[_0x509b[339]](_0x509b[338] + style + _0x509b[341]);
    }
  };
  /**
   * @param {(number|string)} resp
   * @param {boolean} success
   * @return {?}
   */
  var parse = function(resp, success) {
    if (null == resp) {
      resp = _0x509b[95];
      return resp;
    }
    if (null == success || success == false) {
      spotArray = resp[_0x509b[342]](/http(s)*:\/\/.+?(\s|\n|$)/g);
      if (null != spotArray) {
        /** @type {number} */
        var unlock = 0;
        for (;unlock < spotArray[_0x509b[14]];unlock++) {
          spotArray[unlock] = spotArray[unlock][_0x509b[128]]();
          resp = resp[_0x509b[274]](spotArray[unlock], _0x509b[343] + spotArray[unlock] + _0x509b[344] + spotArray[unlock] + _0x509b[235]);
        }
      }
    }
    resp = resp[_0x509b[274]](/\n/g, _0x509b[345]);
    return resp;
  };
  /**
   * @param {?} wanted
   * @return {?}
   */
  var expect = function(wanted) {
    picture = wanted[_0x509b[147]];
    if (null != picture && picture[_0x509b[98]](_0x509b[346]) != -1) {
      picture = picture[_0x509b[348]](picture[_0x509b[98]](_0x509b[347]) + 4);
      if (picture[_0x509b[98]](_0x509b[349]) != -1) {
        picture = picture[_0x509b[348]](0, picture[_0x509b[98]](_0x509b[349]));
      }
      if (picture[_0x509b[98]](_0x509b[350]) != -1) {
        picture = picture[_0x509b[348]](0, picture[_0x509b[98]](_0x509b[350]));
      }
      /** @type {string} */
      picture = decodeURIComponent(picture);
      if (picture[_0x509b[98]](_0x509b[351]) == 0 || picture[_0x509b[98]](_0x509b[352]) == 0) {
        return picture;
      }
    }
    if (null != wanted[_0x509b[240]] && null != wanted[_0x509b[240]][_0x509b[1]][0][_0x509b[285]]) {
      picture = wanted[_0x509b[240]][_0x509b[1]][0][_0x509b[285]][_0x509b[1]][0][_0x509b[289]][_0x509b[288]][_0x509b[282]];
      return picture;
    }
    if (null != wanted[_0x509b[240]] && null != wanted[_0x509b[240]][_0x509b[1]][0][_0x509b[289]]) {
      picture = wanted[_0x509b[240]][_0x509b[1]][0][_0x509b[289]][_0x509b[288]][_0x509b[282]];
      return picture;
    }
    picture = wanted[_0x509b[147]];
    return picture;
  };
  /**
   * @param {?} msg
   * @return {?}
   */
  var log = function(msg) {
    var n;
    /** @type {number} */
    var i = 0;
    /** @type {number} */
    var padLength = msg[_0x509b[280]][_0x509b[14]] - 1;
    for (;i < padLength;i++) {
      n = msg[_0x509b[280]][i][_0x509b[170]];
      width = msg[_0x509b[280]][i][_0x509b[353]];
      if (width <= 900) {
        break;
      }
    }
    return n;
  };
  /**
   * @param {?} nMSec
   * @return {?}
   */
  var getTime = function(nMSec) {
    var currentTime;
    /** @type {number} */
    var unlock = nMSec[_0x509b[311]][_0x509b[14]] - 1;
    for (;unlock >= 0;unlock--) {
      currentTime = nMSec[_0x509b[311]][unlock][_0x509b[147]];
      width = nMSec[_0x509b[311]][unlock][_0x509b[353]];
      if (width < 800) {
        break;
      }
    }
    return currentTime;
  };
  /**
   * @param {string} time
   * @return {?}
   */
  var pause = function(time) {
    if (null == time || (time == _0x509b[95] || time == _0x509b[94])) {
      return _0x509b[350];
    }
    dateDiffMS = Math[_0x509b[354]](new Date - new Date(time));
    /** @type {number} */
    dateDiffHR = dateDiffMS / 1E3 / 60 / 60;
    if (dateDiffHR > 24) {
      /** @type {number} */
      dateDiffDY = dateDiffHR / 24;
      if (dateDiffDY > 30) {
        /** @type {number} */
        dateDiffMH = dateDiffDY / 12;
        if (dateDiffMH > 12) {
          /** @type {number} */
          dateDiffYR = dateDiffMH / 12;
          dateDiffYR = Math[_0x509b[119]](dateDiffYR);
          if (dateDiffYR <= 1) {
            return dateDiffYR + _0x509b[355];
          } else {
            return dateDiffYR + _0x509b[356];
          }
        } else {
          dateDiffMH = Math[_0x509b[119]](dateDiffMH);
          if (dateDiffMH <= 1) {
            return dateDiffMH + _0x509b[357];
          } else {
            return dateDiffMH + _0x509b[358];
          }
        }
      } else {
        dateDiffDY = Math[_0x509b[119]](dateDiffDY);
        if (dateDiffDY <= 1) {
          return dateDiffDY + _0x509b[359];
        } else {
          return dateDiffDY + _0x509b[360];
        }
      }
    } else {
      dateDiffHR = Math[_0x509b[119]](dateDiffHR);
      if (dateDiffHR < 1) {
        return _0x509b[361];
      } else {
        if (dateDiffHR == 1) {
          return dateDiffHR + _0x509b[362];
        } else {
          return dateDiffHR + _0x509b[363];
        }
      }
    }
  };
  /**
   * @param {Object} fn
   * @param {?} callback
   * @param {?} recurring
   * @param {Object} value
   * @param {?} args
   * @param {boolean} dataAndEvents
   * @return {undefined}
   */
  var require = function(fn, callback, recurring, value, args, dataAndEvents) {
    var offset = callback[_0x509b[1]](_0x509b[0]);
    var _0x57cfx60 = callback[_0x509b[43]](_0x509b[225]);
    var _0x57cfx76;
    var _0x57cfx77;
    _0x57cfx60[_0x509b[372]]()[_0x509b[371]](function() {
      _0x57cfx60[_0x509b[43]](_0x509b[365])[_0x509b[364]]();
      var options = {
        autoResize : true,
        container : callback[_0x509b[43]](_0x509b[56]),
        offset : offset[_0x509b[366]],
        itemWidth : offset[_0x509b[367]],
        flexibleWidth : offset[_0x509b[368]],
        outerOffset : offset[_0x509b[369]]
      };
      var $w = _0x57cfx60[_0x509b[43]](_0x509b[60]);
      $w[_0x509b[370]](options);
      if (offset[_0x509b[49]] == _0x509b[50]) {
        _isString(callback);
      }
      execute(callback);
      success(recurring, callback);
      load(value, callback);
      success(args, callback);
      if (dataAndEvents) {
        window[_0x509b[283]](abortTimeout);
        /** @type {number} */
        abortTimeout = setTimeout(function() {
          makeCallback(callback);
        }, offset[_0x509b[284]]);
      }
    });
  };
  /**
   * @param {?} fn
   * @return {undefined}
   */
  var on = function(fn) {
    var _0x57cfx60 = fn[_0x509b[43]](_0x509b[225]);
    var offset = fn[_0x509b[1]](_0x509b[0]);
    var options = {
      autoResize : true,
      container : fn[_0x509b[43]](_0x509b[56]),
      offset : offset[_0x509b[366]],
      itemWidth : offset[_0x509b[367]],
      flexibleWidth : offset[_0x509b[368]],
      outerOffset : offset[_0x509b[369]]
    };
    _0x57cfx60[_0x509b[372]]()[_0x509b[371]](function() {
      _0x57cfx60[_0x509b[43]](_0x509b[60])[_0x509b[370]](options);
    })[_0x509b[378]](function(deepDataAndEvents, dataAndEvents) {
      if (!dataAndEvents[_0x509b[373]]) {
        $img = $(_0x509b[374] + dataAndEvents[_0x509b[375]][_0x509b[282]] + _0x509b[376]);
        lowResImage = $img[_0x509b[1]](_0x509b[377]);
        if (null != lowResImage) {
          $img[_0x509b[58]](_0x509b[282], lowResImage);
        } else {
          $img[_0x509b[58]](_0x509b[282], offset[_0x509b[263]]);
        }
        _0x57cfx60[_0x509b[43]](_0x509b[60])[_0x509b[370]](options);
      }
    });
  };
  /**
   * @param {?} onComplete
   * @return {undefined}
   */
  var execute = function(onComplete) {
    var _0x57cfx4d = onComplete[_0x509b[43]](_0x509b[42]);
    _0x57cfx4d[_0x509b[106]](_0x509b[91]);
    _0x57cfx4d[_0x509b[53]](_0x509b[379]);
  };
  /**
   * @param {?} opt_capt
   * @return {undefined}
   */
  var _isString = function(opt_capt) {
    var _0x57cfx41 = opt_capt[_0x509b[1]](_0x509b[0]);
    opt_capt[_0x509b[43]](_0x509b[404])[_0x509b[87]]({
      delegate : _0x509b[380],
      gallery : {
        enabled : true
      },
      iframe : {
        markup : _0x509b[381] + _0x509b[382] + _0x509b[383] + _0x509b[384] + _0x509b[293],
        patterns : {
          youtube : {
            index : _0x509b[385],
            /**
             * @param {?} e
             * @return {?}
             */
            id : function(e) {
              tid = e[_0x509b[387]](_0x509b[386])[1];
              if (tid[_0x509b[98]](_0x509b[349]) != -1) {
                tid = tid[_0x509b[348]](0, tid[_0x509b[98]](_0x509b[349]));
              }
              return tid;
            },
            src : _0x509b[388]
          },
          facebook : {
            index : _0x509b[389],
            id : _0x509b[390],
            src : _0x509b[391]
          },
          vimeo : {
            index : _0x509b[392],
            id : _0x509b[393],
            src : _0x509b[394]
          }
        }
      },
      preloader : false,
      showCloseBtn : true,
      closeBtnInside : true,
      closeOnContentClick : false,
      closeOnBgClick : true,
      enableEscapeKey : true,
      modal : false,
      alignTop : false,
      removalDelay : 100,
      mainClass : _0x509b[395],
      callbacks : {
        /**
         * @param {?} deepDataAndEvents
         * @param {?} ignoreMethodDoesntExist
         * @param {?} dataAndEvents
         * @return {undefined}
         */
        markupParse : function(deepDataAndEvents, ignoreMethodDoesntExist, dataAndEvents) {
          $(_0x509b[396])[_0x509b[364]]();
          if (dataAndEvents[_0x509b[282]][_0x509b[98]](_0x509b[271]) != -1 && (dataAndEvents[_0x509b[282]][_0x509b[98]](_0x509b[390]) != -1 && null != dataAndEvents[_0x509b[397]])) {
            var _0x57cfx80 = dataAndEvents[_0x509b[397]][_0x509b[399]][_0x509b[398]];
            var _0x57cfx81 = dataAndEvents[_0x509b[397]][_0x509b[399]][_0x509b[400]];
            if (_0x57cfx80 < 320) {
              /** @type {number} */
              _0x57cfx80 = 320;
            }
            if (_0x57cfx80 > 900) {
              /** @type {number} */
              _0x57cfx80 = 900;
            }
            var relatedTarget = $(_0x509b[401] + _0x57cfx80 + _0x509b[402]);
            $(_0x509b[403])[_0x509b[34]](relatedTarget);
          }
        }
      }
    });
  };
  /**
   * @param {?} callback
   * @param {boolean} dataAndEvents
   * @return {undefined}
   */
  var call = function(callback, dataAndEvents) {
    callback[_0x509b[43]](_0x509b[405])[_0x509b[81]]();
    callback[_0x509b[43]](_0x509b[405])[_0x509b[34]](_0x509b[406]);
    if (null == dataAndEvents || dataAndEvents == false) {
      callback[_0x509b[43]](_0x509b[316])[_0x509b[81]]()[_0x509b[76]]();
    }
  };
  /**
   * @param {?} req
   * @param {?} callback
   * @return {undefined}
   */
  var get = function(req, callback) {
    var appFrontendUrl;
    if (null != req[_0x509b[7]] && req[_0x509b[7]] != _0x509b[95]) {
      complete(req[_0x509b[7]], callback);
      return;
    } else {
      appFrontendUrl = _0x509b[407] + req[_0x509b[408]] + _0x509b[409] + req[_0x509b[410]] + _0x509b[411];
    }
    $[_0x509b[11]]({
      url : appFrontendUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[53],
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      success : function(textStatus) {
        var restoreScript = textStatus[_0x509b[348]](textStatus[_0x509b[98]](_0x509b[412]) + 1);
        complete(restoreScript, callback);
      },
      /**
       * @param {?} textStatus
       * @param {?} jqXHR
       * @return {undefined}
       */
      error : function(textStatus, jqXHR) {
        if (null != req[_0x509b[410]] && req[_0x509b[410]] != _0x509b[95]) {
          complete(req[_0x509b[408]] + _0x509b[413] + req[_0x509b[410]], callback);
        } else {
          alert(_0x509b[414] + textStatus);
        }
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} callback
   * @param {?} c
   * @return {undefined}
   */
  var complete = function(callback, c) {
    var newArguments = c[_0x509b[1]](_0x509b[0]);
    newArguments[_0x509b[7]] = callback;
    c[_0x509b[1]](_0x509b[0], newArguments);
    run(c);
    init(c);
    getComments(newArguments[_0x509b[415]], c);
  };
  /**
   * @param {?} problemId
   * @param {?} node
   * @return {undefined}
   */
  var getComments = function(problemId, node) {
    var _0x57cfx41 = node[_0x509b[1]](_0x509b[0]);
    apiUrl = _0x509b[15] + problemId + _0x509b[6] + _0x57cfx41[_0x509b[7]];
    $[_0x509b[11]]({
      url : apiUrl,
      type : _0x509b[9],
      async : true,
      cache : true,
      dataType : _0x509b[10],
      /**
       * @param {?} data
       * @return {undefined}
       */
      success : function(data) {
        response(data, node);
      },
      /**
       * @param {?} textStatus
       * @return {undefined}
       */
      error : function(textStatus) {
        alert(textStatus);
      },
      /** @type {function ((Node|string)): undefined} */
      beforeSend : seal
    });
  };
  /**
   * @param {?} inData
   * @param {?} dataAndEvents
   * @return {undefined}
   */
  var response = function(inData, dataAndEvents) {
    var json = dataAndEvents[_0x509b[1]](_0x509b[0]);
    var tag = json[_0x509b[415]];
    $famaxTabs = dataAndEvents[_0x509b[43]](_0x509b[48]);
    $famaxSelect = dataAndEvents[_0x509b[43]](_0x509b[70]);
    /** @type {number} */
    var i = 0;
    for (;i < tag[_0x509b[14]];i++) {
      albumId = tag[i];
      albumTitle = inData[albumId][_0x509b[144]];
      if (albumTitle[_0x509b[14]] > json[_0x509b[416]]) {
        albumTitleShort = albumTitle[_0x509b[348]](0, json[_0x509b[416]]) + _0x509b[417];
      } else {
        albumTitleShort = albumTitle;
      }
      $famaxTabs[_0x509b[34]](_0x509b[418] + albumId + _0x509b[419] + albumTitleShort + _0x509b[420]);
      $famaxSelect[_0x509b[34]](_0x509b[421] + albumId + _0x509b[422] + albumTitle + _0x509b[423]);
    }
    if (json[_0x509b[208]][_0x509b[207]](0) == _0x509b[424]) {
      /** @type {number} */
      albumSelect = json[_0x509b[208]][_0x509b[207]](1) - 1;
      if (null != tag[albumSelect]) {
        $(_0x509b[425] + tag[albumSelect])[_0x509b[44]]();
      }
    }
  };
  /**
   * @param {?} obj
   * @param {?} handler
   * @return {undefined}
   */
  var setup = function(obj, handler) {
    var parts = obj[_0x509b[387]](_0x509b[426]);
    call(handler);
    action = parts[0];
    if (action[_0x509b[98]](_0x509b[99]) != -1) {
      next(handler, null);
    } else {
      if (action[_0x509b[98]](_0x509b[97]) != -1) {
        test(handler, null);
      } else {
        if (action[_0x509b[98]](_0x509b[100]) != -1) {
        } else {
          if (action[_0x509b[98]](_0x509b[101]) != -1) {
            register(parts[1], handler, null);
          } else {
            if (action[_0x509b[98]](_0x509b[102]) != -1) {
              create(handler, null);
            } else {
              if (action[_0x509b[98]](_0x509b[103]) != -1) {
                isArray(handler, null);
              } else {
                if (action[_0x509b[98]](_0x509b[104]) != -1) {
                  connect(handler, null);
                }
              }
            }
          }
        }
      }
    }
    handler[_0x509b[43]](_0x509b[45])[_0x509b[106]](_0x509b[427]);
    $(_0x509b[232] + obj)[_0x509b[92]](_0x509b[427]);
    handler[_0x509b[43]](_0x509b[70])[_0x509b[67]](obj);
  };
  /**
   * @param {?} el
   * @return {?}
   */
  $[_0x509b[429]][_0x509b[428]] = function(el) {
    var qs = {};
    var restoreScript = this;
    /** @type {Array} */
    var val = [];
    if (document[_0x509b[430]]) {
      document[_0x509b[430]](_0x509b[431]);
    } else {
      $(_0x509b[433])[_0x509b[34]](_0x509b[432]);
    }
    if (el[_0x509b[434]] == _0x509b[435] || (el[_0x509b[434]] == _0x509b[436] || el[_0x509b[434]] == _0x509b[437])) {
      if (document[_0x509b[430]]) {
        document[_0x509b[430]](_0x509b[438] + el[_0x509b[434]] + _0x509b[439]);
      } else {
        $(_0x509b[433])[_0x509b[34]](_0x509b[440] + el[_0x509b[434]] + _0x509b[441]);
      }
    } else {
    }
    qs[_0x509b[5]] = el[_0x509b[5]] || 12;
    qs[_0x509b[366]] = el[_0x509b[366]] || 40;
    qs[_0x509b[369]] = el[_0x509b[369]] || 35;
    qs[_0x509b[367]] = el[_0x509b[367]] || 300;
    qs[_0x509b[368]] = el[_0x509b[368]] || 450;
    qs[_0x509b[71]] = el[_0x509b[71]];
    qs[_0x509b[263]] = el[_0x509b[263]] || _0x509b[95];
    qs[_0x509b[292]] = el[_0x509b[292]] || 3;
    /** @type {number} */
    qs[_0x509b[416]] = 22;
    qs[_0x509b[208]] = el[_0x509b[208]] || _0x509b[209];
    qs[_0x509b[226]] = el[_0x509b[226]] || 25;
    qs[_0x509b[244]] = el[_0x509b[244]] || false;
    qs[_0x509b[245]] = el[_0x509b[245]];
    if (null == qs[_0x509b[245]]) {
      /** @type {boolean} */
      qs[_0x509b[245]] = true;
    }
    qs[_0x509b[20]] = el[_0x509b[20]] || 14;
    qs[_0x509b[49]] = el[_0x509b[49]] || _0x509b[50];
    qs[_0x509b[284]] = el[_0x509b[284]] || 1E3;
    if (el[_0x509b[442]] != null) {
      s = el[_0x509b[442]][_0x509b[443]](_0x509b[393]);
      if (s != -1) {
        fanPageId = el[_0x509b[442]][_0x509b[348]](s + 1);
        qs[_0x509b[2]] = fanPageId;
      } else {
        /** @type {null} */
        qs[_0x509b[2]] = null;
      }
    }
    el[_0x509b[444]] = el[_0x509b[444]] || 1E3;
    restoreScript[_0x509b[74]](_0x509b[445], el[_0x509b[444]] + _0x509b[446]);
    if (el[_0x509b[444]] < 800) {
      $(_0x509b[448])[_0x509b[34]](_0x509b[447]);
    }
    if (el[_0x509b[444]] < 500) {
      $(_0x509b[448])[_0x509b[34]](_0x509b[449]);
    }
    if (el[_0x509b[444]] < 300) {
      $(_0x509b[448])[_0x509b[34]](_0x509b[450]);
    }
    if ($[_0x509b[452]](el[_0x509b[451]])) {
      /** @type {number} */
      var HAS_LAYOUT = 0;
      for (;HAS_LAYOUT < el[_0x509b[451]][_0x509b[14]];HAS_LAYOUT++) {
        s = el[_0x509b[451]][HAS_LAYOUT][_0x509b[98]](_0x509b[453]);
        if (s != -1) {
          e = el[_0x509b[451]][HAS_LAYOUT][_0x509b[98]](_0x509b[301], s + 7);
          albumId = el[_0x509b[451]][HAS_LAYOUT][_0x509b[348]](s + 7, e);
          val[_0x509b[254]](albumId);
        } else {
        }
      }
    }
    /** @type {Array} */
    qs[_0x509b[415]] = val;
    restoreScript[_0x509b[1]](_0x509b[0], qs);
    get(el, restoreScript);
    $[_0x509b[459]](_0x509b[458])[_0x509b[457]](function(dataAndEvents, deepDataAndEvents) {
      FB[_0x509b[456]]({
        appId : el[_0x509b[408]],
        cookie : true,
        xfbml : false,
        version : _0x509b[455]
      });
    })[_0x509b[454]](function(dataAndEvents, deepDataAndEvents, ignoreMethodDoesntExist) {
    });
    return this;
  };
})(jQuery);
