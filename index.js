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
    const GROUP_PREFIX = "$";
    const GROUP_SEP = "/";

    /**
     * Add a layer group to the map.
     *
     * @param {Map} map
     * @param {string} groupId The id of the new group (use `group/sub-group` format to create a sub group)
     * @param {Array<Object>} layers The Mapbox style spec layers of the new group
     * @param {string} beforeId The id of an existing layer or group to insert the new layers group before. If this argument is omitted, the layers group will be appended to the end of the layers array.
     */
    function addGroup(map, groupId, layers, beforeId) {
        groupId = _normalizeGroupId(groupId);
        let beforeLayerId = _normalizeBeforeId(map, beforeId);
        layers.forEach(layer => {
            _addLayerToGroup(map, groupId, layer, beforeLayerId, true);
        });
    }

    function createGroupId(...groups) {
        return GROUP_PREFIX + groups.join(GROUP_SEP);
    }

    /**
     * Add a single layer to an existing layer group.
     *
     * @param {Map} map
     * @param {string} groupId The id of group
     * @param {Object} layer The Mapbox style spec layer
     * @param {string} beforeId The id of an existing layer to insert the new layer before. If this argument is omitted, the layer will be appended to the end of the layers group.
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
     * @param {string} beforeId The id of an existing layer to insert the new layer before. If this argument is omitted, the layer will be appended to the end of the layers group.
     * @param {boolean} true to ignore beforeId check, false otherwise
     */
    function _addLayerToGroup(map, groupId, layer, beforeId, ignoreBeforeIdCheck) {
        if (!ignoreBeforeIdCheck && beforeId && (!_isLayer(map, beforeId) || !getLayerGroupIds(map, beforeId).includes(groupId))) {
            throw new Error('beforeId must be a layer id within the same group');
        } else if (!ignoreBeforeIdCheck && !beforeId) {
            beforeId = _getLayerIdFromIndex(map, _getGroupLastLayerIndex(map, groupId) + 1);
        }
        let groups = new Set(layer.metadata && layer.metadata.groups || []);
        groups.add(groupId.split(GROUP_SEP).reduce((previousPart, part) => {
            groups.add(previousPart);
            return previousPart + GROUP_SEP + part;
        }));
        let groupedLayer = Object.assign(
            {},
            layer,
            {
                metadata: Object.assign(
                    {},
                    layer.metadata || {},
                    {
                        groups: [...groups],
                    }
                )
            }
        );
        map.addLayer(groupedLayer, beforeId);
    }

    function _getGroupIdsFromLayer(layer) {
        return layer.metadata && layer.metadata.groups || [];
    }

    /**
     * Remove a layer group and all of its layers from the map.
     *
     * @param {Map} map
     * @param {string} groupId The id of the group to be removed.
     */
    function removeGroup(map, groupId) {
        groupId = _normalizeGroupId(groupId);
        map.getStyle().layers.filter(layer => _getGroupIdsFromLayer(layer).includes(groupId)).forEach(layer => {
            map.removeLayer(layer.id);
        });
    }

    /**
     * Remove a layer group and all of its layers from the map.
     *
     * @param {Map} map
     * @param {string} groupId The id of the group to be moved.
     * @param {string} beforeId The id of an existing layer or group to insert the new layers group before. If this argument is omitted, the layer will be appended to the end of the layers array.
     */
    function moveGroup(map, groupId, beforeId) {
        groupId = _normalizeGroupId(groupId);
        let beforeLayerId = _normalizeBeforeId(map, beforeId);
        map.getStyle().layers.filter(layer => _getGroupIdsFromLayer(layer).includes(groupId)).forEach(layer => {
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
        return _getLayerIdFromIndex(map, _getGroupFirstLayerIndex(map, _normalizeGroupId(groupId)));
    }

    /**
     * Get the id of the last layer in a group.
     *
     * @param {Map} map
     * @param {string} groupId The id of the group.
     * @returns {string}
     */
    function getGroupLastLayerId(map, groupId) {
        return _getLayerIdFromIndex(map, _getGroupLastLayerIndex(map, _normalizeGroupId(groupId)));
    }

    function _getGroupFirstLayerIndex(map, groupId) {
        return map.getStyle().layers.findIndex(layer => _getGroupIdsFromLayer(layer).includes(groupId));
    }

    function _getGroupLastLayerIndex(map, groupId) {
        return map.getStyle().layers.slice().reverse().findIndex(layer => _getGroupIdsFromLayer(layer).includes(groupId));
    }

    function _getLayerIdFromIndex(map, index) {
        let layer = map.getStyle().layers[index];
        return layer && layer.id || undefined;
    }

    function getLayerGroupIds(map, id) {
        return _getGroupIdsFromLayer(map.getLayer(id));
    }

    function getLayersInGroup(map, groupId) {
        groupId = _normalizeGroupId(groupId);
        return map.getStyle().layers.filter(layer => _getGroupIdsFromLayer(layer).includes(groupId));
    }

    function _isLayer(map, id) {
        return !!map.getLayer(id);
    }

    function _normalizeGroupId(groupId) {
        if (groupId && groupId[0] !== GROUP_PREFIX) {
            return GROUP_PREFIX + groupId;
        } else {
            return groupId;
        }
    }

    function _getFirstParentGroup(groupIds) {
        return groupIds.splice().sort((left, right) => left.split(GROUP_SEP).length - right.split(GROUP_SEP).length)[0];
    }

    function _normalizeBeforeId(map, beforeId) {
        if (beforeId) {
            let beforeLayer = map.getLayer(beforeId);
            let beforeGroupId = beforeLayer ? _getFirstParentGroup(_getGroupIdsFromLayer(beforeLayer)) : _normalizeGroupId(beforeId);
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
        createGroupId,
        addGroup,
        removeGroup,
        moveGroup,
        addLayerToGroup,
        getLayerGroupIds,
        getLayersInGroup,
        getGroupFirstLayerId,
        getGroupLastLayerId,
    };
}));
