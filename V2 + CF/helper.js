const VIDEO_EXTENSIONS = [
  "3g2",
  "3gp",
  "avi",
  "flv",
  "mkv",
  "mk3d",
  "mov",
  "mp2",
  "mp4",
  "m4v",
  "mpe",
  "mpeg",
  "mpg",
  "mpv",
  "webm",
  "wmv",
  "ogm",
  "ts",
  "m2ts",
];
const SUBTITLE_EXTENSIONS = [
  "aqt",
  "gsub",
  "jss",
  "sub",
  "ttxt",
  "pjs",
  "psb",
  "rt",
  "smi",
  "slt",
  "ssf",
  "srt",
  "ssa",
  "ass",
  "usf",
  "idx",
  "vtt",
];

let containEandS = (name = "", s, e, abs, abs_season, abs_episode) =>
  //SxxExx ./ /~/-
  //SxExx
  //SxExx
  //axb
  //Sxx - Exx
  //Sxx.Exx
  //Season xx Exx
  //SasEae selon abs
  //SasEaex  selon abs
  //SasEaexx  selon abs
  //SxxEaexx selon abs
  //SxxEaexxx  selon abs
  name?.includes(`s${s?.padStart(2, "0")}e${e?.padStart(2, "0")} `) ||
  name?.includes(`s${s?.padStart(2, "0")}e${e?.padStart(2, "0")}.`) ||
  name?.includes(`s${s?.padStart(2, "0")}e${e?.padStart(2, "0")}-`) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")} `) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")}.`) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")}-`) ||
  name?.includes(`${s}x${e}`) ||
  name?.includes(`s${s?.padStart(2, "0")} - e${e?.padStart(2, "0")}`) ||
  name?.includes(`s${s?.padStart(2, "0")}.e${e?.padStart(2, "0")}`) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")} `) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")}.`) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")}-`) ||
  name?.includes(`s${s?.padStart(2, "0")}e${e} `) ||
  name?.includes(`s${s?.padStart(2, "0")}e${e}.`) ||
  name?.includes(`s${s?.padStart(2, "0")}e${e}-`) ||
  name?.includes(`season ${s} e${e}`) ||
  (abs &&
    (name?.includes(
      `s${abs_season?.padStart(2, "0")}e${abs_episode?.padStart(2, "0")}`
    ) ||
      name?.includes(
        `s${s?.padStart(2, "0")}e${abs_episode?.padStart(2, "0")}`
      ) ||
      name?.includes(
        `s${s?.padStart(2, "0")}e${abs_episode?.padStart(3, "0")}`
      ) ||
      name?.includes(
        `s${abs_season?.padStart(2, "0")}e${abs_episode?.padStart(3, "0")}`
      ) ||
      name?.includes(
        `s${abs_season?.padStart(2, "0")}e${abs_episode?.padStart(4, "0")}`
      )));

let containE_S = (name = "", s, e, abs, abs_season, abs_episode) =>
  //Sxx - xx
  //Sx - xx
  //Sx - x
  //Season x - x
  //Season x - xx
  name?.includes(`s${s?.padStart(2, "0")} - ${e?.padStart(2, "0")}`) ||
  name?.includes(`s${s} - ${e?.padStart(2, "0")}`) ||
  // name?.includes(`s${s} - ${e}`) ||
  // name?.includes(`season ${s} - ${e}`) ||
  name?.includes(`season ${s} - ${e?.padStart(2, "0")}`) ||
  name?.includes(`season ${s} - ${e?.padStart(2, "0")}`);

let containsAbsoluteE = (name = "", s, e, abs, abs_season, abs_episode) =>
  //- xx
  //- xxx
  //- xxxx
  //- 0x
  name?.includes(` ${abs_episode?.padStart(2, "0")} `) ||
  name?.includes(` ${abs_episode?.padStart(3, "0")} `) ||
  name?.includes(` 0${abs_episode} `) ||
  name?.includes(` ${abs_episode?.padStart(4, "0")} `);

let containsAbsoluteE_ = (name = "", s, e, abs, abs_season, abs_episode) =>
  // xx.
  // xxx.
  // xxxx.
  // 0x.
  name?.includes(` ${abs_episode?.padStart(2, "0")}.`) ||
  name?.includes(` ${abs_episode?.padStart(3, "0")}.`) ||
  name?.includes(` 0${abs_episode}.`) ||
  name?.includes(` ${abs_episode?.padStart(4, "0")}.`);

// console.log("--------------------NAME------------------------&");
// console.log(element["name"] ?? "Rien");
// console.log("--------------------------------------------$");
// console.log(`containsAbsoluteE(element): ${containsAbsoluteE(element)}`);
// console.log(
//   `containsAbsoluteE_(element): ${containsAbsoluteE_(element)}`
// );
// console.log(`containE_S(element): ${containE_S(element)}`);
// console.log(`containEandS(element): ${containEandS(element)}`);

let removeDuplicate = (data = [], key = "name") => {
  let response = [];
  data.forEach((one, i) => {
    let index_ = response.findIndex((el) => el[key] == one[key]);
    index_ == -1 ? response.push(one) : null;
  });
  return response;
};

const parseToStreamUrl = (baseURL, data) => {
  return `${baseURL}/${data["0"]}${data["11"]}/${data["10"]}${data["11"]}`;
};

module.exports = {
  containEandS,
  containE_S,
  containsAbsoluteE,
  containsAbsoluteE_,
  VIDEO_EXTENSIONS,
  SUBTITLE_EXTENSIONS,
  removeDuplicate,
  parseToStreamUrl,
};
