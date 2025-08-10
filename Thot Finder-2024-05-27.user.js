// ==UserScript==
// @name         Thot Finder
// @namespace    http://tampermonkey.net/
// @version      2024-05-27
// @description  try to take over the world!
// @author       You
// @match        https://onlyfans.com/*
// @match        https://fansly.com/*
// @match        https://fanplace.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=onlyfans.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to get the text from a specific element
    function getLastPathSegment() {
        const url = new URL(window.location.href);
        const urlPath = url.pathname;

        // Remove the leading slash and split the pathname by '/'
        const parts = urlPath.replace(/^\//, '').split('/');

        // Get the first part of the path
        const firstPart = parts[0];
        // Return last segment if it exists, otherwise null
        return (firstPart !== "") ? firstPart.replace("vip","") : null;
    }

    function shrinkIframes(iframes) {
        iframes.forEach(iframe => {
            iframe.style.display = '10px';
            iframe.style.height = '10px';
        });
    }

    function resetIframes(iframes) {
        iframes.forEach(iframe => {
            iframe.style.width = '32%'; // Original width
            iframe.style.height = '30vh'; // Original height
        });
    }

    function createUi(model) {
        // Create a container for the iframes
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0px';
        container.style.left = '0px';
        container.style.width = '100%';
        container.style.height = '99vh';
        container.style.overflow = 'auto';
        container.style.zIndex = '10000';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.boxSizing = 'border-box';
        container.style.padding = "10px";

        // Define the number of iframes in each row
        const rowConfig = [2, 2, 3];

        let baseUrls = [
            `https://erothots.co/videos/${model}`,
            `https://leakedzone.com/search?search=${model}`,
            `https://www.camhub.cc/search/${model}/`,
            `https://www.erome.com/search?q=${model}`,
            `https://coomer.su/onlyfans/user/${model}`,
            `https://viralpornhub.com/search/${model}/`,
            `https://fapello.com/search/${model}/`
        ];


        // Create and append iframes based on row configuration
        let iframeIndex = 0;
        rowConfig.forEach((count, rowIndex) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.width = '100%';

            for (let i = 0; i < count; i++) {
                const cell = document.createElement('div');
                cell.style.width = "32%";
                cell.style.height = "30vh"; // Adjust height as needed
                cell.style.transition = 'all 0.5s ease'; // Smooth transition for resizing
                cell.className = "cell";

                const link = document.createElement('a');
                link.href = baseUrls[iframeIndex];
                link.textContent = baseUrls[iframeIndex];
                link.style.display = "inline";
                link.style.fontSize = "14px";
                link.style.height = "15px";
                link.target = '_blank'; // Open in a new tab
                cell.appendChild(link);

                //if (!(baseUrls[iframeIndex].includes("viralpornhub") || baseUrls[iframeIndex].includes("thothub"))) {
                    const iframe = document.createElement('iframe');
                    iframe.src = baseUrls[iframeIndex];
                    iframe.style.width = "100%";
                    iframe.style.height = 'calc(100% - 15px)';
                    iframe.style.border = "3px solid black";

                    // Event listeners for hover effects
                    cell.addEventListener('mouseenter', () => {
                        shrinkIframes(container.querySelectorAll('.cell')); // Reset all first to avoid overlap
                        cell.style.width = '90%'; // Expand width on hover
                        cell.style.height = '90vh'; // Expand height on hover
                    });

                    cell.addEventListener('mouseleave', () => {
                        resetIframes(container.querySelectorAll('.cell'));
                    });

                    cell.appendChild(iframe);
                //}
                row.appendChild(cell);
                iframeIndex++;
            }

            container.appendChild(row);
        });

        // Append the container to the body
        document.body.appendChild(container);
    }

    const lastPathSegment = getLastPathSegment();

    // Use the last path segment to create the UI, if it exists
    if (lastPathSegment){
        createUi(lastPathSegment);
    } else {
        console.error('No meaningful path segment found in URL.');
    }
})();