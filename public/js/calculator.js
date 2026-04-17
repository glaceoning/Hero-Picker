/*
All this code is copyright Autopoietico, 2023.
    -This code includes a bit of snippets found on stackoverflow.com and others
I'm not a javascript expert, I use this project to learn how to code, and how to design web pages, is a funny hobby to do, but if I
gain something in the process is a plus.
Feel free to alter this code to your liking, but please do not re-host it, do not profit from it and do not present it as your own.
*/

import { API_URL as DEFAULT_API_URL, JSON_URL } from "./utils/constants.js";
import ModelOverPiker from "./models/model-overpicker.js";
import ViewOverPiker from "./views/view-overpicker.js";
import ControllerOverPiker from "./controllers/controller-overpicker.js";
import ViewQuickAdd from "./views/view-quick-add.js";

// The live API at api.overpicker.com does not send Access-Control-Allow-Origin,
// so browsers on github.io block every request. The deploy workflow snapshots
// the JSON into ./api/<endpoint> next to index.html; fetch from there instead.
const IS_GITHUB_PAGES =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith("github.io");
const API_URL = IS_GITHUB_PAGES ? "api/" : DEFAULT_API_URL;

//////////////////////
// Start the APP
//////////////////////

const calculator = new ControllerOverPiker(
    new ModelOverPiker(),
    new ViewOverPiker()
);

// Quick Add overlay (Q to open). Keystroke listener is global, so it works
// regardless of where focus is, as long as no other input is focused.
new ViewQuickAdd(calculator.model, calculator);

//After the calculator is loaded we call the data from the API, this data is saved in local and then load in the model
calculator.loadAPIJSON(API_URL, JSON_URL);

/*
All this code is copyright Autopoietico, 2023.
    -This code includes a bit of snippets found on stackoverflow.com and others
I'm not a javascript expert, I use this project to learn how to code, and how to design web pages, is a funny hobby to do, but if I
gain something in the process is a plus.
Feel free to alter this code to your liking, but please do not re-host it, do not profit from it and do not present it as your own.
*/
