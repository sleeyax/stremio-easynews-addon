"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stremio_addon_sdk_1 = require("stremio-addon-sdk");
const addon_1 = __importDefault(require("./addon"));
const port = +(process.env.PORT ?? 1337);
(0, stremio_addon_sdk_1.serveHTTP)(addon_1.default, { port });
