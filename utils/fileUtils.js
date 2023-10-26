// const { url } = require('inspector');
const path = require("path");
const dotenv = require("dotenv");
// const asyncHandler = require('../middleware/async');
// const { ErrorResponseJSON } = require("./errorResponse");
const { token, rand } = require("./utils");
// const router = require("express").Router();

dotenv.config({ path: "./config/.env" });
const multer = require("multer");
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage }).single("image");
const { BlockBlobClient, BlobServiceClient } = require("@azure/storage-blob");
const getStream = require("into-stream");

// For get requests
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const config = require("./storageConfig");

const accountName = "osstoragelban";
const containerName = "eduportal";
const fileSizeLimit = 10 * 1024 * 1024 * 1024;

const handleError = (err, res) => {
  res.status(500);
  res.render("error", { error: err });
};

exports.multerUploadConfig = multer({ storage: inMemoryStorage }).fields([
  { name: "files", maxCount: 3 },
]);

exports.sizeBelowLimit = (size, limit = fileSizeLimit) => {
  if (size > limit) throw new SyntaxError("Size is Above the Limit");
  // return false
  return true;
};

const getBlobName = (
  fileName,
  folderPath,
  identifierLength = 10,
  strict = false
) => {
  const extension = path.extname(fileName); // get file extension
  const nameOnly = path.basename(fileName, extension); // get file name without extension
  // console.log("name, extension, rand:", nameOnly, extension, rand());

  let identifier = token(identifierLength);
  if (strict) identifier = identifier.replace(/0\./, ""); // not needed

  return `${folderPath}${nameOnly}-${identifier}${extension}`;
};

const getBlobUrl = (accountName, containerName, blobName) => {
  let url = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
  return url;
};

const getFullFolderPath = (folderPath = undefined, parentDir = undefined) => {
  parentDir = parentDir ? `${parentDir}/` : "";
  folderPath = folderPath ? `${folderPath}/` : "";
  // console.log(parentDir, folderPath)
  let fullFolderPath = `${parentDir}${folderPath}`;
  return fullFolderPath;
};

const getFileExtension = (fname) => {
  return fname.slice((Math.max(0, fname.lastIndexOf(".")) || Infinity) + 1);
};

exports.isVideoFile = (file) => {
  const acceptedTypes = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-flv",
    "video/webm",
    "video/x-matroska",
  ];
  // Check file MIME type
  if (acceptedTypes.includes(file.mimetype)) {
    return true;
  }

  // Check file extension
  const acceptedExtensions = [
    ".mp4",
    ".mpeg",
    ".mov",
    ".avi",
    ".flv",
    ".webm",
    ".mkv",
  ];
  const fileExtension = file.name.split(".").pop().toLowerCase();
  if (acceptedExtensions.includes(fileExtension)) {
    return true;
  }

  return false;
};

/**
 * @summary
 *  upload a document and return the document url
 *
 * @param req - request object
 * @param project - the project the files are being uploaded for
 * @param files - req.files or a similarly structured queryset
 * @param parentDir - parent directory
 * @param folderPath - path to the destination folder from the parent directory
 *
 * @returns link to uploaded document
 */
exports.uploadVideo = async (
  req,
  files = undefined,
  folderPath = "video",
  parentDir = ""
) => {
  files = files ? files : req.files;
  if (!files) {
    console.log("There are no Files Provided for Upload");
    return undefined;
  }
  let title = project.title || project.projectTitle;
  parentDir = parentDir ? parentDir : title;
  console.log("files, parentDir, folderPath:", files, parentDir, folderPath);

  const links = await this.uploadBlob(req, files, folderPath, parentDir);
  return links;
};

exports.uploadDocument = async (
  req,
  project,
  files = undefined,
  folderPath = undefined,
  parentDir = undefined
) => {
  /**
   * @summary
   *  upload a document and return the document url
   *
   * @param req - request object
   * @param project - the project the files are being uploaded for
   * @param files - req.files or a similarly structured queryset
   * @param parentDir - parent directory
   * @param folderPath - path to the destination folder from the parent directory
   *
   * @returns link to uploaded document
   */
  files = files ? files : req.files;
  if (!files) {
    console.log("There are no Files Provided for Upload");
    return undefined;
  }
  let title = project.title || project.projectTitle;
  parentDir = parentDir ? parentDir : title;
  console.log("files, parentDir, folderPath:", files, parentDir, folderPath);

  const links = await this.uploadBlob(req, files, folderPath, parentDir);
  return links;
};

exports.getFileExtensions = async (req, files = undefined) => {
  /**
   * @summary
   *  upload a blob and return the blob url
   *
   * @param req - request object
   * @param files - req.files or a similarly structured queryset parent directory
   *
   * @returns array of uploaded blob fileExtensions
   */
  let fileExtensions = [];
  files = files || req.files; // files = files? files: req.files

  if (!files)
    throw new ReferenceError(
      (message = "There are no Files Provided for Upload")
    );

  for (const [key, file] of Object.entries(files)) {
    fileExtensions.push(this.getFileExtension(file.name));
  }
  return fileExtensions;
};

