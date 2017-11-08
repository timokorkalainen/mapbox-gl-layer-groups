(function (root, factory) {
    // https://github.com/umdjs/umd/blob/master/templates/returnExports.js
    if (typeof define === 'function' && define.amd) { // eslint-disable-line no-undef
        // AMD. Register as an anonymous module.
        define([], factory); // eslint-disable-line no-undef
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like environments that support module.exports, like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.mapboxGlLayerGroups = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () { // eslint-disable-line no-undef
    /**
     * Add a layer group to the map.
     *
     * @param {Map} map
     * @param {string} groupId The id of the new group
     * @param {Array<Object>} layers The Mapbox style spec layers of the new group
     * @param {string} beforeId The layer id or group id after which the group
     *     will be inserted. If ommitted the group is added to the bottom of the
     *     style.
     */
    function addGroup(map, groupId, layers, beforeId) {
        groupId = _normalizeGroupId(groupId);
        let beforeLayerId = _normalizeBeforeId(map, beforeId);
        layers.forEach(layer => {
            _addLayerToGroup(map, groupId, layer, beforeLayerId, true);
        });
    }

    /**
     * Add a single layer to an existing layer group.
     *
     * @param {Map} map
     * @param {string} groupId The id of group
     * @param {Object} layer The Mapbox style spec layer
     * @param {string} beforeId An existing layer id after which the new layer
     *     will be inserted. If ommitted the layer is added to the bottom of
     *     the group.
     */
    function addLayerToGroup(map, groupId, layer, beforeId) {
        _addLayerToGroup(map, _normalizeGroupId(groupId), layer, beforeId, false);
    }

    /**
     * Add a single layer to an existing layer group.
     *
     * @param {Map} map
     * @param {string} groupId The id of group
     * @param {Object} layer The Mapbox style spec layer
     * @param {string} beforeId An existing layer id after which the new layer
     *     will be inserted. If ommitted the layer is added to the bottom of
     *     the group.
     * @param {boolean} true to ignore beforeId check, false otherwise
     */
    function _addLayerToGroup(map, groupId, layer, beforeId, ignoreBeforeIdCheck) {
        if (!ignoreBeforeIdCheck && beforeId && (!_isLayer(map, beforeId) || getLayerGroupId(map, beforeId) !== groupId)) {
            throw new Error('beforeId must be the id of a layer within the same group');
        } else if (!ignoreBeforeIdCheck && !beforeId) {
            beforeId = getLayerIdFromIndex(map, getGroupFirstLayerId(map, groupId) - 1);
        }
        let groupedLayer = Object.assign({}, layer, {metadata: Object.assign({}, layer.metadata || {}, {group: groupId})});
        map.addLayer(groupedLayer, beforeId);
    }

    function _getGroupIdFromLayer(layer) {
        return layer.metadata && layer.metadata.group;
    }

    /**
     * Remove a layer group and all of its layers from the map.
     *
     * @param {Map} map
     * @param {string} groupId The id of the group to be removed.
     */
    function removeGroup(map, groupId) {
        groupId = _normalizeGroupId(groupId);
        map.getStyle().layers.filter(layer => _getGroupIdFromLayer(layer) === groupId).forEach(layer => {
            map.removeLayer(layer.id);
        });
    }

    /**
     * Remove a layer group and all of its layers from the map.
     *
     * @param {Map} map
     * @param {string} groupId The id of the group to be removed.
     */
    function moveGroup(map, groupId, beforeId) {
        groupId = _normalizeGroupId(groupId);
        let beforeLayerId = _normalizeBeforeId(map, beforeId);
        map.getStyle().layers.filter(layer => _getGroupIdFromLayer(layer) === groupId).forEach(layer => {
            map.moveLayer(layer.id, beforeLayerId);
        });
    }

    /**
     * Get the id of the first layer in a group.
     *
     * @param {Map} map
     * @param {string} groupId The id of the group.
     * @returns {string}
     */
    function getGroupFirstLayerId(map, groupId) {
        return getLayerIdFromIndex(map, _getGroupFirstLayerIndex(map, _normalizeGroupId(groupId)));
    }

    /**
     * Get the id of the last layer in a group.
     *
     * @param {Map} map
     * @param {string} groupId The id of the group.
     * @returns {string}
     */
    function getGroupLastLayerId(map, groupId) {
        return getLayerIdFromIndex(map, _getGroupLastLayerIndex(map, _normalizeGroupId(groupId)));
    }

    function _getGroupFirstLayerIndex(map, groupId) {
        return map.getStyle().layers.findIndex(layer => _getGroupIdFromLayer(layer) === groupId);
    }

    function _getGroupLastLayerIndex(map, groupId) {
        return map.getStyle().layers.slice().reverse().findIndex(layer => _getGroupIdFromLayer(layer) === groupId);
    }

    function getLayerIdFromIndex(map, index) {
        let layer = map.getStyle().layers[index];
        return layer && layer.id || undefined;
    }

    function getLayerGroupId(map, id) {
        return _getGroupIdFromLayer(map.getLayer(id));
    }

    function getLayersInGroup(map, groupId) {
        groupId = _normalizeGroupId(groupId);
        return map.getStyle().layers.filter(layer => _getGroupIdFromLayer(layer) === groupId);
    }

    function _isLayer(map, id) {
        return !!map.getLayer(id);
    }

    function _normalizeGroupId(groupId) {
        if (groupId && groupId[0] !== "$") {
            return `$${groupId}`;
        } else {
            return groupId;
        }
    }

    function _normalizeBeforeId(map, beforeId) {
        if (beforeId) {
            let beforeLayer = map.getLayer(beforeId);
            let beforeGroupId = beforeLayer ? _getGroupIdFromLayer(beforeLayer) : beforeId;
            if (beforeGroupId) {
                return getGroupFirstLayerId(map, beforeGroupId);
            } else {
                return beforeId;
            }
        } else {
            return beforeId;
        }
    }

    return {
        addGroup,
        removeGroup,
        moveGroup,
        addLayerToGroup,
        getLayerGroupId,
        getLayersInGroup,
        getGroupFirstLayerId,
        getGroupLastLayerId,
    };
}));
