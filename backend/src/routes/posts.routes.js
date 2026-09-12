import { Router } from "express";
import { Post } from "../models/Post.js";
import { requireAuth } from "../middleware/auth.js";
import { translatePost } from "../utils/translate.js";

const router = Router();

// Únicos campos que un admin puede fijar directamente (crear o editar):
// evita que se puedan inyectar translationGroup/translatedByAI/publishedAt
// u otros campos gestionados internamente por el modelo.
const WRITABLE_FIELDS = [
  "title",
  "slug",
  "locale",
  "excerpt",
  "content",
  "coverImage",
  "tags",
  "status",
  "seoTitle",
  "seoDescription",
];

function pickWritableFields(body) {
  const result = {};
  WRITABLE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) result[field] = body[field];
  });
  return result;
}

async function findTranslations(post, { publishedOnly }) {
  if (!post.translationGroup) return [];

  const filter = {
    translationGroup: post.translationGroup,
    locale: { $ne: post.locale },
    _id: { $ne: post._id },
  };
  if (publishedOnly) filter.status = "published";

  const siblings = await Post.find(filter).select("locale slug title status");
  return siblings.map((sibling) => ({
    id: sibling._id,
    locale: sibling.locale,
    slug: sibling.slug,
    title: sibling.title,
    status: sibling.status,
  }));
}

// Listado público: solo posts publicados de un locale, paginado.
router.get("/", async (req, res, next) => {
  try {
    const locale = req.query.locale === "pt" ? "pt" : "es";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 50);
    const tag = req.query.tag;

    const filter = { status: "published", locale };
    if (tag) filter.tags = tag;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// Listado completo (borradores incluidos) para el panel de administración.
router.get("/admin/list", requireAuth, async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/:id", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post no encontrado" });

    const translations = await findTranslations(post, { publishedOnly: false });
    res.json({ post: { ...post.toJSON(), translations } });
  } catch (err) {
    next(err);
  }
});

// Detalle público por slug + locale (solo publicados).
router.get("/:slug", async (req, res, next) => {
  try {
    const locale = req.query.locale === "pt" ? "pt" : "es";
    const post = await Post.findOne({
      slug: req.params.slug,
      locale,
      status: "published",
    });
    if (!post) return res.status(404).json({ error: "Post no encontrado" });

    const translations = await findTranslations(post, { publishedOnly: true });
    res.json({ post: { ...post.toJSON(), translations } });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.create(pickWritableFields(req.body));
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
});

// Crea un borrador vinculado como traducción de un post existente (mismo translationGroup).
router.post("/:id/translate", requireAuth, async (req, res, next) => {
  try {
    const { locale } = req.body;
    if (!["es", "pt"].includes(locale)) {
      return res.status(400).json({ error: "Idioma inválido" });
    }

    const original = await Post.findById(req.params.id);
    if (!original) return res.status(404).json({ error: "Post no encontrado" });
    if (original.locale === locale) {
      return res.status(400).json({ error: "Ese idioma ya corresponde a este artículo" });
    }

    let groupId = original.translationGroup;
    if (!groupId) {
      groupId = original._id.toString();
      original.translationGroup = groupId;
      await original.save();
    } else {
      const existing = await Post.findOne({ translationGroup: groupId, locale });
      if (existing) {
        return res.status(409).json({
          error: "Ya existe una traducción en ese idioma para este artículo",
          postId: existing._id,
        });
      }
    }

    // Se intenta traducir automáticamente (gratis, vía Google Translate no
    // oficial). Si falla (servicio caído/bloqueado), se cae de nuevo al
    // texto original como punto de partida, para que el flujo nunca se rompa.
    let fields = {
      title: original.title,
      excerpt: original.excerpt,
      content: original.content,
      seoTitle: original.seoTitle,
      seoDescription: original.seoDescription,
      tags: original.tags,
    };
    let translatedByAI = false;

    try {
      const translated = await translatePost(original, original.locale, locale);
      fields = {
        title: translated.title || fields.title,
        excerpt: translated.excerpt || fields.excerpt,
        content: translated.content || fields.content,
        seoTitle: translated.seoTitle || fields.seoTitle,
        seoDescription: translated.seoDescription || fields.seoDescription,
        tags: translated.tags?.length ? translated.tags : fields.tags,
      };
      translatedByAI = true;
    } catch (translateErr) {
      console.error("[translate] Falló la traducción automática, se copia el original:", translateErr.message);
    }

    // Sin slug explícito: se autogenera a partir del título ya traducido.
    const translation = await Post.create({
      ...fields,
      locale,
      coverImage: original.coverImage,
      status: "draft",
      translationGroup: groupId,
      translatedByAI,
    });

    res.status(201).json({ post: translation, translatedByAI });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post no encontrado" });

    // Se cargan los campos uno por uno (en vez de findByIdAndUpdate) para que
    // el hook pre('validate') del modelo corra en contexto de documento real:
    // así "publishedAt" y la re-generación del slug funcionan también al
    // editar (no solo al crear).
    WRITABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    await post.save();
    res.json({ post });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: "Post no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
