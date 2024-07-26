const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { getStorage } = require("firebase-admin/storage");
const { initializeApp } = require("firebase-admin/app");
const vision = require("@google-cloud/vision");
const { getDatabase } = require("firebase-admin/database");

initializeApp();

const client = new vision.ImageAnnotatorClient({
  keyFilename: "./service-accounts/mati-vision-9a8e8-firebase-adminsdk-y3vfs-534b1a0108.json",
});

exports.analyzeImage = onObjectFinalized(async (event) => {

  const bucket = getStorage().bucket(event.data.bucket);
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  console.log(`File uploaded: ${filePath}, Content type: ${contentType}`);

  if (!contentType || !contentType.startsWith("image/")) {
    console.log("Uploaded file is not an image.");
    return null;
  }


  try {

    const file = bucket.file(filePath);

    const [metadata] = await file.getMetadata();
    const [imageResponse] = await client.labelDetection(
      `gs://${event.data.bucket}/${event.data.name}`
    );
    console.log("Full image response:", imageResponse);
    const labels = imageResponse.labelAnnotations.map(
      (label) => label.description
    );
    console.log('Labels?: ', labels)

    const db = getDatabase();
    const ref = db.ref("analisis").push();

    await ref.set({
      nombreArchivo: metadata.name,
      descriptionAPI: labels,
    });
  } catch (error) {
    console.log(error);
  }
});
