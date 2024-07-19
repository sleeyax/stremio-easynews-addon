"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBasic = createBasic;
exports.isBadVideo = isBadVideo;
exports.sanitizeTitle = sanitizeTitle;
exports.createStreamUrl = createStreamUrl;
exports.createStreamPath = createStreamPath;
exports.createStreamAuth = createStreamAuth;
exports.getPostTitle = getPostTitle;
exports.getDuration = getDuration;
exports.getSize = getSize;
function createBasic(username, password) {
    const userInfo = `${username}:${password}`;
    return `Basic ${Buffer.from(userInfo).toString('base64')}`;
}
function isBadVideo(file) {
    const duration = file['14'] ?? '';
    return (duration.match(/^\d+s/) ||
        duration.match('^[0-5]m') ||
        file.passwd ||
        file.virus ||
        file.type.toUpperCase() !== 'VIDEO');
}
function sanitizeTitle(title) {
    return title.replace(/\./g, ' ').replace(/[^\w\s]/g, '').trim();
}
function createStreamUrl({ downURL, dlFarm, dlPort }) {
    return `${downURL}/${dlFarm}/${dlPort}`;
}
function createStreamPath(file) {
    const postHash = file['0'] ?? '';
    const postTitle = file['10'] ?? '';
    const ext = file['11'] ?? '';
    return `${postHash}${ext}/${postTitle}${ext}`;
}
function createStreamAuth(username, password) {
    return `Authorization=${encodeURIComponent(username + ':' + password)}`;
}
function getPostTitle(file) {
    return file['10'] ?? '';
}
function getDuration(file) {
    return file['14'] ?? '';
}
function getSize(file) {
    return file['4'] ?? '';
}
