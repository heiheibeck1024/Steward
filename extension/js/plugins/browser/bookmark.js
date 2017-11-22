/**
 * @description search in bookmarks
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'

const chrome = window.chrome;
const version = 4;
const name = 'bookmark';
const keys = [
    { key: 'bm', shiftKey: true },
    { key: 'bmd' }
];
const type = 'keyword';
const icon = chrome.extension.getURL('img/bookmark.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);

function searchBookmark(query, callback) {
    if (!query) {
        chrome.bookmarks.getRecent(10, function (bookMarkList) {
            callback(bookMarkList || []);
        });

        return;
    }

    chrome.bookmarks.search(query, function (data) {
        let bookMarkList = data || [];

        bookMarkList = bookMarkList.filter(function (bookmark) {
            return typeof bookmark.url !== 'undefined';
        });

        callback(bookMarkList);
    });
}

function onInput(query, command) {
    return new Promise(resolve => {
        searchBookmark(query, bookMarkList => {
            const wrapDesc = util.wrapWithMaxNumIfNeeded('url');
            const arr = [];
            let i;

            for (i in bookMarkList) {
                const item = bookMarkList[i];
                let desc = item.url;

                if (command.shiftKey) {
                    desc = wrapDesc(item, i);
                }

                arr.push({
                    key: command.key,
                    id: item.id,
                    icon,
                    url: item.url,
                    title: item.title,
                    desc,
                    isWarn: false
                });
            }

            resolve(arr);
        });
    });
}

function onEnter(item, { orkey }, query, shiftKey, list) {
    const maxOperandsNum = window.stewardCache.config.general.maxOperandsNum;

    if (orkey === 'bm') {
        if (shiftKey) {
            list.slice(0, maxOperandsNum).forEach(bookmark => {
                chrome.tabs.create({
                    url: bookmark.url,
                    active: false
                });
            });
        } else {
            chrome.tabs.create({
                url: item.url
            });
        }
    } else if (orkey === 'bmd') {
        chrome.bookmarks.remove(item.id, () => {
            this.refresh();
        });
    }
}

export default {
    version,
    name: 'Bookmarks',
    icon,
    title,
    commands,
    onInput,
    onEnter
};