// exports.getFileDurations = async (links = []) => {
//   /**
//    * @summary
//    *  upload a blob and return the blob url
//    *
//    * @param req - request object
//    * @param files - req.files or a similarly structured queryset parent directory
//    *
//    * @returns array of uploaded blob fileDurations
//    */
//   const { getVideoDurationInSeconds } = require("get-video-duration");

//   let fileDurations = [];

//   for (const link of links) {
//     const duration = await getVideoDurationInSeconds(link);
//     console.log({ duration });
//     fileDurations.push(duration || 0);
//   }
//   return fileDurations;
// };

exports.calculateFileDuration = async (file) => {
  const fs = require("fs").promises;
  const buff = Buffer.alloc(100);
  const header = Buffer.from("mvhd");

  async function main() {
    // const file = await fs.open("video.mp4", "r");
    const { buffer } = await file.read(buff, 0, 100, 0);
    console.log({ buffer });
    // await file.close();

    const start = buffer.indexOf(header) + 17;
    const timeScale = buffer.readUInt32BE(start);
    const duration = buffer.readUInt32BE(start + 4);

    const audioLength = Math.floor((duration / timeScale) * 1000) / 1000;

    console.log(buffer, header, start, timeScale, duration, audioLength);
  }

  await main();
};

exports.getFileDurations = async (req, files = undefined) => {
  /**
   * @summary
   *  upload a blob and return the blob url
   *
   * @param req - request object
   * @param files - req.files or a similarly structured queryset parent directory
   *
   * @returns array of uploaded blob fileDurations
   */
  const { getVideoDurationInSeconds } = require("get-video-duration");
  const fs = require("fs");

  let fileDurations = [];
  files = files || req.files; // files = files? files: req.files

  if (!files)
    throw new ReferenceError(
      (message = "There are no Files Provided for Upload")
    );

  for (const [key, file] of Object.entries(files)) {
    console.log({ file, duration: file.duration });
    if (this.isVideoFile(file)) {
      // // const fileByteArray = await getByteArray(file)
      // // console.log({fileByteArray})
      // const fileBuffer = await fs.readFileSync(file.name)
      // console.log(fileBuffer)
      // const stream = fs.createReadStream(fileByteArray);
      // console.log({stream})
      // // const duration = await getVideoDurationInSeconds(stream);
      // const duration = await getVideoDurationInSeconds(stream);

      const duration = await this.calculateFileDuration(file);
      console.log({ duration });
      fileDurations.push(duration || 0);
    } else {
      fileDurations.push(0);
    }
  }
  return fileDurations;
};

exports.getFileNames = async (req, files = undefined) => {
  /**
   * @summary
   *  upload a blob and return the blob url
   *
   * @param req - request object
   * @param files - req.files or a similarly structured queryset parent directory
   *
   * @returns array of uploaded blob fileNames
   */
  let fileNames = [];
  files = files || req.files; // files = files? files: req.files

  if (!files)
    throw new ReferenceError(
      (message = "There are no Files Provided for Upload")
    );

  for (const [key, file] of Object.entries(files)) {
    fileNames.push(file.name);
  }
  return fileNames;
};

exports.uploadBlobV2 = async (
  req,
  files = undefined,
  folderPath = undefined,
  parentDir = undefined
) => {
  /**
   * @summary
   *  upload a blob and return the blob url
   *
   * @param req - request object
   * @param files - req.files or a similarly structured queryset
   * @param parentDir - parent directory
   * @param folderPath - path to the destination folder from the parent directory
   *
   * @returns array of uploaded blob linksObj
   */
  // try {

  // } catch (err) {
  //   console.log(err.message)
  //   throw err
  // }
  let linksObj = {};
  files = files || req.files; // files = files? files: req.files

  let fullFolderPath = getFullFolderPath(folderPath, parentDir);
  // console.log("parentDir, folderPath, fullFolderPath:", parentDir, folderPath, fullFolderPath)

  if (!files)
    throw new ReferenceError(
      (message = "There are no Files Provided for Upload")
    );

  for (const [key, file] of Object.entries(files)) {
    this.sizeBelowLimit(file.size); // check if file size is below the size limit
    console.log({ key, file });
    let blobName = getBlobName(file.name, fullFolderPath); // generate unique name for blob
    let blobService = new BlockBlobClient(
      process.env.AZURE_STORAGE_CONNECTION_STRING,
      containerName,
      blobName
    );

    // get file buffer
    let stream = getStream(file.data);
    let streamLength = file.data.length;

    let upload = await blobService.uploadStream(stream, streamLength);

    let link = getBlobUrl(accountName, containerName, blobName); // get blob file url
    console.log({ preLink: link });
    linksObj[key] = link;
  }
  console.log({ linksObj });
  return linksObj;
};

