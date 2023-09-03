import multer, { diskStorage } from 'multer';

// Configure multer
const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Specify how files will be named
  },
});

const upload = multer({ storage: storage });

export default upload;
