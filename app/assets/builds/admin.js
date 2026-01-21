(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn2, res) => function __init() {
    return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@rails/actioncable/src/adapters.js
  var adapters_default;
  var init_adapters = __esm({
    "node_modules/@rails/actioncable/src/adapters.js"() {
      adapters_default = {
        logger: typeof console !== "undefined" ? console : void 0,
        WebSocket: typeof WebSocket !== "undefined" ? WebSocket : void 0
      };
    }
  });

  // node_modules/@rails/actioncable/src/logger.js
  var logger_default;
  var init_logger = __esm({
    "node_modules/@rails/actioncable/src/logger.js"() {
      init_adapters();
      logger_default = {
        log(...messages) {
          if (this.enabled) {
            messages.push(Date.now());
            adapters_default.logger.log("[ActionCable]", ...messages);
          }
        }
      };
    }
  });

  // node_modules/@rails/actioncable/src/connection_monitor.js
  var now, secondsSince, ConnectionMonitor, connection_monitor_default;
  var init_connection_monitor = __esm({
    "node_modules/@rails/actioncable/src/connection_monitor.js"() {
      init_logger();
      now = () => (/* @__PURE__ */ new Date()).getTime();
      secondsSince = (time) => (now() - time) / 1e3;
      ConnectionMonitor = class {
        constructor(connection) {
          this.visibilityDidChange = this.visibilityDidChange.bind(this);
          this.connection = connection;
          this.reconnectAttempts = 0;
        }
        start() {
          if (!this.isRunning()) {
            this.startedAt = now();
            delete this.stoppedAt;
            this.startPolling();
            addEventListener("visibilitychange", this.visibilityDidChange);
            logger_default.log(`ConnectionMonitor started. stale threshold = ${this.constructor.staleThreshold} s`);
          }
        }
        stop() {
          if (this.isRunning()) {
            this.stoppedAt = now();
            this.stopPolling();
            removeEventListener("visibilitychange", this.visibilityDidChange);
            logger_default.log("ConnectionMonitor stopped");
          }
        }
        isRunning() {
          return this.startedAt && !this.stoppedAt;
        }
        recordMessage() {
          this.pingedAt = now();
        }
        recordConnect() {
          this.reconnectAttempts = 0;
          delete this.disconnectedAt;
          logger_default.log("ConnectionMonitor recorded connect");
        }
        recordDisconnect() {
          this.disconnectedAt = now();
          logger_default.log("ConnectionMonitor recorded disconnect");
        }
        // Private
        startPolling() {
          this.stopPolling();
          this.poll();
        }
        stopPolling() {
          clearTimeout(this.pollTimeout);
        }
        poll() {
          this.pollTimeout = setTimeout(
            () => {
              this.reconnectIfStale();
              this.poll();
            },
            this.getPollInterval()
          );
        }
        getPollInterval() {
          const { staleThreshold, reconnectionBackoffRate } = this.constructor;
          const backoff = Math.pow(1 + reconnectionBackoffRate, Math.min(this.reconnectAttempts, 10));
          const jitterMax = this.reconnectAttempts === 0 ? 1 : reconnectionBackoffRate;
          const jitter = jitterMax * Math.random();
          return staleThreshold * 1e3 * backoff * (1 + jitter);
        }
        reconnectIfStale() {
          if (this.connectionIsStale()) {
            logger_default.log(`ConnectionMonitor detected stale connection. reconnectAttempts = ${this.reconnectAttempts}, time stale = ${secondsSince(this.refreshedAt)} s, stale threshold = ${this.constructor.staleThreshold} s`);
            this.reconnectAttempts++;
            if (this.disconnectedRecently()) {
              logger_default.log(`ConnectionMonitor skipping reopening recent disconnect. time disconnected = ${secondsSince(this.disconnectedAt)} s`);
            } else {
              logger_default.log("ConnectionMonitor reopening");
              this.connection.reopen();
            }
          }
        }
        get refreshedAt() {
          return this.pingedAt ? this.pingedAt : this.startedAt;
        }
        connectionIsStale() {
          return secondsSince(this.refreshedAt) > this.constructor.staleThreshold;
        }
        disconnectedRecently() {
          return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.constructor.staleThreshold;
        }
        visibilityDidChange() {
          if (document.visibilityState === "visible") {
            setTimeout(
              () => {
                if (this.connectionIsStale() || !this.connection.isOpen()) {
                  logger_default.log(`ConnectionMonitor reopening stale connection on visibilitychange. visibilityState = ${document.visibilityState}`);
                  this.connection.reopen();
                }
              },
              200
            );
          }
        }
      };
      ConnectionMonitor.staleThreshold = 6;
      ConnectionMonitor.reconnectionBackoffRate = 0.15;
      connection_monitor_default = ConnectionMonitor;
    }
  });

  // node_modules/@rails/actioncable/src/internal.js
  var internal_default;
  var init_internal = __esm({
    "node_modules/@rails/actioncable/src/internal.js"() {
      internal_default = {
        "message_types": {
          "welcome": "welcome",
          "disconnect": "disconnect",
          "ping": "ping",
          "confirmation": "confirm_subscription",
          "rejection": "reject_subscription"
        },
        "disconnect_reasons": {
          "unauthorized": "unauthorized",
          "invalid_request": "invalid_request",
          "server_restart": "server_restart",
          "remote": "remote"
        },
        "default_mount_path": "/cable",
        "protocols": [
          "actioncable-v1-json",
          "actioncable-unsupported"
        ]
      };
    }
  });

  // node_modules/@rails/actioncable/src/connection.js
  var message_types, protocols, supportedProtocols, indexOf, Connection, connection_default;
  var init_connection = __esm({
    "node_modules/@rails/actioncable/src/connection.js"() {
      init_adapters();
      init_connection_monitor();
      init_internal();
      init_logger();
      ({ message_types, protocols } = internal_default);
      supportedProtocols = protocols.slice(0, protocols.length - 1);
      indexOf = [].indexOf;
      Connection = class {
        constructor(consumer2) {
          this.open = this.open.bind(this);
          this.consumer = consumer2;
          this.subscriptions = this.consumer.subscriptions;
          this.monitor = new connection_monitor_default(this);
          this.disconnected = true;
        }
        send(data) {
          if (this.isOpen()) {
            this.webSocket.send(JSON.stringify(data));
            return true;
          } else {
            return false;
          }
        }
        open() {
          if (this.isActive()) {
            logger_default.log(`Attempted to open WebSocket, but existing socket is ${this.getState()}`);
            return false;
          } else {
            const socketProtocols = [...protocols, ...this.consumer.subprotocols || []];
            logger_default.log(`Opening WebSocket, current state is ${this.getState()}, subprotocols: ${socketProtocols}`);
            if (this.webSocket) {
              this.uninstallEventHandlers();
            }
            this.webSocket = new adapters_default.WebSocket(this.consumer.url, socketProtocols);
            this.installEventHandlers();
            this.monitor.start();
            return true;
          }
        }
        close({ allowReconnect } = { allowReconnect: true }) {
          if (!allowReconnect) {
            this.monitor.stop();
          }
          if (this.isOpen()) {
            return this.webSocket.close();
          }
        }
        reopen() {
          logger_default.log(`Reopening WebSocket, current state is ${this.getState()}`);
          if (this.isActive()) {
            try {
              return this.close();
            } catch (error2) {
              logger_default.log("Failed to reopen WebSocket", error2);
            } finally {
              logger_default.log(`Reopening WebSocket in ${this.constructor.reopenDelay}ms`);
              setTimeout(this.open, this.constructor.reopenDelay);
            }
          } else {
            return this.open();
          }
        }
        getProtocol() {
          if (this.webSocket) {
            return this.webSocket.protocol;
          }
        }
        isOpen() {
          return this.isState("open");
        }
        isActive() {
          return this.isState("open", "connecting");
        }
        triedToReconnect() {
          return this.monitor.reconnectAttempts > 0;
        }
        // Private
        isProtocolSupported() {
          return indexOf.call(supportedProtocols, this.getProtocol()) >= 0;
        }
        isState(...states) {
          return indexOf.call(states, this.getState()) >= 0;
        }
        getState() {
          if (this.webSocket) {
            for (let state in adapters_default.WebSocket) {
              if (adapters_default.WebSocket[state] === this.webSocket.readyState) {
                return state.toLowerCase();
              }
            }
          }
          return null;
        }
        installEventHandlers() {
          for (let eventName in this.events) {
            const handler = this.events[eventName].bind(this);
            this.webSocket[`on${eventName}`] = handler;
          }
        }
        uninstallEventHandlers() {
          for (let eventName in this.events) {
            this.webSocket[`on${eventName}`] = function() {
            };
          }
        }
      };
      Connection.reopenDelay = 500;
      Connection.prototype.events = {
        message(event) {
          if (!this.isProtocolSupported()) {
            return;
          }
          const { identifier, message, reason, reconnect, type } = JSON.parse(event.data);
          this.monitor.recordMessage();
          switch (type) {
            case message_types.welcome:
              if (this.triedToReconnect()) {
                this.reconnectAttempted = true;
              }
              this.monitor.recordConnect();
              return this.subscriptions.reload();
            case message_types.disconnect:
              logger_default.log(`Disconnecting. Reason: ${reason}`);
              return this.close({ allowReconnect: reconnect });
            case message_types.ping:
              return null;
            case message_types.confirmation:
              this.subscriptions.confirmSubscription(identifier);
              if (this.reconnectAttempted) {
                this.reconnectAttempted = false;
                return this.subscriptions.notify(identifier, "connected", { reconnected: true });
              } else {
                return this.subscriptions.notify(identifier, "connected", { reconnected: false });
              }
            case message_types.rejection:
              return this.subscriptions.reject(identifier);
            default:
              return this.subscriptions.notify(identifier, "received", message);
          }
        },
        open() {
          logger_default.log(`WebSocket onopen event, using '${this.getProtocol()}' subprotocol`);
          this.disconnected = false;
          if (!this.isProtocolSupported()) {
            logger_default.log("Protocol is unsupported. Stopping monitor and disconnecting.");
            return this.close({ allowReconnect: false });
          }
        },
        close(event) {
          logger_default.log("WebSocket onclose event");
          if (this.disconnected) {
            return;
          }
          this.disconnected = true;
          this.monitor.recordDisconnect();
          return this.subscriptions.notifyAll("disconnected", { willAttemptReconnect: this.monitor.isRunning() });
        },
        error() {
          logger_default.log("WebSocket onerror event");
        }
      };
      connection_default = Connection;
    }
  });

  // node_modules/@rails/actioncable/src/subscription.js
  var extend, Subscription;
  var init_subscription = __esm({
    "node_modules/@rails/actioncable/src/subscription.js"() {
      extend = function(object, properties) {
        if (properties != null) {
          for (let key in properties) {
            const value = properties[key];
            object[key] = value;
          }
        }
        return object;
      };
      Subscription = class {
        constructor(consumer2, params = {}, mixin) {
          this.consumer = consumer2;
          this.identifier = JSON.stringify(params);
          extend(this, mixin);
        }
        // Perform a channel action with the optional data passed as an attribute
        perform(action, data = {}) {
          data.action = action;
          return this.send(data);
        }
        send(data) {
          return this.consumer.send({ command: "message", identifier: this.identifier, data: JSON.stringify(data) });
        }
        unsubscribe() {
          return this.consumer.subscriptions.remove(this);
        }
      };
    }
  });

  // node_modules/@rails/actioncable/src/subscription_guarantor.js
  var SubscriptionGuarantor, subscription_guarantor_default;
  var init_subscription_guarantor = __esm({
    "node_modules/@rails/actioncable/src/subscription_guarantor.js"() {
      init_logger();
      SubscriptionGuarantor = class {
        constructor(subscriptions) {
          this.subscriptions = subscriptions;
          this.pendingSubscriptions = [];
        }
        guarantee(subscription) {
          if (this.pendingSubscriptions.indexOf(subscription) == -1) {
            logger_default.log(`SubscriptionGuarantor guaranteeing ${subscription.identifier}`);
            this.pendingSubscriptions.push(subscription);
          } else {
            logger_default.log(`SubscriptionGuarantor already guaranteeing ${subscription.identifier}`);
          }
          this.startGuaranteeing();
        }
        forget(subscription) {
          logger_default.log(`SubscriptionGuarantor forgetting ${subscription.identifier}`);
          this.pendingSubscriptions = this.pendingSubscriptions.filter((s) => s !== subscription);
        }
        startGuaranteeing() {
          this.stopGuaranteeing();
          this.retrySubscribing();
        }
        stopGuaranteeing() {
          clearTimeout(this.retryTimeout);
        }
        retrySubscribing() {
          this.retryTimeout = setTimeout(
            () => {
              if (this.subscriptions && typeof this.subscriptions.subscribe === "function") {
                this.pendingSubscriptions.map((subscription) => {
                  logger_default.log(`SubscriptionGuarantor resubscribing ${subscription.identifier}`);
                  this.subscriptions.subscribe(subscription);
                });
              }
            },
            500
          );
        }
      };
      subscription_guarantor_default = SubscriptionGuarantor;
    }
  });

  // node_modules/@rails/actioncable/src/subscriptions.js
  var Subscriptions;
  var init_subscriptions = __esm({
    "node_modules/@rails/actioncable/src/subscriptions.js"() {
      init_logger();
      init_subscription();
      init_subscription_guarantor();
      Subscriptions = class {
        constructor(consumer2) {
          this.consumer = consumer2;
          this.guarantor = new subscription_guarantor_default(this);
          this.subscriptions = [];
        }
        create(channelName, mixin) {
          const channel = channelName;
          const params = typeof channel === "object" ? channel : { channel };
          const subscription = new Subscription(this.consumer, params, mixin);
          return this.add(subscription);
        }
        // Private
        add(subscription) {
          this.subscriptions.push(subscription);
          this.consumer.ensureActiveConnection();
          this.notify(subscription, "initialized");
          this.subscribe(subscription);
          return subscription;
        }
        remove(subscription) {
          this.forget(subscription);
          if (!this.findAll(subscription.identifier).length) {
            this.sendCommand(subscription, "unsubscribe");
          }
          return subscription;
        }
        reject(identifier) {
          return this.findAll(identifier).map((subscription) => {
            this.forget(subscription);
            this.notify(subscription, "rejected");
            return subscription;
          });
        }
        forget(subscription) {
          this.guarantor.forget(subscription);
          this.subscriptions = this.subscriptions.filter((s) => s !== subscription);
          return subscription;
        }
        findAll(identifier) {
          return this.subscriptions.filter((s) => s.identifier === identifier);
        }
        reload() {
          return this.subscriptions.map((subscription) => this.subscribe(subscription));
        }
        notifyAll(callbackName, ...args) {
          return this.subscriptions.map((subscription) => this.notify(subscription, callbackName, ...args));
        }
        notify(subscription, callbackName, ...args) {
          let subscriptions;
          if (typeof subscription === "string") {
            subscriptions = this.findAll(subscription);
          } else {
            subscriptions = [subscription];
          }
          return subscriptions.map((subscription2) => typeof subscription2[callbackName] === "function" ? subscription2[callbackName](...args) : void 0);
        }
        subscribe(subscription) {
          if (this.sendCommand(subscription, "subscribe")) {
            this.guarantor.guarantee(subscription);
          }
        }
        confirmSubscription(identifier) {
          logger_default.log(`Subscription confirmed ${identifier}`);
          this.findAll(identifier).map((subscription) => this.guarantor.forget(subscription));
        }
        sendCommand(subscription, command) {
          const { identifier } = subscription;
          return this.consumer.send({ command, identifier });
        }
      };
    }
  });

  // node_modules/@rails/actioncable/src/consumer.js
  function createWebSocketURL(url) {
    if (typeof url === "function") {
      url = url();
    }
    if (url && !/^wss?:/i.test(url)) {
      const a = document.createElement("a");
      a.href = url;
      a.href = a.href;
      a.protocol = a.protocol.replace("http", "ws");
      return a.href;
    } else {
      return url;
    }
  }
  var Consumer;
  var init_consumer = __esm({
    "node_modules/@rails/actioncable/src/consumer.js"() {
      init_connection();
      init_subscriptions();
      Consumer = class {
        constructor(url) {
          this._url = url;
          this.subscriptions = new Subscriptions(this);
          this.connection = new connection_default(this);
          this.subprotocols = [];
        }
        get url() {
          return createWebSocketURL(this._url);
        }
        send(data) {
          return this.connection.send(data);
        }
        connect() {
          return this.connection.open();
        }
        disconnect() {
          return this.connection.close({ allowReconnect: false });
        }
        ensureActiveConnection() {
          if (!this.connection.isActive()) {
            return this.connection.open();
          }
        }
        addSubProtocol(subprotocol) {
          this.subprotocols = [...this.subprotocols, subprotocol];
        }
      };
    }
  });

  // node_modules/@rails/actioncable/src/index.js
  var src_exports = {};
  __export(src_exports, {
    Connection: () => connection_default,
    ConnectionMonitor: () => connection_monitor_default,
    Consumer: () => Consumer,
    INTERNAL: () => internal_default,
    Subscription: () => Subscription,
    SubscriptionGuarantor: () => subscription_guarantor_default,
    Subscriptions: () => Subscriptions,
    adapters: () => adapters_default,
    createConsumer: () => createConsumer,
    createWebSocketURL: () => createWebSocketURL,
    getConfig: () => getConfig,
    logger: () => logger_default
  });
  function createConsumer(url = getConfig("url") || internal_default.default_mount_path) {
    return new Consumer(url);
  }
  function getConfig(name) {
    const element = document.head.querySelector(`meta[name='action-cable-${name}']`);
    if (element) {
      return element.getAttribute("content");
    }
  }
  var init_src = __esm({
    "node_modules/@rails/actioncable/src/index.js"() {
      init_adapters();
      init_connection();
      init_connection_monitor();
      init_consumer();
      init_internal();
      init_logger();
      init_subscription();
      init_subscription_guarantor();
      init_subscriptions();
    }
  });

  // node_modules/@hotwired/turbo/dist/turbo.es2017-esm.js
  var turbo_es2017_esm_exports = {};
  __export(turbo_es2017_esm_exports, {
    FetchEnctype: () => FetchEnctype,
    FetchMethod: () => FetchMethod,
    FetchRequest: () => FetchRequest,
    FetchResponse: () => FetchResponse,
    FrameElement: () => FrameElement,
    FrameLoadingStyle: () => FrameLoadingStyle,
    FrameRenderer: () => FrameRenderer,
    PageRenderer: () => PageRenderer,
    PageSnapshot: () => PageSnapshot,
    StreamActions: () => StreamActions,
    StreamElement: () => StreamElement,
    StreamSourceElement: () => StreamSourceElement,
    cache: () => cache,
    config: () => config,
    connectStreamSource: () => connectStreamSource,
    disconnectStreamSource: () => disconnectStreamSource,
    fetch: () => fetchWithTurboHeaders,
    fetchEnctypeFromString: () => fetchEnctypeFromString,
    fetchMethodFromString: () => fetchMethodFromString,
    isSafe: () => isSafe,
    morphBodyElements: () => morphBodyElements,
    morphChildren: () => morphChildren,
    morphElements: () => morphElements,
    morphTurboFrameElements: () => morphTurboFrameElements,
    navigator: () => navigator2,
    registerAdapter: () => registerAdapter,
    renderStreamMessage: () => renderStreamMessage,
    session: () => session,
    setConfirmMethod: () => setConfirmMethod,
    setFormMode: () => setFormMode,
    setProgressBarDelay: () => setProgressBarDelay,
    start: () => start,
    visit: () => visit
  });
  var FrameLoadingStyle = {
    eager: "eager",
    lazy: "lazy"
  };
  var FrameElement = class _FrameElement extends HTMLElement {
    static delegateConstructor = void 0;
    loaded = Promise.resolve();
    static get observedAttributes() {
      return ["disabled", "loading", "src"];
    }
    constructor() {
      super();
      this.delegate = new _FrameElement.delegateConstructor(this);
    }
    connectedCallback() {
      this.delegate.connect();
    }
    disconnectedCallback() {
      this.delegate.disconnect();
    }
    reload() {
      return this.delegate.sourceURLReloaded();
    }
    attributeChangedCallback(name) {
      if (name == "loading") {
        this.delegate.loadingStyleChanged();
      } else if (name == "src") {
        this.delegate.sourceURLChanged();
      } else if (name == "disabled") {
        this.delegate.disabledChanged();
      }
    }
    /**
     * Gets the URL to lazily load source HTML from
     */
    get src() {
      return this.getAttribute("src");
    }
    /**
     * Sets the URL to lazily load source HTML from
     */
    set src(value) {
      if (value) {
        this.setAttribute("src", value);
      } else {
        this.removeAttribute("src");
      }
    }
    /**
     * Gets the refresh mode for the frame.
     */
    get refresh() {
      return this.getAttribute("refresh");
    }
    /**
     * Sets the refresh mode for the frame.
     */
    set refresh(value) {
      if (value) {
        this.setAttribute("refresh", value);
      } else {
        this.removeAttribute("refresh");
      }
    }
    get shouldReloadWithMorph() {
      return this.src && this.refresh === "morph";
    }
    /**
     * Determines if the element is loading
     */
    get loading() {
      return frameLoadingStyleFromString(this.getAttribute("loading") || "");
    }
    /**
     * Sets the value of if the element is loading
     */
    set loading(value) {
      if (value) {
        this.setAttribute("loading", value);
      } else {
        this.removeAttribute("loading");
      }
    }
    /**
     * Gets the disabled state of the frame.
     *
     * If disabled, no requests will be intercepted by the frame.
     */
    get disabled() {
      return this.hasAttribute("disabled");
    }
    /**
     * Sets the disabled state of the frame.
     *
     * If disabled, no requests will be intercepted by the frame.
     */
    set disabled(value) {
      if (value) {
        this.setAttribute("disabled", "");
      } else {
        this.removeAttribute("disabled");
      }
    }
    /**
     * Gets the autoscroll state of the frame.
     *
     * If true, the frame will be scrolled into view automatically on update.
     */
    get autoscroll() {
      return this.hasAttribute("autoscroll");
    }
    /**
     * Sets the autoscroll state of the frame.
     *
     * If true, the frame will be scrolled into view automatically on update.
     */
    set autoscroll(value) {
      if (value) {
        this.setAttribute("autoscroll", "");
      } else {
        this.removeAttribute("autoscroll");
      }
    }
    /**
     * Determines if the element has finished loading
     */
    get complete() {
      return !this.delegate.isLoading;
    }
    /**
     * Gets the active state of the frame.
     *
     * If inactive, source changes will not be observed.
     */
    get isActive() {
      return this.ownerDocument === document && !this.isPreview;
    }
    /**
     * Sets the active state of the frame.
     *
     * If inactive, source changes will not be observed.
     */
    get isPreview() {
      return this.ownerDocument?.documentElement?.hasAttribute("data-turbo-preview");
    }
  };
  function frameLoadingStyleFromString(style) {
    switch (style.toLowerCase()) {
      case "lazy":
        return FrameLoadingStyle.lazy;
      default:
        return FrameLoadingStyle.eager;
    }
  }
  var drive = {
    enabled: true,
    progressBarDelay: 500,
    unvisitableExtensions: /* @__PURE__ */ new Set(
      [
        ".7z",
        ".aac",
        ".apk",
        ".avi",
        ".bmp",
        ".bz2",
        ".css",
        ".csv",
        ".deb",
        ".dmg",
        ".doc",
        ".docx",
        ".exe",
        ".gif",
        ".gz",
        ".heic",
        ".heif",
        ".ico",
        ".iso",
        ".jpeg",
        ".jpg",
        ".js",
        ".json",
        ".m4a",
        ".mkv",
        ".mov",
        ".mp3",
        ".mp4",
        ".mpeg",
        ".mpg",
        ".msi",
        ".ogg",
        ".ogv",
        ".pdf",
        ".pkg",
        ".png",
        ".ppt",
        ".pptx",
        ".rar",
        ".rtf",
        ".svg",
        ".tar",
        ".tif",
        ".tiff",
        ".txt",
        ".wav",
        ".webm",
        ".webp",
        ".wma",
        ".wmv",
        ".xls",
        ".xlsx",
        ".xml",
        ".zip"
      ]
    )
  };
  function activateScriptElement(element) {
    if (element.getAttribute("data-turbo-eval") == "false") {
      return element;
    } else {
      const createdScriptElement = document.createElement("script");
      const cspNonce = getCspNonce();
      if (cspNonce) {
        createdScriptElement.nonce = cspNonce;
      }
      createdScriptElement.textContent = element.textContent;
      createdScriptElement.async = false;
      copyElementAttributes(createdScriptElement, element);
      return createdScriptElement;
    }
  }
  function copyElementAttributes(destinationElement, sourceElement) {
    for (const { name, value } of sourceElement.attributes) {
      destinationElement.setAttribute(name, value);
    }
  }
  function createDocumentFragment(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content;
  }
  function dispatch(eventName, { target, cancelable, detail } = {}) {
    const event = new CustomEvent(eventName, {
      cancelable,
      bubbles: true,
      composed: true,
      detail
    });
    if (target && target.isConnected) {
      target.dispatchEvent(event);
    } else {
      document.documentElement.dispatchEvent(event);
    }
    return event;
  }
  function cancelEvent(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  function nextRepaint() {
    if (document.visibilityState === "hidden") {
      return nextEventLoopTick();
    } else {
      return nextAnimationFrame();
    }
  }
  function nextAnimationFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
  function nextEventLoopTick() {
    return new Promise((resolve) => setTimeout(() => resolve(), 0));
  }
  function parseHTMLDocument(html = "") {
    return new DOMParser().parseFromString(html, "text/html");
  }
  function unindent(strings, ...values) {
    const lines = interpolate(strings, values).replace(/^\n/, "").split("\n");
    const match = lines[0].match(/^\s+/);
    const indent = match ? match[0].length : 0;
    return lines.map((line) => line.slice(indent)).join("\n");
  }
  function interpolate(strings, values) {
    return strings.reduce((result, string, i) => {
      const value = values[i] == void 0 ? "" : values[i];
      return result + string + value;
    }, "");
  }
  function uuid() {
    return Array.from({ length: 36 }).map((_, i) => {
      if (i == 8 || i == 13 || i == 18 || i == 23) {
        return "-";
      } else if (i == 14) {
        return "4";
      } else if (i == 19) {
        return (Math.floor(Math.random() * 4) + 8).toString(16);
      } else {
        return Math.floor(Math.random() * 16).toString(16);
      }
    }).join("");
  }
  function getAttribute(attributeName, ...elements) {
    for (const value of elements.map((element) => element?.getAttribute(attributeName))) {
      if (typeof value == "string") return value;
    }
    return null;
  }
  function hasAttribute(attributeName, ...elements) {
    return elements.some((element) => element && element.hasAttribute(attributeName));
  }
  function markAsBusy(...elements) {
    for (const element of elements) {
      if (element.localName == "turbo-frame") {
        element.setAttribute("busy", "");
      }
      element.setAttribute("aria-busy", "true");
    }
  }
  function clearBusyState(...elements) {
    for (const element of elements) {
      if (element.localName == "turbo-frame") {
        element.removeAttribute("busy");
      }
      element.removeAttribute("aria-busy");
    }
  }
  function waitForLoad(element, timeoutInMilliseconds = 2e3) {
    return new Promise((resolve) => {
      const onComplete = () => {
        element.removeEventListener("error", onComplete);
        element.removeEventListener("load", onComplete);
        resolve();
      };
      element.addEventListener("load", onComplete, { once: true });
      element.addEventListener("error", onComplete, { once: true });
      setTimeout(resolve, timeoutInMilliseconds);
    });
  }
  function getHistoryMethodForAction(action) {
    switch (action) {
      case "replace":
        return history.replaceState;
      case "advance":
      case "restore":
        return history.pushState;
    }
  }
  function isAction(action) {
    return action == "advance" || action == "replace" || action == "restore";
  }
  function getVisitAction(...elements) {
    const action = getAttribute("data-turbo-action", ...elements);
    return isAction(action) ? action : null;
  }
  function getMetaElement(name) {
    return document.querySelector(`meta[name="${name}"]`);
  }
  function getMetaContent(name) {
    const element = getMetaElement(name);
    return element && element.content;
  }
  function getCspNonce() {
    const element = getMetaElement("csp-nonce");
    if (element) {
      const { nonce, content } = element;
      return nonce == "" ? content : nonce;
    }
  }
  function setMetaContent(name, content) {
    let element = getMetaElement(name);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute("name", name);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
    return element;
  }
  function findClosestRecursively(element, selector) {
    if (element instanceof Element) {
      return element.closest(selector) || findClosestRecursively(element.assignedSlot || element.getRootNode()?.host, selector);
    }
  }
  function elementIsFocusable(element) {
    const inertDisabledOrHidden = "[inert], :disabled, [hidden], details:not([open]), dialog:not([open])";
    return !!element && element.closest(inertDisabledOrHidden) == null && typeof element.focus == "function";
  }
  function queryAutofocusableElement(elementOrDocumentFragment) {
    return Array.from(elementOrDocumentFragment.querySelectorAll("[autofocus]")).find(elementIsFocusable);
  }
  async function around(callback, reader) {
    const before = reader();
    callback();
    await nextAnimationFrame();
    const after = reader();
    return [before, after];
  }
  function doesNotTargetIFrame(name) {
    if (name === "_blank") {
      return false;
    } else if (name) {
      for (const element of document.getElementsByName(name)) {
        if (element instanceof HTMLIFrameElement) return false;
      }
      return true;
    } else {
      return true;
    }
  }
  function findLinkFromClickTarget(target) {
    const link = findClosestRecursively(target, "a[href], a[xlink\\:href]");
    if (!link) return null;
    if (link.href.startsWith("#")) return null;
    if (link.hasAttribute("download")) return null;
    const linkTarget = link.getAttribute("target");
    if (linkTarget && linkTarget !== "_self") return null;
    return link;
  }
  function debounce(fn2, delay) {
    let timeoutId = null;
    return (...args) => {
      const callback = () => fn2.apply(this, args);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  }
  var submitter = {
    "aria-disabled": {
      beforeSubmit: (submitter2) => {
        submitter2.setAttribute("aria-disabled", "true");
        submitter2.addEventListener("click", cancelEvent);
      },
      afterSubmit: (submitter2) => {
        submitter2.removeAttribute("aria-disabled");
        submitter2.removeEventListener("click", cancelEvent);
      }
    },
    "disabled": {
      beforeSubmit: (submitter2) => submitter2.disabled = true,
      afterSubmit: (submitter2) => submitter2.disabled = false
    }
  };
  var Config = class {
    #submitter = null;
    constructor(config2) {
      Object.assign(this, config2);
    }
    get submitter() {
      return this.#submitter;
    }
    set submitter(value) {
      this.#submitter = submitter[value] || value;
    }
  };
  var forms = new Config({
    mode: "on",
    submitter: "disabled"
  });
  var config = {
    drive,
    forms
  };
  function expandURL(locatable) {
    return new URL(locatable.toString(), document.baseURI);
  }
  function getAnchor(url) {
    let anchorMatch;
    if (url.hash) {
      return url.hash.slice(1);
    } else if (anchorMatch = url.href.match(/#(.*)$/)) {
      return anchorMatch[1];
    }
  }
  function getAction$1(form, submitter2) {
    const action = submitter2?.getAttribute("formaction") || form.getAttribute("action") || form.action;
    return expandURL(action);
  }
  function getExtension(url) {
    return (getLastPathComponent(url).match(/\.[^.]*$/) || [])[0] || "";
  }
  function isPrefixedBy(baseURL, url) {
    const prefix = addTrailingSlash(url.origin + url.pathname);
    return addTrailingSlash(baseURL.href) === prefix || baseURL.href.startsWith(prefix);
  }
  function locationIsVisitable(location2, rootLocation) {
    return isPrefixedBy(location2, rootLocation) && !config.drive.unvisitableExtensions.has(getExtension(location2));
  }
  function getLocationForLink(link) {
    return expandURL(link.getAttribute("href") || "");
  }
  function getRequestURL(url) {
    const anchor = getAnchor(url);
    return anchor != null ? url.href.slice(0, -(anchor.length + 1)) : url.href;
  }
  function toCacheKey(url) {
    return getRequestURL(url);
  }
  function urlsAreEqual(left2, right2) {
    return expandURL(left2).href == expandURL(right2).href;
  }
  function getPathComponents(url) {
    return url.pathname.split("/").slice(1);
  }
  function getLastPathComponent(url) {
    return getPathComponents(url).slice(-1)[0];
  }
  function addTrailingSlash(value) {
    return value.endsWith("/") ? value : value + "/";
  }
  var FetchResponse = class {
    constructor(response) {
      this.response = response;
    }
    get succeeded() {
      return this.response.ok;
    }
    get failed() {
      return !this.succeeded;
    }
    get clientError() {
      return this.statusCode >= 400 && this.statusCode <= 499;
    }
    get serverError() {
      return this.statusCode >= 500 && this.statusCode <= 599;
    }
    get redirected() {
      return this.response.redirected;
    }
    get location() {
      return expandURL(this.response.url);
    }
    get isHTML() {
      return this.contentType && this.contentType.match(/^(?:text\/([^\s;,]+\b)?html|application\/xhtml\+xml)\b/);
    }
    get statusCode() {
      return this.response.status;
    }
    get contentType() {
      return this.header("Content-Type");
    }
    get responseText() {
      return this.response.clone().text();
    }
    get responseHTML() {
      if (this.isHTML) {
        return this.response.clone().text();
      } else {
        return Promise.resolve(void 0);
      }
    }
    header(name) {
      return this.response.headers.get(name);
    }
  };
  var LimitedSet = class extends Set {
    constructor(maxSize) {
      super();
      this.maxSize = maxSize;
    }
    add(value) {
      if (this.size >= this.maxSize) {
        const iterator = this.values();
        const oldestValue = iterator.next().value;
        this.delete(oldestValue);
      }
      super.add(value);
    }
  };
  var recentRequests = new LimitedSet(20);
  function fetchWithTurboHeaders(url, options = {}) {
    const modifiedHeaders = new Headers(options.headers || {});
    const requestUID = uuid();
    recentRequests.add(requestUID);
    modifiedHeaders.append("X-Turbo-Request-Id", requestUID);
    return window.fetch(url, {
      ...options,
      headers: modifiedHeaders
    });
  }
  function fetchMethodFromString(method) {
    switch (method.toLowerCase()) {
      case "get":
        return FetchMethod.get;
      case "post":
        return FetchMethod.post;
      case "put":
        return FetchMethod.put;
      case "patch":
        return FetchMethod.patch;
      case "delete":
        return FetchMethod.delete;
    }
  }
  var FetchMethod = {
    get: "get",
    post: "post",
    put: "put",
    patch: "patch",
    delete: "delete"
  };
  function fetchEnctypeFromString(encoding) {
    switch (encoding.toLowerCase()) {
      case FetchEnctype.multipart:
        return FetchEnctype.multipart;
      case FetchEnctype.plain:
        return FetchEnctype.plain;
      default:
        return FetchEnctype.urlEncoded;
    }
  }
  var FetchEnctype = {
    urlEncoded: "application/x-www-form-urlencoded",
    multipart: "multipart/form-data",
    plain: "text/plain"
  };
  var FetchRequest = class {
    abortController = new AbortController();
    #resolveRequestPromise = (_value) => {
    };
    constructor(delegate, method, location2, requestBody = new URLSearchParams(), target = null, enctype = FetchEnctype.urlEncoded) {
      const [url, body] = buildResourceAndBody(expandURL(location2), method, requestBody, enctype);
      this.delegate = delegate;
      this.url = url;
      this.target = target;
      this.fetchOptions = {
        credentials: "same-origin",
        redirect: "follow",
        method: method.toUpperCase(),
        headers: { ...this.defaultHeaders },
        body,
        signal: this.abortSignal,
        referrer: this.delegate.referrer?.href
      };
      this.enctype = enctype;
    }
    get method() {
      return this.fetchOptions.method;
    }
    set method(value) {
      const fetchBody = this.isSafe ? this.url.searchParams : this.fetchOptions.body || new FormData();
      const fetchMethod = fetchMethodFromString(value) || FetchMethod.get;
      this.url.search = "";
      const [url, body] = buildResourceAndBody(this.url, fetchMethod, fetchBody, this.enctype);
      this.url = url;
      this.fetchOptions.body = body;
      this.fetchOptions.method = fetchMethod.toUpperCase();
    }
    get headers() {
      return this.fetchOptions.headers;
    }
    set headers(value) {
      this.fetchOptions.headers = value;
    }
    get body() {
      if (this.isSafe) {
        return this.url.searchParams;
      } else {
        return this.fetchOptions.body;
      }
    }
    set body(value) {
      this.fetchOptions.body = value;
    }
    get location() {
      return this.url;
    }
    get params() {
      return this.url.searchParams;
    }
    get entries() {
      return this.body ? Array.from(this.body.entries()) : [];
    }
    cancel() {
      this.abortController.abort();
    }
    async perform() {
      const { fetchOptions } = this;
      this.delegate.prepareRequest(this);
      const event = await this.#allowRequestToBeIntercepted(fetchOptions);
      try {
        this.delegate.requestStarted(this);
        if (event.detail.fetchRequest) {
          this.response = event.detail.fetchRequest.response;
        } else {
          this.response = fetchWithTurboHeaders(this.url.href, fetchOptions);
        }
        const response = await this.response;
        return await this.receive(response);
      } catch (error2) {
        if (error2.name !== "AbortError") {
          if (this.#willDelegateErrorHandling(error2)) {
            this.delegate.requestErrored(this, error2);
          }
          throw error2;
        }
      } finally {
        this.delegate.requestFinished(this);
      }
    }
    async receive(response) {
      const fetchResponse = new FetchResponse(response);
      const event = dispatch("turbo:before-fetch-response", {
        cancelable: true,
        detail: { fetchResponse },
        target: this.target
      });
      if (event.defaultPrevented) {
        this.delegate.requestPreventedHandlingResponse(this, fetchResponse);
      } else if (fetchResponse.succeeded) {
        this.delegate.requestSucceededWithResponse(this, fetchResponse);
      } else {
        this.delegate.requestFailedWithResponse(this, fetchResponse);
      }
      return fetchResponse;
    }
    get defaultHeaders() {
      return {
        Accept: "text/html, application/xhtml+xml"
      };
    }
    get isSafe() {
      return isSafe(this.method);
    }
    get abortSignal() {
      return this.abortController.signal;
    }
    acceptResponseType(mimeType) {
      this.headers["Accept"] = [mimeType, this.headers["Accept"]].join(", ");
    }
    async #allowRequestToBeIntercepted(fetchOptions) {
      const requestInterception = new Promise((resolve) => this.#resolveRequestPromise = resolve);
      const event = dispatch("turbo:before-fetch-request", {
        cancelable: true,
        detail: {
          fetchOptions,
          url: this.url,
          resume: this.#resolveRequestPromise
        },
        target: this.target
      });
      this.url = event.detail.url;
      if (event.defaultPrevented) await requestInterception;
      return event;
    }
    #willDelegateErrorHandling(error2) {
      const event = dispatch("turbo:fetch-request-error", {
        target: this.target,
        cancelable: true,
        detail: { request: this, error: error2 }
      });
      return !event.defaultPrevented;
    }
  };
  function isSafe(fetchMethod) {
    return fetchMethodFromString(fetchMethod) == FetchMethod.get;
  }
  function buildResourceAndBody(resource, method, requestBody, enctype) {
    const searchParams = Array.from(requestBody).length > 0 ? new URLSearchParams(entriesExcludingFiles(requestBody)) : resource.searchParams;
    if (isSafe(method)) {
      return [mergeIntoURLSearchParams(resource, searchParams), null];
    } else if (enctype == FetchEnctype.urlEncoded) {
      return [resource, searchParams];
    } else {
      return [resource, requestBody];
    }
  }
  function entriesExcludingFiles(requestBody) {
    const entries = [];
    for (const [name, value] of requestBody) {
      if (value instanceof File) continue;
      else entries.push([name, value]);
    }
    return entries;
  }
  function mergeIntoURLSearchParams(url, requestBody) {
    const searchParams = new URLSearchParams(entriesExcludingFiles(requestBody));
    url.search = searchParams.toString();
    return url;
  }
  var AppearanceObserver = class {
    started = false;
    constructor(delegate, element) {
      this.delegate = delegate;
      this.element = element;
      this.intersectionObserver = new IntersectionObserver(this.intersect);
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.intersectionObserver.observe(this.element);
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
        this.intersectionObserver.unobserve(this.element);
      }
    }
    intersect = (entries) => {
      const lastEntry = entries.slice(-1)[0];
      if (lastEntry?.isIntersecting) {
        this.delegate.elementAppearedInViewport(this.element);
      }
    };
  };
  var StreamMessage = class {
    static contentType = "text/vnd.turbo-stream.html";
    static wrap(message) {
      if (typeof message == "string") {
        return new this(createDocumentFragment(message));
      } else {
        return message;
      }
    }
    constructor(fragment) {
      this.fragment = importStreamElements(fragment);
    }
  };
  function importStreamElements(fragment) {
    for (const element of fragment.querySelectorAll("turbo-stream")) {
      const streamElement = document.importNode(element, true);
      for (const inertScriptElement of streamElement.templateElement.content.querySelectorAll("script")) {
        inertScriptElement.replaceWith(activateScriptElement(inertScriptElement));
      }
      element.replaceWith(streamElement);
    }
    return fragment;
  }
  var identity = (key) => key;
  var LRUCache = class {
    keys = [];
    entries = {};
    #toCacheKey;
    constructor(size, toCacheKey2 = identity) {
      this.size = size;
      this.#toCacheKey = toCacheKey2;
    }
    has(key) {
      return this.#toCacheKey(key) in this.entries;
    }
    get(key) {
      if (this.has(key)) {
        const entry = this.read(key);
        this.touch(key);
        return entry;
      }
    }
    put(key, entry) {
      this.write(key, entry);
      this.touch(key);
      return entry;
    }
    clear() {
      for (const key of Object.keys(this.entries)) {
        this.evict(key);
      }
    }
    // Private
    read(key) {
      return this.entries[this.#toCacheKey(key)];
    }
    write(key, entry) {
      this.entries[this.#toCacheKey(key)] = entry;
    }
    touch(key) {
      key = this.#toCacheKey(key);
      const index = this.keys.indexOf(key);
      if (index > -1) this.keys.splice(index, 1);
      this.keys.unshift(key);
      this.trim();
    }
    trim() {
      for (const key of this.keys.splice(this.size)) {
        this.evict(key);
      }
    }
    evict(key) {
      delete this.entries[key];
    }
  };
  var PREFETCH_DELAY = 100;
  var PrefetchCache = class extends LRUCache {
    #prefetchTimeout = null;
    #maxAges = {};
    constructor(size = 1, prefetchDelay = PREFETCH_DELAY) {
      super(size, toCacheKey);
      this.prefetchDelay = prefetchDelay;
    }
    putLater(url, request, ttl) {
      this.#prefetchTimeout = setTimeout(() => {
        request.perform();
        this.put(url, request, ttl);
        this.#prefetchTimeout = null;
      }, this.prefetchDelay);
    }
    put(url, request, ttl = cacheTtl) {
      super.put(url, request);
      this.#maxAges[toCacheKey(url)] = new Date((/* @__PURE__ */ new Date()).getTime() + ttl);
    }
    clear() {
      super.clear();
      if (this.#prefetchTimeout) clearTimeout(this.#prefetchTimeout);
    }
    evict(key) {
      super.evict(key);
      delete this.#maxAges[key];
    }
    has(key) {
      if (super.has(key)) {
        const maxAge = this.#maxAges[toCacheKey(key)];
        return maxAge && maxAge > Date.now();
      } else {
        return false;
      }
    }
  };
  var cacheTtl = 10 * 1e3;
  var prefetchCache = new PrefetchCache();
  var FormSubmissionState = {
    initialized: "initialized",
    requesting: "requesting",
    waiting: "waiting",
    receiving: "receiving",
    stopping: "stopping",
    stopped: "stopped"
  };
  var FormSubmission = class _FormSubmission {
    state = FormSubmissionState.initialized;
    static confirmMethod(message) {
      return Promise.resolve(confirm(message));
    }
    constructor(delegate, formElement, submitter2, mustRedirect = false) {
      const method = getMethod(formElement, submitter2);
      const action = getAction(getFormAction(formElement, submitter2), method);
      const body = buildFormData(formElement, submitter2);
      const enctype = getEnctype(formElement, submitter2);
      this.delegate = delegate;
      this.formElement = formElement;
      this.submitter = submitter2;
      this.fetchRequest = new FetchRequest(this, method, action, body, formElement, enctype);
      this.mustRedirect = mustRedirect;
    }
    get method() {
      return this.fetchRequest.method;
    }
    set method(value) {
      this.fetchRequest.method = value;
    }
    get action() {
      return this.fetchRequest.url.toString();
    }
    set action(value) {
      this.fetchRequest.url = expandURL(value);
    }
    get body() {
      return this.fetchRequest.body;
    }
    get enctype() {
      return this.fetchRequest.enctype;
    }
    get isSafe() {
      return this.fetchRequest.isSafe;
    }
    get location() {
      return this.fetchRequest.url;
    }
    // The submission process
    async start() {
      const { initialized, requesting } = FormSubmissionState;
      const confirmationMessage = getAttribute("data-turbo-confirm", this.submitter, this.formElement);
      if (typeof confirmationMessage === "string") {
        const confirmMethod = typeof config.forms.confirm === "function" ? config.forms.confirm : _FormSubmission.confirmMethod;
        const answer = await confirmMethod(confirmationMessage, this.formElement, this.submitter);
        if (!answer) {
          return;
        }
      }
      if (this.state == initialized) {
        this.state = requesting;
        return this.fetchRequest.perform();
      }
    }
    stop() {
      const { stopping, stopped } = FormSubmissionState;
      if (this.state != stopping && this.state != stopped) {
        this.state = stopping;
        this.fetchRequest.cancel();
        return true;
      }
    }
    // Fetch request delegate
    prepareRequest(request) {
      if (!request.isSafe) {
        const token = getCookieValue(getMetaContent("csrf-param")) || getMetaContent("csrf-token");
        if (token) {
          request.headers["X-CSRF-Token"] = token;
        }
      }
      if (this.requestAcceptsTurboStreamResponse(request)) {
        request.acceptResponseType(StreamMessage.contentType);
      }
    }
    requestStarted(_request) {
      this.state = FormSubmissionState.waiting;
      if (this.submitter) config.forms.submitter.beforeSubmit(this.submitter);
      this.setSubmitsWith();
      markAsBusy(this.formElement);
      dispatch("turbo:submit-start", {
        target: this.formElement,
        detail: { formSubmission: this }
      });
      this.delegate.formSubmissionStarted(this);
    }
    requestPreventedHandlingResponse(request, response) {
      prefetchCache.clear();
      this.result = { success: response.succeeded, fetchResponse: response };
    }
    requestSucceededWithResponse(request, response) {
      if (response.clientError || response.serverError) {
        this.delegate.formSubmissionFailedWithResponse(this, response);
        return;
      }
      prefetchCache.clear();
      if (this.requestMustRedirect(request) && responseSucceededWithoutRedirect(response)) {
        const error2 = new Error("Form responses must redirect to another location");
        this.delegate.formSubmissionErrored(this, error2);
      } else {
        this.state = FormSubmissionState.receiving;
        this.result = { success: true, fetchResponse: response };
        this.delegate.formSubmissionSucceededWithResponse(this, response);
      }
    }
    requestFailedWithResponse(request, response) {
      this.result = { success: false, fetchResponse: response };
      this.delegate.formSubmissionFailedWithResponse(this, response);
    }
    requestErrored(request, error2) {
      this.result = { success: false, error: error2 };
      this.delegate.formSubmissionErrored(this, error2);
    }
    requestFinished(_request) {
      this.state = FormSubmissionState.stopped;
      if (this.submitter) config.forms.submitter.afterSubmit(this.submitter);
      this.resetSubmitterText();
      clearBusyState(this.formElement);
      dispatch("turbo:submit-end", {
        target: this.formElement,
        detail: { formSubmission: this, ...this.result }
      });
      this.delegate.formSubmissionFinished(this);
    }
    // Private
    setSubmitsWith() {
      if (!this.submitter || !this.submitsWith) return;
      if (this.submitter.matches("button")) {
        this.originalSubmitText = this.submitter.innerHTML;
        this.submitter.innerHTML = this.submitsWith;
      } else if (this.submitter.matches("input")) {
        const input = this.submitter;
        this.originalSubmitText = input.value;
        input.value = this.submitsWith;
      }
    }
    resetSubmitterText() {
      if (!this.submitter || !this.originalSubmitText) return;
      if (this.submitter.matches("button")) {
        this.submitter.innerHTML = this.originalSubmitText;
      } else if (this.submitter.matches("input")) {
        const input = this.submitter;
        input.value = this.originalSubmitText;
      }
    }
    requestMustRedirect(request) {
      return !request.isSafe && this.mustRedirect;
    }
    requestAcceptsTurboStreamResponse(request) {
      return !request.isSafe || hasAttribute("data-turbo-stream", this.submitter, this.formElement);
    }
    get submitsWith() {
      return this.submitter?.getAttribute("data-turbo-submits-with");
    }
  };
  function buildFormData(formElement, submitter2) {
    const formData = new FormData(formElement);
    const name = submitter2?.getAttribute("name");
    const value = submitter2?.getAttribute("value");
    if (name) {
      formData.append(name, value || "");
    }
    return formData;
  }
  function getCookieValue(cookieName) {
    if (cookieName != null) {
      const cookies = document.cookie ? document.cookie.split("; ") : [];
      const cookie = cookies.find((cookie2) => cookie2.startsWith(cookieName));
      if (cookie) {
        const value = cookie.split("=").slice(1).join("=");
        return value ? decodeURIComponent(value) : void 0;
      }
    }
  }
  function responseSucceededWithoutRedirect(response) {
    return response.statusCode == 200 && !response.redirected;
  }
  function getFormAction(formElement, submitter2) {
    const formElementAction = typeof formElement.action === "string" ? formElement.action : null;
    if (submitter2?.hasAttribute("formaction")) {
      return submitter2.getAttribute("formaction") || "";
    } else {
      return formElement.getAttribute("action") || formElementAction || "";
    }
  }
  function getAction(formAction, fetchMethod) {
    const action = expandURL(formAction);
    if (isSafe(fetchMethod)) {
      action.search = "";
    }
    return action;
  }
  function getMethod(formElement, submitter2) {
    const method = submitter2?.getAttribute("formmethod") || formElement.getAttribute("method") || "";
    return fetchMethodFromString(method.toLowerCase()) || FetchMethod.get;
  }
  function getEnctype(formElement, submitter2) {
    return fetchEnctypeFromString(submitter2?.getAttribute("formenctype") || formElement.enctype);
  }
  var Snapshot = class {
    constructor(element) {
      this.element = element;
    }
    get activeElement() {
      return this.element.ownerDocument.activeElement;
    }
    get children() {
      return [...this.element.children];
    }
    hasAnchor(anchor) {
      return this.getElementForAnchor(anchor) != null;
    }
    getElementForAnchor(anchor) {
      return anchor ? this.element.querySelector(`[id='${anchor}'], a[name='${anchor}']`) : null;
    }
    get isConnected() {
      return this.element.isConnected;
    }
    get firstAutofocusableElement() {
      return queryAutofocusableElement(this.element);
    }
    get permanentElements() {
      return queryPermanentElementsAll(this.element);
    }
    getPermanentElementById(id) {
      return getPermanentElementById(this.element, id);
    }
    getPermanentElementMapForSnapshot(snapshot) {
      const permanentElementMap = {};
      for (const currentPermanentElement of this.permanentElements) {
        const { id } = currentPermanentElement;
        const newPermanentElement = snapshot.getPermanentElementById(id);
        if (newPermanentElement) {
          permanentElementMap[id] = [currentPermanentElement, newPermanentElement];
        }
      }
      return permanentElementMap;
    }
  };
  function getPermanentElementById(node, id) {
    return node.querySelector(`#${id}[data-turbo-permanent]`);
  }
  function queryPermanentElementsAll(node) {
    return node.querySelectorAll("[id][data-turbo-permanent]");
  }
  var FormSubmitObserver = class {
    started = false;
    constructor(delegate, eventTarget) {
      this.delegate = delegate;
      this.eventTarget = eventTarget;
    }
    start() {
      if (!this.started) {
        this.eventTarget.addEventListener("submit", this.submitCaptured, true);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        this.eventTarget.removeEventListener("submit", this.submitCaptured, true);
        this.started = false;
      }
    }
    submitCaptured = () => {
      this.eventTarget.removeEventListener("submit", this.submitBubbled, false);
      this.eventTarget.addEventListener("submit", this.submitBubbled, false);
    };
    submitBubbled = (event) => {
      if (!event.defaultPrevented) {
        const form = event.target instanceof HTMLFormElement ? event.target : void 0;
        const submitter2 = event.submitter || void 0;
        if (form && submissionDoesNotDismissDialog(form, submitter2) && submissionDoesNotTargetIFrame(form, submitter2) && this.delegate.willSubmitForm(form, submitter2)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.delegate.formSubmitted(form, submitter2);
        }
      }
    };
  };
  function submissionDoesNotDismissDialog(form, submitter2) {
    const method = submitter2?.getAttribute("formmethod") || form.getAttribute("method");
    return method != "dialog";
  }
  function submissionDoesNotTargetIFrame(form, submitter2) {
    const target = submitter2?.getAttribute("formtarget") || form.getAttribute("target");
    return doesNotTargetIFrame(target);
  }
  var View = class {
    #resolveRenderPromise = (_value) => {
    };
    #resolveInterceptionPromise = (_value) => {
    };
    constructor(delegate, element) {
      this.delegate = delegate;
      this.element = element;
    }
    // Scrolling
    scrollToAnchor(anchor) {
      const element = this.snapshot.getElementForAnchor(anchor);
      if (element) {
        this.focusElement(element);
        this.scrollToElement(element);
      } else {
        this.scrollToPosition({ x: 0, y: 0 });
      }
    }
    scrollToAnchorFromLocation(location2) {
      this.scrollToAnchor(getAnchor(location2));
    }
    scrollToElement(element) {
      element.scrollIntoView();
    }
    focusElement(element) {
      if (element instanceof HTMLElement) {
        if (element.hasAttribute("tabindex")) {
          element.focus();
        } else {
          element.setAttribute("tabindex", "-1");
          element.focus();
          element.removeAttribute("tabindex");
        }
      }
    }
    scrollToPosition({ x, y }) {
      this.scrollRoot.scrollTo(x, y);
    }
    scrollToTop() {
      this.scrollToPosition({ x: 0, y: 0 });
    }
    get scrollRoot() {
      return window;
    }
    // Rendering
    async render(renderer) {
      const { isPreview, shouldRender, willRender, newSnapshot: snapshot } = renderer;
      const shouldInvalidate = willRender;
      if (shouldRender) {
        try {
          this.renderPromise = new Promise((resolve) => this.#resolveRenderPromise = resolve);
          this.renderer = renderer;
          await this.prepareToRenderSnapshot(renderer);
          const renderInterception = new Promise((resolve) => this.#resolveInterceptionPromise = resolve);
          const options = { resume: this.#resolveInterceptionPromise, render: this.renderer.renderElement, renderMethod: this.renderer.renderMethod };
          const immediateRender = this.delegate.allowsImmediateRender(snapshot, options);
          if (!immediateRender) await renderInterception;
          await this.renderSnapshot(renderer);
          this.delegate.viewRenderedSnapshot(snapshot, isPreview, this.renderer.renderMethod);
          this.delegate.preloadOnLoadLinksForView(this.element);
          this.finishRenderingSnapshot(renderer);
        } finally {
          delete this.renderer;
          this.#resolveRenderPromise(void 0);
          delete this.renderPromise;
        }
      } else if (shouldInvalidate) {
        this.invalidate(renderer.reloadReason);
      }
    }
    invalidate(reason) {
      this.delegate.viewInvalidated(reason);
    }
    async prepareToRenderSnapshot(renderer) {
      this.markAsPreview(renderer.isPreview);
      await renderer.prepareToRender();
    }
    markAsPreview(isPreview) {
      if (isPreview) {
        this.element.setAttribute("data-turbo-preview", "");
      } else {
        this.element.removeAttribute("data-turbo-preview");
      }
    }
    markVisitDirection(direction) {
      this.element.setAttribute("data-turbo-visit-direction", direction);
    }
    unmarkVisitDirection() {
      this.element.removeAttribute("data-turbo-visit-direction");
    }
    async renderSnapshot(renderer) {
      await renderer.render();
    }
    finishRenderingSnapshot(renderer) {
      renderer.finishRendering();
    }
  };
  var FrameView = class extends View {
    missing() {
      this.element.innerHTML = `<strong class="turbo-frame-error">Content missing</strong>`;
    }
    get snapshot() {
      return new Snapshot(this.element);
    }
  };
  var LinkInterceptor = class {
    constructor(delegate, element) {
      this.delegate = delegate;
      this.element = element;
    }
    start() {
      this.element.addEventListener("click", this.clickBubbled);
      document.addEventListener("turbo:click", this.linkClicked);
      document.addEventListener("turbo:before-visit", this.willVisit);
    }
    stop() {
      this.element.removeEventListener("click", this.clickBubbled);
      document.removeEventListener("turbo:click", this.linkClicked);
      document.removeEventListener("turbo:before-visit", this.willVisit);
    }
    clickBubbled = (event) => {
      if (this.clickEventIsSignificant(event)) {
        this.clickEvent = event;
      } else {
        delete this.clickEvent;
      }
    };
    linkClicked = (event) => {
      if (this.clickEvent && this.clickEventIsSignificant(event)) {
        if (this.delegate.shouldInterceptLinkClick(event.target, event.detail.url, event.detail.originalEvent)) {
          this.clickEvent.preventDefault();
          event.preventDefault();
          this.delegate.linkClickIntercepted(event.target, event.detail.url, event.detail.originalEvent);
        }
      }
      delete this.clickEvent;
    };
    willVisit = (_event) => {
      delete this.clickEvent;
    };
    clickEventIsSignificant(event) {
      const target = event.composed ? event.target?.parentElement : event.target;
      const element = findLinkFromClickTarget(target) || target;
      return element instanceof Element && element.closest("turbo-frame, html") == this.element;
    }
  };
  var LinkClickObserver = class {
    started = false;
    constructor(delegate, eventTarget) {
      this.delegate = delegate;
      this.eventTarget = eventTarget;
    }
    start() {
      if (!this.started) {
        this.eventTarget.addEventListener("click", this.clickCaptured, true);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        this.eventTarget.removeEventListener("click", this.clickCaptured, true);
        this.started = false;
      }
    }
    clickCaptured = () => {
      this.eventTarget.removeEventListener("click", this.clickBubbled, false);
      this.eventTarget.addEventListener("click", this.clickBubbled, false);
    };
    clickBubbled = (event) => {
      if (event instanceof MouseEvent && this.clickEventIsSignificant(event)) {
        const target = event.composedPath && event.composedPath()[0] || event.target;
        const link = findLinkFromClickTarget(target);
        if (link && doesNotTargetIFrame(link.target)) {
          const location2 = getLocationForLink(link);
          if (this.delegate.willFollowLinkToLocation(link, location2, event)) {
            event.preventDefault();
            this.delegate.followedLinkToLocation(link, location2);
          }
        }
      }
    };
    clickEventIsSignificant(event) {
      return !(event.target && event.target.isContentEditable || event.defaultPrevented || event.which > 1 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);
    }
  };
  var FormLinkClickObserver = class {
    constructor(delegate, element) {
      this.delegate = delegate;
      this.linkInterceptor = new LinkClickObserver(this, element);
    }
    start() {
      this.linkInterceptor.start();
    }
    stop() {
      this.linkInterceptor.stop();
    }
    // Link hover observer delegate
    canPrefetchRequestToLocation(link, location2) {
      return false;
    }
    prefetchAndCacheRequestToLocation(link, location2) {
      return;
    }
    // Link click observer delegate
    willFollowLinkToLocation(link, location2, originalEvent) {
      return this.delegate.willSubmitFormLinkToLocation(link, location2, originalEvent) && (link.hasAttribute("data-turbo-method") || link.hasAttribute("data-turbo-stream"));
    }
    followedLinkToLocation(link, location2) {
      const form = document.createElement("form");
      const type = "hidden";
      for (const [name, value] of location2.searchParams) {
        form.append(Object.assign(document.createElement("input"), { type, name, value }));
      }
      const action = Object.assign(location2, { search: "" });
      form.setAttribute("data-turbo", "true");
      form.setAttribute("action", action.href);
      form.setAttribute("hidden", "");
      const method = link.getAttribute("data-turbo-method");
      if (method) form.setAttribute("method", method);
      const turboFrame = link.getAttribute("data-turbo-frame");
      if (turboFrame) form.setAttribute("data-turbo-frame", turboFrame);
      const turboAction = getVisitAction(link);
      if (turboAction) form.setAttribute("data-turbo-action", turboAction);
      const turboConfirm = link.getAttribute("data-turbo-confirm");
      if (turboConfirm) form.setAttribute("data-turbo-confirm", turboConfirm);
      const turboStream = link.hasAttribute("data-turbo-stream");
      if (turboStream) form.setAttribute("data-turbo-stream", "");
      this.delegate.submittedFormLinkToLocation(link, location2, form);
      document.body.appendChild(form);
      form.addEventListener("turbo:submit-end", () => form.remove(), { once: true });
      requestAnimationFrame(() => form.requestSubmit());
    }
  };
  var Bardo = class {
    static async preservingPermanentElements(delegate, permanentElementMap, callback) {
      const bardo = new this(delegate, permanentElementMap);
      bardo.enter();
      await callback();
      bardo.leave();
    }
    constructor(delegate, permanentElementMap) {
      this.delegate = delegate;
      this.permanentElementMap = permanentElementMap;
    }
    enter() {
      for (const id in this.permanentElementMap) {
        const [currentPermanentElement, newPermanentElement] = this.permanentElementMap[id];
        this.delegate.enteringBardo(currentPermanentElement, newPermanentElement);
        this.replaceNewPermanentElementWithPlaceholder(newPermanentElement);
      }
    }
    leave() {
      for (const id in this.permanentElementMap) {
        const [currentPermanentElement] = this.permanentElementMap[id];
        this.replaceCurrentPermanentElementWithClone(currentPermanentElement);
        this.replacePlaceholderWithPermanentElement(currentPermanentElement);
        this.delegate.leavingBardo(currentPermanentElement);
      }
    }
    replaceNewPermanentElementWithPlaceholder(permanentElement) {
      const placeholder = createPlaceholderForPermanentElement(permanentElement);
      permanentElement.replaceWith(placeholder);
    }
    replaceCurrentPermanentElementWithClone(permanentElement) {
      const clone = permanentElement.cloneNode(true);
      permanentElement.replaceWith(clone);
    }
    replacePlaceholderWithPermanentElement(permanentElement) {
      const placeholder = this.getPlaceholderById(permanentElement.id);
      placeholder?.replaceWith(permanentElement);
    }
    getPlaceholderById(id) {
      return this.placeholders.find((element) => element.content == id);
    }
    get placeholders() {
      return [...document.querySelectorAll("meta[name=turbo-permanent-placeholder][content]")];
    }
  };
  function createPlaceholderForPermanentElement(permanentElement) {
    const element = document.createElement("meta");
    element.setAttribute("name", "turbo-permanent-placeholder");
    element.setAttribute("content", permanentElement.id);
    return element;
  }
  var Renderer = class {
    #activeElement = null;
    static renderElement(currentElement, newElement) {
    }
    constructor(currentSnapshot, newSnapshot, isPreview, willRender = true) {
      this.currentSnapshot = currentSnapshot;
      this.newSnapshot = newSnapshot;
      this.isPreview = isPreview;
      this.willRender = willRender;
      this.renderElement = this.constructor.renderElement;
      this.promise = new Promise((resolve, reject) => this.resolvingFunctions = { resolve, reject });
    }
    get shouldRender() {
      return true;
    }
    get shouldAutofocus() {
      return true;
    }
    get reloadReason() {
      return;
    }
    prepareToRender() {
      return;
    }
    render() {
    }
    finishRendering() {
      if (this.resolvingFunctions) {
        this.resolvingFunctions.resolve();
        delete this.resolvingFunctions;
      }
    }
    async preservingPermanentElements(callback) {
      await Bardo.preservingPermanentElements(this, this.permanentElementMap, callback);
    }
    focusFirstAutofocusableElement() {
      if (this.shouldAutofocus) {
        const element = this.connectedSnapshot.firstAutofocusableElement;
        if (element) {
          element.focus();
        }
      }
    }
    // Bardo delegate
    enteringBardo(currentPermanentElement) {
      if (this.#activeElement) return;
      if (currentPermanentElement.contains(this.currentSnapshot.activeElement)) {
        this.#activeElement = this.currentSnapshot.activeElement;
      }
    }
    leavingBardo(currentPermanentElement) {
      if (currentPermanentElement.contains(this.#activeElement) && this.#activeElement instanceof HTMLElement) {
        this.#activeElement.focus();
        this.#activeElement = null;
      }
    }
    get connectedSnapshot() {
      return this.newSnapshot.isConnected ? this.newSnapshot : this.currentSnapshot;
    }
    get currentElement() {
      return this.currentSnapshot.element;
    }
    get newElement() {
      return this.newSnapshot.element;
    }
    get permanentElementMap() {
      return this.currentSnapshot.getPermanentElementMapForSnapshot(this.newSnapshot);
    }
    get renderMethod() {
      return "replace";
    }
  };
  var FrameRenderer = class extends Renderer {
    static renderElement(currentElement, newElement) {
      const destinationRange = document.createRange();
      destinationRange.selectNodeContents(currentElement);
      destinationRange.deleteContents();
      const frameElement = newElement;
      const sourceRange = frameElement.ownerDocument?.createRange();
      if (sourceRange) {
        sourceRange.selectNodeContents(frameElement);
        currentElement.appendChild(sourceRange.extractContents());
      }
    }
    constructor(delegate, currentSnapshot, newSnapshot, renderElement, isPreview, willRender = true) {
      super(currentSnapshot, newSnapshot, renderElement, isPreview, willRender);
      this.delegate = delegate;
    }
    get shouldRender() {
      return true;
    }
    async render() {
      await nextRepaint();
      this.preservingPermanentElements(() => {
        this.loadFrameElement();
      });
      this.scrollFrameIntoView();
      await nextRepaint();
      this.focusFirstAutofocusableElement();
      await nextRepaint();
      this.activateScriptElements();
    }
    loadFrameElement() {
      this.delegate.willRenderFrame(this.currentElement, this.newElement);
      this.renderElement(this.currentElement, this.newElement);
    }
    scrollFrameIntoView() {
      if (this.currentElement.autoscroll || this.newElement.autoscroll) {
        const element = this.currentElement.firstElementChild;
        const block = readScrollLogicalPosition(this.currentElement.getAttribute("data-autoscroll-block"), "end");
        const behavior = readScrollBehavior(this.currentElement.getAttribute("data-autoscroll-behavior"), "auto");
        if (element) {
          element.scrollIntoView({ block, behavior });
          return true;
        }
      }
      return false;
    }
    activateScriptElements() {
      for (const inertScriptElement of this.newScriptElements) {
        const activatedScriptElement = activateScriptElement(inertScriptElement);
        inertScriptElement.replaceWith(activatedScriptElement);
      }
    }
    get newScriptElements() {
      return this.currentElement.querySelectorAll("script");
    }
  };
  function readScrollLogicalPosition(value, defaultValue) {
    if (value == "end" || value == "start" || value == "center" || value == "nearest") {
      return value;
    } else {
      return defaultValue;
    }
  }
  function readScrollBehavior(value, defaultValue) {
    if (value == "auto" || value == "smooth") {
      return value;
    } else {
      return defaultValue;
    }
  }
  var Idiomorph = (function() {
    const noOp = () => {
    };
    const defaults = {
      morphStyle: "outerHTML",
      callbacks: {
        beforeNodeAdded: noOp,
        afterNodeAdded: noOp,
        beforeNodeMorphed: noOp,
        afterNodeMorphed: noOp,
        beforeNodeRemoved: noOp,
        afterNodeRemoved: noOp,
        beforeAttributeUpdated: noOp
      },
      head: {
        style: "merge",
        shouldPreserve: (elt) => elt.getAttribute("im-preserve") === "true",
        shouldReAppend: (elt) => elt.getAttribute("im-re-append") === "true",
        shouldRemove: noOp,
        afterHeadMorphed: noOp
      },
      restoreFocus: true
    };
    function morph(oldNode, newContent, config2 = {}) {
      oldNode = normalizeElement(oldNode);
      const newNode = normalizeParent(newContent);
      const ctx = createMorphContext(oldNode, newNode, config2);
      const morphedNodes = saveAndRestoreFocus(ctx, () => {
        return withHeadBlocking(
          ctx,
          oldNode,
          newNode,
          /** @param {MorphContext} ctx */
          (ctx2) => {
            if (ctx2.morphStyle === "innerHTML") {
              morphChildren2(ctx2, oldNode, newNode);
              return Array.from(oldNode.childNodes);
            } else {
              return morphOuterHTML(ctx2, oldNode, newNode);
            }
          }
        );
      });
      ctx.pantry.remove();
      return morphedNodes;
    }
    function morphOuterHTML(ctx, oldNode, newNode) {
      const oldParent = normalizeParent(oldNode);
      morphChildren2(
        ctx,
        oldParent,
        newNode,
        // these two optional params are the secret sauce
        oldNode,
        // start point for iteration
        oldNode.nextSibling
        // end point for iteration
      );
      return Array.from(oldParent.childNodes);
    }
    function saveAndRestoreFocus(ctx, fn2) {
      if (!ctx.config.restoreFocus) return fn2();
      let activeElement = (
        /** @type {HTMLInputElement|HTMLTextAreaElement|null} */
        document.activeElement
      );
      if (!(activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)) {
        return fn2();
      }
      const { id: activeElementId, selectionStart, selectionEnd } = activeElement;
      const results = fn2();
      if (activeElementId && activeElementId !== document.activeElement?.getAttribute("id")) {
        activeElement = ctx.target.querySelector(`[id="${activeElementId}"]`);
        activeElement?.focus();
      }
      if (activeElement && !activeElement.selectionEnd && selectionEnd) {
        activeElement.setSelectionRange(selectionStart, selectionEnd);
      }
      return results;
    }
    const morphChildren2 = /* @__PURE__ */ (function() {
      function morphChildren3(ctx, oldParent, newParent, insertionPoint = null, endPoint = null) {
        if (oldParent instanceof HTMLTemplateElement && newParent instanceof HTMLTemplateElement) {
          oldParent = oldParent.content;
          newParent = newParent.content;
        }
        insertionPoint ||= oldParent.firstChild;
        for (const newChild of newParent.childNodes) {
          if (insertionPoint && insertionPoint != endPoint) {
            const bestMatch = findBestMatch(
              ctx,
              newChild,
              insertionPoint,
              endPoint
            );
            if (bestMatch) {
              if (bestMatch !== insertionPoint) {
                removeNodesBetween(ctx, insertionPoint, bestMatch);
              }
              morphNode(bestMatch, newChild, ctx);
              insertionPoint = bestMatch.nextSibling;
              continue;
            }
          }
          if (newChild instanceof Element) {
            const newChildId = (
              /** @type {String} */
              newChild.getAttribute("id")
            );
            if (ctx.persistentIds.has(newChildId)) {
              const movedChild = moveBeforeById(
                oldParent,
                newChildId,
                insertionPoint,
                ctx
              );
              morphNode(movedChild, newChild, ctx);
              insertionPoint = movedChild.nextSibling;
              continue;
            }
          }
          const insertedNode = createNode(
            oldParent,
            newChild,
            insertionPoint,
            ctx
          );
          if (insertedNode) {
            insertionPoint = insertedNode.nextSibling;
          }
        }
        while (insertionPoint && insertionPoint != endPoint) {
          const tempNode = insertionPoint;
          insertionPoint = insertionPoint.nextSibling;
          removeNode(ctx, tempNode);
        }
      }
      function createNode(oldParent, newChild, insertionPoint, ctx) {
        if (ctx.callbacks.beforeNodeAdded(newChild) === false) return null;
        if (ctx.idMap.has(newChild)) {
          const newEmptyChild = document.createElement(
            /** @type {Element} */
            newChild.tagName
          );
          oldParent.insertBefore(newEmptyChild, insertionPoint);
          morphNode(newEmptyChild, newChild, ctx);
          ctx.callbacks.afterNodeAdded(newEmptyChild);
          return newEmptyChild;
        } else {
          const newClonedChild = document.importNode(newChild, true);
          oldParent.insertBefore(newClonedChild, insertionPoint);
          ctx.callbacks.afterNodeAdded(newClonedChild);
          return newClonedChild;
        }
      }
      const findBestMatch = /* @__PURE__ */ (function() {
        function findBestMatch2(ctx, node, startPoint, endPoint) {
          let softMatch = null;
          let nextSibling = node.nextSibling;
          let siblingSoftMatchCount = 0;
          let cursor = startPoint;
          while (cursor && cursor != endPoint) {
            if (isSoftMatch(cursor, node)) {
              if (isIdSetMatch(ctx, cursor, node)) {
                return cursor;
              }
              if (softMatch === null) {
                if (!ctx.idMap.has(cursor)) {
                  softMatch = cursor;
                }
              }
            }
            if (softMatch === null && nextSibling && isSoftMatch(cursor, nextSibling)) {
              siblingSoftMatchCount++;
              nextSibling = nextSibling.nextSibling;
              if (siblingSoftMatchCount >= 2) {
                softMatch = void 0;
              }
            }
            if (ctx.activeElementAndParents.includes(cursor)) break;
            cursor = cursor.nextSibling;
          }
          return softMatch || null;
        }
        function isIdSetMatch(ctx, oldNode, newNode) {
          let oldSet = ctx.idMap.get(oldNode);
          let newSet = ctx.idMap.get(newNode);
          if (!newSet || !oldSet) return false;
          for (const id of oldSet) {
            if (newSet.has(id)) {
              return true;
            }
          }
          return false;
        }
        function isSoftMatch(oldNode, newNode) {
          const oldElt = (
            /** @type {Element} */
            oldNode
          );
          const newElt = (
            /** @type {Element} */
            newNode
          );
          return oldElt.nodeType === newElt.nodeType && oldElt.tagName === newElt.tagName && // If oldElt has an `id` with possible state and it doesn't match newElt.id then avoid morphing.
          // We'll still match an anonymous node with an IDed newElt, though, because if it got this far,
          // its not persistent, and new nodes can't have any hidden state.
          // We can't use .id because of form input shadowing, and we can't count on .getAttribute's presence because it could be a document-fragment
          (!oldElt.getAttribute?.("id") || oldElt.getAttribute?.("id") === newElt.getAttribute?.("id"));
        }
        return findBestMatch2;
      })();
      function removeNode(ctx, node) {
        if (ctx.idMap.has(node)) {
          moveBefore(ctx.pantry, node, null);
        } else {
          if (ctx.callbacks.beforeNodeRemoved(node) === false) return;
          node.parentNode?.removeChild(node);
          ctx.callbacks.afterNodeRemoved(node);
        }
      }
      function removeNodesBetween(ctx, startInclusive, endExclusive) {
        let cursor = startInclusive;
        while (cursor && cursor !== endExclusive) {
          let tempNode = (
            /** @type {Node} */
            cursor
          );
          cursor = cursor.nextSibling;
          removeNode(ctx, tempNode);
        }
        return cursor;
      }
      function moveBeforeById(parentNode, id, after, ctx) {
        const target = (
          /** @type {Element} - will always be found */
          // ctx.target.id unsafe because of form input shadowing
          // ctx.target could be a document fragment which doesn't have `getAttribute`
          ctx.target.getAttribute?.("id") === id && ctx.target || ctx.target.querySelector(`[id="${id}"]`) || ctx.pantry.querySelector(`[id="${id}"]`)
        );
        removeElementFromAncestorsIdMaps(target, ctx);
        moveBefore(parentNode, target, after);
        return target;
      }
      function removeElementFromAncestorsIdMaps(element, ctx) {
        const id = (
          /** @type {String} */
          element.getAttribute("id")
        );
        while (element = element.parentNode) {
          let idSet = ctx.idMap.get(element);
          if (idSet) {
            idSet.delete(id);
            if (!idSet.size) {
              ctx.idMap.delete(element);
            }
          }
        }
      }
      function moveBefore(parentNode, element, after) {
        if (parentNode.moveBefore) {
          try {
            parentNode.moveBefore(element, after);
          } catch (e) {
            parentNode.insertBefore(element, after);
          }
        } else {
          parentNode.insertBefore(element, after);
        }
      }
      return morphChildren3;
    })();
    const morphNode = /* @__PURE__ */ (function() {
      function morphNode2(oldNode, newContent, ctx) {
        if (ctx.ignoreActive && oldNode === document.activeElement) {
          return null;
        }
        if (ctx.callbacks.beforeNodeMorphed(oldNode, newContent) === false) {
          return oldNode;
        }
        if (oldNode instanceof HTMLHeadElement && ctx.head.ignore) ;
        else if (oldNode instanceof HTMLHeadElement && ctx.head.style !== "morph") {
          handleHeadElement(
            oldNode,
            /** @type {HTMLHeadElement} */
            newContent,
            ctx
          );
        } else {
          morphAttributes(oldNode, newContent, ctx);
          if (!ignoreValueOfActiveElement(oldNode, ctx)) {
            morphChildren2(ctx, oldNode, newContent);
          }
        }
        ctx.callbacks.afterNodeMorphed(oldNode, newContent);
        return oldNode;
      }
      function morphAttributes(oldNode, newNode, ctx) {
        let type = newNode.nodeType;
        if (type === 1) {
          const oldElt = (
            /** @type {Element} */
            oldNode
          );
          const newElt = (
            /** @type {Element} */
            newNode
          );
          const oldAttributes = oldElt.attributes;
          const newAttributes = newElt.attributes;
          for (const newAttribute of newAttributes) {
            if (ignoreAttribute(newAttribute.name, oldElt, "update", ctx)) {
              continue;
            }
            if (oldElt.getAttribute(newAttribute.name) !== newAttribute.value) {
              oldElt.setAttribute(newAttribute.name, newAttribute.value);
            }
          }
          for (let i = oldAttributes.length - 1; 0 <= i; i--) {
            const oldAttribute = oldAttributes[i];
            if (!oldAttribute) continue;
            if (!newElt.hasAttribute(oldAttribute.name)) {
              if (ignoreAttribute(oldAttribute.name, oldElt, "remove", ctx)) {
                continue;
              }
              oldElt.removeAttribute(oldAttribute.name);
            }
          }
          if (!ignoreValueOfActiveElement(oldElt, ctx)) {
            syncInputValue(oldElt, newElt, ctx);
          }
        }
        if (type === 8 || type === 3) {
          if (oldNode.nodeValue !== newNode.nodeValue) {
            oldNode.nodeValue = newNode.nodeValue;
          }
        }
      }
      function syncInputValue(oldElement, newElement, ctx) {
        if (oldElement instanceof HTMLInputElement && newElement instanceof HTMLInputElement && newElement.type !== "file") {
          let newValue = newElement.value;
          let oldValue = oldElement.value;
          syncBooleanAttribute(oldElement, newElement, "checked", ctx);
          syncBooleanAttribute(oldElement, newElement, "disabled", ctx);
          if (!newElement.hasAttribute("value")) {
            if (!ignoreAttribute("value", oldElement, "remove", ctx)) {
              oldElement.value = "";
              oldElement.removeAttribute("value");
            }
          } else if (oldValue !== newValue) {
            if (!ignoreAttribute("value", oldElement, "update", ctx)) {
              oldElement.setAttribute("value", newValue);
              oldElement.value = newValue;
            }
          }
        } else if (oldElement instanceof HTMLOptionElement && newElement instanceof HTMLOptionElement) {
          syncBooleanAttribute(oldElement, newElement, "selected", ctx);
        } else if (oldElement instanceof HTMLTextAreaElement && newElement instanceof HTMLTextAreaElement) {
          let newValue = newElement.value;
          let oldValue = oldElement.value;
          if (ignoreAttribute("value", oldElement, "update", ctx)) {
            return;
          }
          if (newValue !== oldValue) {
            oldElement.value = newValue;
          }
          if (oldElement.firstChild && oldElement.firstChild.nodeValue !== newValue) {
            oldElement.firstChild.nodeValue = newValue;
          }
        }
      }
      function syncBooleanAttribute(oldElement, newElement, attributeName, ctx) {
        const newLiveValue = newElement[attributeName], oldLiveValue = oldElement[attributeName];
        if (newLiveValue !== oldLiveValue) {
          const ignoreUpdate = ignoreAttribute(
            attributeName,
            oldElement,
            "update",
            ctx
          );
          if (!ignoreUpdate) {
            oldElement[attributeName] = newElement[attributeName];
          }
          if (newLiveValue) {
            if (!ignoreUpdate) {
              oldElement.setAttribute(attributeName, "");
            }
          } else {
            if (!ignoreAttribute(attributeName, oldElement, "remove", ctx)) {
              oldElement.removeAttribute(attributeName);
            }
          }
        }
      }
      function ignoreAttribute(attr, element, updateType, ctx) {
        if (attr === "value" && ctx.ignoreActiveValue && element === document.activeElement) {
          return true;
        }
        return ctx.callbacks.beforeAttributeUpdated(attr, element, updateType) === false;
      }
      function ignoreValueOfActiveElement(possibleActiveElement, ctx) {
        return !!ctx.ignoreActiveValue && possibleActiveElement === document.activeElement && possibleActiveElement !== document.body;
      }
      return morphNode2;
    })();
    function withHeadBlocking(ctx, oldNode, newNode, callback) {
      if (ctx.head.block) {
        const oldHead = oldNode.querySelector("head");
        const newHead = newNode.querySelector("head");
        if (oldHead && newHead) {
          const promises = handleHeadElement(oldHead, newHead, ctx);
          return Promise.all(promises).then(() => {
            const newCtx = Object.assign(ctx, {
              head: {
                block: false,
                ignore: true
              }
            });
            return callback(newCtx);
          });
        }
      }
      return callback(ctx);
    }
    function handleHeadElement(oldHead, newHead, ctx) {
      let added = [];
      let removed = [];
      let preserved = [];
      let nodesToAppend = [];
      let srcToNewHeadNodes = /* @__PURE__ */ new Map();
      for (const newHeadChild of newHead.children) {
        srcToNewHeadNodes.set(newHeadChild.outerHTML, newHeadChild);
      }
      for (const currentHeadElt of oldHead.children) {
        let inNewContent = srcToNewHeadNodes.has(currentHeadElt.outerHTML);
        let isReAppended = ctx.head.shouldReAppend(currentHeadElt);
        let isPreserved = ctx.head.shouldPreserve(currentHeadElt);
        if (inNewContent || isPreserved) {
          if (isReAppended) {
            removed.push(currentHeadElt);
          } else {
            srcToNewHeadNodes.delete(currentHeadElt.outerHTML);
            preserved.push(currentHeadElt);
          }
        } else {
          if (ctx.head.style === "append") {
            if (isReAppended) {
              removed.push(currentHeadElt);
              nodesToAppend.push(currentHeadElt);
            }
          } else {
            if (ctx.head.shouldRemove(currentHeadElt) !== false) {
              removed.push(currentHeadElt);
            }
          }
        }
      }
      nodesToAppend.push(...srcToNewHeadNodes.values());
      let promises = [];
      for (const newNode of nodesToAppend) {
        let newElt = (
          /** @type {ChildNode} */
          document.createRange().createContextualFragment(newNode.outerHTML).firstChild
        );
        if (ctx.callbacks.beforeNodeAdded(newElt) !== false) {
          if ("href" in newElt && newElt.href || "src" in newElt && newElt.src) {
            let resolve;
            let promise = new Promise(function(_resolve) {
              resolve = _resolve;
            });
            newElt.addEventListener("load", function() {
              resolve();
            });
            promises.push(promise);
          }
          oldHead.appendChild(newElt);
          ctx.callbacks.afterNodeAdded(newElt);
          added.push(newElt);
        }
      }
      for (const removedElement of removed) {
        if (ctx.callbacks.beforeNodeRemoved(removedElement) !== false) {
          oldHead.removeChild(removedElement);
          ctx.callbacks.afterNodeRemoved(removedElement);
        }
      }
      ctx.head.afterHeadMorphed(oldHead, {
        added,
        kept: preserved,
        removed
      });
      return promises;
    }
    const createMorphContext = /* @__PURE__ */ (function() {
      function createMorphContext2(oldNode, newContent, config2) {
        const { persistentIds, idMap } = createIdMaps(oldNode, newContent);
        const mergedConfig = mergeDefaults(config2);
        const morphStyle = mergedConfig.morphStyle || "outerHTML";
        if (!["innerHTML", "outerHTML"].includes(morphStyle)) {
          throw `Do not understand how to morph style ${morphStyle}`;
        }
        return {
          target: oldNode,
          newContent,
          config: mergedConfig,
          morphStyle,
          ignoreActive: mergedConfig.ignoreActive,
          ignoreActiveValue: mergedConfig.ignoreActiveValue,
          restoreFocus: mergedConfig.restoreFocus,
          idMap,
          persistentIds,
          pantry: createPantry(),
          activeElementAndParents: createActiveElementAndParents(oldNode),
          callbacks: mergedConfig.callbacks,
          head: mergedConfig.head
        };
      }
      function mergeDefaults(config2) {
        let finalConfig = Object.assign({}, defaults);
        Object.assign(finalConfig, config2);
        finalConfig.callbacks = Object.assign(
          {},
          defaults.callbacks,
          config2.callbacks
        );
        finalConfig.head = Object.assign({}, defaults.head, config2.head);
        return finalConfig;
      }
      function createPantry() {
        const pantry = document.createElement("div");
        pantry.hidden = true;
        document.body.insertAdjacentElement("afterend", pantry);
        return pantry;
      }
      function createActiveElementAndParents(oldNode) {
        let activeElementAndParents = [];
        let elt = document.activeElement;
        if (elt?.tagName !== "BODY" && oldNode.contains(elt)) {
          while (elt) {
            activeElementAndParents.push(elt);
            if (elt === oldNode) break;
            elt = elt.parentElement;
          }
        }
        return activeElementAndParents;
      }
      function findIdElements(root) {
        let elements = Array.from(root.querySelectorAll("[id]"));
        if (root.getAttribute?.("id")) {
          elements.push(root);
        }
        return elements;
      }
      function populateIdMapWithTree(idMap, persistentIds, root, elements) {
        for (const elt of elements) {
          const id = (
            /** @type {String} */
            elt.getAttribute("id")
          );
          if (persistentIds.has(id)) {
            let current = elt;
            while (current) {
              let idSet = idMap.get(current);
              if (idSet == null) {
                idSet = /* @__PURE__ */ new Set();
                idMap.set(current, idSet);
              }
              idSet.add(id);
              if (current === root) break;
              current = current.parentElement;
            }
          }
        }
      }
      function createIdMaps(oldContent, newContent) {
        const oldIdElements = findIdElements(oldContent);
        const newIdElements = findIdElements(newContent);
        const persistentIds = createPersistentIds(oldIdElements, newIdElements);
        let idMap = /* @__PURE__ */ new Map();
        populateIdMapWithTree(idMap, persistentIds, oldContent, oldIdElements);
        const newRoot = newContent.__idiomorphRoot || newContent;
        populateIdMapWithTree(idMap, persistentIds, newRoot, newIdElements);
        return { persistentIds, idMap };
      }
      function createPersistentIds(oldIdElements, newIdElements) {
        let duplicateIds = /* @__PURE__ */ new Set();
        let oldIdTagNameMap = /* @__PURE__ */ new Map();
        for (const { id, tagName } of oldIdElements) {
          if (oldIdTagNameMap.has(id)) {
            duplicateIds.add(id);
          } else {
            oldIdTagNameMap.set(id, tagName);
          }
        }
        let persistentIds = /* @__PURE__ */ new Set();
        for (const { id, tagName } of newIdElements) {
          if (persistentIds.has(id)) {
            duplicateIds.add(id);
          } else if (oldIdTagNameMap.get(id) === tagName) {
            persistentIds.add(id);
          }
        }
        for (const id of duplicateIds) {
          persistentIds.delete(id);
        }
        return persistentIds;
      }
      return createMorphContext2;
    })();
    const { normalizeElement, normalizeParent } = /* @__PURE__ */ (function() {
      const generatedByIdiomorph = /* @__PURE__ */ new WeakSet();
      function normalizeElement2(content) {
        if (content instanceof Document) {
          return content.documentElement;
        } else {
          return content;
        }
      }
      function normalizeParent2(newContent) {
        if (newContent == null) {
          return document.createElement("div");
        } else if (typeof newContent === "string") {
          return normalizeParent2(parseContent(newContent));
        } else if (generatedByIdiomorph.has(
          /** @type {Element} */
          newContent
        )) {
          return (
            /** @type {Element} */
            newContent
          );
        } else if (newContent instanceof Node) {
          if (newContent.parentNode) {
            return (
              /** @type {any} */
              new SlicedParentNode(newContent)
            );
          } else {
            const dummyParent = document.createElement("div");
            dummyParent.append(newContent);
            return dummyParent;
          }
        } else {
          const dummyParent = document.createElement("div");
          for (const elt of [...newContent]) {
            dummyParent.append(elt);
          }
          return dummyParent;
        }
      }
      class SlicedParentNode {
        /** @param {Node} node */
        constructor(node) {
          this.originalNode = node;
          this.realParentNode = /** @type {Element} */
          node.parentNode;
          this.previousSibling = node.previousSibling;
          this.nextSibling = node.nextSibling;
        }
        /** @returns {Node[]} */
        get childNodes() {
          const nodes = [];
          let cursor = this.previousSibling ? this.previousSibling.nextSibling : this.realParentNode.firstChild;
          while (cursor && cursor != this.nextSibling) {
            nodes.push(cursor);
            cursor = cursor.nextSibling;
          }
          return nodes;
        }
        /**
         * @param {string} selector
         * @returns {Element[]}
         */
        querySelectorAll(selector) {
          return this.childNodes.reduce(
            (results, node) => {
              if (node instanceof Element) {
                if (node.matches(selector)) results.push(node);
                const nodeList = node.querySelectorAll(selector);
                for (let i = 0; i < nodeList.length; i++) {
                  results.push(nodeList[i]);
                }
              }
              return results;
            },
            /** @type {Element[]} */
            []
          );
        }
        /**
         * @param {Node} node
         * @param {Node} referenceNode
         * @returns {Node}
         */
        insertBefore(node, referenceNode) {
          return this.realParentNode.insertBefore(node, referenceNode);
        }
        /**
         * @param {Node} node
         * @param {Node} referenceNode
         * @returns {Node}
         */
        moveBefore(node, referenceNode) {
          return this.realParentNode.moveBefore(node, referenceNode);
        }
        /**
         * for later use with populateIdMapWithTree to halt upwards iteration
         * @returns {Node}
         */
        get __idiomorphRoot() {
          return this.originalNode;
        }
      }
      function parseContent(newContent) {
        let parser = new DOMParser();
        let contentWithSvgsRemoved = newContent.replace(
          /<svg(\s[^>]*>|>)([\s\S]*?)<\/svg>/gim,
          ""
        );
        if (contentWithSvgsRemoved.match(/<\/html>/) || contentWithSvgsRemoved.match(/<\/head>/) || contentWithSvgsRemoved.match(/<\/body>/)) {
          let content = parser.parseFromString(newContent, "text/html");
          if (contentWithSvgsRemoved.match(/<\/html>/)) {
            generatedByIdiomorph.add(content);
            return content;
          } else {
            let htmlElement = content.firstChild;
            if (htmlElement) {
              generatedByIdiomorph.add(htmlElement);
            }
            return htmlElement;
          }
        } else {
          let responseDoc = parser.parseFromString(
            "<body><template>" + newContent + "</template></body>",
            "text/html"
          );
          let content = (
            /** @type {HTMLTemplateElement} */
            responseDoc.body.querySelector("template").content
          );
          generatedByIdiomorph.add(content);
          return content;
        }
      }
      return { normalizeElement: normalizeElement2, normalizeParent: normalizeParent2 };
    })();
    return {
      morph,
      defaults
    };
  })();
  function morphElements(currentElement, newElement, { callbacks, ...options } = {}) {
    Idiomorph.morph(currentElement, newElement, {
      ...options,
      callbacks: new DefaultIdiomorphCallbacks(callbacks)
    });
  }
  function morphChildren(currentElement, newElement, options = {}) {
    morphElements(currentElement, newElement.childNodes, {
      ...options,
      morphStyle: "innerHTML"
    });
  }
  function shouldRefreshFrameWithMorphing(currentFrame, newFrame) {
    return currentFrame instanceof FrameElement && currentFrame.shouldReloadWithMorph && (!newFrame || areFramesCompatibleForRefreshing(currentFrame, newFrame)) && !currentFrame.closest("[data-turbo-permanent]");
  }
  function areFramesCompatibleForRefreshing(currentFrame, newFrame) {
    return newFrame instanceof Element && newFrame.nodeName === "TURBO-FRAME" && currentFrame.id === newFrame.id && (!newFrame.getAttribute("src") || urlsAreEqual(currentFrame.src, newFrame.getAttribute("src")));
  }
  function closestFrameReloadableWithMorphing(node) {
    return node.parentElement.closest("turbo-frame[src][refresh=morph]");
  }
  var DefaultIdiomorphCallbacks = class {
    #beforeNodeMorphed;
    constructor({ beforeNodeMorphed } = {}) {
      this.#beforeNodeMorphed = beforeNodeMorphed || (() => true);
    }
    beforeNodeAdded = (node) => {
      return !(node.id && node.hasAttribute("data-turbo-permanent") && document.getElementById(node.id));
    };
    beforeNodeMorphed = (currentElement, newElement) => {
      if (currentElement instanceof Element) {
        if (!currentElement.hasAttribute("data-turbo-permanent") && this.#beforeNodeMorphed(currentElement, newElement)) {
          const event = dispatch("turbo:before-morph-element", {
            cancelable: true,
            target: currentElement,
            detail: { currentElement, newElement }
          });
          return !event.defaultPrevented;
        } else {
          return false;
        }
      }
    };
    beforeAttributeUpdated = (attributeName, target, mutationType) => {
      const event = dispatch("turbo:before-morph-attribute", {
        cancelable: true,
        target,
        detail: { attributeName, mutationType }
      });
      return !event.defaultPrevented;
    };
    beforeNodeRemoved = (node) => {
      return this.beforeNodeMorphed(node);
    };
    afterNodeMorphed = (currentElement, newElement) => {
      if (currentElement instanceof Element) {
        dispatch("turbo:morph-element", {
          target: currentElement,
          detail: { currentElement, newElement }
        });
      }
    };
  };
  var MorphingFrameRenderer = class extends FrameRenderer {
    static renderElement(currentElement, newElement) {
      dispatch("turbo:before-frame-morph", {
        target: currentElement,
        detail: { currentElement, newElement }
      });
      morphChildren(currentElement, newElement, {
        callbacks: {
          beforeNodeMorphed: (node, newNode) => {
            if (shouldRefreshFrameWithMorphing(node, newNode) && closestFrameReloadableWithMorphing(node) === currentElement) {
              node.reload();
              return false;
            }
            return true;
          }
        }
      });
    }
    async preservingPermanentElements(callback) {
      return await callback();
    }
  };
  var ProgressBar = class _ProgressBar {
    static animationDuration = 300;
    /*ms*/
    static get defaultCSS() {
      return unindent`
      .turbo-progress-bar {
        position: fixed;
        display: block;
        top: 0;
        left: 0;
        height: 3px;
        background: #0076ff;
        z-index: 2147483647;
        transition:
          width ${_ProgressBar.animationDuration}ms ease-out,
          opacity ${_ProgressBar.animationDuration / 2}ms ${_ProgressBar.animationDuration / 2}ms ease-in;
        transform: translate3d(0, 0, 0);
      }
    `;
    }
    hiding = false;
    value = 0;
    visible = false;
    constructor() {
      this.stylesheetElement = this.createStylesheetElement();
      this.progressElement = this.createProgressElement();
      this.installStylesheetElement();
      this.setValue(0);
    }
    show() {
      if (!this.visible) {
        this.visible = true;
        this.installProgressElement();
        this.startTrickling();
      }
    }
    hide() {
      if (this.visible && !this.hiding) {
        this.hiding = true;
        this.fadeProgressElement(() => {
          this.uninstallProgressElement();
          this.stopTrickling();
          this.visible = false;
          this.hiding = false;
        });
      }
    }
    setValue(value) {
      this.value = value;
      this.refresh();
    }
    // Private
    installStylesheetElement() {
      document.head.insertBefore(this.stylesheetElement, document.head.firstChild);
    }
    installProgressElement() {
      this.progressElement.style.width = "0";
      this.progressElement.style.opacity = "1";
      document.documentElement.insertBefore(this.progressElement, document.body);
      this.refresh();
    }
    fadeProgressElement(callback) {
      this.progressElement.style.opacity = "0";
      setTimeout(callback, _ProgressBar.animationDuration * 1.5);
    }
    uninstallProgressElement() {
      if (this.progressElement.parentNode) {
        document.documentElement.removeChild(this.progressElement);
      }
    }
    startTrickling() {
      if (!this.trickleInterval) {
        this.trickleInterval = window.setInterval(this.trickle, _ProgressBar.animationDuration);
      }
    }
    stopTrickling() {
      window.clearInterval(this.trickleInterval);
      delete this.trickleInterval;
    }
    trickle = () => {
      this.setValue(this.value + Math.random() / 100);
    };
    refresh() {
      requestAnimationFrame(() => {
        this.progressElement.style.width = `${10 + this.value * 90}%`;
      });
    }
    createStylesheetElement() {
      const element = document.createElement("style");
      element.type = "text/css";
      element.textContent = _ProgressBar.defaultCSS;
      const cspNonce = getCspNonce();
      if (cspNonce) {
        element.nonce = cspNonce;
      }
      return element;
    }
    createProgressElement() {
      const element = document.createElement("div");
      element.className = "turbo-progress-bar";
      return element;
    }
  };
  var HeadSnapshot = class extends Snapshot {
    detailsByOuterHTML = this.children.filter((element) => !elementIsNoscript(element)).map((element) => elementWithoutNonce(element)).reduce((result, element) => {
      const { outerHTML } = element;
      const details = outerHTML in result ? result[outerHTML] : {
        type: elementType(element),
        tracked: elementIsTracked(element),
        elements: []
      };
      return {
        ...result,
        [outerHTML]: {
          ...details,
          elements: [...details.elements, element]
        }
      };
    }, {});
    get trackedElementSignature() {
      return Object.keys(this.detailsByOuterHTML).filter((outerHTML) => this.detailsByOuterHTML[outerHTML].tracked).join("");
    }
    getScriptElementsNotInSnapshot(snapshot) {
      return this.getElementsMatchingTypeNotInSnapshot("script", snapshot);
    }
    getStylesheetElementsNotInSnapshot(snapshot) {
      return this.getElementsMatchingTypeNotInSnapshot("stylesheet", snapshot);
    }
    getElementsMatchingTypeNotInSnapshot(matchedType, snapshot) {
      return Object.keys(this.detailsByOuterHTML).filter((outerHTML) => !(outerHTML in snapshot.detailsByOuterHTML)).map((outerHTML) => this.detailsByOuterHTML[outerHTML]).filter(({ type }) => type == matchedType).map(({ elements: [element] }) => element);
    }
    get provisionalElements() {
      return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
        const { type, tracked, elements } = this.detailsByOuterHTML[outerHTML];
        if (type == null && !tracked) {
          return [...result, ...elements];
        } else if (elements.length > 1) {
          return [...result, ...elements.slice(1)];
        } else {
          return result;
        }
      }, []);
    }
    getMetaValue(name) {
      const element = this.findMetaElementByName(name);
      return element ? element.getAttribute("content") : null;
    }
    findMetaElementByName(name) {
      return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
        const {
          elements: [element]
        } = this.detailsByOuterHTML[outerHTML];
        return elementIsMetaElementWithName(element, name) ? element : result;
      }, void 0 | void 0);
    }
  };
  function elementType(element) {
    if (elementIsScript(element)) {
      return "script";
    } else if (elementIsStylesheet(element)) {
      return "stylesheet";
    }
  }
  function elementIsTracked(element) {
    return element.getAttribute("data-turbo-track") == "reload";
  }
  function elementIsScript(element) {
    const tagName = element.localName;
    return tagName == "script";
  }
  function elementIsNoscript(element) {
    const tagName = element.localName;
    return tagName == "noscript";
  }
  function elementIsStylesheet(element) {
    const tagName = element.localName;
    return tagName == "style" || tagName == "link" && element.getAttribute("rel") == "stylesheet";
  }
  function elementIsMetaElementWithName(element, name) {
    const tagName = element.localName;
    return tagName == "meta" && element.getAttribute("name") == name;
  }
  function elementWithoutNonce(element) {
    if (element.hasAttribute("nonce")) {
      element.setAttribute("nonce", "");
    }
    return element;
  }
  var PageSnapshot = class _PageSnapshot extends Snapshot {
    static fromHTMLString(html = "") {
      return this.fromDocument(parseHTMLDocument(html));
    }
    static fromElement(element) {
      return this.fromDocument(element.ownerDocument);
    }
    static fromDocument({ documentElement, body, head }) {
      return new this(documentElement, body, new HeadSnapshot(head));
    }
    constructor(documentElement, body, headSnapshot) {
      super(body);
      this.documentElement = documentElement;
      this.headSnapshot = headSnapshot;
    }
    clone() {
      const clonedElement = this.element.cloneNode(true);
      const selectElements = this.element.querySelectorAll("select");
      const clonedSelectElements = clonedElement.querySelectorAll("select");
      for (const [index, source] of selectElements.entries()) {
        const clone = clonedSelectElements[index];
        for (const option of clone.selectedOptions) option.selected = false;
        for (const option of source.selectedOptions) clone.options[option.index].selected = true;
      }
      for (const clonedPasswordInput of clonedElement.querySelectorAll('input[type="password"]')) {
        clonedPasswordInput.value = "";
      }
      for (const clonedNoscriptElement of clonedElement.querySelectorAll("noscript")) {
        clonedNoscriptElement.remove();
      }
      return new _PageSnapshot(this.documentElement, clonedElement, this.headSnapshot);
    }
    get lang() {
      return this.documentElement.getAttribute("lang");
    }
    get dir() {
      return this.documentElement.getAttribute("dir");
    }
    get headElement() {
      return this.headSnapshot.element;
    }
    get rootLocation() {
      const root = this.getSetting("root") ?? "/";
      return expandURL(root);
    }
    get cacheControlValue() {
      return this.getSetting("cache-control");
    }
    get isPreviewable() {
      return this.cacheControlValue != "no-preview";
    }
    get isCacheable() {
      return this.cacheControlValue != "no-cache";
    }
    get isVisitable() {
      return this.getSetting("visit-control") != "reload";
    }
    get prefersViewTransitions() {
      const viewTransitionEnabled = this.getSetting("view-transition") === "true" || this.headSnapshot.getMetaValue("view-transition") === "same-origin";
      return viewTransitionEnabled && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    get refreshMethod() {
      return this.getSetting("refresh-method");
    }
    get refreshScroll() {
      return this.getSetting("refresh-scroll");
    }
    // Private
    getSetting(name) {
      return this.headSnapshot.getMetaValue(`turbo-${name}`);
    }
  };
  var ViewTransitioner = class {
    #viewTransitionStarted = false;
    #lastOperation = Promise.resolve();
    renderChange(useViewTransition, render) {
      if (useViewTransition && this.viewTransitionsAvailable && !this.#viewTransitionStarted) {
        this.#viewTransitionStarted = true;
        this.#lastOperation = this.#lastOperation.then(async () => {
          await document.startViewTransition(render).finished;
        });
      } else {
        this.#lastOperation = this.#lastOperation.then(render);
      }
      return this.#lastOperation;
    }
    get viewTransitionsAvailable() {
      return document.startViewTransition;
    }
  };
  var defaultOptions = {
    action: "advance",
    historyChanged: false,
    visitCachedSnapshot: () => {
    },
    willRender: true,
    updateHistory: true,
    shouldCacheSnapshot: true,
    acceptsStreamResponse: false,
    refresh: {}
  };
  var TimingMetric = {
    visitStart: "visitStart",
    requestStart: "requestStart",
    requestEnd: "requestEnd",
    visitEnd: "visitEnd"
  };
  var VisitState = {
    initialized: "initialized",
    started: "started",
    canceled: "canceled",
    failed: "failed",
    completed: "completed"
  };
  var SystemStatusCode = {
    networkFailure: 0,
    timeoutFailure: -1,
    contentTypeMismatch: -2
  };
  var Direction = {
    advance: "forward",
    restore: "back",
    replace: "none"
  };
  var Visit = class {
    identifier = uuid();
    // Required by turbo-ios
    timingMetrics = {};
    followedRedirect = false;
    historyChanged = false;
    scrolled = false;
    shouldCacheSnapshot = true;
    acceptsStreamResponse = false;
    snapshotCached = false;
    state = VisitState.initialized;
    viewTransitioner = new ViewTransitioner();
    constructor(delegate, location2, restorationIdentifier, options = {}) {
      this.delegate = delegate;
      this.location = location2;
      this.restorationIdentifier = restorationIdentifier || uuid();
      const {
        action,
        historyChanged,
        referrer,
        snapshot,
        snapshotHTML,
        response,
        visitCachedSnapshot,
        willRender,
        updateHistory,
        shouldCacheSnapshot,
        acceptsStreamResponse,
        direction,
        refresh
      } = {
        ...defaultOptions,
        ...options
      };
      this.action = action;
      this.historyChanged = historyChanged;
      this.referrer = referrer;
      this.snapshot = snapshot;
      this.snapshotHTML = snapshotHTML;
      this.response = response;
      this.isPageRefresh = this.view.isPageRefresh(this);
      this.visitCachedSnapshot = visitCachedSnapshot;
      this.willRender = willRender;
      this.updateHistory = updateHistory;
      this.scrolled = !willRender;
      this.shouldCacheSnapshot = shouldCacheSnapshot;
      this.acceptsStreamResponse = acceptsStreamResponse;
      this.direction = direction || Direction[action];
      this.refresh = refresh;
    }
    get adapter() {
      return this.delegate.adapter;
    }
    get view() {
      return this.delegate.view;
    }
    get history() {
      return this.delegate.history;
    }
    get restorationData() {
      return this.history.getRestorationDataForIdentifier(this.restorationIdentifier);
    }
    start() {
      if (this.state == VisitState.initialized) {
        this.recordTimingMetric(TimingMetric.visitStart);
        this.state = VisitState.started;
        this.adapter.visitStarted(this);
        this.delegate.visitStarted(this);
      }
    }
    cancel() {
      if (this.state == VisitState.started) {
        if (this.request) {
          this.request.cancel();
        }
        this.cancelRender();
        this.state = VisitState.canceled;
      }
    }
    complete() {
      if (this.state == VisitState.started) {
        this.recordTimingMetric(TimingMetric.visitEnd);
        this.adapter.visitCompleted(this);
        this.state = VisitState.completed;
        this.followRedirect();
        if (!this.followedRedirect) {
          this.delegate.visitCompleted(this);
        }
      }
    }
    fail() {
      if (this.state == VisitState.started) {
        this.state = VisitState.failed;
        this.adapter.visitFailed(this);
        this.delegate.visitCompleted(this);
      }
    }
    changeHistory() {
      if (!this.historyChanged && this.updateHistory) {
        const actionForHistory = this.location.href === this.referrer?.href ? "replace" : this.action;
        const method = getHistoryMethodForAction(actionForHistory);
        this.history.update(method, this.location, this.restorationIdentifier);
        this.historyChanged = true;
      }
    }
    issueRequest() {
      if (this.hasPreloadedResponse()) {
        this.simulateRequest();
      } else if (this.shouldIssueRequest() && !this.request) {
        this.request = new FetchRequest(this, FetchMethod.get, this.location);
        this.request.perform();
      }
    }
    simulateRequest() {
      if (this.response) {
        this.startRequest();
        this.recordResponse();
        this.finishRequest();
      }
    }
    startRequest() {
      this.recordTimingMetric(TimingMetric.requestStart);
      this.adapter.visitRequestStarted(this);
    }
    recordResponse(response = this.response) {
      this.response = response;
      if (response) {
        const { statusCode } = response;
        if (isSuccessful(statusCode)) {
          this.adapter.visitRequestCompleted(this);
        } else {
          this.adapter.visitRequestFailedWithStatusCode(this, statusCode);
        }
      }
    }
    finishRequest() {
      this.recordTimingMetric(TimingMetric.requestEnd);
      this.adapter.visitRequestFinished(this);
    }
    loadResponse() {
      if (this.response) {
        const { statusCode, responseHTML } = this.response;
        this.render(async () => {
          if (this.shouldCacheSnapshot) this.cacheSnapshot();
          if (this.view.renderPromise) await this.view.renderPromise;
          if (isSuccessful(statusCode) && responseHTML != null) {
            const snapshot = PageSnapshot.fromHTMLString(responseHTML);
            await this.renderPageSnapshot(snapshot, false);
            this.adapter.visitRendered(this);
            this.complete();
          } else {
            await this.view.renderError(PageSnapshot.fromHTMLString(responseHTML), this);
            this.adapter.visitRendered(this);
            this.fail();
          }
        });
      }
    }
    getCachedSnapshot() {
      const snapshot = this.view.getCachedSnapshotForLocation(this.location) || this.getPreloadedSnapshot();
      if (snapshot && (!getAnchor(this.location) || snapshot.hasAnchor(getAnchor(this.location)))) {
        if (this.action == "restore" || snapshot.isPreviewable) {
          return snapshot;
        }
      }
    }
    getPreloadedSnapshot() {
      if (this.snapshotHTML) {
        return PageSnapshot.fromHTMLString(this.snapshotHTML);
      }
    }
    hasCachedSnapshot() {
      return this.getCachedSnapshot() != null;
    }
    loadCachedSnapshot() {
      const snapshot = this.getCachedSnapshot();
      if (snapshot) {
        const isPreview = this.shouldIssueRequest();
        this.render(async () => {
          this.cacheSnapshot();
          if (this.isPageRefresh) {
            this.adapter.visitRendered(this);
          } else {
            if (this.view.renderPromise) await this.view.renderPromise;
            await this.renderPageSnapshot(snapshot, isPreview);
            this.adapter.visitRendered(this);
            if (!isPreview) {
              this.complete();
            }
          }
        });
      }
    }
    followRedirect() {
      if (this.redirectedToLocation && !this.followedRedirect && this.response?.redirected) {
        this.adapter.visitProposedToLocation(this.redirectedToLocation, {
          action: "replace",
          response: this.response,
          shouldCacheSnapshot: false,
          willRender: false
        });
        this.followedRedirect = true;
      }
    }
    // Fetch request delegate
    prepareRequest(request) {
      if (this.acceptsStreamResponse) {
        request.acceptResponseType(StreamMessage.contentType);
      }
    }
    requestStarted() {
      this.startRequest();
    }
    requestPreventedHandlingResponse(_request, _response) {
    }
    async requestSucceededWithResponse(request, response) {
      const responseHTML = await response.responseHTML;
      const { redirected, statusCode } = response;
      if (responseHTML == void 0) {
        this.recordResponse({
          statusCode: SystemStatusCode.contentTypeMismatch,
          redirected
        });
      } else {
        this.redirectedToLocation = response.redirected ? response.location : void 0;
        this.recordResponse({ statusCode, responseHTML, redirected });
      }
    }
    async requestFailedWithResponse(request, response) {
      const responseHTML = await response.responseHTML;
      const { redirected, statusCode } = response;
      if (responseHTML == void 0) {
        this.recordResponse({
          statusCode: SystemStatusCode.contentTypeMismatch,
          redirected
        });
      } else {
        this.recordResponse({ statusCode, responseHTML, redirected });
      }
    }
    requestErrored(_request, _error) {
      this.recordResponse({
        statusCode: SystemStatusCode.networkFailure,
        redirected: false
      });
    }
    requestFinished() {
      this.finishRequest();
    }
    // Scrolling
    performScroll() {
      if (!this.scrolled && !this.view.forceReloaded && !this.view.shouldPreserveScrollPosition(this)) {
        if (this.action == "restore") {
          this.scrollToRestoredPosition() || this.scrollToAnchor() || this.view.scrollToTop();
        } else {
          this.scrollToAnchor() || this.view.scrollToTop();
        }
        this.scrolled = true;
      }
    }
    scrollToRestoredPosition() {
      const { scrollPosition } = this.restorationData;
      if (scrollPosition) {
        this.view.scrollToPosition(scrollPosition);
        return true;
      }
    }
    scrollToAnchor() {
      const anchor = getAnchor(this.location);
      if (anchor != null) {
        this.view.scrollToAnchor(anchor);
        return true;
      }
    }
    // Instrumentation
    recordTimingMetric(metric) {
      this.timingMetrics[metric] = (/* @__PURE__ */ new Date()).getTime();
    }
    getTimingMetrics() {
      return { ...this.timingMetrics };
    }
    // Private
    hasPreloadedResponse() {
      return typeof this.response == "object";
    }
    shouldIssueRequest() {
      if (this.action == "restore") {
        return !this.hasCachedSnapshot();
      } else {
        return this.willRender;
      }
    }
    cacheSnapshot() {
      if (!this.snapshotCached) {
        this.view.cacheSnapshot(this.snapshot).then((snapshot) => snapshot && this.visitCachedSnapshot(snapshot));
        this.snapshotCached = true;
      }
    }
    async render(callback) {
      this.cancelRender();
      await new Promise((resolve) => {
        this.frame = document.visibilityState === "hidden" ? setTimeout(() => resolve(), 0) : requestAnimationFrame(() => resolve());
      });
      await callback();
      delete this.frame;
    }
    async renderPageSnapshot(snapshot, isPreview) {
      await this.viewTransitioner.renderChange(this.view.shouldTransitionTo(snapshot), async () => {
        await this.view.renderPage(snapshot, isPreview, this.willRender, this);
        this.performScroll();
      });
    }
    cancelRender() {
      if (this.frame) {
        cancelAnimationFrame(this.frame);
        delete this.frame;
      }
    }
  };
  function isSuccessful(statusCode) {
    return statusCode >= 200 && statusCode < 300;
  }
  var BrowserAdapter = class {
    progressBar = new ProgressBar();
    constructor(session2) {
      this.session = session2;
    }
    visitProposedToLocation(location2, options) {
      if (locationIsVisitable(location2, this.navigator.rootLocation)) {
        this.navigator.startVisit(location2, options?.restorationIdentifier || uuid(), options);
      } else {
        window.location.href = location2.toString();
      }
    }
    visitStarted(visit2) {
      this.location = visit2.location;
      this.redirectedToLocation = null;
      visit2.loadCachedSnapshot();
      visit2.issueRequest();
    }
    visitRequestStarted(visit2) {
      this.progressBar.setValue(0);
      if (visit2.hasCachedSnapshot() || visit2.action != "restore") {
        this.showVisitProgressBarAfterDelay();
      } else {
        this.showProgressBar();
      }
    }
    visitRequestCompleted(visit2) {
      visit2.loadResponse();
      if (visit2.response.redirected) {
        this.redirectedToLocation = visit2.redirectedToLocation;
      }
    }
    visitRequestFailedWithStatusCode(visit2, statusCode) {
      switch (statusCode) {
        case SystemStatusCode.networkFailure:
        case SystemStatusCode.timeoutFailure:
        case SystemStatusCode.contentTypeMismatch:
          return this.reload({
            reason: "request_failed",
            context: {
              statusCode
            }
          });
        default:
          return visit2.loadResponse();
      }
    }
    visitRequestFinished(_visit) {
    }
    visitCompleted(_visit) {
      this.progressBar.setValue(1);
      this.hideVisitProgressBar();
    }
    pageInvalidated(reason) {
      this.reload(reason);
    }
    visitFailed(_visit) {
      this.progressBar.setValue(1);
      this.hideVisitProgressBar();
    }
    visitRendered(_visit) {
    }
    // Link prefetching
    linkPrefetchingIsEnabledForLocation(location2) {
      return true;
    }
    // Form Submission Delegate
    formSubmissionStarted(_formSubmission) {
      this.progressBar.setValue(0);
      this.showFormProgressBarAfterDelay();
    }
    formSubmissionFinished(_formSubmission) {
      this.progressBar.setValue(1);
      this.hideFormProgressBar();
    }
    // Private
    showVisitProgressBarAfterDelay() {
      this.visitProgressBarTimeout = window.setTimeout(this.showProgressBar, this.session.progressBarDelay);
    }
    hideVisitProgressBar() {
      this.progressBar.hide();
      if (this.visitProgressBarTimeout != null) {
        window.clearTimeout(this.visitProgressBarTimeout);
        delete this.visitProgressBarTimeout;
      }
    }
    showFormProgressBarAfterDelay() {
      if (this.formProgressBarTimeout == null) {
        this.formProgressBarTimeout = window.setTimeout(this.showProgressBar, this.session.progressBarDelay);
      }
    }
    hideFormProgressBar() {
      this.progressBar.hide();
      if (this.formProgressBarTimeout != null) {
        window.clearTimeout(this.formProgressBarTimeout);
        delete this.formProgressBarTimeout;
      }
    }
    showProgressBar = () => {
      this.progressBar.show();
    };
    reload(reason) {
      dispatch("turbo:reload", { detail: reason });
      window.location.href = (this.redirectedToLocation || this.location)?.toString() || window.location.href;
    }
    get navigator() {
      return this.session.navigator;
    }
  };
  var CacheObserver = class {
    selector = "[data-turbo-temporary]";
    started = false;
    start() {
      if (!this.started) {
        this.started = true;
        addEventListener("turbo:before-cache", this.removeTemporaryElements, false);
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
        removeEventListener("turbo:before-cache", this.removeTemporaryElements, false);
      }
    }
    removeTemporaryElements = (_event) => {
      for (const element of this.temporaryElements) {
        element.remove();
      }
    };
    get temporaryElements() {
      return [...document.querySelectorAll(this.selector)];
    }
  };
  var FrameRedirector = class {
    constructor(session2, element) {
      this.session = session2;
      this.element = element;
      this.linkInterceptor = new LinkInterceptor(this, element);
      this.formSubmitObserver = new FormSubmitObserver(this, element);
    }
    start() {
      this.linkInterceptor.start();
      this.formSubmitObserver.start();
    }
    stop() {
      this.linkInterceptor.stop();
      this.formSubmitObserver.stop();
    }
    // Link interceptor delegate
    shouldInterceptLinkClick(element, _location, _event) {
      return this.#shouldRedirect(element);
    }
    linkClickIntercepted(element, url, event) {
      const frame = this.#findFrameElement(element);
      if (frame) {
        frame.delegate.linkClickIntercepted(element, url, event);
      }
    }
    // Form submit observer delegate
    willSubmitForm(element, submitter2) {
      return element.closest("turbo-frame") == null && this.#shouldSubmit(element, submitter2) && this.#shouldRedirect(element, submitter2);
    }
    formSubmitted(element, submitter2) {
      const frame = this.#findFrameElement(element, submitter2);
      if (frame) {
        frame.delegate.formSubmitted(element, submitter2);
      }
    }
    #shouldSubmit(form, submitter2) {
      const action = getAction$1(form, submitter2);
      const meta = this.element.ownerDocument.querySelector(`meta[name="turbo-root"]`);
      const rootLocation = expandURL(meta?.content ?? "/");
      return this.#shouldRedirect(form, submitter2) && locationIsVisitable(action, rootLocation);
    }
    #shouldRedirect(element, submitter2) {
      const isNavigatable = element instanceof HTMLFormElement ? this.session.submissionIsNavigatable(element, submitter2) : this.session.elementIsNavigatable(element);
      if (isNavigatable) {
        const frame = this.#findFrameElement(element, submitter2);
        return frame ? frame != element.closest("turbo-frame") : false;
      } else {
        return false;
      }
    }
    #findFrameElement(element, submitter2) {
      const id = submitter2?.getAttribute("data-turbo-frame") || element.getAttribute("data-turbo-frame");
      if (id && id != "_top") {
        const frame = this.element.querySelector(`#${id}:not([disabled])`);
        if (frame instanceof FrameElement) {
          return frame;
        }
      }
    }
  };
  var History = class {
    location;
    restorationIdentifier = uuid();
    restorationData = {};
    started = false;
    currentIndex = 0;
    constructor(delegate) {
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        addEventListener("popstate", this.onPopState, false);
        this.currentIndex = history.state?.turbo?.restorationIndex || 0;
        this.started = true;
        this.replace(new URL(window.location.href));
      }
    }
    stop() {
      if (this.started) {
        removeEventListener("popstate", this.onPopState, false);
        this.started = false;
      }
    }
    push(location2, restorationIdentifier) {
      this.update(history.pushState, location2, restorationIdentifier);
    }
    replace(location2, restorationIdentifier) {
      this.update(history.replaceState, location2, restorationIdentifier);
    }
    update(method, location2, restorationIdentifier = uuid()) {
      if (method === history.pushState) ++this.currentIndex;
      const state = { turbo: { restorationIdentifier, restorationIndex: this.currentIndex } };
      method.call(history, state, "", location2.href);
      this.location = location2;
      this.restorationIdentifier = restorationIdentifier;
    }
    // Restoration data
    getRestorationDataForIdentifier(restorationIdentifier) {
      return this.restorationData[restorationIdentifier] || {};
    }
    updateRestorationData(additionalData) {
      const { restorationIdentifier } = this;
      const restorationData = this.restorationData[restorationIdentifier];
      this.restorationData[restorationIdentifier] = {
        ...restorationData,
        ...additionalData
      };
    }
    // Scroll restoration
    assumeControlOfScrollRestoration() {
      if (!this.previousScrollRestoration) {
        this.previousScrollRestoration = history.scrollRestoration ?? "auto";
        history.scrollRestoration = "manual";
      }
    }
    relinquishControlOfScrollRestoration() {
      if (this.previousScrollRestoration) {
        history.scrollRestoration = this.previousScrollRestoration;
        delete this.previousScrollRestoration;
      }
    }
    // Event handlers
    onPopState = (event) => {
      const { turbo } = event.state || {};
      this.location = new URL(window.location.href);
      if (turbo) {
        const { restorationIdentifier, restorationIndex } = turbo;
        this.restorationIdentifier = restorationIdentifier;
        const direction = restorationIndex > this.currentIndex ? "forward" : "back";
        this.delegate.historyPoppedToLocationWithRestorationIdentifierAndDirection(this.location, restorationIdentifier, direction);
        this.currentIndex = restorationIndex;
      } else {
        this.currentIndex++;
        this.delegate.historyPoppedWithEmptyState(this.location);
      }
    };
  };
  var LinkPrefetchObserver = class {
    started = false;
    #prefetchedLink = null;
    constructor(delegate, eventTarget) {
      this.delegate = delegate;
      this.eventTarget = eventTarget;
    }
    start() {
      if (this.started) return;
      if (this.eventTarget.readyState === "loading") {
        this.eventTarget.addEventListener("DOMContentLoaded", this.#enable, { once: true });
      } else {
        this.#enable();
      }
    }
    stop() {
      if (!this.started) return;
      this.eventTarget.removeEventListener("mouseenter", this.#tryToPrefetchRequest, {
        capture: true,
        passive: true
      });
      this.eventTarget.removeEventListener("mouseleave", this.#cancelRequestIfObsolete, {
        capture: true,
        passive: true
      });
      this.eventTarget.removeEventListener("turbo:before-fetch-request", this.#tryToUsePrefetchedRequest, true);
      this.started = false;
    }
    #enable = () => {
      this.eventTarget.addEventListener("mouseenter", this.#tryToPrefetchRequest, {
        capture: true,
        passive: true
      });
      this.eventTarget.addEventListener("mouseleave", this.#cancelRequestIfObsolete, {
        capture: true,
        passive: true
      });
      this.eventTarget.addEventListener("turbo:before-fetch-request", this.#tryToUsePrefetchedRequest, true);
      this.started = true;
    };
    #tryToPrefetchRequest = (event) => {
      if (getMetaContent("turbo-prefetch") === "false") return;
      const target = event.target;
      const isLink = target.matches && target.matches("a[href]:not([target^=_]):not([download])");
      if (isLink && this.#isPrefetchable(target)) {
        const link = target;
        const location2 = getLocationForLink(link);
        if (this.delegate.canPrefetchRequestToLocation(link, location2)) {
          this.#prefetchedLink = link;
          const fetchRequest = new FetchRequest(
            this,
            FetchMethod.get,
            location2,
            new URLSearchParams(),
            target
          );
          fetchRequest.fetchOptions.priority = "low";
          prefetchCache.putLater(location2, fetchRequest, this.#cacheTtl);
        }
      }
    };
    #cancelRequestIfObsolete = (event) => {
      if (event.target === this.#prefetchedLink) this.#cancelPrefetchRequest();
    };
    #cancelPrefetchRequest = () => {
      prefetchCache.clear();
      this.#prefetchedLink = null;
    };
    #tryToUsePrefetchedRequest = (event) => {
      if (event.target.tagName !== "FORM" && event.detail.fetchOptions.method === "GET") {
        const cached = prefetchCache.get(event.detail.url);
        if (cached) {
          event.detail.fetchRequest = cached;
        }
        prefetchCache.clear();
      }
    };
    prepareRequest(request) {
      const link = request.target;
      request.headers["X-Sec-Purpose"] = "prefetch";
      const turboFrame = link.closest("turbo-frame");
      const turboFrameTarget = link.getAttribute("data-turbo-frame") || turboFrame?.getAttribute("target") || turboFrame?.id;
      if (turboFrameTarget && turboFrameTarget !== "_top") {
        request.headers["Turbo-Frame"] = turboFrameTarget;
      }
    }
    // Fetch request interface
    requestSucceededWithResponse() {
    }
    requestStarted(fetchRequest) {
    }
    requestErrored(fetchRequest) {
    }
    requestFinished(fetchRequest) {
    }
    requestPreventedHandlingResponse(fetchRequest, fetchResponse) {
    }
    requestFailedWithResponse(fetchRequest, fetchResponse) {
    }
    get #cacheTtl() {
      return Number(getMetaContent("turbo-prefetch-cache-time")) || cacheTtl;
    }
    #isPrefetchable(link) {
      const href = link.getAttribute("href");
      if (!href) return false;
      if (unfetchableLink(link)) return false;
      if (linkToTheSamePage(link)) return false;
      if (linkOptsOut(link)) return false;
      if (nonSafeLink(link)) return false;
      if (eventPrevented(link)) return false;
      return true;
    }
  };
  var unfetchableLink = (link) => {
    return link.origin !== document.location.origin || !["http:", "https:"].includes(link.protocol) || link.hasAttribute("target");
  };
  var linkToTheSamePage = (link) => {
    return link.pathname + link.search === document.location.pathname + document.location.search || link.href.startsWith("#");
  };
  var linkOptsOut = (link) => {
    if (link.getAttribute("data-turbo-prefetch") === "false") return true;
    if (link.getAttribute("data-turbo") === "false") return true;
    const turboPrefetchParent = findClosestRecursively(link, "[data-turbo-prefetch]");
    if (turboPrefetchParent && turboPrefetchParent.getAttribute("data-turbo-prefetch") === "false") return true;
    return false;
  };
  var nonSafeLink = (link) => {
    const turboMethod = link.getAttribute("data-turbo-method");
    if (turboMethod && turboMethod.toLowerCase() !== "get") return true;
    if (isUJS(link)) return true;
    if (link.hasAttribute("data-turbo-confirm")) return true;
    if (link.hasAttribute("data-turbo-stream")) return true;
    return false;
  };
  var isUJS = (link) => {
    return link.hasAttribute("data-remote") || link.hasAttribute("data-behavior") || link.hasAttribute("data-confirm") || link.hasAttribute("data-method");
  };
  var eventPrevented = (link) => {
    const event = dispatch("turbo:before-prefetch", { target: link, cancelable: true });
    return event.defaultPrevented;
  };
  var Navigator = class {
    constructor(delegate) {
      this.delegate = delegate;
    }
    proposeVisit(location2, options = {}) {
      if (this.delegate.allowsVisitingLocationWithAction(location2, options.action)) {
        this.delegate.visitProposedToLocation(location2, options);
      }
    }
    startVisit(locatable, restorationIdentifier, options = {}) {
      this.stop();
      this.currentVisit = new Visit(this, expandURL(locatable), restorationIdentifier, {
        referrer: this.location,
        ...options
      });
      this.currentVisit.start();
    }
    submitForm(form, submitter2) {
      this.stop();
      this.formSubmission = new FormSubmission(this, form, submitter2, true);
      this.formSubmission.start();
    }
    stop() {
      if (this.formSubmission) {
        this.formSubmission.stop();
        delete this.formSubmission;
      }
      if (this.currentVisit) {
        this.currentVisit.cancel();
        delete this.currentVisit;
      }
    }
    get adapter() {
      return this.delegate.adapter;
    }
    get view() {
      return this.delegate.view;
    }
    get rootLocation() {
      return this.view.snapshot.rootLocation;
    }
    get history() {
      return this.delegate.history;
    }
    // Form submission delegate
    formSubmissionStarted(formSubmission) {
      if (typeof this.adapter.formSubmissionStarted === "function") {
        this.adapter.formSubmissionStarted(formSubmission);
      }
    }
    async formSubmissionSucceededWithResponse(formSubmission, fetchResponse) {
      if (formSubmission == this.formSubmission) {
        const responseHTML = await fetchResponse.responseHTML;
        if (responseHTML) {
          const shouldCacheSnapshot = formSubmission.isSafe;
          if (!shouldCacheSnapshot) {
            this.view.clearSnapshotCache();
          }
          const { statusCode, redirected } = fetchResponse;
          const action = this.#getActionForFormSubmission(formSubmission, fetchResponse);
          const visitOptions = {
            action,
            shouldCacheSnapshot,
            response: { statusCode, responseHTML, redirected }
          };
          this.proposeVisit(fetchResponse.location, visitOptions);
        }
      }
    }
    async formSubmissionFailedWithResponse(formSubmission, fetchResponse) {
      const responseHTML = await fetchResponse.responseHTML;
      if (responseHTML) {
        const snapshot = PageSnapshot.fromHTMLString(responseHTML);
        if (fetchResponse.serverError) {
          await this.view.renderError(snapshot, this.currentVisit);
        } else {
          await this.view.renderPage(snapshot, false, true, this.currentVisit);
        }
        if (snapshot.refreshScroll !== "preserve") {
          this.view.scrollToTop();
        }
        this.view.clearSnapshotCache();
      }
    }
    formSubmissionErrored(formSubmission, error2) {
      console.error(error2);
    }
    formSubmissionFinished(formSubmission) {
      if (typeof this.adapter.formSubmissionFinished === "function") {
        this.adapter.formSubmissionFinished(formSubmission);
      }
    }
    // Link prefetching
    linkPrefetchingIsEnabledForLocation(location2) {
      if (typeof this.adapter.linkPrefetchingIsEnabledForLocation === "function") {
        return this.adapter.linkPrefetchingIsEnabledForLocation(location2);
      }
      return true;
    }
    // Visit delegate
    visitStarted(visit2) {
      this.delegate.visitStarted(visit2);
    }
    visitCompleted(visit2) {
      this.delegate.visitCompleted(visit2);
      delete this.currentVisit;
    }
    // Same-page links are no longer handled with a Visit.
    // This method is still needed for Turbo Native adapters.
    locationWithActionIsSamePage(location2, action) {
      return false;
    }
    // Visits
    get location() {
      return this.history.location;
    }
    get restorationIdentifier() {
      return this.history.restorationIdentifier;
    }
    #getActionForFormSubmission(formSubmission, fetchResponse) {
      const { submitter: submitter2, formElement } = formSubmission;
      return getVisitAction(submitter2, formElement) || this.#getDefaultAction(fetchResponse);
    }
    #getDefaultAction(fetchResponse) {
      const sameLocationRedirect = fetchResponse.redirected && fetchResponse.location.href === this.location?.href;
      return sameLocationRedirect ? "replace" : "advance";
    }
  };
  var PageStage = {
    initial: 0,
    loading: 1,
    interactive: 2,
    complete: 3
  };
  var PageObserver = class {
    stage = PageStage.initial;
    started = false;
    constructor(delegate) {
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        if (this.stage == PageStage.initial) {
          this.stage = PageStage.loading;
        }
        document.addEventListener("readystatechange", this.interpretReadyState, false);
        addEventListener("pagehide", this.pageWillUnload, false);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        document.removeEventListener("readystatechange", this.interpretReadyState, false);
        removeEventListener("pagehide", this.pageWillUnload, false);
        this.started = false;
      }
    }
    interpretReadyState = () => {
      const { readyState } = this;
      if (readyState == "interactive") {
        this.pageIsInteractive();
      } else if (readyState == "complete") {
        this.pageIsComplete();
      }
    };
    pageIsInteractive() {
      if (this.stage == PageStage.loading) {
        this.stage = PageStage.interactive;
        this.delegate.pageBecameInteractive();
      }
    }
    pageIsComplete() {
      this.pageIsInteractive();
      if (this.stage == PageStage.interactive) {
        this.stage = PageStage.complete;
        this.delegate.pageLoaded();
      }
    }
    pageWillUnload = () => {
      this.delegate.pageWillUnload();
    };
    get readyState() {
      return document.readyState;
    }
  };
  var ScrollObserver = class {
    started = false;
    constructor(delegate) {
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        addEventListener("scroll", this.onScroll, false);
        this.onScroll();
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        removeEventListener("scroll", this.onScroll, false);
        this.started = false;
      }
    }
    onScroll = () => {
      this.updatePosition({ x: window.pageXOffset, y: window.pageYOffset });
    };
    // Private
    updatePosition(position) {
      this.delegate.scrollPositionChanged(position);
    }
  };
  var StreamMessageRenderer = class {
    render({ fragment }) {
      Bardo.preservingPermanentElements(this, getPermanentElementMapForFragment(fragment), () => {
        withAutofocusFromFragment(fragment, () => {
          withPreservedFocus(() => {
            document.documentElement.appendChild(fragment);
          });
        });
      });
    }
    // Bardo delegate
    enteringBardo(currentPermanentElement, newPermanentElement) {
      newPermanentElement.replaceWith(currentPermanentElement.cloneNode(true));
    }
    leavingBardo() {
    }
  };
  function getPermanentElementMapForFragment(fragment) {
    const permanentElementsInDocument = queryPermanentElementsAll(document.documentElement);
    const permanentElementMap = {};
    for (const permanentElementInDocument of permanentElementsInDocument) {
      const { id } = permanentElementInDocument;
      for (const streamElement of fragment.querySelectorAll("turbo-stream")) {
        const elementInStream = getPermanentElementById(streamElement.templateElement.content, id);
        if (elementInStream) {
          permanentElementMap[id] = [permanentElementInDocument, elementInStream];
        }
      }
    }
    return permanentElementMap;
  }
  async function withAutofocusFromFragment(fragment, callback) {
    const generatedID = `turbo-stream-autofocus-${uuid()}`;
    const turboStreams = fragment.querySelectorAll("turbo-stream");
    const elementWithAutofocus = firstAutofocusableElementInStreams(turboStreams);
    let willAutofocusId = null;
    if (elementWithAutofocus) {
      if (elementWithAutofocus.id) {
        willAutofocusId = elementWithAutofocus.id;
      } else {
        willAutofocusId = generatedID;
      }
      elementWithAutofocus.id = willAutofocusId;
    }
    callback();
    await nextRepaint();
    const hasNoActiveElement = document.activeElement == null || document.activeElement == document.body;
    if (hasNoActiveElement && willAutofocusId) {
      const elementToAutofocus = document.getElementById(willAutofocusId);
      if (elementIsFocusable(elementToAutofocus)) {
        elementToAutofocus.focus();
      }
      if (elementToAutofocus && elementToAutofocus.id == generatedID) {
        elementToAutofocus.removeAttribute("id");
      }
    }
  }
  async function withPreservedFocus(callback) {
    const [activeElementBeforeRender, activeElementAfterRender] = await around(callback, () => document.activeElement);
    const restoreFocusTo = activeElementBeforeRender && activeElementBeforeRender.id;
    if (restoreFocusTo) {
      const elementToFocus = document.getElementById(restoreFocusTo);
      if (elementIsFocusable(elementToFocus) && elementToFocus != activeElementAfterRender) {
        elementToFocus.focus();
      }
    }
  }
  function firstAutofocusableElementInStreams(nodeListOfStreamElements) {
    for (const streamElement of nodeListOfStreamElements) {
      const elementWithAutofocus = queryAutofocusableElement(streamElement.templateElement.content);
      if (elementWithAutofocus) return elementWithAutofocus;
    }
    return null;
  }
  var StreamObserver = class {
    sources = /* @__PURE__ */ new Set();
    #started = false;
    constructor(delegate) {
      this.delegate = delegate;
    }
    start() {
      if (!this.#started) {
        this.#started = true;
        addEventListener("turbo:before-fetch-response", this.inspectFetchResponse, false);
      }
    }
    stop() {
      if (this.#started) {
        this.#started = false;
        removeEventListener("turbo:before-fetch-response", this.inspectFetchResponse, false);
      }
    }
    connectStreamSource(source) {
      if (!this.streamSourceIsConnected(source)) {
        this.sources.add(source);
        source.addEventListener("message", this.receiveMessageEvent, false);
      }
    }
    disconnectStreamSource(source) {
      if (this.streamSourceIsConnected(source)) {
        this.sources.delete(source);
        source.removeEventListener("message", this.receiveMessageEvent, false);
      }
    }
    streamSourceIsConnected(source) {
      return this.sources.has(source);
    }
    inspectFetchResponse = (event) => {
      const response = fetchResponseFromEvent(event);
      if (response && fetchResponseIsStream(response)) {
        event.preventDefault();
        this.receiveMessageResponse(response);
      }
    };
    receiveMessageEvent = (event) => {
      if (this.#started && typeof event.data == "string") {
        this.receiveMessageHTML(event.data);
      }
    };
    async receiveMessageResponse(response) {
      const html = await response.responseHTML;
      if (html) {
        this.receiveMessageHTML(html);
      }
    }
    receiveMessageHTML(html) {
      this.delegate.receivedMessageFromStream(StreamMessage.wrap(html));
    }
  };
  function fetchResponseFromEvent(event) {
    const fetchResponse = event.detail?.fetchResponse;
    if (fetchResponse instanceof FetchResponse) {
      return fetchResponse;
    }
  }
  function fetchResponseIsStream(response) {
    const contentType = response.contentType ?? "";
    return contentType.startsWith(StreamMessage.contentType);
  }
  var ErrorRenderer = class extends Renderer {
    static renderElement(currentElement, newElement) {
      const { documentElement, body } = document;
      documentElement.replaceChild(newElement, body);
    }
    async render() {
      this.replaceHeadAndBody();
      this.activateScriptElements();
    }
    replaceHeadAndBody() {
      const { documentElement, head } = document;
      documentElement.replaceChild(this.newHead, head);
      this.renderElement(this.currentElement, this.newElement);
    }
    activateScriptElements() {
      for (const replaceableElement of this.scriptElements) {
        const parentNode = replaceableElement.parentNode;
        if (parentNode) {
          const element = activateScriptElement(replaceableElement);
          parentNode.replaceChild(element, replaceableElement);
        }
      }
    }
    get newHead() {
      return this.newSnapshot.headSnapshot.element;
    }
    get scriptElements() {
      return document.documentElement.querySelectorAll("script");
    }
  };
  var PageRenderer = class extends Renderer {
    static renderElement(currentElement, newElement) {
      if (document.body && newElement instanceof HTMLBodyElement) {
        document.body.replaceWith(newElement);
      } else {
        document.documentElement.appendChild(newElement);
      }
    }
    get shouldRender() {
      return this.newSnapshot.isVisitable && this.trackedElementsAreIdentical;
    }
    get reloadReason() {
      if (!this.newSnapshot.isVisitable) {
        return {
          reason: "turbo_visit_control_is_reload"
        };
      }
      if (!this.trackedElementsAreIdentical) {
        return {
          reason: "tracked_element_mismatch"
        };
      }
    }
    async prepareToRender() {
      this.#setLanguage();
      await this.mergeHead();
    }
    async render() {
      if (this.willRender) {
        await this.replaceBody();
      }
    }
    finishRendering() {
      super.finishRendering();
      if (!this.isPreview) {
        this.focusFirstAutofocusableElement();
      }
    }
    get currentHeadSnapshot() {
      return this.currentSnapshot.headSnapshot;
    }
    get newHeadSnapshot() {
      return this.newSnapshot.headSnapshot;
    }
    get newElement() {
      return this.newSnapshot.element;
    }
    #setLanguage() {
      const { documentElement } = this.currentSnapshot;
      const { dir, lang } = this.newSnapshot;
      if (lang) {
        documentElement.setAttribute("lang", lang);
      } else {
        documentElement.removeAttribute("lang");
      }
      if (dir) {
        documentElement.setAttribute("dir", dir);
      } else {
        documentElement.removeAttribute("dir");
      }
    }
    async mergeHead() {
      const mergedHeadElements = this.mergeProvisionalElements();
      const newStylesheetElements = this.copyNewHeadStylesheetElements();
      this.copyNewHeadScriptElements();
      await mergedHeadElements;
      await newStylesheetElements;
      if (this.willRender) {
        this.removeUnusedDynamicStylesheetElements();
      }
    }
    async replaceBody() {
      await this.preservingPermanentElements(async () => {
        this.activateNewBody();
        await this.assignNewBody();
      });
    }
    get trackedElementsAreIdentical() {
      return this.currentHeadSnapshot.trackedElementSignature == this.newHeadSnapshot.trackedElementSignature;
    }
    async copyNewHeadStylesheetElements() {
      const loadingElements = [];
      for (const element of this.newHeadStylesheetElements) {
        loadingElements.push(waitForLoad(element));
        document.head.appendChild(element);
      }
      await Promise.all(loadingElements);
    }
    copyNewHeadScriptElements() {
      for (const element of this.newHeadScriptElements) {
        document.head.appendChild(activateScriptElement(element));
      }
    }
    removeUnusedDynamicStylesheetElements() {
      for (const element of this.unusedDynamicStylesheetElements) {
        document.head.removeChild(element);
      }
    }
    async mergeProvisionalElements() {
      const newHeadElements = [...this.newHeadProvisionalElements];
      for (const element of this.currentHeadProvisionalElements) {
        if (!this.isCurrentElementInElementList(element, newHeadElements)) {
          document.head.removeChild(element);
        }
      }
      for (const element of newHeadElements) {
        document.head.appendChild(element);
      }
    }
    isCurrentElementInElementList(element, elementList) {
      for (const [index, newElement] of elementList.entries()) {
        if (element.tagName == "TITLE") {
          if (newElement.tagName != "TITLE") {
            continue;
          }
          if (element.innerHTML == newElement.innerHTML) {
            elementList.splice(index, 1);
            return true;
          }
        }
        if (newElement.isEqualNode(element)) {
          elementList.splice(index, 1);
          return true;
        }
      }
      return false;
    }
    removeCurrentHeadProvisionalElements() {
      for (const element of this.currentHeadProvisionalElements) {
        document.head.removeChild(element);
      }
    }
    copyNewHeadProvisionalElements() {
      for (const element of this.newHeadProvisionalElements) {
        document.head.appendChild(element);
      }
    }
    activateNewBody() {
      document.adoptNode(this.newElement);
      this.removeNoscriptElements();
      this.activateNewBodyScriptElements();
    }
    removeNoscriptElements() {
      for (const noscriptElement of this.newElement.querySelectorAll("noscript")) {
        noscriptElement.remove();
      }
    }
    activateNewBodyScriptElements() {
      for (const inertScriptElement of this.newBodyScriptElements) {
        const activatedScriptElement = activateScriptElement(inertScriptElement);
        inertScriptElement.replaceWith(activatedScriptElement);
      }
    }
    async assignNewBody() {
      await this.renderElement(this.currentElement, this.newElement);
    }
    get unusedDynamicStylesheetElements() {
      return this.oldHeadStylesheetElements.filter((element) => {
        return element.getAttribute("data-turbo-track") === "dynamic";
      });
    }
    get oldHeadStylesheetElements() {
      return this.currentHeadSnapshot.getStylesheetElementsNotInSnapshot(this.newHeadSnapshot);
    }
    get newHeadStylesheetElements() {
      return this.newHeadSnapshot.getStylesheetElementsNotInSnapshot(this.currentHeadSnapshot);
    }
    get newHeadScriptElements() {
      return this.newHeadSnapshot.getScriptElementsNotInSnapshot(this.currentHeadSnapshot);
    }
    get currentHeadProvisionalElements() {
      return this.currentHeadSnapshot.provisionalElements;
    }
    get newHeadProvisionalElements() {
      return this.newHeadSnapshot.provisionalElements;
    }
    get newBodyScriptElements() {
      return this.newElement.querySelectorAll("script");
    }
  };
  var MorphingPageRenderer = class extends PageRenderer {
    static renderElement(currentElement, newElement) {
      morphElements(currentElement, newElement, {
        callbacks: {
          beforeNodeMorphed: (node, newNode) => {
            if (shouldRefreshFrameWithMorphing(node, newNode) && !closestFrameReloadableWithMorphing(node)) {
              node.reload();
              return false;
            }
            return true;
          }
        }
      });
      dispatch("turbo:morph", { detail: { currentElement, newElement } });
    }
    async preservingPermanentElements(callback) {
      return await callback();
    }
    get renderMethod() {
      return "morph";
    }
    get shouldAutofocus() {
      return false;
    }
  };
  var SnapshotCache = class extends LRUCache {
    constructor(size) {
      super(size, toCacheKey);
    }
    get snapshots() {
      return this.entries;
    }
  };
  var PageView = class extends View {
    snapshotCache = new SnapshotCache(10);
    lastRenderedLocation = new URL(location.href);
    forceReloaded = false;
    shouldTransitionTo(newSnapshot) {
      return this.snapshot.prefersViewTransitions && newSnapshot.prefersViewTransitions;
    }
    renderPage(snapshot, isPreview = false, willRender = true, visit2) {
      const shouldMorphPage = this.isPageRefresh(visit2) && (visit2?.refresh?.method || this.snapshot.refreshMethod) === "morph";
      const rendererClass = shouldMorphPage ? MorphingPageRenderer : PageRenderer;
      const renderer = new rendererClass(this.snapshot, snapshot, isPreview, willRender);
      if (!renderer.shouldRender) {
        this.forceReloaded = true;
      } else {
        visit2?.changeHistory();
      }
      return this.render(renderer);
    }
    renderError(snapshot, visit2) {
      visit2?.changeHistory();
      const renderer = new ErrorRenderer(this.snapshot, snapshot, false);
      return this.render(renderer);
    }
    clearSnapshotCache() {
      this.snapshotCache.clear();
    }
    async cacheSnapshot(snapshot = this.snapshot) {
      if (snapshot.isCacheable) {
        this.delegate.viewWillCacheSnapshot();
        const { lastRenderedLocation: location2 } = this;
        await nextEventLoopTick();
        const cachedSnapshot = snapshot.clone();
        this.snapshotCache.put(location2, cachedSnapshot);
        return cachedSnapshot;
      }
    }
    getCachedSnapshotForLocation(location2) {
      return this.snapshotCache.get(location2);
    }
    isPageRefresh(visit2) {
      return !visit2 || this.lastRenderedLocation.pathname === visit2.location.pathname && visit2.action === "replace";
    }
    shouldPreserveScrollPosition(visit2) {
      return this.isPageRefresh(visit2) && (visit2?.refresh?.scroll || this.snapshot.refreshScroll) === "preserve";
    }
    get snapshot() {
      return PageSnapshot.fromElement(this.element);
    }
  };
  var Preloader = class {
    selector = "a[data-turbo-preload]";
    constructor(delegate, snapshotCache) {
      this.delegate = delegate;
      this.snapshotCache = snapshotCache;
    }
    start() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", this.#preloadAll);
      } else {
        this.preloadOnLoadLinksForView(document.body);
      }
    }
    stop() {
      document.removeEventListener("DOMContentLoaded", this.#preloadAll);
    }
    preloadOnLoadLinksForView(element) {
      for (const link of element.querySelectorAll(this.selector)) {
        if (this.delegate.shouldPreloadLink(link)) {
          this.preloadURL(link);
        }
      }
    }
    async preloadURL(link) {
      const location2 = new URL(link.href);
      if (this.snapshotCache.has(location2)) {
        return;
      }
      const fetchRequest = new FetchRequest(this, FetchMethod.get, location2, new URLSearchParams(), link);
      await fetchRequest.perform();
    }
    // Fetch request delegate
    prepareRequest(fetchRequest) {
      fetchRequest.headers["X-Sec-Purpose"] = "prefetch";
    }
    async requestSucceededWithResponse(fetchRequest, fetchResponse) {
      try {
        const responseHTML = await fetchResponse.responseHTML;
        const snapshot = PageSnapshot.fromHTMLString(responseHTML);
        this.snapshotCache.put(fetchRequest.url, snapshot);
      } catch (_) {
      }
    }
    requestStarted(fetchRequest) {
    }
    requestErrored(fetchRequest) {
    }
    requestFinished(fetchRequest) {
    }
    requestPreventedHandlingResponse(fetchRequest, fetchResponse) {
    }
    requestFailedWithResponse(fetchRequest, fetchResponse) {
    }
    #preloadAll = () => {
      this.preloadOnLoadLinksForView(document.body);
    };
  };
  var Cache = class {
    constructor(session2) {
      this.session = session2;
    }
    clear() {
      this.session.clearCache();
    }
    resetCacheControl() {
      this.#setCacheControl("");
    }
    exemptPageFromCache() {
      this.#setCacheControl("no-cache");
    }
    exemptPageFromPreview() {
      this.#setCacheControl("no-preview");
    }
    #setCacheControl(value) {
      setMetaContent("turbo-cache-control", value);
    }
  };
  var Session = class {
    navigator = new Navigator(this);
    history = new History(this);
    view = new PageView(this, document.documentElement);
    adapter = new BrowserAdapter(this);
    pageObserver = new PageObserver(this);
    cacheObserver = new CacheObserver();
    linkPrefetchObserver = new LinkPrefetchObserver(this, document);
    linkClickObserver = new LinkClickObserver(this, window);
    formSubmitObserver = new FormSubmitObserver(this, document);
    scrollObserver = new ScrollObserver(this);
    streamObserver = new StreamObserver(this);
    formLinkClickObserver = new FormLinkClickObserver(this, document.documentElement);
    frameRedirector = new FrameRedirector(this, document.documentElement);
    streamMessageRenderer = new StreamMessageRenderer();
    cache = new Cache(this);
    enabled = true;
    started = false;
    #pageRefreshDebouncePeriod = 150;
    constructor(recentRequests2) {
      this.recentRequests = recentRequests2;
      this.preloader = new Preloader(this, this.view.snapshotCache);
      this.debouncedRefresh = this.refresh;
      this.pageRefreshDebouncePeriod = this.pageRefreshDebouncePeriod;
    }
    start() {
      if (!this.started) {
        this.pageObserver.start();
        this.cacheObserver.start();
        this.linkPrefetchObserver.start();
        this.formLinkClickObserver.start();
        this.linkClickObserver.start();
        this.formSubmitObserver.start();
        this.scrollObserver.start();
        this.streamObserver.start();
        this.frameRedirector.start();
        this.history.start();
        this.preloader.start();
        this.started = true;
        this.enabled = true;
      }
    }
    disable() {
      this.enabled = false;
    }
    stop() {
      if (this.started) {
        this.pageObserver.stop();
        this.cacheObserver.stop();
        this.linkPrefetchObserver.stop();
        this.formLinkClickObserver.stop();
        this.linkClickObserver.stop();
        this.formSubmitObserver.stop();
        this.scrollObserver.stop();
        this.streamObserver.stop();
        this.frameRedirector.stop();
        this.history.stop();
        this.preloader.stop();
        this.started = false;
      }
    }
    registerAdapter(adapter) {
      this.adapter = adapter;
    }
    visit(location2, options = {}) {
      const frameElement = options.frame ? document.getElementById(options.frame) : null;
      if (frameElement instanceof FrameElement) {
        const action = options.action || getVisitAction(frameElement);
        frameElement.delegate.proposeVisitIfNavigatedWithAction(frameElement, action);
        frameElement.src = location2.toString();
      } else {
        this.navigator.proposeVisit(expandURL(location2), options);
      }
    }
    refresh(url, options = {}) {
      options = typeof options === "string" ? { requestId: options } : options;
      const { method, requestId, scroll } = options;
      const isRecentRequest = requestId && this.recentRequests.has(requestId);
      const isCurrentUrl = url === document.baseURI;
      if (!isRecentRequest && !this.navigator.currentVisit && isCurrentUrl) {
        this.visit(url, { action: "replace", shouldCacheSnapshot: false, refresh: { method, scroll } });
      }
    }
    connectStreamSource(source) {
      this.streamObserver.connectStreamSource(source);
    }
    disconnectStreamSource(source) {
      this.streamObserver.disconnectStreamSource(source);
    }
    renderStreamMessage(message) {
      this.streamMessageRenderer.render(StreamMessage.wrap(message));
    }
    clearCache() {
      this.view.clearSnapshotCache();
    }
    setProgressBarDelay(delay) {
      console.warn(
        "Please replace `session.setProgressBarDelay(delay)` with `session.progressBarDelay = delay`. The function is deprecated and will be removed in a future version of Turbo.`"
      );
      this.progressBarDelay = delay;
    }
    set progressBarDelay(delay) {
      config.drive.progressBarDelay = delay;
    }
    get progressBarDelay() {
      return config.drive.progressBarDelay;
    }
    set drive(value) {
      config.drive.enabled = value;
    }
    get drive() {
      return config.drive.enabled;
    }
    set formMode(value) {
      config.forms.mode = value;
    }
    get formMode() {
      return config.forms.mode;
    }
    get location() {
      return this.history.location;
    }
    get restorationIdentifier() {
      return this.history.restorationIdentifier;
    }
    get pageRefreshDebouncePeriod() {
      return this.#pageRefreshDebouncePeriod;
    }
    set pageRefreshDebouncePeriod(value) {
      this.refresh = debounce(this.debouncedRefresh.bind(this), value);
      this.#pageRefreshDebouncePeriod = value;
    }
    // Preloader delegate
    shouldPreloadLink(element) {
      const isUnsafe = element.hasAttribute("data-turbo-method");
      const isStream = element.hasAttribute("data-turbo-stream");
      const frameTarget = element.getAttribute("data-turbo-frame");
      const frame = frameTarget == "_top" ? null : document.getElementById(frameTarget) || findClosestRecursively(element, "turbo-frame:not([disabled])");
      if (isUnsafe || isStream || frame instanceof FrameElement) {
        return false;
      } else {
        const location2 = new URL(element.href);
        return this.elementIsNavigatable(element) && locationIsVisitable(location2, this.snapshot.rootLocation);
      }
    }
    // History delegate
    historyPoppedToLocationWithRestorationIdentifierAndDirection(location2, restorationIdentifier, direction) {
      if (this.enabled) {
        this.navigator.startVisit(location2, restorationIdentifier, {
          action: "restore",
          historyChanged: true,
          direction
        });
      } else {
        this.adapter.pageInvalidated({
          reason: "turbo_disabled"
        });
      }
    }
    historyPoppedWithEmptyState(location2) {
      this.history.replace(location2);
      this.view.lastRenderedLocation = location2;
      this.view.cacheSnapshot();
    }
    // Scroll observer delegate
    scrollPositionChanged(position) {
      this.history.updateRestorationData({ scrollPosition: position });
    }
    // Form click observer delegate
    willSubmitFormLinkToLocation(link, location2) {
      return this.elementIsNavigatable(link) && locationIsVisitable(location2, this.snapshot.rootLocation);
    }
    submittedFormLinkToLocation() {
    }
    // Link hover observer delegate
    canPrefetchRequestToLocation(link, location2) {
      return this.elementIsNavigatable(link) && locationIsVisitable(location2, this.snapshot.rootLocation) && this.navigator.linkPrefetchingIsEnabledForLocation(location2);
    }
    // Link click observer delegate
    willFollowLinkToLocation(link, location2, event) {
      return this.elementIsNavigatable(link) && locationIsVisitable(location2, this.snapshot.rootLocation) && this.applicationAllowsFollowingLinkToLocation(link, location2, event);
    }
    followedLinkToLocation(link, location2) {
      const action = this.getActionForLink(link);
      const acceptsStreamResponse = link.hasAttribute("data-turbo-stream");
      this.visit(location2.href, { action, acceptsStreamResponse });
    }
    // Navigator delegate
    allowsVisitingLocationWithAction(location2, action) {
      return this.applicationAllowsVisitingLocation(location2);
    }
    visitProposedToLocation(location2, options) {
      extendURLWithDeprecatedProperties(location2);
      this.adapter.visitProposedToLocation(location2, options);
    }
    // Visit delegate
    visitStarted(visit2) {
      if (!visit2.acceptsStreamResponse) {
        markAsBusy(document.documentElement);
        this.view.markVisitDirection(visit2.direction);
      }
      extendURLWithDeprecatedProperties(visit2.location);
      this.notifyApplicationAfterVisitingLocation(visit2.location, visit2.action);
    }
    visitCompleted(visit2) {
      this.view.unmarkVisitDirection();
      clearBusyState(document.documentElement);
      this.notifyApplicationAfterPageLoad(visit2.getTimingMetrics());
    }
    // Form submit observer delegate
    willSubmitForm(form, submitter2) {
      const action = getAction$1(form, submitter2);
      return this.submissionIsNavigatable(form, submitter2) && locationIsVisitable(expandURL(action), this.snapshot.rootLocation);
    }
    formSubmitted(form, submitter2) {
      this.navigator.submitForm(form, submitter2);
    }
    // Page observer delegate
    pageBecameInteractive() {
      this.view.lastRenderedLocation = this.location;
      this.notifyApplicationAfterPageLoad();
    }
    pageLoaded() {
      this.history.assumeControlOfScrollRestoration();
    }
    pageWillUnload() {
      this.history.relinquishControlOfScrollRestoration();
    }
    // Stream observer delegate
    receivedMessageFromStream(message) {
      this.renderStreamMessage(message);
    }
    // Page view delegate
    viewWillCacheSnapshot() {
      this.notifyApplicationBeforeCachingSnapshot();
    }
    allowsImmediateRender({ element }, options) {
      const event = this.notifyApplicationBeforeRender(element, options);
      const {
        defaultPrevented,
        detail: { render }
      } = event;
      if (this.view.renderer && render) {
        this.view.renderer.renderElement = render;
      }
      return !defaultPrevented;
    }
    viewRenderedSnapshot(_snapshot, _isPreview, renderMethod) {
      this.view.lastRenderedLocation = this.history.location;
      this.notifyApplicationAfterRender(renderMethod);
    }
    preloadOnLoadLinksForView(element) {
      this.preloader.preloadOnLoadLinksForView(element);
    }
    viewInvalidated(reason) {
      this.adapter.pageInvalidated(reason);
    }
    // Frame element
    frameLoaded(frame) {
      this.notifyApplicationAfterFrameLoad(frame);
    }
    frameRendered(fetchResponse, frame) {
      this.notifyApplicationAfterFrameRender(fetchResponse, frame);
    }
    // Application events
    applicationAllowsFollowingLinkToLocation(link, location2, ev) {
      const event = this.notifyApplicationAfterClickingLinkToLocation(link, location2, ev);
      return !event.defaultPrevented;
    }
    applicationAllowsVisitingLocation(location2) {
      const event = this.notifyApplicationBeforeVisitingLocation(location2);
      return !event.defaultPrevented;
    }
    notifyApplicationAfterClickingLinkToLocation(link, location2, event) {
      return dispatch("turbo:click", {
        target: link,
        detail: { url: location2.href, originalEvent: event },
        cancelable: true
      });
    }
    notifyApplicationBeforeVisitingLocation(location2) {
      return dispatch("turbo:before-visit", {
        detail: { url: location2.href },
        cancelable: true
      });
    }
    notifyApplicationAfterVisitingLocation(location2, action) {
      return dispatch("turbo:visit", { detail: { url: location2.href, action } });
    }
    notifyApplicationBeforeCachingSnapshot() {
      return dispatch("turbo:before-cache");
    }
    notifyApplicationBeforeRender(newBody, options) {
      return dispatch("turbo:before-render", {
        detail: { newBody, ...options },
        cancelable: true
      });
    }
    notifyApplicationAfterRender(renderMethod) {
      return dispatch("turbo:render", { detail: { renderMethod } });
    }
    notifyApplicationAfterPageLoad(timing = {}) {
      return dispatch("turbo:load", {
        detail: { url: this.location.href, timing }
      });
    }
    notifyApplicationAfterFrameLoad(frame) {
      return dispatch("turbo:frame-load", { target: frame });
    }
    notifyApplicationAfterFrameRender(fetchResponse, frame) {
      return dispatch("turbo:frame-render", {
        detail: { fetchResponse },
        target: frame,
        cancelable: true
      });
    }
    // Helpers
    submissionIsNavigatable(form, submitter2) {
      if (config.forms.mode == "off") {
        return false;
      } else {
        const submitterIsNavigatable = submitter2 ? this.elementIsNavigatable(submitter2) : true;
        if (config.forms.mode == "optin") {
          return submitterIsNavigatable && form.closest('[data-turbo="true"]') != null;
        } else {
          return submitterIsNavigatable && this.elementIsNavigatable(form);
        }
      }
    }
    elementIsNavigatable(element) {
      const container = findClosestRecursively(element, "[data-turbo]");
      const withinFrame = findClosestRecursively(element, "turbo-frame");
      if (config.drive.enabled || withinFrame) {
        if (container) {
          return container.getAttribute("data-turbo") != "false";
        } else {
          return true;
        }
      } else {
        if (container) {
          return container.getAttribute("data-turbo") == "true";
        } else {
          return false;
        }
      }
    }
    // Private
    getActionForLink(link) {
      return getVisitAction(link) || "advance";
    }
    get snapshot() {
      return this.view.snapshot;
    }
  };
  function extendURLWithDeprecatedProperties(url) {
    Object.defineProperties(url, deprecatedLocationPropertyDescriptors);
  }
  var deprecatedLocationPropertyDescriptors = {
    absoluteURL: {
      get() {
        return this.toString();
      }
    }
  };
  var session = new Session(recentRequests);
  var { cache, navigator: navigator2 } = session;
  function start() {
    session.start();
  }
  function registerAdapter(adapter) {
    session.registerAdapter(adapter);
  }
  function visit(location2, options) {
    session.visit(location2, options);
  }
  function connectStreamSource(source) {
    session.connectStreamSource(source);
  }
  function disconnectStreamSource(source) {
    session.disconnectStreamSource(source);
  }
  function renderStreamMessage(message) {
    session.renderStreamMessage(message);
  }
  function setProgressBarDelay(delay) {
    console.warn(
      "Please replace `Turbo.setProgressBarDelay(delay)` with `Turbo.config.drive.progressBarDelay = delay`. The top-level function is deprecated and will be removed in a future version of Turbo.`"
    );
    config.drive.progressBarDelay = delay;
  }
  function setConfirmMethod(confirmMethod) {
    console.warn(
      "Please replace `Turbo.setConfirmMethod(confirmMethod)` with `Turbo.config.forms.confirm = confirmMethod`. The top-level function is deprecated and will be removed in a future version of Turbo.`"
    );
    config.forms.confirm = confirmMethod;
  }
  function setFormMode(mode) {
    console.warn(
      "Please replace `Turbo.setFormMode(mode)` with `Turbo.config.forms.mode = mode`. The top-level function is deprecated and will be removed in a future version of Turbo.`"
    );
    config.forms.mode = mode;
  }
  function morphBodyElements(currentBody, newBody) {
    MorphingPageRenderer.renderElement(currentBody, newBody);
  }
  function morphTurboFrameElements(currentFrame, newFrame) {
    MorphingFrameRenderer.renderElement(currentFrame, newFrame);
  }
  var Turbo = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    navigator: navigator2,
    session,
    cache,
    PageRenderer,
    PageSnapshot,
    FrameRenderer,
    fetch: fetchWithTurboHeaders,
    config,
    start,
    registerAdapter,
    visit,
    connectStreamSource,
    disconnectStreamSource,
    renderStreamMessage,
    setProgressBarDelay,
    setConfirmMethod,
    setFormMode,
    morphBodyElements,
    morphTurboFrameElements,
    morphChildren,
    morphElements
  });
  var TurboFrameMissingError = class extends Error {
  };
  var FrameController = class {
    fetchResponseLoaded = (_fetchResponse) => Promise.resolve();
    #currentFetchRequest = null;
    #resolveVisitPromise = () => {
    };
    #connected = false;
    #hasBeenLoaded = false;
    #ignoredAttributes = /* @__PURE__ */ new Set();
    #shouldMorphFrame = false;
    action = null;
    constructor(element) {
      this.element = element;
      this.view = new FrameView(this, this.element);
      this.appearanceObserver = new AppearanceObserver(this, this.element);
      this.formLinkClickObserver = new FormLinkClickObserver(this, this.element);
      this.linkInterceptor = new LinkInterceptor(this, this.element);
      this.restorationIdentifier = uuid();
      this.formSubmitObserver = new FormSubmitObserver(this, this.element);
    }
    // Frame delegate
    connect() {
      if (!this.#connected) {
        this.#connected = true;
        if (this.loadingStyle == FrameLoadingStyle.lazy) {
          this.appearanceObserver.start();
        } else {
          this.#loadSourceURL();
        }
        this.formLinkClickObserver.start();
        this.linkInterceptor.start();
        this.formSubmitObserver.start();
      }
    }
    disconnect() {
      if (this.#connected) {
        this.#connected = false;
        this.appearanceObserver.stop();
        this.formLinkClickObserver.stop();
        this.linkInterceptor.stop();
        this.formSubmitObserver.stop();
        if (!this.element.hasAttribute("recurse")) {
          this.#currentFetchRequest?.cancel();
        }
      }
    }
    disabledChanged() {
      if (this.disabled) {
        this.#currentFetchRequest?.cancel();
      } else if (this.loadingStyle == FrameLoadingStyle.eager) {
        this.#loadSourceURL();
      }
    }
    sourceURLChanged() {
      if (this.#isIgnoringChangesTo("src")) return;
      if (!this.sourceURL) {
        this.#currentFetchRequest?.cancel();
      }
      if (this.element.isConnected) {
        this.complete = false;
      }
      if (this.loadingStyle == FrameLoadingStyle.eager || this.#hasBeenLoaded) {
        this.#loadSourceURL();
      }
    }
    sourceURLReloaded() {
      const { refresh, src } = this.element;
      this.#shouldMorphFrame = src && refresh === "morph";
      this.element.removeAttribute("complete");
      this.element.src = null;
      this.element.src = src;
      return this.element.loaded;
    }
    loadingStyleChanged() {
      if (this.loadingStyle == FrameLoadingStyle.lazy) {
        this.appearanceObserver.start();
      } else {
        this.appearanceObserver.stop();
        this.#loadSourceURL();
      }
    }
    async #loadSourceURL() {
      if (this.enabled && this.isActive && !this.complete && this.sourceURL) {
        this.element.loaded = this.#visit(expandURL(this.sourceURL));
        this.appearanceObserver.stop();
        await this.element.loaded;
        this.#hasBeenLoaded = true;
      }
    }
    async loadResponse(fetchResponse) {
      if (fetchResponse.redirected || fetchResponse.succeeded && fetchResponse.isHTML) {
        this.sourceURL = fetchResponse.response.url;
      }
      try {
        const html = await fetchResponse.responseHTML;
        if (html) {
          const document2 = parseHTMLDocument(html);
          const pageSnapshot = PageSnapshot.fromDocument(document2);
          if (pageSnapshot.isVisitable) {
            await this.#loadFrameResponse(fetchResponse, document2);
          } else {
            await this.#handleUnvisitableFrameResponse(fetchResponse);
          }
        }
      } finally {
        this.#shouldMorphFrame = false;
        this.fetchResponseLoaded = () => Promise.resolve();
      }
    }
    // Appearance observer delegate
    elementAppearedInViewport(element) {
      this.proposeVisitIfNavigatedWithAction(element, getVisitAction(element));
      this.#loadSourceURL();
    }
    // Form link click observer delegate
    willSubmitFormLinkToLocation(link) {
      return this.#shouldInterceptNavigation(link);
    }
    submittedFormLinkToLocation(link, _location, form) {
      const frame = this.#findFrameElement(link);
      if (frame) form.setAttribute("data-turbo-frame", frame.id);
    }
    // Link interceptor delegate
    shouldInterceptLinkClick(element, _location, _event) {
      return this.#shouldInterceptNavigation(element);
    }
    linkClickIntercepted(element, location2) {
      this.#navigateFrame(element, location2);
    }
    // Form submit observer delegate
    willSubmitForm(element, submitter2) {
      return element.closest("turbo-frame") == this.element && this.#shouldInterceptNavigation(element, submitter2);
    }
    formSubmitted(element, submitter2) {
      if (this.formSubmission) {
        this.formSubmission.stop();
      }
      this.formSubmission = new FormSubmission(this, element, submitter2);
      const { fetchRequest } = this.formSubmission;
      const frame = this.#findFrameElement(element, submitter2);
      this.prepareRequest(fetchRequest, frame);
      this.formSubmission.start();
    }
    // Fetch request delegate
    prepareRequest(request, frame = this) {
      request.headers["Turbo-Frame"] = frame.id;
      if (this.currentNavigationElement?.hasAttribute("data-turbo-stream")) {
        request.acceptResponseType(StreamMessage.contentType);
      }
    }
    requestStarted(_request) {
      markAsBusy(this.element);
    }
    requestPreventedHandlingResponse(_request, _response) {
      this.#resolveVisitPromise();
    }
    async requestSucceededWithResponse(request, response) {
      await this.loadResponse(response);
      this.#resolveVisitPromise();
    }
    async requestFailedWithResponse(request, response) {
      await this.loadResponse(response);
      this.#resolveVisitPromise();
    }
    requestErrored(request, error2) {
      console.error(error2);
      this.#resolveVisitPromise();
    }
    requestFinished(_request) {
      clearBusyState(this.element);
    }
    // Form submission delegate
    formSubmissionStarted({ formElement }) {
      markAsBusy(formElement, this.#findFrameElement(formElement));
    }
    formSubmissionSucceededWithResponse(formSubmission, response) {
      const frame = this.#findFrameElement(formSubmission.formElement, formSubmission.submitter);
      frame.delegate.proposeVisitIfNavigatedWithAction(frame, getVisitAction(formSubmission.submitter, formSubmission.formElement, frame));
      frame.delegate.loadResponse(response);
      if (!formSubmission.isSafe) {
        session.clearCache();
      }
    }
    formSubmissionFailedWithResponse(formSubmission, fetchResponse) {
      this.element.delegate.loadResponse(fetchResponse);
      session.clearCache();
    }
    formSubmissionErrored(formSubmission, error2) {
      console.error(error2);
    }
    formSubmissionFinished({ formElement }) {
      clearBusyState(formElement, this.#findFrameElement(formElement));
    }
    // View delegate
    allowsImmediateRender({ element: newFrame }, options) {
      const event = dispatch("turbo:before-frame-render", {
        target: this.element,
        detail: { newFrame, ...options },
        cancelable: true
      });
      const {
        defaultPrevented,
        detail: { render }
      } = event;
      if (this.view.renderer && render) {
        this.view.renderer.renderElement = render;
      }
      return !defaultPrevented;
    }
    viewRenderedSnapshot(_snapshot, _isPreview, _renderMethod) {
    }
    preloadOnLoadLinksForView(element) {
      session.preloadOnLoadLinksForView(element);
    }
    viewInvalidated() {
    }
    // Frame renderer delegate
    willRenderFrame(currentElement, _newElement) {
      this.previousFrameElement = currentElement.cloneNode(true);
    }
    visitCachedSnapshot = ({ element }) => {
      const frame = element.querySelector("#" + this.element.id);
      if (frame && this.previousFrameElement) {
        frame.replaceChildren(...this.previousFrameElement.children);
      }
      delete this.previousFrameElement;
    };
    // Private
    async #loadFrameResponse(fetchResponse, document2) {
      const newFrameElement = await this.extractForeignFrameElement(document2.body);
      const rendererClass = this.#shouldMorphFrame ? MorphingFrameRenderer : FrameRenderer;
      if (newFrameElement) {
        const snapshot = new Snapshot(newFrameElement);
        const renderer = new rendererClass(this, this.view.snapshot, snapshot, false, false);
        if (this.view.renderPromise) await this.view.renderPromise;
        this.changeHistory();
        await this.view.render(renderer);
        this.complete = true;
        session.frameRendered(fetchResponse, this.element);
        session.frameLoaded(this.element);
        await this.fetchResponseLoaded(fetchResponse);
      } else if (this.#willHandleFrameMissingFromResponse(fetchResponse)) {
        this.#handleFrameMissingFromResponse(fetchResponse);
      }
    }
    async #visit(url) {
      const request = new FetchRequest(this, FetchMethod.get, url, new URLSearchParams(), this.element);
      this.#currentFetchRequest?.cancel();
      this.#currentFetchRequest = request;
      return new Promise((resolve) => {
        this.#resolveVisitPromise = () => {
          this.#resolveVisitPromise = () => {
          };
          this.#currentFetchRequest = null;
          resolve();
        };
        request.perform();
      });
    }
    #navigateFrame(element, url, submitter2) {
      const frame = this.#findFrameElement(element, submitter2);
      frame.delegate.proposeVisitIfNavigatedWithAction(frame, getVisitAction(submitter2, element, frame));
      this.#withCurrentNavigationElement(element, () => {
        frame.src = url;
      });
    }
    proposeVisitIfNavigatedWithAction(frame, action = null) {
      this.action = action;
      if (this.action) {
        const pageSnapshot = PageSnapshot.fromElement(frame).clone();
        const { visitCachedSnapshot } = frame.delegate;
        frame.delegate.fetchResponseLoaded = async (fetchResponse) => {
          if (frame.src) {
            const { statusCode, redirected } = fetchResponse;
            const responseHTML = await fetchResponse.responseHTML;
            const response = { statusCode, redirected, responseHTML };
            const options = {
              response,
              visitCachedSnapshot,
              willRender: false,
              updateHistory: false,
              restorationIdentifier: this.restorationIdentifier,
              snapshot: pageSnapshot
            };
            if (this.action) options.action = this.action;
            session.visit(frame.src, options);
          }
        };
      }
    }
    changeHistory() {
      if (this.action) {
        const method = getHistoryMethodForAction(this.action);
        session.history.update(method, expandURL(this.element.src || ""), this.restorationIdentifier);
      }
    }
    async #handleUnvisitableFrameResponse(fetchResponse) {
      console.warn(
        `The response (${fetchResponse.statusCode}) from <turbo-frame id="${this.element.id}"> is performing a full page visit due to turbo-visit-control.`
      );
      await this.#visitResponse(fetchResponse.response);
    }
    #willHandleFrameMissingFromResponse(fetchResponse) {
      this.element.setAttribute("complete", "");
      const response = fetchResponse.response;
      const visit2 = async (url, options) => {
        if (url instanceof Response) {
          this.#visitResponse(url);
        } else {
          session.visit(url, options);
        }
      };
      const event = dispatch("turbo:frame-missing", {
        target: this.element,
        detail: { response, visit: visit2 },
        cancelable: true
      });
      return !event.defaultPrevented;
    }
    #handleFrameMissingFromResponse(fetchResponse) {
      this.view.missing();
      this.#throwFrameMissingError(fetchResponse);
    }
    #throwFrameMissingError(fetchResponse) {
      const message = `The response (${fetchResponse.statusCode}) did not contain the expected <turbo-frame id="${this.element.id}"> and will be ignored. To perform a full page visit instead, set turbo-visit-control to reload.`;
      throw new TurboFrameMissingError(message);
    }
    async #visitResponse(response) {
      const wrapped = new FetchResponse(response);
      const responseHTML = await wrapped.responseHTML;
      const { location: location2, redirected, statusCode } = wrapped;
      return session.visit(location2, { response: { redirected, statusCode, responseHTML } });
    }
    #findFrameElement(element, submitter2) {
      const id = getAttribute("data-turbo-frame", submitter2, element) || this.element.getAttribute("target");
      const target = this.#getFrameElementById(id);
      return target instanceof FrameElement ? target : this.element;
    }
    async extractForeignFrameElement(container) {
      let element;
      const id = CSS.escape(this.id);
      try {
        element = activateElement(container.querySelector(`turbo-frame#${id}`), this.sourceURL);
        if (element) {
          return element;
        }
        element = activateElement(container.querySelector(`turbo-frame[src][recurse~=${id}]`), this.sourceURL);
        if (element) {
          await element.loaded;
          return await this.extractForeignFrameElement(element);
        }
      } catch (error2) {
        console.error(error2);
        return new FrameElement();
      }
      return null;
    }
    #formActionIsVisitable(form, submitter2) {
      const action = getAction$1(form, submitter2);
      return locationIsVisitable(expandURL(action), this.rootLocation);
    }
    #shouldInterceptNavigation(element, submitter2) {
      const id = getAttribute("data-turbo-frame", submitter2, element) || this.element.getAttribute("target");
      if (element instanceof HTMLFormElement && !this.#formActionIsVisitable(element, submitter2)) {
        return false;
      }
      if (!this.enabled || id == "_top") {
        return false;
      }
      if (id) {
        const frameElement = this.#getFrameElementById(id);
        if (frameElement) {
          return !frameElement.disabled;
        } else if (id == "_parent") {
          return false;
        }
      }
      if (!session.elementIsNavigatable(element)) {
        return false;
      }
      if (submitter2 && !session.elementIsNavigatable(submitter2)) {
        return false;
      }
      return true;
    }
    // Computed properties
    get id() {
      return this.element.id;
    }
    get disabled() {
      return this.element.disabled;
    }
    get enabled() {
      return !this.disabled;
    }
    get sourceURL() {
      if (this.element.src) {
        return this.element.src;
      }
    }
    set sourceURL(sourceURL) {
      this.#ignoringChangesToAttribute("src", () => {
        this.element.src = sourceURL ?? null;
      });
    }
    get loadingStyle() {
      return this.element.loading;
    }
    get isLoading() {
      return this.formSubmission !== void 0 || this.#resolveVisitPromise() !== void 0;
    }
    get complete() {
      return this.element.hasAttribute("complete");
    }
    set complete(value) {
      if (value) {
        this.element.setAttribute("complete", "");
      } else {
        this.element.removeAttribute("complete");
      }
    }
    get isActive() {
      return this.element.isActive && this.#connected;
    }
    get rootLocation() {
      const meta = this.element.ownerDocument.querySelector(`meta[name="turbo-root"]`);
      const root = meta?.content ?? "/";
      return expandURL(root);
    }
    #isIgnoringChangesTo(attributeName) {
      return this.#ignoredAttributes.has(attributeName);
    }
    #ignoringChangesToAttribute(attributeName, callback) {
      this.#ignoredAttributes.add(attributeName);
      callback();
      this.#ignoredAttributes.delete(attributeName);
    }
    #withCurrentNavigationElement(element, callback) {
      this.currentNavigationElement = element;
      callback();
      delete this.currentNavigationElement;
    }
    #getFrameElementById(id) {
      if (id != null) {
        const element = id === "_parent" ? this.element.parentElement.closest("turbo-frame") : document.getElementById(id);
        if (element instanceof FrameElement) {
          return element;
        }
      }
    }
  };
  function activateElement(element, currentURL) {
    if (element) {
      const src = element.getAttribute("src");
      if (src != null && currentURL != null && urlsAreEqual(src, currentURL)) {
        throw new Error(`Matching <turbo-frame id="${element.id}"> element has a source URL which references itself`);
      }
      if (element.ownerDocument !== document) {
        element = document.importNode(element, true);
      }
      if (element instanceof FrameElement) {
        element.connectedCallback();
        element.disconnectedCallback();
        return element;
      }
    }
  }
  var StreamActions = {
    after() {
      this.removeDuplicateTargetSiblings();
      this.targetElements.forEach((e) => e.parentElement?.insertBefore(this.templateContent, e.nextSibling));
    },
    append() {
      this.removeDuplicateTargetChildren();
      this.targetElements.forEach((e) => e.append(this.templateContent));
    },
    before() {
      this.removeDuplicateTargetSiblings();
      this.targetElements.forEach((e) => e.parentElement?.insertBefore(this.templateContent, e));
    },
    prepend() {
      this.removeDuplicateTargetChildren();
      this.targetElements.forEach((e) => e.prepend(this.templateContent));
    },
    remove() {
      this.targetElements.forEach((e) => e.remove());
    },
    replace() {
      const method = this.getAttribute("method");
      this.targetElements.forEach((targetElement) => {
        if (method === "morph") {
          morphElements(targetElement, this.templateContent);
        } else {
          targetElement.replaceWith(this.templateContent);
        }
      });
    },
    update() {
      const method = this.getAttribute("method");
      this.targetElements.forEach((targetElement) => {
        if (method === "morph") {
          morphChildren(targetElement, this.templateContent);
        } else {
          targetElement.innerHTML = "";
          targetElement.append(this.templateContent);
        }
      });
    },
    refresh() {
      const method = this.getAttribute("method");
      const requestId = this.requestId;
      const scroll = this.getAttribute("scroll");
      session.refresh(this.baseURI, { method, requestId, scroll });
    }
  };
  var StreamElement = class _StreamElement extends HTMLElement {
    static async renderElement(newElement) {
      await newElement.performAction();
    }
    async connectedCallback() {
      try {
        await this.render();
      } catch (error2) {
        console.error(error2);
      } finally {
        this.disconnect();
      }
    }
    async render() {
      return this.renderPromise ??= (async () => {
        const event = this.beforeRenderEvent;
        if (this.dispatchEvent(event)) {
          await nextRepaint();
          await event.detail.render(this);
        }
      })();
    }
    disconnect() {
      try {
        this.remove();
      } catch {
      }
    }
    /**
     * Removes duplicate children (by ID)
     */
    removeDuplicateTargetChildren() {
      this.duplicateChildren.forEach((c) => c.remove());
    }
    /**
     * Gets the list of duplicate children (i.e. those with the same ID)
     */
    get duplicateChildren() {
      const existingChildren = this.targetElements.flatMap((e) => [...e.children]).filter((c) => !!c.getAttribute("id"));
      const newChildrenIds = [...this.templateContent?.children || []].filter((c) => !!c.getAttribute("id")).map((c) => c.getAttribute("id"));
      return existingChildren.filter((c) => newChildrenIds.includes(c.getAttribute("id")));
    }
    /**
    * Removes duplicate siblings (by ID)
    */
    removeDuplicateTargetSiblings() {
      this.duplicateSiblings.forEach((c) => c.remove());
    }
    /**
    * Gets the list of duplicate siblings (i.e. those with the same ID)
    */
    get duplicateSiblings() {
      const existingChildren = this.targetElements.flatMap((e) => [...e.parentElement.children]).filter((c) => !!c.id);
      const newChildrenIds = [...this.templateContent?.children || []].filter((c) => !!c.id).map((c) => c.id);
      return existingChildren.filter((c) => newChildrenIds.includes(c.id));
    }
    /**
     * Gets the action function to be performed.
     */
    get performAction() {
      if (this.action) {
        const actionFunction = StreamActions[this.action];
        if (actionFunction) {
          return actionFunction;
        }
        this.#raise("unknown action");
      }
      this.#raise("action attribute is missing");
    }
    /**
     * Gets the target elements which the template will be rendered to.
     */
    get targetElements() {
      if (this.target) {
        return this.targetElementsById;
      } else if (this.targets) {
        return this.targetElementsByQuery;
      } else {
        this.#raise("target or targets attribute is missing");
      }
    }
    /**
     * Gets the contents of the main `<template>`.
     */
    get templateContent() {
      return this.templateElement.content.cloneNode(true);
    }
    /**
     * Gets the main `<template>` used for rendering
     */
    get templateElement() {
      if (this.firstElementChild === null) {
        const template = this.ownerDocument.createElement("template");
        this.appendChild(template);
        return template;
      } else if (this.firstElementChild instanceof HTMLTemplateElement) {
        return this.firstElementChild;
      }
      this.#raise("first child element must be a <template> element");
    }
    /**
     * Gets the current action.
     */
    get action() {
      return this.getAttribute("action");
    }
    /**
     * Gets the current target (an element ID) to which the result will
     * be rendered.
     */
    get target() {
      return this.getAttribute("target");
    }
    /**
     * Gets the current "targets" selector (a CSS selector)
     */
    get targets() {
      return this.getAttribute("targets");
    }
    /**
     * Reads the request-id attribute
     */
    get requestId() {
      return this.getAttribute("request-id");
    }
    #raise(message) {
      throw new Error(`${this.description}: ${message}`);
    }
    get description() {
      return (this.outerHTML.match(/<[^>]+>/) ?? [])[0] ?? "<turbo-stream>";
    }
    get beforeRenderEvent() {
      return new CustomEvent("turbo:before-stream-render", {
        bubbles: true,
        cancelable: true,
        detail: { newStream: this, render: _StreamElement.renderElement }
      });
    }
    get targetElementsById() {
      const element = this.ownerDocument?.getElementById(this.target);
      if (element !== null) {
        return [element];
      } else {
        return [];
      }
    }
    get targetElementsByQuery() {
      const elements = this.ownerDocument?.querySelectorAll(this.targets);
      if (elements.length !== 0) {
        return Array.prototype.slice.call(elements);
      } else {
        return [];
      }
    }
  };
  var StreamSourceElement = class extends HTMLElement {
    streamSource = null;
    connectedCallback() {
      this.streamSource = this.src.match(/^ws{1,2}:/) ? new WebSocket(this.src) : new EventSource(this.src);
      connectStreamSource(this.streamSource);
    }
    disconnectedCallback() {
      if (this.streamSource) {
        this.streamSource.close();
        disconnectStreamSource(this.streamSource);
      }
    }
    get src() {
      return this.getAttribute("src") || "";
    }
  };
  FrameElement.delegateConstructor = FrameController;
  if (customElements.get("turbo-frame") === void 0) {
    customElements.define("turbo-frame", FrameElement);
  }
  if (customElements.get("turbo-stream") === void 0) {
    customElements.define("turbo-stream", StreamElement);
  }
  if (customElements.get("turbo-stream-source") === void 0) {
    customElements.define("turbo-stream-source", StreamSourceElement);
  }
  (() => {
    const scriptElement = document.currentScript;
    if (!scriptElement) return;
    if (scriptElement.hasAttribute("data-turbo-suppress-warning")) return;
    let element = scriptElement.parentElement;
    while (element) {
      if (element == document.body) {
        return console.warn(
          unindent`
        You are loading Turbo from a <script> element inside the <body> element. This is probably not what you meant to do!

        Load your application’s JavaScript bundle inside the <head> element instead. <script> elements in <body> are evaluated with each page change.

        For more information, see: https://turbo.hotwired.dev/handbook/building#working-with-script-elements

        ——
        Suppress this warning by adding a "data-turbo-suppress-warning" attribute to: %s
      `,
          scriptElement.outerHTML
        );
      }
      element = element.parentElement;
    }
  })();
  window.Turbo = { ...Turbo, StreamActions };
  start();

  // node_modules/@hotwired/turbo-rails/app/javascript/turbo/cable.js
  var consumer;
  async function getConsumer() {
    return consumer || setConsumer(createConsumer2().then(setConsumer));
  }
  function setConsumer(newConsumer) {
    return consumer = newConsumer;
  }
  async function createConsumer2() {
    const { createConsumer: createConsumer3 } = await Promise.resolve().then(() => (init_src(), src_exports));
    return createConsumer3();
  }
  async function subscribeTo(channel, mixin) {
    const { subscriptions } = await getConsumer();
    return subscriptions.create(channel, mixin);
  }

  // node_modules/@hotwired/turbo-rails/app/javascript/turbo/snakeize.js
  function walk(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (obj instanceof Date || obj instanceof RegExp) return obj;
    if (Array.isArray(obj)) return obj.map(walk);
    return Object.keys(obj).reduce(function(acc, key) {
      var camel = key[0].toLowerCase() + key.slice(1).replace(/([A-Z]+)/g, function(m, x) {
        return "_" + x.toLowerCase();
      });
      acc[camel] = walk(obj[key]);
      return acc;
    }, {});
  }

  // node_modules/@hotwired/turbo-rails/app/javascript/turbo/cable_stream_source_element.js
  var TurboCableStreamSourceElement = class extends HTMLElement {
    static observedAttributes = ["channel", "signed-stream-name"];
    async connectedCallback() {
      connectStreamSource(this);
      this.subscription = await subscribeTo(this.channel, {
        received: this.dispatchMessageEvent.bind(this),
        connected: this.subscriptionConnected.bind(this),
        disconnected: this.subscriptionDisconnected.bind(this)
      });
    }
    disconnectedCallback() {
      disconnectStreamSource(this);
      if (this.subscription) this.subscription.unsubscribe();
      this.subscriptionDisconnected();
    }
    attributeChangedCallback() {
      if (this.subscription) {
        this.disconnectedCallback();
        this.connectedCallback();
      }
    }
    dispatchMessageEvent(data) {
      const event = new MessageEvent("message", { data });
      return this.dispatchEvent(event);
    }
    subscriptionConnected() {
      this.setAttribute("connected", "");
    }
    subscriptionDisconnected() {
      this.removeAttribute("connected");
    }
    get channel() {
      const channel = this.getAttribute("channel");
      const signed_stream_name = this.getAttribute("signed-stream-name");
      return { channel, signed_stream_name, ...walk({ ...this.dataset }) };
    }
  };
  if (customElements.get("turbo-cable-stream-source") === void 0) {
    customElements.define("turbo-cable-stream-source", TurboCableStreamSourceElement);
  }

  // node_modules/@hotwired/turbo-rails/app/javascript/turbo/fetch_requests.js
  function encodeMethodIntoRequestBody(event) {
    if (event.target instanceof HTMLFormElement) {
      const { target: form, detail: { fetchOptions } } = event;
      form.addEventListener("turbo:submit-start", ({ detail: { formSubmission: { submitter: submitter2 } } }) => {
        const body = isBodyInit(fetchOptions.body) ? fetchOptions.body : new URLSearchParams();
        const method = determineFetchMethod(submitter2, body, form);
        if (!/get/i.test(method)) {
          if (/post/i.test(method)) {
            body.delete("_method");
          } else {
            body.set("_method", method);
          }
          fetchOptions.method = "post";
        }
      }, { once: true });
    }
  }
  function determineFetchMethod(submitter2, body, form) {
    const formMethod = determineFormMethod(submitter2);
    const overrideMethod = body.get("_method");
    const method = form.getAttribute("method") || "get";
    if (typeof formMethod == "string") {
      return formMethod;
    } else if (typeof overrideMethod == "string") {
      return overrideMethod;
    } else {
      return method;
    }
  }
  function determineFormMethod(submitter2) {
    if (submitter2 instanceof HTMLButtonElement || submitter2 instanceof HTMLInputElement) {
      if (submitter2.name === "_method") {
        return submitter2.value;
      } else if (submitter2.hasAttribute("formmethod")) {
        return submitter2.formMethod;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  function isBodyInit(body) {
    return body instanceof FormData || body instanceof URLSearchParams;
  }

  // node_modules/@hotwired/turbo-rails/app/javascript/turbo/index.js
  window.Turbo = turbo_es2017_esm_exports;
  addEventListener("turbo:before-fetch-request", encodeMethodIntoRequestBody);

  // node_modules/@hotwired/stimulus/dist/stimulus.js
  var EventListener = class {
    constructor(eventTarget, eventName, eventOptions) {
      this.eventTarget = eventTarget;
      this.eventName = eventName;
      this.eventOptions = eventOptions;
      this.unorderedBindings = /* @__PURE__ */ new Set();
    }
    connect() {
      this.eventTarget.addEventListener(this.eventName, this, this.eventOptions);
    }
    disconnect() {
      this.eventTarget.removeEventListener(this.eventName, this, this.eventOptions);
    }
    bindingConnected(binding) {
      this.unorderedBindings.add(binding);
    }
    bindingDisconnected(binding) {
      this.unorderedBindings.delete(binding);
    }
    handleEvent(event) {
      const extendedEvent = extendEvent(event);
      for (const binding of this.bindings) {
        if (extendedEvent.immediatePropagationStopped) {
          break;
        } else {
          binding.handleEvent(extendedEvent);
        }
      }
    }
    hasBindings() {
      return this.unorderedBindings.size > 0;
    }
    get bindings() {
      return Array.from(this.unorderedBindings).sort((left2, right2) => {
        const leftIndex = left2.index, rightIndex = right2.index;
        return leftIndex < rightIndex ? -1 : leftIndex > rightIndex ? 1 : 0;
      });
    }
  };
  function extendEvent(event) {
    if ("immediatePropagationStopped" in event) {
      return event;
    } else {
      const { stopImmediatePropagation } = event;
      return Object.assign(event, {
        immediatePropagationStopped: false,
        stopImmediatePropagation() {
          this.immediatePropagationStopped = true;
          stopImmediatePropagation.call(this);
        }
      });
    }
  }
  var Dispatcher = class {
    constructor(application3) {
      this.application = application3;
      this.eventListenerMaps = /* @__PURE__ */ new Map();
      this.started = false;
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.eventListeners.forEach((eventListener) => eventListener.connect());
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
        this.eventListeners.forEach((eventListener) => eventListener.disconnect());
      }
    }
    get eventListeners() {
      return Array.from(this.eventListenerMaps.values()).reduce((listeners, map) => listeners.concat(Array.from(map.values())), []);
    }
    bindingConnected(binding) {
      this.fetchEventListenerForBinding(binding).bindingConnected(binding);
    }
    bindingDisconnected(binding, clearEventListeners = false) {
      this.fetchEventListenerForBinding(binding).bindingDisconnected(binding);
      if (clearEventListeners)
        this.clearEventListenersForBinding(binding);
    }
    handleError(error2, message, detail = {}) {
      this.application.handleError(error2, `Error ${message}`, detail);
    }
    clearEventListenersForBinding(binding) {
      const eventListener = this.fetchEventListenerForBinding(binding);
      if (!eventListener.hasBindings()) {
        eventListener.disconnect();
        this.removeMappedEventListenerFor(binding);
      }
    }
    removeMappedEventListenerFor(binding) {
      const { eventTarget, eventName, eventOptions } = binding;
      const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
      const cacheKey = this.cacheKey(eventName, eventOptions);
      eventListenerMap.delete(cacheKey);
      if (eventListenerMap.size == 0)
        this.eventListenerMaps.delete(eventTarget);
    }
    fetchEventListenerForBinding(binding) {
      const { eventTarget, eventName, eventOptions } = binding;
      return this.fetchEventListener(eventTarget, eventName, eventOptions);
    }
    fetchEventListener(eventTarget, eventName, eventOptions) {
      const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
      const cacheKey = this.cacheKey(eventName, eventOptions);
      let eventListener = eventListenerMap.get(cacheKey);
      if (!eventListener) {
        eventListener = this.createEventListener(eventTarget, eventName, eventOptions);
        eventListenerMap.set(cacheKey, eventListener);
      }
      return eventListener;
    }
    createEventListener(eventTarget, eventName, eventOptions) {
      const eventListener = new EventListener(eventTarget, eventName, eventOptions);
      if (this.started) {
        eventListener.connect();
      }
      return eventListener;
    }
    fetchEventListenerMapForEventTarget(eventTarget) {
      let eventListenerMap = this.eventListenerMaps.get(eventTarget);
      if (!eventListenerMap) {
        eventListenerMap = /* @__PURE__ */ new Map();
        this.eventListenerMaps.set(eventTarget, eventListenerMap);
      }
      return eventListenerMap;
    }
    cacheKey(eventName, eventOptions) {
      const parts = [eventName];
      Object.keys(eventOptions).sort().forEach((key) => {
        parts.push(`${eventOptions[key] ? "" : "!"}${key}`);
      });
      return parts.join(":");
    }
  };
  var defaultActionDescriptorFilters = {
    stop({ event, value }) {
      if (value)
        event.stopPropagation();
      return true;
    },
    prevent({ event, value }) {
      if (value)
        event.preventDefault();
      return true;
    },
    self({ event, value, element }) {
      if (value) {
        return element === event.target;
      } else {
        return true;
      }
    }
  };
  var descriptorPattern = /^(?:(?:([^.]+?)\+)?(.+?)(?:\.(.+?))?(?:@(window|document))?->)?(.+?)(?:#([^:]+?))(?::(.+))?$/;
  function parseActionDescriptorString(descriptorString) {
    const source = descriptorString.trim();
    const matches = source.match(descriptorPattern) || [];
    let eventName = matches[2];
    let keyFilter = matches[3];
    if (keyFilter && !["keydown", "keyup", "keypress"].includes(eventName)) {
      eventName += `.${keyFilter}`;
      keyFilter = "";
    }
    return {
      eventTarget: parseEventTarget(matches[4]),
      eventName,
      eventOptions: matches[7] ? parseEventOptions(matches[7]) : {},
      identifier: matches[5],
      methodName: matches[6],
      keyFilter: matches[1] || keyFilter
    };
  }
  function parseEventTarget(eventTargetName) {
    if (eventTargetName == "window") {
      return window;
    } else if (eventTargetName == "document") {
      return document;
    }
  }
  function parseEventOptions(eventOptions) {
    return eventOptions.split(":").reduce((options, token) => Object.assign(options, { [token.replace(/^!/, "")]: !/^!/.test(token) }), {});
  }
  function stringifyEventTarget(eventTarget) {
    if (eventTarget == window) {
      return "window";
    } else if (eventTarget == document) {
      return "document";
    }
  }
  function camelize(value) {
    return value.replace(/(?:[_-])([a-z0-9])/g, (_, char) => char.toUpperCase());
  }
  function namespaceCamelize(value) {
    return camelize(value.replace(/--/g, "-").replace(/__/g, "_"));
  }
  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  function dasherize(value) {
    return value.replace(/([A-Z])/g, (_, char) => `-${char.toLowerCase()}`);
  }
  function tokenize(value) {
    return value.match(/[^\s]+/g) || [];
  }
  function isSomething(object) {
    return object !== null && object !== void 0;
  }
  function hasProperty(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  }
  var allModifiers = ["meta", "ctrl", "alt", "shift"];
  var Action = class {
    constructor(element, index, descriptor, schema) {
      this.element = element;
      this.index = index;
      this.eventTarget = descriptor.eventTarget || element;
      this.eventName = descriptor.eventName || getDefaultEventNameForElement(element) || error("missing event name");
      this.eventOptions = descriptor.eventOptions || {};
      this.identifier = descriptor.identifier || error("missing identifier");
      this.methodName = descriptor.methodName || error("missing method name");
      this.keyFilter = descriptor.keyFilter || "";
      this.schema = schema;
    }
    static forToken(token, schema) {
      return new this(token.element, token.index, parseActionDescriptorString(token.content), schema);
    }
    toString() {
      const eventFilter = this.keyFilter ? `.${this.keyFilter}` : "";
      const eventTarget = this.eventTargetName ? `@${this.eventTargetName}` : "";
      return `${this.eventName}${eventFilter}${eventTarget}->${this.identifier}#${this.methodName}`;
    }
    shouldIgnoreKeyboardEvent(event) {
      if (!this.keyFilter) {
        return false;
      }
      const filters = this.keyFilter.split("+");
      if (this.keyFilterDissatisfied(event, filters)) {
        return true;
      }
      const standardFilter = filters.filter((key) => !allModifiers.includes(key))[0];
      if (!standardFilter) {
        return false;
      }
      if (!hasProperty(this.keyMappings, standardFilter)) {
        error(`contains unknown key filter: ${this.keyFilter}`);
      }
      return this.keyMappings[standardFilter].toLowerCase() !== event.key.toLowerCase();
    }
    shouldIgnoreMouseEvent(event) {
      if (!this.keyFilter) {
        return false;
      }
      const filters = [this.keyFilter];
      if (this.keyFilterDissatisfied(event, filters)) {
        return true;
      }
      return false;
    }
    get params() {
      const params = {};
      const pattern = new RegExp(`^data-${this.identifier}-(.+)-param$`, "i");
      for (const { name, value } of Array.from(this.element.attributes)) {
        const match = name.match(pattern);
        const key = match && match[1];
        if (key) {
          params[camelize(key)] = typecast(value);
        }
      }
      return params;
    }
    get eventTargetName() {
      return stringifyEventTarget(this.eventTarget);
    }
    get keyMappings() {
      return this.schema.keyMappings;
    }
    keyFilterDissatisfied(event, filters) {
      const [meta, ctrl, alt, shift] = allModifiers.map((modifier) => filters.includes(modifier));
      return event.metaKey !== meta || event.ctrlKey !== ctrl || event.altKey !== alt || event.shiftKey !== shift;
    }
  };
  var defaultEventNames = {
    a: () => "click",
    button: () => "click",
    form: () => "submit",
    details: () => "toggle",
    input: (e) => e.getAttribute("type") == "submit" ? "click" : "input",
    select: () => "change",
    textarea: () => "input"
  };
  function getDefaultEventNameForElement(element) {
    const tagName = element.tagName.toLowerCase();
    if (tagName in defaultEventNames) {
      return defaultEventNames[tagName](element);
    }
  }
  function error(message) {
    throw new Error(message);
  }
  function typecast(value) {
    try {
      return JSON.parse(value);
    } catch (o_O) {
      return value;
    }
  }
  var Binding = class {
    constructor(context, action) {
      this.context = context;
      this.action = action;
    }
    get index() {
      return this.action.index;
    }
    get eventTarget() {
      return this.action.eventTarget;
    }
    get eventOptions() {
      return this.action.eventOptions;
    }
    get identifier() {
      return this.context.identifier;
    }
    handleEvent(event) {
      const actionEvent = this.prepareActionEvent(event);
      if (this.willBeInvokedByEvent(event) && this.applyEventModifiers(actionEvent)) {
        this.invokeWithEvent(actionEvent);
      }
    }
    get eventName() {
      return this.action.eventName;
    }
    get method() {
      const method = this.controller[this.methodName];
      if (typeof method == "function") {
        return method;
      }
      throw new Error(`Action "${this.action}" references undefined method "${this.methodName}"`);
    }
    applyEventModifiers(event) {
      const { element } = this.action;
      const { actionDescriptorFilters } = this.context.application;
      const { controller } = this.context;
      let passes = true;
      for (const [name, value] of Object.entries(this.eventOptions)) {
        if (name in actionDescriptorFilters) {
          const filter = actionDescriptorFilters[name];
          passes = passes && filter({ name, value, event, element, controller });
        } else {
          continue;
        }
      }
      return passes;
    }
    prepareActionEvent(event) {
      return Object.assign(event, { params: this.action.params });
    }
    invokeWithEvent(event) {
      const { target, currentTarget } = event;
      try {
        this.method.call(this.controller, event);
        this.context.logDebugActivity(this.methodName, { event, target, currentTarget, action: this.methodName });
      } catch (error2) {
        const { identifier, controller, element, index } = this;
        const detail = { identifier, controller, element, index, event };
        this.context.handleError(error2, `invoking action "${this.action}"`, detail);
      }
    }
    willBeInvokedByEvent(event) {
      const eventTarget = event.target;
      if (event instanceof KeyboardEvent && this.action.shouldIgnoreKeyboardEvent(event)) {
        return false;
      }
      if (event instanceof MouseEvent && this.action.shouldIgnoreMouseEvent(event)) {
        return false;
      }
      if (this.element === eventTarget) {
        return true;
      } else if (eventTarget instanceof Element && this.element.contains(eventTarget)) {
        return this.scope.containsElement(eventTarget);
      } else {
        return this.scope.containsElement(this.action.element);
      }
    }
    get controller() {
      return this.context.controller;
    }
    get methodName() {
      return this.action.methodName;
    }
    get element() {
      return this.scope.element;
    }
    get scope() {
      return this.context.scope;
    }
  };
  var ElementObserver = class {
    constructor(element, delegate) {
      this.mutationObserverInit = { attributes: true, childList: true, subtree: true };
      this.element = element;
      this.started = false;
      this.delegate = delegate;
      this.elements = /* @__PURE__ */ new Set();
      this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, this.mutationObserverInit);
        this.refresh();
      }
    }
    pause(callback) {
      if (this.started) {
        this.mutationObserver.disconnect();
        this.started = false;
      }
      callback();
      if (!this.started) {
        this.mutationObserver.observe(this.element, this.mutationObserverInit);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    }
    refresh() {
      if (this.started) {
        const matches = new Set(this.matchElementsInTree());
        for (const element of Array.from(this.elements)) {
          if (!matches.has(element)) {
            this.removeElement(element);
          }
        }
        for (const element of Array.from(matches)) {
          this.addElement(element);
        }
      }
    }
    processMutations(mutations) {
      if (this.started) {
        for (const mutation of mutations) {
          this.processMutation(mutation);
        }
      }
    }
    processMutation(mutation) {
      if (mutation.type == "attributes") {
        this.processAttributeChange(mutation.target, mutation.attributeName);
      } else if (mutation.type == "childList") {
        this.processRemovedNodes(mutation.removedNodes);
        this.processAddedNodes(mutation.addedNodes);
      }
    }
    processAttributeChange(element, attributeName) {
      if (this.elements.has(element)) {
        if (this.delegate.elementAttributeChanged && this.matchElement(element)) {
          this.delegate.elementAttributeChanged(element, attributeName);
        } else {
          this.removeElement(element);
        }
      } else if (this.matchElement(element)) {
        this.addElement(element);
      }
    }
    processRemovedNodes(nodes) {
      for (const node of Array.from(nodes)) {
        const element = this.elementFromNode(node);
        if (element) {
          this.processTree(element, this.removeElement);
        }
      }
    }
    processAddedNodes(nodes) {
      for (const node of Array.from(nodes)) {
        const element = this.elementFromNode(node);
        if (element && this.elementIsActive(element)) {
          this.processTree(element, this.addElement);
        }
      }
    }
    matchElement(element) {
      return this.delegate.matchElement(element);
    }
    matchElementsInTree(tree = this.element) {
      return this.delegate.matchElementsInTree(tree);
    }
    processTree(tree, processor) {
      for (const element of this.matchElementsInTree(tree)) {
        processor.call(this, element);
      }
    }
    elementFromNode(node) {
      if (node.nodeType == Node.ELEMENT_NODE) {
        return node;
      }
    }
    elementIsActive(element) {
      if (element.isConnected != this.element.isConnected) {
        return false;
      } else {
        return this.element.contains(element);
      }
    }
    addElement(element) {
      if (!this.elements.has(element)) {
        if (this.elementIsActive(element)) {
          this.elements.add(element);
          if (this.delegate.elementMatched) {
            this.delegate.elementMatched(element);
          }
        }
      }
    }
    removeElement(element) {
      if (this.elements.has(element)) {
        this.elements.delete(element);
        if (this.delegate.elementUnmatched) {
          this.delegate.elementUnmatched(element);
        }
      }
    }
  };
  var AttributeObserver = class {
    constructor(element, attributeName, delegate) {
      this.attributeName = attributeName;
      this.delegate = delegate;
      this.elementObserver = new ElementObserver(element, this);
    }
    get element() {
      return this.elementObserver.element;
    }
    get selector() {
      return `[${this.attributeName}]`;
    }
    start() {
      this.elementObserver.start();
    }
    pause(callback) {
      this.elementObserver.pause(callback);
    }
    stop() {
      this.elementObserver.stop();
    }
    refresh() {
      this.elementObserver.refresh();
    }
    get started() {
      return this.elementObserver.started;
    }
    matchElement(element) {
      return element.hasAttribute(this.attributeName);
    }
    matchElementsInTree(tree) {
      const match = this.matchElement(tree) ? [tree] : [];
      const matches = Array.from(tree.querySelectorAll(this.selector));
      return match.concat(matches);
    }
    elementMatched(element) {
      if (this.delegate.elementMatchedAttribute) {
        this.delegate.elementMatchedAttribute(element, this.attributeName);
      }
    }
    elementUnmatched(element) {
      if (this.delegate.elementUnmatchedAttribute) {
        this.delegate.elementUnmatchedAttribute(element, this.attributeName);
      }
    }
    elementAttributeChanged(element, attributeName) {
      if (this.delegate.elementAttributeValueChanged && this.attributeName == attributeName) {
        this.delegate.elementAttributeValueChanged(element, attributeName);
      }
    }
  };
  function add(map, key, value) {
    fetch(map, key).add(value);
  }
  function del(map, key, value) {
    fetch(map, key).delete(value);
    prune(map, key);
  }
  function fetch(map, key) {
    let values = map.get(key);
    if (!values) {
      values = /* @__PURE__ */ new Set();
      map.set(key, values);
    }
    return values;
  }
  function prune(map, key) {
    const values = map.get(key);
    if (values != null && values.size == 0) {
      map.delete(key);
    }
  }
  var Multimap = class {
    constructor() {
      this.valuesByKey = /* @__PURE__ */ new Map();
    }
    get keys() {
      return Array.from(this.valuesByKey.keys());
    }
    get values() {
      const sets = Array.from(this.valuesByKey.values());
      return sets.reduce((values, set) => values.concat(Array.from(set)), []);
    }
    get size() {
      const sets = Array.from(this.valuesByKey.values());
      return sets.reduce((size, set) => size + set.size, 0);
    }
    add(key, value) {
      add(this.valuesByKey, key, value);
    }
    delete(key, value) {
      del(this.valuesByKey, key, value);
    }
    has(key, value) {
      const values = this.valuesByKey.get(key);
      return values != null && values.has(value);
    }
    hasKey(key) {
      return this.valuesByKey.has(key);
    }
    hasValue(value) {
      const sets = Array.from(this.valuesByKey.values());
      return sets.some((set) => set.has(value));
    }
    getValuesForKey(key) {
      const values = this.valuesByKey.get(key);
      return values ? Array.from(values) : [];
    }
    getKeysForValue(value) {
      return Array.from(this.valuesByKey).filter(([_key, values]) => values.has(value)).map(([key, _values]) => key);
    }
  };
  var SelectorObserver = class {
    constructor(element, selector, delegate, details) {
      this._selector = selector;
      this.details = details;
      this.elementObserver = new ElementObserver(element, this);
      this.delegate = delegate;
      this.matchesByElement = new Multimap();
    }
    get started() {
      return this.elementObserver.started;
    }
    get selector() {
      return this._selector;
    }
    set selector(selector) {
      this._selector = selector;
      this.refresh();
    }
    start() {
      this.elementObserver.start();
    }
    pause(callback) {
      this.elementObserver.pause(callback);
    }
    stop() {
      this.elementObserver.stop();
    }
    refresh() {
      this.elementObserver.refresh();
    }
    get element() {
      return this.elementObserver.element;
    }
    matchElement(element) {
      const { selector } = this;
      if (selector) {
        const matches = element.matches(selector);
        if (this.delegate.selectorMatchElement) {
          return matches && this.delegate.selectorMatchElement(element, this.details);
        }
        return matches;
      } else {
        return false;
      }
    }
    matchElementsInTree(tree) {
      const { selector } = this;
      if (selector) {
        const match = this.matchElement(tree) ? [tree] : [];
        const matches = Array.from(tree.querySelectorAll(selector)).filter((match2) => this.matchElement(match2));
        return match.concat(matches);
      } else {
        return [];
      }
    }
    elementMatched(element) {
      const { selector } = this;
      if (selector) {
        this.selectorMatched(element, selector);
      }
    }
    elementUnmatched(element) {
      const selectors = this.matchesByElement.getKeysForValue(element);
      for (const selector of selectors) {
        this.selectorUnmatched(element, selector);
      }
    }
    elementAttributeChanged(element, _attributeName) {
      const { selector } = this;
      if (selector) {
        const matches = this.matchElement(element);
        const matchedBefore = this.matchesByElement.has(selector, element);
        if (matches && !matchedBefore) {
          this.selectorMatched(element, selector);
        } else if (!matches && matchedBefore) {
          this.selectorUnmatched(element, selector);
        }
      }
    }
    selectorMatched(element, selector) {
      this.delegate.selectorMatched(element, selector, this.details);
      this.matchesByElement.add(selector, element);
    }
    selectorUnmatched(element, selector) {
      this.delegate.selectorUnmatched(element, selector, this.details);
      this.matchesByElement.delete(selector, element);
    }
  };
  var StringMapObserver = class {
    constructor(element, delegate) {
      this.element = element;
      this.delegate = delegate;
      this.started = false;
      this.stringMap = /* @__PURE__ */ new Map();
      this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, { attributes: true, attributeOldValue: true });
        this.refresh();
      }
    }
    stop() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    }
    refresh() {
      if (this.started) {
        for (const attributeName of this.knownAttributeNames) {
          this.refreshAttribute(attributeName, null);
        }
      }
    }
    processMutations(mutations) {
      if (this.started) {
        for (const mutation of mutations) {
          this.processMutation(mutation);
        }
      }
    }
    processMutation(mutation) {
      const attributeName = mutation.attributeName;
      if (attributeName) {
        this.refreshAttribute(attributeName, mutation.oldValue);
      }
    }
    refreshAttribute(attributeName, oldValue) {
      const key = this.delegate.getStringMapKeyForAttribute(attributeName);
      if (key != null) {
        if (!this.stringMap.has(attributeName)) {
          this.stringMapKeyAdded(key, attributeName);
        }
        const value = this.element.getAttribute(attributeName);
        if (this.stringMap.get(attributeName) != value) {
          this.stringMapValueChanged(value, key, oldValue);
        }
        if (value == null) {
          const oldValue2 = this.stringMap.get(attributeName);
          this.stringMap.delete(attributeName);
          if (oldValue2)
            this.stringMapKeyRemoved(key, attributeName, oldValue2);
        } else {
          this.stringMap.set(attributeName, value);
        }
      }
    }
    stringMapKeyAdded(key, attributeName) {
      if (this.delegate.stringMapKeyAdded) {
        this.delegate.stringMapKeyAdded(key, attributeName);
      }
    }
    stringMapValueChanged(value, key, oldValue) {
      if (this.delegate.stringMapValueChanged) {
        this.delegate.stringMapValueChanged(value, key, oldValue);
      }
    }
    stringMapKeyRemoved(key, attributeName, oldValue) {
      if (this.delegate.stringMapKeyRemoved) {
        this.delegate.stringMapKeyRemoved(key, attributeName, oldValue);
      }
    }
    get knownAttributeNames() {
      return Array.from(new Set(this.currentAttributeNames.concat(this.recordedAttributeNames)));
    }
    get currentAttributeNames() {
      return Array.from(this.element.attributes).map((attribute) => attribute.name);
    }
    get recordedAttributeNames() {
      return Array.from(this.stringMap.keys());
    }
  };
  var TokenListObserver = class {
    constructor(element, attributeName, delegate) {
      this.attributeObserver = new AttributeObserver(element, attributeName, this);
      this.delegate = delegate;
      this.tokensByElement = new Multimap();
    }
    get started() {
      return this.attributeObserver.started;
    }
    start() {
      this.attributeObserver.start();
    }
    pause(callback) {
      this.attributeObserver.pause(callback);
    }
    stop() {
      this.attributeObserver.stop();
    }
    refresh() {
      this.attributeObserver.refresh();
    }
    get element() {
      return this.attributeObserver.element;
    }
    get attributeName() {
      return this.attributeObserver.attributeName;
    }
    elementMatchedAttribute(element) {
      this.tokensMatched(this.readTokensForElement(element));
    }
    elementAttributeValueChanged(element) {
      const [unmatchedTokens, matchedTokens] = this.refreshTokensForElement(element);
      this.tokensUnmatched(unmatchedTokens);
      this.tokensMatched(matchedTokens);
    }
    elementUnmatchedAttribute(element) {
      this.tokensUnmatched(this.tokensByElement.getValuesForKey(element));
    }
    tokensMatched(tokens) {
      tokens.forEach((token) => this.tokenMatched(token));
    }
    tokensUnmatched(tokens) {
      tokens.forEach((token) => this.tokenUnmatched(token));
    }
    tokenMatched(token) {
      this.delegate.tokenMatched(token);
      this.tokensByElement.add(token.element, token);
    }
    tokenUnmatched(token) {
      this.delegate.tokenUnmatched(token);
      this.tokensByElement.delete(token.element, token);
    }
    refreshTokensForElement(element) {
      const previousTokens = this.tokensByElement.getValuesForKey(element);
      const currentTokens = this.readTokensForElement(element);
      const firstDifferingIndex = zip(previousTokens, currentTokens).findIndex(([previousToken, currentToken]) => !tokensAreEqual(previousToken, currentToken));
      if (firstDifferingIndex == -1) {
        return [[], []];
      } else {
        return [previousTokens.slice(firstDifferingIndex), currentTokens.slice(firstDifferingIndex)];
      }
    }
    readTokensForElement(element) {
      const attributeName = this.attributeName;
      const tokenString = element.getAttribute(attributeName) || "";
      return parseTokenString(tokenString, element, attributeName);
    }
  };
  function parseTokenString(tokenString, element, attributeName) {
    return tokenString.trim().split(/\s+/).filter((content) => content.length).map((content, index) => ({ element, attributeName, content, index }));
  }
  function zip(left2, right2) {
    const length = Math.max(left2.length, right2.length);
    return Array.from({ length }, (_, index) => [left2[index], right2[index]]);
  }
  function tokensAreEqual(left2, right2) {
    return left2 && right2 && left2.index == right2.index && left2.content == right2.content;
  }
  var ValueListObserver = class {
    constructor(element, attributeName, delegate) {
      this.tokenListObserver = new TokenListObserver(element, attributeName, this);
      this.delegate = delegate;
      this.parseResultsByToken = /* @__PURE__ */ new WeakMap();
      this.valuesByTokenByElement = /* @__PURE__ */ new WeakMap();
    }
    get started() {
      return this.tokenListObserver.started;
    }
    start() {
      this.tokenListObserver.start();
    }
    stop() {
      this.tokenListObserver.stop();
    }
    refresh() {
      this.tokenListObserver.refresh();
    }
    get element() {
      return this.tokenListObserver.element;
    }
    get attributeName() {
      return this.tokenListObserver.attributeName;
    }
    tokenMatched(token) {
      const { element } = token;
      const { value } = this.fetchParseResultForToken(token);
      if (value) {
        this.fetchValuesByTokenForElement(element).set(token, value);
        this.delegate.elementMatchedValue(element, value);
      }
    }
    tokenUnmatched(token) {
      const { element } = token;
      const { value } = this.fetchParseResultForToken(token);
      if (value) {
        this.fetchValuesByTokenForElement(element).delete(token);
        this.delegate.elementUnmatchedValue(element, value);
      }
    }
    fetchParseResultForToken(token) {
      let parseResult = this.parseResultsByToken.get(token);
      if (!parseResult) {
        parseResult = this.parseToken(token);
        this.parseResultsByToken.set(token, parseResult);
      }
      return parseResult;
    }
    fetchValuesByTokenForElement(element) {
      let valuesByToken = this.valuesByTokenByElement.get(element);
      if (!valuesByToken) {
        valuesByToken = /* @__PURE__ */ new Map();
        this.valuesByTokenByElement.set(element, valuesByToken);
      }
      return valuesByToken;
    }
    parseToken(token) {
      try {
        const value = this.delegate.parseValueForToken(token);
        return { value };
      } catch (error2) {
        return { error: error2 };
      }
    }
  };
  var BindingObserver = class {
    constructor(context, delegate) {
      this.context = context;
      this.delegate = delegate;
      this.bindingsByAction = /* @__PURE__ */ new Map();
    }
    start() {
      if (!this.valueListObserver) {
        this.valueListObserver = new ValueListObserver(this.element, this.actionAttribute, this);
        this.valueListObserver.start();
      }
    }
    stop() {
      if (this.valueListObserver) {
        this.valueListObserver.stop();
        delete this.valueListObserver;
        this.disconnectAllActions();
      }
    }
    get element() {
      return this.context.element;
    }
    get identifier() {
      return this.context.identifier;
    }
    get actionAttribute() {
      return this.schema.actionAttribute;
    }
    get schema() {
      return this.context.schema;
    }
    get bindings() {
      return Array.from(this.bindingsByAction.values());
    }
    connectAction(action) {
      const binding = new Binding(this.context, action);
      this.bindingsByAction.set(action, binding);
      this.delegate.bindingConnected(binding);
    }
    disconnectAction(action) {
      const binding = this.bindingsByAction.get(action);
      if (binding) {
        this.bindingsByAction.delete(action);
        this.delegate.bindingDisconnected(binding);
      }
    }
    disconnectAllActions() {
      this.bindings.forEach((binding) => this.delegate.bindingDisconnected(binding, true));
      this.bindingsByAction.clear();
    }
    parseValueForToken(token) {
      const action = Action.forToken(token, this.schema);
      if (action.identifier == this.identifier) {
        return action;
      }
    }
    elementMatchedValue(element, action) {
      this.connectAction(action);
    }
    elementUnmatchedValue(element, action) {
      this.disconnectAction(action);
    }
  };
  var ValueObserver = class {
    constructor(context, receiver) {
      this.context = context;
      this.receiver = receiver;
      this.stringMapObserver = new StringMapObserver(this.element, this);
      this.valueDescriptorMap = this.controller.valueDescriptorMap;
    }
    start() {
      this.stringMapObserver.start();
      this.invokeChangedCallbacksForDefaultValues();
    }
    stop() {
      this.stringMapObserver.stop();
    }
    get element() {
      return this.context.element;
    }
    get controller() {
      return this.context.controller;
    }
    getStringMapKeyForAttribute(attributeName) {
      if (attributeName in this.valueDescriptorMap) {
        return this.valueDescriptorMap[attributeName].name;
      }
    }
    stringMapKeyAdded(key, attributeName) {
      const descriptor = this.valueDescriptorMap[attributeName];
      if (!this.hasValue(key)) {
        this.invokeChangedCallback(key, descriptor.writer(this.receiver[key]), descriptor.writer(descriptor.defaultValue));
      }
    }
    stringMapValueChanged(value, name, oldValue) {
      const descriptor = this.valueDescriptorNameMap[name];
      if (value === null)
        return;
      if (oldValue === null) {
        oldValue = descriptor.writer(descriptor.defaultValue);
      }
      this.invokeChangedCallback(name, value, oldValue);
    }
    stringMapKeyRemoved(key, attributeName, oldValue) {
      const descriptor = this.valueDescriptorNameMap[key];
      if (this.hasValue(key)) {
        this.invokeChangedCallback(key, descriptor.writer(this.receiver[key]), oldValue);
      } else {
        this.invokeChangedCallback(key, descriptor.writer(descriptor.defaultValue), oldValue);
      }
    }
    invokeChangedCallbacksForDefaultValues() {
      for (const { key, name, defaultValue, writer } of this.valueDescriptors) {
        if (defaultValue != void 0 && !this.controller.data.has(key)) {
          this.invokeChangedCallback(name, writer(defaultValue), void 0);
        }
      }
    }
    invokeChangedCallback(name, rawValue, rawOldValue) {
      const changedMethodName = `${name}Changed`;
      const changedMethod = this.receiver[changedMethodName];
      if (typeof changedMethod == "function") {
        const descriptor = this.valueDescriptorNameMap[name];
        try {
          const value = descriptor.reader(rawValue);
          let oldValue = rawOldValue;
          if (rawOldValue) {
            oldValue = descriptor.reader(rawOldValue);
          }
          changedMethod.call(this.receiver, value, oldValue);
        } catch (error2) {
          if (error2 instanceof TypeError) {
            error2.message = `Stimulus Value "${this.context.identifier}.${descriptor.name}" - ${error2.message}`;
          }
          throw error2;
        }
      }
    }
    get valueDescriptors() {
      const { valueDescriptorMap } = this;
      return Object.keys(valueDescriptorMap).map((key) => valueDescriptorMap[key]);
    }
    get valueDescriptorNameMap() {
      const descriptors = {};
      Object.keys(this.valueDescriptorMap).forEach((key) => {
        const descriptor = this.valueDescriptorMap[key];
        descriptors[descriptor.name] = descriptor;
      });
      return descriptors;
    }
    hasValue(attributeName) {
      const descriptor = this.valueDescriptorNameMap[attributeName];
      const hasMethodName = `has${capitalize(descriptor.name)}`;
      return this.receiver[hasMethodName];
    }
  };
  var TargetObserver = class {
    constructor(context, delegate) {
      this.context = context;
      this.delegate = delegate;
      this.targetsByName = new Multimap();
    }
    start() {
      if (!this.tokenListObserver) {
        this.tokenListObserver = new TokenListObserver(this.element, this.attributeName, this);
        this.tokenListObserver.start();
      }
    }
    stop() {
      if (this.tokenListObserver) {
        this.disconnectAllTargets();
        this.tokenListObserver.stop();
        delete this.tokenListObserver;
      }
    }
    tokenMatched({ element, content: name }) {
      if (this.scope.containsElement(element)) {
        this.connectTarget(element, name);
      }
    }
    tokenUnmatched({ element, content: name }) {
      this.disconnectTarget(element, name);
    }
    connectTarget(element, name) {
      var _a;
      if (!this.targetsByName.has(name, element)) {
        this.targetsByName.add(name, element);
        (_a = this.tokenListObserver) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.targetConnected(element, name));
      }
    }
    disconnectTarget(element, name) {
      var _a;
      if (this.targetsByName.has(name, element)) {
        this.targetsByName.delete(name, element);
        (_a = this.tokenListObserver) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.targetDisconnected(element, name));
      }
    }
    disconnectAllTargets() {
      for (const name of this.targetsByName.keys) {
        for (const element of this.targetsByName.getValuesForKey(name)) {
          this.disconnectTarget(element, name);
        }
      }
    }
    get attributeName() {
      return `data-${this.context.identifier}-target`;
    }
    get element() {
      return this.context.element;
    }
    get scope() {
      return this.context.scope;
    }
  };
  function readInheritableStaticArrayValues(constructor, propertyName) {
    const ancestors = getAncestorsForConstructor(constructor);
    return Array.from(ancestors.reduce((values, constructor2) => {
      getOwnStaticArrayValues(constructor2, propertyName).forEach((name) => values.add(name));
      return values;
    }, /* @__PURE__ */ new Set()));
  }
  function readInheritableStaticObjectPairs(constructor, propertyName) {
    const ancestors = getAncestorsForConstructor(constructor);
    return ancestors.reduce((pairs, constructor2) => {
      pairs.push(...getOwnStaticObjectPairs(constructor2, propertyName));
      return pairs;
    }, []);
  }
  function getAncestorsForConstructor(constructor) {
    const ancestors = [];
    while (constructor) {
      ancestors.push(constructor);
      constructor = Object.getPrototypeOf(constructor);
    }
    return ancestors.reverse();
  }
  function getOwnStaticArrayValues(constructor, propertyName) {
    const definition = constructor[propertyName];
    return Array.isArray(definition) ? definition : [];
  }
  function getOwnStaticObjectPairs(constructor, propertyName) {
    const definition = constructor[propertyName];
    return definition ? Object.keys(definition).map((key) => [key, definition[key]]) : [];
  }
  var OutletObserver = class {
    constructor(context, delegate) {
      this.started = false;
      this.context = context;
      this.delegate = delegate;
      this.outletsByName = new Multimap();
      this.outletElementsByName = new Multimap();
      this.selectorObserverMap = /* @__PURE__ */ new Map();
      this.attributeObserverMap = /* @__PURE__ */ new Map();
    }
    start() {
      if (!this.started) {
        this.outletDefinitions.forEach((outletName) => {
          this.setupSelectorObserverForOutlet(outletName);
          this.setupAttributeObserverForOutlet(outletName);
        });
        this.started = true;
        this.dependentContexts.forEach((context) => context.refresh());
      }
    }
    refresh() {
      this.selectorObserverMap.forEach((observer) => observer.refresh());
      this.attributeObserverMap.forEach((observer) => observer.refresh());
    }
    stop() {
      if (this.started) {
        this.started = false;
        this.disconnectAllOutlets();
        this.stopSelectorObservers();
        this.stopAttributeObservers();
      }
    }
    stopSelectorObservers() {
      if (this.selectorObserverMap.size > 0) {
        this.selectorObserverMap.forEach((observer) => observer.stop());
        this.selectorObserverMap.clear();
      }
    }
    stopAttributeObservers() {
      if (this.attributeObserverMap.size > 0) {
        this.attributeObserverMap.forEach((observer) => observer.stop());
        this.attributeObserverMap.clear();
      }
    }
    selectorMatched(element, _selector, { outletName }) {
      const outlet = this.getOutlet(element, outletName);
      if (outlet) {
        this.connectOutlet(outlet, element, outletName);
      }
    }
    selectorUnmatched(element, _selector, { outletName }) {
      const outlet = this.getOutletFromMap(element, outletName);
      if (outlet) {
        this.disconnectOutlet(outlet, element, outletName);
      }
    }
    selectorMatchElement(element, { outletName }) {
      const selector = this.selector(outletName);
      const hasOutlet = this.hasOutlet(element, outletName);
      const hasOutletController = element.matches(`[${this.schema.controllerAttribute}~=${outletName}]`);
      if (selector) {
        return hasOutlet && hasOutletController && element.matches(selector);
      } else {
        return false;
      }
    }
    elementMatchedAttribute(_element, attributeName) {
      const outletName = this.getOutletNameFromOutletAttributeName(attributeName);
      if (outletName) {
        this.updateSelectorObserverForOutlet(outletName);
      }
    }
    elementAttributeValueChanged(_element, attributeName) {
      const outletName = this.getOutletNameFromOutletAttributeName(attributeName);
      if (outletName) {
        this.updateSelectorObserverForOutlet(outletName);
      }
    }
    elementUnmatchedAttribute(_element, attributeName) {
      const outletName = this.getOutletNameFromOutletAttributeName(attributeName);
      if (outletName) {
        this.updateSelectorObserverForOutlet(outletName);
      }
    }
    connectOutlet(outlet, element, outletName) {
      var _a;
      if (!this.outletElementsByName.has(outletName, element)) {
        this.outletsByName.add(outletName, outlet);
        this.outletElementsByName.add(outletName, element);
        (_a = this.selectorObserverMap.get(outletName)) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.outletConnected(outlet, element, outletName));
      }
    }
    disconnectOutlet(outlet, element, outletName) {
      var _a;
      if (this.outletElementsByName.has(outletName, element)) {
        this.outletsByName.delete(outletName, outlet);
        this.outletElementsByName.delete(outletName, element);
        (_a = this.selectorObserverMap.get(outletName)) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.outletDisconnected(outlet, element, outletName));
      }
    }
    disconnectAllOutlets() {
      for (const outletName of this.outletElementsByName.keys) {
        for (const element of this.outletElementsByName.getValuesForKey(outletName)) {
          for (const outlet of this.outletsByName.getValuesForKey(outletName)) {
            this.disconnectOutlet(outlet, element, outletName);
          }
        }
      }
    }
    updateSelectorObserverForOutlet(outletName) {
      const observer = this.selectorObserverMap.get(outletName);
      if (observer) {
        observer.selector = this.selector(outletName);
      }
    }
    setupSelectorObserverForOutlet(outletName) {
      const selector = this.selector(outletName);
      const selectorObserver = new SelectorObserver(document.body, selector, this, { outletName });
      this.selectorObserverMap.set(outletName, selectorObserver);
      selectorObserver.start();
    }
    setupAttributeObserverForOutlet(outletName) {
      const attributeName = this.attributeNameForOutletName(outletName);
      const attributeObserver = new AttributeObserver(this.scope.element, attributeName, this);
      this.attributeObserverMap.set(outletName, attributeObserver);
      attributeObserver.start();
    }
    selector(outletName) {
      return this.scope.outlets.getSelectorForOutletName(outletName);
    }
    attributeNameForOutletName(outletName) {
      return this.scope.schema.outletAttributeForScope(this.identifier, outletName);
    }
    getOutletNameFromOutletAttributeName(attributeName) {
      return this.outletDefinitions.find((outletName) => this.attributeNameForOutletName(outletName) === attributeName);
    }
    get outletDependencies() {
      const dependencies = new Multimap();
      this.router.modules.forEach((module) => {
        const constructor = module.definition.controllerConstructor;
        const outlets = readInheritableStaticArrayValues(constructor, "outlets");
        outlets.forEach((outlet) => dependencies.add(outlet, module.identifier));
      });
      return dependencies;
    }
    get outletDefinitions() {
      return this.outletDependencies.getKeysForValue(this.identifier);
    }
    get dependentControllerIdentifiers() {
      return this.outletDependencies.getValuesForKey(this.identifier);
    }
    get dependentContexts() {
      const identifiers = this.dependentControllerIdentifiers;
      return this.router.contexts.filter((context) => identifiers.includes(context.identifier));
    }
    hasOutlet(element, outletName) {
      return !!this.getOutlet(element, outletName) || !!this.getOutletFromMap(element, outletName);
    }
    getOutlet(element, outletName) {
      return this.application.getControllerForElementAndIdentifier(element, outletName);
    }
    getOutletFromMap(element, outletName) {
      return this.outletsByName.getValuesForKey(outletName).find((outlet) => outlet.element === element);
    }
    get scope() {
      return this.context.scope;
    }
    get schema() {
      return this.context.schema;
    }
    get identifier() {
      return this.context.identifier;
    }
    get application() {
      return this.context.application;
    }
    get router() {
      return this.application.router;
    }
  };
  var Context = class {
    constructor(module, scope) {
      this.logDebugActivity = (functionName, detail = {}) => {
        const { identifier, controller, element } = this;
        detail = Object.assign({ identifier, controller, element }, detail);
        this.application.logDebugActivity(this.identifier, functionName, detail);
      };
      this.module = module;
      this.scope = scope;
      this.controller = new module.controllerConstructor(this);
      this.bindingObserver = new BindingObserver(this, this.dispatcher);
      this.valueObserver = new ValueObserver(this, this.controller);
      this.targetObserver = new TargetObserver(this, this);
      this.outletObserver = new OutletObserver(this, this);
      try {
        this.controller.initialize();
        this.logDebugActivity("initialize");
      } catch (error2) {
        this.handleError(error2, "initializing controller");
      }
    }
    connect() {
      this.bindingObserver.start();
      this.valueObserver.start();
      this.targetObserver.start();
      this.outletObserver.start();
      try {
        this.controller.connect();
        this.logDebugActivity("connect");
      } catch (error2) {
        this.handleError(error2, "connecting controller");
      }
    }
    refresh() {
      this.outletObserver.refresh();
    }
    disconnect() {
      try {
        this.controller.disconnect();
        this.logDebugActivity("disconnect");
      } catch (error2) {
        this.handleError(error2, "disconnecting controller");
      }
      this.outletObserver.stop();
      this.targetObserver.stop();
      this.valueObserver.stop();
      this.bindingObserver.stop();
    }
    get application() {
      return this.module.application;
    }
    get identifier() {
      return this.module.identifier;
    }
    get schema() {
      return this.application.schema;
    }
    get dispatcher() {
      return this.application.dispatcher;
    }
    get element() {
      return this.scope.element;
    }
    get parentElement() {
      return this.element.parentElement;
    }
    handleError(error2, message, detail = {}) {
      const { identifier, controller, element } = this;
      detail = Object.assign({ identifier, controller, element }, detail);
      this.application.handleError(error2, `Error ${message}`, detail);
    }
    targetConnected(element, name) {
      this.invokeControllerMethod(`${name}TargetConnected`, element);
    }
    targetDisconnected(element, name) {
      this.invokeControllerMethod(`${name}TargetDisconnected`, element);
    }
    outletConnected(outlet, element, name) {
      this.invokeControllerMethod(`${namespaceCamelize(name)}OutletConnected`, outlet, element);
    }
    outletDisconnected(outlet, element, name) {
      this.invokeControllerMethod(`${namespaceCamelize(name)}OutletDisconnected`, outlet, element);
    }
    invokeControllerMethod(methodName, ...args) {
      const controller = this.controller;
      if (typeof controller[methodName] == "function") {
        controller[methodName](...args);
      }
    }
  };
  function bless(constructor) {
    return shadow(constructor, getBlessedProperties(constructor));
  }
  function shadow(constructor, properties) {
    const shadowConstructor = extend2(constructor);
    const shadowProperties = getShadowProperties(constructor.prototype, properties);
    Object.defineProperties(shadowConstructor.prototype, shadowProperties);
    return shadowConstructor;
  }
  function getBlessedProperties(constructor) {
    const blessings = readInheritableStaticArrayValues(constructor, "blessings");
    return blessings.reduce((blessedProperties, blessing) => {
      const properties = blessing(constructor);
      for (const key in properties) {
        const descriptor = blessedProperties[key] || {};
        blessedProperties[key] = Object.assign(descriptor, properties[key]);
      }
      return blessedProperties;
    }, {});
  }
  function getShadowProperties(prototype, properties) {
    return getOwnKeys(properties).reduce((shadowProperties, key) => {
      const descriptor = getShadowedDescriptor(prototype, properties, key);
      if (descriptor) {
        Object.assign(shadowProperties, { [key]: descriptor });
      }
      return shadowProperties;
    }, {});
  }
  function getShadowedDescriptor(prototype, properties, key) {
    const shadowingDescriptor = Object.getOwnPropertyDescriptor(prototype, key);
    const shadowedByValue = shadowingDescriptor && "value" in shadowingDescriptor;
    if (!shadowedByValue) {
      const descriptor = Object.getOwnPropertyDescriptor(properties, key).value;
      if (shadowingDescriptor) {
        descriptor.get = shadowingDescriptor.get || descriptor.get;
        descriptor.set = shadowingDescriptor.set || descriptor.set;
      }
      return descriptor;
    }
  }
  var getOwnKeys = (() => {
    if (typeof Object.getOwnPropertySymbols == "function") {
      return (object) => [...Object.getOwnPropertyNames(object), ...Object.getOwnPropertySymbols(object)];
    } else {
      return Object.getOwnPropertyNames;
    }
  })();
  var extend2 = (() => {
    function extendWithReflect(constructor) {
      function extended() {
        return Reflect.construct(constructor, arguments, new.target);
      }
      extended.prototype = Object.create(constructor.prototype, {
        constructor: { value: extended }
      });
      Reflect.setPrototypeOf(extended, constructor);
      return extended;
    }
    function testReflectExtension() {
      const a = function() {
        this.a.call(this);
      };
      const b = extendWithReflect(a);
      b.prototype.a = function() {
      };
      return new b();
    }
    try {
      testReflectExtension();
      return extendWithReflect;
    } catch (error2) {
      return (constructor) => class extended extends constructor {
      };
    }
  })();
  function blessDefinition(definition) {
    return {
      identifier: definition.identifier,
      controllerConstructor: bless(definition.controllerConstructor)
    };
  }
  var Module = class {
    constructor(application3, definition) {
      this.application = application3;
      this.definition = blessDefinition(definition);
      this.contextsByScope = /* @__PURE__ */ new WeakMap();
      this.connectedContexts = /* @__PURE__ */ new Set();
    }
    get identifier() {
      return this.definition.identifier;
    }
    get controllerConstructor() {
      return this.definition.controllerConstructor;
    }
    get contexts() {
      return Array.from(this.connectedContexts);
    }
    connectContextForScope(scope) {
      const context = this.fetchContextForScope(scope);
      this.connectedContexts.add(context);
      context.connect();
    }
    disconnectContextForScope(scope) {
      const context = this.contextsByScope.get(scope);
      if (context) {
        this.connectedContexts.delete(context);
        context.disconnect();
      }
    }
    fetchContextForScope(scope) {
      let context = this.contextsByScope.get(scope);
      if (!context) {
        context = new Context(this, scope);
        this.contextsByScope.set(scope, context);
      }
      return context;
    }
  };
  var ClassMap = class {
    constructor(scope) {
      this.scope = scope;
    }
    has(name) {
      return this.data.has(this.getDataKey(name));
    }
    get(name) {
      return this.getAll(name)[0];
    }
    getAll(name) {
      const tokenString = this.data.get(this.getDataKey(name)) || "";
      return tokenize(tokenString);
    }
    getAttributeName(name) {
      return this.data.getAttributeNameForKey(this.getDataKey(name));
    }
    getDataKey(name) {
      return `${name}-class`;
    }
    get data() {
      return this.scope.data;
    }
  };
  var DataMap = class {
    constructor(scope) {
      this.scope = scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get(key) {
      const name = this.getAttributeNameForKey(key);
      return this.element.getAttribute(name);
    }
    set(key, value) {
      const name = this.getAttributeNameForKey(key);
      this.element.setAttribute(name, value);
      return this.get(key);
    }
    has(key) {
      const name = this.getAttributeNameForKey(key);
      return this.element.hasAttribute(name);
    }
    delete(key) {
      if (this.has(key)) {
        const name = this.getAttributeNameForKey(key);
        this.element.removeAttribute(name);
        return true;
      } else {
        return false;
      }
    }
    getAttributeNameForKey(key) {
      return `data-${this.identifier}-${dasherize(key)}`;
    }
  };
  var Guide = class {
    constructor(logger) {
      this.warnedKeysByObject = /* @__PURE__ */ new WeakMap();
      this.logger = logger;
    }
    warn(object, key, message) {
      let warnedKeys = this.warnedKeysByObject.get(object);
      if (!warnedKeys) {
        warnedKeys = /* @__PURE__ */ new Set();
        this.warnedKeysByObject.set(object, warnedKeys);
      }
      if (!warnedKeys.has(key)) {
        warnedKeys.add(key);
        this.logger.warn(message, object);
      }
    }
  };
  function attributeValueContainsToken(attributeName, token) {
    return `[${attributeName}~="${token}"]`;
  }
  var TargetSet = class {
    constructor(scope) {
      this.scope = scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get schema() {
      return this.scope.schema;
    }
    has(targetName) {
      return this.find(targetName) != null;
    }
    find(...targetNames) {
      return targetNames.reduce((target, targetName) => target || this.findTarget(targetName) || this.findLegacyTarget(targetName), void 0);
    }
    findAll(...targetNames) {
      return targetNames.reduce((targets, targetName) => [
        ...targets,
        ...this.findAllTargets(targetName),
        ...this.findAllLegacyTargets(targetName)
      ], []);
    }
    findTarget(targetName) {
      const selector = this.getSelectorForTargetName(targetName);
      return this.scope.findElement(selector);
    }
    findAllTargets(targetName) {
      const selector = this.getSelectorForTargetName(targetName);
      return this.scope.findAllElements(selector);
    }
    getSelectorForTargetName(targetName) {
      const attributeName = this.schema.targetAttributeForScope(this.identifier);
      return attributeValueContainsToken(attributeName, targetName);
    }
    findLegacyTarget(targetName) {
      const selector = this.getLegacySelectorForTargetName(targetName);
      return this.deprecate(this.scope.findElement(selector), targetName);
    }
    findAllLegacyTargets(targetName) {
      const selector = this.getLegacySelectorForTargetName(targetName);
      return this.scope.findAllElements(selector).map((element) => this.deprecate(element, targetName));
    }
    getLegacySelectorForTargetName(targetName) {
      const targetDescriptor = `${this.identifier}.${targetName}`;
      return attributeValueContainsToken(this.schema.targetAttribute, targetDescriptor);
    }
    deprecate(element, targetName) {
      if (element) {
        const { identifier } = this;
        const attributeName = this.schema.targetAttribute;
        const revisedAttributeName = this.schema.targetAttributeForScope(identifier);
        this.guide.warn(element, `target:${targetName}`, `Please replace ${attributeName}="${identifier}.${targetName}" with ${revisedAttributeName}="${targetName}". The ${attributeName} attribute is deprecated and will be removed in a future version of Stimulus.`);
      }
      return element;
    }
    get guide() {
      return this.scope.guide;
    }
  };
  var OutletSet = class {
    constructor(scope, controllerElement) {
      this.scope = scope;
      this.controllerElement = controllerElement;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get schema() {
      return this.scope.schema;
    }
    has(outletName) {
      return this.find(outletName) != null;
    }
    find(...outletNames) {
      return outletNames.reduce((outlet, outletName) => outlet || this.findOutlet(outletName), void 0);
    }
    findAll(...outletNames) {
      return outletNames.reduce((outlets, outletName) => [...outlets, ...this.findAllOutlets(outletName)], []);
    }
    getSelectorForOutletName(outletName) {
      const attributeName = this.schema.outletAttributeForScope(this.identifier, outletName);
      return this.controllerElement.getAttribute(attributeName);
    }
    findOutlet(outletName) {
      const selector = this.getSelectorForOutletName(outletName);
      if (selector)
        return this.findElement(selector, outletName);
    }
    findAllOutlets(outletName) {
      const selector = this.getSelectorForOutletName(outletName);
      return selector ? this.findAllElements(selector, outletName) : [];
    }
    findElement(selector, outletName) {
      const elements = this.scope.queryElements(selector);
      return elements.filter((element) => this.matchesElement(element, selector, outletName))[0];
    }
    findAllElements(selector, outletName) {
      const elements = this.scope.queryElements(selector);
      return elements.filter((element) => this.matchesElement(element, selector, outletName));
    }
    matchesElement(element, selector, outletName) {
      const controllerAttribute = element.getAttribute(this.scope.schema.controllerAttribute) || "";
      return element.matches(selector) && controllerAttribute.split(" ").includes(outletName);
    }
  };
  var Scope = class _Scope {
    constructor(schema, element, identifier, logger) {
      this.targets = new TargetSet(this);
      this.classes = new ClassMap(this);
      this.data = new DataMap(this);
      this.containsElement = (element2) => {
        return element2.closest(this.controllerSelector) === this.element;
      };
      this.schema = schema;
      this.element = element;
      this.identifier = identifier;
      this.guide = new Guide(logger);
      this.outlets = new OutletSet(this.documentScope, element);
    }
    findElement(selector) {
      return this.element.matches(selector) ? this.element : this.queryElements(selector).find(this.containsElement);
    }
    findAllElements(selector) {
      return [
        ...this.element.matches(selector) ? [this.element] : [],
        ...this.queryElements(selector).filter(this.containsElement)
      ];
    }
    queryElements(selector) {
      return Array.from(this.element.querySelectorAll(selector));
    }
    get controllerSelector() {
      return attributeValueContainsToken(this.schema.controllerAttribute, this.identifier);
    }
    get isDocumentScope() {
      return this.element === document.documentElement;
    }
    get documentScope() {
      return this.isDocumentScope ? this : new _Scope(this.schema, document.documentElement, this.identifier, this.guide.logger);
    }
  };
  var ScopeObserver = class {
    constructor(element, schema, delegate) {
      this.element = element;
      this.schema = schema;
      this.delegate = delegate;
      this.valueListObserver = new ValueListObserver(this.element, this.controllerAttribute, this);
      this.scopesByIdentifierByElement = /* @__PURE__ */ new WeakMap();
      this.scopeReferenceCounts = /* @__PURE__ */ new WeakMap();
    }
    start() {
      this.valueListObserver.start();
    }
    stop() {
      this.valueListObserver.stop();
    }
    get controllerAttribute() {
      return this.schema.controllerAttribute;
    }
    parseValueForToken(token) {
      const { element, content: identifier } = token;
      return this.parseValueForElementAndIdentifier(element, identifier);
    }
    parseValueForElementAndIdentifier(element, identifier) {
      const scopesByIdentifier = this.fetchScopesByIdentifierForElement(element);
      let scope = scopesByIdentifier.get(identifier);
      if (!scope) {
        scope = this.delegate.createScopeForElementAndIdentifier(element, identifier);
        scopesByIdentifier.set(identifier, scope);
      }
      return scope;
    }
    elementMatchedValue(element, value) {
      const referenceCount = (this.scopeReferenceCounts.get(value) || 0) + 1;
      this.scopeReferenceCounts.set(value, referenceCount);
      if (referenceCount == 1) {
        this.delegate.scopeConnected(value);
      }
    }
    elementUnmatchedValue(element, value) {
      const referenceCount = this.scopeReferenceCounts.get(value);
      if (referenceCount) {
        this.scopeReferenceCounts.set(value, referenceCount - 1);
        if (referenceCount == 1) {
          this.delegate.scopeDisconnected(value);
        }
      }
    }
    fetchScopesByIdentifierForElement(element) {
      let scopesByIdentifier = this.scopesByIdentifierByElement.get(element);
      if (!scopesByIdentifier) {
        scopesByIdentifier = /* @__PURE__ */ new Map();
        this.scopesByIdentifierByElement.set(element, scopesByIdentifier);
      }
      return scopesByIdentifier;
    }
  };
  var Router = class {
    constructor(application3) {
      this.application = application3;
      this.scopeObserver = new ScopeObserver(this.element, this.schema, this);
      this.scopesByIdentifier = new Multimap();
      this.modulesByIdentifier = /* @__PURE__ */ new Map();
    }
    get element() {
      return this.application.element;
    }
    get schema() {
      return this.application.schema;
    }
    get logger() {
      return this.application.logger;
    }
    get controllerAttribute() {
      return this.schema.controllerAttribute;
    }
    get modules() {
      return Array.from(this.modulesByIdentifier.values());
    }
    get contexts() {
      return this.modules.reduce((contexts, module) => contexts.concat(module.contexts), []);
    }
    start() {
      this.scopeObserver.start();
    }
    stop() {
      this.scopeObserver.stop();
    }
    loadDefinition(definition) {
      this.unloadIdentifier(definition.identifier);
      const module = new Module(this.application, definition);
      this.connectModule(module);
      const afterLoad = definition.controllerConstructor.afterLoad;
      if (afterLoad) {
        afterLoad.call(definition.controllerConstructor, definition.identifier, this.application);
      }
    }
    unloadIdentifier(identifier) {
      const module = this.modulesByIdentifier.get(identifier);
      if (module) {
        this.disconnectModule(module);
      }
    }
    getContextForElementAndIdentifier(element, identifier) {
      const module = this.modulesByIdentifier.get(identifier);
      if (module) {
        return module.contexts.find((context) => context.element == element);
      }
    }
    proposeToConnectScopeForElementAndIdentifier(element, identifier) {
      const scope = this.scopeObserver.parseValueForElementAndIdentifier(element, identifier);
      if (scope) {
        this.scopeObserver.elementMatchedValue(scope.element, scope);
      } else {
        console.error(`Couldn't find or create scope for identifier: "${identifier}" and element:`, element);
      }
    }
    handleError(error2, message, detail) {
      this.application.handleError(error2, message, detail);
    }
    createScopeForElementAndIdentifier(element, identifier) {
      return new Scope(this.schema, element, identifier, this.logger);
    }
    scopeConnected(scope) {
      this.scopesByIdentifier.add(scope.identifier, scope);
      const module = this.modulesByIdentifier.get(scope.identifier);
      if (module) {
        module.connectContextForScope(scope);
      }
    }
    scopeDisconnected(scope) {
      this.scopesByIdentifier.delete(scope.identifier, scope);
      const module = this.modulesByIdentifier.get(scope.identifier);
      if (module) {
        module.disconnectContextForScope(scope);
      }
    }
    connectModule(module) {
      this.modulesByIdentifier.set(module.identifier, module);
      const scopes = this.scopesByIdentifier.getValuesForKey(module.identifier);
      scopes.forEach((scope) => module.connectContextForScope(scope));
    }
    disconnectModule(module) {
      this.modulesByIdentifier.delete(module.identifier);
      const scopes = this.scopesByIdentifier.getValuesForKey(module.identifier);
      scopes.forEach((scope) => module.disconnectContextForScope(scope));
    }
  };
  var defaultSchema = {
    controllerAttribute: "data-controller",
    actionAttribute: "data-action",
    targetAttribute: "data-target",
    targetAttributeForScope: (identifier) => `data-${identifier}-target`,
    outletAttributeForScope: (identifier, outlet) => `data-${identifier}-${outlet}-outlet`,
    keyMappings: Object.assign(Object.assign({ enter: "Enter", tab: "Tab", esc: "Escape", space: " ", up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", home: "Home", end: "End", page_up: "PageUp", page_down: "PageDown" }, objectFromEntries("abcdefghijklmnopqrstuvwxyz".split("").map((c) => [c, c]))), objectFromEntries("0123456789".split("").map((n) => [n, n])))
  };
  function objectFromEntries(array) {
    return array.reduce((memo, [k, v]) => Object.assign(Object.assign({}, memo), { [k]: v }), {});
  }
  var Application = class {
    constructor(element = document.documentElement, schema = defaultSchema) {
      this.logger = console;
      this.debug = false;
      this.logDebugActivity = (identifier, functionName, detail = {}) => {
        if (this.debug) {
          this.logFormattedMessage(identifier, functionName, detail);
        }
      };
      this.element = element;
      this.schema = schema;
      this.dispatcher = new Dispatcher(this);
      this.router = new Router(this);
      this.actionDescriptorFilters = Object.assign({}, defaultActionDescriptorFilters);
    }
    static start(element, schema) {
      const application3 = new this(element, schema);
      application3.start();
      return application3;
    }
    async start() {
      await domReady();
      this.logDebugActivity("application", "starting");
      this.dispatcher.start();
      this.router.start();
      this.logDebugActivity("application", "start");
    }
    stop() {
      this.logDebugActivity("application", "stopping");
      this.dispatcher.stop();
      this.router.stop();
      this.logDebugActivity("application", "stop");
    }
    register(identifier, controllerConstructor) {
      this.load({ identifier, controllerConstructor });
    }
    registerActionOption(name, filter) {
      this.actionDescriptorFilters[name] = filter;
    }
    load(head, ...rest) {
      const definitions = Array.isArray(head) ? head : [head, ...rest];
      definitions.forEach((definition) => {
        if (definition.controllerConstructor.shouldLoad) {
          this.router.loadDefinition(definition);
        }
      });
    }
    unload(head, ...rest) {
      const identifiers = Array.isArray(head) ? head : [head, ...rest];
      identifiers.forEach((identifier) => this.router.unloadIdentifier(identifier));
    }
    get controllers() {
      return this.router.contexts.map((context) => context.controller);
    }
    getControllerForElementAndIdentifier(element, identifier) {
      const context = this.router.getContextForElementAndIdentifier(element, identifier);
      return context ? context.controller : null;
    }
    handleError(error2, message, detail) {
      var _a;
      this.logger.error(`%s

%o

%o`, message, error2, detail);
      (_a = window.onerror) === null || _a === void 0 ? void 0 : _a.call(window, message, "", 0, 0, error2);
    }
    logFormattedMessage(identifier, functionName, detail = {}) {
      detail = Object.assign({ application: this }, detail);
      this.logger.groupCollapsed(`${identifier} #${functionName}`);
      this.logger.log("details:", Object.assign({}, detail));
      this.logger.groupEnd();
    }
  };
  function domReady() {
    return new Promise((resolve) => {
      if (document.readyState == "loading") {
        document.addEventListener("DOMContentLoaded", () => resolve());
      } else {
        resolve();
      }
    });
  }
  function ClassPropertiesBlessing(constructor) {
    const classes = readInheritableStaticArrayValues(constructor, "classes");
    return classes.reduce((properties, classDefinition) => {
      return Object.assign(properties, propertiesForClassDefinition(classDefinition));
    }, {});
  }
  function propertiesForClassDefinition(key) {
    return {
      [`${key}Class`]: {
        get() {
          const { classes } = this;
          if (classes.has(key)) {
            return classes.get(key);
          } else {
            const attribute = classes.getAttributeName(key);
            throw new Error(`Missing attribute "${attribute}"`);
          }
        }
      },
      [`${key}Classes`]: {
        get() {
          return this.classes.getAll(key);
        }
      },
      [`has${capitalize(key)}Class`]: {
        get() {
          return this.classes.has(key);
        }
      }
    };
  }
  function OutletPropertiesBlessing(constructor) {
    const outlets = readInheritableStaticArrayValues(constructor, "outlets");
    return outlets.reduce((properties, outletDefinition) => {
      return Object.assign(properties, propertiesForOutletDefinition(outletDefinition));
    }, {});
  }
  function getOutletController(controller, element, identifier) {
    return controller.application.getControllerForElementAndIdentifier(element, identifier);
  }
  function getControllerAndEnsureConnectedScope(controller, element, outletName) {
    let outletController = getOutletController(controller, element, outletName);
    if (outletController)
      return outletController;
    controller.application.router.proposeToConnectScopeForElementAndIdentifier(element, outletName);
    outletController = getOutletController(controller, element, outletName);
    if (outletController)
      return outletController;
  }
  function propertiesForOutletDefinition(name) {
    const camelizedName = namespaceCamelize(name);
    return {
      [`${camelizedName}Outlet`]: {
        get() {
          const outletElement = this.outlets.find(name);
          const selector = this.outlets.getSelectorForOutletName(name);
          if (outletElement) {
            const outletController = getControllerAndEnsureConnectedScope(this, outletElement, name);
            if (outletController)
              return outletController;
            throw new Error(`The provided outlet element is missing an outlet controller "${name}" instance for host controller "${this.identifier}"`);
          }
          throw new Error(`Missing outlet element "${name}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${selector}".`);
        }
      },
      [`${camelizedName}Outlets`]: {
        get() {
          const outlets = this.outlets.findAll(name);
          if (outlets.length > 0) {
            return outlets.map((outletElement) => {
              const outletController = getControllerAndEnsureConnectedScope(this, outletElement, name);
              if (outletController)
                return outletController;
              console.warn(`The provided outlet element is missing an outlet controller "${name}" instance for host controller "${this.identifier}"`, outletElement);
            }).filter((controller) => controller);
          }
          return [];
        }
      },
      [`${camelizedName}OutletElement`]: {
        get() {
          const outletElement = this.outlets.find(name);
          const selector = this.outlets.getSelectorForOutletName(name);
          if (outletElement) {
            return outletElement;
          } else {
            throw new Error(`Missing outlet element "${name}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${selector}".`);
          }
        }
      },
      [`${camelizedName}OutletElements`]: {
        get() {
          return this.outlets.findAll(name);
        }
      },
      [`has${capitalize(camelizedName)}Outlet`]: {
        get() {
          return this.outlets.has(name);
        }
      }
    };
  }
  function TargetPropertiesBlessing(constructor) {
    const targets = readInheritableStaticArrayValues(constructor, "targets");
    return targets.reduce((properties, targetDefinition) => {
      return Object.assign(properties, propertiesForTargetDefinition(targetDefinition));
    }, {});
  }
  function propertiesForTargetDefinition(name) {
    return {
      [`${name}Target`]: {
        get() {
          const target = this.targets.find(name);
          if (target) {
            return target;
          } else {
            throw new Error(`Missing target element "${name}" for "${this.identifier}" controller`);
          }
        }
      },
      [`${name}Targets`]: {
        get() {
          return this.targets.findAll(name);
        }
      },
      [`has${capitalize(name)}Target`]: {
        get() {
          return this.targets.has(name);
        }
      }
    };
  }
  function ValuePropertiesBlessing(constructor) {
    const valueDefinitionPairs = readInheritableStaticObjectPairs(constructor, "values");
    const propertyDescriptorMap = {
      valueDescriptorMap: {
        get() {
          return valueDefinitionPairs.reduce((result, valueDefinitionPair) => {
            const valueDescriptor = parseValueDefinitionPair(valueDefinitionPair, this.identifier);
            const attributeName = this.data.getAttributeNameForKey(valueDescriptor.key);
            return Object.assign(result, { [attributeName]: valueDescriptor });
          }, {});
        }
      }
    };
    return valueDefinitionPairs.reduce((properties, valueDefinitionPair) => {
      return Object.assign(properties, propertiesForValueDefinitionPair(valueDefinitionPair));
    }, propertyDescriptorMap);
  }
  function propertiesForValueDefinitionPair(valueDefinitionPair, controller) {
    const definition = parseValueDefinitionPair(valueDefinitionPair, controller);
    const { key, name, reader: read2, writer: write2 } = definition;
    return {
      [name]: {
        get() {
          const value = this.data.get(key);
          if (value !== null) {
            return read2(value);
          } else {
            return definition.defaultValue;
          }
        },
        set(value) {
          if (value === void 0) {
            this.data.delete(key);
          } else {
            this.data.set(key, write2(value));
          }
        }
      },
      [`has${capitalize(name)}`]: {
        get() {
          return this.data.has(key) || definition.hasCustomDefaultValue;
        }
      }
    };
  }
  function parseValueDefinitionPair([token, typeDefinition], controller) {
    return valueDescriptorForTokenAndTypeDefinition({
      controller,
      token,
      typeDefinition
    });
  }
  function parseValueTypeConstant(constant) {
    switch (constant) {
      case Array:
        return "array";
      case Boolean:
        return "boolean";
      case Number:
        return "number";
      case Object:
        return "object";
      case String:
        return "string";
    }
  }
  function parseValueTypeDefault(defaultValue) {
    switch (typeof defaultValue) {
      case "boolean":
        return "boolean";
      case "number":
        return "number";
      case "string":
        return "string";
    }
    if (Array.isArray(defaultValue))
      return "array";
    if (Object.prototype.toString.call(defaultValue) === "[object Object]")
      return "object";
  }
  function parseValueTypeObject(payload) {
    const { controller, token, typeObject } = payload;
    const hasType = isSomething(typeObject.type);
    const hasDefault = isSomething(typeObject.default);
    const fullObject = hasType && hasDefault;
    const onlyType = hasType && !hasDefault;
    const onlyDefault = !hasType && hasDefault;
    const typeFromObject = parseValueTypeConstant(typeObject.type);
    const typeFromDefaultValue = parseValueTypeDefault(payload.typeObject.default);
    if (onlyType)
      return typeFromObject;
    if (onlyDefault)
      return typeFromDefaultValue;
    if (typeFromObject !== typeFromDefaultValue) {
      const propertyPath = controller ? `${controller}.${token}` : token;
      throw new Error(`The specified default value for the Stimulus Value "${propertyPath}" must match the defined type "${typeFromObject}". The provided default value of "${typeObject.default}" is of type "${typeFromDefaultValue}".`);
    }
    if (fullObject)
      return typeFromObject;
  }
  function parseValueTypeDefinition(payload) {
    const { controller, token, typeDefinition } = payload;
    const typeObject = { controller, token, typeObject: typeDefinition };
    const typeFromObject = parseValueTypeObject(typeObject);
    const typeFromDefaultValue = parseValueTypeDefault(typeDefinition);
    const typeFromConstant = parseValueTypeConstant(typeDefinition);
    const type = typeFromObject || typeFromDefaultValue || typeFromConstant;
    if (type)
      return type;
    const propertyPath = controller ? `${controller}.${typeDefinition}` : token;
    throw new Error(`Unknown value type "${propertyPath}" for "${token}" value`);
  }
  function defaultValueForDefinition(typeDefinition) {
    const constant = parseValueTypeConstant(typeDefinition);
    if (constant)
      return defaultValuesByType[constant];
    const hasDefault = hasProperty(typeDefinition, "default");
    const hasType = hasProperty(typeDefinition, "type");
    const typeObject = typeDefinition;
    if (hasDefault)
      return typeObject.default;
    if (hasType) {
      const { type } = typeObject;
      const constantFromType = parseValueTypeConstant(type);
      if (constantFromType)
        return defaultValuesByType[constantFromType];
    }
    return typeDefinition;
  }
  function valueDescriptorForTokenAndTypeDefinition(payload) {
    const { token, typeDefinition } = payload;
    const key = `${dasherize(token)}-value`;
    const type = parseValueTypeDefinition(payload);
    return {
      type,
      key,
      name: camelize(key),
      get defaultValue() {
        return defaultValueForDefinition(typeDefinition);
      },
      get hasCustomDefaultValue() {
        return parseValueTypeDefault(typeDefinition) !== void 0;
      },
      reader: readers[type],
      writer: writers[type] || writers.default
    };
  }
  var defaultValuesByType = {
    get array() {
      return [];
    },
    boolean: false,
    number: 0,
    get object() {
      return {};
    },
    string: ""
  };
  var readers = {
    array(value) {
      const array = JSON.parse(value);
      if (!Array.isArray(array)) {
        throw new TypeError(`expected value of type "array" but instead got value "${value}" of type "${parseValueTypeDefault(array)}"`);
      }
      return array;
    },
    boolean(value) {
      return !(value == "0" || String(value).toLowerCase() == "false");
    },
    number(value) {
      return Number(value.replace(/_/g, ""));
    },
    object(value) {
      const object = JSON.parse(value);
      if (object === null || typeof object != "object" || Array.isArray(object)) {
        throw new TypeError(`expected value of type "object" but instead got value "${value}" of type "${parseValueTypeDefault(object)}"`);
      }
      return object;
    },
    string(value) {
      return value;
    }
  };
  var writers = {
    default: writeString,
    array: writeJSON,
    object: writeJSON
  };
  function writeJSON(value) {
    return JSON.stringify(value);
  }
  function writeString(value) {
    return `${value}`;
  }
  var Controller = class {
    constructor(context) {
      this.context = context;
    }
    static get shouldLoad() {
      return true;
    }
    static afterLoad(_identifier, _application) {
      return;
    }
    get application() {
      return this.context.application;
    }
    get scope() {
      return this.context.scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get targets() {
      return this.scope.targets;
    }
    get outlets() {
      return this.scope.outlets;
    }
    get classes() {
      return this.scope.classes;
    }
    get data() {
      return this.scope.data;
    }
    initialize() {
    }
    connect() {
    }
    disconnect() {
    }
    dispatch(eventName, { target = this.element, detail = {}, prefix = this.identifier, bubbles = true, cancelable = true } = {}) {
      const type = prefix ? `${prefix}:${eventName}` : eventName;
      const event = new CustomEvent(type, { detail, bubbles, cancelable });
      target.dispatchEvent(event);
      return event;
    }
  };
  Controller.blessings = [
    ClassPropertiesBlessing,
    TargetPropertiesBlessing,
    ValuePropertiesBlessing,
    OutletPropertiesBlessing
  ];
  Controller.targets = [];
  Controller.outlets = [];
  Controller.values = {};

  // node_modules/@popperjs/core/lib/index.js
  var lib_exports = {};
  __export(lib_exports, {
    afterMain: () => afterMain,
    afterRead: () => afterRead,
    afterWrite: () => afterWrite,
    applyStyles: () => applyStyles_default,
    arrow: () => arrow_default,
    auto: () => auto,
    basePlacements: () => basePlacements,
    beforeMain: () => beforeMain,
    beforeRead: () => beforeRead,
    beforeWrite: () => beforeWrite,
    bottom: () => bottom,
    clippingParents: () => clippingParents,
    computeStyles: () => computeStyles_default,
    createPopper: () => createPopper3,
    createPopperBase: () => createPopper,
    createPopperLite: () => createPopper2,
    detectOverflow: () => detectOverflow,
    end: () => end,
    eventListeners: () => eventListeners_default,
    flip: () => flip_default,
    hide: () => hide_default,
    left: () => left,
    main: () => main,
    modifierPhases: () => modifierPhases,
    offset: () => offset_default,
    placements: () => placements,
    popper: () => popper,
    popperGenerator: () => popperGenerator,
    popperOffsets: () => popperOffsets_default,
    preventOverflow: () => preventOverflow_default,
    read: () => read,
    reference: () => reference,
    right: () => right,
    start: () => start2,
    top: () => top,
    variationPlacements: () => variationPlacements,
    viewport: () => viewport,
    write: () => write
  });

  // node_modules/@popperjs/core/lib/enums.js
  var top = "top";
  var bottom = "bottom";
  var right = "right";
  var left = "left";
  var auto = "auto";
  var basePlacements = [top, bottom, right, left];
  var start2 = "start";
  var end = "end";
  var clippingParents = "clippingParents";
  var viewport = "viewport";
  var popper = "popper";
  var reference = "reference";
  var variationPlacements = /* @__PURE__ */ basePlacements.reduce(function(acc, placement) {
    return acc.concat([placement + "-" + start2, placement + "-" + end]);
  }, []);
  var placements = /* @__PURE__ */ [].concat(basePlacements, [auto]).reduce(function(acc, placement) {
    return acc.concat([placement, placement + "-" + start2, placement + "-" + end]);
  }, []);
  var beforeRead = "beforeRead";
  var read = "read";
  var afterRead = "afterRead";
  var beforeMain = "beforeMain";
  var main = "main";
  var afterMain = "afterMain";
  var beforeWrite = "beforeWrite";
  var write = "write";
  var afterWrite = "afterWrite";
  var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

  // node_modules/@popperjs/core/lib/dom-utils/getNodeName.js
  function getNodeName(element) {
    return element ? (element.nodeName || "").toLowerCase() : null;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getWindow.js
  function getWindow(node) {
    if (node == null) {
      return window;
    }
    if (node.toString() !== "[object Window]") {
      var ownerDocument = node.ownerDocument;
      return ownerDocument ? ownerDocument.defaultView || window : window;
    }
    return node;
  }

  // node_modules/@popperjs/core/lib/dom-utils/instanceOf.js
  function isElement(node) {
    var OwnElement = getWindow(node).Element;
    return node instanceof OwnElement || node instanceof Element;
  }
  function isHTMLElement(node) {
    var OwnElement = getWindow(node).HTMLElement;
    return node instanceof OwnElement || node instanceof HTMLElement;
  }
  function isShadowRoot(node) {
    if (typeof ShadowRoot === "undefined") {
      return false;
    }
    var OwnElement = getWindow(node).ShadowRoot;
    return node instanceof OwnElement || node instanceof ShadowRoot;
  }

  // node_modules/@popperjs/core/lib/modifiers/applyStyles.js
  function applyStyles(_ref) {
    var state = _ref.state;
    Object.keys(state.elements).forEach(function(name) {
      var style = state.styles[name] || {};
      var attributes = state.attributes[name] || {};
      var element = state.elements[name];
      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }
      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function(name2) {
        var value = attributes[name2];
        if (value === false) {
          element.removeAttribute(name2);
        } else {
          element.setAttribute(name2, value === true ? "" : value);
        }
      });
    });
  }
  function effect(_ref2) {
    var state = _ref2.state;
    var initialStyles = {
      popper: {
        position: state.options.strategy,
        left: "0",
        top: "0",
        margin: "0"
      },
      arrow: {
        position: "absolute"
      },
      reference: {}
    };
    Object.assign(state.elements.popper.style, initialStyles.popper);
    state.styles = initialStyles;
    if (state.elements.arrow) {
      Object.assign(state.elements.arrow.style, initialStyles.arrow);
    }
    return function() {
      Object.keys(state.elements).forEach(function(name) {
        var element = state.elements[name];
        var attributes = state.attributes[name] || {};
        var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]);
        var style = styleProperties.reduce(function(style2, property) {
          style2[property] = "";
          return style2;
        }, {});
        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        }
        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function(attribute) {
          element.removeAttribute(attribute);
        });
      });
    };
  }
  var applyStyles_default = {
    name: "applyStyles",
    enabled: true,
    phase: "write",
    fn: applyStyles,
    effect,
    requires: ["computeStyles"]
  };

  // node_modules/@popperjs/core/lib/utils/getBasePlacement.js
  function getBasePlacement(placement) {
    return placement.split("-")[0];
  }

  // node_modules/@popperjs/core/lib/utils/math.js
  var max = Math.max;
  var min = Math.min;
  var round = Math.round;

  // node_modules/@popperjs/core/lib/utils/userAgent.js
  function getUAString() {
    var uaData = navigator.userAgentData;
    if (uaData != null && uaData.brands && Array.isArray(uaData.brands)) {
      return uaData.brands.map(function(item) {
        return item.brand + "/" + item.version;
      }).join(" ");
    }
    return navigator.userAgent;
  }

  // node_modules/@popperjs/core/lib/dom-utils/isLayoutViewport.js
  function isLayoutViewport() {
    return !/^((?!chrome|android).)*safari/i.test(getUAString());
  }

  // node_modules/@popperjs/core/lib/dom-utils/getBoundingClientRect.js
  function getBoundingClientRect(element, includeScale, isFixedStrategy) {
    if (includeScale === void 0) {
      includeScale = false;
    }
    if (isFixedStrategy === void 0) {
      isFixedStrategy = false;
    }
    var clientRect = element.getBoundingClientRect();
    var scaleX = 1;
    var scaleY = 1;
    if (includeScale && isHTMLElement(element)) {
      scaleX = element.offsetWidth > 0 ? round(clientRect.width) / element.offsetWidth || 1 : 1;
      scaleY = element.offsetHeight > 0 ? round(clientRect.height) / element.offsetHeight || 1 : 1;
    }
    var _ref = isElement(element) ? getWindow(element) : window, visualViewport = _ref.visualViewport;
    var addVisualOffsets = !isLayoutViewport() && isFixedStrategy;
    var x = (clientRect.left + (addVisualOffsets && visualViewport ? visualViewport.offsetLeft : 0)) / scaleX;
    var y = (clientRect.top + (addVisualOffsets && visualViewport ? visualViewport.offsetTop : 0)) / scaleY;
    var width = clientRect.width / scaleX;
    var height = clientRect.height / scaleY;
    return {
      width,
      height,
      top: y,
      right: x + width,
      bottom: y + height,
      left: x,
      x,
      y
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getLayoutRect.js
  function getLayoutRect(element) {
    var clientRect = getBoundingClientRect(element);
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    if (Math.abs(clientRect.width - width) <= 1) {
      width = clientRect.width;
    }
    if (Math.abs(clientRect.height - height) <= 1) {
      height = clientRect.height;
    }
    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      width,
      height
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/contains.js
  function contains(parent, child) {
    var rootNode = child.getRootNode && child.getRootNode();
    if (parent.contains(child)) {
      return true;
    } else if (rootNode && isShadowRoot(rootNode)) {
      var next = child;
      do {
        if (next && parent.isSameNode(next)) {
          return true;
        }
        next = next.parentNode || next.host;
      } while (next);
    }
    return false;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getComputedStyle.js
  function getComputedStyle2(element) {
    return getWindow(element).getComputedStyle(element);
  }

  // node_modules/@popperjs/core/lib/dom-utils/isTableElement.js
  function isTableElement(element) {
    return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getDocumentElement.js
  function getDocumentElement(element) {
    return ((isElement(element) ? element.ownerDocument : (
      // $FlowFixMe[prop-missing]
      element.document
    )) || window.document).documentElement;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getParentNode.js
  function getParentNode(element) {
    if (getNodeName(element) === "html") {
      return element;
    }
    return (
      // this is a quicker (but less type safe) way to save quite some bytes from the bundle
      // $FlowFixMe[incompatible-return]
      // $FlowFixMe[prop-missing]
      element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
      element.parentNode || // DOM Element detected
      (isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
      // $FlowFixMe[incompatible-call]: HTMLElement is a Node
      getDocumentElement(element)
    );
  }

  // node_modules/@popperjs/core/lib/dom-utils/getOffsetParent.js
  function getTrueOffsetParent(element) {
    if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
    getComputedStyle2(element).position === "fixed") {
      return null;
    }
    return element.offsetParent;
  }
  function getContainingBlock(element) {
    var isFirefox = /firefox/i.test(getUAString());
    var isIE = /Trident/i.test(getUAString());
    if (isIE && isHTMLElement(element)) {
      var elementCss = getComputedStyle2(element);
      if (elementCss.position === "fixed") {
        return null;
      }
    }
    var currentNode = getParentNode(element);
    if (isShadowRoot(currentNode)) {
      currentNode = currentNode.host;
    }
    while (isHTMLElement(currentNode) && ["html", "body"].indexOf(getNodeName(currentNode)) < 0) {
      var css = getComputedStyle2(currentNode);
      if (css.transform !== "none" || css.perspective !== "none" || css.contain === "paint" || ["transform", "perspective"].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === "filter" || isFirefox && css.filter && css.filter !== "none") {
        return currentNode;
      } else {
        currentNode = currentNode.parentNode;
      }
    }
    return null;
  }
  function getOffsetParent(element) {
    var window2 = getWindow(element);
    var offsetParent = getTrueOffsetParent(element);
    while (offsetParent && isTableElement(offsetParent) && getComputedStyle2(offsetParent).position === "static") {
      offsetParent = getTrueOffsetParent(offsetParent);
    }
    if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle2(offsetParent).position === "static")) {
      return window2;
    }
    return offsetParent || getContainingBlock(element) || window2;
  }

  // node_modules/@popperjs/core/lib/utils/getMainAxisFromPlacement.js
  function getMainAxisFromPlacement(placement) {
    return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
  }

  // node_modules/@popperjs/core/lib/utils/within.js
  function within(min2, value, max2) {
    return max(min2, min(value, max2));
  }
  function withinMaxClamp(min2, value, max2) {
    var v = within(min2, value, max2);
    return v > max2 ? max2 : v;
  }

  // node_modules/@popperjs/core/lib/utils/getFreshSideObject.js
  function getFreshSideObject() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }

  // node_modules/@popperjs/core/lib/utils/mergePaddingObject.js
  function mergePaddingObject(paddingObject) {
    return Object.assign({}, getFreshSideObject(), paddingObject);
  }

  // node_modules/@popperjs/core/lib/utils/expandToHashMap.js
  function expandToHashMap(value, keys) {
    return keys.reduce(function(hashMap, key) {
      hashMap[key] = value;
      return hashMap;
    }, {});
  }

  // node_modules/@popperjs/core/lib/modifiers/arrow.js
  var toPaddingObject = function toPaddingObject2(padding, state) {
    padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
      placement: state.placement
    })) : padding;
    return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
  };
  function arrow(_ref) {
    var _state$modifiersData$;
    var state = _ref.state, name = _ref.name, options = _ref.options;
    var arrowElement = state.elements.arrow;
    var popperOffsets2 = state.modifiersData.popperOffsets;
    var basePlacement = getBasePlacement(state.placement);
    var axis = getMainAxisFromPlacement(basePlacement);
    var isVertical = [left, right].indexOf(basePlacement) >= 0;
    var len = isVertical ? "height" : "width";
    if (!arrowElement || !popperOffsets2) {
      return;
    }
    var paddingObject = toPaddingObject(options.padding, state);
    var arrowRect = getLayoutRect(arrowElement);
    var minProp = axis === "y" ? top : left;
    var maxProp = axis === "y" ? bottom : right;
    var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets2[axis] - state.rects.popper[len];
    var startDiff = popperOffsets2[axis] - state.rects.reference[axis];
    var arrowOffsetParent = getOffsetParent(arrowElement);
    var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
    var centerToReference = endDiff / 2 - startDiff / 2;
    var min2 = paddingObject[minProp];
    var max2 = clientSize - arrowRect[len] - paddingObject[maxProp];
    var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
    var offset2 = within(min2, center, max2);
    var axisProp = axis;
    state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset2, _state$modifiersData$.centerOffset = offset2 - center, _state$modifiersData$);
  }
  function effect2(_ref2) {
    var state = _ref2.state, options = _ref2.options;
    var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
    if (arrowElement == null) {
      return;
    }
    if (typeof arrowElement === "string") {
      arrowElement = state.elements.popper.querySelector(arrowElement);
      if (!arrowElement) {
        return;
      }
    }
    if (!contains(state.elements.popper, arrowElement)) {
      return;
    }
    state.elements.arrow = arrowElement;
  }
  var arrow_default = {
    name: "arrow",
    enabled: true,
    phase: "main",
    fn: arrow,
    effect: effect2,
    requires: ["popperOffsets"],
    requiresIfExists: ["preventOverflow"]
  };

  // node_modules/@popperjs/core/lib/utils/getVariation.js
  function getVariation(placement) {
    return placement.split("-")[1];
  }

  // node_modules/@popperjs/core/lib/modifiers/computeStyles.js
  var unsetSides = {
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto"
  };
  function roundOffsetsByDPR(_ref, win) {
    var x = _ref.x, y = _ref.y;
    var dpr = win.devicePixelRatio || 1;
    return {
      x: round(x * dpr) / dpr || 0,
      y: round(y * dpr) / dpr || 0
    };
  }
  function mapToStyles(_ref2) {
    var _Object$assign2;
    var popper2 = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, variation = _ref2.variation, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets, isFixed = _ref2.isFixed;
    var _offsets$x = offsets.x, x = _offsets$x === void 0 ? 0 : _offsets$x, _offsets$y = offsets.y, y = _offsets$y === void 0 ? 0 : _offsets$y;
    var _ref3 = typeof roundOffsets === "function" ? roundOffsets({
      x,
      y
    }) : {
      x,
      y
    };
    x = _ref3.x;
    y = _ref3.y;
    var hasX = offsets.hasOwnProperty("x");
    var hasY = offsets.hasOwnProperty("y");
    var sideX = left;
    var sideY = top;
    var win = window;
    if (adaptive) {
      var offsetParent = getOffsetParent(popper2);
      var heightProp = "clientHeight";
      var widthProp = "clientWidth";
      if (offsetParent === getWindow(popper2)) {
        offsetParent = getDocumentElement(popper2);
        if (getComputedStyle2(offsetParent).position !== "static" && position === "absolute") {
          heightProp = "scrollHeight";
          widthProp = "scrollWidth";
        }
      }
      offsetParent = offsetParent;
      if (placement === top || (placement === left || placement === right) && variation === end) {
        sideY = bottom;
        var offsetY = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.height : (
          // $FlowFixMe[prop-missing]
          offsetParent[heightProp]
        );
        y -= offsetY - popperRect.height;
        y *= gpuAcceleration ? 1 : -1;
      }
      if (placement === left || (placement === top || placement === bottom) && variation === end) {
        sideX = right;
        var offsetX = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.width : (
          // $FlowFixMe[prop-missing]
          offsetParent[widthProp]
        );
        x -= offsetX - popperRect.width;
        x *= gpuAcceleration ? 1 : -1;
      }
    }
    var commonStyles = Object.assign({
      position
    }, adaptive && unsetSides);
    var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
      x,
      y
    }, getWindow(popper2)) : {
      x,
      y
    };
    x = _ref4.x;
    y = _ref4.y;
    if (gpuAcceleration) {
      var _Object$assign;
      return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
    }
    return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : "", _Object$assign2[sideX] = hasX ? x + "px" : "", _Object$assign2.transform = "", _Object$assign2));
  }
  function computeStyles(_ref5) {
    var state = _ref5.state, options = _ref5.options;
    var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
    var commonStyles = {
      placement: getBasePlacement(state.placement),
      variation: getVariation(state.placement),
      popper: state.elements.popper,
      popperRect: state.rects.popper,
      gpuAcceleration,
      isFixed: state.options.strategy === "fixed"
    };
    if (state.modifiersData.popperOffsets != null) {
      state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.popperOffsets,
        position: state.options.strategy,
        adaptive,
        roundOffsets
      })));
    }
    if (state.modifiersData.arrow != null) {
      state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.arrow,
        position: "absolute",
        adaptive: false,
        roundOffsets
      })));
    }
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-placement": state.placement
    });
  }
  var computeStyles_default = {
    name: "computeStyles",
    enabled: true,
    phase: "beforeWrite",
    fn: computeStyles,
    data: {}
  };

  // node_modules/@popperjs/core/lib/modifiers/eventListeners.js
  var passive = {
    passive: true
  };
  function effect3(_ref) {
    var state = _ref.state, instance = _ref.instance, options = _ref.options;
    var _options$scroll = options.scroll, scroll = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
    var window2 = getWindow(state.elements.popper);
    var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
    if (scroll) {
      scrollParents.forEach(function(scrollParent) {
        scrollParent.addEventListener("scroll", instance.update, passive);
      });
    }
    if (resize) {
      window2.addEventListener("resize", instance.update, passive);
    }
    return function() {
      if (scroll) {
        scrollParents.forEach(function(scrollParent) {
          scrollParent.removeEventListener("scroll", instance.update, passive);
        });
      }
      if (resize) {
        window2.removeEventListener("resize", instance.update, passive);
      }
    };
  }
  var eventListeners_default = {
    name: "eventListeners",
    enabled: true,
    phase: "write",
    fn: function fn() {
    },
    effect: effect3,
    data: {}
  };

  // node_modules/@popperjs/core/lib/utils/getOppositePlacement.js
  var hash = {
    left: "right",
    right: "left",
    bottom: "top",
    top: "bottom"
  };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, function(matched) {
      return hash[matched];
    });
  }

  // node_modules/@popperjs/core/lib/utils/getOppositeVariationPlacement.js
  var hash2 = {
    start: "end",
    end: "start"
  };
  function getOppositeVariationPlacement(placement) {
    return placement.replace(/start|end/g, function(matched) {
      return hash2[matched];
    });
  }

  // node_modules/@popperjs/core/lib/dom-utils/getWindowScroll.js
  function getWindowScroll(node) {
    var win = getWindow(node);
    var scrollLeft = win.pageXOffset;
    var scrollTop = win.pageYOffset;
    return {
      scrollLeft,
      scrollTop
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getWindowScrollBarX.js
  function getWindowScrollBarX(element) {
    return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getViewportRect.js
  function getViewportRect(element, strategy) {
    var win = getWindow(element);
    var html = getDocumentElement(element);
    var visualViewport = win.visualViewport;
    var width = html.clientWidth;
    var height = html.clientHeight;
    var x = 0;
    var y = 0;
    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height;
      var layoutViewport = isLayoutViewport();
      if (layoutViewport || !layoutViewport && strategy === "fixed") {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
    return {
      width,
      height,
      x: x + getWindowScrollBarX(element),
      y
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getDocumentRect.js
  function getDocumentRect(element) {
    var _element$ownerDocumen;
    var html = getDocumentElement(element);
    var winScroll = getWindowScroll(element);
    var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
    var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
    var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
    var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
    var y = -winScroll.scrollTop;
    if (getComputedStyle2(body || html).direction === "rtl") {
      x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
    }
    return {
      width,
      height,
      x,
      y
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/isScrollParent.js
  function isScrollParent(element) {
    var _getComputedStyle = getComputedStyle2(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
    return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
  }

  // node_modules/@popperjs/core/lib/dom-utils/getScrollParent.js
  function getScrollParent(node) {
    if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
      return node.ownerDocument.body;
    }
    if (isHTMLElement(node) && isScrollParent(node)) {
      return node;
    }
    return getScrollParent(getParentNode(node));
  }

  // node_modules/@popperjs/core/lib/dom-utils/listScrollParents.js
  function listScrollParents(element, list) {
    var _element$ownerDocumen;
    if (list === void 0) {
      list = [];
    }
    var scrollParent = getScrollParent(element);
    var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
    var win = getWindow(scrollParent);
    var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
    var updatedList = list.concat(target);
    return isBody ? updatedList : (
      // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
      updatedList.concat(listScrollParents(getParentNode(target)))
    );
  }

  // node_modules/@popperjs/core/lib/utils/rectToClientRect.js
  function rectToClientRect(rect) {
    return Object.assign({}, rect, {
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    });
  }

  // node_modules/@popperjs/core/lib/dom-utils/getClippingRect.js
  function getInnerBoundingClientRect(element, strategy) {
    var rect = getBoundingClientRect(element, false, strategy === "fixed");
    rect.top = rect.top + element.clientTop;
    rect.left = rect.left + element.clientLeft;
    rect.bottom = rect.top + element.clientHeight;
    rect.right = rect.left + element.clientWidth;
    rect.width = element.clientWidth;
    rect.height = element.clientHeight;
    rect.x = rect.left;
    rect.y = rect.top;
    return rect;
  }
  function getClientRectFromMixedType(element, clippingParent, strategy) {
    return clippingParent === viewport ? rectToClientRect(getViewportRect(element, strategy)) : isElement(clippingParent) ? getInnerBoundingClientRect(clippingParent, strategy) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
  }
  function getClippingParents(element) {
    var clippingParents2 = listScrollParents(getParentNode(element));
    var canEscapeClipping = ["absolute", "fixed"].indexOf(getComputedStyle2(element).position) >= 0;
    var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
    if (!isElement(clipperElement)) {
      return [];
    }
    return clippingParents2.filter(function(clippingParent) {
      return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== "body";
    });
  }
  function getClippingRect(element, boundary, rootBoundary, strategy) {
    var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
    var clippingParents2 = [].concat(mainClippingParents, [rootBoundary]);
    var firstClippingParent = clippingParents2[0];
    var clippingRect = clippingParents2.reduce(function(accRect, clippingParent) {
      var rect = getClientRectFromMixedType(element, clippingParent, strategy);
      accRect.top = max(rect.top, accRect.top);
      accRect.right = min(rect.right, accRect.right);
      accRect.bottom = min(rect.bottom, accRect.bottom);
      accRect.left = max(rect.left, accRect.left);
      return accRect;
    }, getClientRectFromMixedType(element, firstClippingParent, strategy));
    clippingRect.width = clippingRect.right - clippingRect.left;
    clippingRect.height = clippingRect.bottom - clippingRect.top;
    clippingRect.x = clippingRect.left;
    clippingRect.y = clippingRect.top;
    return clippingRect;
  }

  // node_modules/@popperjs/core/lib/utils/computeOffsets.js
  function computeOffsets(_ref) {
    var reference2 = _ref.reference, element = _ref.element, placement = _ref.placement;
    var basePlacement = placement ? getBasePlacement(placement) : null;
    var variation = placement ? getVariation(placement) : null;
    var commonX = reference2.x + reference2.width / 2 - element.width / 2;
    var commonY = reference2.y + reference2.height / 2 - element.height / 2;
    var offsets;
    switch (basePlacement) {
      case top:
        offsets = {
          x: commonX,
          y: reference2.y - element.height
        };
        break;
      case bottom:
        offsets = {
          x: commonX,
          y: reference2.y + reference2.height
        };
        break;
      case right:
        offsets = {
          x: reference2.x + reference2.width,
          y: commonY
        };
        break;
      case left:
        offsets = {
          x: reference2.x - element.width,
          y: commonY
        };
        break;
      default:
        offsets = {
          x: reference2.x,
          y: reference2.y
        };
    }
    var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
    if (mainAxis != null) {
      var len = mainAxis === "y" ? "height" : "width";
      switch (variation) {
        case start2:
          offsets[mainAxis] = offsets[mainAxis] - (reference2[len] / 2 - element[len] / 2);
          break;
        case end:
          offsets[mainAxis] = offsets[mainAxis] + (reference2[len] / 2 - element[len] / 2);
          break;
        default:
      }
    }
    return offsets;
  }

  // node_modules/@popperjs/core/lib/utils/detectOverflow.js
  function detectOverflow(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$strategy = _options.strategy, strategy = _options$strategy === void 0 ? state.strategy : _options$strategy, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
    var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
    var altContext = elementContext === popper ? reference : popper;
    var popperRect = state.rects.popper;
    var element = state.elements[altBoundary ? altContext : elementContext];
    var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary, strategy);
    var referenceClientRect = getBoundingClientRect(state.elements.reference);
    var popperOffsets2 = computeOffsets({
      reference: referenceClientRect,
      element: popperRect,
      strategy: "absolute",
      placement
    });
    var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets2));
    var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
    var overflowOffsets = {
      top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
      bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
      left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
      right: elementClientRect.right - clippingClientRect.right + paddingObject.right
    };
    var offsetData = state.modifiersData.offset;
    if (elementContext === popper && offsetData) {
      var offset2 = offsetData[placement];
      Object.keys(overflowOffsets).forEach(function(key) {
        var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
        var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
        overflowOffsets[key] += offset2[axis] * multiply;
      });
    }
    return overflowOffsets;
  }

  // node_modules/@popperjs/core/lib/utils/computeAutoPlacement.js
  function computeAutoPlacement(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
    var variation = getVariation(placement);
    var placements2 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement2) {
      return getVariation(placement2) === variation;
    }) : basePlacements;
    var allowedPlacements = placements2.filter(function(placement2) {
      return allowedAutoPlacements.indexOf(placement2) >= 0;
    });
    if (allowedPlacements.length === 0) {
      allowedPlacements = placements2;
    }
    var overflows = allowedPlacements.reduce(function(acc, placement2) {
      acc[placement2] = detectOverflow(state, {
        placement: placement2,
        boundary,
        rootBoundary,
        padding
      })[getBasePlacement(placement2)];
      return acc;
    }, {});
    return Object.keys(overflows).sort(function(a, b) {
      return overflows[a] - overflows[b];
    });
  }

  // node_modules/@popperjs/core/lib/modifiers/flip.js
  function getExpandedFallbackPlacements(placement) {
    if (getBasePlacement(placement) === auto) {
      return [];
    }
    var oppositePlacement = getOppositePlacement(placement);
    return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
  }
  function flip(_ref) {
    var state = _ref.state, options = _ref.options, name = _ref.name;
    if (state.modifiersData[name]._skip) {
      return;
    }
    var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
    var preferredPlacement = state.options.placement;
    var basePlacement = getBasePlacement(preferredPlacement);
    var isBasePlacement = basePlacement === preferredPlacement;
    var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
    var placements2 = [preferredPlacement].concat(fallbackPlacements).reduce(function(acc, placement2) {
      return acc.concat(getBasePlacement(placement2) === auto ? computeAutoPlacement(state, {
        placement: placement2,
        boundary,
        rootBoundary,
        padding,
        flipVariations,
        allowedAutoPlacements
      }) : placement2);
    }, []);
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var checksMap = /* @__PURE__ */ new Map();
    var makeFallbackChecks = true;
    var firstFittingPlacement = placements2[0];
    for (var i = 0; i < placements2.length; i++) {
      var placement = placements2[i];
      var _basePlacement = getBasePlacement(placement);
      var isStartVariation = getVariation(placement) === start2;
      var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
      var len = isVertical ? "width" : "height";
      var overflow = detectOverflow(state, {
        placement,
        boundary,
        rootBoundary,
        altBoundary,
        padding
      });
      var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;
      if (referenceRect[len] > popperRect[len]) {
        mainVariationSide = getOppositePlacement(mainVariationSide);
      }
      var altVariationSide = getOppositePlacement(mainVariationSide);
      var checks = [];
      if (checkMainAxis) {
        checks.push(overflow[_basePlacement] <= 0);
      }
      if (checkAltAxis) {
        checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
      }
      if (checks.every(function(check) {
        return check;
      })) {
        firstFittingPlacement = placement;
        makeFallbackChecks = false;
        break;
      }
      checksMap.set(placement, checks);
    }
    if (makeFallbackChecks) {
      var numberOfChecks = flipVariations ? 3 : 1;
      var _loop = function _loop2(_i2) {
        var fittingPlacement = placements2.find(function(placement2) {
          var checks2 = checksMap.get(placement2);
          if (checks2) {
            return checks2.slice(0, _i2).every(function(check) {
              return check;
            });
          }
        });
        if (fittingPlacement) {
          firstFittingPlacement = fittingPlacement;
          return "break";
        }
      };
      for (var _i = numberOfChecks; _i > 0; _i--) {
        var _ret = _loop(_i);
        if (_ret === "break") break;
      }
    }
    if (state.placement !== firstFittingPlacement) {
      state.modifiersData[name]._skip = true;
      state.placement = firstFittingPlacement;
      state.reset = true;
    }
  }
  var flip_default = {
    name: "flip",
    enabled: true,
    phase: "main",
    fn: flip,
    requiresIfExists: ["offset"],
    data: {
      _skip: false
    }
  };

  // node_modules/@popperjs/core/lib/modifiers/hide.js
  function getSideOffsets(overflow, rect, preventedOffsets) {
    if (preventedOffsets === void 0) {
      preventedOffsets = {
        x: 0,
        y: 0
      };
    }
    return {
      top: overflow.top - rect.height - preventedOffsets.y,
      right: overflow.right - rect.width + preventedOffsets.x,
      bottom: overflow.bottom - rect.height + preventedOffsets.y,
      left: overflow.left - rect.width - preventedOffsets.x
    };
  }
  function isAnySideFullyClipped(overflow) {
    return [top, right, bottom, left].some(function(side) {
      return overflow[side] >= 0;
    });
  }
  function hide(_ref) {
    var state = _ref.state, name = _ref.name;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var preventedOffsets = state.modifiersData.preventOverflow;
    var referenceOverflow = detectOverflow(state, {
      elementContext: "reference"
    });
    var popperAltOverflow = detectOverflow(state, {
      altBoundary: true
    });
    var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
    var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
    var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
    var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
    state.modifiersData[name] = {
      referenceClippingOffsets,
      popperEscapeOffsets,
      isReferenceHidden,
      hasPopperEscaped
    };
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-reference-hidden": isReferenceHidden,
      "data-popper-escaped": hasPopperEscaped
    });
  }
  var hide_default = {
    name: "hide",
    enabled: true,
    phase: "main",
    requiresIfExists: ["preventOverflow"],
    fn: hide
  };

  // node_modules/@popperjs/core/lib/modifiers/offset.js
  function distanceAndSkiddingToXY(placement, rects, offset2) {
    var basePlacement = getBasePlacement(placement);
    var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;
    var _ref = typeof offset2 === "function" ? offset2(Object.assign({}, rects, {
      placement
    })) : offset2, skidding = _ref[0], distance = _ref[1];
    skidding = skidding || 0;
    distance = (distance || 0) * invertDistance;
    return [left, right].indexOf(basePlacement) >= 0 ? {
      x: distance,
      y: skidding
    } : {
      x: skidding,
      y: distance
    };
  }
  function offset(_ref2) {
    var state = _ref2.state, options = _ref2.options, name = _ref2.name;
    var _options$offset = options.offset, offset2 = _options$offset === void 0 ? [0, 0] : _options$offset;
    var data = placements.reduce(function(acc, placement) {
      acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset2);
      return acc;
    }, {});
    var _data$state$placement = data[state.placement], x = _data$state$placement.x, y = _data$state$placement.y;
    if (state.modifiersData.popperOffsets != null) {
      state.modifiersData.popperOffsets.x += x;
      state.modifiersData.popperOffsets.y += y;
    }
    state.modifiersData[name] = data;
  }
  var offset_default = {
    name: "offset",
    enabled: true,
    phase: "main",
    requires: ["popperOffsets"],
    fn: offset
  };

  // node_modules/@popperjs/core/lib/modifiers/popperOffsets.js
  function popperOffsets(_ref) {
    var state = _ref.state, name = _ref.name;
    state.modifiersData[name] = computeOffsets({
      reference: state.rects.reference,
      element: state.rects.popper,
      strategy: "absolute",
      placement: state.placement
    });
  }
  var popperOffsets_default = {
    name: "popperOffsets",
    enabled: true,
    phase: "read",
    fn: popperOffsets,
    data: {}
  };

  // node_modules/@popperjs/core/lib/utils/getAltAxis.js
  function getAltAxis(axis) {
    return axis === "x" ? "y" : "x";
  }

  // node_modules/@popperjs/core/lib/modifiers/preventOverflow.js
  function preventOverflow(_ref) {
    var state = _ref.state, options = _ref.options, name = _ref.name;
    var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
    var overflow = detectOverflow(state, {
      boundary,
      rootBoundary,
      padding,
      altBoundary
    });
    var basePlacement = getBasePlacement(state.placement);
    var variation = getVariation(state.placement);
    var isBasePlacement = !variation;
    var mainAxis = getMainAxisFromPlacement(basePlacement);
    var altAxis = getAltAxis(mainAxis);
    var popperOffsets2 = state.modifiersData.popperOffsets;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
      placement: state.placement
    })) : tetherOffset;
    var normalizedTetherOffsetValue = typeof tetherOffsetValue === "number" ? {
      mainAxis: tetherOffsetValue,
      altAxis: tetherOffsetValue
    } : Object.assign({
      mainAxis: 0,
      altAxis: 0
    }, tetherOffsetValue);
    var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
    var data = {
      x: 0,
      y: 0
    };
    if (!popperOffsets2) {
      return;
    }
    if (checkMainAxis) {
      var _offsetModifierState$;
      var mainSide = mainAxis === "y" ? top : left;
      var altSide = mainAxis === "y" ? bottom : right;
      var len = mainAxis === "y" ? "height" : "width";
      var offset2 = popperOffsets2[mainAxis];
      var min2 = offset2 + overflow[mainSide];
      var max2 = offset2 - overflow[altSide];
      var additive = tether ? -popperRect[len] / 2 : 0;
      var minLen = variation === start2 ? referenceRect[len] : popperRect[len];
      var maxLen = variation === start2 ? -popperRect[len] : -referenceRect[len];
      var arrowElement = state.elements.arrow;
      var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
        width: 0,
        height: 0
      };
      var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
      var arrowPaddingMin = arrowPaddingObject[mainSide];
      var arrowPaddingMax = arrowPaddingObject[altSide];
      var arrowLen = within(0, referenceRect[len], arrowRect[len]);
      var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
      var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
      var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
      var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
      var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
      var tetherMin = offset2 + minOffset - offsetModifierValue - clientOffset;
      var tetherMax = offset2 + maxOffset - offsetModifierValue;
      var preventedOffset = within(tether ? min(min2, tetherMin) : min2, offset2, tether ? max(max2, tetherMax) : max2);
      popperOffsets2[mainAxis] = preventedOffset;
      data[mainAxis] = preventedOffset - offset2;
    }
    if (checkAltAxis) {
      var _offsetModifierState$2;
      var _mainSide = mainAxis === "x" ? top : left;
      var _altSide = mainAxis === "x" ? bottom : right;
      var _offset = popperOffsets2[altAxis];
      var _len = altAxis === "y" ? "height" : "width";
      var _min = _offset + overflow[_mainSide];
      var _max = _offset - overflow[_altSide];
      var isOriginSide = [top, left].indexOf(basePlacement) !== -1;
      var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;
      var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;
      var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;
      var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);
      popperOffsets2[altAxis] = _preventedOffset;
      data[altAxis] = _preventedOffset - _offset;
    }
    state.modifiersData[name] = data;
  }
  var preventOverflow_default = {
    name: "preventOverflow",
    enabled: true,
    phase: "main",
    fn: preventOverflow,
    requiresIfExists: ["offset"]
  };

  // node_modules/@popperjs/core/lib/dom-utils/getHTMLElementScroll.js
  function getHTMLElementScroll(element) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getNodeScroll.js
  function getNodeScroll(node) {
    if (node === getWindow(node) || !isHTMLElement(node)) {
      return getWindowScroll(node);
    } else {
      return getHTMLElementScroll(node);
    }
  }

  // node_modules/@popperjs/core/lib/dom-utils/getCompositeRect.js
  function isElementScaled(element) {
    var rect = element.getBoundingClientRect();
    var scaleX = round(rect.width) / element.offsetWidth || 1;
    var scaleY = round(rect.height) / element.offsetHeight || 1;
    return scaleX !== 1 || scaleY !== 1;
  }
  function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
    if (isFixed === void 0) {
      isFixed = false;
    }
    var isOffsetParentAnElement = isHTMLElement(offsetParent);
    var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
    var documentElement = getDocumentElement(offsetParent);
    var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled, isFixed);
    var scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    var offsets = {
      x: 0,
      y: 0
    };
    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
      if (getNodeName(offsetParent) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
      isScrollParent(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        offsets = getBoundingClientRect(offsetParent, true);
        offsets.x += offsetParent.clientLeft;
        offsets.y += offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }
    return {
      x: rect.left + scroll.scrollLeft - offsets.x,
      y: rect.top + scroll.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height
    };
  }

  // node_modules/@popperjs/core/lib/utils/orderModifiers.js
  function order(modifiers) {
    var map = /* @__PURE__ */ new Map();
    var visited = /* @__PURE__ */ new Set();
    var result = [];
    modifiers.forEach(function(modifier) {
      map.set(modifier.name, modifier);
    });
    function sort(modifier) {
      visited.add(modifier.name);
      var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
      requires.forEach(function(dep) {
        if (!visited.has(dep)) {
          var depModifier = map.get(dep);
          if (depModifier) {
            sort(depModifier);
          }
        }
      });
      result.push(modifier);
    }
    modifiers.forEach(function(modifier) {
      if (!visited.has(modifier.name)) {
        sort(modifier);
      }
    });
    return result;
  }
  function orderModifiers(modifiers) {
    var orderedModifiers = order(modifiers);
    return modifierPhases.reduce(function(acc, phase) {
      return acc.concat(orderedModifiers.filter(function(modifier) {
        return modifier.phase === phase;
      }));
    }, []);
  }

  // node_modules/@popperjs/core/lib/utils/debounce.js
  function debounce2(fn2) {
    var pending;
    return function() {
      if (!pending) {
        pending = new Promise(function(resolve) {
          Promise.resolve().then(function() {
            pending = void 0;
            resolve(fn2());
          });
        });
      }
      return pending;
    };
  }

  // node_modules/@popperjs/core/lib/utils/mergeByName.js
  function mergeByName(modifiers) {
    var merged = modifiers.reduce(function(merged2, current) {
      var existing = merged2[current.name];
      merged2[current.name] = existing ? Object.assign({}, existing, current, {
        options: Object.assign({}, existing.options, current.options),
        data: Object.assign({}, existing.data, current.data)
      }) : current;
      return merged2;
    }, {});
    return Object.keys(merged).map(function(key) {
      return merged[key];
    });
  }

  // node_modules/@popperjs/core/lib/createPopper.js
  var DEFAULT_OPTIONS = {
    placement: "bottom",
    modifiers: [],
    strategy: "absolute"
  };
  function areValidElements() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return !args.some(function(element) {
      return !(element && typeof element.getBoundingClientRect === "function");
    });
  }
  function popperGenerator(generatorOptions) {
    if (generatorOptions === void 0) {
      generatorOptions = {};
    }
    var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers3 = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions2 = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
    return function createPopper4(reference2, popper2, options) {
      if (options === void 0) {
        options = defaultOptions2;
      }
      var state = {
        placement: "bottom",
        orderedModifiers: [],
        options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions2),
        modifiersData: {},
        elements: {
          reference: reference2,
          popper: popper2
        },
        attributes: {},
        styles: {}
      };
      var effectCleanupFns = [];
      var isDestroyed = false;
      var instance = {
        state,
        setOptions: function setOptions(setOptionsAction) {
          var options2 = typeof setOptionsAction === "function" ? setOptionsAction(state.options) : setOptionsAction;
          cleanupModifierEffects();
          state.options = Object.assign({}, defaultOptions2, state.options, options2);
          state.scrollParents = {
            reference: isElement(reference2) ? listScrollParents(reference2) : reference2.contextElement ? listScrollParents(reference2.contextElement) : [],
            popper: listScrollParents(popper2)
          };
          var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers3, state.options.modifiers)));
          state.orderedModifiers = orderedModifiers.filter(function(m) {
            return m.enabled;
          });
          runModifierEffects();
          return instance.update();
        },
        // Sync update – it will always be executed, even if not necessary. This
        // is useful for low frequency updates where sync behavior simplifies the
        // logic.
        // For high frequency updates (e.g. `resize` and `scroll` events), always
        // prefer the async Popper#update method
        forceUpdate: function forceUpdate() {
          if (isDestroyed) {
            return;
          }
          var _state$elements = state.elements, reference3 = _state$elements.reference, popper3 = _state$elements.popper;
          if (!areValidElements(reference3, popper3)) {
            return;
          }
          state.rects = {
            reference: getCompositeRect(reference3, getOffsetParent(popper3), state.options.strategy === "fixed"),
            popper: getLayoutRect(popper3)
          };
          state.reset = false;
          state.placement = state.options.placement;
          state.orderedModifiers.forEach(function(modifier) {
            return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
          });
          for (var index = 0; index < state.orderedModifiers.length; index++) {
            if (state.reset === true) {
              state.reset = false;
              index = -1;
              continue;
            }
            var _state$orderedModifie = state.orderedModifiers[index], fn2 = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
            if (typeof fn2 === "function") {
              state = fn2({
                state,
                options: _options,
                name,
                instance
              }) || state;
            }
          }
        },
        // Async and optimistically optimized update – it will not be executed if
        // not necessary (debounced to run at most once-per-tick)
        update: debounce2(function() {
          return new Promise(function(resolve) {
            instance.forceUpdate();
            resolve(state);
          });
        }),
        destroy: function destroy() {
          cleanupModifierEffects();
          isDestroyed = true;
        }
      };
      if (!areValidElements(reference2, popper2)) {
        return instance;
      }
      instance.setOptions(options).then(function(state2) {
        if (!isDestroyed && options.onFirstUpdate) {
          options.onFirstUpdate(state2);
        }
      });
      function runModifierEffects() {
        state.orderedModifiers.forEach(function(_ref) {
          var name = _ref.name, _ref$options = _ref.options, options2 = _ref$options === void 0 ? {} : _ref$options, effect4 = _ref.effect;
          if (typeof effect4 === "function") {
            var cleanupFn = effect4({
              state,
              name,
              instance,
              options: options2
            });
            var noopFn = function noopFn2() {
            };
            effectCleanupFns.push(cleanupFn || noopFn);
          }
        });
      }
      function cleanupModifierEffects() {
        effectCleanupFns.forEach(function(fn2) {
          return fn2();
        });
        effectCleanupFns = [];
      }
      return instance;
    };
  }
  var createPopper = /* @__PURE__ */ popperGenerator();

  // node_modules/@popperjs/core/lib/popper-lite.js
  var defaultModifiers = [eventListeners_default, popperOffsets_default, computeStyles_default, applyStyles_default];
  var createPopper2 = /* @__PURE__ */ popperGenerator({
    defaultModifiers
  });

  // node_modules/@popperjs/core/lib/popper.js
  var defaultModifiers2 = [eventListeners_default, popperOffsets_default, computeStyles_default, applyStyles_default, offset_default, flip_default, preventOverflow_default, arrow_default, hide_default];
  var createPopper3 = /* @__PURE__ */ popperGenerator({
    defaultModifiers: defaultModifiers2
  });

  // node_modules/bootstrap/dist/js/bootstrap.esm.js
  var elementMap = /* @__PURE__ */ new Map();
  var Data = {
    set(element, key, instance) {
      if (!elementMap.has(element)) {
        elementMap.set(element, /* @__PURE__ */ new Map());
      }
      const instanceMap = elementMap.get(element);
      if (!instanceMap.has(key) && instanceMap.size !== 0) {
        console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(instanceMap.keys())[0]}.`);
        return;
      }
      instanceMap.set(key, instance);
    },
    get(element, key) {
      if (elementMap.has(element)) {
        return elementMap.get(element).get(key) || null;
      }
      return null;
    },
    remove(element, key) {
      if (!elementMap.has(element)) {
        return;
      }
      const instanceMap = elementMap.get(element);
      instanceMap.delete(key);
      if (instanceMap.size === 0) {
        elementMap.delete(element);
      }
    }
  };
  var MAX_UID = 1e6;
  var MILLISECONDS_MULTIPLIER = 1e3;
  var TRANSITION_END = "transitionend";
  var parseSelector = (selector) => {
    if (selector && window.CSS && window.CSS.escape) {
      selector = selector.replace(/#([^\s"#']+)/g, (match, id) => `#${CSS.escape(id)}`);
    }
    return selector;
  };
  var toType = (object) => {
    if (object === null || object === void 0) {
      return `${object}`;
    }
    return Object.prototype.toString.call(object).match(/\s([a-z]+)/i)[1].toLowerCase();
  };
  var getUID = (prefix) => {
    do {
      prefix += Math.floor(Math.random() * MAX_UID);
    } while (document.getElementById(prefix));
    return prefix;
  };
  var getTransitionDurationFromElement = (element) => {
    if (!element) {
      return 0;
    }
    let {
      transitionDuration,
      transitionDelay
    } = window.getComputedStyle(element);
    const floatTransitionDuration = Number.parseFloat(transitionDuration);
    const floatTransitionDelay = Number.parseFloat(transitionDelay);
    if (!floatTransitionDuration && !floatTransitionDelay) {
      return 0;
    }
    transitionDuration = transitionDuration.split(",")[0];
    transitionDelay = transitionDelay.split(",")[0];
    return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER;
  };
  var triggerTransitionEnd = (element) => {
    element.dispatchEvent(new Event(TRANSITION_END));
  };
  var isElement2 = (object) => {
    if (!object || typeof object !== "object") {
      return false;
    }
    if (typeof object.jquery !== "undefined") {
      object = object[0];
    }
    return typeof object.nodeType !== "undefined";
  };
  var getElement = (object) => {
    if (isElement2(object)) {
      return object.jquery ? object[0] : object;
    }
    if (typeof object === "string" && object.length > 0) {
      return document.querySelector(parseSelector(object));
    }
    return null;
  };
  var isVisible = (element) => {
    if (!isElement2(element) || element.getClientRects().length === 0) {
      return false;
    }
    const elementIsVisible = getComputedStyle(element).getPropertyValue("visibility") === "visible";
    const closedDetails = element.closest("details:not([open])");
    if (!closedDetails) {
      return elementIsVisible;
    }
    if (closedDetails !== element) {
      const summary = element.closest("summary");
      if (summary && summary.parentNode !== closedDetails) {
        return false;
      }
      if (summary === null) {
        return false;
      }
    }
    return elementIsVisible;
  };
  var isDisabled = (element) => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }
    if (element.classList.contains("disabled")) {
      return true;
    }
    if (typeof element.disabled !== "undefined") {
      return element.disabled;
    }
    return element.hasAttribute("disabled") && element.getAttribute("disabled") !== "false";
  };
  var findShadowRoot = (element) => {
    if (!document.documentElement.attachShadow) {
      return null;
    }
    if (typeof element.getRootNode === "function") {
      const root = element.getRootNode();
      return root instanceof ShadowRoot ? root : null;
    }
    if (element instanceof ShadowRoot) {
      return element;
    }
    if (!element.parentNode) {
      return null;
    }
    return findShadowRoot(element.parentNode);
  };
  var noop = () => {
  };
  var reflow = (element) => {
    element.offsetHeight;
  };
  var getjQuery = () => {
    if (window.jQuery && !document.body.hasAttribute("data-bs-no-jquery")) {
      return window.jQuery;
    }
    return null;
  };
  var DOMContentLoadedCallbacks = [];
  var onDOMContentLoaded = (callback) => {
    if (document.readyState === "loading") {
      if (!DOMContentLoadedCallbacks.length) {
        document.addEventListener("DOMContentLoaded", () => {
          for (const callback2 of DOMContentLoadedCallbacks) {
            callback2();
          }
        });
      }
      DOMContentLoadedCallbacks.push(callback);
    } else {
      callback();
    }
  };
  var isRTL = () => document.documentElement.dir === "rtl";
  var defineJQueryPlugin = (plugin15) => {
    onDOMContentLoaded(() => {
      const $ = getjQuery();
      if ($) {
        const name = plugin15.NAME;
        const JQUERY_NO_CONFLICT = $.fn[name];
        $.fn[name] = plugin15.jQueryInterface;
        $.fn[name].Constructor = plugin15;
        $.fn[name].noConflict = () => {
          $.fn[name] = JQUERY_NO_CONFLICT;
          return plugin15.jQueryInterface;
        };
      }
    });
  };
  var execute = (possibleCallback, args = [], defaultValue = possibleCallback) => {
    return typeof possibleCallback === "function" ? possibleCallback.call(...args) : defaultValue;
  };
  var executeAfterTransition = (callback, transitionElement, waitForTransition = true) => {
    if (!waitForTransition) {
      execute(callback);
      return;
    }
    const durationPadding = 5;
    const emulatedDuration = getTransitionDurationFromElement(transitionElement) + durationPadding;
    let called = false;
    const handler = ({
      target
    }) => {
      if (target !== transitionElement) {
        return;
      }
      called = true;
      transitionElement.removeEventListener(TRANSITION_END, handler);
      execute(callback);
    };
    transitionElement.addEventListener(TRANSITION_END, handler);
    setTimeout(() => {
      if (!called) {
        triggerTransitionEnd(transitionElement);
      }
    }, emulatedDuration);
  };
  var getNextActiveElement = (list, activeElement, shouldGetNext, isCycleAllowed) => {
    const listLength = list.length;
    let index = list.indexOf(activeElement);
    if (index === -1) {
      return !shouldGetNext && isCycleAllowed ? list[listLength - 1] : list[0];
    }
    index += shouldGetNext ? 1 : -1;
    if (isCycleAllowed) {
      index = (index + listLength) % listLength;
    }
    return list[Math.max(0, Math.min(index, listLength - 1))];
  };
  var namespaceRegex = /[^.]*(?=\..*)\.|.*/;
  var stripNameRegex = /\..*/;
  var stripUidRegex = /::\d+$/;
  var eventRegistry = {};
  var uidEvent = 1;
  var customEvents = {
    mouseenter: "mouseover",
    mouseleave: "mouseout"
  };
  var nativeEvents = /* @__PURE__ */ new Set(["click", "dblclick", "mouseup", "mousedown", "contextmenu", "mousewheel", "DOMMouseScroll", "mouseover", "mouseout", "mousemove", "selectstart", "selectend", "keydown", "keypress", "keyup", "orientationchange", "touchstart", "touchmove", "touchend", "touchcancel", "pointerdown", "pointermove", "pointerup", "pointerleave", "pointercancel", "gesturestart", "gesturechange", "gestureend", "focus", "blur", "change", "reset", "select", "submit", "focusin", "focusout", "load", "unload", "beforeunload", "resize", "move", "DOMContentLoaded", "readystatechange", "error", "abort", "scroll"]);
  function makeEventUid(element, uid) {
    return uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++;
  }
  function getElementEvents(element) {
    const uid = makeEventUid(element);
    element.uidEvent = uid;
    eventRegistry[uid] = eventRegistry[uid] || {};
    return eventRegistry[uid];
  }
  function bootstrapHandler(element, fn2) {
    return function handler(event) {
      hydrateObj(event, {
        delegateTarget: element
      });
      if (handler.oneOff) {
        EventHandler.off(element, event.type, fn2);
      }
      return fn2.apply(element, [event]);
    };
  }
  function bootstrapDelegationHandler(element, selector, fn2) {
    return function handler(event) {
      const domElements = element.querySelectorAll(selector);
      for (let {
        target
      } = event; target && target !== this; target = target.parentNode) {
        for (const domElement of domElements) {
          if (domElement !== target) {
            continue;
          }
          hydrateObj(event, {
            delegateTarget: target
          });
          if (handler.oneOff) {
            EventHandler.off(element, event.type, selector, fn2);
          }
          return fn2.apply(target, [event]);
        }
      }
    };
  }
  function findHandler(events, callable, delegationSelector = null) {
    return Object.values(events).find((event) => event.callable === callable && event.delegationSelector === delegationSelector);
  }
  function normalizeParameters(originalTypeEvent, handler, delegationFunction) {
    const isDelegated = typeof handler === "string";
    const callable = isDelegated ? delegationFunction : handler || delegationFunction;
    let typeEvent = getTypeEvent(originalTypeEvent);
    if (!nativeEvents.has(typeEvent)) {
      typeEvent = originalTypeEvent;
    }
    return [isDelegated, callable, typeEvent];
  }
  function addHandler(element, originalTypeEvent, handler, delegationFunction, oneOff) {
    if (typeof originalTypeEvent !== "string" || !element) {
      return;
    }
    let [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
    if (originalTypeEvent in customEvents) {
      const wrapFunction = (fn3) => {
        return function(event) {
          if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
            return fn3.call(this, event);
          }
        };
      };
      callable = wrapFunction(callable);
    }
    const events = getElementEvents(element);
    const handlers = events[typeEvent] || (events[typeEvent] = {});
    const previousFunction = findHandler(handlers, callable, isDelegated ? handler : null);
    if (previousFunction) {
      previousFunction.oneOff = previousFunction.oneOff && oneOff;
      return;
    }
    const uid = makeEventUid(callable, originalTypeEvent.replace(namespaceRegex, ""));
    const fn2 = isDelegated ? bootstrapDelegationHandler(element, handler, callable) : bootstrapHandler(element, callable);
    fn2.delegationSelector = isDelegated ? handler : null;
    fn2.callable = callable;
    fn2.oneOff = oneOff;
    fn2.uidEvent = uid;
    handlers[uid] = fn2;
    element.addEventListener(typeEvent, fn2, isDelegated);
  }
  function removeHandler(element, events, typeEvent, handler, delegationSelector) {
    const fn2 = findHandler(events[typeEvent], handler, delegationSelector);
    if (!fn2) {
      return;
    }
    element.removeEventListener(typeEvent, fn2, Boolean(delegationSelector));
    delete events[typeEvent][fn2.uidEvent];
  }
  function removeNamespacedHandlers(element, events, typeEvent, namespace) {
    const storeElementEvent = events[typeEvent] || {};
    for (const [handlerKey, event] of Object.entries(storeElementEvent)) {
      if (handlerKey.includes(namespace)) {
        removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
      }
    }
  }
  function getTypeEvent(event) {
    event = event.replace(stripNameRegex, "");
    return customEvents[event] || event;
  }
  var EventHandler = {
    on(element, event, handler, delegationFunction) {
      addHandler(element, event, handler, delegationFunction, false);
    },
    one(element, event, handler, delegationFunction) {
      addHandler(element, event, handler, delegationFunction, true);
    },
    off(element, originalTypeEvent, handler, delegationFunction) {
      if (typeof originalTypeEvent !== "string" || !element) {
        return;
      }
      const [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
      const inNamespace = typeEvent !== originalTypeEvent;
      const events = getElementEvents(element);
      const storeElementEvent = events[typeEvent] || {};
      const isNamespace = originalTypeEvent.startsWith(".");
      if (typeof callable !== "undefined") {
        if (!Object.keys(storeElementEvent).length) {
          return;
        }
        removeHandler(element, events, typeEvent, callable, isDelegated ? handler : null);
        return;
      }
      if (isNamespace) {
        for (const elementEvent of Object.keys(events)) {
          removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
        }
      }
      for (const [keyHandlers, event] of Object.entries(storeElementEvent)) {
        const handlerKey = keyHandlers.replace(stripUidRegex, "");
        if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
          removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
        }
      }
    },
    trigger(element, event, args) {
      if (typeof event !== "string" || !element) {
        return null;
      }
      const $ = getjQuery();
      const typeEvent = getTypeEvent(event);
      const inNamespace = event !== typeEvent;
      let jQueryEvent = null;
      let bubbles = true;
      let nativeDispatch = true;
      let defaultPrevented = false;
      if (inNamespace && $) {
        jQueryEvent = $.Event(event, args);
        $(element).trigger(jQueryEvent);
        bubbles = !jQueryEvent.isPropagationStopped();
        nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
        defaultPrevented = jQueryEvent.isDefaultPrevented();
      }
      const evt = hydrateObj(new Event(event, {
        bubbles,
        cancelable: true
      }), args);
      if (defaultPrevented) {
        evt.preventDefault();
      }
      if (nativeDispatch) {
        element.dispatchEvent(evt);
      }
      if (evt.defaultPrevented && jQueryEvent) {
        jQueryEvent.preventDefault();
      }
      return evt;
    }
  };
  function hydrateObj(obj, meta = {}) {
    for (const [key, value] of Object.entries(meta)) {
      try {
        obj[key] = value;
      } catch (_unused) {
        Object.defineProperty(obj, key, {
          configurable: true,
          get() {
            return value;
          }
        });
      }
    }
    return obj;
  }
  function normalizeData(value) {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    if (value === Number(value).toString()) {
      return Number(value);
    }
    if (value === "" || value === "null") {
      return null;
    }
    if (typeof value !== "string") {
      return value;
    }
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch (_unused) {
      return value;
    }
  }
  function normalizeDataKey(key) {
    return key.replace(/[A-Z]/g, (chr) => `-${chr.toLowerCase()}`);
  }
  var Manipulator = {
    setDataAttribute(element, key, value) {
      element.setAttribute(`data-bs-${normalizeDataKey(key)}`, value);
    },
    removeDataAttribute(element, key) {
      element.removeAttribute(`data-bs-${normalizeDataKey(key)}`);
    },
    getDataAttributes(element) {
      if (!element) {
        return {};
      }
      const attributes = {};
      const bsKeys = Object.keys(element.dataset).filter((key) => key.startsWith("bs") && !key.startsWith("bsConfig"));
      for (const key of bsKeys) {
        let pureKey = key.replace(/^bs/, "");
        pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1);
        attributes[pureKey] = normalizeData(element.dataset[key]);
      }
      return attributes;
    },
    getDataAttribute(element, key) {
      return normalizeData(element.getAttribute(`data-bs-${normalizeDataKey(key)}`));
    }
  };
  var Config2 = class {
    // Getters
    static get Default() {
      return {};
    }
    static get DefaultType() {
      return {};
    }
    static get NAME() {
      throw new Error('You have to implement the static method "NAME", for each component!');
    }
    _getConfig(config2) {
      config2 = this._mergeConfigObj(config2);
      config2 = this._configAfterMerge(config2);
      this._typeCheckConfig(config2);
      return config2;
    }
    _configAfterMerge(config2) {
      return config2;
    }
    _mergeConfigObj(config2, element) {
      const jsonConfig = isElement2(element) ? Manipulator.getDataAttribute(element, "config") : {};
      return {
        ...this.constructor.Default,
        ...typeof jsonConfig === "object" ? jsonConfig : {},
        ...isElement2(element) ? Manipulator.getDataAttributes(element) : {},
        ...typeof config2 === "object" ? config2 : {}
      };
    }
    _typeCheckConfig(config2, configTypes = this.constructor.DefaultType) {
      for (const [property, expectedTypes] of Object.entries(configTypes)) {
        const value = config2[property];
        const valueType = isElement2(value) ? "element" : toType(value);
        if (!new RegExp(expectedTypes).test(valueType)) {
          throw new TypeError(`${this.constructor.NAME.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`);
        }
      }
    }
  };
  var VERSION = "5.3.8";
  var BaseComponent = class extends Config2 {
    constructor(element, config2) {
      super();
      element = getElement(element);
      if (!element) {
        return;
      }
      this._element = element;
      this._config = this._getConfig(config2);
      Data.set(this._element, this.constructor.DATA_KEY, this);
    }
    // Public
    dispose() {
      Data.remove(this._element, this.constructor.DATA_KEY);
      EventHandler.off(this._element, this.constructor.EVENT_KEY);
      for (const propertyName of Object.getOwnPropertyNames(this)) {
        this[propertyName] = null;
      }
    }
    // Private
    _queueCallback(callback, element, isAnimated = true) {
      executeAfterTransition(callback, element, isAnimated);
    }
    _getConfig(config2) {
      config2 = this._mergeConfigObj(config2, this._element);
      config2 = this._configAfterMerge(config2);
      this._typeCheckConfig(config2);
      return config2;
    }
    // Static
    static getInstance(element) {
      return Data.get(getElement(element), this.DATA_KEY);
    }
    static getOrCreateInstance(element, config2 = {}) {
      return this.getInstance(element) || new this(element, typeof config2 === "object" ? config2 : null);
    }
    static get VERSION() {
      return VERSION;
    }
    static get DATA_KEY() {
      return `bs.${this.NAME}`;
    }
    static get EVENT_KEY() {
      return `.${this.DATA_KEY}`;
    }
    static eventName(name) {
      return `${name}${this.EVENT_KEY}`;
    }
  };
  var getSelector = (element) => {
    let selector = element.getAttribute("data-bs-target");
    if (!selector || selector === "#") {
      let hrefAttribute = element.getAttribute("href");
      if (!hrefAttribute || !hrefAttribute.includes("#") && !hrefAttribute.startsWith(".")) {
        return null;
      }
      if (hrefAttribute.includes("#") && !hrefAttribute.startsWith("#")) {
        hrefAttribute = `#${hrefAttribute.split("#")[1]}`;
      }
      selector = hrefAttribute && hrefAttribute !== "#" ? hrefAttribute.trim() : null;
    }
    return selector ? selector.split(",").map((sel) => parseSelector(sel)).join(",") : null;
  };
  var SelectorEngine = {
    find(selector, element = document.documentElement) {
      return [].concat(...Element.prototype.querySelectorAll.call(element, selector));
    },
    findOne(selector, element = document.documentElement) {
      return Element.prototype.querySelector.call(element, selector);
    },
    children(element, selector) {
      return [].concat(...element.children).filter((child) => child.matches(selector));
    },
    parents(element, selector) {
      const parents = [];
      let ancestor = element.parentNode.closest(selector);
      while (ancestor) {
        parents.push(ancestor);
        ancestor = ancestor.parentNode.closest(selector);
      }
      return parents;
    },
    prev(element, selector) {
      let previous = element.previousElementSibling;
      while (previous) {
        if (previous.matches(selector)) {
          return [previous];
        }
        previous = previous.previousElementSibling;
      }
      return [];
    },
    // TODO: this is now unused; remove later along with prev()
    next(element, selector) {
      let next = element.nextElementSibling;
      while (next) {
        if (next.matches(selector)) {
          return [next];
        }
        next = next.nextElementSibling;
      }
      return [];
    },
    focusableChildren(element) {
      const focusables = ["a", "button", "input", "textarea", "select", "details", "[tabindex]", '[contenteditable="true"]'].map((selector) => `${selector}:not([tabindex^="-"])`).join(",");
      return this.find(focusables, element).filter((el) => !isDisabled(el) && isVisible(el));
    },
    getSelectorFromElement(element) {
      const selector = getSelector(element);
      if (selector) {
        return SelectorEngine.findOne(selector) ? selector : null;
      }
      return null;
    },
    getElementFromSelector(element) {
      const selector = getSelector(element);
      return selector ? SelectorEngine.findOne(selector) : null;
    },
    getMultipleElementsFromSelector(element) {
      const selector = getSelector(element);
      return selector ? SelectorEngine.find(selector) : [];
    }
  };
  var enableDismissTrigger = (component, method = "hide") => {
    const clickEvent = `click.dismiss${component.EVENT_KEY}`;
    const name = component.NAME;
    EventHandler.on(document, clickEvent, `[data-bs-dismiss="${name}"]`, function(event) {
      if (["A", "AREA"].includes(this.tagName)) {
        event.preventDefault();
      }
      if (isDisabled(this)) {
        return;
      }
      const target = SelectorEngine.getElementFromSelector(this) || this.closest(`.${name}`);
      const instance = component.getOrCreateInstance(target);
      instance[method]();
    });
  };
  var NAME$f = "alert";
  var DATA_KEY$a = "bs.alert";
  var EVENT_KEY$b = `.${DATA_KEY$a}`;
  var EVENT_CLOSE = `close${EVENT_KEY$b}`;
  var EVENT_CLOSED = `closed${EVENT_KEY$b}`;
  var CLASS_NAME_FADE$5 = "fade";
  var CLASS_NAME_SHOW$8 = "show";
  var Alert = class _Alert extends BaseComponent {
    // Getters
    static get NAME() {
      return NAME$f;
    }
    // Public
    close() {
      const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);
      if (closeEvent.defaultPrevented) {
        return;
      }
      this._element.classList.remove(CLASS_NAME_SHOW$8);
      const isAnimated = this._element.classList.contains(CLASS_NAME_FADE$5);
      this._queueCallback(() => this._destroyElement(), this._element, isAnimated);
    }
    // Private
    _destroyElement() {
      this._element.remove();
      EventHandler.trigger(this._element, EVENT_CLOSED);
      this.dispose();
    }
    // Static
    static jQueryInterface(config2) {
      return this.each(function() {
        const data = _Alert.getOrCreateInstance(this);
        if (typeof config2 !== "string") {
          return;
        }
        if (data[config2] === void 0 || config2.startsWith("_") || config2 === "constructor") {
          throw new TypeError(`No method named "${config2}"`);
        }
        data[config2](this);
      });
    }
  };
  enableDismissTrigger(Alert, "close");
  defineJQueryPlugin(Alert);
  var NAME$e = "button";
  var DATA_KEY$9 = "bs.button";
  var EVENT_KEY$a = `.${DATA_KEY$9}`;
  var DATA_API_KEY$6 = ".data-api";
  var CLASS_NAME_ACTIVE$3 = "active";
  var SELECTOR_DATA_TOGGLE$5 = '[data-bs-toggle="button"]';
  var EVENT_CLICK_DATA_API$6 = `click${EVENT_KEY$a}${DATA_API_KEY$6}`;
  var Button = class _Button extends BaseComponent {
    // Getters
    static get NAME() {
      return NAME$e;
    }
    // Public
    toggle() {
      this._element.setAttribute("aria-pressed", this._element.classList.toggle(CLASS_NAME_ACTIVE$3));
    }
    // Static
    static jQueryInterface(config2) {
      return this.each(function() {
        const data = _Button.getOrCreateInstance(this);
        if (config2 === "toggle") {
          data[config2]();
        }
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API$6, SELECTOR_DATA_TOGGLE$5, (event) => {
    event.preventDefault();
    const button = event.target.closest(SELECTOR_DATA_TOGGLE$5);
    const data = Button.getOrCreateInstance(button);
    data.toggle();
  });
  defineJQueryPlugin(Button);
  var NAME$d = "swipe";
  var EVENT_KEY$9 = ".bs.swipe";
  var EVENT_TOUCHSTART = `touchstart${EVENT_KEY$9}`;
  var EVENT_TOUCHMOVE = `touchmove${EVENT_KEY$9}`;
  var EVENT_TOUCHEND = `touchend${EVENT_KEY$9}`;
  var EVENT_POINTERDOWN = `pointerdown${EVENT_KEY$9}`;
  var EVENT_POINTERUP = `pointerup${EVENT_KEY$9}`;
  var POINTER_TYPE_TOUCH = "touch";
  var POINTER_TYPE_PEN = "pen";
  var CLASS_NAME_POINTER_EVENT = "pointer-event";
  var SWIPE_THRESHOLD = 40;
  var Default$c = {
    endCallback: null,
    leftCallback: null,
    rightCallback: null
  };
  var DefaultType$c = {
    endCallback: "(function|null)",
    leftCallback: "(function|null)",
    rightCallback: "(function|null)"
  };
  var Swipe = class _Swipe extends Config2 {
    constructor(element, config2) {
      super();
      this._element = element;
      if (!element || !_Swipe.isSupported()) {
        return;
      }
      this._config = this._getConfig(config2);
      this._deltaX = 0;
      this._supportPointerEvents = Boolean(window.PointerEvent);
      this._initEvents();
    }
    // Getters
    static get Default() {
      return Default$c;
    }
    static get DefaultType() {
      return DefaultType$c;
    }
    static get NAME() {
      return NAME$d;
    }
    // Public
    dispose() {
      EventHandler.off(this._element, EVENT_KEY$9);
    }
    // Private
    _start(event) {
      if (!this._supportPointerEvents) {
        this._deltaX = event.touches[0].clientX;
        return;
      }
      if (this._eventIsPointerPenTouch(event)) {
        this._deltaX = event.clientX;
      }
    }
    _end(event) {
      if (this._eventIsPointerPenTouch(event)) {
        this._deltaX = event.clientX - this._deltaX;
      }
      this._handleSwipe();
      execute(this._config.endCallback);
    }
    _move(event) {
      this._deltaX = event.touches && event.touches.length > 1 ? 0 : event.touches[0].clientX - this._deltaX;
    }
    _handleSwipe() {
      const absDeltaX = Math.abs(this._deltaX);
      if (absDeltaX <= SWIPE_THRESHOLD) {
        return;
      }
      const direction = absDeltaX / this._deltaX;
      this._deltaX = 0;
      if (!direction) {
        return;
      }
      execute(direction > 0 ? this._config.rightCallback : this._config.leftCallback);
    }
    _initEvents() {
      if (this._supportPointerEvents) {
        EventHandler.on(this._element, EVENT_POINTERDOWN, (event) => this._start(event));
        EventHandler.on(this._element, EVENT_POINTERUP, (event) => this._end(event));
        this._element.classList.add(CLASS_NAME_POINTER_EVENT);
      } else {
        EventHandler.on(this._element, EVENT_TOUCHSTART, (event) => this._start(event));
        EventHandler.on(this._element, EVENT_TOUCHMOVE, (event) => this._move(event));
        EventHandler.on(this._element, EVENT_TOUCHEND, (event) => this._end(event));
      }
    }
    _eventIsPointerPenTouch(event) {
      return this._supportPointerEvents && (event.pointerType === POINTER_TYPE_PEN || event.pointerType === POINTER_TYPE_TOUCH);
    }
    // Static
    static isSupported() {
      return "ontouchstart" in document.documentElement || navigator.maxTouchPoints > 0;
    }
  };
  var NAME$c = "carousel";
  var DATA_KEY$8 = "bs.carousel";
  var EVENT_KEY$8 = `.${DATA_KEY$8}`;
  var DATA_API_KEY$5 = ".data-api";
  var ARROW_LEFT_KEY$1 = "ArrowLeft";
  var ARROW_RIGHT_KEY$1 = "ArrowRight";
  var TOUCHEVENT_COMPAT_WAIT = 500;
  var ORDER_NEXT = "next";
  var ORDER_PREV = "prev";
  var DIRECTION_LEFT = "left";
  var DIRECTION_RIGHT = "right";
  var EVENT_SLIDE = `slide${EVENT_KEY$8}`;
  var EVENT_SLID = `slid${EVENT_KEY$8}`;
  var EVENT_KEYDOWN$1 = `keydown${EVENT_KEY$8}`;
  var EVENT_MOUSEENTER$1 = `mouseenter${EVENT_KEY$8}`;
  var EVENT_MOUSELEAVE$1 = `mouseleave${EVENT_KEY$8}`;
  var EVENT_DRAG_START = `dragstart${EVENT_KEY$8}`;
  var EVENT_LOAD_DATA_API$3 = `load${EVENT_KEY$8}${DATA_API_KEY$5}`;
  var EVENT_CLICK_DATA_API$5 = `click${EVENT_KEY$8}${DATA_API_KEY$5}`;
  var CLASS_NAME_CAROUSEL = "carousel";
  var CLASS_NAME_ACTIVE$2 = "active";
  var CLASS_NAME_SLIDE = "slide";
  var CLASS_NAME_END = "carousel-item-end";
  var CLASS_NAME_START = "carousel-item-start";
  var CLASS_NAME_NEXT = "carousel-item-next";
  var CLASS_NAME_PREV = "carousel-item-prev";
  var SELECTOR_ACTIVE = ".active";
  var SELECTOR_ITEM = ".carousel-item";
  var SELECTOR_ACTIVE_ITEM = SELECTOR_ACTIVE + SELECTOR_ITEM;
  var SELECTOR_ITEM_IMG = ".carousel-item img";
  var SELECTOR_INDICATORS = ".carousel-indicators";
  var SELECTOR_DATA_SLIDE = "[data-bs-slide], [data-bs-slide-to]";
  var SELECTOR_DATA_RIDE = '[data-bs-ride="carousel"]';
  var KEY_TO_DIRECTION = {
    [ARROW_LEFT_KEY$1]: DIRECTION_RIGHT,
    [ARROW_RIGHT_KEY$1]: DIRECTION_LEFT
  };
  var Default$b = {
    interval: 5e3,
    keyboard: true,
    pause: "hover",
    ride: false,
    touch: true,
    wrap: true
  };
  var DefaultType$b = {
    interval: "(number|boolean)",
    // TODO:v6 remove boolean support
    keyboard: "boolean",
    pause: "(string|boolean)",
    ride: "(boolean|string)",
    touch: "boolean",
    wrap: "boolean"
  };
  var Carousel = class _Carousel extends BaseComponent {
    constructor(element, config2) {
      super(element, config2);
      this._interval = null;
      this._activeElement = null;
      this._isSliding = false;
      this.touchTimeout = null;
      this._swipeHelper = null;
      this._indicatorsElement = SelectorEngine.findOne(SELECTOR_INDICATORS, this._element);
      this._addEventListeners();
      if (this._config.ride === CLASS_NAME_CAROUSEL) {
        this.cycle();
      }
    }
    // Getters
    static get Default() {
      return Default$b;
    }
    static get DefaultType() {
      return DefaultType$b;
    }
    static get NAME() {
      return NAME$c;
    }
    // Public
    next() {
      this._slide(ORDER_NEXT);
    }
    nextWhenVisible() {
      if (!document.hidden && isVisible(this._element)) {
        this.next();
      }
    }
    prev() {
      this._slide(ORDER_PREV);
    }
    pause() {
      if (this._isSliding) {
        triggerTransitionEnd(this._element);
      }
      this._clearInterval();
    }
    cycle() {
      this._clearInterval();
      this._updateInterval();
      this._interval = setInterval(() => this.nextWhenVisible(), this._config.interval);
    }
    _maybeEnableCycle() {
      if (!this._config.ride) {
        return;
      }
      if (this._isSliding) {
        EventHandler.one(this._element, EVENT_SLID, () => this.cycle());
        return;
      }
      this.cycle();
    }
    to(index) {
      const items = this._getItems();
      if (index > items.length - 1 || index < 0) {
        return;
      }
      if (this._isSliding) {
        EventHandler.one(this._element, EVENT_SLID, () => this.to(index));
        return;
      }
      const activeIndex = this._getItemIndex(this._getActive());
      if (activeIndex === index) {
        return;
      }
      const order2 = index > activeIndex ? ORDER_NEXT : ORDER_PREV;
      this._slide(order2, items[index]);
    }
    dispose() {
      if (this._swipeHelper) {
        this._swipeHelper.dispose();
      }
      super.dispose();
    }
    // Private
    _configAfterMerge(config2) {
      config2.defaultInterval = config2.interval;
      return config2;
    }
    _addEventListeners() {
      if (this._config.keyboard) {
        EventHandler.on(this._element, EVENT_KEYDOWN$1, (event) => this._keydown(event));
      }
      if (this._config.pause === "hover") {
        EventHandler.on(this._element, EVENT_MOUSEENTER$1, () => this.pause());
        EventHandler.on(this._element, EVENT_MOUSELEAVE$1, () => this._maybeEnableCycle());
      }
      if (this._config.touch && Swipe.isSupported()) {
        this._addTouchEventListeners();
      }
    }
    _addTouchEventListeners() {
      for (const img of SelectorEngine.find(SELECTOR_ITEM_IMG, this._element)) {
        EventHandler.on(img, EVENT_DRAG_START, (event) => event.preventDefault());
      }
      const endCallBack = () => {
        if (this._config.pause !== "hover") {
          return;
        }
        this.pause();
        if (this.touchTimeout) {
          clearTimeout(this.touchTimeout);
        }
        this.touchTimeout = setTimeout(() => this._maybeEnableCycle(), TOUCHEVENT_COMPAT_WAIT + this._config.interval);
      };
      const swipeConfig = {
        leftCallback: () => this._slide(this._directionToOrder(DIRECTION_LEFT)),
        rightCallback: () => this._slide(this._directionToOrder(DIRECTION_RIGHT)),
        endCallback: endCallBack
      };
      this._swipeHelper = new Swipe(this._element, swipeConfig);
    }
    _keydown(event) {
      if (/input|textarea/i.test(event.target.tagName)) {
        return;
      }
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        event.preventDefault();
        this._slide(this._directionToOrder(direction));
      }
    }
    _getItemIndex(element) {
      return this._getItems().indexOf(element);
    }
    _setActiveIndicatorElement(index) {
      if (!this._indicatorsElement) {
        return;
      }
      const activeIndicator = SelectorEngine.findOne(SELECTOR_ACTIVE, this._indicatorsElement);
      activeIndicator.classList.remove(CLASS_NAME_ACTIVE$2);
      activeIndicator.removeAttribute("aria-current");
      const newActiveIndicator = SelectorEngine.findOne(`[data-bs-slide-to="${index}"]`, this._indicatorsElement);
      if (newActiveIndicator) {
        newActiveIndicator.classList.add(CLASS_NAME_ACTIVE$2);
        newActiveIndicator.setAttribute("aria-current", "true");
      }
    }
    _updateInterval() {
      const element = this._activeElement || this._getActive();
      if (!element) {
        return;
      }
      const elementInterval = Number.parseInt(element.getAttribute("data-bs-interval"), 10);
      this._config.interval = elementInterval || this._config.defaultInterval;
    }
    _slide(order2, element = null) {
      if (this._isSliding) {
        return;
      }
      const activeElement = this._getActive();
      const isNext = order2 === ORDER_NEXT;
      const nextElement = element || getNextActiveElement(this._getItems(), activeElement, isNext, this._config.wrap);
      if (nextElement === activeElement) {
        return;
      }
      const nextElementIndex = this._getItemIndex(nextElement);
      const triggerEvent2 = (eventName) => {
        return EventHandler.trigger(this._element, eventName, {
          relatedTarget: nextElement,
          direction: this._orderToDirection(order2),
          from: this._getItemIndex(activeElement),
          to: nextElementIndex
        });
      };
      const slideEvent = triggerEvent2(EVENT_SLIDE);
      if (slideEvent.defaultPrevented) {
        return;
      }
      if (!activeElement || !nextElement) {
        return;
      }
      const isCycling = Boolean(this._interval);
      this.pause();
      this._isSliding = true;
      this._setActiveIndicatorElement(nextElementIndex);
      this._activeElement = nextElement;
      const directionalClassName = isNext ? CLASS_NAME_START : CLASS_NAME_END;
      const orderClassName = isNext ? CLASS_NAME_NEXT : CLASS_NAME_PREV;
      nextElement.classList.add(orderClassName);
      reflow(nextElement);
      activeElement.classList.add(directionalClassName);
      nextElement.classList.add(directionalClassName);
      const completeCallBack = () => {
        nextElement.classList.remove(directionalClassName, orderClassName);
        nextElement.classList.add(CLASS_NAME_ACTIVE$2);
        activeElement.classList.remove(CLASS_NAME_ACTIVE$2, orderClassName, directionalClassName);
        this._isSliding = false;
        triggerEvent2(EVENT_SLID);
      };
      this._queueCallback(completeCallBack, activeElement, this._isAnimated());
      if (isCycling) {
        this.cycle();
      }
    }
    _isAnimated() {
      return this._element.classList.contains(CLASS_NAME_SLIDE);
    }
    _getActive() {
      return SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);
    }
    _getItems() {
      return SelectorEngine.find(SELECTOR_ITEM, this._element);
    }
    _clearInterval() {
      if (this._interval) {
        clearInterval(this._interval);
        this._interval = null;
      }
    }
    _directionToOrder(direction) {
      if (isRTL()) {
        return direction === DIRECTION_LEFT ? ORDER_PREV : ORDER_NEXT;
      }
      return direction === DIRECTION_LEFT ? ORDER_NEXT : ORDER_PREV;
    }
    _orderToDirection(order2) {
      if (isRTL()) {
        return order2 === ORDER_PREV ? DIRECTION_LEFT : DIRECTION_RIGHT;
      }
      return order2 === ORDER_PREV ? DIRECTION_RIGHT : DIRECTION_LEFT;
    }
    // Static
    static jQueryInterface(config2) {
      return this.each(function() {
        const data = _Carousel.getOrCreateInstance(this, config2);
        if (typeof config2 === "number") {
          data.to(config2);
          return;
        }
        if (typeof config2 === "string") {
          if (data[config2] === void 0 || config2.startsWith("_") || config2 === "constructor") {
            throw new TypeError(`No method named "${config2}"`);
          }
          data[config2]();
        }
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API$5, SELECTOR_DATA_SLIDE, function(event) {
    const target = SelectorEngine.getElementFromSelector(this);
    if (!target || !target.classList.contains(CLASS_NAME_CAROUSEL)) {
      return;
    }
    event.preventDefault();
    const carousel = Carousel.getOrCreateInstance(target);
    const slideIndex = this.getAttribute("data-bs-slide-to");
    if (slideIndex) {
      carousel.to(slideIndex);
      carousel._maybeEnableCycle();
      return;
    }
    if (Manipulator.getDataAttribute(this, "slide") === "next") {
      carousel.next();
      carousel._maybeEnableCycle();
      return;
    }
    carousel.prev();
    carousel._maybeEnableCycle();
  });
  EventHandler.on(window, EVENT_LOAD_DATA_API$3, () => {
    const carousels = SelectorEngine.find(SELECTOR_DATA_RIDE);
    for (const carousel of carousels) {
      Carousel.getOrCreateInstance(carousel);
    }
  });
  defineJQueryPlugin(Carousel);
  var NAME$b = "collapse";
  var DATA_KEY$7 = "bs.collapse";
  var EVENT_KEY$7 = `.${DATA_KEY$7}`;
  var DATA_API_KEY$4 = ".data-api";
  var EVENT_SHOW$6 = `show${EVENT_KEY$7}`;
  var EVENT_SHOWN$6 = `shown${EVENT_KEY$7}`;
  var EVENT_HIDE$6 = `hide${EVENT_KEY$7}`;
  var EVENT_HIDDEN$6 = `hidden${EVENT_KEY$7}`;
  var EVENT_CLICK_DATA_API$4 = `click${EVENT_KEY$7}${DATA_API_KEY$4}`;
  var CLASS_NAME_SHOW$7 = "show";
  var CLASS_NAME_COLLAPSE = "collapse";
  var CLASS_NAME_COLLAPSING = "collapsing";
  var CLASS_NAME_COLLAPSED = "collapsed";
  var CLASS_NAME_DEEPER_CHILDREN = `:scope .${CLASS_NAME_COLLAPSE} .${CLASS_NAME_COLLAPSE}`;
  var CLASS_NAME_HORIZONTAL = "collapse-horizontal";
  var WIDTH = "width";
  var HEIGHT = "height";
  var SELECTOR_ACTIVES = ".collapse.show, .collapse.collapsing";
  var SELECTOR_DATA_TOGGLE$4 = '[data-bs-toggle="collapse"]';
  var Default$a = {
    parent: null,
    toggle: true
  };
  var DefaultType$a = {
    parent: "(null|element)",
    toggle: "boolean"
  };
  var Collapse = class _Collapse extends BaseComponent {
    constructor(element, config2) {
      super(element, config2);
      this._isTransitioning = false;
      this._triggerArray = [];
      const toggleList = SelectorEngine.find(SELECTOR_DATA_TOGGLE$4);
      for (const elem of toggleList) {
        const selector = SelectorEngine.getSelectorFromElement(elem);
        const filterElement = SelectorEngine.find(selector).filter((foundElement) => foundElement === this._element);
        if (selector !== null && filterElement.length) {
          this._triggerArray.push(elem);
        }
      }
      this._initializeChildren();
      if (!this._config.parent) {
        this._addAriaAndCollapsedClass(this._triggerArray, this._isShown());
      }
      if (this._config.toggle) {
        this.toggle();
      }
    }
    // Getters
    static get Default() {
      return Default$a;
    }
    static get DefaultType() {
      return DefaultType$a;
    }
    static get NAME() {
      return NAME$b;
    }
    // Public
    toggle() {
      if (this._isShown()) {
        this.hide();
      } else {
        this.show();
      }
    }
    show() {
      if (this._isTransitioning || this._isShown()) {
        return;
      }
      let activeChildren = [];
      if (this._config.parent) {
        activeChildren = this._getFirstLevelChildren(SELECTOR_ACTIVES).filter((element) => element !== this._element).map((element) => _Collapse.getOrCreateInstance(element, {
          toggle: false
        }));
      }
      if (activeChildren.length && activeChildren[0]._isTransitioning) {
        return;
      }
      const startEvent = EventHandler.trigger(this._element, EVENT_SHOW$6);
      if (startEvent.defaultPrevented) {
        return;
      }
      for (const activeInstance of activeChildren) {
        activeInstance.hide();
      }
      const dimension = this._getDimension();
      this._element.classList.remove(CLASS_NAME_COLLAPSE);
      this._element.classList.add(CLASS_NAME_COLLAPSING);
      this._element.style[dimension] = 0;
      this._addAriaAndCollapsedClass(this._triggerArray, true);
      this._isTransitioning = true;
      const complete = () => {
        this._isTransitioning = false;
        this._element.classList.remove(CLASS_NAME_COLLAPSING);
        this._element.classList.add(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
        this._element.style[dimension] = "";
        EventHandler.trigger(this._element, EVENT_SHOWN$6);
      };
      const capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
      const scrollSize = `scroll${capitalizedDimension}`;
      this._queueCallback(complete, this._element, true);
      this._element.style[dimension] = `${this._element[scrollSize]}px`;
    }
    hide() {
      if (this._isTransitioning || !this._isShown()) {
        return;
      }
      const startEvent = EventHandler.trigger(this._element, EVENT_HIDE$6);
      if (startEvent.defaultPrevented) {
        return;
      }
      const dimension = this._getDimension();
      this._element.style[dimension] = `${this._element.getBoundingClientRect()[dimension]}px`;
      reflow(this._element);
      this._element.classList.add(CLASS_NAME_COLLAPSING);
      this._element.classList.remove(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
      for (const trigger of this._triggerArray) {
        const element = SelectorEngine.getElementFromSelector(trigger);
        if (element && !this._isShown(element)) {
          this._addAriaAndCollapsedClass([trigger], false);
        }
      }
      this._isTransitioning = true;
      const complete = () => {
        this._isTransitioning = false;
        this._element.classList.remove(CLASS_NAME_COLLAPSING);
        this._element.classList.add(CLASS_NAME_COLLAPSE);
        EventHandler.trigger(this._element, EVENT_HIDDEN$6);
      };
      this._element.style[dimension] = "";
      this._queueCallback(complete, this._element, true);
    }
    // Private
    _isShown(element = this._element) {
      return element.classList.contains(CLASS_NAME_SHOW$7);
    }
    _configAfterMerge(config2) {
      config2.toggle = Boolean(config2.toggle);
      config2.parent = getElement(config2.parent);
      return config2;
    }
    _getDimension() {
      return this._element.classList.contains(CLASS_NAME_HORIZONTAL) ? WIDTH : HEIGHT;
    }
    _initializeChildren() {
      if (!this._config.parent) {
        return;
      }
      const children = this._getFirstLevelChildren(SELECTOR_DATA_TOGGLE$4);
      for (const element of children) {
        const selected = SelectorEngine.getElementFromSelector(element);
        if (selected) {
          this._addAriaAndCollapsedClass([element], this._isShown(selected));
        }
      }
    }
    _getFirstLevelChildren(selector) {
      const children = SelectorEngine.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent);
      return SelectorEngine.find(selector, this._config.parent).filter((element) => !children.includes(element));
    }
    _addAriaAndCollapsedClass(triggerArray, isOpen) {
      if (!triggerArray.length) {
        return;
      }
      for (const element of triggerArray) {
        element.classList.toggle(CLASS_NAME_COLLAPSED, !isOpen);
        element.setAttribute("aria-expanded", isOpen);
      }
    }
    // Static
    static jQueryInterface(config2) {
      const _config = {};
      if (typeof config2 === "string" && /show|hide/.test(config2)) {
        _config.toggle = false;
      }
      return this.each(function() {
        const data = _Collapse.getOrCreateInstance(this, _config);
        if (typeof config2 === "string") {
          if (typeof data[config2] === "undefined") {
            throw new TypeError(`No method named "${config2}"`);
          }
          data[config2]();
        }
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API$4, SELECTOR_DATA_TOGGLE$4, function(event) {
    if (event.target.tagName === "A" || event.delegateTarget && event.delegateTarget.tagName === "A") {
      event.preventDefault();
    }
    for (const element of SelectorEngine.getMultipleElementsFromSelector(this)) {
      Collapse.getOrCreateInstance(element, {
        toggle: false
      }).toggle();
    }
  });
  defineJQueryPlugin(Collapse);
  var NAME$a = "dropdown";
  var DATA_KEY$6 = "bs.dropdown";
  var EVENT_KEY$6 = `.${DATA_KEY$6}`;
  var DATA_API_KEY$3 = ".data-api";
  var ESCAPE_KEY$2 = "Escape";
  var TAB_KEY$1 = "Tab";
  var ARROW_UP_KEY$1 = "ArrowUp";
  var ARROW_DOWN_KEY$1 = "ArrowDown";
  var RIGHT_MOUSE_BUTTON = 2;
  var EVENT_HIDE$5 = `hide${EVENT_KEY$6}`;
  var EVENT_HIDDEN$5 = `hidden${EVENT_KEY$6}`;
  var EVENT_SHOW$5 = `show${EVENT_KEY$6}`;
  var EVENT_SHOWN$5 = `shown${EVENT_KEY$6}`;
  var EVENT_CLICK_DATA_API$3 = `click${EVENT_KEY$6}${DATA_API_KEY$3}`;
  var EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY$6}${DATA_API_KEY$3}`;
  var EVENT_KEYUP_DATA_API = `keyup${EVENT_KEY$6}${DATA_API_KEY$3}`;
  var CLASS_NAME_SHOW$6 = "show";
  var CLASS_NAME_DROPUP = "dropup";
  var CLASS_NAME_DROPEND = "dropend";
  var CLASS_NAME_DROPSTART = "dropstart";
  var CLASS_NAME_DROPUP_CENTER = "dropup-center";
  var CLASS_NAME_DROPDOWN_CENTER = "dropdown-center";
  var SELECTOR_DATA_TOGGLE$3 = '[data-bs-toggle="dropdown"]:not(.disabled):not(:disabled)';
  var SELECTOR_DATA_TOGGLE_SHOWN = `${SELECTOR_DATA_TOGGLE$3}.${CLASS_NAME_SHOW$6}`;
  var SELECTOR_MENU = ".dropdown-menu";
  var SELECTOR_NAVBAR = ".navbar";
  var SELECTOR_NAVBAR_NAV = ".navbar-nav";
  var SELECTOR_VISIBLE_ITEMS = ".dropdown-menu .dropdown-item:not(.disabled):not(:disabled)";
  var PLACEMENT_TOP = isRTL() ? "top-end" : "top-start";
  var PLACEMENT_TOPEND = isRTL() ? "top-start" : "top-end";
  var PLACEMENT_BOTTOM = isRTL() ? "bottom-end" : "bottom-start";
  var PLACEMENT_BOTTOMEND = isRTL() ? "bottom-start" : "bottom-end";
  var PLACEMENT_RIGHT = isRTL() ? "left-start" : "right-start";
  var PLACEMENT_LEFT = isRTL() ? "right-start" : "left-start";
  var PLACEMENT_TOPCENTER = "top";
  var PLACEMENT_BOTTOMCENTER = "bottom";
  var Default$9 = {
    autoClose: true,
    boundary: "clippingParents",
    display: "dynamic",
    offset: [0, 2],
    popperConfig: null,
    reference: "toggle"
  };
  var DefaultType$9 = {
    autoClose: "(boolean|string)",
    boundary: "(string|element)",
    display: "string",
    offset: "(array|string|function)",
    popperConfig: "(null|object|function)",
    reference: "(string|element|object)"
  };
  var Dropdown = class _Dropdown extends BaseComponent {
    constructor(element, config2) {
      super(element, config2);
      this._popper = null;
      this._parent = this._element.parentNode;
      this._menu = SelectorEngine.next(this._element, SELECTOR_MENU)[0] || SelectorEngine.prev(this._element, SELECTOR_MENU)[0] || SelectorEngine.findOne(SELECTOR_MENU, this._parent);
      this._inNavbar = this._detectNavbar();
    }
    // Getters
    static get Default() {
      return Default$9;
    }
    static get DefaultType() {
      return DefaultType$9;
    }
    static get NAME() {
      return NAME$a;
    }
    // Public
    toggle() {
      return this._isShown() ? this.hide() : this.show();
    }
    show() {
      if (isDisabled(this._element) || this._isShown()) {
        return;
      }
      const relatedTarget = {
        relatedTarget: this._element
      };
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$5, relatedTarget);
      if (showEvent.defaultPrevented) {
        return;
      }
      this._createPopper();
      if ("ontouchstart" in document.documentElement && !this._parent.closest(SELECTOR_NAVBAR_NAV)) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.on(element, "mouseover", noop);
        }
      }
      this._element.focus();
      this._element.setAttribute("aria-expanded", true);
      this._menu.classList.add(CLASS_NAME_SHOW$6);
      this._element.classList.add(CLASS_NAME_SHOW$6);
      EventHandler.trigger(this._element, EVENT_SHOWN$5, relatedTarget);
    }
    hide() {
      if (isDisabled(this._element) || !this._isShown()) {
        return;
      }
      const relatedTarget = {
        relatedTarget: this._element
      };
      this._completeHide(relatedTarget);
    }
    dispose() {
      if (this._popper) {
        this._popper.destroy();
      }
      super.dispose();
    }
    update() {
      this._inNavbar = this._detectNavbar();
      if (this._popper) {
        this._popper.update();
      }
    }
    // Private
    _completeHide(relatedTarget) {
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$5, relatedTarget);
      if (hideEvent.defaultPrevented) {
        return;
      }
      if ("ontouchstart" in document.documentElement) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.off(element, "mouseover", noop);
        }
      }
      if (this._popper) {
        this._popper.destroy();
      }
      this._menu.classList.remove(CLASS_NAME_SHOW$6);
      this._element.classList.remove(CLASS_NAME_SHOW$6);
      this._element.setAttribute("aria-expanded", "false");
      Manipulator.removeDataAttribute(this._menu, "popper");
      EventHandler.trigger(this._element, EVENT_HIDDEN$5, relatedTarget);
    }
    _getConfig(config2) {
      config2 = super._getConfig(config2);
      if (typeof config2.reference === "object" && !isElement2(config2.reference) && typeof config2.reference.getBoundingClientRect !== "function") {
        throw new TypeError(`${NAME$a.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);
      }
      return config2;
    }
    _createPopper() {
      if (typeof lib_exports === "undefined") {
        throw new TypeError("Bootstrap's dropdowns require Popper (https://popper.js.org/docs/v2/)");
      }
      let referenceElement = this._element;
      if (this._config.reference === "parent") {
        referenceElement = this._parent;
      } else if (isElement2(this._config.reference)) {
        referenceElement = getElement(this._config.reference);
      } else if (typeof this._config.reference === "object") {
        referenceElement = this._config.reference;
      }
      const popperConfig = this._getPopperConfig();
      this._popper = createPopper3(referenceElement, this._menu, popperConfig);
    }
    _isShown() {
      return this._menu.classList.contains(CLASS_NAME_SHOW$6);
    }
    _getPlacement() {
      const parentDropdown = this._parent;
      if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
        return PLACEMENT_RIGHT;
      }
      if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
        return PLACEMENT_LEFT;
      }
      if (parentDropdown.classList.contains(CLASS_NAME_DROPUP_CENTER)) {
        return PLACEMENT_TOPCENTER;
      }
      if (parentDropdown.classList.contains(CLASS_NAME_DROPDOWN_CENTER)) {
        return PLACEMENT_BOTTOMCENTER;
      }
      const isEnd = getComputedStyle(this._menu).getPropertyValue("--bs-position").trim() === "end";
      if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
        return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
      }
      return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
    }
    _detectNavbar() {
      return this._element.closest(SELECTOR_NAVBAR) !== null;
    }
    _getOffset() {
      const {
        offset: offset2
      } = this._config;
      if (typeof offset2 === "string") {
        return offset2.split(",").map((value) => Number.parseInt(value, 10));
      }
      if (typeof offset2 === "function") {
        return (popperData) => offset2(popperData, this._element);
      }
      return offset2;
    }
    _getPopperConfig() {
      const defaultBsPopperConfig = {
        placement: this._getPlacement(),
        modifiers: [{
          name: "preventOverflow",
          options: {
            boundary: this._config.boundary
          }
        }, {
          name: "offset",
          options: {
            offset: this._getOffset()
          }
        }]
      };
      if (this._inNavbar || this._config.display === "static") {
        Manipulator.setDataAttribute(this._menu, "popper", "static");
        defaultBsPopperConfig.modifiers = [{
          name: "applyStyles",
          enabled: false
        }];
      }
      return {
        ...defaultBsPopperConfig,
        ...execute(this._config.popperConfig, [void 0, defaultBsPopperConfig])
      };
    }
    _selectMenuItem({
      key,
      target
    }) {
      const items = SelectorEngine.find(SELECTOR_VISIBLE_ITEMS, this._menu).filter((element) => isVisible(element));
      if (!items.length) {
        return;
      }
      getNextActiveElement(items, target, key === ARROW_DOWN_KEY$1, !items.includes(target)).focus();
    }
    // Static
    static jQueryInterface(config2) {
      return this.each(function() {
        const data = _Dropdown.getOrCreateInstance(this, config2);
        if (typeof config2 !== "string") {
          return;
        }
        if (typeof data[config2] === "undefined") {
          throw new TypeError(`No method named "${config2}"`);
        }
        data[config2]();
      });
    }
    static clearMenus(event) {
      if (event.button === RIGHT_MOUSE_BUTTON || event.type === "keyup" && event.key !== TAB_KEY$1) {
        return;
      }
      const openToggles = SelectorEngine.find(SELECTOR_DATA_TOGGLE_SHOWN);
      for (const toggle of openToggles) {
        const context = _Dropdown.getInstance(toggle);
        if (!context || context._config.autoClose === false) {
          continue;
        }
        const composedPath = event.composedPath();
        const isMenuTarget = composedPath.includes(context._menu);
        if (composedPath.includes(context._element) || context._config.autoClose === "inside" && !isMenuTarget || context._config.autoClose === "outside" && isMenuTarget) {
          continue;
        }
        if (context._menu.contains(event.target) && (event.type === "keyup" && event.key === TAB_KEY$1 || /input|select|option|textarea|form/i.test(event.target.tagName))) {
          continue;
        }
        const relatedTarget = {
          relatedTarget: context._element
        };
        if (event.type === "click") {
          relatedTarget.clickEvent = event;
        }
        context._completeHide(relatedTarget);
      }
    }
    static dataApiKeydownHandler(event) {
      const isInput = /input|textarea/i.test(event.target.tagName);
      const isEscapeEvent = event.key === ESCAPE_KEY$2;
      const isUpOrDownEvent = [ARROW_UP_KEY$1, ARROW_DOWN_KEY$1].includes(event.key);
      if (!isUpOrDownEvent && !isEscapeEvent) {
        return;
      }
      if (isInput && !isEscapeEvent) {
        return;
      }
      event.preventDefault();
      const getToggleButton = this.matches(SELECTOR_DATA_TOGGLE$3) ? this : SelectorEngine.prev(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.next(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.findOne(SELECTOR_DATA_TOGGLE$3, event.delegateTarget.parentNode);
      const instance = _Dropdown.getOrCreateInstance(getToggleButton);
      if (isUpOrDownEvent) {
        event.stopPropagation();
        instance.show();
        instance._selectMenuItem(event);
        return;
      }
      if (instance._isShown()) {
        event.stopPropagation();
        instance.hide();
        getToggleButton.focus();
      }
    }
  };
  EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_DATA_TOGGLE$3, Dropdown.dataApiKeydownHandler);
  EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Dropdown.dataApiKeydownHandler);
  EventHandler.on(document, EVENT_CLICK_DATA_API$3, Dropdown.clearMenus);
  EventHandler.on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
  EventHandler.on(document, EVENT_CLICK_DATA_API$3, SELECTOR_DATA_TOGGLE$3, function(event) {
    event.preventDefault();
    Dropdown.getOrCreateInstance(this).toggle();
  });
  defineJQueryPlugin(Dropdown);
  var NAME$9 = "backdrop";
  var CLASS_NAME_FADE$4 = "fade";
  var CLASS_NAME_SHOW$5 = "show";
  var EVENT_MOUSEDOWN = `mousedown.bs.${NAME$9}`;
  var Default$8 = {
    className: "modal-backdrop",
    clickCallback: null,
    isAnimated: false,
    isVisible: true,
    // if false, we use the backdrop helper without adding any element to the dom
    rootElement: "body"
    // give the choice to place backdrop under different elements
  };
  var DefaultType$8 = {
    className: "string",
    clickCallback: "(function|null)",
    isAnimated: "boolean",
    isVisible: "boolean",
    rootElement: "(element|string)"
  };
  var Backdrop = class extends Config2 {
    constructor(config2) {
      super();
      this._config = this._getConfig(config2);
      this._isAppended = false;
      this._element = null;
    }
    // Getters
    static get Default() {
      return Default$8;
    }
    static get DefaultType() {
      return DefaultType$8;
    }
    static get NAME() {
      return NAME$9;
    }
    // Public
    show(callback) {
      if (!this._config.isVisible) {
        execute(callback);
        return;
      }
      this._append();
      const element = this._getElement();
      if (this._config.isAnimated) {
        reflow(element);
      }
      element.classList.add(CLASS_NAME_SHOW$5);
      this._emulateAnimation(() => {
        execute(callback);
      });
    }
    hide(callback) {
      if (!this._config.isVisible) {
        execute(callback);
        return;
      }
      this._getElement().classList.remove(CLASS_NAME_SHOW$5);
      this._emulateAnimation(() => {
        this.dispose();
        execute(callback);
      });
    }
    dispose() {
      if (!this._isAppended) {
        return;
      }
      EventHandler.off(this._element, EVENT_MOUSEDOWN);
      this._element.remove();
      this._isAppended = false;
    }
    // Private
    _getElement() {
      if (!this._element) {
        const backdrop = document.createElement("div");
        backdrop.className = this._config.className;
        if (this._config.isAnimated) {
          backdrop.classList.add(CLASS_NAME_FADE$4);
        }
        this._element = backdrop;
      }
      return this._element;
    }
    _configAfterMerge(config2) {
      config2.rootElement = getElement(config2.rootElement);
      return config2;
    }
    _append() {
      if (this._isAppended) {
        return;
      }
      const element = this._getElement();
      this._config.rootElement.append(element);
      EventHandler.on(element, EVENT_MOUSEDOWN, () => {
        execute(this._config.clickCallback);
      });
      this._isAppended = true;
    }
    _emulateAnimation(callback) {
      executeAfterTransition(callback, this._getElement(), this._config.isAnimated);
    }
  };
  var NAME$8 = "focustrap";
  var DATA_KEY$5 = "bs.focustrap";
  var EVENT_KEY$5 = `.${DATA_KEY$5}`;
  var EVENT_FOCUSIN$2 = `focusin${EVENT_KEY$5}`;
  var EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY$5}`;
  var TAB_KEY = "Tab";
  var TAB_NAV_FORWARD = "forward";
  var TAB_NAV_BACKWARD = "backward";
  var Default$7 = {
    autofocus: true,
    trapElement: null
    // The element to trap focus inside of
  };
  var DefaultType$7 = {
    autofocus: "boolean",
    trapElement: "element"
  };
  var FocusTrap = class extends Config2 {
    constructor(config2) {
      super();
      this._config = this._getConfig(config2);
      this._isActive = false;
      this._lastTabNavDirection = null;
    }
    // Getters
    static get Default() {
      return Default$7;
    }
    static get DefaultType() {
      return DefaultType$7;
    }
    static get NAME() {
      return NAME$8;
    }
    // Public
    activate() {
      if (this._isActive) {
        return;
      }
      if (this._config.autofocus) {
        this._config.trapElement.focus();
      }
      EventHandler.off(document, EVENT_KEY$5);
      EventHandler.on(document, EVENT_FOCUSIN$2, (event) => this._handleFocusin(event));
      EventHandler.on(document, EVENT_KEYDOWN_TAB, (event) => this._handleKeydown(event));
      this._isActive = true;
    }
    deactivate() {
      if (!this._isActive) {
        return;
      }
      this._isActive = false;
      EventHandler.off(document, EVENT_KEY$5);
    }
    // Private
    _handleFocusin(event) {
      const {
        trapElement
      } = this._config;
      if (event.target === document || event.target === trapElement || trapElement.contains(event.target)) {
        return;
      }
      const elements = SelectorEngine.focusableChildren(trapElement);
      if (elements.length === 0) {
        trapElement.focus();
      } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
        elements[elements.length - 1].focus();
      } else {
        elements[0].focus();
      }
    }
    _handleKeydown(event) {
      if (event.key !== TAB_KEY) {
        return;
      }
      this._lastTabNavDirection = event.shiftKey ? TAB_NAV_BACKWARD : TAB_NAV_FORWARD;
    }
  };
  var SELECTOR_FIXED_CONTENT = ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top";
  var SELECTOR_STICKY_CONTENT = ".sticky-top";
  var PROPERTY_PADDING = "padding-right";
  var PROPERTY_MARGIN = "margin-right";
  var ScrollBarHelper = class {
    constructor() {
      this._element = document.body;
    }
    // Public
    getWidth() {
      const documentWidth = document.documentElement.clientWidth;
      return Math.abs(window.innerWidth - documentWidth);
    }
    hide() {
      const width = this.getWidth();
      this._disableOverFlow();
      this._setElementAttributes(this._element, PROPERTY_PADDING, (calculatedValue) => calculatedValue + width);
      this._setElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING, (calculatedValue) => calculatedValue + width);
      this._setElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN, (calculatedValue) => calculatedValue - width);
    }
    reset() {
      this._resetElementAttributes(this._element, "overflow");
      this._resetElementAttributes(this._element, PROPERTY_PADDING);
      this._resetElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING);
      this._resetElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN);
    }
    isOverflowing() {
      return this.getWidth() > 0;
    }
    // Private
    _disableOverFlow() {
      this._saveInitialAttribute(this._element, "overflow");
      this._element.style.overflow = "hidden";
    }
    _setElementAttributes(selector, styleProperty, callback) {
      const scrollbarWidth = this.getWidth();
      const manipulationCallBack = (element) => {
        if (element !== this._element && window.innerWidth > element.clientWidth + scrollbarWidth) {
          return;
        }
        this._saveInitialAttribute(element, styleProperty);
        const calculatedValue = window.getComputedStyle(element).getPropertyValue(styleProperty);
        element.style.setProperty(styleProperty, `${callback(Number.parseFloat(calculatedValue))}px`);
      };
      this._applyManipulationCallback(selector, manipulationCallBack);
    }
    _saveInitialAttribute(element, styleProperty) {
      const actualValue = element.style.getPropertyValue(styleProperty);
      if (actualValue) {
        Manipulator.setDataAttribute(element, styleProperty, actualValue);
      }
    }
    _resetElementAttributes(selector, styleProperty) {
      const manipulationCallBack = (element) => {
        const value = Manipulator.getDataAttribute(element, styleProperty);
        if (value === null) {
          element.style.removeProperty(styleProperty);
          return;
        }
        Manipulator.removeDataAttribute(element, styleProperty);
        element.style.setProperty(styleProperty, value);
      };
      this._applyManipulationCallback(selector, manipulationCallBack);
    }
    _applyManipulationCallback(selector, callBack) {
      if (isElement2(selector)) {
        callBack(selector);
        return;
      }
      for (const sel of SelectorEngine.find(selector, this._element)) {
        callBack(sel);
      }
    }
  };
  var NAME$7 = "modal";
  var DATA_KEY$4 = "bs.modal";
  var EVENT_KEY$4 = `.${DATA_KEY$4}`;
  var DATA_API_KEY$2 = ".data-api";
  var ESCAPE_KEY$1 = "Escape";
  var EVENT_HIDE$4 = `hide${EVENT_KEY$4}`;
  var EVENT_HIDE_PREVENTED$1 = `hidePrevented${EVENT_KEY$4}`;
  var EVENT_HIDDEN$4 = `hidden${EVENT_KEY$4}`;
  var EVENT_SHOW$4 = `show${EVENT_KEY$4}`;
  var EVENT_SHOWN$4 = `shown${EVENT_KEY$4}`;
  var EVENT_RESIZE$1 = `resize${EVENT_KEY$4}`;
  var EVENT_CLICK_DISMISS = `click.dismiss${EVENT_KEY$4}`;
  var EVENT_MOUSEDOWN_DISMISS = `mousedown.dismiss${EVENT_KEY$4}`;
  var EVENT_KEYDOWN_DISMISS$1 = `keydown.dismiss${EVENT_KEY$4}`;
  var EVENT_CLICK_DATA_API$2 = `click${EVENT_KEY$4}${DATA_API_KEY$2}`;
  var CLASS_NAME_OPEN = "modal-open";
  var CLASS_NAME_FADE$3 = "fade";
  var CLASS_NAME_SHOW$4 = "show";
  var CLASS_NAME_STATIC = "modal-static";
  var OPEN_SELECTOR$1 = ".modal.show";
  var SELECTOR_DIALOG = ".modal-dialog";
  var SELECTOR_MODAL_BODY = ".modal-body";
  var SELECTOR_DATA_TOGGLE$2 = '[data-bs-toggle="modal"]';
  var Default$6 = {
    backdrop: true,
    focus: true,
    keyboard: true
  };
  var DefaultType$6 = {
    backdrop: "(boolean|string)",
    focus: "boolean",
    keyboard: "boolean"
  };
  var Modal = class _Modal extends BaseComponent {
    constructor(element, config2) {
      super(element, config2);
      this._dialog = SelectorEngine.findOne(SELECTOR_DIALOG, this._element);
      this._backdrop = this._initializeBackDrop();
      this._focustrap = this._initializeFocusTrap();
      this._isShown = false;
      this._isTransitioning = false;
      this._scrollBar = new ScrollBarHelper();
      this._addEventListeners();
    }
    // Getters
    static get Default() {
      return Default$6;
    }
    static get DefaultType() {
      return DefaultType$6;
    }
    static get NAME() {
      return NAME$7;
    }
    // Public
    toggle(relatedTarget) {
      return this._isShown ? this.hide() : this.show(relatedTarget);
    }
    show(relatedTarget) {
      if (this._isShown || this._isTransitioning) {
        return;
      }
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$4, {
        relatedTarget
      });
      if (showEvent.defaultPrevented) {
        return;
      }
      this._isShown = true;
      this._isTransitioning = true;
      this._scrollBar.hide();
      document.body.classList.add(CLASS_NAME_OPEN);
      this._adjustDialog();
      this._backdrop.show(() => this._showElement(relatedTarget));
    }
    hide() {
      if (!this._isShown || this._isTransitioning) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$4);
      if (hideEvent.defaultPrevented) {
        return;
      }
      this._isShown = false;
      this._isTransitioning = true;
      this._focustrap.deactivate();
      this._element.classList.remove(CLASS_NAME_SHOW$4);
      this._queueCallback(() => this._hideModal(), this._element, this._isAnimated());
    }
    dispose() {
      EventHandler.off(window, EVENT_KEY$4);
      EventHandler.off(this._dialog, EVENT_KEY$4);
      this._backdrop.dispose();
      this._focustrap.deactivate();
      super.dispose();
    }
    handleUpdate() {
      this._adjustDialog();
    }
    // Private
    _initializeBackDrop() {
      return new Backdrop({
        isVisible: Boolean(this._config.backdrop),
        // 'static' option will be translated to true, and booleans will keep their value,
        isAnimated: this._isAnimated()
      });
    }
    _initializeFocusTrap() {
      return new FocusTrap({
        trapElement: this._element
      });
    }
    _showElement(relatedTarget) {
      if (!document.body.contains(this._element)) {
        document.body.append(this._element);
      }
      this._element.style.display = "block";
      this._element.removeAttribute("aria-hidden");
      this._element.setAttribute("aria-modal", true);
      this._element.setAttribute("role", "dialog");
      this._element.scrollTop = 0;
      const modalBody = SelectorEngine.findOne(SELECTOR_MODAL_BODY, this._dialog);
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
      reflow(this._element);
      this._element.classList.add(CLASS_NAME_SHOW$4);
      const transitionComplete = () => {
        if (this._config.focus) {
          this._focustrap.activate();
        }
        this._isTransitioning = false;
        EventHandler.trigger(this._element, EVENT_SHOWN$4, {
          relatedTarget
        });
      };
      this._queueCallback(transitionComplete, this._dialog, this._isAnimated());
    }
    _addEventListeners() {
      EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS$1, (event) => {
        if (event.key !== ESCAPE_KEY$1) {
          return;
        }
        if (this._config.keyboard) {
          this.hide();
          return;
        }
        this._triggerBackdropTransition();
      });
      EventHandler.on(window, EVENT_RESIZE$1, () => {
        if (this._isShown && !this._isTransitioning) {
          this._adjustDialog();
        }
      });
      EventHandler.on(this._element, EVENT_MOUSEDOWN_DISMISS, (event) => {
        EventHandler.one(this._element, EVENT_CLICK_DISMISS, (event2) => {
          if (this._element !== event.target || this._element !== event2.target) {
            return;
          }
          if (this._config.backdrop === "static") {
            this._triggerBackdropTransition();
            return;
          }
          if (this._config.backdrop) {
            this.hide();
          }
        });
      });
    }
    _hideModal() {
      this._element.style.display = "none";
      this._element.setAttribute("aria-hidden", true);
      this._element.removeAttribute("aria-modal");
      this._element.removeAttribute("role");
      this._isTransitioning = false;
      this._backdrop.hide(() => {
        document.body.classList.remove(CLASS_NAME_OPEN);
        this._resetAdjustments();
        this._scrollBar.reset();
        EventHandler.trigger(this._element, EVENT_HIDDEN$4);
      });
    }
    _isAnimated() {
      return this._element.classList.contains(CLASS_NAME_FADE$3);
    }
    _triggerBackdropTransition() {
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED$1);
      if (hideEvent.defaultPrevented) {
        return;
      }
      const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
      const initialOverflowY = this._element.style.overflowY;
      if (initialOverflowY === "hidden" || this._element.classList.contains(CLASS_NAME_STATIC)) {
        return;
      }
      if (!isModalOverflowing) {
        this._element.style.overflowY = "hidden";
      }
      this._element.classList.add(CLASS_NAME_STATIC);
      this._queueCallback(() => {
        this._element.classList.remove(CLASS_NAME_STATIC);
        this._queueCallback(() => {
          this._element.style.overflowY = initialOverflowY;
        }, this._dialog);
      }, this._dialog);
      this._element.focus();
    }
    /**
     * The following methods are used to handle overflowing modals
     */
    _adjustDialog() {
      const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
      const scrollbarWidth = this._scrollBar.getWidth();
      const isBodyOverflowing = scrollbarWidth > 0;
      if (isBodyOverflowing && !isModalOverflowing) {
        const property = isRTL() ? "paddingLeft" : "paddingRight";
        this._element.style[property] = `${scrollbarWidth}px`;
      }
      if (!isBodyOverflowing && isModalOverflowing) {
        const property = isRTL() ? "paddingRight" : "paddingLeft";
        this._element.style[property] = `${scrollbarWidth}px`;
      }
    }
    _resetAdjustments() {
      this._element.style.paddingLeft = "";
      this._element.style.paddingRight = "";
    }
    // Static
    static jQueryInterface(config2, relatedTarget) {
      return this.each(function() {
        const data = _Modal.getOrCreateInstance(this, config2);
        if (typeof config2 !== "string") {
          return;
        }
        if (typeof data[config2] === "undefined") {
          throw new TypeError(`No method named "${config2}"`);
        }
        data[config2](relatedTarget);
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API$2, SELECTOR_DATA_TOGGLE$2, function(event) {
    const target = SelectorEngine.getElementFromSelector(this);
    if (["A", "AREA"].includes(this.tagName)) {
      event.preventDefault();
    }
    EventHandler.one(target, EVENT_SHOW$4, (showEvent) => {
      if (showEvent.defaultPrevented) {
        return;
      }
      EventHandler.one(target, EVENT_HIDDEN$4, () => {
        if (isVisible(this)) {
          this.focus();
        }
      });
    });
    const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR$1);
    if (alreadyOpen) {
      Modal.getInstance(alreadyOpen).hide();
    }
    const data = Modal.getOrCreateInstance(target);
    data.toggle(this);
  });
  enableDismissTrigger(Modal);
  defineJQueryPlugin(Modal);
  var NAME$6 = "offcanvas";
  var DATA_KEY$3 = "bs.offcanvas";
  var EVENT_KEY$3 = `.${DATA_KEY$3}`;
  var DATA_API_KEY$1 = ".data-api";
  var EVENT_LOAD_DATA_API$2 = `load${EVENT_KEY$3}${DATA_API_KEY$1}`;
  var ESCAPE_KEY = "Escape";
  var CLASS_NAME_SHOW$3 = "show";
  var CLASS_NAME_SHOWING$1 = "showing";
  var CLASS_NAME_HIDING = "hiding";
  var CLASS_NAME_BACKDROP = "offcanvas-backdrop";
  var OPEN_SELECTOR = ".offcanvas.show";
  var EVENT_SHOW$3 = `show${EVENT_KEY$3}`;
  var EVENT_SHOWN$3 = `shown${EVENT_KEY$3}`;
  var EVENT_HIDE$3 = `hide${EVENT_KEY$3}`;
  var EVENT_HIDE_PREVENTED = `hidePrevented${EVENT_KEY$3}`;
  var EVENT_HIDDEN$3 = `hidden${EVENT_KEY$3}`;
  var EVENT_RESIZE = `resize${EVENT_KEY$3}`;
  var EVENT_CLICK_DATA_API$1 = `click${EVENT_KEY$3}${DATA_API_KEY$1}`;
  var EVENT_KEYDOWN_DISMISS = `keydown.dismiss${EVENT_KEY$3}`;
  var SELECTOR_DATA_TOGGLE$1 = '[data-bs-toggle="offcanvas"]';
  var Default$5 = {
    backdrop: true,
    keyboard: true,
    scroll: false
  };
  var DefaultType$5 = {
    backdrop: "(boolean|string)",
    keyboard: "boolean",
    scroll: "boolean"
  };
  var Offcanvas = class _Offcanvas extends BaseComponent {
    constructor(element, config2) {
      super(element, config2);
      this._isShown = false;
      this._backdrop = this._initializeBackDrop();
      this._focustrap = this._initializeFocusTrap();
      this._addEventListeners();
    }
    // Getters
    static get Default() {
      return Default$5;
    }
    static get DefaultType() {
      return DefaultType$5;
    }
    static get NAME() {
      return NAME$6;
    }
    // Public
    toggle(relatedTarget) {
      return this._isShown ? this.hide() : this.show(relatedTarget);
    }
    show(relatedTarget) {
      if (this._isShown) {
        return;
      }
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$3, {
        relatedTarget
      });
      if (showEvent.defaultPrevented) {
        return;
      }
      this._isShown = true;
      this._backdrop.show();
      if (!this._config.scroll) {
        new ScrollBarHelper().hide();
      }
      this._element.setAttribute("aria-modal", true);
      this._element.setAttribute("role", "dialog");
      this._element.classList.add(CLASS_NAME_SHOWING$1);
      const completeCallBack = () => {
        if (!this._config.scroll || this._config.backdrop) {
          this._focustrap.activate();
        }
        this._element.classList.add(CLASS_NAME_SHOW$3);
        this._element.classList.remove(CLASS_NAME_SHOWING$1);
        EventHandler.trigger(this._element, EVENT_SHOWN$3, {
          relatedTarget
        });
      };
      this._queueCallback(completeCallBack, this._element, true);
    }
    hide() {
      if (!this._isShown) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$3);
      if (hideEvent.defaultPrevented) {
        return;
      }
      this._focustrap.deactivate();
      this._element.blur();
      this._isShown = false;
      this._element.classList.add(CLASS_NAME_HIDING);
      this._backdrop.hide();
      const completeCallback = () => {
        this._element.classList.remove(CLASS_NAME_SHOW$3, CLASS_NAME_HIDING);
        this._element.removeAttribute("aria-modal");
        this._element.removeAttribute("role");
        if (!this._config.scroll) {
          new ScrollBarHelper().reset();
        }
        EventHandler.trigger(this._element, EVENT_HIDDEN$3);
      };
      this._queueCallback(completeCallback, this._element, true);
    }
    dispose() {
      this._backdrop.dispose();
      this._focustrap.deactivate();
      super.dispose();
    }
    // Private
    _initializeBackDrop() {
      const clickCallback = () => {
        if (this._config.backdrop === "static") {
          EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
          return;
        }
        this.hide();
      };
      const isVisible2 = Boolean(this._config.backdrop);
      return new Backdrop({
        className: CLASS_NAME_BACKDROP,
        isVisible: isVisible2,
        isAnimated: true,
        rootElement: this._element.parentNode,
        clickCallback: isVisible2 ? clickCallback : null
      });
    }
    _initializeFocusTrap() {
      return new FocusTrap({
        trapElement: this._element
      });
    }
    _addEventListeners() {
      EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS, (event) => {
        if (event.key !== ESCAPE_KEY) {
          return;
        }
        if (this._config.keyboard) {
          this.hide();
          return;
        }
        EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
      });
    }
    // Static
    static jQueryInterface(config2) {
      return this.each(function() {
        const data = _Offcanvas.getOrCreateInstance(this, config2);
        if (typeof config2 !== "string") {
          return;
        }
        if (data[config2] === void 0 || config2.startsWith("_") || config2 === "constructor") {
          throw new TypeError(`No method named "${config2}"`);
        }
        data[config2](this);
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API$1, SELECTOR_DATA_TOGGLE$1, function(event) {
    const target = SelectorEngine.getElementFromSelector(this);
    if (["A", "AREA"].includes(this.tagName)) {
      event.preventDefault();
    }
    if (isDisabled(this)) {
      return;
    }
    EventHandler.one(target, EVENT_HIDDEN$3, () => {
      if (isVisible(this)) {
        this.focus();
      }
    });
    const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR);
    if (alreadyOpen && alreadyOpen !== target) {
      Offcanvas.getInstance(alreadyOpen).hide();
    }
    const data = Offcanvas.getOrCreateInstance(target);
    data.toggle(this);
  });
  EventHandler.on(window, EVENT_LOAD_DATA_API$2, () => {
    for (const selector of SelectorEngine.find(OPEN_SELECTOR)) {
      Offcanvas.getOrCreateInstance(selector).show();
    }
  });
  EventHandler.on(window, EVENT_RESIZE, () => {
    for (const element of SelectorEngine.find("[aria-modal][class*=show][class*=offcanvas-]")) {
      if (getComputedStyle(element).position !== "fixed") {
        Offcanvas.getOrCreateInstance(element).hide();
      }
    }
  });
  enableDismissTrigger(Offcanvas);
  defineJQueryPlugin(Offcanvas);
  var ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;
  var DefaultAllowlist = {
    // Global attributes allowed on any supplied element below.
    "*": ["class", "dir", "id", "lang", "role", ARIA_ATTRIBUTE_PATTERN],
    a: ["target", "href", "title", "rel"],
    area: [],
    b: [],
    br: [],
    col: [],
    code: [],
    dd: [],
    div: [],
    dl: [],
    dt: [],
    em: [],
    hr: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    i: [],
    img: ["src", "srcset", "alt", "title", "width", "height"],
    li: [],
    ol: [],
    p: [],
    pre: [],
    s: [],
    small: [],
    span: [],
    sub: [],
    sup: [],
    strong: [],
    u: [],
    ul: []
  };
  var uriAttributes = /* @__PURE__ */ new Set(["background", "cite", "href", "itemtype", "longdesc", "poster", "src", "xlink:href"]);
  var SAFE_URL_PATTERN = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:/?#]*(?:[/?#]|$))/i;
  var allowedAttribute = (attribute, allowedAttributeList) => {
    const attributeName = attribute.nodeName.toLowerCase();
    if (allowedAttributeList.includes(attributeName)) {
      if (uriAttributes.has(attributeName)) {
        return Boolean(SAFE_URL_PATTERN.test(attribute.nodeValue));
      }
      return true;
    }
    return allowedAttributeList.filter((attributeRegex) => attributeRegex instanceof RegExp).some((regex) => regex.test(attributeName));
  };
  function sanitizeHtml(unsafeHtml, allowList, sanitizeFunction) {
    if (!unsafeHtml.length) {
      return unsafeHtml;
    }
    if (sanitizeFunction && typeof sanitizeFunction === "function") {
      return sanitizeFunction(unsafeHtml);
    }
    const domParser = new window.DOMParser();
    const createdDocument = domParser.parseFromString(unsafeHtml, "text/html");
    const elements = [].concat(...createdDocument.body.querySelectorAll("*"));
    for (const element of elements) {
      const elementName = element.nodeName.toLowerCase();
      if (!Object.keys(allowList).includes(elementName)) {
        element.remove();
        continue;
      }
      const attributeList = [].concat(...element.attributes);
      const allowedAttributes = [].concat(allowList["*"] || [], allowList[elementName] || []);
      for (const attribute of attributeList) {
        if (!allowedAttribute(attribute, allowedAttributes)) {
          element.removeAttribute(attribute.nodeName);
        }
      }
    }
    return createdDocument.body.innerHTML;
  }
  var NAME$5 = "TemplateFactory";
  var Default$4 = {
    allowList: DefaultAllowlist,
    content: {},
    // { selector : text ,  selector2 : text2 , }
    extraClass: "",
    html: false,
    sanitize: true,
    sanitizeFn: null,
    template: "<div></div>"
  };
  var DefaultType$4 = {
    allowList: "object",
    content: "object",
    extraClass: "(string|function)",
    html: "boolean",
    sanitize: "boolean",
    sanitizeFn: "(null|function)",
    template: "string"
  };
  var DefaultContentType = {
    entry: "(string|element|function|null)",
    selector: "(string|element)"
  };
  var TemplateFactory = class extends Config2 {
    constructor(config2) {
      super();
      this._config = this._getConfig(config2);
    }
    // Getters
    static get Default() {
      return Default$4;
    }
    static get DefaultType() {
      return DefaultType$4;
    }
    static get NAME() {
      return NAME$5;
    }
    // Public
    getContent() {
      return Object.values(this._config.content).map((config2) => this._resolvePossibleFunction(config2)).filter(Boolean);
    }
    hasContent() {
      return this.getContent().length > 0;
    }
    changeContent(content) {
      this._checkContent(content);
      this._config.content = {
        ...this._config.content,
        ...content
      };
      return this;
    }
    toHtml() {
      const templateWrapper = document.createElement("div");
      templateWrapper.innerHTML = this._maybeSanitize(this._config.template);
      for (const [selector, text] of Object.entries(this._config.content)) {
        this._setContent(templateWrapper, text, selector);
      }
      const template = templateWrapper.children[0];
      const extraClass = this._resolvePossibleFunction(this._config.extraClass);
      if (extraClass) {
        template.classList.add(...extraClass.split(" "));
      }
      return template;
    }
    // Private
    _typeCheckConfig(config2) {
      super._typeCheckConfig(config2);
      this._checkContent(config2.content);
    }
    _checkContent(arg) {
      for (const [selector, content] of Object.entries(arg)) {
        super._typeCheckConfig({
          selector,
          entry: content
        }, DefaultContentType);
      }
    }
    _setContent(template, content, selector) {
      const templateElement = SelectorEngine.findOne(selector, template);
      if (!templateElement) {
        return;
      }
      content = this._resolvePossibleFunction(content);
      if (!content) {
        templateElement.remove();
        return;
      }
      if (isElement2(content)) {
        this._putElementInTemplate(getElement(content), templateElement);
        return;
      }
      if (this._config.html) {
        templateElement.innerHTML = this._maybeSanitize(content);
        return;
      }
      templateElement.textContent = content;
    }
    _maybeSanitize(arg) {
      return this._config.sanitize ? sanitizeHtml(arg, this._config.allowList, this._config.sanitizeFn) : arg;
    }
    _resolvePossibleFunction(arg) {
      return execute(arg, [void 0, this]);
    }
    _putElementInTemplate(element, templateElement) {
      if (this._config.html) {
        templateElement.innerHTML = "";
        templateElement.append(element);
        return;
      }
      templateElement.textContent = element.textContent;
    }
  };
  var NAME$4 = "tooltip";
  var DISALLOWED_ATTRIBUTES = /* @__PURE__ */ new Set(["sanitize", "allowList", "sanitizeFn"]);
  var CLASS_NAME_FADE$2 = "fade";
  var CLASS_NAME_MODAL = "modal";
  var CLASS_NAME_SHOW$2 = "show";
  var SELECTOR_TOOLTIP_INNER = ".tooltip-inner";
  var SELECTOR_MODAL = `.${CLASS_NAME_MODAL}`;
  var EVENT_MODAL_HIDE = "hide.bs.modal";
  var TRIGGER_HOVER = "hover";
  var TRIGGER_FOCUS = "focus";
  var TRIGGER_CLICK = "click";
  var TRIGGER_MANUAL = "manual";
  var EVENT_HIDE$2 = "hide";
  var EVENT_HIDDEN$2 = "hidden";
  var EVENT_SHOW$2 = "show";
  var EVENT_SHOWN$2 = "shown";
  var EVENT_INSERTED = "inserted";
  var EVENT_CLICK$1 = "click";
  var EVENT_FOCUSIN$1 = "focusin";
  var EVENT_FOCUSOUT$1 = "focusout";
  var EVENT_MOUSEENTER = "mouseenter";
  var EVENT_MOUSELEAVE = "mouseleave";
  var AttachmentMap = {
    AUTO: "auto",
    TOP: "top",
    RIGHT: isRTL() ? "left" : "right",
    BOTTOM: "bottom",
    LEFT: isRTL() ? "right" : "left"
  };
  var Default$3 = {
    allowList: DefaultAllowlist,
    animation: true,
    boundary: "clippingParents",
    container: false,
    customClass: "",
    delay: 0,
    fallbackPlacements: ["top", "right", "bottom", "left"],
    html: false,
    offset: [0, 6],
    placement: "top",
    popperConfig: null,
    sanitize: true,
    sanitizeFn: null,
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    title: "",
    trigger: "hover focus"
  };
  var DefaultType$3 = {
    allowList: "object",
    animation: "boolean",
    boundary: "(string|element)",
    container: "(string|element|boolean)",
    customClass: "(string|function)",
    delay: "(number|object)",
    fallbackPlacements: "array",
    html: "boolean",
    offset: "(array|string|function)",
    placement: "(string|function)",
    popperConfig: "(null|object|function)",
    sanitize: "boolean",
    sanitizeFn: "(null|function)",
    selector: "(string|boolean)",
    template: "string",
    title: "(string|element|function)",
    trigger: "string"
  };
  var Tooltip = class _Tooltip extends BaseComponent {
    constructor(element, config2) {
      if (typeof lib_exports === "undefined") {
        throw new TypeError("Bootstrap's tooltips require Popper (https://popper.js.org/docs/v2/)");
      }
      super(element, config2);
      this._isEnabled = true;
      this._timeout = 0;
      this._isHovered = null;
      this._activeTrigger = {};
      this._popper = null;
      this._templateFactory = null;
      this._newContent = null;
      this.tip = null;
      this._setListeners();
      if (!this._config.selector) {
        this._fixTitle();
      }
    }
    // Getters
    static get Default() {
      return Default$3;
    }
    static get DefaultType() {
      return DefaultType$3;
    }
    static get NAME() {
      return NAME$4;
    }
    // Public
    enable() {
      this._isEnabled = true;
    }
    disable() {
      this._isEnabled = false;
    }
    toggleEnabled() {
      this._isEnabled = !this._isEnabled;
    }
    toggle() {
      if (!this._isEnabled) {
        return;
      }
      if (this._isShown()) {
        this._leave();
        return;
      }
      this._enter();
    }
    dispose() {
      clearTimeout(this._timeout);
      EventHandler.off(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
      if (this._element.getAttribute("data-bs-original-title")) {
        this._element.setAttribute("title", this._element.getAttribute("data-bs-original-title"));
      }
      this._disposePopper();
      super.dispose();
    }
    show() {
      if (this._element.style.display === "none") {
        throw new Error("Please use show on visible elements");
      }
      if (!(this._isWithContent() && this._isEnabled)) {
        return;
      }
      const showEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOW$2));
      const shadowRoot = findShadowRoot(this._element);
      const isInTheDom = (shadowRoot || this._element.ownerDocument.documentElement).contains(this._element);
      if (showEvent.defaultPrevented || !isInTheDom) {
        return;
      }
      this._disposePopper();
      const tip = this._getTipElement();
      this._element.setAttribute("aria-describedby", tip.getAttribute("id"));
      const {
        container
      } = this._config;
      if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
        container.append(tip);
        EventHandler.trigger(this._element, this.constructor.eventName(EVENT_INSERTED));
      }
      this._popper = this._createPopper(tip);
      tip.classList.add(CLASS_NAME_SHOW$2);
      if ("ontouchstart" in document.documentElement) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.on(element, "mouseover", noop);
        }
      }
      const complete = () => {
        EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOWN$2));
        if (this._isHovered === false) {
          this._leave();
        }
        this._isHovered = false;
      };
      this._queueCallback(complete, this.tip, this._isAnimated());
    }
    hide() {
      if (!this._isShown()) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDE$2));
      if (hideEvent.defaultPrevented) {
        return;
      }
      const tip = this._getTipElement();
      tip.classList.remove(CLASS_NAME_SHOW$2);
      if ("ontouchstart" in document.documentElement) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.off(element, "mouseover", noop);
        }
      }
      this._activeTrigger[TRIGGER_CLICK] = false;
      this._activeTrigger[TRIGGER_FOCUS] = false;
      this._activeTrigger[TRIGGER_HOVER] = false;
      this._isHovered = null;
      const complete = () => {
        if (this._isWithActiveTrigger()) {
          return;
        }
        if (!this._isHovered) {
          this._disposePopper();
        }
        this._element.removeAttribute("aria-describedby");
        EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDDEN$2));
      };
      this._queueCallback(complete, this.tip, this._isAnimated());
    }
    update() {
      if (this._popper) {
        this._popper.update();
      }
    }
    // Protected
    _isWithContent() {
      return Boolean(this._getTitle());
    }
    _getTipElement() {
      if (!this.tip) {
        this.tip = this._createTipElement(this._newContent || this._getContentForTemplate());
      }
      return this.tip;
    }
    _createTipElement(content) {
      const tip = this._getTemplateFactory(content).toHtml();
      if (!tip) {
        return null;
      }
      tip.classList.remove(CLASS_NAME_FADE$2, CLASS_NAME_SHOW$2);
      tip.classList.add(`bs-${this.constructor.NAME}-auto`);
      const tipId = getUID(this.constructor.NAME).toString();
      tip.setAttribute("id", tipId);
      if (this._isAnimated()) {
        tip.classList.add(CLASS_NAME_FADE$2);
      }
      return tip;
    }
    setContent(content) {
      this._newContent = content;
      if (this._isShown()) {
        this._disposePopper();
        this.show();
      }
    }
    _getTemplateFactory(content) {
      if (this._templateFactory) {
        this._templateFactory.changeContent(content);
      } else {
        this._templateFactory = new TemplateFactory({
          ...this._config,
          // the `content` var has to be after `this._config`
          // to override config.content in case of popover
          content,
          extraClass: this._resolvePossibleFunction(this._config.customClass)
        });
      }
      return this._templateFactory;
    }
    _getContentForTemplate() {
      return {
        [SELECTOR_TOOLTIP_INNER]: this._getTitle()
      };
    }
    _getTitle() {
      return this._resolvePossibleFunction(this._config.title) || this._element.getAttribute("data-bs-original-title");
    }
    // Private
    _initializeOnDelegatedTarget(event) {
      return this.constructor.getOrCreateInstance(event.delegateTarget, this._getDelegateConfig());
    }
    _isAnimated() {
      return this._config.animation || this.tip && this.tip.classList.contains(CLASS_NAME_FADE$2);
    }
    _isShown() {
      return this.tip && this.tip.classList.contains(CLASS_NAME_SHOW$2);
    }
    _createPopper(tip) {
      const placement = execute(this._config.placement, [this, tip, this._element]);
      const attachment = AttachmentMap[placement.toUpperCase()];
      return createPopper3(this._element, tip, this._getPopperConfig(attachment));
    }
    _getOffset() {
      const {
        offset: offset2
      } = this._config;
      if (typeof offset2 === "string") {
        return offset2.split(",").map((value) => Number.parseInt(value, 10));
      }
      if (typeof offset2 === "function") {
        return (popperData) => offset2(popperData, this._element);
      }
      return offset2;
    }
    _resolvePossibleFunction(arg) {
      return execute(arg, [this._element, this._element]);
    }
    _getPopperConfig(attachment) {
      const defaultBsPopperConfig = {
        placement: attachment,
        modifiers: [{
          name: "flip",
          options: {
            fallbackPlacements: this._config.fallbackPlacements
          }
        }, {
          name: "offset",
          options: {
            offset: this._getOffset()
          }
        }, {
          name: "preventOverflow",
          options: {
            boundary: this._config.boundary
          }
        }, {
          name: "arrow",
          options: {
            element: `.${this.constructor.NAME}-arrow`
          }
        }, {
          name: "preSetPlacement",
          enabled: true,
          phase: "beforeMain",
          fn: (data) => {
            this._getTipElement().setAttribute("data-popper-placement", data.state.placement);
          }
        }]
      };
      return {
        ...defaultBsPopperConfig,
        ...execute(this._config.popperConfig, [void 0, defaultBsPopperConfig])
      };
    }
    _setListeners() {
      const triggers = this._config.trigger.split(" ");
      for (const trigger of triggers) {
        if (trigger === "click") {
          EventHandler.on(this._element, this.constructor.eventName(EVENT_CLICK$1), this._config.selector, (event) => {
            const context = this._initializeOnDelegatedTarget(event);
            context._activeTrigger[TRIGGER_CLICK] = !(context._isShown() && context._activeTrigger[TRIGGER_CLICK]);
            context.toggle();
          });
        } else if (trigger !== TRIGGER_MANUAL) {
          const eventIn = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSEENTER) : this.constructor.eventName(EVENT_FOCUSIN$1);
          const eventOut = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSELEAVE) : this.constructor.eventName(EVENT_FOCUSOUT$1);
          EventHandler.on(this._element, eventIn, this._config.selector, (event) => {
            const context = this._initializeOnDelegatedTarget(event);
            context._activeTrigger[event.type === "focusin" ? TRIGGER_FOCUS : TRIGGER_HOVER] = true;
            context._enter();
          });
          EventHandler.on(this._element, eventOut, this._config.selector, (event) => {
            const context = this._initializeOnDelegatedTarget(event);
            context._activeTrigger[event.type === "focusout" ? TRIGGER_FOCUS : TRIGGER_HOVER] = context._element.contains(event.relatedTarget);
            context._leave();
          });
        }
      }
      this._hideModalHandler = () => {
        if (this._element) {
          this.hide();
        }
      };
      EventHandler.on(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
    }
    _fixTitle() {
      const title = this._element.getAttribute("title");
      if (!title) {
        return;
      }
      if (!this._element.getAttribute("aria-label") && !this._element.textContent.trim()) {
        this._element.setAttribute("aria-label", title);
      }
      this._element.setAttribute("data-bs-original-title", title);
      this._element.removeAttribute("title");
    }
    _enter() {
      if (this._isShown() || this._isHovered) {
        this._isHovered = true;
        return;
      }
      this._isHovered = true;
      this._setTimeout(() => {
        if (this._isHovered) {
          this.show();
        }
      }, this._config.delay.show);
    }
    _leave() {
      if (this._isWithActiveTrigger()) {
        return;
      }
      this._isHovered = false;
      this._setTimeout(() => {
        if (!this._isHovered) {
          this.hide();
        }
      }, this._config.delay.hide);
    }
    _setTimeout(handler, timeout2) {
      clearTimeout(this._timeout);
      this._timeout = setTimeout(handler, timeout2);
    }
    _isWithActiveTrigger() {
      return Object.values(this._activeTrigger).includes(true);
    }
    _getConfig(config2) {
      const dataAttributes = Manipulator.getDataAttributes(this._element);
      for (const dataAttribute of Object.keys(dataAttributes)) {
        if (DISALLOWED_ATTRIBUTES.has(dataAttribute)) {
          delete dataAttributes[dataAttribute];
        }
      }
      config2 = {
        ...dataAttributes,
        ...typeof config2 === "object" && config2 ? config2 : {}
      };
      config2 = this._mergeConfigObj(config2);
      config2 = this._configAfterMerge(config2);
      this._typeCheckConfig(config2);
      return config2;
    }
    _configAfterMerge(config2) {
      config2.container = config2.container === false ? document.body : getElement(config2.container);
      if (typeof config2.delay === "number") {
        config2.delay = {
          show: config2.delay,
          hide: config2.delay
        };
      }
      if (typeof config2.title === "number") {
        config2.title = config2.title.toString();
      }
      if (typeof config2.content === "number") {
        config2.content = config2.content.toString();
      }
      return config2;
    }
    _getDelegateConfig() {
      const config2 = {};
      for (const [key, value] of Object.entries(this._config)) {
        if (this.constructor.Default[key] !== value) {
          config2[key] = value;
        }
      }
      config2.selector = false;
      config2.trigger = "manual";
      return config2;
    }
    _disposePopper() {
      if (this._popper) {
        this._popper.destroy();
        this._popper = null;
      }
      if (this.tip) {
        this.tip.remove();
        this.tip = null;
      }
    }
    // Static
    static jQueryInterface(config2) {
      return this.each(function() {
        const data = _Tooltip.getOrCreateInstance(this, config2);
        if (typeof config2 !== "string") {
          return;
        }
        if (typeof data[config2] === "undefined") {
          throw new TypeError(`No method named "${config2}"`);
        }
        data[config2]();
      });
    }
  };
  defineJQueryPlugin(Tooltip);
  var NAME$3 = "popover";
  var SELECTOR_TITLE = ".popover-header";
  var SELECTOR_CONTENT = ".popover-body";
  var Default$2 = {
    ...Tooltip.Default,
    content: "",
    offset: [0, 8],
    placement: "right",
    template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
    trigger: "click"
  };
  var DefaultType$2 = {
    ...Tooltip.DefaultType,
    content: "(null|string|element|function)"
  };
  var Popover = class _Popover extends Tooltip {
    // Getters
    static get Default() {
      return Default$2;
    }
    static get DefaultType() {
      return DefaultType$2;
    }
    static get NAME() {
      return NAME$3;
    }
    // Overrides
    _isWithContent() {
      return this._getTitle() || this._getContent();
    }
    // Private
    _getContentForTemplate() {
      return {
        [SELECTOR_TITLE]: this._getTitle(),
        [SELECTOR_CONTENT]: this._getContent()
      };
    }
    _getContent() {
      return this._resolvePossibleFunction(this._config.content);
    }
    // Static
    static jQueryInterface(config2) {
      return this.each(function() {
        const data = _Popover.getOrCreateInstance(this, config2);
        if (typeof config2 !== "string") {
          return;
        }
        if (typeof data[config2] === "undefined") {
          throw new TypeError(`No method named "${config2}"`);
        }
        data[config2]();
      });
    }
  };
  defineJQueryPlugin(Popover);
  var NAME$2 = "scrollspy";
  var DATA_KEY$2 = "bs.scrollspy";
  var EVENT_KEY$2 = `.${DATA_KEY$2}`;
  var DATA_API_KEY = ".data-api";
  var EVENT_ACTIVATE = `activate${EVENT_KEY$2}`;
  var EVENT_CLICK = `click${EVENT_KEY$2}`;
  var EVENT_LOAD_DATA_API$1 = `load${EVENT_KEY$2}${DATA_API_KEY}`;
  var CLASS_NAME_DROPDOWN_ITEM = "dropdown-item";
  var CLASS_NAME_ACTIVE$1 = "active";
  var SELECTOR_DATA_SPY = '[data-bs-spy="scroll"]';
  var SELECTOR_TARGET_LINKS = "[href]";
  var SELECTOR_NAV_LIST_GROUP = ".nav, .list-group";
  var SELECTOR_NAV_LINKS = ".nav-link";
  var SELECTOR_NAV_ITEMS = ".nav-item";
  var SELECTOR_LIST_ITEMS = ".list-group-item";
  var SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, ${SELECTOR_NAV_ITEMS} > ${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`;
  var SELECTOR_DROPDOWN = ".dropdown";
  var SELECTOR_DROPDOWN_TOGGLE$1 = ".dropdown-toggle";
  var Default$1 = {
    offset: null,
    // TODO: v6 @deprecated, keep it for backwards compatibility reasons
    rootMargin: "0px 0px -25%",
    smoothScroll: false,
    target: null,
    threshold: [0.1, 0.5, 1]
  };
  var DefaultType$1 = {
    offset: "(number|null)",
    // TODO v6 @deprecated, keep it for backwards compatibility reasons
    rootMargin: "string",
    smoothScroll: "boolean",
    target: "element",
    threshold: "array"
  };
  var ScrollSpy = class _ScrollSpy extends BaseComponent {
    constructor(element, config2) {
      super(element, config2);
      this._targetLinks = /* @__PURE__ */ new Map();
      this._observableSections = /* @__PURE__ */ new Map();
      this._rootElement = getComputedStyle(this._element).overflowY === "visible" ? null : this._element;
      this._activeTarget = null;
      this._observer = null;
      this._previousScrollData = {
        visibleEntryTop: 0,
        parentScrollTop: 0
      };
      this.refresh();
    }
    // Getters
    static get Default() {
      return Default$1;
    }
    static get DefaultType() {
      return DefaultType$1;
    }
    static get NAME() {
      return NAME$2;
    }
    // Public
    refresh() {
      this._initializeTargetsAndObservables();
      this._maybeEnableSmoothScroll();
      if (this._observer) {
        this._observer.disconnect();
      } else {
        this._observer = this._getNewObserver();
      }
      for (const section of this._observableSections.values()) {
        this._observer.observe(section);
      }
    }
    dispose() {
      this._observer.disconnect();
      super.dispose();
    }
    // Private
    _configAfterMerge(config2) {
      config2.target = getElement(config2.target) || document.body;
      config2.rootMargin = config2.offset ? `${config2.offset}px 0px -30%` : config2.rootMargin;
      if (typeof config2.threshold === "string") {
        config2.threshold = config2.threshold.split(",").map((value) => Number.parseFloat(value));
      }
      return config2;
    }
    _maybeEnableSmoothScroll() {
      if (!this._config.smoothScroll) {
        return;
      }
      EventHandler.off(this._config.target, EVENT_CLICK);
      EventHandler.on(this._config.target, EVENT_CLICK, SELECTOR_TARGET_LINKS, (event) => {
        const observableSection = this._observableSections.get(event.target.hash);
        if (observableSection) {
          event.preventDefault();
          const root = this._rootElement || window;
          const height = observableSection.offsetTop - this._element.offsetTop;
          if (root.scrollTo) {
            root.scrollTo({
              top: height,
              behavior: "smooth"
            });
            return;
          }
          root.scrollTop = height;
        }
      });
    }
    _getNewObserver() {
      const options = {
        root: this._rootElement,
        threshold: this._config.threshold,
        rootMargin: this._config.rootMargin
      };
      return new IntersectionObserver((entries) => this._observerCallback(entries), options);
    }
    // The logic of selection
    _observerCallback(entries) {
      const targetElement = (entry) => this._targetLinks.get(`#${entry.target.id}`);
      const activate = (entry) => {
        this._previousScrollData.visibleEntryTop = entry.target.offsetTop;
        this._process(targetElement(entry));
      };
      const parentScrollTop = (this._rootElement || document.documentElement).scrollTop;
      const userScrollsDown = parentScrollTop >= this._previousScrollData.parentScrollTop;
      this._previousScrollData.parentScrollTop = parentScrollTop;
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          this._activeTarget = null;
          this._clearActiveClass(targetElement(entry));
          continue;
        }
        const entryIsLowerThanPrevious = entry.target.offsetTop >= this._previousScrollData.visibleEntryTop;
        if (userScrollsDown && entryIsLowerThanPrevious) {
          activate(entry);
          if (!parentScrollTop) {
            return;
          }
          continue;
        }
        if (!userScrollsDown && !entryIsLowerThanPrevious) {
          activate(entry);
        }
      }
    }
    _initializeTargetsAndObservables() {
      this._targetLinks = /* @__PURE__ */ new Map();
      this._observableSections = /* @__PURE__ */ new Map();
      const targetLinks = SelectorEngine.find(SELECTOR_TARGET_LINKS, this._config.target);
      for (const anchor of targetLinks) {
        if (!anchor.hash || isDisabled(anchor)) {
          continue;
        }
        const observableSection = SelectorEngine.findOne(decodeURI(anchor.hash), this._element);
        if (isVisible(observableSection)) {
          this._targetLinks.set(decodeURI(anchor.hash), anchor);
          this._observableSections.set(anchor.hash, observableSection);
        }
      }
    }
    _process(target) {
      if (this._activeTarget === target) {
        return;
      }
      this._clearActiveClass(this._config.target);
      this._activeTarget = target;
      target.classList.add(CLASS_NAME_ACTIVE$1);
      this._activateParents(target);
      EventHandler.trigger(this._element, EVENT_ACTIVATE, {
        relatedTarget: target
      });
    }
    _activateParents(target) {
      if (target.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) {
        SelectorEngine.findOne(SELECTOR_DROPDOWN_TOGGLE$1, target.closest(SELECTOR_DROPDOWN)).classList.add(CLASS_NAME_ACTIVE$1);
        return;
      }
      for (const listGroup of SelectorEngine.parents(target, SELECTOR_NAV_LIST_GROUP)) {
        for (const item of SelectorEngine.prev(listGroup, SELECTOR_LINK_ITEMS)) {
          item.classList.add(CLASS_NAME_ACTIVE$1);
        }
      }
    }
    _clearActiveClass(parent) {
      parent.classList.remove(CLASS_NAME_ACTIVE$1);
      const activeNodes = SelectorEngine.find(`${SELECTOR_TARGET_LINKS}.${CLASS_NAME_ACTIVE$1}`, parent);
      for (const node of activeNodes) {
        node.classList.remove(CLASS_NAME_ACTIVE$1);
      }
    }
    // Static
    static jQueryInterface(config2) {
      return this.each(function() {
        const data = _ScrollSpy.getOrCreateInstance(this, config2);
        if (typeof config2 !== "string") {
          return;
        }
        if (data[config2] === void 0 || config2.startsWith("_") || config2 === "constructor") {
          throw new TypeError(`No method named "${config2}"`);
        }
        data[config2]();
      });
    }
  };
  EventHandler.on(window, EVENT_LOAD_DATA_API$1, () => {
    for (const spy of SelectorEngine.find(SELECTOR_DATA_SPY)) {
      ScrollSpy.getOrCreateInstance(spy);
    }
  });
  defineJQueryPlugin(ScrollSpy);
  var NAME$1 = "tab";
  var DATA_KEY$1 = "bs.tab";
  var EVENT_KEY$1 = `.${DATA_KEY$1}`;
  var EVENT_HIDE$1 = `hide${EVENT_KEY$1}`;
  var EVENT_HIDDEN$1 = `hidden${EVENT_KEY$1}`;
  var EVENT_SHOW$1 = `show${EVENT_KEY$1}`;
  var EVENT_SHOWN$1 = `shown${EVENT_KEY$1}`;
  var EVENT_CLICK_DATA_API = `click${EVENT_KEY$1}`;
  var EVENT_KEYDOWN = `keydown${EVENT_KEY$1}`;
  var EVENT_LOAD_DATA_API = `load${EVENT_KEY$1}`;
  var ARROW_LEFT_KEY = "ArrowLeft";
  var ARROW_RIGHT_KEY = "ArrowRight";
  var ARROW_UP_KEY = "ArrowUp";
  var ARROW_DOWN_KEY = "ArrowDown";
  var HOME_KEY = "Home";
  var END_KEY = "End";
  var CLASS_NAME_ACTIVE = "active";
  var CLASS_NAME_FADE$1 = "fade";
  var CLASS_NAME_SHOW$1 = "show";
  var CLASS_DROPDOWN = "dropdown";
  var SELECTOR_DROPDOWN_TOGGLE = ".dropdown-toggle";
  var SELECTOR_DROPDOWN_MENU = ".dropdown-menu";
  var NOT_SELECTOR_DROPDOWN_TOGGLE = `:not(${SELECTOR_DROPDOWN_TOGGLE})`;
  var SELECTOR_TAB_PANEL = '.list-group, .nav, [role="tablist"]';
  var SELECTOR_OUTER = ".nav-item, .list-group-item";
  var SELECTOR_INNER = `.nav-link${NOT_SELECTOR_DROPDOWN_TOGGLE}, .list-group-item${NOT_SELECTOR_DROPDOWN_TOGGLE}, [role="tab"]${NOT_SELECTOR_DROPDOWN_TOGGLE}`;
  var SELECTOR_DATA_TOGGLE = '[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]';
  var SELECTOR_INNER_ELEM = `${SELECTOR_INNER}, ${SELECTOR_DATA_TOGGLE}`;
  var SELECTOR_DATA_TOGGLE_ACTIVE = `.${CLASS_NAME_ACTIVE}[data-bs-toggle="tab"], .${CLASS_NAME_ACTIVE}[data-bs-toggle="pill"], .${CLASS_NAME_ACTIVE}[data-bs-toggle="list"]`;
  var Tab = class _Tab extends BaseComponent {
    constructor(element) {
      super(element);
      this._parent = this._element.closest(SELECTOR_TAB_PANEL);
      if (!this._parent) {
        return;
      }
      this._setInitialAttributes(this._parent, this._getChildren());
      EventHandler.on(this._element, EVENT_KEYDOWN, (event) => this._keydown(event));
    }
    // Getters
    static get NAME() {
      return NAME$1;
    }
    // Public
    show() {
      const innerElem = this._element;
      if (this._elemIsActive(innerElem)) {
        return;
      }
      const active = this._getActiveElem();
      const hideEvent = active ? EventHandler.trigger(active, EVENT_HIDE$1, {
        relatedTarget: innerElem
      }) : null;
      const showEvent = EventHandler.trigger(innerElem, EVENT_SHOW$1, {
        relatedTarget: active
      });
      if (showEvent.defaultPrevented || hideEvent && hideEvent.defaultPrevented) {
        return;
      }
      this._deactivate(active, innerElem);
      this._activate(innerElem, active);
    }
    // Private
    _activate(element, relatedElem) {
      if (!element) {
        return;
      }
      element.classList.add(CLASS_NAME_ACTIVE);
      this._activate(SelectorEngine.getElementFromSelector(element));
      const complete = () => {
        if (element.getAttribute("role") !== "tab") {
          element.classList.add(CLASS_NAME_SHOW$1);
          return;
        }
        element.removeAttribute("tabindex");
        element.setAttribute("aria-selected", true);
        this._toggleDropDown(element, true);
        EventHandler.trigger(element, EVENT_SHOWN$1, {
          relatedTarget: relatedElem
        });
      };
      this._queueCallback(complete, element, element.classList.contains(CLASS_NAME_FADE$1));
    }
    _deactivate(element, relatedElem) {
      if (!element) {
        return;
      }
      element.classList.remove(CLASS_NAME_ACTIVE);
      element.blur();
      this._deactivate(SelectorEngine.getElementFromSelector(element));
      const complete = () => {
        if (element.getAttribute("role") !== "tab") {
          element.classList.remove(CLASS_NAME_SHOW$1);
          return;
        }
        element.setAttribute("aria-selected", false);
        element.setAttribute("tabindex", "-1");
        this._toggleDropDown(element, false);
        EventHandler.trigger(element, EVENT_HIDDEN$1, {
          relatedTarget: relatedElem
        });
      };
      this._queueCallback(complete, element, element.classList.contains(CLASS_NAME_FADE$1));
    }
    _keydown(event) {
      if (![ARROW_LEFT_KEY, ARROW_RIGHT_KEY, ARROW_UP_KEY, ARROW_DOWN_KEY, HOME_KEY, END_KEY].includes(event.key)) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      const children = this._getChildren().filter((element) => !isDisabled(element));
      let nextActiveElement;
      if ([HOME_KEY, END_KEY].includes(event.key)) {
        nextActiveElement = children[event.key === HOME_KEY ? 0 : children.length - 1];
      } else {
        const isNext = [ARROW_RIGHT_KEY, ARROW_DOWN_KEY].includes(event.key);
        nextActiveElement = getNextActiveElement(children, event.target, isNext, true);
      }
      if (nextActiveElement) {
        nextActiveElement.focus({
          preventScroll: true
        });
        _Tab.getOrCreateInstance(nextActiveElement).show();
      }
    }
    _getChildren() {
      return SelectorEngine.find(SELECTOR_INNER_ELEM, this._parent);
    }
    _getActiveElem() {
      return this._getChildren().find((child) => this._elemIsActive(child)) || null;
    }
    _setInitialAttributes(parent, children) {
      this._setAttributeIfNotExists(parent, "role", "tablist");
      for (const child of children) {
        this._setInitialAttributesOnChild(child);
      }
    }
    _setInitialAttributesOnChild(child) {
      child = this._getInnerElement(child);
      const isActive = this._elemIsActive(child);
      const outerElem = this._getOuterElement(child);
      child.setAttribute("aria-selected", isActive);
      if (outerElem !== child) {
        this._setAttributeIfNotExists(outerElem, "role", "presentation");
      }
      if (!isActive) {
        child.setAttribute("tabindex", "-1");
      }
      this._setAttributeIfNotExists(child, "role", "tab");
      this._setInitialAttributesOnTargetPanel(child);
    }
    _setInitialAttributesOnTargetPanel(child) {
      const target = SelectorEngine.getElementFromSelector(child);
      if (!target) {
        return;
      }
      this._setAttributeIfNotExists(target, "role", "tabpanel");
      if (child.id) {
        this._setAttributeIfNotExists(target, "aria-labelledby", `${child.id}`);
      }
    }
    _toggleDropDown(element, open) {
      const outerElem = this._getOuterElement(element);
      if (!outerElem.classList.contains(CLASS_DROPDOWN)) {
        return;
      }
      const toggle = (selector, className) => {
        const element2 = SelectorEngine.findOne(selector, outerElem);
        if (element2) {
          element2.classList.toggle(className, open);
        }
      };
      toggle(SELECTOR_DROPDOWN_TOGGLE, CLASS_NAME_ACTIVE);
      toggle(SELECTOR_DROPDOWN_MENU, CLASS_NAME_SHOW$1);
      outerElem.setAttribute("aria-expanded", open);
    }
    _setAttributeIfNotExists(element, attribute, value) {
      if (!element.hasAttribute(attribute)) {
        element.setAttribute(attribute, value);
      }
    }
    _elemIsActive(elem) {
      return elem.classList.contains(CLASS_NAME_ACTIVE);
    }
    // Try to get the inner element (usually the .nav-link)
    _getInnerElement(elem) {
      return elem.matches(SELECTOR_INNER_ELEM) ? elem : SelectorEngine.findOne(SELECTOR_INNER_ELEM, elem);
    }
    // Try to get the outer element (usually the .nav-item)
    _getOuterElement(elem) {
      return elem.closest(SELECTOR_OUTER) || elem;
    }
    // Static
    static jQueryInterface(config2) {
      return this.each(function() {
        const data = _Tab.getOrCreateInstance(this);
        if (typeof config2 !== "string") {
          return;
        }
        if (data[config2] === void 0 || config2.startsWith("_") || config2 === "constructor") {
          throw new TypeError(`No method named "${config2}"`);
        }
        data[config2]();
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function(event) {
    if (["A", "AREA"].includes(this.tagName)) {
      event.preventDefault();
    }
    if (isDisabled(this)) {
      return;
    }
    Tab.getOrCreateInstance(this).show();
  });
  EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
    for (const element of SelectorEngine.find(SELECTOR_DATA_TOGGLE_ACTIVE)) {
      Tab.getOrCreateInstance(element);
    }
  });
  defineJQueryPlugin(Tab);
  var NAME = "toast";
  var DATA_KEY = "bs.toast";
  var EVENT_KEY = `.${DATA_KEY}`;
  var EVENT_MOUSEOVER = `mouseover${EVENT_KEY}`;
  var EVENT_MOUSEOUT = `mouseout${EVENT_KEY}`;
  var EVENT_FOCUSIN = `focusin${EVENT_KEY}`;
  var EVENT_FOCUSOUT = `focusout${EVENT_KEY}`;
  var EVENT_HIDE = `hide${EVENT_KEY}`;
  var EVENT_HIDDEN = `hidden${EVENT_KEY}`;
  var EVENT_SHOW = `show${EVENT_KEY}`;
  var EVENT_SHOWN = `shown${EVENT_KEY}`;
  var CLASS_NAME_FADE = "fade";
  var CLASS_NAME_HIDE = "hide";
  var CLASS_NAME_SHOW = "show";
  var CLASS_NAME_SHOWING = "showing";
  var DefaultType = {
    animation: "boolean",
    autohide: "boolean",
    delay: "number"
  };
  var Default = {
    animation: true,
    autohide: true,
    delay: 5e3
  };
  var Toast = class _Toast extends BaseComponent {
    constructor(element, config2) {
      super(element, config2);
      this._timeout = null;
      this._hasMouseInteraction = false;
      this._hasKeyboardInteraction = false;
      this._setListeners();
    }
    // Getters
    static get Default() {
      return Default;
    }
    static get DefaultType() {
      return DefaultType;
    }
    static get NAME() {
      return NAME;
    }
    // Public
    show() {
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW);
      if (showEvent.defaultPrevented) {
        return;
      }
      this._clearTimeout();
      if (this._config.animation) {
        this._element.classList.add(CLASS_NAME_FADE);
      }
      const complete = () => {
        this._element.classList.remove(CLASS_NAME_SHOWING);
        EventHandler.trigger(this._element, EVENT_SHOWN);
        this._maybeScheduleHide();
      };
      this._element.classList.remove(CLASS_NAME_HIDE);
      reflow(this._element);
      this._element.classList.add(CLASS_NAME_SHOW, CLASS_NAME_SHOWING);
      this._queueCallback(complete, this._element, this._config.animation);
    }
    hide() {
      if (!this.isShown()) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE);
      if (hideEvent.defaultPrevented) {
        return;
      }
      const complete = () => {
        this._element.classList.add(CLASS_NAME_HIDE);
        this._element.classList.remove(CLASS_NAME_SHOWING, CLASS_NAME_SHOW);
        EventHandler.trigger(this._element, EVENT_HIDDEN);
      };
      this._element.classList.add(CLASS_NAME_SHOWING);
      this._queueCallback(complete, this._element, this._config.animation);
    }
    dispose() {
      this._clearTimeout();
      if (this.isShown()) {
        this._element.classList.remove(CLASS_NAME_SHOW);
      }
      super.dispose();
    }
    isShown() {
      return this._element.classList.contains(CLASS_NAME_SHOW);
    }
    // Private
    _maybeScheduleHide() {
      if (!this._config.autohide) {
        return;
      }
      if (this._hasMouseInteraction || this._hasKeyboardInteraction) {
        return;
      }
      this._timeout = setTimeout(() => {
        this.hide();
      }, this._config.delay);
    }
    _onInteraction(event, isInteracting) {
      switch (event.type) {
        case "mouseover":
        case "mouseout": {
          this._hasMouseInteraction = isInteracting;
          break;
        }
        case "focusin":
        case "focusout": {
          this._hasKeyboardInteraction = isInteracting;
          break;
        }
      }
      if (isInteracting) {
        this._clearTimeout();
        return;
      }
      const nextElement = event.relatedTarget;
      if (this._element === nextElement || this._element.contains(nextElement)) {
        return;
      }
      this._maybeScheduleHide();
    }
    _setListeners() {
      EventHandler.on(this._element, EVENT_MOUSEOVER, (event) => this._onInteraction(event, true));
      EventHandler.on(this._element, EVENT_MOUSEOUT, (event) => this._onInteraction(event, false));
      EventHandler.on(this._element, EVENT_FOCUSIN, (event) => this._onInteraction(event, true));
      EventHandler.on(this._element, EVENT_FOCUSOUT, (event) => this._onInteraction(event, false));
    }
    _clearTimeout() {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    // Static
    static jQueryInterface(config2) {
      return this.each(function() {
        const data = _Toast.getOrCreateInstance(this, config2);
        if (typeof config2 === "string") {
          if (typeof data[config2] === "undefined") {
            throw new TypeError(`No method named "${config2}"`);
          }
          data[config2](this);
        }
      });
    }
  };
  enableDismissTrigger(Toast);
  defineJQueryPlugin(Toast);

  // app/javascript/controllers/application.js
  var application = Application.start();
  application.debug = true;

  // node_modules/tom-select/dist/esm/contrib/microevent.js
  function forEvents(events, callback) {
    events.split(/\s+/).forEach((event) => {
      callback(event);
    });
  }
  var MicroEvent = class {
    constructor() {
      this._events = {};
    }
    on(events, fct) {
      forEvents(events, (event) => {
        const event_array = this._events[event] || [];
        event_array.push(fct);
        this._events[event] = event_array;
      });
    }
    off(events, fct) {
      var n = arguments.length;
      if (n === 0) {
        this._events = {};
        return;
      }
      forEvents(events, (event) => {
        if (n === 1) {
          delete this._events[event];
          return;
        }
        const event_array = this._events[event];
        if (event_array === void 0)
          return;
        event_array.splice(event_array.indexOf(fct), 1);
        this._events[event] = event_array;
      });
    }
    trigger(events, ...args) {
      var self = this;
      forEvents(events, (event) => {
        const event_array = self._events[event];
        if (event_array === void 0)
          return;
        event_array.forEach((fct) => {
          fct.apply(self, args);
        });
      });
    }
  };

  // node_modules/tom-select/dist/esm/contrib/microplugin.js
  function MicroPlugin(Interface) {
    Interface.plugins = {};
    return class extends Interface {
      constructor() {
        super(...arguments);
        this.plugins = {
          names: [],
          settings: {},
          requested: {},
          loaded: {}
        };
      }
      /**
       * Registers a plugin.
       *
       * @param {function} fn
       */
      static define(name, fn2) {
        Interface.plugins[name] = {
          "name": name,
          "fn": fn2
        };
      }
      /**
       * Initializes the listed plugins (with options).
       * Acceptable formats:
       *
       * List (without options):
       *   ['a', 'b', 'c']
       *
       * List (with options):
       *   [{'name': 'a', options: {}}, {'name': 'b', options: {}}]
       *
       * Hash (with options):
       *   {'a': { ... }, 'b': { ... }, 'c': { ... }}
       *
       * @param {array|object} plugins
       */
      initializePlugins(plugins) {
        var key, name;
        const self = this;
        const queue = [];
        if (Array.isArray(plugins)) {
          plugins.forEach((plugin15) => {
            if (typeof plugin15 === "string") {
              queue.push(plugin15);
            } else {
              self.plugins.settings[plugin15.name] = plugin15.options;
              queue.push(plugin15.name);
            }
          });
        } else if (plugins) {
          for (key in plugins) {
            if (plugins.hasOwnProperty(key)) {
              self.plugins.settings[key] = plugins[key];
              queue.push(key);
            }
          }
        }
        while (name = queue.shift()) {
          self.require(name);
        }
      }
      loadPlugin(name) {
        var self = this;
        var plugins = self.plugins;
        var plugin15 = Interface.plugins[name];
        if (!Interface.plugins.hasOwnProperty(name)) {
          throw new Error('Unable to find "' + name + '" plugin');
        }
        plugins.requested[name] = true;
        plugins.loaded[name] = plugin15.fn.apply(self, [self.plugins.settings[name] || {}]);
        plugins.names.push(name);
      }
      /**
       * Initializes a plugin.
       *
       */
      require(name) {
        var self = this;
        var plugins = self.plugins;
        if (!self.plugins.loaded.hasOwnProperty(name)) {
          if (plugins.requested[name]) {
            throw new Error('Plugin has circular dependency ("' + name + '")');
          }
          self.loadPlugin(name);
        }
        return plugins.loaded[name];
      }
    };
  }

  // node_modules/@orchidjs/unicode-variants/dist/esm/regex.js
  var arrayToPattern = (chars) => {
    chars = chars.filter(Boolean);
    if (chars.length < 2) {
      return chars[0] || "";
    }
    return maxValueLength(chars) == 1 ? "[" + chars.join("") + "]" : "(?:" + chars.join("|") + ")";
  };
  var sequencePattern = (array) => {
    if (!hasDuplicates(array)) {
      return array.join("");
    }
    let pattern = "";
    let prev_char_count = 0;
    const prev_pattern = () => {
      if (prev_char_count > 1) {
        pattern += "{" + prev_char_count + "}";
      }
    };
    array.forEach((char, i) => {
      if (char === array[i - 1]) {
        prev_char_count++;
        return;
      }
      prev_pattern();
      pattern += char;
      prev_char_count = 1;
    });
    prev_pattern();
    return pattern;
  };
  var setToPattern = (chars) => {
    let array = Array.from(chars);
    return arrayToPattern(array);
  };
  var hasDuplicates = (array) => {
    return new Set(array).size !== array.length;
  };
  var escape_regex = (str) => {
    return (str + "").replace(/([\$\(\)\*\+\.\?\[\]\^\{\|\}\\])/gu, "\\$1");
  };
  var maxValueLength = (array) => {
    return array.reduce((longest, value) => Math.max(longest, unicodeLength(value)), 0);
  };
  var unicodeLength = (str) => {
    return Array.from(str).length;
  };

  // node_modules/@orchidjs/unicode-variants/dist/esm/strings.js
  var allSubstrings = (input) => {
    if (input.length === 1)
      return [[input]];
    let result = [];
    const start3 = input.substring(1);
    const suba = allSubstrings(start3);
    suba.forEach(function(subresult) {
      let tmp = subresult.slice(0);
      tmp[0] = input.charAt(0) + tmp[0];
      result.push(tmp);
      tmp = subresult.slice(0);
      tmp.unshift(input.charAt(0));
      result.push(tmp);
    });
    return result;
  };

  // node_modules/@orchidjs/unicode-variants/dist/esm/index.js
  var code_points = [[0, 65535]];
  var accent_pat = "[\u0300-\u036F\xB7\u02BE\u02BC]";
  var unicode_map;
  var multi_char_reg;
  var max_char_length = 3;
  var latin_convert = {};
  var latin_condensed = {
    "/": "\u2044\u2215",
    "0": "\u07C0",
    "a": "\u2C65\u0250\u0251",
    "aa": "\uA733",
    "ae": "\xE6\u01FD\u01E3",
    "ao": "\uA735",
    "au": "\uA737",
    "av": "\uA739\uA73B",
    "ay": "\uA73D",
    "b": "\u0180\u0253\u0183",
    "c": "\uA73F\u0188\u023C\u2184",
    "d": "\u0111\u0257\u0256\u1D05\u018C\uABB7\u0501\u0266",
    "e": "\u025B\u01DD\u1D07\u0247",
    "f": "\uA77C\u0192",
    "g": "\u01E5\u0260\uA7A1\u1D79\uA77F\u0262",
    "h": "\u0127\u2C68\u2C76\u0265",
    "i": "\u0268\u0131",
    "j": "\u0249\u0237",
    "k": "\u0199\u2C6A\uA741\uA743\uA745\uA7A3",
    "l": "\u0142\u019A\u026B\u2C61\uA749\uA747\uA781\u026D",
    "m": "\u0271\u026F\u03FB",
    "n": "\uA7A5\u019E\u0272\uA791\u1D0E\u043B\u0509",
    "o": "\xF8\u01FF\u0254\u0275\uA74B\uA74D\u1D11",
    "oe": "\u0153",
    "oi": "\u01A3",
    "oo": "\uA74F",
    "ou": "\u0223",
    "p": "\u01A5\u1D7D\uA751\uA753\uA755\u03C1",
    "q": "\uA757\uA759\u024B",
    "r": "\u024D\u027D\uA75B\uA7A7\uA783",
    "s": "\xDF\u023F\uA7A9\uA785\u0282",
    "t": "\u0167\u01AD\u0288\u2C66\uA787",
    "th": "\xFE",
    "tz": "\uA729",
    "u": "\u0289",
    "v": "\u028B\uA75F\u028C",
    "vy": "\uA761",
    "w": "\u2C73",
    "y": "\u01B4\u024F\u1EFF",
    "z": "\u01B6\u0225\u0240\u2C6C\uA763",
    "hv": "\u0195"
  };
  for (let latin in latin_condensed) {
    let unicode = latin_condensed[latin] || "";
    for (let i = 0; i < unicode.length; i++) {
      let char = unicode.substring(i, i + 1);
      latin_convert[char] = latin;
    }
  }
  var convert_pat = new RegExp(Object.keys(latin_convert).join("|") + "|" + accent_pat, "gu");
  var initialize = (_code_points) => {
    if (unicode_map !== void 0)
      return;
    unicode_map = generateMap(_code_points || code_points);
  };
  var normalize = (str, form = "NFKD") => str.normalize(form);
  var asciifold = (str) => {
    return Array.from(str).reduce(
      /**
       * @param {string} result
       * @param {string} char
       */
      (result, char) => {
        return result + _asciifold(char);
      },
      ""
    );
  };
  var _asciifold = (str) => {
    str = normalize(str).toLowerCase().replace(convert_pat, (char) => {
      return latin_convert[char] || "";
    });
    return normalize(str, "NFC");
  };
  function* generator(code_points2) {
    for (const [code_point_min, code_point_max] of code_points2) {
      for (let i = code_point_min; i <= code_point_max; i++) {
        let composed = String.fromCharCode(i);
        let folded = asciifold(composed);
        if (folded == composed.toLowerCase()) {
          continue;
        }
        if (folded.length > max_char_length) {
          continue;
        }
        if (folded.length == 0) {
          continue;
        }
        yield { folded, composed, code_point: i };
      }
    }
  }
  var generateSets = (code_points2) => {
    const unicode_sets = {};
    const addMatching = (folded, to_add) => {
      const folded_set = unicode_sets[folded] || /* @__PURE__ */ new Set();
      const patt = new RegExp("^" + setToPattern(folded_set) + "$", "iu");
      if (to_add.match(patt)) {
        return;
      }
      folded_set.add(escape_regex(to_add));
      unicode_sets[folded] = folded_set;
    };
    for (let value of generator(code_points2)) {
      addMatching(value.folded, value.folded);
      addMatching(value.folded, value.composed);
    }
    return unicode_sets;
  };
  var generateMap = (code_points2) => {
    const unicode_sets = generateSets(code_points2);
    const unicode_map2 = {};
    let multi_char = [];
    for (let folded in unicode_sets) {
      let set = unicode_sets[folded];
      if (set) {
        unicode_map2[folded] = setToPattern(set);
      }
      if (folded.length > 1) {
        multi_char.push(escape_regex(folded));
      }
    }
    multi_char.sort((a, b) => b.length - a.length);
    const multi_char_patt = arrayToPattern(multi_char);
    multi_char_reg = new RegExp("^" + multi_char_patt, "u");
    return unicode_map2;
  };
  var mapSequence = (strings, min_replacement = 1) => {
    let chars_replaced = 0;
    strings = strings.map((str) => {
      if (unicode_map[str]) {
        chars_replaced += str.length;
      }
      return unicode_map[str] || str;
    });
    if (chars_replaced >= min_replacement) {
      return sequencePattern(strings);
    }
    return "";
  };
  var substringsToPattern = (str, min_replacement = 1) => {
    min_replacement = Math.max(min_replacement, str.length - 1);
    return arrayToPattern(allSubstrings(str).map((sub_pat) => {
      return mapSequence(sub_pat, min_replacement);
    }));
  };
  var sequencesToPattern = (sequences, all = true) => {
    let min_replacement = sequences.length > 1 ? 1 : 0;
    return arrayToPattern(sequences.map((sequence) => {
      let seq = [];
      const len = all ? sequence.length() : sequence.length() - 1;
      for (let j = 0; j < len; j++) {
        seq.push(substringsToPattern(sequence.substrs[j] || "", min_replacement));
      }
      return sequencePattern(seq);
    }));
  };
  var inSequences = (needle_seq, sequences) => {
    for (const seq of sequences) {
      if (seq.start != needle_seq.start || seq.end != needle_seq.end) {
        continue;
      }
      if (seq.substrs.join("") !== needle_seq.substrs.join("")) {
        continue;
      }
      let needle_parts = needle_seq.parts;
      const filter = (part) => {
        for (const needle_part of needle_parts) {
          if (needle_part.start === part.start && needle_part.substr === part.substr) {
            return false;
          }
          if (part.length == 1 || needle_part.length == 1) {
            continue;
          }
          if (part.start < needle_part.start && part.end > needle_part.start) {
            return true;
          }
          if (needle_part.start < part.start && needle_part.end > part.start) {
            return true;
          }
        }
        return false;
      };
      let filtered = seq.parts.filter(filter);
      if (filtered.length > 0) {
        continue;
      }
      return true;
    }
    return false;
  };
  var Sequence = class _Sequence {
    parts;
    substrs;
    start;
    end;
    constructor() {
      this.parts = [];
      this.substrs = [];
      this.start = 0;
      this.end = 0;
    }
    add(part) {
      if (part) {
        this.parts.push(part);
        this.substrs.push(part.substr);
        this.start = Math.min(part.start, this.start);
        this.end = Math.max(part.end, this.end);
      }
    }
    last() {
      return this.parts[this.parts.length - 1];
    }
    length() {
      return this.parts.length;
    }
    clone(position, last_piece) {
      let clone = new _Sequence();
      let parts = JSON.parse(JSON.stringify(this.parts));
      let last_part = parts.pop();
      for (const part of parts) {
        clone.add(part);
      }
      let last_substr = last_piece.substr.substring(0, position - last_part.start);
      let clone_last_len = last_substr.length;
      clone.add({ start: last_part.start, end: last_part.start + clone_last_len, length: clone_last_len, substr: last_substr });
      return clone;
    }
  };
  var getPattern = (str) => {
    initialize();
    str = asciifold(str);
    let pattern = "";
    let sequences = [new Sequence()];
    for (let i = 0; i < str.length; i++) {
      let substr = str.substring(i);
      let match = substr.match(multi_char_reg);
      const char = str.substring(i, i + 1);
      const match_str = match ? match[0] : null;
      let overlapping = [];
      let added_types = /* @__PURE__ */ new Set();
      for (const sequence of sequences) {
        const last_piece = sequence.last();
        if (!last_piece || last_piece.length == 1 || last_piece.end <= i) {
          if (match_str) {
            const len = match_str.length;
            sequence.add({ start: i, end: i + len, length: len, substr: match_str });
            added_types.add("1");
          } else {
            sequence.add({ start: i, end: i + 1, length: 1, substr: char });
            added_types.add("2");
          }
        } else if (match_str) {
          let clone = sequence.clone(i, last_piece);
          const len = match_str.length;
          clone.add({ start: i, end: i + len, length: len, substr: match_str });
          overlapping.push(clone);
        } else {
          added_types.add("3");
        }
      }
      if (overlapping.length > 0) {
        overlapping = overlapping.sort((a, b) => {
          return a.length() - b.length();
        });
        for (let clone of overlapping) {
          if (inSequences(clone, sequences)) {
            continue;
          }
          sequences.push(clone);
        }
        continue;
      }
      if (i > 0 && added_types.size == 1 && !added_types.has("3")) {
        pattern += sequencesToPattern(sequences, false);
        let new_seq = new Sequence();
        const old_seq = sequences[0];
        if (old_seq) {
          new_seq.add(old_seq.last());
        }
        sequences = [new_seq];
      }
    }
    pattern += sequencesToPattern(sequences, true);
    return pattern;
  };

  // node_modules/@orchidjs/sifter/dist/esm/utils.js
  var getAttr = (obj, name) => {
    if (!obj)
      return;
    return obj[name];
  };
  var getAttrNesting = (obj, name) => {
    if (!obj)
      return;
    var part, names = name.split(".");
    while ((part = names.shift()) && (obj = obj[part]))
      ;
    return obj;
  };
  var scoreValue = (value, token, weight) => {
    var score, pos;
    if (!value)
      return 0;
    value = value + "";
    if (token.regex == null)
      return 0;
    pos = value.search(token.regex);
    if (pos === -1)
      return 0;
    score = token.string.length / value.length;
    if (pos === 0)
      score += 0.5;
    return score * weight;
  };
  var propToArray = (obj, key) => {
    var value = obj[key];
    if (typeof value == "function")
      return value;
    if (value && !Array.isArray(value)) {
      obj[key] = [value];
    }
  };
  var iterate = (object, callback) => {
    if (Array.isArray(object)) {
      object.forEach(callback);
    } else {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          callback(object[key], key);
        }
      }
    }
  };
  var cmp = (a, b) => {
    if (typeof a === "number" && typeof b === "number") {
      return a > b ? 1 : a < b ? -1 : 0;
    }
    a = asciifold(a + "").toLowerCase();
    b = asciifold(b + "").toLowerCase();
    if (a > b)
      return 1;
    if (b > a)
      return -1;
    return 0;
  };

  // node_modules/@orchidjs/sifter/dist/esm/sifter.js
  var Sifter = class {
    items;
    // []|{};
    settings;
    /**
     * Textually searches arrays and hashes of objects
     * by property (or multiple properties). Designed
     * specifically for autocomplete.
     *
     */
    constructor(items, settings) {
      this.items = items;
      this.settings = settings || { diacritics: true };
    }
    /**
     * Splits a search string into an array of individual
     * regexps to be used to match results.
     *
     */
    tokenize(query, respect_word_boundaries, weights) {
      if (!query || !query.length)
        return [];
      const tokens = [];
      const words = query.split(/\s+/);
      var field_regex;
      if (weights) {
        field_regex = new RegExp("^(" + Object.keys(weights).map(escape_regex).join("|") + "):(.*)$");
      }
      words.forEach((word) => {
        let field_match;
        let field = null;
        let regex = null;
        if (field_regex && (field_match = word.match(field_regex))) {
          field = field_match[1];
          word = field_match[2];
        }
        if (word.length > 0) {
          if (this.settings.diacritics) {
            regex = getPattern(word) || null;
          } else {
            regex = escape_regex(word);
          }
          if (regex && respect_word_boundaries)
            regex = "\\b" + regex;
        }
        tokens.push({
          string: word,
          regex: regex ? new RegExp(regex, "iu") : null,
          field
        });
      });
      return tokens;
    }
    /**
     * Returns a function to be used to score individual results.
     *
     * Good matches will have a higher score than poor matches.
     * If an item is not a match, 0 will be returned by the function.
     *
     * @returns {T.ScoreFn}
     */
    getScoreFunction(query, options) {
      var search = this.prepareSearch(query, options);
      return this._getScoreFunction(search);
    }
    /**
     * @returns {T.ScoreFn}
     *
     */
    _getScoreFunction(search) {
      const tokens = search.tokens, token_count = tokens.length;
      if (!token_count) {
        return function() {
          return 0;
        };
      }
      const fields = search.options.fields, weights = search.weights, field_count = fields.length, getAttrFn = search.getAttrFn;
      if (!field_count) {
        return function() {
          return 1;
        };
      }
      const scoreObject = (function() {
        if (field_count === 1) {
          return function(token, data) {
            const field = fields[0].field;
            return scoreValue(getAttrFn(data, field), token, weights[field] || 1);
          };
        }
        return function(token, data) {
          var sum = 0;
          if (token.field) {
            const value = getAttrFn(data, token.field);
            if (!token.regex && value) {
              sum += 1 / field_count;
            } else {
              sum += scoreValue(value, token, 1);
            }
          } else {
            iterate(weights, (weight, field) => {
              sum += scoreValue(getAttrFn(data, field), token, weight);
            });
          }
          return sum / field_count;
        };
      })();
      if (token_count === 1) {
        return function(data) {
          return scoreObject(tokens[0], data);
        };
      }
      if (search.options.conjunction === "and") {
        return function(data) {
          var score, sum = 0;
          for (let token of tokens) {
            score = scoreObject(token, data);
            if (score <= 0)
              return 0;
            sum += score;
          }
          return sum / token_count;
        };
      } else {
        return function(data) {
          var sum = 0;
          iterate(tokens, (token) => {
            sum += scoreObject(token, data);
          });
          return sum / token_count;
        };
      }
    }
    /**
     * Returns a function that can be used to compare two
     * results, for sorting purposes. If no sorting should
     * be performed, `null` will be returned.
     *
     * @return function(a,b)
     */
    getSortFunction(query, options) {
      var search = this.prepareSearch(query, options);
      return this._getSortFunction(search);
    }
    _getSortFunction(search) {
      var implicit_score, sort_flds = [];
      const self = this, options = search.options, sort = !search.query && options.sort_empty ? options.sort_empty : options.sort;
      if (typeof sort == "function") {
        return sort.bind(this);
      }
      const get_field = function(name, result) {
        if (name === "$score")
          return result.score;
        return search.getAttrFn(self.items[result.id], name);
      };
      if (sort) {
        for (let s of sort) {
          if (search.query || s.field !== "$score") {
            sort_flds.push(s);
          }
        }
      }
      if (search.query) {
        implicit_score = true;
        for (let fld of sort_flds) {
          if (fld.field === "$score") {
            implicit_score = false;
            break;
          }
        }
        if (implicit_score) {
          sort_flds.unshift({ field: "$score", direction: "desc" });
        }
      } else {
        sort_flds = sort_flds.filter((fld) => fld.field !== "$score");
      }
      const sort_flds_count = sort_flds.length;
      if (!sort_flds_count) {
        return null;
      }
      return function(a, b) {
        var result, field;
        for (let sort_fld of sort_flds) {
          field = sort_fld.field;
          let multiplier = sort_fld.direction === "desc" ? -1 : 1;
          result = multiplier * cmp(get_field(field, a), get_field(field, b));
          if (result)
            return result;
        }
        return 0;
      };
    }
    /**
     * Parses a search query and returns an object
     * with tokens and fields ready to be populated
     * with results.
     *
     */
    prepareSearch(query, optsUser) {
      const weights = {};
      var options = Object.assign({}, optsUser);
      propToArray(options, "sort");
      propToArray(options, "sort_empty");
      if (options.fields) {
        propToArray(options, "fields");
        const fields = [];
        options.fields.forEach((field) => {
          if (typeof field == "string") {
            field = { field, weight: 1 };
          }
          fields.push(field);
          weights[field.field] = "weight" in field ? field.weight : 1;
        });
        options.fields = fields;
      }
      return {
        options,
        query: query.toLowerCase().trim(),
        tokens: this.tokenize(query, options.respect_word_boundaries, weights),
        total: 0,
        items: [],
        weights,
        getAttrFn: options.nesting ? getAttrNesting : getAttr
      };
    }
    /**
     * Searches through all items and returns a sorted array of matches.
     *
     */
    search(query, options) {
      var self = this, score, search;
      search = this.prepareSearch(query, options);
      options = search.options;
      query = search.query;
      const fn_score = options.score || self._getScoreFunction(search);
      if (query.length) {
        iterate(self.items, (item, id) => {
          score = fn_score(item);
          if (options.filter === false || score > 0) {
            search.items.push({ "score": score, "id": id });
          }
        });
      } else {
        iterate(self.items, (_, id) => {
          search.items.push({ "score": 1, "id": id });
        });
      }
      const fn_sort = self._getSortFunction(search);
      if (fn_sort)
        search.items.sort(fn_sort);
      search.total = search.items.length;
      if (typeof options.limit === "number") {
        search.items = search.items.slice(0, options.limit);
      }
      return search;
    }
  };

  // node_modules/tom-select/dist/esm/utils.js
  var hash_key = (value) => {
    if (typeof value === "undefined" || value === null)
      return null;
    return get_hash(value);
  };
  var get_hash = (value) => {
    if (typeof value === "boolean")
      return value ? "1" : "0";
    return value + "";
  };
  var escape_html = (str) => {
    return (str + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  var timeout = (fn2, timeout2) => {
    if (timeout2 > 0) {
      return window.setTimeout(fn2, timeout2);
    }
    fn2.call(null);
    return null;
  };
  var loadDebounce = (fn2, delay) => {
    var timeout2;
    return function(value, callback) {
      var self = this;
      if (timeout2) {
        self.loading = Math.max(self.loading - 1, 0);
        clearTimeout(timeout2);
      }
      timeout2 = setTimeout(function() {
        timeout2 = null;
        self.loadedSearches[value] = true;
        fn2.call(self, value, callback);
      }, delay);
    };
  };
  var debounce_events = (self, types, fn2) => {
    var type;
    var trigger = self.trigger;
    var event_args = {};
    self.trigger = function() {
      var type2 = arguments[0];
      if (types.indexOf(type2) !== -1) {
        event_args[type2] = arguments;
      } else {
        return trigger.apply(self, arguments);
      }
    };
    fn2.apply(self, []);
    self.trigger = trigger;
    for (type of types) {
      if (type in event_args) {
        trigger.apply(self, event_args[type]);
      }
    }
  };
  var getSelection = (input) => {
    return {
      start: input.selectionStart || 0,
      length: (input.selectionEnd || 0) - (input.selectionStart || 0)
    };
  };
  var preventDefault = (evt, stop = false) => {
    if (evt) {
      evt.preventDefault();
      if (stop) {
        evt.stopPropagation();
      }
    }
  };
  var addEvent = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
  };
  var isKeyDown = (key_name, evt) => {
    if (!evt) {
      return false;
    }
    if (!evt[key_name]) {
      return false;
    }
    var count = (evt.altKey ? 1 : 0) + (evt.ctrlKey ? 1 : 0) + (evt.shiftKey ? 1 : 0) + (evt.metaKey ? 1 : 0);
    if (count === 1) {
      return true;
    }
    return false;
  };
  var getId = (el, id) => {
    const existing_id = el.getAttribute("id");
    if (existing_id) {
      return existing_id;
    }
    el.setAttribute("id", id);
    return id;
  };
  var addSlashes = (str) => {
    return str.replace(/[\\"']/g, "\\$&");
  };
  var append = (parent, node) => {
    if (node)
      parent.append(node);
  };
  var iterate2 = (object, callback) => {
    if (Array.isArray(object)) {
      object.forEach(callback);
    } else {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          callback(object[key], key);
        }
      }
    }
  };

  // node_modules/tom-select/dist/esm/vanilla.js
  var getDom = (query) => {
    if (query.jquery) {
      return query[0];
    }
    if (query instanceof HTMLElement) {
      return query;
    }
    if (isHtmlString(query)) {
      var tpl = document.createElement("template");
      tpl.innerHTML = query.trim();
      return tpl.content.firstChild;
    }
    return document.querySelector(query);
  };
  var isHtmlString = (arg) => {
    if (typeof arg === "string" && arg.indexOf("<") > -1) {
      return true;
    }
    return false;
  };
  var escapeQuery = (query) => {
    return query.replace(/['"\\]/g, "\\$&");
  };
  var triggerEvent = (dom_el, event_name) => {
    var event = document.createEvent("HTMLEvents");
    event.initEvent(event_name, true, false);
    dom_el.dispatchEvent(event);
  };
  var applyCSS = (dom_el, css) => {
    Object.assign(dom_el.style, css);
  };
  var addClasses = (elmts, ...classes) => {
    var norm_classes = classesArray(classes);
    elmts = castAsArray(elmts);
    elmts.map((el) => {
      norm_classes.map((cls) => {
        el.classList.add(cls);
      });
    });
  };
  var removeClasses = (elmts, ...classes) => {
    var norm_classes = classesArray(classes);
    elmts = castAsArray(elmts);
    elmts.map((el) => {
      norm_classes.map((cls) => {
        el.classList.remove(cls);
      });
    });
  };
  var classesArray = (args) => {
    var classes = [];
    iterate2(args, (_classes) => {
      if (typeof _classes === "string") {
        _classes = _classes.trim().split(/[\t\n\f\r\s]/);
      }
      if (Array.isArray(_classes)) {
        classes = classes.concat(_classes);
      }
    });
    return classes.filter(Boolean);
  };
  var castAsArray = (arg) => {
    if (!Array.isArray(arg)) {
      arg = [arg];
    }
    return arg;
  };
  var parentMatch = (target, selector, wrapper) => {
    if (wrapper && !wrapper.contains(target)) {
      return;
    }
    while (target && target.matches) {
      if (target.matches(selector)) {
        return target;
      }
      target = target.parentNode;
    }
  };
  var getTail = (list, direction = 0) => {
    if (direction > 0) {
      return list[list.length - 1];
    }
    return list[0];
  };
  var isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0;
  };
  var nodeIndex = (el, amongst) => {
    if (!el)
      return -1;
    amongst = amongst || el.nodeName;
    var i = 0;
    while (el = el.previousElementSibling) {
      if (el.matches(amongst)) {
        i++;
      }
    }
    return i;
  };
  var setAttr = (el, attrs) => {
    iterate2(attrs, (val, attr) => {
      if (val == null) {
        el.removeAttribute(attr);
      } else {
        el.setAttribute(attr, "" + val);
      }
    });
  };
  var replaceNode = (existing, replacement) => {
    if (existing.parentNode)
      existing.parentNode.replaceChild(replacement, existing);
  };

  // node_modules/tom-select/dist/esm/contrib/highlight.js
  var highlight = (element, regex) => {
    if (regex === null)
      return;
    if (typeof regex === "string") {
      if (!regex.length)
        return;
      regex = new RegExp(regex, "i");
    }
    const highlightText = (node) => {
      var match = node.data.match(regex);
      if (match && node.data.length > 0) {
        var spannode = document.createElement("span");
        spannode.className = "highlight";
        var middlebit = node.splitText(match.index);
        middlebit.splitText(match[0].length);
        var middleclone = middlebit.cloneNode(true);
        spannode.appendChild(middleclone);
        replaceNode(middlebit, spannode);
        return 1;
      }
      return 0;
    };
    const highlightChildren = (node) => {
      if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName) && (node.className !== "highlight" || node.tagName !== "SPAN")) {
        Array.from(node.childNodes).forEach((element2) => {
          highlightRecursive(element2);
        });
      }
    };
    const highlightRecursive = (node) => {
      if (node.nodeType === 3) {
        return highlightText(node);
      }
      highlightChildren(node);
      return 0;
    };
    highlightRecursive(element);
  };
  var removeHighlight = (el) => {
    var elements = el.querySelectorAll("span.highlight");
    Array.prototype.forEach.call(elements, function(el2) {
      var parent = el2.parentNode;
      parent.replaceChild(el2.firstChild, el2);
      parent.normalize();
    });
  };

  // node_modules/tom-select/dist/esm/constants.js
  var KEY_A = 65;
  var KEY_RETURN = 13;
  var KEY_ESC = 27;
  var KEY_LEFT = 37;
  var KEY_UP = 38;
  var KEY_RIGHT = 39;
  var KEY_DOWN = 40;
  var KEY_BACKSPACE = 8;
  var KEY_DELETE = 46;
  var KEY_TAB = 9;
  var IS_MAC = typeof navigator === "undefined" ? false : /Mac/.test(navigator.userAgent);
  var KEY_SHORTCUT = IS_MAC ? "metaKey" : "ctrlKey";

  // node_modules/tom-select/dist/esm/defaults.js
  var defaults_default = {
    options: [],
    optgroups: [],
    plugins: [],
    delimiter: ",",
    splitOn: null,
    // regexp or string for splitting up values from a paste command
    persist: true,
    diacritics: true,
    create: null,
    createOnBlur: false,
    createFilter: null,
    highlight: true,
    openOnFocus: true,
    shouldOpen: null,
    maxOptions: 50,
    maxItems: null,
    hideSelected: null,
    duplicates: false,
    addPrecedence: false,
    selectOnTab: false,
    preload: null,
    allowEmptyOption: false,
    //closeAfterSelect: false,
    refreshThrottle: 300,
    loadThrottle: 300,
    loadingClass: "loading",
    dataAttr: null,
    //'data-data',
    optgroupField: "optgroup",
    valueField: "value",
    labelField: "text",
    disabledField: "disabled",
    optgroupLabelField: "label",
    optgroupValueField: "value",
    lockOptgroupOrder: false,
    sortField: "$order",
    searchField: ["text"],
    searchConjunction: "and",
    mode: null,
    wrapperClass: "ts-wrapper",
    controlClass: "ts-control",
    dropdownClass: "ts-dropdown",
    dropdownContentClass: "ts-dropdown-content",
    itemClass: "item",
    optionClass: "option",
    dropdownParent: null,
    controlInput: '<input type="text" autocomplete="off" size="1" />',
    copyClassesToDropdown: false,
    placeholder: null,
    hidePlaceholder: null,
    shouldLoad: function(query) {
      return query.length > 0;
    },
    /*
    load                 : null, // function(query, callback) { ... }
    score                : null, // function(search) { ... }
    onInitialize         : null, // function() { ... }
    onChange             : null, // function(value) { ... }
    onItemAdd            : null, // function(value, $item) { ... }
    onItemRemove         : null, // function(value) { ... }
    onClear              : null, // function() { ... }
    onOptionAdd          : null, // function(value, data) { ... }
    onOptionRemove       : null, // function(value) { ... }
    onOptionClear        : null, // function() { ... }
    onOptionGroupAdd     : null, // function(id, data) { ... }
    onOptionGroupRemove  : null, // function(id) { ... }
    onOptionGroupClear   : null, // function() { ... }
    onDropdownOpen       : null, // function(dropdown) { ... }
    onDropdownClose      : null, // function(dropdown) { ... }
    onType               : null, // function(str) { ... }
    onDelete             : null, // function(values) { ... }
    */
    render: {
      /*
      item: null,
      optgroup: null,
      optgroup_header: null,
      option: null,
      option_create: null
      */
    }
  };

  // node_modules/tom-select/dist/esm/getSettings.js
  function getSettings(input, settings_user) {
    var settings = Object.assign({}, defaults_default, settings_user);
    var attr_data = settings.dataAttr;
    var field_label = settings.labelField;
    var field_value = settings.valueField;
    var field_disabled = settings.disabledField;
    var field_optgroup = settings.optgroupField;
    var field_optgroup_label = settings.optgroupLabelField;
    var field_optgroup_value = settings.optgroupValueField;
    var tag_name = input.tagName.toLowerCase();
    var placeholder = input.getAttribute("placeholder") || input.getAttribute("data-placeholder");
    if (!placeholder && !settings.allowEmptyOption) {
      let option = input.querySelector('option[value=""]');
      if (option) {
        placeholder = option.textContent;
      }
    }
    var settings_element = {
      placeholder,
      options: [],
      optgroups: [],
      items: [],
      maxItems: null
    };
    var init_select = () => {
      var tagName;
      var options = settings_element.options;
      var optionsMap = {};
      var group_count = 1;
      let $order = 0;
      var readData = (el) => {
        var data = Object.assign({}, el.dataset);
        var json = attr_data && data[attr_data];
        if (typeof json === "string" && json.length) {
          data = Object.assign(data, JSON.parse(json));
        }
        return data;
      };
      var addOption = (option, group) => {
        var value = hash_key(option.value);
        if (value == null)
          return;
        if (!value && !settings.allowEmptyOption)
          return;
        if (optionsMap.hasOwnProperty(value)) {
          if (group) {
            var arr = optionsMap[value][field_optgroup];
            if (!arr) {
              optionsMap[value][field_optgroup] = group;
            } else if (!Array.isArray(arr)) {
              optionsMap[value][field_optgroup] = [arr, group];
            } else {
              arr.push(group);
            }
          }
        } else {
          var option_data = readData(option);
          option_data[field_label] = option_data[field_label] || option.textContent;
          option_data[field_value] = option_data[field_value] || value;
          option_data[field_disabled] = option_data[field_disabled] || option.disabled;
          option_data[field_optgroup] = option_data[field_optgroup] || group;
          option_data.$option = option;
          option_data.$order = option_data.$order || ++$order;
          optionsMap[value] = option_data;
          options.push(option_data);
        }
        if (option.selected) {
          settings_element.items.push(value);
        }
      };
      var addGroup = (optgroup) => {
        var id, optgroup_data;
        optgroup_data = readData(optgroup);
        optgroup_data[field_optgroup_label] = optgroup_data[field_optgroup_label] || optgroup.getAttribute("label") || "";
        optgroup_data[field_optgroup_value] = optgroup_data[field_optgroup_value] || group_count++;
        optgroup_data[field_disabled] = optgroup_data[field_disabled] || optgroup.disabled;
        optgroup_data.$order = optgroup_data.$order || ++$order;
        settings_element.optgroups.push(optgroup_data);
        id = optgroup_data[field_optgroup_value];
        iterate2(optgroup.children, (option) => {
          addOption(option, id);
        });
      };
      settings_element.maxItems = input.hasAttribute("multiple") ? null : 1;
      iterate2(input.children, (child) => {
        tagName = child.tagName.toLowerCase();
        if (tagName === "optgroup") {
          addGroup(child);
        } else if (tagName === "option") {
          addOption(child);
        }
      });
    };
    var init_textbox = () => {
      const data_raw = input.getAttribute(attr_data);
      if (!data_raw) {
        var value = input.value.trim() || "";
        if (!settings.allowEmptyOption && !value.length)
          return;
        const values = value.split(settings.delimiter);
        iterate2(values, (value2) => {
          const option = {};
          option[field_label] = value2;
          option[field_value] = value2;
          settings_element.options.push(option);
        });
        settings_element.items = values;
      } else {
        settings_element.options = JSON.parse(data_raw);
        iterate2(settings_element.options, (opt) => {
          settings_element.items.push(opt[field_value]);
        });
      }
    };
    if (tag_name === "select") {
      init_select();
    } else {
      init_textbox();
    }
    return Object.assign({}, defaults_default, settings_element, settings_user);
  }

  // node_modules/tom-select/dist/esm/tom-select.js
  var instance_i = 0;
  var TomSelect = class extends MicroPlugin(MicroEvent) {
    constructor(input_arg, user_settings) {
      super();
      this.order = 0;
      this.isOpen = false;
      this.isDisabled = false;
      this.isReadOnly = false;
      this.isInvalid = false;
      this.isValid = true;
      this.isLocked = false;
      this.isFocused = false;
      this.isInputHidden = false;
      this.isSetup = false;
      this.ignoreFocus = false;
      this.ignoreHover = false;
      this.hasOptions = false;
      this.lastValue = "";
      this.caretPos = 0;
      this.loading = 0;
      this.loadedSearches = {};
      this.activeOption = null;
      this.activeItems = [];
      this.optgroups = {};
      this.options = {};
      this.userOptions = {};
      this.items = [];
      this.refreshTimeout = null;
      instance_i++;
      var dir;
      var input = getDom(input_arg);
      if (input.tomselect) {
        throw new Error("Tom Select already initialized on this element");
      }
      input.tomselect = this;
      var computedStyle = window.getComputedStyle && window.getComputedStyle(input, null);
      dir = computedStyle.getPropertyValue("direction");
      const settings = getSettings(input, user_settings);
      this.settings = settings;
      this.input = input;
      this.tabIndex = input.tabIndex || 0;
      this.is_select_tag = input.tagName.toLowerCase() === "select";
      this.rtl = /rtl/i.test(dir);
      this.inputId = getId(input, "tomselect-" + instance_i);
      this.isRequired = input.required;
      this.sifter = new Sifter(this.options, { diacritics: settings.diacritics });
      settings.mode = settings.mode || (settings.maxItems === 1 ? "single" : "multi");
      if (typeof settings.hideSelected !== "boolean") {
        settings.hideSelected = settings.mode === "multi";
      }
      if (typeof settings.hidePlaceholder !== "boolean") {
        settings.hidePlaceholder = settings.mode !== "multi";
      }
      var filter = settings.createFilter;
      if (typeof filter !== "function") {
        if (typeof filter === "string") {
          filter = new RegExp(filter);
        }
        if (filter instanceof RegExp) {
          settings.createFilter = (input2) => filter.test(input2);
        } else {
          settings.createFilter = (value) => {
            return this.settings.duplicates || !this.options[value];
          };
        }
      }
      this.initializePlugins(settings.plugins);
      this.setupCallbacks();
      this.setupTemplates();
      const wrapper = getDom("<div>");
      const control = getDom("<div>");
      const dropdown = this._render("dropdown");
      const dropdown_content = getDom(`<div role="listbox" tabindex="-1">`);
      const classes = this.input.getAttribute("class") || "";
      const inputMode = settings.mode;
      var control_input;
      addClasses(wrapper, settings.wrapperClass, classes, inputMode);
      addClasses(control, settings.controlClass);
      append(wrapper, control);
      addClasses(dropdown, settings.dropdownClass, inputMode);
      if (settings.copyClassesToDropdown) {
        addClasses(dropdown, classes);
      }
      addClasses(dropdown_content, settings.dropdownContentClass);
      append(dropdown, dropdown_content);
      getDom(settings.dropdownParent || wrapper).appendChild(dropdown);
      if (isHtmlString(settings.controlInput)) {
        control_input = getDom(settings.controlInput);
        var attrs = ["autocorrect", "autocapitalize", "autocomplete", "spellcheck"];
        iterate2(attrs, (attr) => {
          if (input.getAttribute(attr)) {
            setAttr(control_input, { [attr]: input.getAttribute(attr) });
          }
        });
        control_input.tabIndex = -1;
        control.appendChild(control_input);
        this.focus_node = control_input;
      } else if (settings.controlInput) {
        control_input = getDom(settings.controlInput);
        this.focus_node = control_input;
      } else {
        control_input = getDom("<input/>");
        this.focus_node = control;
      }
      this.wrapper = wrapper;
      this.dropdown = dropdown;
      this.dropdown_content = dropdown_content;
      this.control = control;
      this.control_input = control_input;
      this.setup();
    }
    /**
     * set up event bindings.
     *
     */
    setup() {
      const self = this;
      const settings = self.settings;
      const control_input = self.control_input;
      const dropdown = self.dropdown;
      const dropdown_content = self.dropdown_content;
      const wrapper = self.wrapper;
      const control = self.control;
      const input = self.input;
      const focus_node = self.focus_node;
      const passive_event = { passive: true };
      const listboxId = self.inputId + "-ts-dropdown";
      setAttr(dropdown_content, {
        id: listboxId
      });
      setAttr(focus_node, {
        role: "combobox",
        "aria-haspopup": "listbox",
        "aria-expanded": "false",
        "aria-controls": listboxId
      });
      const control_id = getId(focus_node, self.inputId + "-ts-control");
      const query = "label[for='" + escapeQuery(self.inputId) + "']";
      const label = document.querySelector(query);
      const label_click = self.focus.bind(self);
      if (label) {
        addEvent(label, "click", label_click);
        setAttr(label, { for: control_id });
        const label_id = getId(label, self.inputId + "-ts-label");
        setAttr(focus_node, { "aria-labelledby": label_id });
        setAttr(dropdown_content, { "aria-labelledby": label_id });
      }
      wrapper.style.width = input.style.width;
      if (self.plugins.names.length) {
        const classes_plugins = "plugin-" + self.plugins.names.join(" plugin-");
        addClasses([wrapper, dropdown], classes_plugins);
      }
      if ((settings.maxItems === null || settings.maxItems > 1) && self.is_select_tag) {
        setAttr(input, { multiple: "multiple" });
      }
      if (settings.placeholder) {
        setAttr(control_input, { placeholder: settings.placeholder });
      }
      if (!settings.splitOn && settings.delimiter) {
        settings.splitOn = new RegExp("\\s*" + escape_regex(settings.delimiter) + "+\\s*");
      }
      if (settings.load && settings.loadThrottle) {
        settings.load = loadDebounce(settings.load, settings.loadThrottle);
      }
      addEvent(dropdown, "mousemove", () => {
        self.ignoreHover = false;
      });
      addEvent(dropdown, "mouseenter", (e) => {
        var target_match = parentMatch(e.target, "[data-selectable]", dropdown);
        if (target_match)
          self.onOptionHover(e, target_match);
      }, { capture: true });
      addEvent(dropdown, "click", (evt) => {
        const option = parentMatch(evt.target, "[data-selectable]");
        if (option) {
          self.onOptionSelect(evt, option);
          preventDefault(evt, true);
        }
      });
      addEvent(control, "click", (evt) => {
        var target_match = parentMatch(evt.target, "[data-ts-item]", control);
        if (target_match && self.onItemSelect(evt, target_match)) {
          preventDefault(evt, true);
          return;
        }
        if (control_input.value != "") {
          return;
        }
        self.onClick();
        preventDefault(evt, true);
      });
      addEvent(focus_node, "keydown", (e) => self.onKeyDown(e));
      addEvent(control_input, "keypress", (e) => self.onKeyPress(e));
      addEvent(control_input, "input", (e) => self.onInput(e));
      addEvent(focus_node, "blur", (e) => self.onBlur(e));
      addEvent(focus_node, "focus", (e) => self.onFocus(e));
      addEvent(control_input, "paste", (e) => self.onPaste(e));
      const doc_mousedown = (evt) => {
        const target = evt.composedPath()[0];
        if (!wrapper.contains(target) && !dropdown.contains(target)) {
          if (self.isFocused) {
            self.blur();
          }
          self.inputState();
          return;
        }
        if (target == control_input && self.isOpen) {
          evt.stopPropagation();
        } else {
          preventDefault(evt, true);
        }
      };
      const win_scroll = () => {
        if (self.isOpen) {
          self.positionDropdown();
        }
      };
      addEvent(document, "mousedown", doc_mousedown);
      addEvent(window, "scroll", win_scroll, passive_event);
      addEvent(window, "resize", win_scroll, passive_event);
      this._destroy = () => {
        document.removeEventListener("mousedown", doc_mousedown);
        window.removeEventListener("scroll", win_scroll);
        window.removeEventListener("resize", win_scroll);
        if (label)
          label.removeEventListener("click", label_click);
      };
      this.revertSettings = {
        innerHTML: input.innerHTML,
        tabIndex: input.tabIndex
      };
      input.tabIndex = -1;
      input.insertAdjacentElement("afterend", self.wrapper);
      self.sync(false);
      settings.items = [];
      delete settings.optgroups;
      delete settings.options;
      addEvent(input, "invalid", () => {
        if (self.isValid) {
          self.isValid = false;
          self.isInvalid = true;
          self.refreshState();
        }
      });
      self.updateOriginalInput();
      self.refreshItems();
      self.close(false);
      self.inputState();
      self.isSetup = true;
      if (input.disabled) {
        self.disable();
      } else if (input.readOnly) {
        self.setReadOnly(true);
      } else {
        self.enable();
      }
      self.on("change", this.onChange);
      addClasses(input, "tomselected", "ts-hidden-accessible");
      self.trigger("initialize");
      if (settings.preload === true) {
        self.preload();
      }
    }
    /**
     * Register options and optgroups
     *
     */
    setupOptions(options = [], optgroups = []) {
      this.addOptions(options);
      iterate2(optgroups, (optgroup) => {
        this.registerOptionGroup(optgroup);
      });
    }
    /**
     * Sets up default rendering functions.
     */
    setupTemplates() {
      var self = this;
      var field_label = self.settings.labelField;
      var field_optgroup = self.settings.optgroupLabelField;
      var templates = {
        "optgroup": (data) => {
          let optgroup = document.createElement("div");
          optgroup.className = "optgroup";
          optgroup.appendChild(data.options);
          return optgroup;
        },
        "optgroup_header": (data, escape) => {
          return '<div class="optgroup-header">' + escape(data[field_optgroup]) + "</div>";
        },
        "option": (data, escape) => {
          return "<div>" + escape(data[field_label]) + "</div>";
        },
        "item": (data, escape) => {
          return "<div>" + escape(data[field_label]) + "</div>";
        },
        "option_create": (data, escape) => {
          return '<div class="create">Add <strong>' + escape(data.input) + "</strong>&hellip;</div>";
        },
        "no_results": () => {
          return '<div class="no-results">No results found</div>';
        },
        "loading": () => {
          return '<div class="spinner"></div>';
        },
        "not_loading": () => {
        },
        "dropdown": () => {
          return "<div></div>";
        }
      };
      self.settings.render = Object.assign({}, templates, self.settings.render);
    }
    /**
     * Maps fired events to callbacks provided
     * in the settings used when creating the control.
     */
    setupCallbacks() {
      var key, fn2;
      var callbacks = {
        "initialize": "onInitialize",
        "change": "onChange",
        "item_add": "onItemAdd",
        "item_remove": "onItemRemove",
        "item_select": "onItemSelect",
        "clear": "onClear",
        "option_add": "onOptionAdd",
        "option_remove": "onOptionRemove",
        "option_clear": "onOptionClear",
        "optgroup_add": "onOptionGroupAdd",
        "optgroup_remove": "onOptionGroupRemove",
        "optgroup_clear": "onOptionGroupClear",
        "dropdown_open": "onDropdownOpen",
        "dropdown_close": "onDropdownClose",
        "type": "onType",
        "load": "onLoad",
        "focus": "onFocus",
        "blur": "onBlur"
      };
      for (key in callbacks) {
        fn2 = this.settings[callbacks[key]];
        if (fn2)
          this.on(key, fn2);
      }
    }
    /**
     * Sync the Tom Select instance with the original input or select
     *
     */
    sync(get_settings = true) {
      const self = this;
      const settings = get_settings ? getSettings(self.input, { delimiter: self.settings.delimiter }) : self.settings;
      self.setupOptions(settings.options, settings.optgroups);
      self.setValue(settings.items || [], true);
      self.lastQuery = null;
    }
    /**
     * Triggered when the main control element
     * has a click event.
     *
     */
    onClick() {
      var self = this;
      if (self.activeItems.length > 0) {
        self.clearActiveItems();
        self.focus();
        return;
      }
      if (self.isFocused && self.isOpen) {
        self.blur();
      } else {
        self.focus();
      }
    }
    /**
     * @deprecated v1.7
     *
     */
    onMouseDown() {
    }
    /**
     * Triggered when the value of the control has been changed.
     * This should propagate the event to the original DOM
     * input / select element.
     */
    onChange() {
      triggerEvent(this.input, "input");
      triggerEvent(this.input, "change");
    }
    /**
     * Triggered on <input> paste.
     *
     */
    onPaste(e) {
      var self = this;
      if (self.isInputHidden || self.isLocked) {
        preventDefault(e);
        return;
      }
      if (!self.settings.splitOn) {
        return;
      }
      setTimeout(() => {
        var pastedText = self.inputValue();
        if (!pastedText.match(self.settings.splitOn)) {
          return;
        }
        var splitInput = pastedText.trim().split(self.settings.splitOn);
        iterate2(splitInput, (piece) => {
          const hash3 = hash_key(piece);
          if (hash3) {
            if (this.options[piece]) {
              self.addItem(piece);
            } else {
              self.createItem(piece);
            }
          }
        });
      }, 0);
    }
    /**
     * Triggered on <input> keypress.
     *
     */
    onKeyPress(e) {
      var self = this;
      if (self.isLocked) {
        preventDefault(e);
        return;
      }
      var character = String.fromCharCode(e.keyCode || e.which);
      if (self.settings.create && self.settings.mode === "multi" && character === self.settings.delimiter) {
        self.createItem();
        preventDefault(e);
        return;
      }
    }
    /**
     * Triggered on <input> keydown.
     *
     */
    onKeyDown(e) {
      var self = this;
      self.ignoreHover = true;
      if (self.isLocked) {
        if (e.keyCode !== KEY_TAB) {
          preventDefault(e);
        }
        return;
      }
      switch (e.keyCode) {
        // ctrl+A: select all
        case KEY_A:
          if (isKeyDown(KEY_SHORTCUT, e)) {
            if (self.control_input.value == "") {
              preventDefault(e);
              self.selectAll();
              return;
            }
          }
          break;
        // esc: close dropdown
        case KEY_ESC:
          if (self.isOpen) {
            preventDefault(e, true);
            self.close();
          }
          self.clearActiveItems();
          return;
        // down: open dropdown or move selection down
        case KEY_DOWN:
          if (!self.isOpen && self.hasOptions) {
            self.open();
          } else if (self.activeOption) {
            let next = self.getAdjacent(self.activeOption, 1);
            if (next)
              self.setActiveOption(next);
          }
          preventDefault(e);
          return;
        // up: move selection up
        case KEY_UP:
          if (self.activeOption) {
            let prev = self.getAdjacent(self.activeOption, -1);
            if (prev)
              self.setActiveOption(prev);
          }
          preventDefault(e);
          return;
        // return: select active option
        case KEY_RETURN:
          if (self.canSelect(self.activeOption)) {
            self.onOptionSelect(e, self.activeOption);
            preventDefault(e);
          } else if (self.settings.create && self.createItem()) {
            preventDefault(e);
          } else if (document.activeElement == self.control_input && self.isOpen) {
            preventDefault(e);
          }
          return;
        // left: modifiy item selection to the left
        case KEY_LEFT:
          self.advanceSelection(-1, e);
          return;
        // right: modifiy item selection to the right
        case KEY_RIGHT:
          self.advanceSelection(1, e);
          return;
        // tab: select active option and/or create item
        case KEY_TAB:
          if (self.settings.selectOnTab) {
            if (self.canSelect(self.activeOption)) {
              self.onOptionSelect(e, self.activeOption);
              preventDefault(e);
            }
            if (self.settings.create && self.createItem()) {
              preventDefault(e);
            }
          }
          return;
        // delete|backspace: delete items
        case KEY_BACKSPACE:
        case KEY_DELETE:
          self.deleteSelection(e);
          return;
      }
      if (self.isInputHidden && !isKeyDown(KEY_SHORTCUT, e)) {
        preventDefault(e);
      }
    }
    /**
     * Triggered on <input> keyup.
     *
     */
    onInput(e) {
      if (this.isLocked) {
        return;
      }
      const value = this.inputValue();
      if (this.lastValue === value)
        return;
      this.lastValue = value;
      if (value == "") {
        this._onInput();
        return;
      }
      if (this.refreshTimeout) {
        window.clearTimeout(this.refreshTimeout);
      }
      this.refreshTimeout = timeout(() => {
        this.refreshTimeout = null;
        this._onInput();
      }, this.settings.refreshThrottle);
    }
    _onInput() {
      const value = this.lastValue;
      if (this.settings.shouldLoad.call(this, value)) {
        this.load(value);
      }
      this.refreshOptions();
      this.trigger("type", value);
    }
    /**
     * Triggered when the user rolls over
     * an option in the autocomplete dropdown menu.
     *
     */
    onOptionHover(evt, option) {
      if (this.ignoreHover)
        return;
      this.setActiveOption(option, false);
    }
    /**
     * Triggered on <input> focus.
     *
     */
    onFocus(e) {
      var self = this;
      var wasFocused = self.isFocused;
      if (self.isDisabled || self.isReadOnly) {
        self.blur();
        preventDefault(e);
        return;
      }
      if (self.ignoreFocus)
        return;
      self.isFocused = true;
      if (self.settings.preload === "focus")
        self.preload();
      if (!wasFocused)
        self.trigger("focus");
      if (!self.activeItems.length) {
        self.inputState();
        self.refreshOptions(!!self.settings.openOnFocus);
      }
      self.refreshState();
    }
    /**
     * Triggered on <input> blur.
     *
     */
    onBlur(e) {
      if (document.hasFocus() === false)
        return;
      var self = this;
      if (!self.isFocused)
        return;
      self.isFocused = false;
      self.ignoreFocus = false;
      var deactivate = () => {
        self.close();
        self.setActiveItem();
        self.setCaret(self.items.length);
        self.trigger("blur");
      };
      if (self.settings.create && self.settings.createOnBlur) {
        self.createItem(null, deactivate);
      } else {
        deactivate();
      }
    }
    /**
     * Triggered when the user clicks on an option
     * in the autocomplete dropdown menu.
     *
     */
    onOptionSelect(evt, option) {
      var value, self = this;
      if (option.parentElement && option.parentElement.matches("[data-disabled]")) {
        return;
      }
      if (option.classList.contains("create")) {
        self.createItem(null, () => {
          if (self.settings.closeAfterSelect) {
            self.close();
          }
        });
      } else {
        value = option.dataset.value;
        if (typeof value !== "undefined") {
          self.lastQuery = null;
          self.addItem(value);
          if (self.settings.closeAfterSelect) {
            self.close();
          }
          if (!self.settings.hideSelected && evt.type && /click/.test(evt.type)) {
            self.setActiveOption(option);
          }
        }
      }
    }
    /**
     * Return true if the given option can be selected
     *
     */
    canSelect(option) {
      if (this.isOpen && option && this.dropdown_content.contains(option)) {
        return true;
      }
      return false;
    }
    /**
     * Triggered when the user clicks on an item
     * that has been selected.
     *
     */
    onItemSelect(evt, item) {
      var self = this;
      if (!self.isLocked && self.settings.mode === "multi") {
        preventDefault(evt);
        self.setActiveItem(item, evt);
        return true;
      }
      return false;
    }
    /**
     * Determines whether or not to invoke
     * the user-provided option provider / loader
     *
     * Note, there is a subtle difference between
     * this.canLoad() and this.settings.shouldLoad();
     *
     *	- settings.shouldLoad() is a user-input validator.
     *	When false is returned, the not_loading template
     *	will be added to the dropdown
     *
     *	- canLoad() is lower level validator that checks
     * 	the Tom Select instance. There is no inherent user
     *	feedback when canLoad returns false
     *
     */
    canLoad(value) {
      if (!this.settings.load)
        return false;
      if (this.loadedSearches.hasOwnProperty(value))
        return false;
      return true;
    }
    /**
     * Invokes the user-provided option provider / loader.
     *
     */
    load(value) {
      const self = this;
      if (!self.canLoad(value))
        return;
      addClasses(self.wrapper, self.settings.loadingClass);
      self.loading++;
      const callback = self.loadCallback.bind(self);
      self.settings.load.call(self, value, callback);
    }
    /**
     * Invoked by the user-provided option provider
     *
     */
    loadCallback(options, optgroups) {
      const self = this;
      self.loading = Math.max(self.loading - 1, 0);
      self.lastQuery = null;
      self.clearActiveOption();
      self.setupOptions(options, optgroups);
      self.refreshOptions(self.isFocused && !self.isInputHidden);
      if (!self.loading) {
        removeClasses(self.wrapper, self.settings.loadingClass);
      }
      self.trigger("load", options, optgroups);
    }
    preload() {
      var classList = this.wrapper.classList;
      if (classList.contains("preloaded"))
        return;
      classList.add("preloaded");
      this.load("");
    }
    /**
     * Sets the input field of the control to the specified value.
     *
     */
    setTextboxValue(value = "") {
      var input = this.control_input;
      var changed = input.value !== value;
      if (changed) {
        input.value = value;
        triggerEvent(input, "update");
        this.lastValue = value;
      }
    }
    /**
     * Returns the value of the control. If multiple items
     * can be selected (e.g. <select multiple>), this returns
     * an array. If only one item can be selected, this
     * returns a string.
     *
     */
    getValue() {
      if (this.is_select_tag && this.input.hasAttribute("multiple")) {
        return this.items;
      }
      return this.items.join(this.settings.delimiter);
    }
    /**
     * Resets the selected items to the given value.
     *
     */
    setValue(value, silent) {
      var events = silent ? [] : ["change"];
      debounce_events(this, events, () => {
        this.clear(silent);
        this.addItems(value, silent);
      });
    }
    /**
     * Resets the number of max items to the given value
     *
     */
    setMaxItems(value) {
      if (value === 0)
        value = null;
      this.settings.maxItems = value;
      this.refreshState();
    }
    /**
     * Sets the selected item.
     *
     */
    setActiveItem(item, e) {
      var self = this;
      var eventName;
      var i, begin, end2, swap;
      var last;
      if (self.settings.mode === "single")
        return;
      if (!item) {
        self.clearActiveItems();
        if (self.isFocused) {
          self.inputState();
        }
        return;
      }
      eventName = e && e.type.toLowerCase();
      if (eventName === "click" && isKeyDown("shiftKey", e) && self.activeItems.length) {
        last = self.getLastActive();
        begin = Array.prototype.indexOf.call(self.control.children, last);
        end2 = Array.prototype.indexOf.call(self.control.children, item);
        if (begin > end2) {
          swap = begin;
          begin = end2;
          end2 = swap;
        }
        for (i = begin; i <= end2; i++) {
          item = self.control.children[i];
          if (self.activeItems.indexOf(item) === -1) {
            self.setActiveItemClass(item);
          }
        }
        preventDefault(e);
      } else if (eventName === "click" && isKeyDown(KEY_SHORTCUT, e) || eventName === "keydown" && isKeyDown("shiftKey", e)) {
        if (item.classList.contains("active")) {
          self.removeActiveItem(item);
        } else {
          self.setActiveItemClass(item);
        }
      } else {
        self.clearActiveItems();
        self.setActiveItemClass(item);
      }
      self.inputState();
      if (!self.isFocused) {
        self.focus();
      }
    }
    /**
     * Set the active and last-active classes
     *
     */
    setActiveItemClass(item) {
      const self = this;
      const last_active = self.control.querySelector(".last-active");
      if (last_active)
        removeClasses(last_active, "last-active");
      addClasses(item, "active last-active");
      self.trigger("item_select", item);
      if (self.activeItems.indexOf(item) == -1) {
        self.activeItems.push(item);
      }
    }
    /**
     * Remove active item
     *
     */
    removeActiveItem(item) {
      var idx = this.activeItems.indexOf(item);
      this.activeItems.splice(idx, 1);
      removeClasses(item, "active");
    }
    /**
     * Clears all the active items
     *
     */
    clearActiveItems() {
      removeClasses(this.activeItems, "active");
      this.activeItems = [];
    }
    /**
     * Sets the selected item in the dropdown menu
     * of available options.
     *
     */
    setActiveOption(option, scroll = true) {
      if (option === this.activeOption) {
        return;
      }
      this.clearActiveOption();
      if (!option)
        return;
      this.activeOption = option;
      setAttr(this.focus_node, { "aria-activedescendant": option.getAttribute("id") });
      setAttr(option, { "aria-selected": "true" });
      addClasses(option, "active");
      if (scroll)
        this.scrollToOption(option);
    }
    /**
     * Sets the dropdown_content scrollTop to display the option
     *
     */
    scrollToOption(option, behavior) {
      if (!option)
        return;
      const content = this.dropdown_content;
      const height_menu = content.clientHeight;
      const scrollTop = content.scrollTop || 0;
      const height_item = option.offsetHeight;
      const y = option.getBoundingClientRect().top - content.getBoundingClientRect().top + scrollTop;
      if (y + height_item > height_menu + scrollTop) {
        this.scroll(y - height_menu + height_item, behavior);
      } else if (y < scrollTop) {
        this.scroll(y, behavior);
      }
    }
    /**
     * Scroll the dropdown to the given position
     *
     */
    scroll(scrollTop, behavior) {
      const content = this.dropdown_content;
      if (behavior) {
        content.style.scrollBehavior = behavior;
      }
      content.scrollTop = scrollTop;
      content.style.scrollBehavior = "";
    }
    /**
     * Clears the active option
     *
     */
    clearActiveOption() {
      if (this.activeOption) {
        removeClasses(this.activeOption, "active");
        setAttr(this.activeOption, { "aria-selected": null });
      }
      this.activeOption = null;
      setAttr(this.focus_node, { "aria-activedescendant": null });
    }
    /**
     * Selects all items (CTRL + A).
     */
    selectAll() {
      const self = this;
      if (self.settings.mode === "single")
        return;
      const activeItems = self.controlChildren();
      if (!activeItems.length)
        return;
      self.inputState();
      self.close();
      self.activeItems = activeItems;
      iterate2(activeItems, (item) => {
        self.setActiveItemClass(item);
      });
    }
    /**
     * Determines if the control_input should be in a hidden or visible state
     *
     */
    inputState() {
      var self = this;
      if (!self.control.contains(self.control_input))
        return;
      setAttr(self.control_input, { placeholder: self.settings.placeholder });
      if (self.activeItems.length > 0 || !self.isFocused && self.settings.hidePlaceholder && self.items.length > 0) {
        self.setTextboxValue();
        self.isInputHidden = true;
      } else {
        if (self.settings.hidePlaceholder && self.items.length > 0) {
          setAttr(self.control_input, { placeholder: "" });
        }
        self.isInputHidden = false;
      }
      self.wrapper.classList.toggle("input-hidden", self.isInputHidden);
    }
    /**
     * Get the input value
     */
    inputValue() {
      return this.control_input.value.trim();
    }
    /**
     * Gives the control focus.
     */
    focus() {
      var self = this;
      if (self.isDisabled || self.isReadOnly)
        return;
      self.ignoreFocus = true;
      if (self.control_input.offsetWidth) {
        self.control_input.focus();
      } else {
        self.focus_node.focus();
      }
      setTimeout(() => {
        self.ignoreFocus = false;
        self.onFocus();
      }, 0);
    }
    /**
     * Forces the control out of focus.
     *
     */
    blur() {
      this.focus_node.blur();
      this.onBlur();
    }
    /**
     * Returns a function that scores an object
     * to show how good of a match it is to the
     * provided query.
     *
     * @return {function}
     */
    getScoreFunction(query) {
      return this.sifter.getScoreFunction(query, this.getSearchOptions());
    }
    /**
     * Returns search options for sifter (the system
     * for scoring and sorting results).
     *
     * @see https://github.com/orchidjs/sifter.js
     * @return {object}
     */
    getSearchOptions() {
      var settings = this.settings;
      var sort = settings.sortField;
      if (typeof settings.sortField === "string") {
        sort = [{ field: settings.sortField }];
      }
      return {
        fields: settings.searchField,
        conjunction: settings.searchConjunction,
        sort,
        nesting: settings.nesting
      };
    }
    /**
     * Searches through available options and returns
     * a sorted array of matches.
     *
     */
    search(query) {
      var result, calculateScore;
      var self = this;
      var options = this.getSearchOptions();
      if (self.settings.score) {
        calculateScore = self.settings.score.call(self, query);
        if (typeof calculateScore !== "function") {
          throw new Error('Tom Select "score" setting must be a function that returns a function');
        }
      }
      if (query !== self.lastQuery) {
        self.lastQuery = query;
        result = self.sifter.search(query, Object.assign(options, { score: calculateScore }));
        self.currentResults = result;
      } else {
        result = Object.assign({}, self.currentResults);
      }
      if (self.settings.hideSelected) {
        result.items = result.items.filter((item) => {
          let hashed = hash_key(item.id);
          return !(hashed && self.items.indexOf(hashed) !== -1);
        });
      }
      return result;
    }
    /**
     * Refreshes the list of available options shown
     * in the autocomplete dropdown menu.
     *
     */
    refreshOptions(triggerDropdown = true) {
      var i, j, k, n, optgroup, optgroups, html, has_create_option, active_group;
      var create;
      const groups = {};
      const groups_order = [];
      var self = this;
      var query = self.inputValue();
      const same_query = query === self.lastQuery || query == "" && self.lastQuery == null;
      var results = self.search(query);
      var active_option = null;
      var show_dropdown = self.settings.shouldOpen || false;
      var dropdown_content = self.dropdown_content;
      if (same_query) {
        active_option = self.activeOption;
        if (active_option) {
          active_group = active_option.closest("[data-group]");
        }
      }
      n = results.items.length;
      if (typeof self.settings.maxOptions === "number") {
        n = Math.min(n, self.settings.maxOptions);
      }
      if (n > 0) {
        show_dropdown = true;
      }
      const getGroupFragment = (optgroup2, order2) => {
        let group_order_i = groups[optgroup2];
        if (group_order_i !== void 0) {
          let order_group = groups_order[group_order_i];
          if (order_group !== void 0) {
            return [group_order_i, order_group.fragment];
          }
        }
        let group_fragment = document.createDocumentFragment();
        group_order_i = groups_order.length;
        groups_order.push({ fragment: group_fragment, order: order2, optgroup: optgroup2 });
        return [group_order_i, group_fragment];
      };
      for (i = 0; i < n; i++) {
        let item = results.items[i];
        if (!item)
          continue;
        let opt_value = item.id;
        let option = self.options[opt_value];
        if (option === void 0)
          continue;
        let opt_hash = get_hash(opt_value);
        let option_el = self.getOption(opt_hash, true);
        if (!self.settings.hideSelected) {
          option_el.classList.toggle("selected", self.items.includes(opt_hash));
        }
        optgroup = option[self.settings.optgroupField] || "";
        optgroups = Array.isArray(optgroup) ? optgroup : [optgroup];
        for (j = 0, k = optgroups && optgroups.length; j < k; j++) {
          optgroup = optgroups[j];
          let order2 = option.$order;
          let self_optgroup = self.optgroups[optgroup];
          if (self_optgroup === void 0) {
            optgroup = "";
          } else {
            order2 = self_optgroup.$order;
          }
          const [group_order_i, group_fragment] = getGroupFragment(optgroup, order2);
          if (j > 0) {
            option_el = option_el.cloneNode(true);
            setAttr(option_el, { id: option.$id + "-clone-" + j, "aria-selected": null });
            option_el.classList.add("ts-cloned");
            removeClasses(option_el, "active");
            if (self.activeOption && self.activeOption.dataset.value == opt_value) {
              if (active_group && active_group.dataset.group === optgroup.toString()) {
                active_option = option_el;
              }
            }
          }
          group_fragment.appendChild(option_el);
          if (optgroup != "") {
            groups[optgroup] = group_order_i;
          }
        }
      }
      if (self.settings.lockOptgroupOrder) {
        groups_order.sort((a, b) => {
          return a.order - b.order;
        });
      }
      html = document.createDocumentFragment();
      iterate2(groups_order, (group_order) => {
        let group_fragment = group_order.fragment;
        let optgroup2 = group_order.optgroup;
        if (!group_fragment || !group_fragment.children.length)
          return;
        let group_heading = self.optgroups[optgroup2];
        if (group_heading !== void 0) {
          let group_options = document.createDocumentFragment();
          let header = self.render("optgroup_header", group_heading);
          append(group_options, header);
          append(group_options, group_fragment);
          let group_html = self.render("optgroup", { group: group_heading, options: group_options });
          append(html, group_html);
        } else {
          append(html, group_fragment);
        }
      });
      dropdown_content.innerHTML = "";
      append(dropdown_content, html);
      if (self.settings.highlight) {
        removeHighlight(dropdown_content);
        if (results.query.length && results.tokens.length) {
          iterate2(results.tokens, (tok) => {
            highlight(dropdown_content, tok.regex);
          });
        }
      }
      var add_template = (template) => {
        let content = self.render(template, { input: query });
        if (content) {
          show_dropdown = true;
          dropdown_content.insertBefore(content, dropdown_content.firstChild);
        }
        return content;
      };
      if (self.loading) {
        add_template("loading");
      } else if (!self.settings.shouldLoad.call(self, query)) {
        add_template("not_loading");
      } else if (results.items.length === 0) {
        add_template("no_results");
      }
      has_create_option = self.canCreate(query);
      if (has_create_option) {
        create = add_template("option_create");
      }
      self.hasOptions = results.items.length > 0 || has_create_option;
      if (show_dropdown) {
        if (results.items.length > 0) {
          if (!active_option && self.settings.mode === "single" && self.items[0] != void 0) {
            active_option = self.getOption(self.items[0]);
          }
          if (!dropdown_content.contains(active_option)) {
            let active_index = 0;
            if (create && !self.settings.addPrecedence) {
              active_index = 1;
            }
            active_option = self.selectable()[active_index];
          }
        } else if (create) {
          active_option = create;
        }
        if (triggerDropdown && !self.isOpen) {
          self.open();
          self.scrollToOption(active_option, "auto");
        }
        self.setActiveOption(active_option);
      } else {
        self.clearActiveOption();
        if (triggerDropdown && self.isOpen) {
          self.close(false);
        }
      }
    }
    /**
     * Return list of selectable options
     *
     */
    selectable() {
      return this.dropdown_content.querySelectorAll("[data-selectable]");
    }
    /**
     * Adds an available option. If it already exists,
     * nothing will happen. Note: this does not refresh
     * the options list dropdown (use `refreshOptions`
     * for that).
     *
     * Usage:
     *
     *   this.addOption(data)
     *
     */
    addOption(data, user_created = false) {
      const self = this;
      if (Array.isArray(data)) {
        self.addOptions(data, user_created);
        return false;
      }
      const key = hash_key(data[self.settings.valueField]);
      if (key === null || self.options.hasOwnProperty(key)) {
        return false;
      }
      data.$order = data.$order || ++self.order;
      data.$id = self.inputId + "-opt-" + data.$order;
      self.options[key] = data;
      self.lastQuery = null;
      if (user_created) {
        self.userOptions[key] = user_created;
        self.trigger("option_add", key, data);
      }
      return key;
    }
    /**
     * Add multiple options
     *
     */
    addOptions(data, user_created = false) {
      iterate2(data, (dat) => {
        this.addOption(dat, user_created);
      });
    }
    /**
     * @deprecated 1.7.7
     */
    registerOption(data) {
      return this.addOption(data);
    }
    /**
     * Registers an option group to the pool of option groups.
     *
     * @return {boolean|string}
     */
    registerOptionGroup(data) {
      var key = hash_key(data[this.settings.optgroupValueField]);
      if (key === null)
        return false;
      data.$order = data.$order || ++this.order;
      this.optgroups[key] = data;
      return key;
    }
    /**
     * Registers a new optgroup for options
     * to be bucketed into.
     *
     */
    addOptionGroup(id, data) {
      var hashed_id;
      data[this.settings.optgroupValueField] = id;
      if (hashed_id = this.registerOptionGroup(data)) {
        this.trigger("optgroup_add", hashed_id, data);
      }
    }
    /**
     * Removes an existing option group.
     *
     */
    removeOptionGroup(id) {
      if (this.optgroups.hasOwnProperty(id)) {
        delete this.optgroups[id];
        this.clearCache();
        this.trigger("optgroup_remove", id);
      }
    }
    /**
     * Clears all existing option groups.
     */
    clearOptionGroups() {
      this.optgroups = {};
      this.clearCache();
      this.trigger("optgroup_clear");
    }
    /**
     * Updates an option available for selection. If
     * it is visible in the selected items or options
     * dropdown, it will be re-rendered automatically.
     *
     */
    updateOption(value, data) {
      const self = this;
      var item_new;
      var index_item;
      const value_old = hash_key(value);
      const value_new = hash_key(data[self.settings.valueField]);
      if (value_old === null)
        return;
      const data_old = self.options[value_old];
      if (data_old == void 0)
        return;
      if (typeof value_new !== "string")
        throw new Error("Value must be set in option data");
      const option = self.getOption(value_old);
      const item = self.getItem(value_old);
      data.$order = data.$order || data_old.$order;
      delete self.options[value_old];
      self.uncacheValue(value_new);
      self.options[value_new] = data;
      if (option) {
        if (self.dropdown_content.contains(option)) {
          const option_new = self._render("option", data);
          replaceNode(option, option_new);
          if (self.activeOption === option) {
            self.setActiveOption(option_new);
          }
        }
        option.remove();
      }
      if (item) {
        index_item = self.items.indexOf(value_old);
        if (index_item !== -1) {
          self.items.splice(index_item, 1, value_new);
        }
        item_new = self._render("item", data);
        if (item.classList.contains("active"))
          addClasses(item_new, "active");
        replaceNode(item, item_new);
      }
      self.lastQuery = null;
    }
    /**
     * Removes a single option.
     *
     */
    removeOption(value, silent) {
      const self = this;
      value = get_hash(value);
      self.uncacheValue(value);
      delete self.userOptions[value];
      delete self.options[value];
      self.lastQuery = null;
      self.trigger("option_remove", value);
      self.removeItem(value, silent);
    }
    /**
     * Clears all options.
     */
    clearOptions(filter) {
      const boundFilter = (filter || this.clearFilter).bind(this);
      this.loadedSearches = {};
      this.userOptions = {};
      this.clearCache();
      const selected = {};
      iterate2(this.options, (option, key) => {
        if (boundFilter(option, key)) {
          selected[key] = option;
        }
      });
      this.options = this.sifter.items = selected;
      this.lastQuery = null;
      this.trigger("option_clear");
    }
    /**
     * Used by clearOptions() to decide whether or not an option should be removed
     * Return true to keep an option, false to remove
     *
     */
    clearFilter(option, value) {
      if (this.items.indexOf(value) >= 0) {
        return true;
      }
      return false;
    }
    /**
     * Returns the dom element of the option
     * matching the given value.
     *
     */
    getOption(value, create = false) {
      const hashed = hash_key(value);
      if (hashed === null)
        return null;
      const option = this.options[hashed];
      if (option != void 0) {
        if (option.$div) {
          return option.$div;
        }
        if (create) {
          return this._render("option", option);
        }
      }
      return null;
    }
    /**
     * Returns the dom element of the next or previous dom element of the same type
     * Note: adjacent options may not be adjacent DOM elements (optgroups)
     *
     */
    getAdjacent(option, direction, type = "option") {
      var self = this, all;
      if (!option) {
        return null;
      }
      if (type == "item") {
        all = self.controlChildren();
      } else {
        all = self.dropdown_content.querySelectorAll("[data-selectable]");
      }
      for (let i = 0; i < all.length; i++) {
        if (all[i] != option) {
          continue;
        }
        if (direction > 0) {
          return all[i + 1];
        }
        return all[i - 1];
      }
      return null;
    }
    /**
     * Returns the dom element of the item
     * matching the given value.
     *
     */
    getItem(item) {
      if (typeof item == "object") {
        return item;
      }
      var value = hash_key(item);
      return value !== null ? this.control.querySelector(`[data-value="${addSlashes(value)}"]`) : null;
    }
    /**
     * "Selects" multiple items at once. Adds them to the list
     * at the current caret position.
     *
     */
    addItems(values, silent) {
      var self = this;
      var items = Array.isArray(values) ? values : [values];
      items = items.filter((x) => self.items.indexOf(x) === -1);
      const last_item = items[items.length - 1];
      items.forEach((item) => {
        self.isPending = item !== last_item;
        self.addItem(item, silent);
      });
    }
    /**
     * "Selects" an item. Adds it to the list
     * at the current caret position.
     *
     */
    addItem(value, silent) {
      var events = silent ? [] : ["change", "dropdown_close"];
      debounce_events(this, events, () => {
        var item, wasFull;
        const self = this;
        const inputMode = self.settings.mode;
        const hashed = hash_key(value);
        if (hashed && self.items.indexOf(hashed) !== -1) {
          if (inputMode === "single") {
            self.close();
          }
          if (inputMode === "single" || !self.settings.duplicates) {
            return;
          }
        }
        if (hashed === null || !self.options.hasOwnProperty(hashed))
          return;
        if (inputMode === "single")
          self.clear(silent);
        if (inputMode === "multi" && self.isFull())
          return;
        item = self._render("item", self.options[hashed]);
        if (self.control.contains(item)) {
          item = item.cloneNode(true);
        }
        wasFull = self.isFull();
        self.items.splice(self.caretPos, 0, hashed);
        self.insertAtCaret(item);
        if (self.isSetup) {
          if (!self.isPending && self.settings.hideSelected) {
            let option = self.getOption(hashed);
            let next = self.getAdjacent(option, 1);
            if (next) {
              self.setActiveOption(next);
            }
          }
          if (!self.isPending && !self.settings.closeAfterSelect) {
            self.refreshOptions(self.isFocused && inputMode !== "single");
          }
          if (self.settings.closeAfterSelect != false && self.isFull()) {
            self.close();
          } else if (!self.isPending) {
            self.positionDropdown();
          }
          self.trigger("item_add", hashed, item);
          if (!self.isPending) {
            self.updateOriginalInput({ silent });
          }
        }
        if (!self.isPending || !wasFull && self.isFull()) {
          self.inputState();
          self.refreshState();
        }
      });
    }
    /**
     * Removes the selected item matching
     * the provided value.
     *
     */
    removeItem(item = null, silent) {
      const self = this;
      item = self.getItem(item);
      if (!item)
        return;
      var i, idx;
      const value = item.dataset.value;
      i = nodeIndex(item);
      item.remove();
      if (item.classList.contains("active")) {
        idx = self.activeItems.indexOf(item);
        self.activeItems.splice(idx, 1);
        removeClasses(item, "active");
      }
      self.items.splice(i, 1);
      self.lastQuery = null;
      if (!self.settings.persist && self.userOptions.hasOwnProperty(value)) {
        self.removeOption(value, silent);
      }
      if (i < self.caretPos) {
        self.setCaret(self.caretPos - 1);
      }
      self.updateOriginalInput({ silent });
      self.refreshState();
      self.positionDropdown();
      self.trigger("item_remove", value, item);
    }
    /**
     * Invokes the `create` method provided in the
     * TomSelect options that should provide the data
     * for the new item, given the user input.
     *
     * Once this completes, it will be added
     * to the item list.
     *
     */
    createItem(input = null, callback = () => {
    }) {
      if (arguments.length === 3) {
        callback = arguments[2];
      }
      if (typeof callback != "function") {
        callback = () => {
        };
      }
      var self = this;
      var caret = self.caretPos;
      var output;
      input = input || self.inputValue();
      if (!self.canCreate(input)) {
        callback();
        return false;
      }
      self.lock();
      var created = false;
      var create = (data) => {
        self.unlock();
        if (!data || typeof data !== "object")
          return callback();
        var value = hash_key(data[self.settings.valueField]);
        if (typeof value !== "string") {
          return callback();
        }
        self.setTextboxValue();
        self.addOption(data, true);
        self.setCaret(caret);
        self.addItem(value);
        callback(data);
        created = true;
      };
      if (typeof self.settings.create === "function") {
        output = self.settings.create.call(this, input, create);
      } else {
        output = {
          [self.settings.labelField]: input,
          [self.settings.valueField]: input
        };
      }
      if (!created) {
        create(output);
      }
      return true;
    }
    /**
     * Re-renders the selected item lists.
     */
    refreshItems() {
      var self = this;
      self.lastQuery = null;
      if (self.isSetup) {
        self.addItems(self.items);
      }
      self.updateOriginalInput();
      self.refreshState();
    }
    /**
     * Updates all state-dependent attributes
     * and CSS classes.
     */
    refreshState() {
      const self = this;
      self.refreshValidityState();
      const isFull = self.isFull();
      const isLocked = self.isLocked;
      self.wrapper.classList.toggle("rtl", self.rtl);
      const wrap_classList = self.wrapper.classList;
      wrap_classList.toggle("focus", self.isFocused);
      wrap_classList.toggle("disabled", self.isDisabled);
      wrap_classList.toggle("readonly", self.isReadOnly);
      wrap_classList.toggle("required", self.isRequired);
      wrap_classList.toggle("invalid", !self.isValid);
      wrap_classList.toggle("locked", isLocked);
      wrap_classList.toggle("full", isFull);
      wrap_classList.toggle("input-active", self.isFocused && !self.isInputHidden);
      wrap_classList.toggle("dropdown-active", self.isOpen);
      wrap_classList.toggle("has-options", isEmptyObject(self.options));
      wrap_classList.toggle("has-items", self.items.length > 0);
    }
    /**
     * Update the `required` attribute of both input and control input.
     *
     * The `required` property needs to be activated on the control input
     * for the error to be displayed at the right place. `required` also
     * needs to be temporarily deactivated on the input since the input is
     * hidden and can't show errors.
     */
    refreshValidityState() {
      var self = this;
      if (!self.input.validity) {
        return;
      }
      self.isValid = self.input.validity.valid;
      self.isInvalid = !self.isValid;
    }
    /**
     * Determines whether or not more items can be added
     * to the control without exceeding the user-defined maximum.
     *
     * @returns {boolean}
     */
    isFull() {
      return this.settings.maxItems !== null && this.items.length >= this.settings.maxItems;
    }
    /**
     * Refreshes the original <select> or <input>
     * element to reflect the current state.
     *
     */
    updateOriginalInput(opts = {}) {
      const self = this;
      var option, label;
      const empty_option = self.input.querySelector('option[value=""]');
      if (self.is_select_tag) {
        let AddSelected = function(option_el, value, label2) {
          if (!option_el) {
            option_el = getDom('<option value="' + escape_html(value) + '">' + escape_html(label2) + "</option>");
          }
          if (option_el != empty_option) {
            self.input.append(option_el);
          }
          selected.push(option_el);
          if (option_el != empty_option || has_selected > 0) {
            option_el.selected = true;
          }
          return option_el;
        };
        const selected = [];
        const has_selected = self.input.querySelectorAll("option:checked").length;
        self.input.querySelectorAll("option:checked").forEach((option_el) => {
          option_el.selected = false;
        });
        if (self.items.length == 0 && self.settings.mode == "single") {
          AddSelected(empty_option, "", "");
        } else {
          self.items.forEach((value) => {
            option = self.options[value];
            label = option[self.settings.labelField] || "";
            if (selected.includes(option.$option)) {
              const reuse_opt = self.input.querySelector(`option[value="${addSlashes(value)}"]:not(:checked)`);
              AddSelected(reuse_opt, value, label);
            } else {
              option.$option = AddSelected(option.$option, value, label);
            }
          });
        }
      } else {
        self.input.value = self.getValue();
      }
      if (self.isSetup) {
        if (!opts.silent) {
          self.trigger("change", self.getValue());
        }
      }
    }
    /**
     * Shows the autocomplete dropdown containing
     * the available options.
     */
    open() {
      var self = this;
      if (self.isLocked || self.isOpen || self.settings.mode === "multi" && self.isFull())
        return;
      self.isOpen = true;
      setAttr(self.focus_node, { "aria-expanded": "true" });
      self.refreshState();
      applyCSS(self.dropdown, { visibility: "hidden", display: "block" });
      self.positionDropdown();
      applyCSS(self.dropdown, { visibility: "visible", display: "block" });
      self.focus();
      self.trigger("dropdown_open", self.dropdown);
    }
    /**
     * Closes the autocomplete dropdown menu.
     */
    close(setTextboxValue = true) {
      var self = this;
      var trigger = self.isOpen;
      if (setTextboxValue) {
        self.setTextboxValue();
        if (self.settings.mode === "single" && self.items.length) {
          self.inputState();
        }
      }
      self.isOpen = false;
      setAttr(self.focus_node, { "aria-expanded": "false" });
      applyCSS(self.dropdown, { display: "none" });
      if (self.settings.hideSelected) {
        self.clearActiveOption();
      }
      self.refreshState();
      if (trigger)
        self.trigger("dropdown_close", self.dropdown);
    }
    /**
     * Calculates and applies the appropriate
     * position of the dropdown if dropdownParent = 'body'.
     * Otherwise, position is determined by css
     */
    positionDropdown() {
      if (this.settings.dropdownParent !== "body") {
        return;
      }
      var context = this.control;
      var rect = context.getBoundingClientRect();
      var top2 = context.offsetHeight + rect.top + window.scrollY;
      var left2 = rect.left + window.scrollX;
      applyCSS(this.dropdown, {
        width: rect.width + "px",
        top: top2 + "px",
        left: left2 + "px"
      });
    }
    /**
     * Resets / clears all selected items
     * from the control.
     *
     */
    clear(silent) {
      var self = this;
      if (!self.items.length)
        return;
      var items = self.controlChildren();
      iterate2(items, (item) => {
        self.removeItem(item, true);
      });
      self.inputState();
      if (!silent)
        self.updateOriginalInput();
      self.trigger("clear");
    }
    /**
     * A helper method for inserting an element
     * at the current caret position.
     *
     */
    insertAtCaret(el) {
      const self = this;
      const caret = self.caretPos;
      const target = self.control;
      target.insertBefore(el, target.children[caret] || null);
      self.setCaret(caret + 1);
    }
    /**
     * Removes the current selected item(s).
     *
     */
    deleteSelection(e) {
      var direction, selection, caret, tail;
      var self = this;
      direction = e && e.keyCode === KEY_BACKSPACE ? -1 : 1;
      selection = getSelection(self.control_input);
      const rm_items = [];
      if (self.activeItems.length) {
        tail = getTail(self.activeItems, direction);
        caret = nodeIndex(tail);
        if (direction > 0) {
          caret++;
        }
        iterate2(self.activeItems, (item) => rm_items.push(item));
      } else if ((self.isFocused || self.settings.mode === "single") && self.items.length) {
        const items = self.controlChildren();
        let rm_item;
        if (direction < 0 && selection.start === 0 && selection.length === 0) {
          rm_item = items[self.caretPos - 1];
        } else if (direction > 0 && selection.start === self.inputValue().length) {
          rm_item = items[self.caretPos];
        }
        if (rm_item !== void 0) {
          rm_items.push(rm_item);
        }
      }
      if (!self.shouldDelete(rm_items, e)) {
        return false;
      }
      preventDefault(e, true);
      if (typeof caret !== "undefined") {
        self.setCaret(caret);
      }
      while (rm_items.length) {
        self.removeItem(rm_items.pop());
      }
      self.inputState();
      self.positionDropdown();
      self.refreshOptions(false);
      return true;
    }
    /**
     * Return true if the items should be deleted
     */
    shouldDelete(items, evt) {
      const values = items.map((item) => item.dataset.value);
      if (!values.length || typeof this.settings.onDelete === "function" && this.settings.onDelete(values, evt) === false) {
        return false;
      }
      return true;
    }
    /**
     * Selects the previous / next item (depending on the `direction` argument).
     *
     * > 0 - right
     * < 0 - left
     *
     */
    advanceSelection(direction, e) {
      var last_active, adjacent, self = this;
      if (self.rtl)
        direction *= -1;
      if (self.inputValue().length)
        return;
      if (isKeyDown(KEY_SHORTCUT, e) || isKeyDown("shiftKey", e)) {
        last_active = self.getLastActive(direction);
        if (last_active) {
          if (!last_active.classList.contains("active")) {
            adjacent = last_active;
          } else {
            adjacent = self.getAdjacent(last_active, direction, "item");
          }
        } else if (direction > 0) {
          adjacent = self.control_input.nextElementSibling;
        } else {
          adjacent = self.control_input.previousElementSibling;
        }
        if (adjacent) {
          if (adjacent.classList.contains("active")) {
            self.removeActiveItem(last_active);
          }
          self.setActiveItemClass(adjacent);
        }
      } else {
        self.moveCaret(direction);
      }
    }
    moveCaret(direction) {
    }
    /**
     * Get the last active item
     *
     */
    getLastActive(direction) {
      let last_active = this.control.querySelector(".last-active");
      if (last_active) {
        return last_active;
      }
      var result = this.control.querySelectorAll(".active");
      if (result) {
        return getTail(result, direction);
      }
    }
    /**
     * Moves the caret to the specified index.
     *
     * The input must be moved by leaving it in place and moving the
     * siblings, due to the fact that focus cannot be restored once lost
     * on mobile webkit devices
     *
     */
    setCaret(new_pos) {
      this.caretPos = this.items.length;
    }
    /**
     * Return list of item dom elements
     *
     */
    controlChildren() {
      return Array.from(this.control.querySelectorAll("[data-ts-item]"));
    }
    /**
     * Disables user input on the control. Used while
     * items are being asynchronously created.
     */
    lock() {
      this.setLocked(true);
    }
    /**
     * Re-enables user input on the control.
     */
    unlock() {
      this.setLocked(false);
    }
    /**
     * Disable or enable user input on the control
     */
    setLocked(lock = this.isReadOnly || this.isDisabled) {
      this.isLocked = lock;
      this.refreshState();
    }
    /**
     * Disables user input on the control completely.
     * While disabled, it cannot receive focus.
     */
    disable() {
      this.setDisabled(true);
      this.close();
    }
    /**
     * Enables the control so that it can respond
     * to focus and user input.
     */
    enable() {
      this.setDisabled(false);
    }
    setDisabled(disabled) {
      this.focus_node.tabIndex = disabled ? -1 : this.tabIndex;
      this.isDisabled = disabled;
      this.input.disabled = disabled;
      this.control_input.disabled = disabled;
      this.setLocked();
    }
    setReadOnly(isReadOnly) {
      this.isReadOnly = isReadOnly;
      this.input.readOnly = isReadOnly;
      this.control_input.readOnly = isReadOnly;
      this.setLocked();
    }
    /**
     * Completely destroys the control and
     * unbinds all event listeners so that it can
     * be garbage collected.
     */
    destroy() {
      var self = this;
      var revertSettings = self.revertSettings;
      self.trigger("destroy");
      self.off();
      self.wrapper.remove();
      self.dropdown.remove();
      self.input.innerHTML = revertSettings.innerHTML;
      self.input.tabIndex = revertSettings.tabIndex;
      removeClasses(self.input, "tomselected", "ts-hidden-accessible");
      self._destroy();
      delete self.input.tomselect;
    }
    /**
     * A helper method for rendering "item" and
     * "option" templates, given the data.
     *
     */
    render(templateName, data) {
      var id, html;
      const self = this;
      if (typeof this.settings.render[templateName] !== "function") {
        return null;
      }
      html = self.settings.render[templateName].call(this, data, escape_html);
      if (!html) {
        return null;
      }
      html = getDom(html);
      if (templateName === "option" || templateName === "option_create") {
        if (data[self.settings.disabledField]) {
          setAttr(html, { "aria-disabled": "true" });
        } else {
          setAttr(html, { "data-selectable": "" });
        }
      } else if (templateName === "optgroup") {
        id = data.group[self.settings.optgroupValueField];
        setAttr(html, { "data-group": id });
        if (data.group[self.settings.disabledField]) {
          setAttr(html, { "data-disabled": "" });
        }
      }
      if (templateName === "option" || templateName === "item") {
        const value = get_hash(data[self.settings.valueField]);
        setAttr(html, { "data-value": value });
        if (templateName === "item") {
          addClasses(html, self.settings.itemClass);
          setAttr(html, { "data-ts-item": "" });
        } else {
          addClasses(html, self.settings.optionClass);
          setAttr(html, {
            role: "option",
            id: data.$id
          });
          data.$div = html;
          self.options[value] = data;
        }
      }
      return html;
    }
    /**
     * Type guarded rendering
     *
     */
    _render(templateName, data) {
      const html = this.render(templateName, data);
      if (html == null) {
        throw "HTMLElement expected";
      }
      return html;
    }
    /**
     * Clears the render cache for a template. If
     * no template is given, clears all render
     * caches.
     *
     */
    clearCache() {
      iterate2(this.options, (option) => {
        if (option.$div) {
          option.$div.remove();
          delete option.$div;
        }
      });
    }
    /**
     * Removes a value from item and option caches
     *
     */
    uncacheValue(value) {
      const option_el = this.getOption(value);
      if (option_el)
        option_el.remove();
    }
    /**
     * Determines whether or not to display the
     * create item prompt, given a user input.
     *
     */
    canCreate(input) {
      return this.settings.create && input.length > 0 && this.settings.createFilter.call(this, input);
    }
    /**
     * Wraps this.`method` so that `new_fn` can be invoked 'before', 'after', or 'instead' of the original method
     *
     * this.hook('instead','onKeyDown',function( arg1, arg2 ...){
     *
     * });
     */
    hook(when, method, new_fn) {
      var self = this;
      var orig_method = self[method];
      self[method] = function() {
        var result, result_new;
        if (when === "after") {
          result = orig_method.apply(self, arguments);
        }
        result_new = new_fn.apply(self, arguments);
        if (when === "instead") {
          return result_new;
        }
        if (when === "before") {
          result = orig_method.apply(self, arguments);
        }
        return result;
      };
    }
  };

  // node_modules/tom-select/dist/esm/plugins/change_listener/plugin.js
  var addEvent2 = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
  };
  function plugin() {
    addEvent2(this.input, "change", () => {
      this.sync();
    });
  }

  // node_modules/tom-select/dist/esm/plugins/checkbox_options/plugin.js
  var hash_key2 = (value) => {
    if (typeof value === "undefined" || value === null) return null;
    return get_hash2(value);
  };
  var get_hash2 = (value) => {
    if (typeof value === "boolean") return value ? "1" : "0";
    return value + "";
  };
  var preventDefault2 = (evt, stop = false) => {
    if (evt) {
      evt.preventDefault();
      if (stop) {
        evt.stopPropagation();
      }
    }
  };
  var getDom2 = (query) => {
    if (query.jquery) {
      return query[0];
    }
    if (query instanceof HTMLElement) {
      return query;
    }
    if (isHtmlString2(query)) {
      var tpl = document.createElement("template");
      tpl.innerHTML = query.trim();
      return tpl.content.firstChild;
    }
    return document.querySelector(query);
  };
  var isHtmlString2 = (arg) => {
    if (typeof arg === "string" && arg.indexOf("<") > -1) {
      return true;
    }
    return false;
  };
  function plugin2(userOptions) {
    var self = this;
    var orig_onOptionSelect = self.onOptionSelect;
    self.settings.hideSelected = false;
    const cbOptions = Object.assign({
      // so that the user may add different ones as well
      className: "tomselect-checkbox",
      // the following default to the historic plugin's values
      checkedClassNames: void 0,
      uncheckedClassNames: void 0
    }, userOptions);
    var UpdateChecked = function UpdateChecked2(checkbox, toCheck) {
      if (toCheck) {
        checkbox.checked = true;
        if (cbOptions.uncheckedClassNames) {
          checkbox.classList.remove(...cbOptions.uncheckedClassNames);
        }
        if (cbOptions.checkedClassNames) {
          checkbox.classList.add(...cbOptions.checkedClassNames);
        }
      } else {
        checkbox.checked = false;
        if (cbOptions.checkedClassNames) {
          checkbox.classList.remove(...cbOptions.checkedClassNames);
        }
        if (cbOptions.uncheckedClassNames) {
          checkbox.classList.add(...cbOptions.uncheckedClassNames);
        }
      }
    };
    var UpdateCheckbox = function UpdateCheckbox2(option) {
      setTimeout(() => {
        var checkbox = option.querySelector("input." + cbOptions.className);
        if (checkbox instanceof HTMLInputElement) {
          UpdateChecked(checkbox, option.classList.contains("selected"));
        }
      }, 1);
    };
    self.hook("after", "setupTemplates", () => {
      var orig_render_option = self.settings.render.option;
      self.settings.render.option = (data, escape_html3) => {
        var rendered = getDom2(orig_render_option.call(self, data, escape_html3));
        var checkbox = document.createElement("input");
        if (cbOptions.className) {
          checkbox.classList.add(cbOptions.className);
        }
        checkbox.addEventListener("click", function(evt) {
          preventDefault2(evt);
        });
        checkbox.type = "checkbox";
        const hashed = hash_key2(data[self.settings.valueField]);
        UpdateChecked(checkbox, !!(hashed && self.items.indexOf(hashed) > -1));
        rendered.prepend(checkbox);
        return rendered;
      };
    });
    self.on("item_remove", (value) => {
      var option = self.getOption(value);
      if (option) {
        option.classList.remove("selected");
        UpdateCheckbox(option);
      }
    });
    self.on("item_add", (value) => {
      var option = self.getOption(value);
      if (option) {
        UpdateCheckbox(option);
      }
    });
    self.hook("instead", "onOptionSelect", (evt, option) => {
      if (option.classList.contains("selected")) {
        option.classList.remove("selected");
        self.removeItem(option.dataset.value);
        self.refreshOptions();
        preventDefault2(evt, true);
        return;
      }
      orig_onOptionSelect.call(self, evt, option);
      UpdateCheckbox(option);
    });
  }

  // node_modules/tom-select/dist/esm/plugins/clear_button/plugin.js
  var getDom3 = (query) => {
    if (query.jquery) {
      return query[0];
    }
    if (query instanceof HTMLElement) {
      return query;
    }
    if (isHtmlString3(query)) {
      var tpl = document.createElement("template");
      tpl.innerHTML = query.trim();
      return tpl.content.firstChild;
    }
    return document.querySelector(query);
  };
  var isHtmlString3 = (arg) => {
    if (typeof arg === "string" && arg.indexOf("<") > -1) {
      return true;
    }
    return false;
  };
  function plugin3(userOptions) {
    const self = this;
    const options = Object.assign({
      className: "clear-button",
      title: "Clear All",
      html: (data) => {
        return `<div class="${data.className}" title="${data.title}">&#10799;</div>`;
      }
    }, userOptions);
    self.on("initialize", () => {
      var button = getDom3(options.html(options));
      button.addEventListener("click", (evt) => {
        if (self.isLocked) return;
        self.clear();
        if (self.settings.mode === "single" && self.settings.allowEmptyOption) {
          self.addItem("");
        }
        evt.preventDefault();
        evt.stopPropagation();
      });
      self.control.appendChild(button);
    });
  }

  // node_modules/tom-select/dist/esm/plugins/drag_drop/plugin.js
  var preventDefault3 = (evt, stop = false) => {
    if (evt) {
      evt.preventDefault();
      if (stop) {
        evt.stopPropagation();
      }
    }
  };
  var addEvent3 = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
  };
  var iterate3 = (object, callback) => {
    if (Array.isArray(object)) {
      object.forEach(callback);
    } else {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          callback(object[key], key);
        }
      }
    }
  };
  var getDom4 = (query) => {
    if (query.jquery) {
      return query[0];
    }
    if (query instanceof HTMLElement) {
      return query;
    }
    if (isHtmlString4(query)) {
      var tpl = document.createElement("template");
      tpl.innerHTML = query.trim();
      return tpl.content.firstChild;
    }
    return document.querySelector(query);
  };
  var isHtmlString4 = (arg) => {
    if (typeof arg === "string" && arg.indexOf("<") > -1) {
      return true;
    }
    return false;
  };
  var setAttr2 = (el, attrs) => {
    iterate3(attrs, (val, attr) => {
      if (val == null) {
        el.removeAttribute(attr);
      } else {
        el.setAttribute(attr, "" + val);
      }
    });
  };
  var insertAfter = (referenceNode, newNode) => {
    var _referenceNode$parent;
    (_referenceNode$parent = referenceNode.parentNode) == null || _referenceNode$parent.insertBefore(newNode, referenceNode.nextSibling);
  };
  var insertBefore = (referenceNode, newNode) => {
    var _referenceNode$parent2;
    (_referenceNode$parent2 = referenceNode.parentNode) == null || _referenceNode$parent2.insertBefore(newNode, referenceNode);
  };
  var isBefore = (referenceNode, newNode) => {
    do {
      var _newNode;
      newNode = (_newNode = newNode) == null ? void 0 : _newNode.previousElementSibling;
      if (referenceNode == newNode) {
        return true;
      }
    } while (newNode && newNode.previousElementSibling);
    return false;
  };
  function plugin4() {
    var self = this;
    if (self.settings.mode !== "multi") return;
    var orig_lock = self.lock;
    var orig_unlock = self.unlock;
    let sortable = true;
    let drag_item;
    self.hook("after", "setupTemplates", () => {
      var orig_render_item = self.settings.render.item;
      self.settings.render.item = (data, escape) => {
        const item = getDom4(orig_render_item.call(self, data, escape));
        setAttr2(item, {
          "draggable": "true"
        });
        const mousedown = (evt) => {
          if (!sortable) preventDefault3(evt);
          evt.stopPropagation();
        };
        const dragStart = (evt) => {
          drag_item = item;
          setTimeout(() => {
            item.classList.add("ts-dragging");
          }, 0);
        };
        const dragOver = (evt) => {
          evt.preventDefault();
          item.classList.add("ts-drag-over");
          moveitem(item, drag_item);
        };
        const dragLeave = () => {
          item.classList.remove("ts-drag-over");
        };
        const moveitem = (targetitem, dragitem) => {
          if (dragitem === void 0) return;
          if (isBefore(dragitem, item)) {
            insertAfter(targetitem, dragitem);
          } else {
            insertBefore(targetitem, dragitem);
          }
        };
        const dragend = () => {
          var _drag_item;
          document.querySelectorAll(".ts-drag-over").forEach((el) => el.classList.remove("ts-drag-over"));
          (_drag_item = drag_item) == null || _drag_item.classList.remove("ts-dragging");
          drag_item = void 0;
          var values = [];
          self.control.querySelectorAll(`[data-value]`).forEach((el) => {
            if (el.dataset.value) {
              let value = el.dataset.value;
              if (value) {
                values.push(value);
              }
            }
          });
          self.setValue(values);
        };
        addEvent3(item, "mousedown", mousedown);
        addEvent3(item, "dragstart", dragStart);
        addEvent3(item, "dragenter", dragOver);
        addEvent3(item, "dragover", dragOver);
        addEvent3(item, "dragleave", dragLeave);
        addEvent3(item, "dragend", dragend);
        return item;
      };
    });
    self.hook("instead", "lock", () => {
      sortable = false;
      return orig_lock.call(self);
    });
    self.hook("instead", "unlock", () => {
      sortable = true;
      return orig_unlock.call(self);
    });
  }

  // node_modules/tom-select/dist/esm/plugins/dropdown_header/plugin.js
  var preventDefault4 = (evt, stop = false) => {
    if (evt) {
      evt.preventDefault();
      if (stop) {
        evt.stopPropagation();
      }
    }
  };
  var getDom5 = (query) => {
    if (query.jquery) {
      return query[0];
    }
    if (query instanceof HTMLElement) {
      return query;
    }
    if (isHtmlString5(query)) {
      var tpl = document.createElement("template");
      tpl.innerHTML = query.trim();
      return tpl.content.firstChild;
    }
    return document.querySelector(query);
  };
  var isHtmlString5 = (arg) => {
    if (typeof arg === "string" && arg.indexOf("<") > -1) {
      return true;
    }
    return false;
  };
  function plugin5(userOptions) {
    const self = this;
    const options = Object.assign({
      title: "Untitled",
      headerClass: "dropdown-header",
      titleRowClass: "dropdown-header-title",
      labelClass: "dropdown-header-label",
      closeClass: "dropdown-header-close",
      html: (data) => {
        return '<div class="' + data.headerClass + '"><div class="' + data.titleRowClass + '"><span class="' + data.labelClass + '">' + data.title + '</span><a class="' + data.closeClass + '">&times;</a></div></div>';
      }
    }, userOptions);
    self.on("initialize", () => {
      var header = getDom5(options.html(options));
      var close_link = header.querySelector("." + options.closeClass);
      if (close_link) {
        close_link.addEventListener("click", (evt) => {
          preventDefault4(evt, true);
          self.close();
        });
      }
      self.dropdown.insertBefore(header, self.dropdown.firstChild);
    });
  }

  // node_modules/tom-select/dist/esm/plugins/caret_position/plugin.js
  var iterate4 = (object, callback) => {
    if (Array.isArray(object)) {
      object.forEach(callback);
    } else {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          callback(object[key], key);
        }
      }
    }
  };
  var removeClasses2 = (elmts, ...classes) => {
    var norm_classes = classesArray2(classes);
    elmts = castAsArray2(elmts);
    elmts.map((el) => {
      norm_classes.map((cls) => {
        el.classList.remove(cls);
      });
    });
  };
  var classesArray2 = (args) => {
    var classes = [];
    iterate4(args, (_classes) => {
      if (typeof _classes === "string") {
        _classes = _classes.trim().split(/[\t\n\f\r\s]/);
      }
      if (Array.isArray(_classes)) {
        classes = classes.concat(_classes);
      }
    });
    return classes.filter(Boolean);
  };
  var castAsArray2 = (arg) => {
    if (!Array.isArray(arg)) {
      arg = [arg];
    }
    return arg;
  };
  var nodeIndex2 = (el, amongst) => {
    if (!el) return -1;
    amongst = amongst || el.nodeName;
    var i = 0;
    while (el = el.previousElementSibling) {
      if (el.matches(amongst)) {
        i++;
      }
    }
    return i;
  };
  function plugin6() {
    var self = this;
    self.hook("instead", "setCaret", (new_pos) => {
      if (self.settings.mode === "single" || !self.control.contains(self.control_input)) {
        new_pos = self.items.length;
      } else {
        new_pos = Math.max(0, Math.min(self.items.length, new_pos));
        if (new_pos != self.caretPos && !self.isPending) {
          self.controlChildren().forEach((child, j) => {
            if (j < new_pos) {
              self.control_input.insertAdjacentElement("beforebegin", child);
            } else {
              self.control.appendChild(child);
            }
          });
        }
      }
      self.caretPos = new_pos;
    });
    self.hook("instead", "moveCaret", (direction) => {
      if (!self.isFocused) return;
      const last_active = self.getLastActive(direction);
      if (last_active) {
        const idx = nodeIndex2(last_active);
        self.setCaret(direction > 0 ? idx + 1 : idx);
        self.setActiveItem();
        removeClasses2(last_active, "last-active");
      } else {
        self.setCaret(self.caretPos + direction);
      }
    });
  }

  // node_modules/tom-select/dist/esm/plugins/dropdown_input/plugin.js
  var KEY_ESC2 = 27;
  var KEY_TAB2 = 9;
  var preventDefault5 = (evt, stop = false) => {
    if (evt) {
      evt.preventDefault();
      if (stop) {
        evt.stopPropagation();
      }
    }
  };
  var addEvent4 = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
  };
  var iterate5 = (object, callback) => {
    if (Array.isArray(object)) {
      object.forEach(callback);
    } else {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          callback(object[key], key);
        }
      }
    }
  };
  var getDom6 = (query) => {
    if (query.jquery) {
      return query[0];
    }
    if (query instanceof HTMLElement) {
      return query;
    }
    if (isHtmlString6(query)) {
      var tpl = document.createElement("template");
      tpl.innerHTML = query.trim();
      return tpl.content.firstChild;
    }
    return document.querySelector(query);
  };
  var isHtmlString6 = (arg) => {
    if (typeof arg === "string" && arg.indexOf("<") > -1) {
      return true;
    }
    return false;
  };
  var addClasses2 = (elmts, ...classes) => {
    var norm_classes = classesArray3(classes);
    elmts = castAsArray3(elmts);
    elmts.map((el) => {
      norm_classes.map((cls) => {
        el.classList.add(cls);
      });
    });
  };
  var classesArray3 = (args) => {
    var classes = [];
    iterate5(args, (_classes) => {
      if (typeof _classes === "string") {
        _classes = _classes.trim().split(/[\t\n\f\r\s]/);
      }
      if (Array.isArray(_classes)) {
        classes = classes.concat(_classes);
      }
    });
    return classes.filter(Boolean);
  };
  var castAsArray3 = (arg) => {
    if (!Array.isArray(arg)) {
      arg = [arg];
    }
    return arg;
  };
  function plugin7() {
    const self = this;
    self.settings.shouldOpen = true;
    self.hook("before", "setup", () => {
      self.focus_node = self.control;
      addClasses2(self.control_input, "dropdown-input");
      const div = getDom6('<div class="dropdown-input-wrap">');
      div.append(self.control_input);
      self.dropdown.insertBefore(div, self.dropdown.firstChild);
      const placeholder = getDom6('<input class="items-placeholder" tabindex="-1" />');
      placeholder.placeholder = self.settings.placeholder || "";
      self.control.append(placeholder);
    });
    self.on("initialize", () => {
      self.control_input.addEventListener("keydown", (evt) => {
        switch (evt.keyCode) {
          case KEY_ESC2:
            if (self.isOpen) {
              preventDefault5(evt, true);
              self.close();
            }
            self.clearActiveItems();
            return;
          case KEY_TAB2:
            self.focus_node.tabIndex = -1;
            break;
        }
        return self.onKeyDown.call(self, evt);
      });
      self.on("blur", () => {
        self.focus_node.tabIndex = self.isDisabled ? -1 : self.tabIndex;
      });
      self.on("dropdown_open", () => {
        self.control_input.focus();
      });
      const orig_onBlur = self.onBlur;
      self.hook("instead", "onBlur", (evt) => {
        if (evt && evt.relatedTarget == self.control_input) return;
        return orig_onBlur.call(self);
      });
      addEvent4(self.control_input, "blur", () => self.onBlur());
      self.hook("before", "close", () => {
        if (!self.isOpen) return;
        self.focus_node.focus({
          preventScroll: true
        });
      });
    });
  }

  // node_modules/tom-select/dist/esm/plugins/input_autogrow/plugin.js
  var addEvent5 = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
  };
  function plugin8() {
    var self = this;
    self.on("initialize", () => {
      var test_input = document.createElement("span");
      var control = self.control_input;
      test_input.style.cssText = "position:absolute; top:-99999px; left:-99999px; width:auto; padding:0; white-space:pre; ";
      self.wrapper.appendChild(test_input);
      var transfer_styles = ["letterSpacing", "fontSize", "fontFamily", "fontWeight", "textTransform"];
      for (const style_name of transfer_styles) {
        test_input.style[style_name] = control.style[style_name];
      }
      var resize = () => {
        test_input.textContent = control.value;
        control.style.width = test_input.clientWidth + "px";
      };
      resize();
      self.on("update item_add item_remove", resize);
      addEvent5(control, "input", resize);
      addEvent5(control, "keyup", resize);
      addEvent5(control, "blur", resize);
      addEvent5(control, "update", resize);
    });
  }

  // node_modules/tom-select/dist/esm/plugins/no_backspace_delete/plugin.js
  function plugin9() {
    var self = this;
    var orig_deleteSelection = self.deleteSelection;
    this.hook("instead", "deleteSelection", (evt) => {
      if (self.activeItems.length) {
        return orig_deleteSelection.call(self, evt);
      }
      return false;
    });
  }

  // node_modules/tom-select/dist/esm/plugins/no_active_items/plugin.js
  function plugin10() {
    this.hook("instead", "setActiveItem", () => {
    });
    this.hook("instead", "selectAll", () => {
    });
  }

  // node_modules/tom-select/dist/esm/plugins/optgroup_columns/plugin.js
  var KEY_LEFT2 = 37;
  var KEY_RIGHT2 = 39;
  var parentMatch2 = (target, selector, wrapper) => {
    while (target && target.matches) {
      if (target.matches(selector)) {
        return target;
      }
      target = target.parentNode;
    }
  };
  var nodeIndex3 = (el, amongst) => {
    if (!el) return -1;
    amongst = amongst || el.nodeName;
    var i = 0;
    while (el = el.previousElementSibling) {
      if (el.matches(amongst)) {
        i++;
      }
    }
    return i;
  };
  function plugin11() {
    var self = this;
    var orig_keydown = self.onKeyDown;
    self.hook("instead", "onKeyDown", (evt) => {
      var index, option, options, optgroup;
      if (!self.isOpen || !(evt.keyCode === KEY_LEFT2 || evt.keyCode === KEY_RIGHT2)) {
        return orig_keydown.call(self, evt);
      }
      self.ignoreHover = true;
      optgroup = parentMatch2(self.activeOption, "[data-group]");
      index = nodeIndex3(self.activeOption, "[data-selectable]");
      if (!optgroup) {
        return;
      }
      if (evt.keyCode === KEY_LEFT2) {
        optgroup = optgroup.previousSibling;
      } else {
        optgroup = optgroup.nextSibling;
      }
      if (!optgroup) {
        return;
      }
      options = optgroup.querySelectorAll("[data-selectable]");
      option = options[Math.min(options.length - 1, index)];
      if (option) {
        self.setActiveOption(option);
      }
    });
  }

  // node_modules/tom-select/dist/esm/plugins/remove_button/plugin.js
  var escape_html2 = (str) => {
    return (str + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  var preventDefault6 = (evt, stop = false) => {
    if (evt) {
      evt.preventDefault();
      if (stop) {
        evt.stopPropagation();
      }
    }
  };
  var addEvent6 = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
  };
  var getDom7 = (query) => {
    if (query.jquery) {
      return query[0];
    }
    if (query instanceof HTMLElement) {
      return query;
    }
    if (isHtmlString7(query)) {
      var tpl = document.createElement("template");
      tpl.innerHTML = query.trim();
      return tpl.content.firstChild;
    }
    return document.querySelector(query);
  };
  var isHtmlString7 = (arg) => {
    if (typeof arg === "string" && arg.indexOf("<") > -1) {
      return true;
    }
    return false;
  };
  function plugin12(userOptions) {
    const options = Object.assign({
      label: "&times;",
      title: "Remove",
      className: "remove",
      append: true
    }, userOptions);
    var self = this;
    if (!options.append) {
      return;
    }
    var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html2(options.title) + '">' + options.label + "</a>";
    self.hook("after", "setupTemplates", () => {
      var orig_render_item = self.settings.render.item;
      self.settings.render.item = (data, escape) => {
        var item = getDom7(orig_render_item.call(self, data, escape));
        var close_button = getDom7(html);
        item.appendChild(close_button);
        addEvent6(close_button, "mousedown", (evt) => {
          preventDefault6(evt, true);
        });
        addEvent6(close_button, "click", (evt) => {
          if (self.isLocked) return;
          preventDefault6(evt, true);
          if (self.isLocked) return;
          if (!self.shouldDelete([item], evt)) return;
          self.removeItem(item);
          self.refreshOptions(false);
          self.inputState();
        });
        return item;
      };
    });
  }

  // node_modules/tom-select/dist/esm/plugins/restore_on_backspace/plugin.js
  function plugin13(userOptions) {
    const self = this;
    const options = Object.assign({
      text: (option) => {
        return option[self.settings.labelField];
      }
    }, userOptions);
    self.on("item_remove", function(value) {
      if (!self.isFocused) {
        return;
      }
      if (self.control_input.value.trim() === "") {
        var option = self.options[value];
        if (option) {
          self.setTextboxValue(options.text.call(self, option));
        }
      }
    });
  }

  // node_modules/tom-select/dist/esm/plugins/virtual_scroll/plugin.js
  var iterate6 = (object, callback) => {
    if (Array.isArray(object)) {
      object.forEach(callback);
    } else {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          callback(object[key], key);
        }
      }
    }
  };
  var addClasses3 = (elmts, ...classes) => {
    var norm_classes = classesArray4(classes);
    elmts = castAsArray4(elmts);
    elmts.map((el) => {
      norm_classes.map((cls) => {
        el.classList.add(cls);
      });
    });
  };
  var classesArray4 = (args) => {
    var classes = [];
    iterate6(args, (_classes) => {
      if (typeof _classes === "string") {
        _classes = _classes.trim().split(/[\t\n\f\r\s]/);
      }
      if (Array.isArray(_classes)) {
        classes = classes.concat(_classes);
      }
    });
    return classes.filter(Boolean);
  };
  var castAsArray4 = (arg) => {
    if (!Array.isArray(arg)) {
      arg = [arg];
    }
    return arg;
  };
  function plugin14() {
    const self = this;
    const orig_canLoad = self.canLoad;
    const orig_clearActiveOption = self.clearActiveOption;
    const orig_loadCallback = self.loadCallback;
    var pagination = {};
    var dropdown_content;
    var loading_more = false;
    var load_more_opt;
    var default_values = [];
    if (!self.settings.shouldLoadMore) {
      self.settings.shouldLoadMore = () => {
        const scroll_percent = dropdown_content.clientHeight / (dropdown_content.scrollHeight - dropdown_content.scrollTop);
        if (scroll_percent > 0.9) {
          return true;
        }
        if (self.activeOption) {
          var selectable = self.selectable();
          var index = Array.from(selectable).indexOf(self.activeOption);
          if (index >= selectable.length - 2) {
            return true;
          }
        }
        return false;
      };
    }
    if (!self.settings.firstUrl) {
      throw "virtual_scroll plugin requires a firstUrl() method";
    }
    self.settings.sortField = [{
      field: "$order"
    }, {
      field: "$score"
    }];
    const canLoadMore = (query) => {
      if (typeof self.settings.maxOptions === "number" && dropdown_content.children.length >= self.settings.maxOptions) {
        return false;
      }
      if (query in pagination && pagination[query]) {
        return true;
      }
      return false;
    };
    const clearFilter = (option, value) => {
      if (self.items.indexOf(value) >= 0 || default_values.indexOf(value) >= 0) {
        return true;
      }
      return false;
    };
    self.setNextUrl = (value, next_url) => {
      pagination[value] = next_url;
    };
    self.getUrl = (query) => {
      if (query in pagination) {
        const next_url = pagination[query];
        pagination[query] = false;
        return next_url;
      }
      self.clearPagination();
      return self.settings.firstUrl.call(self, query);
    };
    self.clearPagination = () => {
      pagination = {};
    };
    self.hook("instead", "clearActiveOption", () => {
      if (loading_more) {
        return;
      }
      return orig_clearActiveOption.call(self);
    });
    self.hook("instead", "canLoad", (query) => {
      if (!(query in pagination)) {
        return orig_canLoad.call(self, query);
      }
      return canLoadMore(query);
    });
    self.hook("instead", "loadCallback", (options, optgroups) => {
      if (!loading_more) {
        self.clearOptions(clearFilter);
      } else if (load_more_opt) {
        const first_option = options[0];
        if (first_option !== void 0) {
          load_more_opt.dataset.value = first_option[self.settings.valueField];
        }
      }
      orig_loadCallback.call(self, options, optgroups);
      loading_more = false;
    });
    self.hook("after", "refreshOptions", () => {
      const query = self.lastValue;
      var option;
      if (canLoadMore(query)) {
        option = self.render("loading_more", {
          query
        });
        if (option) {
          option.setAttribute("data-selectable", "");
          load_more_opt = option;
        }
      } else if (query in pagination && !dropdown_content.querySelector(".no-results")) {
        option = self.render("no_more_results", {
          query
        });
      }
      if (option) {
        addClasses3(option, self.settings.optionClass);
        dropdown_content.append(option);
      }
    });
    self.on("initialize", () => {
      default_values = Object.keys(self.options);
      dropdown_content = self.dropdown_content;
      self.settings.render = Object.assign({}, {
        loading_more: () => {
          return `<div class="loading-more-results">Loading more results ... </div>`;
        },
        no_more_results: () => {
          return `<div class="no-more-results">No more results</div>`;
        }
      }, self.settings.render);
      dropdown_content.addEventListener("scroll", () => {
        if (!self.settings.shouldLoadMore.call(self)) {
          return;
        }
        if (!canLoadMore(self.lastValue)) {
          return;
        }
        if (loading_more) return;
        loading_more = true;
        self.load.call(self, self.lastValue);
      });
    });
  }

  // node_modules/tom-select/dist/esm/tom-select.complete.js
  TomSelect.define("change_listener", plugin);
  TomSelect.define("checkbox_options", plugin2);
  TomSelect.define("clear_button", plugin3);
  TomSelect.define("drag_drop", plugin4);
  TomSelect.define("dropdown_header", plugin5);
  TomSelect.define("caret_position", plugin6);
  TomSelect.define("dropdown_input", plugin7);
  TomSelect.define("input_autogrow", plugin8);
  TomSelect.define("no_backspace_delete", plugin9);
  TomSelect.define("no_active_items", plugin10);
  TomSelect.define("optgroup_columns", plugin11);
  TomSelect.define("remove_button", plugin12);
  TomSelect.define("restore_on_backspace", plugin13);
  TomSelect.define("virtual_scroll", plugin14);
  var tom_select_complete_default = TomSelect;

  // app/javascript/admin/controllers/tom_select_controller.js
  var selectSettings = {
    allowEmptyOption: true,
    plugins: ["remove_button", "input_autogrow", "clear_button"]
  };
  var tom_select_controller_default = class extends Controller {
    static targets = ["tomselect"];
    connect() {
      this.tomselectTargets.forEach((element) => {
        new tom_select_complete_default(element, selectSettings);
      });
    }
  };

  // app/javascript/admin/controllers/form_validation_controller.js
  var form_validation_controller_default = class extends Controller {
    connect() {
      this.element.classList.add("needs-validation");
      this.element.noValidate = true;
    }
    submit(event) {
      if (!this.element.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.element.classList.add("was-validated");
    }
  };

  // app/javascript/admin/controllers/index.js
  application.register("tom-select", tom_select_controller_default);
  application.register("form-validation", form_validation_controller_default);

  // app/javascript/admin/index.js
  var application2 = Application.start();
  application2.debug = true;
  window.Stimulus = application2;
})();
/*! Bundled license information:

@hotwired/turbo/dist/turbo.es2017-esm.js:
  (*!
  Turbo 8.0.21
  Copyright © 2026 37signals LLC
   *)

bootstrap/dist/js/bootstrap.esm.js:
  (*!
    * Bootstrap v5.3.8 (https://getbootstrap.com/)
    * Copyright 2011-2025 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
    * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
    *)
*/
//# sourceMappingURL=admin.js.map