exports.uploadBlob = async (
  req,
  files = undefined,
  folderPath = undefined,
  parentDir = undefined
) => {
  /**
   * @summary
   *  upload a blob and return the blob url
   *
   * @param req - request object
   * @param files - req.files or a similarly structured queryset
   * @param parentDir - parent directory
   * @param folderPath - path to the destination folder from the parent directory
   *
   * @returns array of uploaded blob links
   */
  let links = [];
  files = files || req.files; // files = files? files: req.files

  let fullFolderPath = getFullFolderPath(folderPath, parentDir);
  // console.log("parentDir, folderPath, fullFolderPath:", parentDir, folderPath, fullFolderPath)

  if (!files)
    throw new ReferenceError(
      (message = "There are no Files Provided for Upload")
    );

  for (const [key, file] of Object.entries(files)) {
    this.sizeBelowLimit(file.size); // check if file size is below the size limit

    let blobName = getBlobName(file.name, fullFolderPath); // generate unique name for blob
    let blobService = new BlockBlobClient(
      process.env.AZURE_STORAGE_CONNECTION_STRING,
      containerName,
      blobName
    );

    // get file buffer
    let stream = getStream(file.data);
    let streamLength = file.data.length;

    let upload = await blobService.uploadStream(stream, streamLength);

    let link = getBlobUrl(accountName, containerName, blobName); // get blob file url
    links.push(link);
  }
  return links;
};

exports.getBlobs = async (prefix = "", flat = false) => {
  /**
   * @summary
   *  get an object with container details and a formatted list of all blobs in a container or container subfolder
   *
   * @param flat - specify if list of blobs should be flattened (Bool)
   * @param prefix - container folder or subfolder
   *
   * @returns object with container details and blobs
   */
  let viewData;
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    // an array of blobs
    let allBlobs;
    if (flat) {
      allBlobs = await flatListBlobs(containerClient);
    } else {
      allBlobs = await listBlobs(containerClient, prefix);
    }

    viewData = {
      title: "Home",
      viewName: "index",
      accountName: config.getStorageAccountName(),
      containerName: containerName,
      folderName: prefix,
      thumbnails: allBlobs || [],
    };
    // console.log("containerClient: ", containerClient)
  } catch (err) {
    viewData = {
      title: "Error",
      viewName: "error",
      message: "There was an error contacting the blob storage container.",
      error: err,
    };
    throw new ReferenceError(viewData.message);
  }
  console.log("viewData: ", viewData);
  return viewData;
};

// exports.listBlob = async (containerClient, prefix) => {
async function listBlobs(containerClient, prefix = "") {
  /**
   * @summary
   *  get a list of all blobs in a container or container subfolder with their heirarchy
   *  using a container client
   *
   * @param containerClient - azure blob service container client
   * @param prefix - container folder or subfolder
   *
   * @returns list of blobs
   */
  let innerBlobs = await containerClient.listBlobsByHierarchy("/", {
    prefix: prefix,
  });
  let thumbnails = [];
  for await (const innerBlob of innerBlobs) {
    // if blob represents a folder
    if (innerBlob.kind === "prefix") {
      innerBlob.thumbnails = [];
      let list = await listBlobs(containerClient, innerBlob.name);
      innerBlob.thumbnails = await innerBlob.thumbnails.concat(list);
    }
    // append blob to thumbnails
    thumbnails.push(innerBlob);
  }
  return thumbnails;
}

async function flatListBlobs(containerClient) {
  /**
   * @summary
   *  get a flattened list of all blobs in a container or container subfolder
   *  using a container client
   *
   * @param containerClient - azure blob service container client
   *
   * @returns list of blobs
   */
  let innerBlobs = await containerClient.listBlobsFlat();
  let thumbnails = [];
  for await (const innerBlob of innerBlobs) thumbnails.push(innerBlob);
  return thumbnails;
}

exports.getFileMetadataFromBlobStorage = async (
  blobName,
  containerName = "eduportal"
) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const allBlobs = await flatListBlobs(containerClient);
  // console.log({allBlobs})

  let blobService = new BlockBlobClient(
    process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName,
    blobName
  );
  // const result = blobService.getBlobMetadata(
  //   containerName,
  //   blobName,
  //   function (err, result, response) {
  //     if (err) {
  //       console.error("Couldn't fetch metadata for blob %s", blobName);
  //       console.error(err);
  //     } else if (!response.isSuccessful) {
  //       console.error(
  //         "Blob %s wasn't found container %s",
  //         blobName,
  //         containerName
  //       );
  //     } else {
  //       console.log("Successfully fetched metadata for blob %s", blobName);
  //       console.log(result.metadata);
  //     }
  //   }
  // );
  const result = await blobService.getProperties();
  return result;
};
