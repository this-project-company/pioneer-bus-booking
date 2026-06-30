import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadBusImage(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "pioneer/buses",
        public_id: `bus_${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}`,
        transformation: [
          { width: 1200, height: 800, crop: "fill", gravity: "center" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
}

export async function deleteBusImage(imageUrl: string): Promise<void> {
  const parts = imageUrl.split("/");
  const publicIdWithExt = parts.slice(-2).join("/");
  const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
  await cloudinary.uploader.destroy(publicId);
}
