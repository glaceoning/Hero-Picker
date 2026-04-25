/*
All this code is copyright Autopoietico, 2023.
    -This code includes a bit of snippets found on stackoverflow.com and others
I'm not a javascript expert, I use this project to learn how to code, and how to design web pages, is a funny hobby to do, but if I
gain something in the process is a plus.
Feel free to alter this code to your liking, but please do not re-host it, do not profit from it and do not present it as your own.
*/

import { LASTUPDATE } from "../utils/constants.js";

class ModelAPI {
    constructor() {
        //This are temporary data savers before the model take the data from the API.
        this.mapInfo = JSON.parse(localStorage.getItem("mapInfo")) || [];
        this.mapTypes = JSON.parse(localStorage.getItem("mapTypes")) || [];
        this.heroTiers = JSON.parse(localStorage.getItem("heroTiers")) || [];
        this.heroInfo = JSON.parse(localStorage.getItem("heroInfo")) || [];
        this.heroIMG = JSON.parse(localStorage.getItem("heroIMG")) || [];
        this.heroCounters =
            JSON.parse(localStorage.getItem("heroCounters")) || [];
        this.heroSynergies =
            JSON.parse(localStorage.getItem("heroSynergies")) || [];
        this.heroMaps = JSON.parse(localStorage.getItem("heroMaps")) || [];
        this.heroADC = JSON.parse(localStorage.getItem("heroADC")) || [];
        this.version = JSON.parse(localStorage.getItem("version")) || [];

        //This a temporal solution to fixing the charging of incorrect info to adc data
        if (!this.heroADC["Ana"]) {
            console.log(
                "Incomplete ADC data detected; clearing stale API cache"
            );
            localStorage.removeItem("heroADC");
        }
    }

    loadLocalStorage(model) {
        //If local storage data is aviable these is loaded in the model
        if (Object.keys(this.mapInfo).length) {
            model.buildMapPool();
        }

        if (Object.keys(this.mapTypes).length) {
            model.loadMapTypes();
        }

        if (Object.keys(this.heroTiers).length) {
            model.loadHeroTiers();
        }

        if (
            Object.keys(this.heroTiers).length &&
            Object.keys(this.heroInfo).length &&
            Object.keys(this.heroIMG).length &&
            Object.keys(this.heroCounters).length &&
            Object.keys(this.heroSynergies).length &&
            Object.keys(this.heroMaps).length &&
            Object.keys(this.heroADC).length
        ) {
            model.loadHeroDataForTeams();
        }
    }

    loadAPIJSON(apiURL, jsonURL, model, controller) {
        //This charge the data from the API one by one and load them in the model
        fetch(apiURL + jsonURL["mapInfo"])
            .then((res) => res.json())
            .then((data) => {
                this.mapInfo = {
                    ...data,
                };

                model.buildMapPool();

                localStorage.setItem("mapInfo", JSON.stringify(this.mapInfo));
                return fetch(apiURL + jsonURL["mapTypes"]);
            })
            .then((res) => res.json())
            .then((data) => {
                this.mapTypes = {
                    ...data,
                };

                model.loadMapTypes();

                localStorage.setItem("mapTypes", JSON.stringify(this.mapTypes));
                return fetch(apiURL + jsonURL["heroTiers"]);
            })
            .then((res) => res.json())
            .then((data) => {
                this.heroTiers = {
                    ...data,
                };

                model.loadHeroTiers();

                localStorage.setItem(
                    "heroTiers",
                    JSON.stringify(this.heroTiers)
                );
                return fetch(apiURL + jsonURL["heroInfo"]);
            })
            .then((res) => res.json())
            .then((data) => {
                this.heroInfo = {
                    ...data,
                };

                localStorage.setItem("heroInfo", JSON.stringify(this.heroInfo));
                return fetch(apiURL + jsonURL["heroIMG"]);
            })
            .then((res) => res.json())
            .then((data) => {
                this.heroIMG = {
                    ...data,
                };

                localStorage.setItem("heroIMG", JSON.stringify(this.heroIMG));
                return fetch(apiURL + jsonURL["heroCounters"]);
            })
            .then((res) => res.json())
            .then((data) => {
                this.heroCounters = {
                    ...data,
                };

                localStorage.setItem(
                    "heroCounters",
                    JSON.stringify(this.heroCounters)
                );
                return fetch(apiURL + jsonURL["heroSynergies"]);
            })
            .then((res) => res.json())
            .then((data) => {
                this.heroSynergies = {
                    ...data,
                };

                localStorage.setItem(
                    "heroSynergies",
                    JSON.stringify(this.heroSynergies)
                );
                return fetch(apiURL + jsonURL["heroMaps"]);
            })
            .then((res) => res.json())
            .then((data) => {
                this.heroMaps = {
                    ...data,
                };

                localStorage.setItem("heroMaps", JSON.stringify(this.heroMaps));
                return fetch(apiURL + jsonURL["heroADC"]);
            })
            .then((res) => res.json())
            .then((data) => {
                this.heroADC = {
                    ...data,
                };

                model.loadHeroDataForTeams();

                localStorage.setItem("heroADC", JSON.stringify(this.heroADC));
                return fetch(apiURL + jsonURL["version"]);
            })
            .then((res) => res.json())
            .then((data) => {
                this.version = {
                    ...data,
                };

                localStorage.setItem("version", JSON.stringify(this.version));
                controller.reloadControllerModel(this.version);
            })
            .catch((error) => {
                console.error("API fetch failed:", error);
                //Show user-visible error message
                let errorDiv = document.getElementById("api-error-banner");
                if (!errorDiv) {
                    errorDiv = document.createElement("div");
                    errorDiv.id = "api-error-banner";
                    errorDiv.className =
                        "fixed top-0 left-0 right-0 bg-red-700 text-white text-center " +
                        "py-2 px-4 z-[100] poppins text-sm";
                    errorDiv.textContent =
                        "Failed to load some hero data. The picker may show incomplete results. " +
                        "Try refreshing the page.";
                    document.body.prepend(errorDiv);
                }
                //Still attempt to load whatever data we have so far
                controller.reloadControllerModel({ "last-update": "Unknown" });
            });
    }

    findElement(jsonOBJ, name, valueName) {
        //Find the position for a element in a JSON, based in the name of the element, and return the desire value

        for (let jO in jsonOBJ) {
            if (jsonOBJ[jO]["name"] == name) {
                return jsonOBJ[jO][valueName];
            }
        }

        return "";
    }
}

export default ModelAPI;
