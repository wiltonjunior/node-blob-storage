require("dotenv").config();

const path = require("path");
const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const multer = require("multer");
const inMemoryStorage = multer.memoryStorage();
const uploadStratedy = multer({ storage: inMemoryStorage }).single("image");

const config = require("./config");

const containerName = "images";
const azureStorage = require("azure-storage");
const blobService = azureStorage.createBlobService();

const getStream = require("into-stream");

const getBlobName = (originalName) => {
  const indetifier = Math.random().toString().replace(/0\./, "");
  return `${indetifier}-${originalName}`;
};

app.post("/upload", uploadStratedy, (req, res) => {
  const blobName = getBlobName(req.file.originalname);
  const stream = getStream(req.file.buffer); 
  const streamLength = req.file.buffer.length;
  blobService.createBlockBlobFromStream(
    containerName,
    blobName,
    stream,
    streamLength,
    (err) => {
      if (err) {
        console.log(err);
      }
      res.status(200).send("Success");
    }
  );
});

app.get("/all", (req, res) => {
    blobService.listBlobsSegmented(containerName, null, (err, data) => {
        if(err){
            console.log(err);
            return;
        }else {
            let image = '';
            if(data.entries.length){
                data.entries.forEach(element => {
                    image += `<img src="https://${config.getStorageAccountName()}.blob.core.windows.net/${containerName}/${element.name}" width="500" />`
                })
                res.send(image)
            }
        }
    })
});

app.listen(3000, () => {
  console.log("Server Started");
});
