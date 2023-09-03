import { Router } from 'express';
import multer, { diskStorage } from 'multer';
const router = Router();

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

// Handle file upload
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Access information about the uploaded file
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Implement your file handling logic here
    // For example, you can save the file path to a database or process the file

    return res.status(200).json({ message: 'File uploaded successfully' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
