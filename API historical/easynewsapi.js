const fetch = require('node-fetch');

class EasyNewsAPI {
    constructor() {
        this.baseUrl = 'https://members.easynews.com';
        this.searchLink = '/2.0/search/solr-search/advanced';
        this.username = process.env.EASYNEWS_USERNAME || 'empty_setting';
        this.password = process.env.EASYNEWS_PASSWORD || 'empty_setting';
        this.auth = this._getAuth();
        this.authQuoted = encodeURIComponent(this.auth);
    }

    _getAuth() {
        const userInfo = `${this.username}:${this.password}`;
        return 'Basic ' + Buffer.from(userInfo).toString('base64');
    }

    async search(query) {
        const [url, params] = this._translateSearch(query);
        return this._processSearch(url, params);
    }

    async _processSearch(url, params) {
        const results = await this._get(url, params);
        return this._processFiles(results);
    }

    _translateSearch(query) {
        const params = { gps: query };
        const url = this.baseUrl + this.searchLink;
        return [url, params];
    }

    async _get(url, params = {}) {
        const headers = { 'Authorization': this.auth };
        try {
            const response = await fetch(url + '?' + new URLSearchParams(params), { headers });
            const text = await response.text();
            return this._parseResponse(text);
        } catch (error) {
            console.error('Error in _get:', error);
            throw error;
        }
    }

    _parseResponse(text) {
        try {
            const response = JSON.parse(text);
            return response;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            console.error('Response text:', text);
            throw new Error('Invalid JSON response');
        }
    }

    _processFiles(response) {
        if (!response || !Array.isArray(response.files)) {
            return [];
        }

        const files = response.files;

        if (files.length === 0) {
            return [];
        }

        return files.map(item => {
            try {
                const postTitle = item['6'] || 'Unknown Title'; // Subject
                const size = item['4'] || 'Unknown Size'; // Size
                const duration = item['14'] || '0s'; // Runtime
                const ext = item['2'] || ''; // Extension
                const sig = item['sig'] || ''; // Signature
                const primaryURL = item.primaryURL || '';
                const fileName = item['10'] || 'unknown';

                // Ensure the URL is correctly formed
                const fileDl = `https:${primaryURL}/dl/auto/${fileName}${ext}?sig=${sig}`;

                return {
                    title: `${postTitle}\n${size} | ${duration}`,
                    url: fileDl,
                    name: `EasyNews: ${postTitle}`,
                    type: 'video',
                    behaviorHints: {
                        notWebReady: true,
                        proxyHeaders: {
                            request: {
                                Accept: 'application/json',
                                Authorization: this.auth,
                            },
                        },
                    },
                };
            } catch (error) {
                console.error('Error processing file:', error);
                return null;
            }
        }).filter(Boolean);
    }

    async resolveEasyNews(urlDl) {
        try {
            // Ensure the URL starts with HTTP or HTTPS
            if (!urlDl.startsWith('http://') && !urlDl.startsWith('https://')) {
                throw new Error('Invalid URL: ' + urlDl);
            }

            const headers = { 'Authorization': this.auth };
            const response = await fetch(urlDl, { headers, redirect: 'manual' });

            if (response.status === 302) {
                // Handle redirect
                const resolvedUrl = response.headers.get('location') || urlDl;
                console.log('Resolved URL:', resolvedUrl);
                return resolvedUrl;
            } else {
                console.log('Direct URL:', urlDl);
                return urlDl;
            }
        } catch (error) {
            console.error('Error resolving EasyNews URL:', error);
            return urlDl;
        }
    }
}

module.exports = EasyNewsAPI;
