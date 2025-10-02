// ==UserScript==
// @name         Update helper
// @namespace    http://tampermonkey.net/
// @version      2024-09-16
// @description  try to take over the world!
// @author       You
// @match        https://www.kickstarter.com/projects/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kickstarter.com
// @grant        none
// ==/UserScript==


(function () {
    'use strict';

    // INDEXEDDB
    let db;
    const dbName = 'campaignDB';
    const imageStore = 'images';
    const SIDEBAR_CAMPAIGN_NAME_PATH = '#sidebar-nav > div > div.flex.flex-column.kds-gap-y-04.kds-p-04.kds-mb-02 > a > h2';

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            request.onerror = (event) => reject('Error opening IndexedDB');
            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
            request.onupgradeneeded = (event) => {
                db = event.target.result;

                // Create Images store
                if (!db.objectStoreNames.contains(imageStore)) {
                    const imageObjectStore = db.createObjectStore(imageStore, {keyPath: 'id'});
                    imageObjectStore.createIndex('promoId', 'promoId', {unique: false});
                    imageObjectStore.createIndex('campaignId', 'campaignId', {unique: false});
                }
            };
        });
    }

    async function getImageById(imageId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([imageStore], 'readonly');
            const store = transaction.objectStore(imageStore);
            const request = store.get(imageId);
            request.onsuccess = (event) => resolve(event.target.result ? DBImage.fromJson(event.target.result) : event.target.result);
            request.onerror = (event) => reject('Error fetching image by id');
        });
    }

    async function insertImage(image) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([imageStore], 'readwrite');
            const store = transaction.objectStore(imageStore);
            const request = store.add(image);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject('Error inserting image');
        });
    }

    async function updateImage(image) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([imageStore], 'readwrite');
            const store = transaction.objectStore(imageStore);
            const request = store.put(image);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject('Error updating image');
        });
    }

    async function deleteImage(imageId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([imageStore], 'readwrite');
            const store = transaction.objectStore(imageStore);
            const request = store.delete(imageId);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject('Error deleting image');
        });
    }

    async function initializeDB() {
        await openDB();
    }

    // All data should be written to persistent storage directly, then rendered
    // We should not use rendered data to write to persistent storage
    // DATASTORE METHODS ================================================================================

    // UTILS
    function generateUniqSerial() {
        return 'xxxx-xxxx-xxx-xxxx'.replace(/[x]/g, (c) => {
            const r = Math.floor(Math.random() * 16);
            return r.toString(16);
        });
    }

    function stringFromDate(date) {
        return date.getFullYear()
                   .toString()
                   .padStart(4, '0') + '-' + (date.getMonth() + 1).toString()
                                                                  .padStart(2, '0') + '-' + date.getDate()
                                                                                                .toString()
                                                                                                .padStart(2, '0');
    }

    function dateFromString(dateString) {
        const [year, month, day] = dateString.split('-')
                                             .map(Number);
        return new Date(year, month - 1, day); // Month is 0-based in JavaScript Date object
    }

    // MODELS
    class Campaign {
        constructor(id = generateUniqSerial(),
                    campaignName = "",
                    startDate = "",
                    endDate = "",
                    scale = "",
                    campaignUrl = "",
                    campaignUpdateUrl = "",
                    startUpdateText = "",
                    startUpdateTitle = "",
                    startImageId = "",
                    endUpdateText = "",
                    endUpdateTitle = "",
                    endImageId = "",
                    promoSchedule = []) {
            this.id = id;
            this.campaignName = campaignName;
            this.startDate = startDate;
            this.endDate = endDate;
            this.scale = scale;
            this.campaignUrl = campaignUrl;
            this.campaignUpdateUrl = campaignUpdateUrl;
            this.startUpdateText = startUpdateText;
            this.startUpdateTitle = startUpdateTitle;
            this.startImageId = startImageId;
            this.endUpdateText = endUpdateText;
            this.endUpdateTitle = endUpdateTitle;
            this.endImageId = endImageId;
            this.promoSchedule = promoSchedule;
        }

        static fromJson(obj) {
            let array = obj.promoSchedule ? obj.promoSchedule : [];
            return new Campaign(obj.id,
                                obj.campaignName,
                                obj.startDate,
                                obj.endDate,
                                obj.scale,
                                obj.campaignUrl,
                                obj.campaignUpdateUrl,
                                obj.startUpdateText,
                                obj.startUpdateTitle,
                                obj.startImageId,
                                obj.endUpdateText,
                                obj.endUpdateTitle,
                                obj.endImageId,
                                array.map(item => Promo.fromJson(item))
            );
        }
    }

    class Promo {
        constructor(id = generateUniqSerial(),
                    parentId = "",
                    campaignName = "",
                    scale = "",
                    campaignUpdateUrl = "",
                    publishDate = "",
                    promoText = "",
                    promoTitle = "",
                    promoImageId = "",
                    isComplete = false) {
            this.id = id;
            this.parentId = parentId;
            this.campaignName = campaignName;
            this.scale = scale;
            this.campaignUpdateUrl = campaignUpdateUrl;
            this.publishDate = publishDate;
            this.promoText = promoText;
            this.promoTitle = promoTitle;
            this.promoImageId = promoImageId;
            this.isComplete = isComplete;
        }

        static fromJson(obj) {
            return new Promo(obj.id,
                             obj.parentId,
                             obj.campaignName,
                             obj.scale,
                             obj.campaignUpdateUrl,
                             obj.publishDate,
                             obj.promoText,
                             obj.promoTitle,
                             obj.promoImageId,
                             obj.isComplete,
            )
        }
    }

    class DBImage {
        constructor(id = generateUniqSerial(),
                    blob,
        ) {
            this.id = id;
            this.blob = blob;
        }

        static fromJson(obj) {
            return new DBImage(obj.id,
                               obj.blob,
            )
        }
    }

    // This should run as you interact with inputs
    function setPendingCampaign(campaign) {
        localStorage.setItem('campaign', JSON.stringify(campaign));
    }

    function getPendingCampaign() {
        const campaign = localStorage.getItem('campaign') || JSON.stringify(new Campaign());
        return Campaign.fromJson(JSON.parse(campaign));
    }

    function setPendingUpdate(promo) {
        localStorage.setItem('pendingUpdate', promo ? JSON.stringify(promo) : promo);
    }

    function getPendingUpdate() {
        const promo = localStorage.getItem('pendingUpdate') || "";
        return promo ? Promo.fromJson(JSON.parse(promo)) : promo;
    }

    function setCampaigns(campaigns) {
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
    }

    function getCampaigns() {
        const campaigns = localStorage.getItem('campaigns');
        let array = campaigns ? JSON.parse(campaigns) : [];
        return array.map(item => Campaign.fromJson(item));
    }

    // Export Data as JSON file
    function exportData() {
        const campaigns = getCampaigns();
        const blob = new Blob([JSON.stringify(campaigns, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'campaigns.json';
        a.click();
    }

    // Import Data from JSON file
    function importData(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const campaigns = JSON.parse(e.target.result);
            setCampaigns(campaigns);
            startup();
        };
        reader.readAsText(file);
    }

    // This takes all the UI data and saves it to the list of campaigns
    // This runs when you click save
    // when you create a schedule
    // when you delete a promo
    // when you
    function saveCampaign(pendingCampaign = getPendingCampaign()) {
        const campaigns = getCampaigns(); // Load all campaigns from localStorage
        if (pendingCampaign.campaignUpdateUrl === "") {
            alert("No campaign update URL, fix then save");
            return;
        }
        if (pendingCampaign.campaignUrl === "") {
            alert("No campaign URL, fix then save");
            return;
        }
        if (pendingCampaign.campaignName === "") {
            alert("No campaign name, fix then save");
            return;
        }
        // Find the existing campaign by campaignUrl
        const existingCampaignIndex = campaigns.findIndex(campaign => campaign.id === pendingCampaign.id);

        if (existingCampaignIndex !== -1) {
            // Update the existing campaign
            campaigns[existingCampaignIndex] = pendingCampaign;
        } else {
            // If no existing campaign is found, push the new one
            campaigns.push(pendingCampaign);
        }

        // Save campaigns back to localStorage
        setCampaigns(campaigns);
        renderCampaignList(getCampaigns()); // Re-render the campaign list
        toast();
    }

    // This runs only when interacting with the Campaign list UI
    function removeCampaign(campaign) {
        let campaigns = getCampaigns();
        let pendingCampaign = getPendingCampaign();
        campaigns = campaigns.filter(c => c.id !== campaign.id);
        if (campaign.startImageId) {
            deleteImage(campaign.startImageId);
        }
        if (campaign.endImageId) {
            deleteImage(campaign.endImageId);
        }
        setCampaigns(campaigns)
        if (pendingCampaign.id === campaign.id) {
            setPendingCampaign(new Campaign());
        }
        renderCampaignList(campaigns);
        renderPendingCampaign(getPendingCampaign());
    }

    function purge() {
        localStorage.setItem('campaign', "");
        localStorage.setItem('campaigns', []);
    }

    // HTML CREATION =======================================================================================

    // UTILS
    function node(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const nNodes = template.content.childNodes.length;
        if (nNodes !== 1) {
            throw new Error(`html parameter must represent a single node; got ${nNodes}. ` + 'Note that leading or trailing spaces around an element in your ' + 'HTML, like " <img/> ", get parsed as text nodes neighbouring ' + 'the element; call .trim() on your input to avoid this.');
        }
        return template.content.firstChild;
    }

    function nodes(html) {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content.childNodes;
    }

    // HTML BUILDERS
    function createTextRowContent(rowText) {
        return `<p style="flex-grow: 1; margin: 0px; align-content: center; font-size: 1.4rem;">${rowText}</p>`
    }

    function createCheckboxRowContent(label, isChecked, metadataObj) {
        let checkText = isChecked ? "checked" : "";
        return `<input type="checkbox" ${checkText} data-metadata="${encodeURIComponent(JSON.stringify(metadataObj))}"><label>${label}</label>`
    }

    function createDateRowContent(label, date) {
        return `<input type="date" value="${date}">${createTextRowContent(label)}`
    }

    function createRowItem(rowContent, onRowClick, onDeleteClick) {

        let removeElement = onDeleteClick ? `<button style="border-radius: 4px; background: #ee4646; height: 25px; width: 25px; min-width:25px; min-height:25px; color: white">✕</button>` : "";

        let maybePointer = onRowClick ? "cursor: pointer;" : "";

        const div = node(`
                <div style="${maybePointer} padding: 5px; background: #f6f6f6; border-radius: 4px; gap: 4px; display: flex; flex-direction: row; align-items: center">
                    <div style="display: flex; flex-direction: row; flex-grow: 1; align-items:center; align-content: center; gap: 4px;">${rowContent}</div>
                    ${removeElement}
                </div>`);

        if (onRowClick) {
            div.getElementsByTagName("p")[0].addEventListener('click', onRowClick);
        }
        if (onDeleteClick) {
            div.getElementsByTagName("button")[0].addEventListener('click', onDeleteClick);
        }
        return div;
    }

    function createEmptyListMessage(message) {
        return `<p style="margin: 0px; font-size: 13px;">${message}</p>`
    }

    // Rendering should take JSON and make it UI
    // Saving should take UI and make it JSON
    // This should run whenever we:
    // save/add campaigns,
    // remove campaigns,
    // first time we run the app,
    // whenever we import data
    function renderCampaignList(campaigns) {
        const list = document.getElementById('campaignList');
        list.innerHTML = '';
        if (campaigns && campaigns.length > 0) {
            campaigns.forEach((campaign) => {
                let rowContent = createTextRowContent(campaign.campaignName);
                let row = createRowItem(rowContent, () => {
                    setPendingCampaign(campaign);
                    renderPendingCampaign(campaign);
                }, () => removeCampaign(campaign))
                list.appendChild(row);
            });
        } else {
            list.innerHTML = createEmptyListMessage("No campaigns available");
        }
    }

    // This should render whenever a new campaign is loaded, whenever we are building a new campaign
    // the default state is to build a new campaign so it should run at startup
    function renderPromoteOn(campaign) {
        const campaigns = getCampaigns();
        const promoteOn = document.getElementById('promoteOn');
        promoteOn.innerHTML = '';
        if (campaigns.length > 0) {
            campaigns.forEach((item) => {
                let checkBox = createCheckboxRowContent(`${item.campaignName} - ${item.scale}`,
                                                        campaign.promoSchedule.some(promo => promo.campaignUpdateUrl === item.campaignUpdateUrl),
                                                        item
                )
                let rowElement = createRowItem(checkBox);
                promoteOn.appendChild(rowElement);
            });
        } else {
            promoteOn.innerHTML = createEmptyListMessage("No campaigns available");
        }
    }

    // This runs at startup
    // Whenever we click an item in the list
    function renderPendingCampaign(campaign) {
        document.getElementById('campaignName').value = campaign.campaignName;
        document.getElementById('startDate').value = campaign.startDate;
        document.getElementById('endDate').value = campaign.endDate;
        document.getElementById('scale').value = campaign.scale;
        document.getElementById('campaignUrl').value = campaign.campaignUrl;
        document.getElementById('campaignUpdateUrl').value = campaign.campaignUpdateUrl;
        document.getElementById('startUpdateText').value = campaign.startUpdateText;
        document.getElementById('startUpdateTitle').value = campaign.startUpdateTitle;
        document.getElementById('endUpdateText').value = campaign.endUpdateText;
        document.getElementById('endUpdateTitle').value = campaign.endUpdateTitle;

        if (campaign.startImageId) {
            getDataTransferForDBImageById(campaign.startImageId).then((dataTransfer) => {
                if (!dataTransfer) {
                    return;
                }
                const fileInput = document.getElementById('startImage');
                fileInput.files = dataTransfer.files;
                console.log(fileInput.files);
                fileInput.dispatchEvent(new Event('change', {bubbles: true}));
            });
        } else {
            document.getElementById('startImage').value = "";
        }
        if (campaign.endImageId) {
            getDataTransferForDBImageById(campaign.endImageId).then((dataTransfer) => {
                if (!dataTransfer) {
                    return;
                }
                const fileInput = document.getElementById('endImage');
                fileInput.files = dataTransfer.files;
                console.log(fileInput.files);
                fileInput.dispatchEvent(new Event('change', {bubbles: true}));
            });
        } else {
            document.getElementById('endImage').value = "";
        }

        renderPromoSchedule(campaign)
        renderPromoteOn(campaign);
    }

    // This renders whenever we select a campaign
    // whenever we remove an item from the promo schedule
    // whenever we create a promo schedule
    function renderPromoSchedule(campaign) {
        const promoSchedule = document.getElementById('promoSchedule');
        promoSchedule.innerHTML = '';
        if (campaign.promoSchedule.length > 0) {
            campaign.promoSchedule.forEach((promo) => {
                if (!promo.isComplete) {
                    let dateElement = createDateRowContent(`${promo.campaignName} - ${promo.scale}`,
                                                           promo.publishDate,
                                                           promo
                    )
                    let rowElement = createRowItem(dateElement, undefined, () => {
                        campaign.promoSchedule = campaign.promoSchedule.filter(item => item !== promo);
                        setPendingCampaign(campaign);
                        saveCampaign();
                        renderPromoSchedule(campaign);
                        renderPendingUpdates();
                    });
                    promoSchedule.appendChild(rowElement);
                }
            });
        } else {
            promoSchedule.innerHTML = createEmptyListMessage("Promo schedule empty");
        }
    }

    function renderPendingUpdates() {
        const campaigns = getCampaigns();
        const pendingUpdatesElement = document.getElementById('pendingUpdates');
        pendingUpdatesElement.innerHTML = '';
        let pendingUpdates = [];
        campaigns.forEach(campaign => {
            let today = new Date();
            campaign.promoSchedule.forEach(promo => {
                if (!promo.isComplete && new Date(promo.publishDate) <= today) {
                    let pendingElement = createDateRowContent(`Promo <strong>${campaign.campaignName}</strong> on <strong>${promo.campaignName}</strong>`,
                                                              promo.publishDate,
                                                              promo
                    );
                    let row = createRowItem(pendingElement, () => {
                        setPendingUpdate(promo);
                        window.location.href = promo.campaignUpdateUrl;
                    }, () => {
                        campaign.promoSchedule = campaign.promoSchedule.filter(item => item !== promo);
                        let pendingCampaign = getPendingCampaign();
                        if (pendingCampaign.id === campaign.id) {
                            setPendingCampaign(campaign);
                            renderPendingCampaign(campaign);
                        }
                        saveCampaign(campaign);
                        renderPendingUpdates()
                    })
                    pendingUpdates.push(row);
                }
            });
        });
        if (pendingUpdates.length > 0) {
            pendingUpdates.forEach(update => {
                pendingUpdatesElement.appendChild(update)
            });
        } else {
            pendingUpdatesElement.innerHTML = createEmptyListMessage("No pending updates");
        }
    }

    function clear() {
        setPendingCampaign(new Campaign());
        renderPendingCampaign(getPendingCampaign());
    }

    // BUSINESS LOGIC ===========================================================================
    // Parse campaign data from the current webpage
    function parseCampaign() {
        let campaignName = document.querySelector(SIDEBAR_CAMPAIGN_NAME_PATH).innerHTML;
        let campaignUrl = window.location.protocol + "//" + window.location.hostname + window.location.pathname;
        let campaignUpdateUrl = campaignUrl + "/posts/freeform/new";

        let campaigns = getCampaigns();
        let alreadyExists = campaigns.some(item => item.campaignUrl === campaignUrl || item.campaignUpdateUrl === campaignUpdateUrl);
        if (alreadyExists) {
            alert("This campaign is already parsed, aborting");
            return;
        }

        let pendingCampaign = getPendingCampaign();

        if (pendingCampaign.campaignName !== "" || pendingCampaign.campaignUrl !== "" || pendingCampaign.campaignUpdateUrl !== "") {
            alert("Campaign name, campaign url, campaign update url must be clear before parsing, aborting");
            return;
        }

        pendingCampaign.campaignName = campaignName;
        pendingCampaign.campaignUrl = campaignUrl;
        pendingCampaign.campaignUpdateUrl = campaignUpdateUrl;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
        renderPendingCampaign(pendingCampaign);
    }

    function getEditorHtml(campaign) {
        let editor = document.querySelector(
            "#project-post-interface > div > form > div > section > div.mb1.type-16 > div > div > div > div");
        let clonedElement = editor.cloneNode(true);
        let allElements = clonedElement.querySelectorAll('*');
        allElements.forEach((node) => {
            if (!['H3', 'H4', 'P', 'I', 'STRONG'].includes(node.tagName)) {
                node.remove();
            } else {
                while (node.attributes.length > 0) {
                    node.removeAttribute(node.attributes[0].name);
                }
            }
        });
        let link = document.createElement("a");
        link.href = campaign.campaignUrl;
        link.innerHTML = campaign.campaignUrl;
        clonedElement.appendChild(link);
        return clonedElement.innerHTML;
    }

    function saveLaunchUpdate() {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.startUpdateText = getEditorHtml(pendingCampaign);
        pendingCampaign.startUpdateTitle = document.getElementById('post-title').value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
        renderPendingCampaign(pendingCampaign);
        // document.querySelector(
        //     "#project-post-interface > div > div > div > div > div.flex.flex1.items-center.justify-end > button:nth-child(3)")
        //         .click();
    }

    function saveEndingUpdate() {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.endUpdateText = getEditorHtml(pendingCampaign);
        pendingCampaign.endUpdateTitle = document.getElementById('post-title').value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
        renderPendingCampaign(pendingCampaign);
        // document.querySelector(
        //     "#project-post-interface > div > div > div > div > div.flex.flex1.items-center.justify-end > button:nth-child(3)")
        //         .click();
    }

    function createPromoSchedule() {
        let pendingCampaign = getPendingCampaign();
        if (!pendingCampaign.campaignUrl) {
            alert("No campaign URL, aborting");
            return;
        }
        if (!pendingCampaign.startDate) {
            alert("Missing start date, aborting");
            return;
        }
        if (!pendingCampaign.endDate) {
            alert("Missing end date, aborting");
            return;
        }
        if (!pendingCampaign.startUpdateTitle) {
            alert("Missing start update title, aborting");
            return;
        }
        if (!pendingCampaign.startUpdateText) {
            alert("Missing start update text, aborting");
            return;
        }
        if (!pendingCampaign.endUpdateTitle) {
            alert("Missing end update title, aborting");
            return;
        }
        if (!pendingCampaign.endUpdateText) {
            alert("Missing end update text, aborting");
            return;
        }

        // Find which campaigns to promote to
        const promoteTo = [];
        const checkboxes = document.querySelectorAll('#promoteOn input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                const campaign = decodeURIComponent(checkbox.getAttribute('data-metadata'));
                promoteTo.push(Campaign.fromJson(JSON.parse(campaign)));
            }
        });
        if (promoteTo.length === 0) {
            alert("No campaigns selected for promos, aborting");
            return;
        }

        // Build promo schedule
        const promos = [];
        const maxPromosPerDay = 5;
        const startDate = dateFromString(pendingCampaign.startDate);
        const endDate = dateFromString(pendingCampaign.endDate);

        // Launch promos
        let promoIndex = 0;
        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1); // Start from the day after the startDate
        while (promoIndex < promoteTo.length) {
            const dailyPromos = [];
            for (let i = 0; i < maxPromosPerDay && promoIndex < promoteTo.length; i++) {
                dailyPromos.push(new Promo(generateUniqSerial(),
                                           pendingCampaign.id,
                                           promoteTo[promoIndex].campaignName,
                                           promoteTo[promoIndex].scale,
                                           promoteTo[promoIndex].campaignUpdateUrl,
                                           stringFromDate(currentDate),
                                           pendingCampaign.startUpdateText,
                                           pendingCampaign.startUpdateTitle,
                                           pendingCampaign.startImageId,
                                           false
                ));
                promoIndex++;
            }
            promos.push(...dailyPromos);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Ending promos
        promoIndex = 0; // Reset promoIndex to distribute the remaining promos
        currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() - 1); // Start from the day before the endDate
        while (promoIndex < promoteTo.length) {
            const dailyPromos = [];
            for (let i = 0; i < maxPromosPerDay && promoIndex < promoteTo.length; i++) {
                dailyPromos.push(new Promo(generateUniqSerial(),
                                           pendingCampaign.id,
                                           promoteTo[promoIndex].campaignName,
                                           promoteTo[promoIndex].scale,
                                           promoteTo[promoIndex].campaignUpdateUrl,
                                           stringFromDate(currentDate),
                                           pendingCampaign.endUpdateText,
                                           pendingCampaign.endUpdateTitle,
                                           pendingCampaign.endImageId,
                                           false
                ));
                promoIndex++;
            }
            promos.push(...dailyPromos);
            currentDate.setDate(currentDate.getDate() - 1); // Move to the previous day
        }

        // Save promo schedule to the current campaign
        pendingCampaign.promoSchedule = promos;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
        renderPromoSchedule(pendingCampaign);
        renderPendingUpdates();
    }

    function fillPromo() {
        const promo = getPendingUpdate();
        if (promo) {
            let targetElement = document.querySelector(
                "#project-post-interface > div > form > div > section > div.mb1.type-16 > div > div > div > div");
            const pasteEvent = new ClipboardEvent('paste', {
                clipboardData: new DataTransfer()
            });
            pasteEvent.clipboardData.setData('text/html', promo.promoText);
            targetElement.dispatchEvent(pasteEvent);
            pasteImageFromDB(promo.promoImageId).then(r => console.log("pasted"));
            let titleElement = document.querySelector("#post-title");
            let lastValue = titleElement.value;
            titleElement.value = promo.promoTitle;
            let event = new Event('input', {bubbles: true});
            event.simulated = true;
            let tracker = titleElement._valueTracker;
            if (tracker) {
                tracker.setValue(lastValue);
            }
            titleElement.dispatchEvent(event);

            // document.querySelector(
            //     "#project-post-interface > div > div > div > div > div.flex.flex1.items-center.justify-end > button:nth-child(3)")
            //         .click();
        }
    }

    function publishPromo() {
        const campaigns = getCampaigns();
        const refPromo = getPendingUpdate();
        let promo = campaigns.flatMap(c => c.promoSchedule).find(p => p.id === refPromo.id);
        if (promo) {
            promo.isComplete = true;
            let pendingCampaign = getPendingCampaign();
            if (promo.parentId === pendingCampaign.id) {
                pendingCampaign = campaigns.find(campaign => campaign.id === pendingCampaign.id);
                setPendingCampaign(pendingCampaign);
                renderPendingCampaign(pendingCampaign);
            }
            setCampaigns(campaigns);
            renderPendingUpdates();
            setPendingUpdate("");
            alert("published promo");
            // document.querySelector(
            //     "#project-post-interface > div > div > div > div > div.flex.flex1.items-center.justify-end > button.ksr-button.bttn.keyboard-focusable.bttn-medium.bttn-primary.theme--create.flex1.max-w40.js-disable-while-uploading.fill-bttn-icon.hover-fill-bttn-icon")
            //         .click();
        }
    }

    function startup() {
        let pendingCampaign = getPendingCampaign();
        if (!pendingCampaign) {
            setPendingCampaign(new Campaign());
        }
        renderCampaignList(getCampaigns());
        renderPendingCampaign(getPendingCampaign());
        renderPendingUpdates();
    }

    // UI ===================================================================================================
    const container = node(`
    <div id="container" style="position: fixed; top: 0px; right: 0px; background: white; z-index: 9999; border: #e7e7e7 1px solid; border-radius: 4px; min-width:340px; max-width: 400px; cursor: move; display: flex; flex-direction: column; gap: 8px; padding: 8px; max-height: 88vh; overflow-y: scroll;">
        <div style="display: flex; flex-direction: row; gap:4px;">
            <button style="flex-grow: 1; background-color: #04AA6D; border: black 1px; color: white; padding: 8px 16px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 4px;" id="exportDataBtn">Export Data</button>
            <button style="flex-grow: 1; background-color: #04AA6D; border: black 1px; color: white; padding: 8px 16px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 4px;" id="importDataBtn">Import Data</button>
            <input type="file" id="hidden-import" style="display: none;">
        </div>
        <p style="margin:0px;" >My Campaigns</p>
        <div id="campaignList" style="display:flex; flex-direction:column; gap: 4px; border: #f6f6f6 1px solid; border-radius: 4px; padding: 4px;"></div>

        <div style="display: flex; flex-direction: row; align-items: center; gap: 4px;">
            <p style="margin:0px; flex-grow: 1;" >Campaign Form</p>
            <button style="background-color: #04AA6D; border: black 1px; color: white; padding: 8px 16px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 4px;" id="clearBtn">New</button>
            <button style="background-color: #04AA6D; border: black 1px; color: white; padding: 8px 16px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 4px;" id="parseCampaignBtn">Parse Campaign</button>
        </div>
        <input type="text" id="campaignName" placeholder="Campaign Name">
        <input type="text" id="scale" placeholder="Scale">
        <input type="text" id="campaignUrl" placeholder="Campaign URL">
        <input type="text" id="campaignUpdateUrl" placeholder="Campaign Update URL">

        <div style="display: flex; flex-direction: row; gap: 4px;">
            <p style="margin:0px;" >Start Date: <input type="date" id="startDate"></p>
            <p style="margin:0px;" >End Date: <input type="date" id="endDate"></p>
        </div>

        <div style="display: flex; flex-direction: row; gap:4px;">
            <div style="gap: 4px; display: flex; flex-grow: 1; flex-direction: column;">
            <input id="startUpdateTitle" placeholder="Launch Title" type="text">
            <textarea id="startUpdateText" placeholder="Launch Update"></textarea>
            <input type="file" id="startImage" accept="image/*" />
            </div>
            <button style="width:90px; background-color: #04AA6D; border: black 1px; color: white; padding: 8px 16px; text-align: center; text-decoration: none; display: inline-block; font-size: 12px; border-radius: 4px;" id="saveLaunchUpdateBtn">Save Launch Update</button>
        </div>
        <div style="display: flex; flex-direction: row; gap:4px;">
            <div style="gap: 4px; display: flex; flex-grow: 1; flex-direction: column;">
            <input id="endUpdateTitle" placeholder="Ending Title" type="text">
            <textarea id="endUpdateText" placeholder="Ending Update"></textarea>
            <input type="file" id="endImage" accept="image/*" />
            </div>
            <button style="width:90px; background-color: #04AA6D; border: black 1px; color: white; padding: 8px 16px; text-align: center; text-decoration: none; display: inline-block; font-size: 12px; border-radius: 4px;" id="saveEndingUpdateBtn">Save Ending Update</button>
        </div>
        <p style="margin:0px;" >Promo Schedule</p>
        <div id="promoSchedule" style="display:flex; flex-direction:column; gap: 4px; border: #f6f6f6 1px solid; border-radius: 4px; padding: 4px;"><p style="margin: 0px; font-size: 13px;">No campaign selected</p></div>
        <p style="margin:0px;" >Select campaigns to promote on</p>
        <div id="promoteOn" style="display:flex; flex-direction:column; gap: 4px; border: #f6f6f6 1px solid; border-radius: 4px; padding: 4px;"><p style="margin: 0px; font-size: 13px;">No campaign selected</p></div>
        <button style="flex-grow: 1; background-color: #04AA6D; border: black 1px; color: white; padding: 8px 16px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 4px;" id="createPromoScheduleBtn">Create Promo Schedule</button>
        <button style="flex-grow: 1; background-color: #04AA6D; border: black 1px; color: white; padding: 8px 16px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 4px;" id="saveCampaignBtn">Save Campaign</button>

        <p style="margin:0px;" >Pending Updates</p>
        <div id="pendingUpdates" style="display:flex; flex-direction:column; gap: 4px; border: #f6f6f6 1px solid; border-radius: 4px; padding: 4px;"><p style="margin: 0px; font-size: 13px;">No pending updates</p></div>
        <button style="flex-grow: 1; background-color: #04AA6D; border: black 1px; color: white; padding: 8px 16px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 4px;" id="fillPromoBtn">Fill Promo</button>
        <button style="flex-grow: 1; background-color: #04AA6D; border: black 1px; color: white; padding: 8px 16px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 4px;" id="publishPromoBtn">Publish Promo</button>
        <div id="toast" style="visibility: hidden; position: sticky; bottom:0; line-height: 20px; height: 20px; background: #55f61f; border-radius: 10px; width: 40%; left: 30%; text-align: center; align-content: center;">Saved</div>
    </div>
    `);
    document.body.appendChild(container);

    // CLICK LISTENERS
    document.getElementById('saveCampaignBtn').addEventListener('click', () => {
        saveCampaign()
    });
    document.getElementById('parseCampaignBtn').addEventListener('click', parseCampaign);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', function() {
        // Trigger the hidden file input's click event
        document.getElementById('hidden-import').click();
    });
    document.getElementById('hidden-import').addEventListener('change', importData);
    document.getElementById('createPromoScheduleBtn').addEventListener('click', createPromoSchedule);
    document.getElementById('fillPromoBtn').addEventListener('click', fillPromo);
    document.getElementById('publishPromoBtn').addEventListener('click', publishPromo);
    document.getElementById('saveLaunchUpdateBtn').addEventListener('click', saveLaunchUpdate);
    document.getElementById('saveEndingUpdateBtn').addEventListener('click', saveEndingUpdate);
    document.getElementById('clearBtn').addEventListener('click', clear);
    // AUTOSAVE LISTENERS
    document.getElementById('campaignName').addEventListener('change', (e) => {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.campaignName = e.target.value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
    });
    document.getElementById('startDate').addEventListener('change', (e) => {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.startDate = e.target.value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
    });
    document.getElementById('endDate').addEventListener('change', (e) => {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.endDate = e.target.value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
    });
    document.getElementById('scale').addEventListener('change', (e) => {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.scale = e.target.value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
    });
    document.getElementById('campaignUrl').addEventListener('change', (e) => {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.campaignUrl = e.target.value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
    });
    document.getElementById('campaignUpdateUrl').addEventListener('change', (e) => {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.campaignUpdateUrl = e.target.value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
    });
    document.getElementById('startUpdateText').addEventListener('change', (e) => {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.startUpdateText = e.target.value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
    });
    document.getElementById('startUpdateTitle').addEventListener('change', (e) => {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.startUpdateTitle = e.target.value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
    });
    document.getElementById('endUpdateText').addEventListener('change', (e) => {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.endUpdateText = e.target.value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
    });
    document.getElementById('endUpdateTitle').addEventListener('change', (e) => {
        let pendingCampaign = getPendingCampaign();
        pendingCampaign.endUpdateTitle = e.target.value;
        setPendingCampaign(pendingCampaign);
        saveCampaign();
    });

    // RESIZE
    const resizeThreshold = 10; // Pixel threshold to detect lower-right corner
    let isDragging = false;
    let isResizing = false;
    let startX, startY, initialLeft, initialTop;
    let startWidth, startHeight;
    let initialMouseX, initialMouseY;
    container.addEventListener('mousemove', function (e) {
        const rect = container.getBoundingClientRect();

        // Check if mouse is near lower-right corner
        const isNearRightEdge = e.clientX >= rect.right - resizeThreshold;
        const isNearBottomEdge = e.clientY >= rect.bottom - resizeThreshold;

        if (isNearRightEdge && isNearBottomEdge) {
            container.style.cursor = 'nwse-resize'; // Set resize cursor
        } else {
            container.style.cursor = 'move'; // Set move cursor
        }
    });
    container.addEventListener('mousedown', function (e) {

        if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
            return;
        }
        const rect = container.getBoundingClientRect();

        // Determine if we're resizing based on the cursor position
        const isNearRightEdge = e.clientX >= rect.right - resizeThreshold;
        const isNearBottomEdge = e.clientY >= rect.bottom - resizeThreshold;

        if (isNearRightEdge && isNearBottomEdge) {
            // Resizing
            isResizing = true;
            disableTextSelection();
            startWidth = parseInt(window.getComputedStyle(container).width, 10);
            startHeight = parseInt(window.getComputedStyle(container).height, 10);
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;

            // Disable scrolling while resizing
            container.style.overflowY = 'hidden';

            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        } else {
            // Moving
            isDragging = true;
            disableTextSelection();
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseInt(window.getComputedStyle(container).left, 10);
            initialTop = parseInt(window.getComputedStyle(container).top, 10);

            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        }
    });

    function drag(e) {
        if (isDragging) {
            const newLeft = initialLeft + (e.clientX - startX);
            const newTop = initialTop + (e.clientY - startY);
            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
        }
    }

    function stopDrag() {
        isDragging = false;
        enableTextSelection();
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }

    function resize(e) {
        if (isResizing) {
            const newWidth = startWidth + (e.clientX - initialMouseX);
            const newHeight = startHeight + (e.clientY - initialMouseY);
            container.style.width = newWidth + 'px';
            container.style.height = newHeight + 'px';
        }
    }

    function stopResize() {
        isResizing = false;
        enableTextSelection();
        // Re-enable scrolling after resizing
        container.style.overflowY = 'scroll';

        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }

    function disableTextSelection() {
        document.body.style.userSelect = 'none'; // Disable text selection globally
    }

    function enableTextSelection() {
        document.body.style.userSelect = ''; // Re-enable text selection
    }

    // TOAST
    let toastTimeout;

    function toast() {
        const toast = document.getElementById('toast');

        // Clear any previous timeout to prevent multiple toasts
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }

        // Set the message and display the toast
        toast.style.visibility = 'visible';

        // Hide the toast after the specified duration
        toastTimeout = setTimeout(() => {
            toast.style.visibility = 'hidden';
        }, 3000);
    }

    async function pasteImageFromDB(imageId) {
        try {
            const dbImage = await getImageById(imageId);
            if (dbImage && dbImage.blob) {
                const file = new File([dbImage.blob], 'pasted-image.png', {type: dbImage.blob.type});
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                const pasteEvent = new ClipboardEvent('paste', {
                    clipboardData: dataTransfer, bubbles: true, cancelable: true,
                });
                const updateBox = document.querySelector(
                    "#project-post-interface > div > form > div > section > div.mb1.type-16 > div > div > div > div");
                updateBox.dispatchEvent(pasteEvent);
            } else {
                console.error('Image not found in the database or blob missing');
            }
        } catch (error) {
            console.error('Error fetching or pasting image from DB:', error);
        }
    }

    function getDataTransferForDBImageById(imageId) {
        return new Promise((resolve, reject) => {
            getImageById(imageId)
                .then(dbImage => {
                    if (dbImage && dbImage.blob) {
                        const file = new File([dbImage.blob], 'pasted-image.png', {type: dbImage.blob.type});
                        let dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        resolve(dataTransfer);
                    } else {
                        console.error('Image not found in the database or blob missing');
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching or pasting image from DB:', error);
                    reject(error);
                });
        });
    }

    document.getElementById('endImage').addEventListener('change', async function (event) {
        const file = event.target.files[0];
        if (file) {
            let pendingCampaign = getPendingCampaign();
            const image = {
                id: generateUniqSerial(),
                blob: file
            };
            pendingCampaign.endImageId = image.id;
            setPendingCampaign(pendingCampaign);
            saveCampaign(pendingCampaign);
            try {
                // Insert the image into IndexedDB
                await insertImage(image);
            } catch (error) {
                console.error(error);
            }
        } else {
            console.error('No file selected');
        }
    });

    document.getElementById('startImage').addEventListener('change', async function (event) {
        const file = event.target.files[0];
        if (file) {
            try {
                let pendingCampaign = getPendingCampaign();
                if (!pendingCampaign.startImageId) {
                    const image = {id: generateUniqSerial(), blob: file};
                    pendingCampaign.startImageId = image.id;
                    await insertImage(image);
                } else {
                    const image = {id: pendingCampaign.startImageId, blob: file};
                    await updateImage(image);
                }
                setPendingCampaign(pendingCampaign);
                saveCampaign(pendingCampaign);
            } catch (error) {
                console.error(error);
            }
        } else {
            console.error('No file selected');
        }
    });

    // Load initial campaign list and pending updates
    initializeDB().then(() => {
        startup();
    });

})();


