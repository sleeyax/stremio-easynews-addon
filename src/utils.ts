import { Stream } from 'stremio-addon-sdk';
import { EasynewsSearchResponse, FileData } from './types';
import { type Config } from '../stremio-addon-sdk';

export function createBasic(username: string, password: string) {
  const userInfo = `${username}:${password}`;

  return `Basic ${Buffer.from(userInfo).toString('base64')}`;
}

export function isBadVideo(file: FileData) {
  const duration = file['14'] ?? '';

  return (
    // <= 5 minutes in duration
    duration.match(/^\d+s/) ||
    duration.match('^[0-5]m') ||
    // password protected
    file.passwd ||
    // malicious
    file.virus ||
    // not a video
    file.type.toUpperCase() !== 'VIDEO'
  );
}

export function sanitizeTitle(title: string) {
  return (
    title
      // remove non-alphanumeric characters
      .replace(/[^\w\s]/g, '')
      // remove spaces at the beginning and end
      .trim()
  );
}

export function createStreamUrl({
  downURL,
  dlFarm,
  dlPort,
}: EasynewsSearchResponse) {
  return `${downURL}/${dlFarm}/${dlPort}`;
}

export function createStreamPath(file: FileData) {
  const postHash = file['0'] ?? '';
  const postTitle = file['10'] ?? '';
  const ext = file['11'] ?? '';

  return `${postHash}${ext}/${postTitle}${ext}`;
}

export function createStreamAuth(config: Config) {
  return `Authorization=${encodeURIComponent(config.username + ':' + config.password)}`;
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
