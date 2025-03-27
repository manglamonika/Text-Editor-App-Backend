import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";
import stream from "stream";

dotenv.config();
const app = express();

// ✅ Configure CORS to allow frontend requests
const corsOptions = {
  origin: "https://text-editor-monika.netlify.app/", // Change this if needed
  methods: "GET,POST,PUT,DELETE",
  credentials: true, // Allow cookies and credentials
};
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Google Drive Authentication
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: "v3", auth: oauth2Client });

// ✅ Save File to Google Drive
app.post("/save-to-drive", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required!" });

    // Convert content to a Readable Stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(`<html><body>${content}</body></html>`, "utf-8"));

    const fileMetadata = {
      name: "Letter",
      mimeType: "application/vnd.google-apps.document",
    };

    const media = {
      mimeType: "text/html",
      body: bufferStream,
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    res.json({ fileId: file.data.id, message: "File saved as Google Docs!" });
  } catch (error) {
    console.error("Google Drive API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Fetch Only "Letter" Files from Google Drive
app.get("/get-drive-files", async (req, res) => {
  try {
    const response = await drive.files.list({
      q: "name contains 'Letter'", // ✅ Only fetch files with "Letter" in name
      pageSize: 10,
      fields: "files(id, name, createdTime, webViewLink)",
    });

    res.json({ files: response.data.files });
  } catch (error) {
    console.error("Error fetching files from Drive:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log("✅ Server running on port 5000"));
