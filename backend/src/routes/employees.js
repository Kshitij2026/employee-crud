import { Router } from "express";
import crypto from "node:crypto";
import path from "node:path";
import Employee from "../models/Employee.js";
import s3 from "../config/s3.js";
import { upload } from "../middleware/upload.js";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = Router();
const bucket = () => {
  if (!process.env.S3_BUCKET_NAME) throw new Error("S3_BUCKET_NAME is not configured.");
  return process.env.S3_BUCKET_NAME;
};

async function withPhotoUrl(employee) {
  const item = employee.toObject ? employee.toObject() : { ...employee };
  item.photoUrl = item.photoKey
    ? await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket(), Key: item.photoKey }), { expiresIn: 900 })
    : null;
  delete item.photoKey;
  return item;
}

router.get("/", async (_req, res, next) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(await Promise.all(employees.map(withPhotoUrl)));
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(await withPhotoUrl(employee));
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ message: "Employee not found." });
    res.json(await withPhotoUrl(employee));
  } catch (err) { next(err); }
});

router.post("/:id/photo", upload.single("photo"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Choose an image first." });
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found." });

    const extension = path.extname(req.file.originalname).toLowerCase();
    const key = `employee-photos/${req.params.id}/${crypto.randomUUID()}${extension}`;
    await s3.send(new PutObjectCommand({
      Bucket: bucket(), Key: key, Body: req.file.buffer,
      ContentType: req.file.mimetype
    }));

    if (employee.photoKey) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: employee.photoKey }));
    }
    employee.photoKey = key;
    await employee.save();
    res.json(await withPhotoUrl(employee));
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found." });
    if (employee.photoKey) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: employee.photoKey }));
    }
    res.json({ message: "Employee deleted." });
  } catch (err) { next(err); }
});

export default router;
