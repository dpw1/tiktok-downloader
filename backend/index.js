const express = require("express");
const cors = require("cors");
const lowDb = require("lowdb");
const fs = require("fs-extra");

const FileSync = require("lowdb/adapters/FileSync");
const {
  createVideoCompilation,
  downloadVideo,
  processVideos,
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

  const videos = req.body.videos;

  for (const [index, video] of videos.entries()) {
    if (
      !video.includes("tiktok") ||
      !video.includes("@") ||
      !video ||
      video.trim() === ""
    ) {
      return res.status(404).send({
        error: `The URL at line ${index + 1} is incorrect.`,
      });
    }
  }

  try {
    const response = await createVideoCompilation(videos);
    console.log(response);
    return res.send({ folder: response.folder });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

(async () => {
  const videos = [
    `https://www.tiktok.com/@maditasbibliotheca/video/7077915775994023173`,
    `https://www.tiktok.com/@caitsbooks/video/7086470926451133739`,
  ];

  /* === */

  await processVideos(videos);
  // process.exit(0);
})();
