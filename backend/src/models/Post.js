import mongoose from "mongoose";
import slugify from "slugify";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    locale: { type: String, enum: ["es", "pt"], required: true, default: "es" },
    excerpt: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true },
    coverImage: {
      url: { type: String, default: null },
      alt: { type: String, default: "" },
    },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date, default: null },
    seoTitle: { type: String, trim: true, default: "" },
    seoDescription: { type: String, trim: true, maxlength: 200, default: "" },
    // Vincula la versión es/pt del mismo artículo (opcional, mismo valor en ambos).
    translationGroup: { type: String, default: null },
    // true si este post se generó con traducción automática (IA) y todavía
    // no fue revisado/editado por un humano.
    translatedByAI: { type: Boolean, default: false },
  },
  { timestamps: true }
);

postSchema.index({ slug: 1, locale: 1 }, { unique: true });
postSchema.index({ status: 1, locale: 1, publishedAt: -1 });

postSchema.pre("validate", function preValidate(next) {
  const slugLocale = this.locale === "pt" ? "pt" : "es";
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true, locale: slugLocale });
  } else if (this.slug) {
    this.slug = slugify(this.slug, { lower: true, strict: true, locale: slugLocale });
  }

  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

postSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Post = mongoose.model("Post", postSchema);
