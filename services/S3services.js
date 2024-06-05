const AWS = require('aws-sdk');

exports.uploadToS3 = (data, filename) => {
    const BUCKET_NAME = process.env.BUCKET_NAME;
    const IAM_USER_KEY = process.env.IAM_USER_KEY;
    const IAM_USER_SECRET = process.env.IAM_USER_SECRET;

    let s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET
    })

    var params = {
        Bucket: BUCKET_NAME,
        Body: data,
        Key: filename,
        ACL: 'public-read'
    }

    return new Promise((resolve, reject) => {
        s3bucket.upload(params, (err, response) => {
            if (err) {
                reject(err)
            } else {
                resolve(response.Location)
            }
        })
    })
}