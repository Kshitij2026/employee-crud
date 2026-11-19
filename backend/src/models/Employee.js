import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  department: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  salary: { type: Number, required: true, min: 0 },
  photoKey: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model("Employee", employeeSchema);
