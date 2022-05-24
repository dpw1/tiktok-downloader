const TikTokScraper = require("tiktok-scraper");
const fs = require("fs-extra");
const http = require("https");
const fluent_ffmpeg = require("fluent-ffmpeg");
const child_process = require("child_process");
var shell = require("shelljs");

const FileSync = require("lowdb/adapters/FileSync");
const lowDb = require("lowdb");
const { resolve } = require("path");

/* Database init */
const db = lowDb(new FileSync("db.json"));
db.defaults({ videos: [] }).write();

/* ======================= */
const DEFAULT_FOLDER = `compilation_video`;

/* ======================== */

async function getTikTokMetaData(url) {
  const options = {
    number: 50,
    since: 0,
    sessionList: ["sid_tt=21312213"],
    proxy: "",
    by_user_id: false,
    asyncDownload: 5,
    asyncScraping: 3,
    filepath: `CURRENT_DIR`,
    fileName: `CURRENT_DIR`,
    filetype: `na`,
    headers: {
      "user-agent": "BLAH",
      referer: "https://www.tiktok.com/",
      cookie: `tt_webid_v2=68dssds`,
    },
    noWaterMark: false,
    hdVideo: false,
    verifyFp: "",
    useTestEndpoints: false,
  };

  return new Promise(async (resolve, reject) => {
    try {
      const videoMeta = await TikTokScraper.getVideoMeta(url, options);
      resolve(videoMeta);
    } catch (err) {
      reject(err);
    }
  });
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

async function saveVideoToDatabase(url, videoMeta) {
  const video = {
    id: videoMeta.collector[0].id,
    title: videoMeta.collector[0].text,
    creationDate: new Date().getTime(),
    hashtags: videoMeta.collector[0].hashtags
      .map((e) => `#${e.name}`)
      .join(" "),
    author: `@${videoMeta.collector[0].authorMeta.name}`,
    url,
  };

  try {
    db.get("videos")
      .push({
        ...video,
      })
      .write();
    resolve({ success: "success" });
  } catch (err) {}
}

async function downloadVideo(url, folder, videoMeta) {
  const TITLE_CHARACTER_LIMIT = 50;

  return new Promise(async (resolve, reject) => {
    try {
      const title = videoMeta.collector[0].id;

      const video = videoMeta.collector[0].videoUrl;

      await fs.mkdir(`${__dirname}/videos/${folder}`, { recursive: true });

      const file = await fs.createWriteStream(`videos/${folder}/${title}.mp4`);

      const request = http.get(video, function (response) {
        response.pipe(file);

        // after download completed close filestream
        file.on("finish", () => {
          file.close();
          console.log(`${title} downloaded.\n`);

          resolve({ success: "success" });
        });
      });
    } catch (error) {
      console.log("error: ", error);
      reject({ error });
    }
  });
}

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

async function getInfoFromVideoFolder(folder) {
  return new Promise(async (resolve, reject) => {
    const path = `${process.cwd()}\\videos\\${folder}`;

    const _videos = await fs.readdir(path);

    /* Get all videos in folder */
    const videos = _videos.filter(
      (e) => e.includes(".mp4") && !e.includes("compilation.mp4"),
    );

    const videosDatabase = db.get("videos").value();

    let found = [];

    for (var [index, each] of videos.entries()) {
      const video = videosDatabase.filter((e) => {
        return each.includes(e.id);
      })[0];

      if (video) {
        found = [...found, video];
      }
    }

    let _tags = "";
    let _credits = [];

    for (var [index, each] of found.entries()) {
      const tag = each.hashtags;
      const credit = `${each.author}`;

      _tags += tag;
      _credits = [..._credits, credit];
    }

    const tags = [...new Set(_tags.split(" "))]
      .sort((a, b) => a.localeCompare(b))
      .join(",");

    const description = `Note - we don't own any videos or pictures in this compilation, all rights go to their respective owners:
      
${_credits.join(" ")}

Tags:
${tags}
      `;

    console.log(`\n\n\n`);
    console.log(description);
  });
}

async function mergeVideos(folder) {
  return new Promise(async (resolve, reject) => {
    try {
      const path = `${process.cwd()}\\videos\\${folder}`;

      const _videos = await fs.readdir(path);

      /* Get all videos in folder */
      const videos = shuffle(
        _videos
          .filter((e) => e.includes(".mp4") && !e.includes("compilation.mp4"))
          .map((e) => `-i "${e}"`),
      );

      const width = `1280`;
      const height = `720`;
      const output = `compilation.mp4`;

      /* Generate ffmpeg code to merge videos */
      var vout1 = videos
        .map(
          (e, i) => `[${i}:v]scale=${width}:${height},setdar=9/16[vout${i}];`,
        )
        .join("");
      var vout2 = videos.map((e, i) => `[vout${i}][${i}:a]`).join("");
      var vout3 = `concat=n=${videos.length}:v=1:a=1[v][a]`;

      var vout = `"${vout1}${vout2}${vout3}"`;

      const code = `ffmpeg -y ${videos.join(
        " ",
      )} -preset ultrafast -filter_complex ${vout} -map "[v]" -map "[a]" -c:v libx264 -c:a aac -movflags +faststart ${output}`;

      console.log(`\n\n\n========== CODE ============\n\n\n${code}\n\n\n`);
      /* Change to folder where videos are located */
      process.chdir(path);

      console.log("==================== Code:\n\n", code);

      if (shell.exec(code).code === 0) {
        console.log(`${videos.length} Videos merged successfully!`);
        resolve({ success: "success" });
      } else {
        console.log("error", shell.error());

        reject({ error: "FFMmpeg error" });
        shell.exit(1);
      }
    } catch (err) {
      reject({ error: "err" });
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateDescription(urls) {
  /* 

Credits:

@mediasidajd
@maksdjasda


*/
}

function convertSecondsToMinutes(seconds) {
  const format = (val) => `0${Math.floor(val)}`.slice(-2);
  const hours = seconds / 3600;
  const minutes = (seconds % 3600) / 60;

  return [hours, minutes, seconds % 60].map(format).join(":");
}

async function getTotalTime(urls) {
  return new Promise(async (resolve, reject) => {
    var totalSeconds = [];

    for (const [i, url] of urls.entries()) {
      const data = await getTikTokMetaData(url);

      const seconds = data.collector[0].videoMeta.duration;
      totalSeconds = [...totalSeconds, seconds];
      await sleep(50);

      if (i >= urls.length - 1) {
        const total = convertSecondsToMinutes(
          totalSeconds.reduce((a, b) => a + b),
        );
        resolve(total);
      }
    }
  });
}

/* 

1. Download videos

*/
async function processVideos(urls, folder = DEFAULT_FOLDER) {
  return new Promise(async (resolve, reject) => {
    for (const [i, url] of urls.entries()) {
      try {
        const videoMeta = await getTikTokMetaData(url);

        await downloadVideo(url, folder, videoMeta);
        await saveVideoToDatabase(url, videoMeta);

        if (i >= urls.length - 1) {
          console.log(`\n${urls.length} videos downloaded successfully!`);
          resolve(true);
        }
      } catch (error) {
        reject({ error });
      }
    }
  });
}

/**
 * 1. Download all videos from URLs
 * 2. Create title
 * 3. Create description
 * 4. Create hashtags
 */

async function createVideoCompilation(urls, folder) {
  const path = `${__dirname}/videos/${folder}`;

  console.log("folder: ", folder);

  return new Promise(async (resolve, reject) => {
    try {
      await processVideos(urls, folder);
      await mergeVideos(folder);

      resolve({ folder: path });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  createVideoCompilation: createVideoCompilation,
  downloadVideo: downloadVideo,
  mergeVideos: mergeVideos,
  processVideos: processVideos,
  getTotalTime: getTotalTime,
  getInfoFromVideoFolder: getInfoFromVideoFolder,
};
