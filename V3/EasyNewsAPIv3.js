const axios = require('axios');

require('dotenv').config();



class EasyNewsAPIv3 {

  constructor() {

    this.username = process.env.EASYNEWS_USERNAME;

    this.password = process.env.EASYNEWS_PASSWORD;

    if (!this.username || !this.password) {

      throw new Error("Username or password not set in environment variables");

    }

    this.base_url = 'https://members.easynews.com/global5/search.html';

    this.regex = /<tr class="rRow\d+">.*?<input.*?name="([^"]+)".*?value="([^"]+)".*?<a href="([^"]+)".*?>([^<]+)<\/a>.*?<td class="fSize" nowrap>([\d.]+ [GM]B)<\/td>.*?<td class="StatusLink" nowrap>([^<]+)<\/td>.*?<td class="StatusLink" nowrap>([^<]+)<\/td>/gs;

    this.auth = this._getAuth();

  }



  _getAuth() {

    const userInfo = `${this.username}:${this.password}`;

    return 'Basic ' + Buffer.from(userInfo).toString('base64');

  }



  async search(query) {

    const url = this.base_url;

    const params = {

      submit: 'Search',

      gps: query,

      sbj: '',

      from: '',

      ns: '',

      fil: '',

      fex: 'mkv',

      vc: '',

      ac: '',

      s1: 'dsize',

      s1d: '-',

      s2: 'dsize',

      s2d: '-',

      s3: 'dsize',

      s3d: '-',

      pby: 100,

      pno: 1,

      sS: 0,

      svL: '',

      d1: '',

      d1t: '',

      d2: '',

      d2t: '',

      b1: '',

      b1t: '',

      b2: '',

      b2t: '',

      px1: '',

      px1t: '',

      px2: '',

      px2t: '',

      fps1: '',

      fps1t: '',

      fps2: '',

      fps2t: '',

      bps1: '',

      bps1t: '',

      bps2: '',

      bps2t: '',

      hz1: '',

      hz1t: '',

      hz2: '',

      hz2t: '',

      rn1: '',

      rn1t: '',

      rn2: '',

      rn2t: '',

      fly: 1

    };

    const results = await this._get(url, params);

    return this._processFiles(results);

  }



  async _get(url, params = {}) {

    try {

      const response = await axios.get(url, {

        params,

        headers: { Authorization: this.auth },

        timeout: 20000

      });



      let match;

      const results = [];

      while ((match = this.regex.exec(response.data)) !== null) {

        results.push({

          checkboxValue: match[1],

          value: match[2],

          linkUrl: match[3],

          filename: match[4],

          fileSize: match[5],

          codec: match[6],

          views: match[7]

        });

      }

      return { data: results }; 

    } catch (error) {

      throw error;

    }

  }



  _processFiles(results) {

    const files = results.data || [];

    return files.map(item => {

      try {

        const { value, linkUrl, filename, fileSize, codec, views } = item;

        const urlDl = linkUrl.replace('https://', `https://${this.username}:${this.password}@`);

        const thumbnail = `https://th.easynews.com/thumbnails-${value.slice(0, 3)}/pr-${value}.jpg`;

        return {

          name: filename,

          size: fileSize,

          codec,

          views,

          url_dl: urlDl,

          version: 'version3',

          thumbnail

        };

      } catch (e) {

        return null;

      }

    }).filter(Boolean);

  }



  async resolverV3(urlDl) {

    try {

      const response = await axios.get(urlDl, {

        headers: { Authorization: this.auth },

        maxRedirects: 0,

        validateStatus: null

      });

      const streamUrl = response.headers.location;

      return `${streamUrl}|Authorization=${encodeURIComponent(this.auth)}`;

    } catch (error) {

      throw error;

    }

  }

}



module.exports = EasyNewsAPIv3;