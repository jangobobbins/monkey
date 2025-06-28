// ==UserScript==
// @name         No Feed
// @namespace    http://tampermonkey.net/
// @version      2024-06-23
// @description  try to take over the world!
// @author       You
// @match        https://www.facebook.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=facebook.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    document.querySelectorAll('[role="main"]')[0].remove();
})();