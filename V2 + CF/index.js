require("dotenv").config();
const express = require("express");
const app = express();
const fetch = require("node-fetch");
const HTMLParser = require("node-html-parser");

const { removeDuplicate, parseToStreamUrl } = require("./helper");

function getSize(size) {
  var gb = 1024 * 1024 * 1024;
  var mb = 1024 * 1024;

  return (
    "💾 " +
    (size / gb > 1
      ? `${(size / gb).toFixed(2)} GB`
      : `${(size / mb).toFixed(2)} MB`)
  );
}

function getQuality(name) {
  if (!name) {
    return name;
  }
  name = name.toLowerCase();

  if (["2160", "4k", "uhd"].filter((x) => name.includes(x)).length > 0)
    return "🌟4k";
  if (["1080", "fhd"].filter((x) => name.includes(x)).length > 0)
    return " 🎥FHD";
  if (["720", "hd"].filter((x) => name.includes(x)).length > 0) return "📺HD";
  if (["480p", "380p", "sd"].filter((x) => name.includes(x)).length > 0)
    return "📱SD";
  return "";
}

// ----------------------------------------------

let isVideo = (element) => {
  return (
    element["name"]?.toLowerCase()?.includes(`.mkv`) ||
    element["name"]?.toLowerCase()?.includes(`.mp4`) ||
    element["name"]?.toLowerCase()?.includes(`.avi`) ||
    element["name"]?.toLowerCase()?.includes(`.m3u`) ||
    element["name"]?.toLowerCase()?.includes(`.m3u8`) ||
    element["name"]?.toLowerCase()?.includes(`.flv`)
  );
};

//------------------------------------------------------------------------------------------

let isRedirect = async (url) => {
  try {
    const controller = new AbortController();
    // 5 second timeout:
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 301 || response.status === 302) {
      const locationURL = new URL(
        response.headers.get("location"),
        response.url
      );
      if (locationURL.href.startsWith("http")) {
        await isRedirect(locationURL);
      } else {
        return locationURL.href;
      }
    } else if (response.status >= 200 && response.status < 300) {
      return response.url;
    } else {
      // return response.url;
      return null;
    }
  } catch (error) {
    return null;
  }
};

let stream_results = [];
let torrent_results = [];
let authorization = "Basic cHNjaGVja25lcjpiaWxsYmxhc3Mz";

let fetchEasynews = async (query) => {
  // Update with your Cloudflare Worker URL
  let url = `https://your-proxy-worker-url.workers.dev/proxy/https://members.easynews.com/2.0/search/solr-search/solr-search/advanced?st=adv&sb=1&fex=mkv&fty[]=VIDEO&spamf=1&u=1&gx=1&pno=1&sS=3&s1=relevance&s1d=-&pby=1000&safeO=1&gps=${query}`;

  return await fetch(url, {
    headers: {
      accept: "*/*",
    },
    referrerPolicy: "no-referrer",
    method: "GET",
  })
    .then((res) => res.json())
    .then(async (results) => {
      return "data" in results
        ? results["data"].map((el) => {
            return {
              ...el,
              dlFarm: results["dlFarm"],
              dlPort: results["dlPort"],
              baseURL: results["baseURL"],
              downURL: results["downURL"],
              url: parseToStreamUrl(
                `${results["downURL"]}/${results["dlFarm"]}/${results["dlPort"]}`,
                el
              ),
            };
          })
        : [];
    })
    .catch((err) => {
      console.log({ err });
      return [];
    });
};

function getMeta2(id, type) {
  var [tt, s, e] = id.split(":");

  const api1 = `https://v2.sg.media-imdb.com/suggestion/t/${tt}.json`;
  const api2 = `https://v3-cinemeta.strem.io/meta/${type}/${tt}.json`;

  return fetch(api1)
    .then((res) => res.json())
    .then((json) => {
      return json.d[0];
    })
    .then(({ l, y }) => ({ name: l, year: y }))
    .catch((err) =>
      fetch(api2)
        .then((res) => res.json())
        .then((json) => ({
          name: json.meta["name"],
          year: json.meta["releaseInfo"]?.substring(0, 4) ?? "",
        }))
    );
}

function getMeta(id, type) {
  var [tt, s, e] = id.split(":");

  const api1 = `https://v2.sg.media-imdb.com/suggestion/t/${tt}.json`;
  const api2 = `https://v3-cinemeta.strem.io/meta/${type}/${tt}.json`;

  return fetch(api2)
    .then((res) => res.json())
    .then((json) => ({
      name: json.meta["name"],
      year: json.meta["releaseInfo"]?.substring(0, 4) ?? "",
    }))
    .catch((err) =>
      fetch(api1)
        .then((res) => res.json())
        .then((json) => {
          return json.d[0];
        })
        .then(({ l, y }) => ({ name: l, year: y }))
    );
}

