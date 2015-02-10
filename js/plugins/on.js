/**
 * @file on command plugin script
 * @description 启用扩展/应用
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var util = require('../common/util');
    var title = '启用扩展';
    var subtitle = '查找并启用扩展';

    function setEnabled(id, enabled) {
        chrome.management.setEnabled(id, enabled, function () {});
    }

    function getExtensions(key, enabled, callback) {
        chrome.management.getAll(function (extList) {
            var matchExts = extList.filter(function (ext) {
                return util.matchText(key, ext.name) && ext.enabled === enabled;
            });

            callback(matchExts);
        });
    }

    function onInput(key) {
        var that = this;
        getExtensions(key.toLowerCase(), false, function (matchExts) {
            sortExtensions(matchExts, key, function (matchExts) {
                that.showItemList(matchExts);
            });
        });
    }

    function onEnter(id) {
        setEnabled(id, true);
        this.refresh();
        addRecord('ext', this.query, id);
    }

    function sortExtFn(a, b) {
        return a.num == b.num ? b.update - a.upate : b.num - a.num;
    }

    function sortExtensions(matchExts, key, callback) {
        chrome.storage.sync.get('ext', function (data) {
            var sExts = data.ext;

            if (!sExts) {
                callback(matchExts);
            }

            // sExts: {id: {id: '', querys: {'key': {num: 0, update: ''}}}}
            matchExts = matchExts.map(function (extObj) {
                var id = extObj.id;

                if (!sExts[id] || !sExts[id].querys[key]) {
                    extObj.num = 0;
                    extObj.upate = 0;

                    return extObj;
                }

                extObj.num = sExts[id].querys[key].num;
                extObj.update = sExts[id].querys[key].update;

                return extObj;
            });

            matchExts.sort(sortExtFn);

            callback(matchExts);
        });
    }

    function addRecord(type, query, id) {
        chrome.storage.sync.get(type, function (data) {
            // data = {ext: {}}
            var extObj = data;
            // info = {id: {}};
            var info = extObj[type];

            if ($.isEmptyObject(extObj)) {
                info = extObj[type] = {};
            }

            var obj;

            if (!info[id]) {
                obj = info[id] = createObj4Storage(id, query);
            }
            else {
                obj = info[id];

                if (obj.querys[query]) {
                    obj.querys[query].num += 1;
                }
                else {
                    obj.querys[query] = {
                        num: 1,
                        update: +new Date()

                    };
                }
            }

            chrome.storage.sync.set(extObj, function () {});
        });
    }

    function createObj4Storage(id, query) {
        var obj = {
            id: id,
            querys: {}

        };

        obj.querys[query] = {
            num: 1,
            update: +new Date()

        };

        return obj;
    }

    function createItem(index, item) {
        var url = item.icons instanceof Array ? item.icons[0].url : '';

        return [
            '<div data-type="ext" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
            '<img class="ec-item-icon" src="' + url + '" alt="" />',
            '<span class="ec-item-name ' + (item.installType === 'development' ? 'ec-item-warn' : '') + '">' + item.name + '</span>',
            '</div>'
        ];
    }

    module.exports = {
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter,
        createItem: createItem

    };
});
