const router = require('express').Router();
const ctrl   = require('../controllers/complaint.controller');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const validateObjectId = require('../middleware/validateObjectId');

// Bug #15 fix: wrap multer upload in error-handling middleware
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return next(err); // passes to global error handler in app.js
    next();
  });
};

router.use(protect);
router.post('/',     handleUpload, ctrl.createComplaint);
router.get('/',      ctrl.getMyComplaints);
router.get('/:id',   validateObjectId(), ctrl.getComplaintById);
router.put('/:id',   validateObjectId(), handleUpload, ctrl.updateComplaint);
router.delete('/:id',validateObjectId(), ctrl.deleteComplaint);
router.post('/:id/comments', validateObjectId(), ctrl.addComment);

module.exports = router;
