// ==UserScript==
// @name         Download Avif
// @namespace    http://tampermonkey.net/
// @version      2024-12-31
// @description  try to take over the world!
// @author       You
// @match        https://i.kickstarter.com/assets/047/426/340/*.jpg?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kickstarter.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    // Function to download and save the first image tag in the HTML document
function downloadFirstImage() {
    // Get the first <img> element in the document
    const imgElement = document.getElementsByTagName('img')[0];

    if (!imgElement) {
        console.error('No <img> tags found in the document.');
        return;
    }

    // Create a new canvas element
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set the canvas size to the image size
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    // Draw the existing image onto the canvas
    context.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

    // Convert the canvas to a data URL
    const dataURL = canvas.toDataURL('image/png');

    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'downloaded-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('Image downloaded successfully.');
}

//downloadFirstImage();

})();