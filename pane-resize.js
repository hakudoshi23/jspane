(function () {
  'use strict';

  var currentSeparator = null;

  Pane.prototype.createSeparator = function () {
    var separator = document.createElement('div');
    separator.addEventListener('mousedown', onSeparatorMouseDown);
    separator.className = 'pane-separator';
    return separator;
  };

  document.addEventListener('mousemove', onDocumentMouseMove);
  document.addEventListener('mouseup', onDocumentMouseUp);

  function onSeparatorMouseDown () {
    //TODO: implement
  }

  function onDocumentMouseMove () {
    //TODO: implement
  }

  function onDocumentMouseUp () {
    //TODO: implement
  }

  function onSeparatorMove () {
    //TODO: implement
  }
})();
