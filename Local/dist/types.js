"use strict";
// src/types.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentType = exports.URL = exports.Group = exports.The20 = exports.CodingFormat = exports.CompressionStandard = exports.FileExtension = void 0;
var FileExtension;
(function (FileExtension) {
    FileExtension["AVI"] = ".avi";
    FileExtension["Mkv"] = ".mkv";
    FileExtension["Mp4"] = ".mp4";
})(FileExtension || (exports.FileExtension = FileExtension = {}));
var CompressionStandard;
(function (CompressionStandard) {
    CompressionStandard["H264"] = "H264";
    CompressionStandard["Xvid"] = "XVID";
})(CompressionStandard || (exports.CompressionStandard = CompressionStandard = {}));
var CodingFormat;
(function (CodingFormat) {
    CodingFormat["AAC"] = "AAC";
    CodingFormat["Mp3"] = "MP3";
    CodingFormat["Mpg123"] = "MPG123";
    CodingFormat["Unknown"] = "UNKNOWN";
})(CodingFormat || (exports.CodingFormat = CodingFormat = {}));
var The20;
(function (The20) {
    The20["The8734"] = "&#8734;";
})(The20 || (exports.The20 = The20 = {}));
var Group;
(function (Group) {
    Group["AltBinariesBonelessAltBinariesMisc"] = "alt.binaries.boneless alt.binaries.misc";
    Group["AltBinariesBonelessAltBinariesMiscAltBinariesNl"] = "alt.binaries.boneless alt.binaries.misc alt.binaries.nl";
    Group["AltBinariesBonelessAltBinariesMultimedia"] = "alt.binaries.boneless alt.binaries.multimedia";
    Group["AltBinariesBonelessAltBinariesNewzbin"] = "alt.binaries.boneless alt.binaries.newzbin";
    Group["AltBinariesDVDAltBinariesNlAltBinariesX"] = "alt.binaries.dvd alt.binaries.nl alt.binaries.x";
    Group["AltBinariesMiscAltBinariesNl"] = "alt.binaries.misc alt.binaries.nl";
    Group["AltBinariesMultimedia"] = "alt.binaries.multimedia";
    Group["AltBinariesMultimediaAltBinariesTeevee"] = "alt.binaries.multimedia alt.binaries.teevee";
    Group["AltBinariesNl"] = "alt.binaries.nl";
    Group["AltBinariesWtfnzbDelta"] = "alt.binaries.wtfnzb.delta";
})(Group || (exports.Group = Group = {}));
var URL;
(function (URL) {
    URL["MembersEasynewsCOM"] = "//members.easynews.com";
})(URL || (exports.URL = URL = {}));
var ContentType;
(function (ContentType) {
    ContentType["Video"] = "VIDEO";
})(ContentType || (exports.ContentType = ContentType = {}));