async function getImdbFromKitsu(id) {
  var [kitsu, _id, e] = id.split(":");

  return fetch(`https://anime-kitsu.strem.fun/meta/anime/${kitsu}:${_id}.json`)
    .then((_res) => _res.json())
    .then((json) => {
      return json["meta"];
    })
    .then((json) => {
      try {
        let imdb = json["imdb_id"];
        let meta = json["videos"].find((el) => el.id == id);
        return [
          imdb,
          (meta["imdbSeason"] ?? 1).toString(),
          (meta["imdbEpisode"] ?? 1).toString(),
          (meta["season"] ?? 1).toString(),
          (meta["imdbSeason"] ?? 1).toString() == 1
            ? (meta["imdbEpisode"] ?? 1).toString()
            : (meta["episode"] ?? 1).toString(),
          meta["imdbEpisode"] != meta["episode"] || meta["imdbSeason"] == 1,
        ];
      } catch (error) {
        return null;
      }
    })
    .catch((err) => null);
}

let isSuitable = (resultname = "", name = "") => {
  let nameArray = name.split(" ");

  let check = true;
  nameArray.forEach((word) => {
    if (
      word.length >= 3 &&
      !["the", "a", "an", "to", "too"].includes(word.toLowerCase())
    ) {
      check = check && resultname?.toLowerCase().includes(word?.toLowerCase());
      if (!check) return check;
    }
  });
  return check;
};

app
  .get("/manifest.json", (req, res) => {
    res.send({
      id: "com.stremio.easynews",
      version: "1.0.0",
      name: "EasyNews",
      description: "EasyNews Integration",
      resources: ["catalog", "stream"],
      types: ["movie", "series"],
      idPrefixes: ["tt", "kitsu"],
      catalogs: [],
    });
  })
  .get("/stream/:type/:id", async (req, res) => {
    const { type, id } = req.params;

    var query;
    if (id.startsWith("kitsu")) {
      await getImdbFromKitsu(id)
        .then((response) => {
          var [
            imdb_id,
            imdbSeason,
            imdbEpisode,
            kitsuSeason,
            kitsuEpisode,
            replace,
          ] = response;

          if (!imdb_id) {
            throw new Error("Not Found");
          }

          query =
            type == "series"
              ? `tvshow:"${imdb_id}" s${imdbSeason.padStart(
                  2,
                  "0"
                )}e${imdbEpisode.padStart(2, "0")} `
              : `movie:"${imdb_id}"`;

          if (replace)
            query += `| "${id.split(":")[1]}" s${kitsuSeason.padStart(
              2,
              "0"
            )}e${kitsuEpisode.padStart(2, "0")}`;
        })
        .catch((err) => res.sendStatus(404));
    } else {
      query =
        type == "series"
          ? `tvshow:"${id.split(":")[0]}" s${id.split(":")[1].padStart(
              2,
              "0"
            )}e${id.split(":")[2].padStart(2, "0")} `
          : `movie:"${id.split(":")[0]}"`;
    }

    stream_results = await fetchEasynews(query);

    if (stream_results.length > 0) {
      var { name, year } = id.startsWith("kitsu")
        ? { name: "", year: "" }
        : await getMeta2(id, type);

      stream_results = stream_results.filter((el) =>
        isSuitable(el["name"], name)
      );

      let streams = stream_results.map((el) => ({
        name: `EasyNews`,
        title: `${getQuality(el["name"])} ${el["name"].replace(
          /\./g,
          " "
        )} (${el["length"]}) ${getSize(el["rawSize"])}`,
        url: el["url"],
        behaviorHints: {
          bingeGroup:
            type == "series" ? `${id.split(":")[0]}${id.split(":")[1]}` : null,
          countryWhitelist: ["us"],
          notWebReady: true,
          proxyHeaders: {
            request: {
              authorization: authorization,
            },
          },
        },
      }));

      streams = await Promise.all(
        streams.map(async (stream) => ({
          ...stream,
          url: await isRedirect(stream.url),
        }))
      );

      res.send({
        streams: removeDuplicate(
          streams.filter((el) => el.url),
          "url"
        ),
      });
    } else {
      res.send({
        streams: [],
      });
    }
  });

module.exports = app;
