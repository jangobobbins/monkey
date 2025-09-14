// ==UserScript==
// @name         Auto Prompt
// @namespace    http://tampermonkey.net/
// @version      2024-04-03
// @description  try to take over the world!
// @author       You
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=openai.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const sexes = [
        "male",
        "female"
    ];

    const characterList = [
        "vampire",
        "zombie",
        "skeleton",
        "wizard",
        "sorcerer",
        "giant",
        "dwarf",
        "elf",
        "fairy",
        "oracle",
        "blacksmith",
        "bard",
        "merchant",
        "angel",
        "demon",
        "werewolf"
    ];

    async function prompt(sex, character, generation) {
        return new Promise((resolve, reject) => {
            let textbox = document.querySelector("div.ProseMirror#prompt-textarea");

            if (!textbox) {
                console.error(`Cannot Prompt Anymore, ended at ${sex} ${character} ${generation}`);
                reject(new Error("Textbox not found."));
                return;
            }
            console.log(`Prompting for ${sex} ${character} ${generation}`);
            let text = `Consider what a ${sex} ${character} might do as part of their character, describe it in detail, make it so that it is an epic activity. Then create an image of a tabletop figurine 3D model of the ${sex} ${character}. This scene is depicted as a 3D model of a tabletop figurine. With the full body in view, doing what you imagined attached on a round base, and rendered in grayscale, in a gothic art style. The art style is intricately detailed and textured, suitable for conveying a rich, gothic aesthetic. The pose is dynamic, capturing a moment of intense action or power, in a state of significant activity. Rendered in grayscale.`;
            textbox.innerHTML = `<p>${text}</p>`;
            textbox.dispatchEvent(new InputEvent("input", {
                bubbles: true,
                cancelable: true,
                inputType: "insertText",
                data: text
            }));
            resolve();
        });
    }

    async function replay() {
        return new Promise((resolve, reject) => {
            let list = document.getElementsByClassName(
                "p-1 rounded-md text-token-text-tertiary hover:text-token-text-primary md:invisible md:group-hover:visible md:group-[.final-completion]:visible");
            console.log("Replay");
            list[list.length - 2].click();
            resolve();
        });
    }

    async function send() {
        return new Promise((resolve, reject) => {
            let btn = document.querySelector("#composer-submit-button")
            if (!btn) {
                console.log("Cannot Send Anymore");
                reject("Send button not found.");
                return;
            }
            console.log("Message Sent");
            btn.click();
            resolve();
        });
    }

    function wait(ms) {
        return new Promise(resolve => {
            console.log(`Waiting for ${ms}ms`);
            setTimeout(resolve, ms);
        });
    }

    async function generateImageSet(sex, character) {
        const MAX_GENERATIONS = 10;
        for (let generation = 0; generation < MAX_GENERATIONS; generation++) {
            try {
                await prompt(sex, character, generation);
                await wait(1000);
                await send();
                await wait(8 * 60 * 1000);
            } catch (error) {
                console.error(error);
                break;
            }
        }
    }

    async function startGenerating() {
        for (let i = 0; i < sexes.length; i++) {
            const sex = sexes[i];
            for (let j = 0; j < characterList.length; j++) {
                const character = characterList[j];
                await generateImageSet(sex, character); // Wait for each generation to complete
            }
        }
    }

    const startBtn = document.createElement('button');
    startBtn.textContent = 'Start';
    startBtn.style.position = 'fixed';
    startBtn.style.bottom = '10px';
    startBtn.style.right = '60px';
    startBtn.style.zIndex = '10000';
    startBtn.style.backgroundColor = 'grey';
    startBtn.style.border = '1px solid black';
    startBtn.style.padding = '10px';
    startBtn.onclick = startGenerating; // Note: The actual generation process is asynchronous and won't block the UI
    document.body.appendChild(startBtn);


})();