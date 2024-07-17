import { EasynewsSearchResponse, FileData, MetaPreview } from './types';

export function createBasic(username: string, password: string) {
  const userInfo = `${username}:${password}`;
  return `Basic ${Buffer.from(userInfo).toString('base64')}`;
}

export function isBadVideo(file: FileData) {
  const duration = file['14'] ?? '';
  return (
    duration.match(/^\d+s/) ||
    duration.match('^[0-5]m') ||
    file.passwd ||
    file.virus ||
    file.type.toUpperCase() !== 'VIDEO'
  );
}

export function sanitizeTitle(title: string) {
  return title.replace(/\./g, ' ').replace(/[^\w\s]/g, '').trim();
}

export function createStreamUrl({ downURL, dlFarm, dlPort }: EasynewsSearchResponse) {
  return `${downURL}/${dlFarm}/${dlPort}`;
}

export function createStreamPath(file: FileData) {
  const postHash = file['0'] ?? '';
  const postTitle = file['10'] ?? '';
  const ext = file['11'] ?? '';
  return `${postHash}${ext}/${postTitle}${ext}`;
}

export function createStreamAuth(username: string, password: string) {
  return `Authorization=${encodeURIComponent(username + ':' + password)}`;
}

export function getPostTitle(file: FileData) {
  return file['10'] ?? '';
}

export function getDuration(file: FileData) {
  return file['14'] ?? '';
}

export function getSize(file: FileData) {
  return file['4'] ?? '';
}
