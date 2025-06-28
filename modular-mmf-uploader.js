// ==UserScript==
// @name         MMF Upload Helper
// @namespace    http://tampermonkey.net/
// @version      2024-12-01
// @description  Automated helper for MyMiniFactory uploads with extensible architecture
// @author       You
// @match        https://www.myminifactory.com/*
// @match        https://cults3d.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=myminifactory.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    class PlatformDefaults {
        constructor(price, tags, descriptionTemplate, formUrl) {
            this.price = price;
            this.tags = tags;
            this.descriptionTemplate = descriptionTemplate;
            this.formUrl = formUrl;
        }
    }

    class PlatformDefaultsFactory {
        static getPlaformDefaults() {
            if (window.location.href.includes("myminifactory.com")) {
                return new PlatformDefaults(
                    "9.00",
                    '3d, model, models, 3dmodel, 3dmodels, print, prints, 3dprint, 3dprints, printable, 3dprintable, stl, file, files, stlfile, stlfiles, stlmodel, stlmodels, fantasy, models, dnd, d&d, dnd5e, dungeon, dragons, miniature, dndminiature, rpg, ttrpg, tabletop, game, gaming, tabletopminiatures, boardgame, collector, collectible, hobby, paint, painting, minis, sculpt, zbrush, woman, women, female, females, girl, girls, lady, ladies, heroine, heroines, attractive, sexy, hot, busty, curvy, seductive, alluring, beautiful, pretty, form2, form3, formlabs, mars3, mars4, saturn2, saturn3, elegoo, photonmono, mono m5s, anycubic, sonicmini8k, phrozen, halotmage, creality, x10, epax, sl1s, prusa, x1c, p1p, bambulab, presupported, presupports, print-ready',
                    `<p>Item description:<br>Ready to print pre-supported models</p>
<p><br>Pack contains:</p>
<p>1 x __CHARACTER_NAME__ - __CAMPAIGN_NAME__</p>
<p>Features:<br>- Highly detailed miniatures<br>- Pre-supported and ready to print files<br>- Miniature has been test printed and quality verified<br>- Designed for __SCALE__</p>
<p>Files are provided in three forms:<br>- Pre-supported Lychee files<br>- Pre-supported STL files<br>- Unsupported STL files<br></p>
<p>IMPORTANT: Only download files from __BRAND__'s official distribution channels. Files from unofficial sources don't support the creators, don't include technical support, and won't provide access to updates. If you're on the Merchant Tier, remember it only allows the sale of physical prints. To ensure you're getting the highest quality, always use official files, only then can __BRAND__ stand behind their products.</p>
<p>RETURN POLICY: Due to the nature of digital goods, and in adherence to MyMiniFactory's <a href="https://myminifactory.com/pages/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>, we do not accept returns. If you have any questions about the product, please contact us before making a purchase and we'll do our best to help you.</p>`,
                    "https://www.myminifactory.com/upload/object"
                )
            } else if (window.location.href.includes("cults3d.com")) {
                return new PlatformDefaults(
                    "11.00",
                    '3d model, models, 3dmodel, 3dmodels, print, prints, 3dprint, 3dprints, printable, 3dprintable, stl, file, files, stlfile, stlfiles, stlmodel, stlmodels, fantasy, models, dnd, d&d, dnd5e, dungeon, dragons, miniature, dndminiature, rpg, ttrpg, tabletop, game, gaming, tabletopminiatures, boardgame, collector, collectible, hobby, paint, painting, minis, sculpt, zbrush, woman, women, female, females, girl, girls, lady, ladies, heroine, heroines, attractive, sexy, hot, busty, curvy, seductive, alluring, beautiful, pretty, presupported, presupports, print-ready',
                    `Item description:
Ready to print pre-supported models

*Pack contains:*

1 x __CHARACTER_NAME__ - __CAMPAIGN_NAME__

*Features:*
- Highly detailed miniatures
- Pre-supported and ready to print files
- Miniature has been test printed and quality verified
- Designed for __SCALE__

*Files are provided in three forms:*
- Pre-supported Lychee files
- Pre-supported STL files
- Unsupported STL files

*IMPORTANT*: Only download files from __BRAND__'s official distribution channels. Files from unofficial sources don't support the creators, don't include technical support, and won't provide access to updates. If you're on the Merchant Tier, remember it only allows the sale of physical prints. To ensure you're getting the highest quality, always use official files, only then can __BRAND__ stand behind their products.

*RETURN POLICY*: Due to the nature of digital goods we do not accept returns. If you have any questions about the product, please contact us before making a purchase and we'll do our best to help you.`,
                    "https://cults3d.com/en/creations/new"
                )
            }
        }
    }

    // ===== CORE INTERFACES =====

    // Repository Interface
    class IRepository {
        async save(appState) {
            throw new Error('Not implemented');
        }

        async load() {
            throw new Error('Not implemented');
        }

        async clear() {
            throw new Error('Not implemented');
        }
    }

    // LocalStorage Repository Implementation
    class LocalStorageRepository extends IRepository {
        constructor() {
            super();
            this.storageKey = 'mmfData';
        }

        async save(appState) {
            localStorage.setItem(this.storageKey, JSON.stringify(appState));
        }

        async load() {
            const appState = localStorage.getItem(this.storageKey);
            return appState ? JSON.parse(appState) : null;
        }

        async clear() {
            localStorage.removeItem(this.storageKey);
        }
    }

    // Base Character
    class Character {
        constructor(name, campaign, price, scale, uploaded, formUrl, tags, descriptionTemplate, brand) {
            this.name = name;
            this.campaign = campaign;
            this.price = price;
            this.scale = scale;
            this.uploaded = uploaded;
            this.formUrl = formUrl;
            this.tags = tags;
            this.descriptionTemplate = descriptionTemplate;
            this.brand = brand;
        }

        static defaultCharacter() {
            const platformDefaults = PlatformDefaultsFactory.getPlaformDefaults();
            return new Character('',
                                 '',
                                 platformDefaults.price,
                                 '',
                                 false,
                                 platformDefaults.formUrl,
                                 platformDefaults.tags,
                                 platformDefaults.descriptionTemplate,
                                 ''
            );
        }

        static fromJSON(data = {}) {
            return new Character(data.name,
                                 data.campaign,
                                 data.price,
                                 data.scale,
                                 data.uploaded,
                                 data.formUrl,
                                 data.tags,
                                 data.descriptionTemplate,
                                 data.brand
            );
        }

        toJSON() {
            return {
                name: this.name,
                campaign: this.campaign,
                price: this.price,
                scale: this.scale,
                uploaded: this.uploaded,
                formUrl: this.formUrl,
                tags: this.tags,
                descriptionTemplate: this.descriptionTemplate,
                brand: this.brand
            };
        }
    }

    // Base Extractor
    class IExtractor {

        constructor(platformDefaults) {
            this.platformDefaults = platformDefaults;
        }

        canExtract() {
            throw new Error('Not implemented');
        }

        async extract() {
            throw new Error('Not implemented');
        }

        // Common scale detection logic
        figureOutScale(text) {
            if (text.includes("Tabletop Heroes V1")) {
                return "32mm - Heroic Scale";
            }
            if (text.includes("Fantasy Girls STL Vol 2") ||
                text.includes("Dark Fantasy Minis") ||
                text.includes("Fantasy Elf Girls STL Vol 1") ||
                text.includes("Pirate girls Vol 1")) {
                return "75mm + 35mm Scale";
            }
            return "75mm";
        }
    }

    // Base Writer
    class IWriter {
        constructor() {
            this.report = {};
        }

        canWrite(model) {
            return window.location.href === model.formUrl;
        }

        generateName(model) {
            return `${model.name} - ${model.campaign} - ${model.scale}`
        }

        generateDescription(model) {
            let description = model.descriptionTemplate;
            description = description
                .replaceAll("__CHARACTER_NAME__", model.name)
                .replaceAll("__CAMPAIGN_NAME__", model.campaign)
                .replaceAll("__SCALE__", model.scale)
                .replaceAll("__BRAND__", model.brand);
            return description;
        }

        async write(model) {
            throw new Error('Not implemented');
        }

        async publish() {
            throw new Error('Not implemented');
        }

        findElement(selectors) {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return element;
            }
            return null;
        }

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // Base UI Inserter
    class IUiInjector {
        injectUi(container) {
            throw new Error('Not implemented');
        }
    }

    // ===== MMF SPECIFIC IMPLEMENTATIONS =====

    // MMF Extractor
    class MMFExtractor extends IExtractor {
        constructor(platformDefaults) {
            super(platformDefaults);
            // Selectors as class constants
            this.CONTAINER_SELECTOR = '#tabcontent > :nth-child(2) > :first-child > :first-child > :nth-child(2) > :first-child > :nth-child(2) > :first-child > :nth-child(3)';
            this.SHADOW_HOST_SELECTOR = 'div:nth-child(2)';
            this.INNER_CONTAINER_SELECTOR = 'div > article > div > section > div > :first-child';
            this.LINK_SELECTOR = 'a.object-card-link';
            this.PRICE_SELECTOR = 'p.object-card-price';
        }

        canExtract() {
            return window.location.href.includes('myminifactory.com') &&
                   document.querySelector(this.CONTAINER_SELECTOR);
        }

        async extract(tags, descriptionTemplate, brand) {
            const characters = [];
            const containers = document.querySelector(this.CONTAINER_SELECTOR).children;

            console.log(`Found ${containers.length} character containers`);

            // Use passed tags or fall back to platform defaults
            const modelTags = tags || this.platformDefaults.tags;
            const modelDescription = descriptionTemplate || this.platformDefaults.descriptionTemplate;

            for (let i = 0; i < containers.length; i++) {
                try {
                    const shadowHost = containers[i].querySelector(this.SHADOW_HOST_SELECTOR);
                    if (!shadowHost || !shadowHost.shadowRoot) {
                        console.warn(`Card ${i}: Missing or inaccessible shadowRoot`);
                        continue;
                    }

                    const shadow = shadowHost.shadowRoot;
                    const innerContainer = shadow.querySelector(this.INNER_CONTAINER_SELECTOR);
                    if (!innerContainer) {
                        console.warn(`Card ${i}: container not found`);
                        continue;
                    }

                    const linkEl = innerContainer.querySelector(this.LINK_SELECTOR);
                    const priceEl = innerContainer.querySelector(this.PRICE_SELECTOR);
                    if (!linkEl || !priceEl) {
                        console.warn(`Card ${i}: Missing link or price`);
                        continue;
                    }

                    const fullTitle = linkEl.textContent.trim();
                    const price = priceEl.textContent.trim().replace('$', '');
                    const link = linkEl.href;

                    let name = '';
                    let campaign = '';
                    let scale = '';

                    // Parse title
                    // Find scale: 2+ digits + optional space + "mm" + everything to end of string
                    const scaleMatch = fullTitle.match(/(\d{2,}\s?mm.*)/);

                    let titleWithoutScale = fullTitle;

                    if (scaleMatch) {
                        scale = scaleMatch[1].trim();
                        titleWithoutScale = fullTitle.replace(scaleMatch[1], '').trim();
                        // Remove trailing "-" if present after scale removal
                        if (titleWithoutScale.endsWith('-')) {
                            titleWithoutScale = titleWithoutScale.slice(0, -1).trim();
                        }
                    }

                    // Now split the remaining title on "-"
                    const dashSplit = titleWithoutScale.split('-').map(part => part.trim()).filter(part => part);
                    if (dashSplit.length >= 2) {
                        name = dashSplit[0];
                        campaign = dashSplit.slice(1).join(' - ');
                    } else if (fullTitle.includes(':')) {
                        const colonSplit = fullTitle.split(':');
                        name = colonSplit[0].trim();
                        campaign = colonSplit.slice(1).join(':').trim(); // handle Eldengaard: STL Pack
                    } else {
                        console.warn(`Card ${i}: title format unrecognized -> "${fullTitle}"`);
                        const words = fullTitle.split(' ');
                        name = words[0] || '';
                        campaign = words.slice(1).filter(word =>
                                                             word && !['from'].includes(word.toLowerCase())
                        ).join(' '); // handle Ravi
                    }

                    if (!scale) {
                        scale = this.figureOutScale(campaign);
                    }

                    const idMatch = link.match(/(\d+)$/);
                    const formUrl = idMatch ? `https://www.myminifactory.com/object/edit/${idMatch[1]}` : this.platformDefaults.formUrl;

                    const character = new Character(name,
                                                    campaign,
                                                    price,
                                                    scale,
                                                    false,
                                                    formUrl,
                                                    modelTags,
                                                    modelDescription,
                                                    brand
                    );

                    characters.push(character);
                } catch (error) {
                    console.error(`Failed to extract item ${i}:`, error);
                }
            }

            console.log(`Extracted ${characters.length} characters`);
            console.table(characters);

            return characters;
        }
    }

    // MMF Writer
    class MMFWriter extends IWriter {
        constructor() {
            super();
        }

        async write(model) {
            this.report = {fields: {}, success: true};

            // Write all fields
            await this.enableSelling();
            await this.writeName(model);
            await this.writeCategories();
            await this.writeTags(model);
            await this.writeDescription(model);
            await this.writeVisibility();
            await this.writePrice(model);
            await this.enableZipMode();

            return this.report;
        }

        async enableSelling() {
            const element = this.findElement(['#threedobject_temp_type_license_store', 'input[name="license-store"]']);
            if (!element) {
                this.report.fields.sellable = {success: false, error: "No element found"};
                return
            }

            if (element.value === 'off' || element.value === "1") {
                element.click();
            }
            this.report.fields.sellable = {success: true};
        }

        async writeName(model) {
            const element = this.findElement(['#threedobject_temp_type_name', '#threedobject_type_name']);
            if (!element) {
                this.report.fields.name = {success: false, error: "No element found"};
                return
            }

            element.value = this.generateName(model);
            this.report.fields.name = {success: true};
        }

        async writeCategories() {
            const element = this.findElement(['.categories-container > :first-child > :first-child']);
            if (!element) {
                this.report.fields.categories = {success: false, error: "No element found"};
                return
            }

            element.click();
            await this.sleep(100);

            this.selectCategory("Tabletop");
            this.selectCategory("Characters & Creatures");

            element.click();
            this.report.fields.categories = {success: true};
        }

        async writeTags(model) {
            const element = this.findElement(['.ui-widget-content.ui-autocomplete-input']);
            if (!element) {
                this.report.fields.tags = {success: false, error: "No element found"};
                return
            }
            await this.clearAllTagsSlowly();

            element.focus();
            element.click();
            await this.sleep(100);
            element.value = model.tags;
            element.dispatchEvent(new ClipboardEvent('paste', {
                dataType: 'text/plain',
                data: model.tags
            }));

            this.report.fields.tags = {success: true};
        }

        async writeDescription(model) {
            const element = this.findElement(['#threedobject_temp_type_description_ifr', '#threedobject_type_description_ifr']);
            if (!element) {
                this.report.fields.description = {success: false, error: "No element found"};
                return
            }

            element.contentDocument.body.innerHTML = this.generateDescription(model);
            this.report.fields.description = {success: true};
        }

        async writeVisibility() {
            const element = this.findElement(['#threedobject_temp_type_visibility', '#threedobject_type_visibility']);
            if (!element) {
                this.report.fields.visibility = {success: false, error: "No element found"};
                return
            }

            element.value = '2'; // Public option
            element.dispatchEvent(new Event('change', {bubbles: true}));
            this.report.fields.visibility = {success: true};
        }

        async writePrice(model) {
            const element = this.findElement(['#threedobject_temp_type_price', '#threedobject_type_price']);
            if (!element) {
                this.report.fields.price = {success: false, error: "No element found"};
                return
            }

            element.value = model.price;
            this.report.fields.price = {success: true};
        }

        async enableZipMode() {
            const element = this.findElement(['label[for="zip_mode"]']);
            if (!element) {
                this.report.fields.zipMode = {success: false, error: "No element found"};
                return
            }
            element.click();
            this.report.fields.zipMode = {success: true};
        }

        async publish() {
            const element = this.findElement(['input[value="Publish"]', '#submit-upload']);
            if (!element) {
                this.report.fields.publish = {success: false, error: "No element found"};
                return
            }
            element.click();
        }

        // Helper methods
        selectCategory(labelText) {
            const labels = Array.from(document.querySelectorAll('label'));
            for (const label of labels) {
                if (label.textContent.trim().includes(labelText)) {
                    const checkbox = label.querySelector('input[type="checkbox"]:not([disabled])');
                    if (checkbox && !checkbox.checked) {
                        checkbox.click();
                        return true;
                    }
                }
            }
            return false;
        }

        async clearAllTagsSlowly() {
            const ul = this.findElement(['#main > div.row.panel > form > div.tabs-content > div:nth-child(6) > div > div:nth-child(5) > div.small-12.large-10.columns > ul']);
            const input = ul?.querySelector("li.tagit-new > input");

            if (!ul || !input) return;

            input.focus();

            while (ul.children.length > 1) {
                const event = new KeyboardEvent('keydown', {
                    key: 'Backspace',
                    code: 'Backspace',
                    keyCode: 8,
                    which: 8,
                    bubbles: true,
                    cancelable: true
                });

                input.dispatchEvent(event);
                await this.sleep(100);
            }
        }
    }

    // MMF UI Inserter
    class MMFUIInjector extends IUiInjector {
        injectUi(container) {
            const main = document.getElementById('main');
            if (main) {
                main.insertBefore(container, main.firstChild);
                return true;
            }
            return false;
        }
    }

    class CultsUiInjector extends IUiInjector {
        injectUi(container) {
            const main = document.querySelector("body > main");
            if (main) {
                main.insertBefore(container, main.firstChild);
                return true;
            }
            return false;
        }
    }


    // ===== Cults3D Variant =====

    class CultsWriter extends IWriter {
        constructor() {
            super();
        }

        async write(model) {
            this.report = {fields: {}, success: true};
            const isPageOne = !window.location.href.includes("/price/edit");
            const isPageTwo = window.location.href.includes("/price/edit");
            if (isPageOne) {
                await this.writeName(model);
                await this.writeDescription(model);
                await this.writeCategories();
                await this.writeTags(model);
            } else if (isPageTwo) {
                await this.enableSelling();
                await this.writePrice(model);
                await this.writeVisibility();
            }
            return this.report;
        }

        async writeName(model) {
            const element = this.findElement(['#creation_name']);
            if (!element) {
                this.report.fields.name = {success: false, error: "No element found"};
                return
            }
            element.value = this.generateName(model);
            this.report.fields.name = {success: true};
        }

        async writeDescription(model) {
            const element = this.findElement(['#creation_description']);
            if (!element) {
                this.report.fields.description = {success: false, error: "No element found"};
                return
            }

            element.value = this.generateDescription(model);
            this.report.fields.description = {success: true};
        }

        async writeCategories() {
            const element = this.findElement(['#creation_category_id']);
            if (!element) {
                this.report.fields.categories = {success: false, error: "No element found"};
                return
            }

            const categoryId = "31";
            element.value = categoryId;

            const eventChange = new Event('change', {bubbles: true});
            element.dispatchEvent(eventChange);

            const optionElement = Array.from(element.options).find(option => option.value === categoryId);
            if (optionElement) {
                const eventClick = new MouseEvent('click', {bubbles: true, cancelable: true});
                optionElement.dispatchEvent(eventClick);
            } else {
                console.error('Option with value ' + categoryId + ' not found!');
            }

            await this.sleep(300);

            const dropdownInput = document.querySelector('#creation_sub_category_ids-ts-control');
            if (dropdownInput) {
                dropdownInput.click();
            } else {
                console.error('Dropdown input not found!');
                return;
            }

            function clickDropdownOption(optionId) {
                const option = document.querySelector(`#${optionId}`);
                if (option) {
                    option.click();
                } else {
                    console.error('Dropdown option with id ' + optionId + ' not found!');
                }
            }

            await this.sleep(300);
            clickDropdownOption('creation_sub_category_ids-opt-62');
            await this.sleep(300);
            clickDropdownOption('creation_sub_category_ids-opt-65');
            await this.sleep(300);
            clickDropdownOption('creation_sub_category_ids-opt-63');

            this.report.fields.categories = {success: true};
        }

        async writeTags(model) {
            const element = this.findElement(['#creation_flat_keywords']);
            if (!element) {
                this.report.fields.tags = {success: false, error: "No element found"};
                return
            }
            element.value = model.tags;
            this.report.fields.tags = {success: true};
        }

        async enableSelling() {
            const element = this.findElement(['#creation_pricing_priced']);
            if (!element) {
                this.report.fields.sellable = {success: false, error: "No element found"};
                return
            }
            element.click();

            this.report.fields.sellable = {success: true};
        }

        async writeVisibility() {
            const element = this.findElement(['#visibility-public']);
            if (!element) {
                this.report.fields.visibility = {success: false, error: "No element found"};
                return
            }

            element.click();
            this.report.fields.visibility = {success: true};
        }

        async writePrice(model) {
            const element = this.findElement(['#creation_download_price']);
            if (!element) {
                this.report.fields.description = {success: false, error: "No element found"};
                return
            }

            element.value = model.price;
            element.dispatchEvent(new Event('input', {bubbles: true}));
            element.dispatchEvent(new Event('change', {bubbles: true}));

            this.report.fields.price = {success: true};
        }

        async publish() {
            const element = this.findElement(['input[type="submit"][name="commit"]']);
            if (!element) {
                this.report.fields.publish = {success: false, error: "No element found"};
                return
            }
            element.click();
        }

    }

    // ===== STATE MANAGEMENT =====
    class AppState {
        constructor(characters = [Character.defaultCharacter()], currentIndex = 0, openaiKey = "") {
            this.characters = characters;
            this.currentIndex = currentIndex;
            this.openaiKey = openaiKey;
        }

        static fromJson(data) {
            if (!data) {
                return new AppState();
            }
            const characters = (data.characters || [Character.defaultCharacter()]).map(m => Character.fromJSON(m));
            const currentIndex = data.currentIndex || 0;
            const openaiKey = data.openaiKey || '';
            return new AppState(characters, currentIndex, openaiKey);
        }

        toJson() {
            return {
                characters: this.characters.map(m => m.toJSON()),
                currentIndex: this.currentIndex,
                openaiKey: this.openaiKey,
            }
        }
    }

    class App {

        constructor(repository) {
            this.repository = repository;
            this.state = new AppState();
        }

        async load() {
            const data = await this.repository.load();
            this.state = AppState.fromJson(data);
        }

        async save() {
            await this.repository.save(this.state.toJson());
        }

        getCurrentModel() {
            const index = this.state.currentIndex;
            const withinBounds = index >= 0 && index < this.state.characters.length;
            return withinBounds ? this.state.characters[index] : Character.defaultCharacter();
        }

        updateCurrentModel(updates) {
            const currentModel = this.getCurrentModel();
            if (currentModel) {
                Object.assign(currentModel, updates);
                this.save();
            }
        }

        markCurrentAsUploaded() {
            const model = this.getCurrentModel();
            if (model) {
                model.uploaded = true;
                this.save();
            }
        }

        getNextPending() {
            this.state.currentIndex = this.state.characters.findIndex((m) => !m.uploaded);
            this.save();
            return this.getCurrentModel();
        }

        setCharacters(characters) {
            this.state.characters = characters;
            this.state.currentIndex = 0;
            this.save();
        }

        async clear() {
            this.state = new AppState();
            await this.save();
        }
    }

    // ===== UI MANAGER =====

    class UIManager {
        constructor(app, extractor, writer, uiInjector, platformDefaults) {
            this.app = app;
            this.extractor = extractor;
            this.writer = writer;
            this.uiInjector = uiInjector;
            this.container = null;
            this.elements = {};
            this.lastWriteReport = null;
            this.platformDefaults = platformDefaults;
        }

        async init() {
            await this.app.load();
            this.render();
        }

        render() {
            this.container = this.createContainer('1rem', 'column', '8px', '0', 'auto');

            this.renderHeader();
            this.renderBody();
            this.renderFooter();

            // Use platform-specific UI insertion
            if (!this.uiInjector.injectUi(this.container)) {
                console.warn('Failed to insert UI into page');
            }
        }

        renderHeader() {
            const header = this.createContainer('0px', 'row', '4px', '0', 'auto');

            // Character selector
            this.elements.characterSelector = this.createSelect();
            this.updateCharacterSelector();
            this.elements.characterSelector.addEventListener('change', (e) => this.handleCharacterSelect(e));

            // Buttons
            const modelsFromNamesBtn = this.createButton('Models from Names');
            modelsFromNamesBtn.addEventListener('click', () => this.handleModelsFromNames());

            const modelsFromStoreBtn = this.createButton('Models from Store');
            modelsFromStoreBtn.addEventListener('click', () => this.handleModelsFromStore());

            const exportBtn = this.createButton('Export Data');
            exportBtn.addEventListener('click', () => this.handleExportData());

            const importBtn = this.createButton('Import Data');
            importBtn.addEventListener('click', () => this.handleImportData());

            const defaultDescBtn = this.createButton('Default Description');
            defaultDescBtn.addEventListener('click', () => this.handleDefaultDescription());

            const defaultTagsBtn = this.createButton('Default Tags');
            defaultTagsBtn.addEventListener('click', () => this.handleDefaultTags());

            const clearBtn = this.createButton('Clear');
            clearBtn.addEventListener('click', () => this.handleClear());

            header.append(
                this.elements.characterSelector,
                modelsFromNamesBtn,
                modelsFromStoreBtn,
                exportBtn,
                importBtn,
                defaultDescBtn,
                defaultTagsBtn,
                clearBtn
            );

            this.container.appendChild(header);
        }

        renderBody() {
            const body = this.createContainer('0px', 'row', '8px', '0', 'auto');

            // Left container
            const leftContainer = this.createContainer('0px', 'column', '4px', '0', '25%');

            // Brand
            this.elements.brandInput = this.createInput('');
            this.elements.brandInput.addEventListener('input', (e) => {
                this.app.updateCurrentModel({brand: e.target.value});
            });
            leftContainer.append(this.createLabel('Brand Name'), this.elements.brandInput);

            // Campaign
            this.elements.campaignInput = this.createInput('');
            this.elements.campaignInput.addEventListener('input', (e) => {
                this.app.updateCurrentModel({campaign: e.target.value});
            });
            leftContainer.append(this.createLabel('Kickstarter Campaign Name'), this.elements.campaignInput);

            // Name
            this.elements.nameInput = this.createInput('');
            this.elements.nameInput.addEventListener('input', (e) => {
                this.app.updateCurrentModel({name: e.target.value});
                this.updateCharacterSelector();
            });
            leftContainer.append(this.createLabel('Model Name'), this.elements.nameInput);

            // Price and Scale
            const priceScaleContainer = this.createContainer('0px', 'row', '4px', '0', '100%');

            const priceContainer = this.createContainer('0px', 'column', '4px', '1', '50%');
            this.elements.priceInput = this.createInput(this.platformDefaults.price);
            this.elements.priceInput.addEventListener('input', (e) => {
                this.app.updateCurrentModel({price: e.target.value});
            });
            priceContainer.append(this.createLabel('Model Price (USD)'), this.elements.priceInput);

            const scaleContainer = this.createContainer('0px', 'column', '4px', '1', '50%');
            scaleContainer.style.justifyContent="space-between";
            this.elements.scaleInput = this.createInput('');
            this.elements.scaleInput.addEventListener('input', (e) => {
                this.app.updateCurrentModel({scale: e.target.value});
            });
            scaleContainer.append(this.createLabel('Scale'), this.elements.scaleInput);

            priceScaleContainer.append(priceContainer, scaleContainer);
            leftContainer.appendChild(priceScaleContainer);

            // OpenAI Key
            this.elements.openaiKeyInput = this.createInput(this.app.state.openaiKey);
            this.elements.openaiKeyInput.addEventListener('input', (e) => {
                this.app.state.openaiKey = e.target.value;
                this.app.save();
            });
            leftContainer.append(this.createLabel('OpenAI API Key'), this.elements.openaiKeyInput);

            // Names textarea
            this.elements.namesTextArea = this.createTextarea('', 5);
            leftContainer.append(this.createLabel('Load New Names'), this.elements.namesTextArea);

            // Right container
            const rightContainer = this.createContainer('0px', 'column', '4px', '1', 'auto');

            // Description template
            this.elements.descriptionTextArea = this.createTextarea(this.platformDefaults.descriptionTemplate, 5);
            this.elements.descriptionTextArea.addEventListener('input', (e) => {
                this.app.updateCurrentModel({descriptionTemplate: e.target.value});
            });
            rightContainer.append(this.createLabel('Description Template'), this.elements.descriptionTextArea);

            // Tags
            this.elements.tagsTextArea = this.createTextarea(this.platformDefaults.tags, 5);
            this.elements.tagsTextArea.addEventListener('input', (e) => {
                this.app.updateCurrentModel({tags: e.target.value});
            });
            rightContainer.append(this.createLabel('Tags'), this.elements.tagsTextArea);

            body.append(leftContainer, rightContainer);
            this.container.appendChild(body);

            this.updateFormFields();
        }

        renderFooter() {
            const footer = this.createContainer('0px', 'row', '4px', '0', 'auto');

            const goToEditBtn = this.createButton('Go to Edit Screen');
            goToEditBtn.addEventListener('click', () => this.handleGoToEdit());

            const fillPageBtn = this.createButton('Fill Page');
            fillPageBtn.addEventListener('click', () => this.handleFillPage());

            const publishBtn = this.createButton('Publish');
            publishBtn.addEventListener('click', () => this.handlePublish());

            const nextBtn = this.createButton('Next Character');
            nextBtn.addEventListener('click', () => this.handleNextCharacter());

            footer.append(goToEditBtn, fillPageBtn, publishBtn, nextBtn);
            this.container.appendChild(footer);
        }

        // Event Handlers
        async handleCharacterSelect(event) {
            const selectedIndex = parseInt(event.target.value);
            if (isNaN(selectedIndex)) return;

            this.app.state.currentIndex = selectedIndex;
            await this.app.save();
            this.updateFormFields();

            // Auto-navigate to edit page if user triggered
            if (event.isTrusted && this.app.getCurrentModel()) {
                //when is this an issue? 
                // when I have new models, that are uploaded but when revisiting its pointing to upload
                this.handleGoToEdit();
            }
        }

        async handleModelsFromNames() {
            const names = this.elements.namesTextArea.value;
            if (!names.trim()) return;

            const lines = names.split('\n').filter(line => line.trim());
            const characters = lines.map(
                name => new Character(name.trim(),
                                      this.elements.campaignInput.value,
                                      this.elements.priceInput.value || this.platformDefaults.price,
                                      this.elements.scaleInput.value || this.platformDefaults.scale,
                                      false,
                                      this.platformDefaults.formUrl,
                                      this.elements.tagsTextArea.value || this.platformDefaults.tags,
                                      this.elements.descriptionTextArea.value || this.platformDefaults.descriptionTemplate,
                                      this.elements.brandInput.value
                ));
            this.app.setCharacters(characters);
            this.refresh();
        }

        async handleModelsFromStore() {
            if (!this.extractor.canExtract()) {
                alert('Cannot extract from this page. Please navigate to a listing page.');
                return;
            }

            // Get current tags from textarea or use defaults
            const tags = this.elements.tagsTextArea.value.trim() || this.platformDefaults.tags;
            const description = this.elements.descriptionTextArea.value || this.platformDefaults.descriptionTemplate;
            const brand = this.elements.brandInput.value;

            const characters = await this.extractor.extract(tags, description, brand);
            if (characters.length === 0) {
                alert('No items found to extract.');
                return;
            }

            this.app.setCharacters(characters);
            this.refresh();
        }

        handleDefaultDescription() {
            this.app.updateCurrentModel({descriptionTemplate: this.platformDefaults.descriptionTemplate});
            this.elements.descriptionTextArea.value = this.platformDefaults.descriptionTemplate;
        }

        handleDefaultTags() {
            this.app.updateCurrentModel({tags: this.platformDefaults.tags});
            this.elements.tagsTextArea.value = this.platformDefaults.tags;
        }

        async handleClear() {
            await this.app.clear();
            this.refresh();
        }

        async handleExportData() {
            try {
                // Get the current state data
                const data = await this.app.repository.load();
                if (!data) {
                    alert('No data to export');
                    return;
                }

                // Create filename with current date
                const now = new Date();
                const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
                const filename = `mmf-upload-helper-${dateStr}.json`;

                // Create and download the file
                const jsonStr = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonStr], {type: 'application/json'});
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                console.log('Data exported successfully');
            } catch (error) {
                console.error('Export failed:', error);
                alert('Export failed: ' + error.message);
            }
        }

        async handleImportData() {
            try {
                // Create a hidden file input element
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.style.display = 'none';

                fileInput.addEventListener('change', async (event) => {
                    const file = event.target.files[0];
                    if (!file) return;

                    try {
                        const text = await file.text();
                        const data = JSON.parse(text);

                        // Validate the data structure
                        if (!data || typeof data !== 'object') {
                            throw new Error('Invalid data format');
                        }

                        const appState = AppState.fromJson(data);
                        const platformDomain = new URL(this.platformDefaults.formUrl).hostname;
                        appState.characters = appState.characters.map(character => {
                            const characterDomain = new URL(character.formUrl).hostname;
                            if (characterDomain !== platformDomain) {
                                return new Character(character.name,
                                                     character.campaign,
                                                     character.price,
                                                     character.scale,
                                                     false,
                                                     this.platformDefaults.formUrl,
                                                     this.platformDefaults.tags,
                                                     this.platformDefaults.descriptionTemplate,
                                                     character.brand
                                );
                            }
                            return character;
                        })

                        // Save the imported data
                        await this.app.repository.save(appState);

                        // Reload the state and refresh UI
                        await this.app.load();
                        this.refresh();

                        console.log('Data imported successfully');
                        alert('Data imported successfully!');
                    } catch (error) {
                        console.error('Import failed:', error);
                        alert('Import failed: ' + error.message);
                    }
                });

                // Trigger file selection
                document.body.appendChild(fileInput);
                fileInput.click();
                document.body.removeChild(fileInput);
            } catch (error) {
                console.error('Import setup failed:', error);
                alert('Import setup failed: ' + error.message);
            }
        }

        handleGoToEdit() {
            const model = this.app.getCurrentModel();
            if (model && model.formUrl) {
                window.location.href = model.formUrl;
            }
        }

        async handleFillPage() {
            const model = this.app.getCurrentModel();
            if (!model) {
                alert('No model selected');
                return;
            }

            if (!this.writer.canWrite(model)) {
                const currentUrl = window.location.href;
                const formUrl = model.formUrl;
                const confirmed = confirm(
                    `You're not on the correct page.\n\n` +
                    `Current URL: ${currentUrl}\n` +
                    `Expected URL: ${formUrl}\n\n` +
                    `Are you sure you want to fill the page anyway?`
                );

                if (!confirmed) {
                    return;
                }
            }

            // Write to page
            this.lastWriteReport = await this.writer.write(model);

            // Show results if write had issues
            if (!this.lastWriteReport.success) {
                let message = 'Some fields failed to write:\n';
                Object.entries(this.lastWriteReport.fields).forEach(([field, result]) => {
                    if (!result.success) {
                        message += `- ${field}: ${result.error}\n`;
                    }
                });
                alert(message);
            }
        }

        async handlePublish() {
            try {
                await this.writer.publish();
                this.app.markCurrentAsUploaded();
                this.updateCharacterSelector();
            } catch (error) {
                alert(error.message);
            }
        }

        handleNextCharacter() {
            const nextModel = this.app.getNextPending();
            if (nextModel) {
                this.refresh();
                this.handleGoToEdit();
            } else {
                alert('No more pending items.');
            }
        }

        // Helper Methods
        updateFormFields() {
            const model = this.app.getCurrentModel();
            if (!model) return;

            this.elements.campaignInput.value = model.campaign || '';
            this.elements.nameInput.value = model.name || '';
            this.elements.scaleInput.value = model.scale || '';
            this.elements.priceInput.value = model.price || this.platformDefaults.price;
            this.elements.tagsTextArea.value = model.tags || this.platformDefaults.tags;
            this.elements.brandInput.value = model.brand || '';
            this.elements.descriptionTextArea.value = model.descriptionTemplate || this.platformDefaults.descriptionTemplate;
        }

        updateCharacterSelector() {
            this.elements.characterSelector.innerHTML = '';

            if (this.app.state.characters.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No characters available';
                this.elements.characterSelector.appendChild(option);
            } else {
                this.app.state.characters.forEach((model, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${model.name} ${model.uploaded ? '(Uploaded)' : '(Pending)'}`;
                    this.elements.characterSelector.appendChild(option);
                });

                if (this.app.state.currentIndex >= 0) {
                    this.elements.characterSelector.value = this.app.state.currentIndex;
                }
            }
        }

        refresh() {
            this.updateFormFields();
            this.updateCharacterSelector();
        }

        // UI Creation Helpers
        createContainer(padding, flexDirection, gap, flexGrow, width) {
            const container = document.createElement('div');
            container.style.background = "white";
            container.style.padding = padding;
            container.style.display = "flex";
            container.style.flexDirection = flexDirection;
            container.style.flexGrow = flexGrow;
            container.style.gap = gap;
            container.style.width = width;
            return container;
        }

        createLabel(text) {
            const label = document.createElement('label');
            label.textContent = text;
            label.style.margin = "0px";
            return label;
        }

        createInput(value) {
            const input = document.createElement('input');
            input.style.boxSizing = 'border-box';
            input.style.background = 'white !important';
            input.style.height = '40px';
            input.value = value;
            return input;
        }

        createTextarea(value, rows) {
            const textarea = document.createElement('textarea');
            textarea.rows = rows;
            textarea.style.margin = "0px";
            textarea.style.boxSizing = 'border-box';
            textarea.style.background = 'white !important';
            textarea.style.flexGrow = '1';
            textarea.value = value;
            return textarea;
        }

        createButton(text) {
            const button = document.createElement('button');
            button.textContent = text;
            button.style.height = '40px';
            button.style.margin = "0px";
            button.style.padding = "0px 10px";
            button.style.flexGrow = '1';
            button.style.fontSize = '13px';
            return button;
        }

        createSelect() {
            const select = document.createElement('select');
            select.style.height = '40px';
            select.style.margin = "0px";
            select.style.padding = "0px 10px";
            select.style.flexGrow = '0';
            select.style.width = '25%';
            select.style.boxSizing = 'border-box';
            select.style.background = 'white !important';
            return select;
        }
    }

    // ===== MAIN APPLICATION =====

    class MarketplaceAutomation {
        async init() {
            const platform = this.detectPlatform();
            if (!platform) {
                console.log('Platform not supported');
                return;
            }

            const repository = new LocalStorageRepository();
            const app = new App(repository);
            const ui = new UIManager(app, platform.extractor, platform.writer, platform.uiInjector, platform.platformDefaults);
            await ui.init();
        }

        detectPlatform() {
            const platformDefaults = PlatformDefaultsFactory.getPlaformDefaults()
            if (window.location.hostname.includes('myminifactory.com')) {
                return {
                    extractor: new MMFExtractor(platformDefaults),
                    writer: new MMFWriter(),
                    uiInjector: new MMFUIInjector(),
                    platformDefaults: platformDefaults
                };
            }
            // Future platforms can be added here
            if (window.location.hostname.includes('cults3d.com')) {
                return {
                    extractor: new IExtractor(platformDefaults),
                    writer: new CultsWriter(),
                    uiInjector: new CultsUiInjector(),
                    platformDefaults: platformDefaults
                };
            }

            return null;
        }
    }

    // Start the application
    setTimeout(() => {
        const app = new MarketplaceAutomation();
        app.init();
    }, 700);

})();