
// ==UserScript==
// @name         Group Poster
// @namespace    http://tampermonkey.net/
// @version      2024-02-18
// @description  try to take over the world!
// @author       You
// @match        https://www.facebook.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=facebook.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const PAGE_POST_SHARE_BTN = 0;
    const SHARE_TO_GROUP_BTN = 1;
    const SEARCH_BOX_INPUT = 2;
    const FIRST_GROUP_BTN = 3;
    const POST_DESCRIPTION_SPAN = 4;
    const POST_POST_BTN = 5;

    let elementPathsArray = [
        "", "", "", "", "", ""
    ];

    let currentStep = 0;
    let currentGroupName = "";

    // Go through this array of groups and run all the steps
    let groupNames = [
        "OHN"
        //         "3D Printing, Models, STL for 3D Printing",
        //         "We Love Female Miniatures",
        //         "We Love Female Miniatures",
        //         "Kickstarters & Patreons for 3D Printing",
        //         "3Dmakerdirect",
        //         "3D Printing Miniatures",
        //         "Female Figure Modellers",
        //         "Cody3D",
        //         //"Resin 3D Printers",
        //         // "3D Printing, Models, STL for 3D Printing",
        //         "Black 3D Printers Group",
        //         "$$Adult STL's$$",
        //         "3D STL Market",
        //         "Patreon 3D Printable Miniatures",
        //         "STL Collectibles",
        //         "3D print stl models",
        //         "3D Printing Group",
        //         "Miniatures 3D Printing Community",
        //         "Sculpting/STL/3D Printing",
        //         "3D Printing",
        //         "3D printing marketplace stl",
        //         "3d model for Stl file printing",
        //         "Miniatures 3D Printing Community",
        //         "3D and STL files",
        //         "STL Nation",
        //         "3D Printing ACTUALLY Uncensored",
        //         "STL vault",
        //         "3D Printing STLs Artist Marketplace",
        //         "Sale Stl, Obj and other files for 3D printing directly from the modelers",
        //         "3D PRINTING STL MARKET",
        //         "3D Printing - Model Marketplace",
        //         "3d model for Stl file printing",
        //         "3D printing, sculpting and miniatures",
        //         "Miniatures 3D Printing Community",
        //         "3D printing marketplace stl",
        //         "USA 3D Printing & Modeling",
        //         "3d sculpting/ 3d printing expert"
    ];

    // Named listener so we can remove it
    let elementNameListener = function (event) {
        event.preventDefault();
        let path = calculateJsPath(event.target);
        // we should check if we selected the correct element;
        let selectedElement = document.querySelector(path);
        if (currentStep == SEARCH_BOX_INPUT && selectedElement.tagName != "INPUT") {
            path = calculateJsPath(selectedElement.getElementsByTagName("input")[0]);
        }
        renderPaths();
        elementPathsArray[currentStep] = path;
        console.log(currentStep + " " + path);
        document.removeEventListener('click', elementNameListener, false);
    };


    function getPathForIndex(index) {
        currentStep = index;
        setTimeout(function () {
            document.addEventListener('click', elementNameListener, false);
        }, 500);
    }

    function replayAll() {
        for (let i = 0; i < groupNames.length; i++) {
            setTimeout(function () {
                doActionsForGroup(groupNames[i]);
            }, i * 30000);
        }
        alert("All done!");
    }

    function replayOnce() {
        setTimeout(function () {
            doActionsForGroup(groupNames[0]);
        }, 0);
    }

    function doActionsForGroup(groupName) {
        // Fake click event
        let customClickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        currentGroupName = groupName;

        // Click share on post
        let startMs = 0;
        setTimeout(function () {
            let shareEl = document.querySelector(elementPathsArray[PAGE_POST_SHARE_BTN]);
            shareEl.dispatchEvent(customClickEvent);
        }, startMs);


        // Click share to group
        setTimeout(function () {
            let shareToGroupEl = document.querySelector(elementPathsArray[SHARE_TO_GROUP_BTN]);
            shareToGroupEl.dispatchEvent(customClickEvent);
        }, startMs += 2000);


        // Search for group
        setTimeout(function () {
            let searchBox = document.querySelector(elementPathsArray[SEARCH_BOX_INPUT]);
            console.log(searchBox);
            let lastValue = searchBox.value;
            searchBox.value = groupName;
            let event = new Event('input', { bubbles: true });
            event.simulated = true;
            let tracker = searchBox._valueTracker;
            if (tracker) {
                tracker.setValue(lastValue);
            }
            searchBox.dispatchEvent(event);
        }, startMs += 2000);


        // Share to specific group element
        setTimeout(function () {
            let shareToSpecificGroup = document.querySelector(elementPathsArray[FIRST_GROUP_BTN]);
            console.log(shareToSpecificGroup);
            shareToSpecificGroup.dispatchEvent(customClickEvent);
        }, startMs += 2000);


        // Update post description
        setTimeout(function () {
            let el = document.querySelector(elementPathsArray[POST_DESCRIPTION_SPAN]);
            el.parentElement.dispatchEvent(new InputEvent("input", {
                bubbles: true,
                cancelable: true,
                inputType: "insertText",
                data: document.getElementById("myDescription").value
            }));
        }, startMs += 2000);


        // Click on Post button
        setTimeout(function () {
            let postBtn = document.querySelector(elementPathsArray[POST_POST_BTN]);
            console.log(postBtn);
            postBtn.dispatchEvent(customClickEvent);
        }, startMs += 2000);
        console.log(groupName);
    }


    let autoAdvanceClickListener = function (event) {
        event.preventDefault();
        let path = calculateJsPath(event.target);
        // we should check if we selected the correct element;
        let selectedElement = document.querySelector(path);
        if (currentStep == SEARCH_BOX_INPUT && selectedElement.tagName != "INPUT") {
            path = calculateJsPath(selectedElement.getElementsByTagName("input")[0]);
        }

        elementPathsArray[currentStep] = path;
        renderPaths();
        console.log(currentStep + " " + path);
        if (currentStep >= 5) {
            document.removeEventListener('click', autoAdvanceClickListener, false);
            currentStep = 0;
            return;
        }
        currentStep++;
    };

    function getReactFiberFromElement(element) {
        let keys = Object.keys(element);
        let fiberKey = keys.find(key => key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$"));
        return fiberKey ? element[fiberKey] : null;
    }

    function autoAdvanceAll() {
        currentStep = 0;
        setTimeout(function () {
            document.addEventListener('click', autoAdvanceClickListener, false);
        }, 500);
    }


    // Utility Function
    function calculateJsPath(element) {
        let path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let index = 1;
            let sibling = element;
            while (sibling = sibling.previousElementSibling) {
                index++;
            }
            let tagName = element.tagName ? element.tagName.toLowerCase() : '';
            path.unshift(tagName + ':nth-child(' + index + ')');
            element = element.parentNode;
            if (element === document) {
                break;
            }
        }
        return path.join(' > ');
    }

    // Create the main UI container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.left = '10px';
    container.style.maxWidth = "300px";
    container.style.maxHeight = '500px'; // Adjust the height as needed
    container.style.overflowY = 'auto'; // Enables vertical scrolling
    container.style.backgroundColor = 'white';
    container.style.border = '1px solid black';
    container.style.padding = '10px';
    container.style.zIndex = '10000';

    // Create an input field for pasting descriptions
    const postDescriptionInput = document.createElement('textarea');
    postDescriptionInput.id = "myDescription";
    postDescriptionInput.rows = 4;
    postDescriptionInput.cols = 50;
    postDescriptionInput.placeholder = 'Paste description here';
    container.appendChild(postDescriptionInput);

    const elementsToFind = [
        'PAGE_POST_SHARE_BTN',
        'SHARE_TO_GROUP_BTN',
        'SEARCH_BOX_INPUT',
        'FIRST_GROUP_BTN',
        'POST_DESCRIPTION_SPAN',
        'POST_POST_BTN'
    ];

    function renderPaths() {
        document.getElementById(elementsToFind[PAGE_POST_SHARE_BTN]).innerText = elementPathsArray[PAGE_POST_SHARE_BTN];
        document.getElementById(elementsToFind[SHARE_TO_GROUP_BTN]).innerText = elementPathsArray[SHARE_TO_GROUP_BTN];
        document.getElementById(elementsToFind[SEARCH_BOX_INPUT]).innerText = elementPathsArray[SEARCH_BOX_INPUT];
        document.getElementById(elementsToFind[FIRST_GROUP_BTN]).innerText = elementPathsArray[FIRST_GROUP_BTN];
        document.getElementById(elementsToFind[POST_DESCRIPTION_SPAN]).innerText = elementPathsArray[POST_DESCRIPTION_SPAN];
        document.getElementById(elementsToFind[POST_POST_BTN]).innerText = elementPathsArray[POST_POST_BTN];
    }

    // Function to create a section for each important element
    elementsToFind.forEach((name, index) => {
        const header = document.createElement('h4');
        header.textContent = name;
        container.appendChild(header);

        const pathDisplay = document.createElement('p');
        pathDisplay.id = name;
        pathDisplay.textContent = "None";
        pathDisplay.addEventListener('click', function (e) {
            console.log(document.querySelector(e.target.textContent));
        });
        container.appendChild(pathDisplay);

        const reselectButton = document.createElement('button');
        reselectButton.textContent = 'Reselect ' + name;
        reselectButton.onclick = () => {
            console.log("Reselecting " + index);
            getPathForIndex(index);
        };
        container.appendChild(reselectButton);
    });

    const replayBtn = document.createElement('button');
    replayBtn.textContent = 'Replay All';
    replayBtn.style.display = "block";
    replayBtn.onclick = replayAll;
    container.appendChild(replayBtn);

    const replayOnceBtn = document.createElement('button');
    replayOnceBtn.textContent = 'Replay Once';
    replayOnceBtn.style.display = "block";
    replayOnceBtn.onclick = replayOnce;
    container.appendChild(replayOnceBtn);

    const autoBtn = document.createElement('button');
    autoBtn.textContent = 'Start';
    replayBtn.style.display = "block";
    autoBtn.onclick = autoAdvanceAll;
    container.appendChild(autoBtn);

    // Append the container to the body
    document.body.appendChild(container);

})();