
const path = require("path");
const fs = require("fs");
const { s3 } = require("../config/aws");
const { S3_ENABLE } = require("./Constants");

module.exports = {
  /**
   * @description This function use for uploading the file through base64.
   * @param fileName
   * @param storagePath
   * @param file
   * @param res
   * @returns {*}
   */
  base64ImageUpload: async (fileName, storagePath, file, res) => {
    return new Promise(async (resolve, reject) => {
      try {
        const base64 = file;
        const extension = base64.split(";")[0].split("/")[1];
        const decodedImage = Buffer.from(
          base64.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );

        if (process.env.S3_ENABLE === S3_ENABLE) {
          const params = {
            Bucket: process.env.AMZ_BUCKET,
            Key: `${storagePath}/${fileName}`,
            Body: decodedImage,
            ACL: "public-read",
            ContentType: `image/${extension}`,
          };

          s3.putObject(params, (perr, pres) => {
            if (perr) {
              reject({ code: 500, perr });
            } else {
              return resolve({ code: 200, body: pres });
            }
          });
        } else {
          const newLocation = path.join(__dirname, "../../public/uploads") + "/" + storagePath + "/";
          if (!fs.existsSync(newLocation)) {
            fs.mkdirSync(newLocation, { recursive: true });
          }
          fs.writeFileSync(`${newLocation}/${fileName}`, decodedImage);
          return resolve({ code: 200 });
        }
      } catch (error) {
        console.log("Error uploading image:", error);
        reject({ code: 500, error });
      }
    });
  },

  /**
   * @description This function use to remove the file.
   * @param file
   * @param storagePath
   * @param res
   * @returns {*}
   */
  removeOldImage: (file, storagePath, res) =>
    new Promise((resolve, reject) => {
      console.log({
        file: file,
        storagePath: storagePath,
      });
      if (process.env.S3_ENABLE === S3_ENABLE) {
        const params = {
          Bucket: `${process.env.AMZ_BUCKET}/${storagePath}`,
          Key: file,
        };
        try {
          return s3.deleteObject(params, (err, data) => {
            if (data) {
              resolve({
                code: 200,
                body: data,
              });
            }
            return reject({
              code: 500,
              err: err,
            });
          });
        } catch {
          return reject({
            code: 500,
            err: err,
          });
        }
      } else {
        const filePath =
          path.join(__dirname, "../../public/uploads") +
          "/" +
          storagePath +
          "/";
        fs.unlink(`${filePath}${file}`, function (error) {
          if (error) {
            return reject({
              code: 500,
              err: error,
            });
          }
          resolve(true);
        });
      }
      return null;
    }).catch((error) => {
      return null;
    }),

  /**
   * @description This function use for generating image link
   * @param folder
   * @param name
   * @returns {*}
   */

  mediaUrlForS3: (folder, userId, filename) => {
    if (
      userId &&
      userId !== "" &&
      filename &&
      filename !== ""
    ) {
      if (process.env.S3_ENABLE === S3_ENABLE) {
        return `${process.env.AMZ_BUCKET_URL}/${folder}/${userId}/${filename}`;
      } else {
        return `${process.env.API_URL}public/uploads/${folder}/${userId}/${filename}`;
      }
    }
    return "";
  }
};
