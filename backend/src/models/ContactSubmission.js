import mongoose from "mongoose";

const contactSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: "" },
    modality: {
      type: String,
      enum: ["online", "presencial", "ambos", "no-se"],
      default: "no-se",
    },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    locale: { type: String, enum: ["es", "pt"], default: "es" },
    status: { type: String, enum: ["new", "read"], default: "new" },
  },
  { timestamps: true }
);

contactSubmissionSchema.index({ createdAt: -1 });

contactSubmissionSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ContactSubmission = mongoose.model(
  "ContactSubmission",
  contactSubmissionSchema
);
