import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION || "ap-south-1" });
// On EC2, the SDK automatically obtains temporary credentials from the attached IAM role.
// Do not hardcode AWS access keys in this project.
export default s3;
