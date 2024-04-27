import multer from 'multer';

// class FileUpload {
//   constructor() {
//     this.upload = multer({
//       storage: multer.diskStorage({
//         destination: function (req, file, cb) {
//           cb(null, 'upload/');
//         },
//         filename: function (req, file, cb) {
//           cb(null, Date.now() + file.originalname);
//         }
//       }),
//       fileFilter: function (req, file, callback) {
//         if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
//           callback(null, true);
//         } else {
//           callback(null, false);
//         }
//       }
//     }).single("ProfileImage");
//   }
// }

// export const fileUpload = new FileUpload();

const multerUpload = multer({
    limits: {
        fileSize : 1024 * 1024 * 5
    }
})

const singleAvatar =  multerUpload.single("avatar")
const attachmentsMulter  = multerUpload.array("attachments")
export { singleAvatar , attachmentsMulter  }