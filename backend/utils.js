const TikTokScraper = require("tiktok-scraper");
const fs = require("fs-extra");
const http = require("https");
const fluent_ffmpeg = require("fluent-ffmpeg");

async function downloadVideo(url, folder) {
  const TITLE_CHARACTER_LIMIT = 50;

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

async function mergeVideos(folder) {
  return new Promise(async (resolve, reject) => {
    const path = `${__dirname}/videos/${folder}`;

    var mergedVideo = fluent_ffmpeg();
    const _videos = await fs.readdir(path);
    const videos = _videos.map((e) => `${path}/${e}`);

    // console.log("videos: ", videos);

    videos.forEach(function (name) {
      console.log(name);
      mergedVideo = mergedVideo.addInput(name);
    });

    mergedVideo
      .mergeToFile(`${path}/compilation.mp4`, "./tmp/")
      .on("error", function (err) {
        reject(err.message);
      })
      .on("end", function () {
        console.log(`${videos.length} videos merged successfully.`);
        resolve();
      });
  });
}

async function generateDescription(urls) {
  /* 

Credits:

@mediasidajd
@maksdjasda


*/
}

async function downloadVideos(urls, folder = `compilation`) {
  return new Promise(async (resolve, reject) => {
    for (const [i, url] of urls.entries()) {
      try {
        await downloadVideo(url, folder);

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

async function createVideoCompilation(urls, title, folder = `test`) {
  return new Promise(async (resolve, reject) => {
    try {
      await downloadVideos(urls, folder);
      await mergeVideos(folder);
      resolve(true);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  createVideoCompilation: createVideoCompilation,
  mergeVideos: mergeVideos,
};
