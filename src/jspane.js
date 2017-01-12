(function () {
  'use strict';

  var defaultOptions = {
    container: '#jspane',
    events: {
      onPaneCreate: null,
      onPaneResized: null,
      onPaneDestroy: null,
    }
  };

  var Pane = function (options) {
    var self = this;

    this.options = extend(defaultOptions, options);

    var containerId = this.options.container;
    this.container = document.querySelector(containerId);

    this.current = {
      separator: null,
      anchor: null
    };

    var rootPane = createPane();
    this.setPaneDimensions(rootPane, [100, 100]);
    this.container.append(rootPane);

    document.addEventListener('mousemove', function (event) {
      if (self.current.anchor) {
        var anchor = self.current.anchor;

        var b = anchor.getBoundingClientRect();
        var position = [b.left + (b.width / 2), b.top + (b.height / 2)];

        var delta = [position[0] - event.pageX, position[1] - event.pageY];
        anchor.dataset.delta = JSON.stringify(delta);
        updateAnchorFeedback(anchor, delta);
      }
    });

    document.addEventListener('mousemove', function (event) {
      if (self.current.separator) {
        var sep = self.current.separator;

        //TODO: get separator group
        //TODO: get resizing axis for group
        //TODO: calculate delta for given axis
        //TODO: update position for pane 1
        //TODO: update position for pane 2
      }
    });

    document.addEventListener('mouseup', function (event) {
      if (self.current.separator) self.current.separator = null;
      if (self.current.anchor) {
        var anchor = self.current.anchor
        var delta = JSON.parse(anchor.dataset.delta);
        //TODO: if-else to choose action (split | merge)
        self.current.anchor = null;
      }
    });

    function createPane () {
      var pane = document.createElement('div');
      pane.className = 'pane';
      runCallback(self.options.events.onPaneCreate);
      pane.append(createAnchor(onAnchorMouseDown));
      return pane;
    }

    function onAnchorMouseDown (event) {
      self.current.anchor = event.target;
    }

    function createSeparator (pane1, pane2, size) {
      var separator = document.createElement('div');
      var group = pane1.parent('.pane-group');
      separator[group.data('styleProperty')](size);
      separator.addEventListener('mousedown', onSeparatorMouseDown);
      separator.className ='pane-separator';
      separator.data('pane1', pane1);
      separator.data('pane2', pane2);
      var arrow = group.data('styleProperty') === 'width' ? 'ew' : 'ns';
      separator.style.cursor = arrow + '-resize';
      group.insertBefore(separator, pane2);
      return element;
    }

    function onSeparatorMouseDown (event) {
      self.current.separator = event.target;
      event.target.dataset.startX = event.pageX;
      event.target.dataset.startY = event.pageY;
    }
  };

  Pane.prototype.setPaneDimensions = function (pane, dimensions) {
    var dimensionsAsString = JSON.stringify(dimensions);
    pane.dataset.dimensions = dimensionsAsString;
    //TODO: get pane group
    //TODO: get group resizing axis
    //TODO: get separators of group
    //TODO: get separators accumulated size
    //TODO: update actual dimensions of pane calc(50% - 5px)
  };

  Pane.prototype.getPaneDimensions = function (pane) {
    return JSON.parse(pane.dataset.dimensions);
  };

  window.Pane = Pane;

  function createAnchor (onAnchorMouseDown) {
    var anchor = document.createElement('div');
    anchor.className = 'pane-anchor';
    anchor.addEventListener('mousedown', onAnchorMouseDown);
    return anchor;
  }

  function updateAnchorFeedback (anchor, delta) {
    if (delta[0] > anchorTreshhold) {
        anchor.style.backgroundColor = '#000000';
    } else if (delta[0] < -anchorTreshhold) {
        anchor.style.backgroundColor = '#FF0000';
    } else if (delta[1] > anchorTreshhold) {
        anchor.style.backgroundColor = '#00FF00';
    } else if (delta[1] < -anchorTreshhold) {
        anchor.style.backgroundColor = '#0000FF';
    } else {
        anchor.style.backgroundColor = '';
    }
  }

  function runCallback (callback) {
    if (callback) callback();
  }

  function extend (properties, defaults) {
    properties = properties || {};
    for (var p in defaults)
      if (defaults.hasOwnProperty(p) && !properties[p]) {
          var value = defaults[p];
          if (typeof value === 'object')
              extend(properties[p], defaults[p]);
          else
              properties[p] = defaults[p];
      }
    return properties;
  }
})();
