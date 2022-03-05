// ==UserScript==
// @name         Magic Eden launchpad bot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This is a tamper monkey script to bot Magic Eden's launchpad.
// @author       0xku5ama
// @match        https://magiceden.io/launchpad/*
// @icon         https://www.google.com/s2/favicons?domain=google.com
// @grant        none
// ==/UserScript==


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function bot() {
    while (true) {
        try {
            let button = document.querySelector('.PlainButton_primary__22Ken'); // Magic eden css selector to select mint button
            button.click();
            await sleep(100); // Spam every 0.1s, spamming too fast can cause browser to hang
            console.log("Mint button clicked");
        } catch (err) {
            console.log("Button not ready");
            await sleep(5000);
        }
    }
}

(function() {
    'use strict';
    // Your code here...
    bot();
})();
