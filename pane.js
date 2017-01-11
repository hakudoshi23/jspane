(function () {
  'use strict';

  var defaultOptions = {
    container: '#jspane',
    events: {
      onPaneCreate: null,
      onPaneResizeStart: null,
      onPaneResizes: null,
      onPaneResizeStop: null,
      onPaneDestroy: null,
    }
  };

  var Pane = function (options) {
    this.options = extend(defaultOptions, options);

    var containerId = this.options.container;
    this.container = document.querySelector(containerId);

    var rootPane = this.createPane();
    this.setPaneDimensions(rootPane, 100, 100);
    this.container.append(rootPane);
  };

  Pane.prototype.createPane = function () {
    var pane = document.createElement('div');
    pane.className = 'pane';
    if (this.options.events.onPaneCreate)
      this.options.events.onPaneCreate();
    return pane;
  };

  Pane.prototype.setPaneDimensions = function (pane) {
    var dimensions = [0, 0];
    if (arguments.length === 2) {
      dimensions = arguments[1];
    }else if (arguments.length === 3) {
      dimensions[0] = arguments[1];
      dimensions[1] = arguments[2];
    }
    var dimensionsAsString = JSON.stringify(dimensions);
    pane.dataset.dimensions = dimensionsAsString;
  };

  Pane.prototype.getPaneDimensions = function (pane) {
    return JSON.parse(pane.dataset.dimensions);
  };

  window.Pane = Pane;

  function extend (defaults, options) {
    //TODO: implement
    return defaults;
  }
})();
