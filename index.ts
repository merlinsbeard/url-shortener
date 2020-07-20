// https://dev.to/aligoren/building-url-shortener-with-mongodb-express-framework-and-typescript-4a71
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { nanoid } from "nanoid";
import mongoose, { Document, Schema } from "mongoose";
import sgMail from "@sendgrid/mail"
require("mongoose-type-url");

dotenv.config();

const app: express.Application = express();
app.use(helmet());
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.static("./public"));

const mongoDB: string =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/shorter";

mongoose.Promise = global.Promise;
mongoose
  .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to mongodb"))
  .catch(function (err) {
    console.error(`Could not connect ${err}`);
  });

interface IURL extends mongoose.Document {
  longUrl: string;
  shortUrl: string;
}

const UrlModel = mongoose.model<IURL>(
  "URL",
  new Schema({
    longUrl: {
      required: true,
      type: String,
      trim: true,
    },
    shortUrl: {
      required: true,
      type: String,
      unique: true,
      trim: true,
      maxlength: 5,
    },
  })
);

app.get("/hi", (req, res) => res.send("hello 🌊"));

const validURL = (str: string) => {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" +
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
      "((\\d{1,3}\\.){3}\\d{1,3}))" +
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
      "(\\?[;&a-z\\d%_.~+=-]*)?" +
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return !!pattern.test(str);
};

interface EmailRequest {
  to: string,
  from: string,
  subject: string,
  text: string,
  html: string
}

app.post("/email", async (req: express.Request, res: express.Response, next: express.NextFunction) => {

  const { body, subject } = req.body

  if (!body || !subject) {
    return res.status(400).send("Missing body or Subject");
  }

  const msg: EmailRequest = {
    to: process.env.EMAIL_TO || 'me+emailer@sample.xyz',
    from: process.env.EMAIL_FROM || 'me+sendgrid@sample.xyz',
    subject: subject,
    text: body,
    html: body
  };

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')
    const resp = await sgMail.send(msg)
    return res.send("success!").status(202)
  } catch (error) {
    return res.send(error.response.body).status(400)
  }
})

app.post("/short", async (req, res, next) => {
  let { longUrl, shortUrl } = req.body;

  console.log(shortUrl);

  try {
    if (!shortUrl) {
      shortUrl = nanoid(5);
    } else {
      const URL = await UrlModel.findOne({ shortUrl });
      if (URL) {
        throw new Error("short url is alreay used");
      }
    }

    const isValidUrl = validURL(longUrl);
    console.log(isValidUrl);
    if (!isValidUrl) {
      throw new Error("Invalid URL");
    }

    const validateURL = new UrlModel({ longUrl, shortUrl });
    await validateURL.save();
    return res.send(validateURL);
  } catch (error) {
    next(error);
  }
});

// Redirects to shortUrl url
app.get("/:id", async (req, res) => {
  const { id: shortUrl } = req.params;
  try {
    const url = await UrlModel.findOne({ shortUrl });
    if (url) {
      return res.redirect(url.longUrl);
    }
    return res.status(404).send("Not Found");
  } catch (error) {
    return res.status(404).send("Not Found");
  }
});

app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.log(error);
    if (error.status) {
      res.status(error.status);
    } else {
      res.status(400);
    }
    console.log(error.stack);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? "hmm" : error.stack,
    });
  }
);

const PORT: number = parseInt(process.env.PORT as string, 10) || 1337;
const HOST: string = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`App is listening on ${HOST}:${PORT}!`);
});
