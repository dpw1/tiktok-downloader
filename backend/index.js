const express = require("express");
const cors = require("cors");
const lowDb = require("lowdb");
const fs = require("fs-extra");

const FileSync = require("lowdb/adapters/FileSync");
const {
  createVideoCompilation,
  getTotalTime,
  getInfoFromVideoFolder,
  makeVideoCompilation,
  addEndingCreditsToVideos,
} = require("./utils");

/* Database init */
const db = lowDb(new FileSync("db.json"));
db.defaults({ videos: [] }).write();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  const videos = db.get("videos").value();
  return res.json({ videos });
});

/* Download videos */
app.post("/download", async (req, res) => {
  if (!req.body.hasOwnProperty("videos")) {
    return res.send({ error: "No videos received" });
  }

  if (!req.body.hasOwnProperty("title")) {
    return res.send({ error: "No folder title received" });
  }

  const videosDatabase = db.get("videos").value();

  const title = req.body.title;
  const videos = req.body.videos;

  /* Error check */
  for (const [index, video] of videos.entries()) {
    if (!video.includes("tiktok") || !video.includes("@")) {
      return res.status(404).send({
        error: `The URL at line ${index + 1} is incorrect.`,
      });
    }

    if (!video || video.trim() === "") {
      return res.status(404).send({
        error: `Line ${index + 1} is empty.`,
      });
    }

    let found = videosDatabase.filter((e) => e.url === video)[0];

    if (found && found.hasOwnProperty("title")) {
      return res.status(404).send({
        error: `Line ${index + 1} already exists in database.`,
      });
    }
  }

  /* Process videos */
  try {
    const response = await createVideoCompilation(videos, title);
    console.log("response: ", response);
    return res.send({ folder: response.folder });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

/* Get total time */
app.post("/totaltime", async (req, res) => {
  if (!req.body.hasOwnProperty("videos")) {
    return res.send({ error: "No videos received" });
  }

  const videos = req.body.videos;

  for (const [index, video] of videos.entries()) {
    if (!video.includes("tiktok") || !video.includes("@")) {
      return res.status(404).send({
        error: `The URL at line ${index + 1} is incorrect.`,
      });
    }

    if (!video || video.trim() === "") {
      return res.status(404).send({
        error: `Line ${index + 1} is empty.`,
      });
    }
  }

  try {
    console.log("getting", videos);
    const length = await getTotalTime(videos);
    console.log("Total time: ", length);
    return res.send({ length });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

(async () => {
  const videos = [
    `https://www.tiktok.com/@maditasbibliotheca/video/7077915775994023173`,
    `https://www.tiktok.com/@caitsbooks/video/7086470926451133739`,
  ];
  // const videos = [
  //   `https://www.tiktok.com/@vitekjanda/video/6792182951573474565`,
  //   `https://www.tiktok.com/@madelinestraveling/video/6957661815920676101`,
  // ];
  /* === */

  // await createVideoCompilation(videos);
  // process.exit(0);
  // const info = await getInfoFromVideoFolder(`tiktok_compilation_2`);
  // console.log(info);
  await addEndingCreditsToVideos(`test`);
  // await makeVideoCompilation(`test`);
})();
