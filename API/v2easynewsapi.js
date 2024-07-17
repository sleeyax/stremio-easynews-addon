const fetch = require('node-fetch');
const cheerio = require('cheerio');

console.log('EasyNewsAPI module loaded');

const videoExtensions = 'm4v,3g2,3gp,nsv,tp,ts,ty,pls,rm,rmvb,mpd,ifo,mov,qt,divx,xvid,bivx,vob,nrg,img,iso,udf,pva,wmv,asf,asx,ogm,m2v,avi,bin,dat,mpg,mpeg,mp4,mkv,mk3d,avc,vp3,svq3,nuv,viv,dv,fli,flv,wpl,xspf,vdr,dvr-ms,xsp,mts,m2t,m2ts,evo,ogv,sdp,avs,rec,url,pxml,vc1,h264,rcv,rss,mpls,mpl,webm,bdmv,bdm,wtv,trp,f4v,pvr,disc';

const SEARCH_PARAMS = {
    st: 'adv',
    sb: 1,
    fex: videoExtensions,
    'fty[]': 'VIDEO',
    spamf: 1,
    u: '1',
    gx: 1,
    pno: 1,
    sS: 3,
    s1: 'relevance',
    s1d: '-',
    s2d: '-',
    s3d: '-',
    pby: 1000
};

const timeout = 20000;

class EasyNewsAPI {
    constructor() {
        console.log('Initializing EasyNewsAPI');
        this.baseUrl = 'https://members.easynews.com';
        this.searchLink = '/2.0/search/solr-search/advanced';
        this.accountLink = 'https://account.easynews.com/editinfo.php';
        this.usageLink = 'https://account.easynews.com/usageview.php';
        this.username = process.env.EASYNEWS_USERNAME || 'empty_setting';
        this.password = process.env.EASYNEWS_PASSWORD || 'empty_setting';
        this.auth = this._getAuth();
        this.authQuoted = encodeURIComponent(this.auth);
        console.log('EasyNewsAPI initialized');
    }

    _getAuth() {
        console.log('Generating auth token');
        const userInfo = `${this.username}:${this.password}`;
        return 'Basic ' + Buffer.from(userInfo).toString('base64');
    }

    async search(query, expiration = 48) {
        console.log('Searching EasyNews for:', query);
        const [url, params] = this._translateSearch(query);
        const cacheKey = 'EASYNEWS_SEARCH_' + new URLSearchParams(params).toString();
        return this._processSearch(url, params);
    }

    async account() {
        console.log('Fetching account information');
        const [accountInfo, usageInfo] = await Promise.all([
            this.accountInfo(),
            this.usageInfo()
        ]);
        return [accountInfo, usageInfo];
    }

    async accountInfo() {
        console.log('Fetching account details');
        try {
            const accountHtml = await this._get(this.accountLink);
            const $ = cheerio.load(accountHtml);
            const info = $('#accountForm td').slice(1).filter((i, el) => i % 3 === 0).map((i, el) => $(el).text()).get();
            console.log('Account details fetched');
            return info;
        } catch (error) {
            console.error('Error fetching account info:', error);
            return null;
        }
    }

    async usageInfo() {
        console.log('Fetching usage information');
        try {
            const usageHtml = await this._get(this.usageLink);
            const $ = cheerio.load(usageHtml);
            const usageInfo = $('.table-responsive td').slice(1).filter((i, el) => i % 3 === 0).map((i, el) => $(el).text()).get();
            usageInfo[1] = usageInfo[1].replace(/<\/?[^>]+(>|$)/g, '');
            console.log('Usage information fetched');
            return usageInfo;
        } catch (error) {
            console.error('Error fetching usage info:', error);
            return null;
        }
    }

    _processFiles(files) {
        console.log('Processing search results');
        const downUrl = files.downURL;
        const streamingUrl = `https://${encodeURIComponent(this.username)}:${encodeURIComponent(this.password)}@members.easynews.com/dl`;
        const [dlFarm, dlPort] = this.getFarmAndPort(files);
        
        return files.data.map(item => {
            try {
                const [postHash, size, postTitle, ext, duration] = [item['0'], item['4'], item['10'], item['11'], item['14']];
                const language = item.alangs || '';
                
                if (item.type && item.type.toUpperCase() !== 'VIDEO') return null;
                if (item.virus) return null;
                
                const shortVid = /^\d+s/.test(duration) || /^[0-5]m/.test(duration);
                const urlAdd = encodeURIComponent(`/${dlFarm}/${dlPort}/${postHash}${ext}/${postTitle}${ext}`);
                const streamUrl = streamingUrl + urlAdd;
                const fileDl = downUrl + urlAdd + `|Authorization=${this.authQuoted}`;
                const thumbnail = `https://th.easynews.com/thumbnails-${postHash.slice(0, 3)}/pr-${postHash}.jpg`;

                console.log('Processed file:', postTitle);
                return {
                    name: postTitle,
                    size: size,
                    rawSize: item.rawSize,
                    width: parseInt(item.width),
                    runtime: Math.floor(item.runtime / 60),
                    url_dl: streamUrl,
                    down_url: fileDl,
                    version: 'version2',
                    short_vid: shortVid,
                    language: language,
                    thumbnail: thumbnail
                };
            } catch (error) {
                console.error('Error processing file:', error);
                return null;
            }
        }).filter(Boolean);
    }

    getFarmAndPort(files) {
        return [files.dlFarm, files.dlPort];
    }

    _translateSearch(query) {
        console.log('Translating search query');
        const params = { ...SEARCH_PARAMS, safeO: 0, gps: query };
        const url = this.baseUrl + this.searchLink;
        return [url, params];
    }

    async _processSearch(url, params) {
        console.log('Processing search');
        const results = await this._get(url, params);
        return this._processFiles(results);
    }

    async _get(url, params = {}) {
        console.log('Making GET request to:', url);
        const headers = { 'Authorization': this.auth };
        try {
            const response = await fetch(url + '?' + new URLSearchParams(params), { headers, timeout });
            const text = await response.text();
            console.log('GET request successful');
            return JSON.parse(text);
        } catch (error) {
            console.error('Error in _get:', error);
            throw error;
        }
    }

    async resolveEasyNews(urlDl) {
        console.log('Resolving EasyNews URL:', urlDl);
        try {
            const headers = { 'Authorization': this.auth };
            const response = await fetch(urlDl, { headers, redirect: 'manual' });
            const resolvedUrl = response.headers.get('location') || urlDl;
            console.log('Resolved URL:', resolvedUrl);
            return resolvedUrl;
        } catch (error) {
            console.error('Error resolving EasyNews URL:', error);
            return urlDl;
        }
    }
}

module.exports = EasyNewsAPI;