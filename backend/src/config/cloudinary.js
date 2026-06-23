const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

const uploadBuffer = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({
    folder: 'campus-pulse/complaints',
    resource_type: 'image',
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
  }, (error, result) => (error ? reject(error) : resolve(result)));
  stream.end(buffer);
});

const destroyImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
};

module.exports = { cloudinary, upload, uploadBuffer, destroyImage };
