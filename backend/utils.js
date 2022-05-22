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
    const videos = db.get("videos").value();

    let found = videos.filter((e) => e.id === video.id)[0];

    if (found) {
      console.log("video already exists (doing nothing)");
      // reject("Video already exists");
      // return;
    }

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
      const _title = videoMeta.collector[0].text.replace(/[^a-zA-Z0-9 ]/g, "");
      const title =
        _title.length >= TITLE_CHARACTER_LIMIT
          ? `${_title.substring(0, TITLE_CHARACTER_LIMIT)}_`
          : _title;

      const video = videoMeta.collector[0].videoUrl;

      await fs.mkdir(`${__dirname}/videos/${folder}`, { recursive: true });

      const file = await fs.createWriteStream(`videos/${folder}/${title}.mp4`);

      const request = http.get(video, function (response) {
        response.pipe(file);

        // after download completed close filestream
        file.on("finish", () => {
          file.close();
          console.log(`${title} downloaded.\n`);

          resolve(true);
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

async function mergeVideos(folder) {
  return new Promise(async (resolve, reject) => {
    const path = `${__dirname}/videos/${folder}`;

    const _videos = await fs.readdir(path);
    const videos = _videos
      .filter((e) => e.includes(".mp4"))
      .map((e) => `-i ${e}`);

    const output = `compilation.mp4`;

    const code = `ffmpeg -y ${videos.join(
      " ",
    )} -preset ultrafast -filter_complex "[0:v]scale=1920:1080[vout];[1:v]scale=1920:1080[vout2];[vout][0:a][vout2][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -c:a aac -movflags +faststart ${output}`;

    process.chdir(path);

    if (shell.exec(code).code === 0) {
      console.log("success!");
      resolve();
      shell.exit(1);
    }

    // await fs.writeFile(bat, code);

    // var _bat = require.resolve(bat);

    // console.log(_bat);

    // child_process.exec(_bat, function (error, stdout, stderr) {
    //   console.log("Merging completed.");
    // });

    return;
    // var mergedVideo = fluent_ffmpeg();
    // console.log("videos: ", videos);

    // videos.forEach(function (name) {
    //   console.log(name);
    //   mergedVideo = mergedVideo.addInput(name);

    // });

    // mergedVideo
    //   .mergeToFile(`${path}/compilation.mp4`, "./tmp/")
    //   .on("error", function (err) {
    //     reject(err.message);
    //   })
    //   .on("end", function () {
    //     console.log(`${videos.length} videos merged successfully.`);
    //     resolve();
    //   });
  });
}

async function generateDescription(urls) {
  /* 

Credits:

@mediasidajd
@maksdjasda


*/
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

async function createVideoCompilation(urls, title, folder = DEFAULT_FOLDER) {
  const path = `${__dirname}/videos/${folder}`;

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
};
