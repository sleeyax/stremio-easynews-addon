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
  let url = `https://members.easynews.com/2.0/search/solr-search/advanced?st=adv&sb=1&fex=mkv&fty[]=VIDEO&spamf=1&u=1&gx=1&pno=1&sS=3&s1=relevance&s1d=-&pby=1000&safeO=1&gps=${query}`;

  // console.log({ url });

  return await fetch(url, {
    headers: {
      accept: "*/*",
      Authorization: authorization,
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
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", "application/json");

    //
    var json = {
      id: "hy.easynws.stream",
      version: "1.0.2",
      name: "Easy002
",
      description: "From easynews.com",
      logo: "https://raw.githubusercontent.com/daniwalter001/daniwalter001/main/52852137.png",
      resources: [
        {
          name: "stream",
          types: ["movie", "series"],
          idPrefixes: ["tt"],
        },
      ],
      types: ["movie", "series"],
      catalogs: [],
    };

    return res.send(json);
  })
  .get("/stream/:type/:id", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", "application/json");

    //
    let media = req.params.type;
    let id = req.params.id;
    id = id.replace(".json", "");

    let tmp = [];

    if (id.includes("kitsu")) {
      tmp = await getImdbFromKitsu(id);
      if (!tmp) {
        return res.send({ stream: {} });
      }
    } else {
      tmp = id.split(":");
    }

    console.log(tmp);

    let [tt, s, e, abs_season, abs_episode, abs] = tmp;

    let meta = await getMeta(tt, media);

    console.log({ meta });

    let query = "";
    query = meta?.name;

    let result = [];

    if (media == "movie") {
      result = await fetchEasynews(meta?.name + "+" + meta.year);
    } else {
      let promises = [
        fetchEasynews(
          `${meta.name} S${s.padStart(2, "0")}E${e.padStart(2, "0")}`
        ),
        // fetchEasynews(`${meta.name} s${s.padStart(2, "0")}`),
      ];
      // if (+s == 1) {
      //   promises = [
      //     ...promises,
      //     fetchEasynews(`${meta.name} ${e.padStart(2, "0")}`),
      //   ];
      // }

      if (abs) {
        promises = [
          ...promises,
          fetchEasynews(`${meta.name} E${abs_episode.padStart(2, "0")}`),
          fetchEasynews(
            `${meta.name} S${s.padStart(2, "0")}E${abs_episode.padStart(
              2,
              "0"
            )}`
          ),
          // fetchEasynews(`${meta.name} ${abs_episode.padStart(2, "0")}`),
        ];
      }

      result = await Promise.all(promises);

      result = [
        ...result[0],
        ...(result.length > 1 ? result[1] : []),
        ...(result.length > 2 ? result[2] : []),
        ...(result.length > 3 ? result[3] : []),
        ...(result.length > 4 ? result[4] : []),
      ];
    }

    console.log({ Results: result.length });

    // for (const el of result) {
    //   console.log(el["10"] + "=>" + el["4"] + "=>" + el?.url + "\r");
    // }

    result = removeDuplicate(
      result.filter((el) => !!el && !!el["url"]),
      "url"
    );

    const streams = result.map((el) => {
      return {
        title: el["10"] + "\n" + el["4"] + " | " + el["14"],
        url: el?.url,
        name: "Easy001: " + getQuality(el["10"]),
        type: media,
        behaviorHints: {
          notWebReady: true,
          proxyHeaders: {
            request: {
              Accept: "application/json",
              Authorization: authorization,
            },
          },
        },
      };
    });

    console.log({ final: streams.length });

    return res.send({
      streams: [...streams],
    });
  })
  .listen(process.env.PORT || 3000, () => {
    console.log(`working on ${process.env.PORT || 3000}`);
  });
