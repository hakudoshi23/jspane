(function () {
  'use strict';

  var _prevCreatePane = Pane.prototype.createPane;
  Pane.prototype.createPane = function () {
    var pane = _prevCreatePane();

    var anchor = document.createElement('div');
    anchor.className = 'pane-anchor';
    anchor.addEventListener('mousedown', onAnchorMouseDown);
    pane.append(anchor);

    return pane;
  };

  function onAnchorMouseDown () {
    //TODO: implement
  }

  function wrapInGroup (pane) {
    //TODO: implement
  }

  function unwrapFromGroup (pane) {
    //TODO: implement
  }
})();
