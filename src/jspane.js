(function () {
    'use strict';

    var defaultOptions = {
        container: '#jspane',
        anchor: {
            treshhold: 10
        },
        separator: {
            size: 5
        },
        events: {
            onPaneCreate: null,
            onPaneResized: null,
            onPaneDestroy: null,
        }
    };

    var Pane = function (options) {
        this.fn = Pane.prototype;
        var self = this;

        this.options = extend(defaultOptions, options);

        var containerId = this.options.container;
        this.container = document.querySelector(containerId);

        this.current = {
            separator: null,
            anchor: null
        };

        var rootPane = createPane();
        this.container.append(rootPane);

        document.addEventListener('mousemove', function (event) {
            var delta = 0;
            if (self.current.anchor) {
                var anchor = self.current.anchor;
                delta = getAnchorDelta(anchor, event);

                anchor.dataset.delta = JSON.stringify(delta);
                updateAnchorFeedback(anchor, delta, self.options.anchor.treshhold);
            }
            if (self.current.separator) {
                var separator = self.current.separator;
                var group = separator.parentNode;
                var axis = group.dataset.axis;

                var current = [event.clientX, event.clientY];
                var initial = JSON.parse(separator.dataset.initial);
                delta = current[axisToIndex(axis)] - initial;
                separator.dataset.delta = delta;

                updateSeparatorPanes(self, separator, axis, delta);
                separator.dataset.initial = JSON.stringify(initial + delta);
            }
        });

        document.addEventListener('mouseup', function (event) {
            if (self.current.separator) self.current.separator = null;
            if (self.current.anchor) {
                var anchor = self.current.anchor;
                var delta = JSON.parse(anchor.dataset.delta);

                var pane = anchor.parentNode;
                switch (getAnchorAction(delta, self.options.anchor.treshhold)) {
                    case 'left': self.split(pane, 'width'); break;
                    case 'right': self.merge(pane, 'width'); break;
                    case 'up': self.split(pane, 'height'); break;
                    case 'down': self.merge(pane, 'height'); break;
                }

                self.current.anchor = null;
            }
        });

        this.split = function (pane, axis) {
            var group = wrapByGroupIfNeeded(self, pane, axis);
            var newPane = createPane();
            var separator = createSeparator(self.options.separator.size, axis);

            var axisIndex = axisToIndex(axis);
            var currentPaneDimensions = self.getDimensions(pane);
            var newPaneDimensions = self.getDimensions(newPane);
            newPaneDimensions[axisIndex] = currentPaneDimensions[axisIndex] / 2.0;
            currentPaneDimensions[axisIndex] = currentPaneDimensions[axisIndex] / 2.0;

            group.insertBefore(newPane, pane.nextSibling);
            group.insertBefore(separator, pane.nextSibling);

            self.setDimensions(pane, currentPaneDimensions);
            self.setDimensions(newPane, newPaneDimensions);
            self.updateGroupDimensions(group);

            runCallback(self.options.events.onPaneCreate, newPane);
        };

        this.merge = function (pane, axis) {
            if (pane.nextSibling) {
                var group = pane.parentNode;
                if (group.dataset.axis === axis) {
                    var toRemove = pane.nextSibling.nextSibling;
                    runCallback(self.options.events.onPaneDestroy, toRemove);

                    var paneDimensions = self.getDimensions(pane);
                    var toRemoveDimensions = self.getDimensions(toRemove);

                    group.removeChild(pane.nextSibling);
                    group.removeChild(pane.nextSibling);

                    var axisIndex = axisToIndex(axis);
                    paneDimensions[axisIndex] += toRemoveDimensions[axisIndex];
                    self.setDimensions(pane, paneDimensions);

                    unwrapFromGroupIfNeeded(self, pane, axis);
                    self.updateGroupDimensions(pane.parentNode);
                }
            }
        };

        function createPane () {
            var pane = document.createElement('div');
            pane.className = 'pane';
            self.setDimensions(pane, [100, 100]);
            pane.append(createAnchor(onAnchorMouseDown));
            runCallback(self.options.events.onPaneCreate);
            return pane;
        }

        function createSeparator (size, axis) {
            var separator = document.createElement('div');
            separator.addEventListener('mousedown', onSeparatorMouseDown);
            var arrow = axisToIndex(axis) ? 'ns' : 'ew';
            separator.style.cursor = arrow + '-resize';
            separator.className = 'pane-separator';
            separator.style[axis] = size + 'px';
            return separator;
        }

        function onAnchorMouseDown (event) {
            self.current.anchor = event.target;
        }

        function onSeparatorMouseDown (event) {
            var separator = event.target;
            self.current.separator = separator;
            var group = separator.parentNode;
            var axis = group.dataset.axis;
            var positionArray = [event.pageX, event.pageY];
            var position = positionArray[axisToIndex(axis)];
            separator.dataset.initial = JSON.stringify(position);
        }
    };

    Pane.prototype.setDimensions = function (pane, dimensions) {
        var dimensionsAsString = JSON.stringify(dimensions);
        pane.dataset.dimensions = dimensionsAsString;

        var group = this.getGroup(pane);
        if (group === null) {
            pane.style.width = 'calc(100% - 0px)';
            pane.style.height = 'calc(100% - 0px)';
        } else {
            var panes = this.getPanes(group);
            var sepSize = this.getSeparatorsSize(group);
            var axis = group.dataset.axis;

            var subSize = [0, 0];
            if (panes.length > 0)
                subSize[axisToIndex(axis)] = (sepSize / panes.length);
            pane.style.width = 'calc(' + dimensions[0] + '% - ' + subSize[0] + 'px)';
            pane.style.height = 'calc(' + dimensions[1] + '% - ' + subSize[1] + 'px)';
        }
    };

    Pane.prototype.updateDimensions = function (pane) {
        this.setDimensions(pane, this.getDimensions(pane));
    };

    Pane.prototype.getDimensions = function (pane) {
        return JSON.parse(pane.dataset.dimensions);
    };

    Pane.prototype.getGroup = function (pane) {
        var parent = pane.parentNode;
        if (parent) {
            var isGroupNode = parent.className.indexOf('pane-group') != -1;
            if (isGroupNode) return parent;
        }
        return null;
    };

    Pane.prototype.updateGroupDimensions = function (group) {
        var panes = this.getPanes(group);
        for (var i = 0; i < panes.length; i++)
            this.updateDimensions(panes[i]);
    };

    Pane.prototype.getPanes = function (group) {
        return group.querySelectorAll(':scope > .pane');
    };

    Pane.prototype.getSeparators = function (group) {
        return group.querySelectorAll(':scope > .pane-separator');
    };

    Pane.prototype.getSeparatorsSize = function (group) {
        if (!group) return 0;
        var total = 0;
        var axis = group.dataset.axis;
        var separators = this.getSeparators(group);
        for (var i = 0; i < separators.length; i++)
            total += getClientProperty(separators[i], axis);
        return total;
    };

    Pane.prototype.setGroupDimensions = function (group, arrayOfDimensions) {
        var axis = group.dataset.axis;
        var panes = this.getPanes(group);
        var axisIndex = axisToIndex(axis);
        for (var i = 0; i < panes.length; i++) {
            var pane = panes[i];
            var dim = this.getDimensions(pane);
            dim[axisIndex] = arrayOfDimensions[i];
            this.setDimensions(pane, dim);
        }
    };

    Pane.prototype.getGroupDimensions = function (group) {
        var output = [];
        var axis = group.dataset.axis;
        var panes = this.getPanes(group);
        var axisIndex = axisToIndex(axis);
        for (var i = 0; i < panes.length; i++) {
            var pane = panes[i];
            var dim = this.getDimensions(pane);
            output.push(dim[axisIndex]);
        }
        return output;
    };

    window.Pane = Pane;

    function wrapByGroupIfNeeded (self, pane, axis) {
        var group = pane.parentNode;
        var isGroup = group.className.indexOf('pane-group') != -1;
        var hasRightAxis = group.dataset.axis === axis;
        if (!isGroup || !hasRightAxis) {
            group = createGroup(axis);
            replaceElement(pane, group);
            group.append(pane);
            self.setDimensions(group, self.getDimensions(pane));
            self.setDimensions(pane, [100, 100]);
        }
        return group;
    }

    function unwrapFromGroupIfNeeded (self, pane, axis) {
        var group = pane.parentNode;
        var isGroup = group.className.indexOf('pane-group') != -1;
        var hasSingleChildren = group.children.length === 1;
        if (isGroup && hasSingleChildren) {
            self.setDimensions(pane, self.getDimensions(group));
            replaceElement(group, pane);
        }
    }

    function createGroup (axis) {
        var group = document.createElement('div');
        group.className = 'pane pane-group';
        group.dataset.axis = axis;
        return group;
    }

    function createAnchor (onAnchorMouseDown) {
        var anchor = document.createElement('div');
        anchor.className = 'pane-anchor';
        anchor.addEventListener('mousedown', onAnchorMouseDown);
        anchor.dataset.delta = JSON.stringify([0, 0]);
        return anchor;
    }

    function getAnchorDelta (anchor, event) {
        var center = getElementCenter(anchor);
        return [center[0] - event.pageX, center[1] - event.pageY];
    }

    function updateAnchorFeedback (anchor, delta, treshhold) {
        var feedbackColor = getAnchorFeedbackColor(delta, treshhold);
        anchor.style.backgroundColor = feedbackColor;
    }

    function getAnchorFeedbackColor (delta, treshhold) {
        switch (getAnchorAction(delta, treshhold)) {
            case 'left': return '#000000';
            case 'right': return '#FF0000';
            case 'up': return '#00FF00';
            case 'down': return '#0000FF';
            default: return '';
        }
    }

    function getAnchorAction (delta, treshhold) {
        if (delta[0] > +treshhold) return 'left';
        if (delta[0] < -treshhold) return 'right';
        if (delta[1] > +treshhold) return 'up';
        if (delta[1] < -treshhold) return 'down';
        return '';
    }

    function updateSeparatorPanes (self, separator, axis) {
        var group = separator.parentNode;
        var axisIndex = axisToIndex(axis);
        var delta = parseFloat(separator.dataset.delta);
        var deltaPercentage = delta *100 / getClientProperty(group, axis);
        var pane1 = separator.previousSibling;
        var pane2 = separator.nextSibling;
        var pane1Dimensions = self.getDimensions(pane1);
        var pane2Dimensions = self.getDimensions(pane2);
        pane1Dimensions[axisIndex] += deltaPercentage;
        pane2Dimensions[axisIndex] -= deltaPercentage;
        self.setDimensions(pane1, pane1Dimensions);
        self.setDimensions(pane2, pane2Dimensions);
    }

    function runCallback (callback) {
        if (callback) callback();
    }

    function getElementCenter (element) {
        var b = element.getBoundingClientRect();
        return [b.left + (b.width / 2), b.top + (b.height / 2)];
    }

    function getClientProperty (element, axis) {
        var axisWithCapital = axis.charAt(0).toUpperCase() + axis.slice(1);
        var propertyName = 'client' + axisWithCapital;
        return element[propertyName];
    }

    function replaceElement (current, toReplace) {
        var parent = current.parentNode;
        parent.insertBefore(toReplace, current);
        parent.removeChild(current);
    }

    function axisToIndex (axis) {
        if (axis === 'width') return 0;
        else if (axis === 'height') return 1;
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
