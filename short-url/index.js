const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { connectToMongoDb } = require("./connect");
const { restrictToLoggedinUserOnly, checkAuth } = require("./middlewares/auth");
const URL = require("./models/url");

const urlRoute = require("./routes/url");
const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");

const app = express();

const PORT = 8001;

connectToMongoDb("mongodb://localhost:27017/short-url").then(() =>
  console.log("mongodb conneceted")
);

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/url", restrictToLoggedinUserOnly, urlRoute);
app.use("/user", userRoute);
app.use("/", checkAuth, staticRoute);

app.get("/url/:shortId", async (req, res) => {
  try {
    const shortId = req.params.shortId;
    const entry = await URL.findOneAndUpdate(
      {
        shortId,
      },
      {
        $push: {
          visitHistroy: {
            timestamp: Date.now(),
          },
        },
      },
      { new: true } // Ensures the updated document is returned.
    );

    // Check if entry exists
    if (!entry) {
      return res.status(404).send("Short URL not found.");
    }

    // Redirect to the original URL
    res.redirect(entry.redirectURL);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send("Internal Server Error.");
  }
});

app.listen(PORT, () => console.log(`Server listining at PORT: ${PORT}`));
