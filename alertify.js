/*!
 * Alertify.js Custom Version 1.0.0
 * https://raw.githubusercontent.com/Turbo-Chat/alertify.js/refs/heads/main/alertify.js
 * @license MIT licensed
 *
 * Copyright (C) 2024 TurboChat
 */
(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Alertify = factory();
  }
})(this, function() {
  // Library version
  var version = "1.0.0";

  // Set the default global options
  var defaults = {
    oldestFirst: true,
    text: "Alertify is awesome!",
    node: undefined,
    duration: 3000,
    selector: undefined,
    callback: function () {},
    destination: undefined,
    newWindow: false,
    close: false,
    gravity: "alertify-top", // 'alertify-top' or 'alertify-bottom'
    positionLeft: false,     // Deprecated, use 'position' instead
    position: '',            // 'left', 'right', 'center'
    backgroundColor: '',
    avatar: "",
    className: "",
    stopOnFocus: true,
    onClick: function () {},
    offset: {x: 0, y: 0},
    escapeMarkup: true,
    ariaLive: 'polite',
    style: {background: ''}
  };

  // Alertify Constructor
  var Alertify = function(options) {
    return new Alertify.lib.init(options);
  };

  // Defining the prototype of the object
  Alertify.lib = Alertify.prototype = {
    alertify: version,

    constructor: Alertify,

    // Initializing the object with required parameters
    init: function(options) {
      if (!options) {
        options = {};
      }

      // Create a new options object by merging defaults and user options
      this.options = Object.assign({}, defaults, options);

      // Handle deprecated 'positionLeft'
      if (this.options.positionLeft !== false) {
        this.options.position = 'left';
        console.warn('Property `positionLeft` is deprecated. Please use `position` instead.');
      }

      // Handle type-specific class
      this.options.type = this.options.type || 'default'; // 'default', 'success', 'error', 'info', 'warning'

      // Apply background color if provided
      if (this.options.backgroundColor) {
        this.options.style.background = this.options.backgroundColor;
      }

      this.toastElement = null;

      return this;
    },

    // Building the DOM element
    buildToast: function() {
      if (!this.options) {
        throw "Alertify is not initialized";
      }

      // Create the main toast element
      var divElement = document.createElement("div");
      divElement.className = `alertify alertify-${this.options.type} ${this.options.className}`;

      // Positioning classes
      if (this.options.position) {
        divElement.className += ` alertify-${this.options.position}`;
      } else {
        // Default position
        divElement.className += " alertify-right";
      }

      // Gravity class
      divElement.className += ` ${this.options.gravity}`;

      // Apply inline styles
      for (var property in this.options.style) {
        if (this.options.style.hasOwnProperty(property)) {
          divElement.style[property] = this.options.style[property];
        }
      }

      // Accessibility
      if (this.options.ariaLive) {
        divElement.setAttribute('aria-live', this.options.ariaLive);
      }

      // Add content (text or node)
      if (this.options.node && this.options.node.nodeType === Node.ELEMENT_NODE) {
        divElement.appendChild(this.options.node);
      } else {
        if (this.options.escapeMarkup) {
          divElement.innerText = this.options.text;
        } else {
          divElement.innerHTML = this.options.text;
        }

        // Add avatar if provided
        if (this.options.avatar !== "") {
          var avatarElement = document.createElement("img");
          avatarElement.src = this.options.avatar;
          avatarElement.className = "alertify-avatar";

          if (this.options.position === "left") {
            divElement.insertBefore(avatarElement, divElement.firstChild);
          } else {
            divElement.appendChild(avatarElement);
          }
        }
      }

      // Add close button if enabled
      if (this.options.close === true) {
        var closeElement = document.createElement("button");
        closeElement.type = "button";
        closeElement.setAttribute("aria-label", "Close");
        closeElement.className = "alertify-close";
        closeElement.innerHTML = "&times;";

        closeElement.addEventListener("click", function(event) {
          event.stopPropagation();
          this.removeElement(this.toastElement);
          if (this.toastElement.timeOutValue) {
            clearTimeout(this.toastElement.timeOutValue);
          }
        }.bind(this));

        if (this.options.position === "left" && window.innerWidth > 360) {
          divElement.insertBefore(closeElement, divElement.firstChild.nextSibling);
        } else {
          divElement.appendChild(closeElement);
        }
      }

      // Stop timeout on focus if enabled
      if (this.options.stopOnFocus && this.options.duration > 0) {
        divElement.addEventListener("mouseover", function() {
          clearTimeout(this.toastElement.timeOutValue);
        }.bind(this));

        divElement.addEventListener("mouseleave", function() {
          this.toastElement.timeOutValue = setTimeout(function() {
            this.removeElement(divElement);
          }.bind(this), this.options.duration);
        }.bind(this));
      }

      // Handle click destination
      if (this.options.destination) {
        divElement.addEventListener("click", function(event) {
          event.stopPropagation();
          if (this.options.newWindow === true) {
            window.open(this.options.destination, "_blank");
          } else {
            window.location.href = this.options.destination;
          }
        }.bind(this));
      }

      // Handle onClick callback if no destination
      if (typeof this.options.onClick === "function" && !this.options.destination) {
        divElement.addEventListener("click", function(event) {
          event.stopPropagation();
          this.options.onClick();
        }.bind(this));
      }

      // Apply offset
      if (typeof this.options.offset === "object") {
        var x = getAxisOffsetAValue("x", this.options);
        var y = getAxisOffsetAValue("y", this.options);

        var xOffset = "0px";
        if (this.options.position === "left") {
          xOffset = x;
        } else if (this.options.position === "right") {
          xOffset = `-${x}`;
        } else if (this.options.position === "center") {
          xOffset = "0px";
        }

        var yOffset = "0px";
        if (this.options.gravity === "alertify-top") {
          yOffset = y;
        } else if (this.options.gravity === "alertify-bottom") {
          yOffset = `-${y}`;
        }

        divElement.style.transform = `translate(${xOffset}, ${yOffset})`;
      }

      return divElement;
    },

    // Displaying the toast
    showToast: function() {
      this.toastElement = this.buildToast();

      // Get the root element
      var rootElement;
      if (typeof this.options.selector === "string") {
        rootElement = document.querySelector(this.options.selector);
      } else if (this.options.selector instanceof HTMLElement || (typeof ShadowRoot !== 'undefined' && this.options.selector instanceof ShadowRoot)) {
        rootElement = this.options.selector;
      } else {
        rootElement = document.body;
      }

      if (!rootElement) {
        throw "Root element is not defined";
      }

      // Insert the toast
      if (defaults.oldestFirst) {
        rootElement.insertBefore(this.toastElement, rootElement.firstChild);
      } else {
        rootElement.appendChild(this.toastElement);
      }

      // Reposition existing toasts
      Alertify.reposition();

      // Show the toast
      setTimeout(function() {
        this.toastElement.classList.add("on");
      }.bind(this), 10); // Slight delay to allow CSS transition

      // Set timeout to remove the toast
      if (this.options.duration > 0) {
        this.toastElement.timeOutValue = setTimeout(function() {
          this.removeElement(this.toastElement);
        }.bind(this), this.options.duration);
      }

      return this;
    },

    hideToast: function() {
      if (this.toastElement.timeOutValue) {
        clearTimeout(this.toastElement.timeOutValue);
      }
      this.removeElement(this.toastElement);
    },

    // Removing the element from the DOM
    removeElement: function(toastElement) {
      if (!toastElement) return;

      // Hide the toast
      toastElement.classList.remove("on");

      // Remove after transition
      setTimeout(function() {
        if (toastElement.parentNode) {
          toastElement.parentNode.removeChild(toastElement);
        }

        // Call the callback
        this.options.callback.call(toastElement);

        // Reposition remaining toasts
        Alertify.reposition();
      }.bind(this), 400); // Match the CSS transition duration
    }
  };

  // Positioning the toasts on the DOM
  Alertify.reposition = function() {
    var topOffset = 15;
    var bottomOffset = 15;
    var offsetSpacing = 15;
    var width = window.innerWidth > 0 ? window.innerWidth : screen.width;

    var allToasts = document.getElementsByClassName("alertify");

    for (var i = 0; i < allToasts.length; i++) {
      var toast = allToasts[i];
      var gravity = containsClass(toast, "alertify-top") ? "top" : "bottom";
      var position = containsClass(toast, "alertify-left") ? "left" : (containsClass(toast, "alertify-right") ? "right" : "center");
      
      var offset = gravity === "top" ? topOffset : bottomOffset;

      if (width <= 360) {
        toast.style.top = gravity === "top" ? `${offset}px` : '';
        toast.style.bottom = gravity === "bottom" ? `${offset}px` : '';
        toast.style.left = '50%';
        toast.style.transform = `translateX(-50%) translateY(${gravity === "top" ? 0 : 0}px)`;
        offset += toast.offsetHeight + offsetSpacing;
      } else {
        if (position === "left") {
          toast.style.top = gravity === "top" ? `${topOffset}px` : '';
          toast.style.bottom = gravity === "bottom" ? `${bottomOffset}px` : '';
          toast.style.left = `${offset}px`;
          toast.style.transform = '';
          topOffset += toast.offsetHeight + offsetSpacing;
        } else if (position === "right") {
          toast.style.top = gravity === "top" ? `${topOffset}px` : '';
          toast.style.bottom = gravity === "bottom" ? `${bottomOffset}px` : '';
          toast.style.right = `${offset}px`;
          toast.style.transform = '';
          topOffset += toast.offsetHeight + offsetSpacing;
        } else if (position === "center") {
          toast.style.left = '50%';
          toast.style.transform = `translateX(-50%)`;
          toast.style.top = gravity === "top" ? `${offset}px` : '';
          toast.style.bottom = gravity === "bottom" ? `${offset}px` : '';
          if (gravity === "top") {
            topOffset += toast.offsetHeight + offsetSpacing;
          } else {
            bottomOffset += toast.offsetHeight + offsetSpacing;
          }
        }
      }
    }

    return this;
  };

  // Helper function to get offset value
  function getAxisOffsetAValue(axis, options) {
    if (options.offset[axis]) {
      if (isNaN(options.offset[axis])) {
        return options.offset[axis];
      } else {
        return options.offset[axis] + 'px';
      }
    }
    return '0px';
  }

  // Helper function to check if element has a class
  function containsClass(elem, yourClass) {
    if (!elem || typeof yourClass !== "string") {
      return false;
    } else if (
      elem.className &&
      elem.className
        .trim()
        .split(/\s+/gi)
        .indexOf(yourClass) > -1
    ) {
      return true;
    } else {
      return false;
    }
  }

  // Setting up the prototype for the init object
  Alertify.lib.init.prototype = Alertify.lib;

  // Return the Alertify function to be assigned to the window object/module
  return Alertify;
  console.log('Alert displayed!');
});
