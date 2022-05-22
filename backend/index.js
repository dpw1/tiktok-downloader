const express = require("express");
const cors = require("cors");
const lowDb = require("lowdb");
const fs = require("fs-extra");

const FileSync = require("lowdb/adapters/FileSync");
const {
  createVideoCompilation,
  downloadVideo,
  processVideos,
  mergeVideos,
} = require("./utils");

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
  // const data = db.get("users").value();
  return res.json({ data: "ello" });
});

/* Download videos */
app.post("/", async (req, res) => {
  if (!req.body.hasOwnProperty("videos")) {
    return res.send({ error: "No videos received" });
  }

  const title = req.body.title;
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
    const response = await createVideoCompilation(videos, title);
    console.log(response);
    return res.send({ folder: response.folder });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

(async () => {
  // const videos = [
  //   `https://www.tiktok.com/@maditasbibliotheca/video/7077915775994023173`,
  //   `https://www.tiktok.com/@caitsbooks/video/7086470926451133739`,
  // ];
  // const videos = [
  //   `https://www.tiktok.com/@vitekjanda/video/6792182951573474565`,
  //   `https://www.tiktok.com/@madelinestraveling/video/6957661815920676101`,
  // ];
  /* === */
  // await createVideoCompilation(videos);
  // await mergeVideos(`compilation_video`);
  // process.exit(0);
})();
