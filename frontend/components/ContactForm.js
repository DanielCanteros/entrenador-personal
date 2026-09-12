"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitContact } from "../lib/api.js";
import WhatsAppButton from "./WhatsAppButton.js";

const initialState = { name: "", email: "", phone: "", modality: "no-se", message: "" };

export default function ContactForm() {
  const t = useTranslations("contactForm");
  const locale = useLocale();
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    try {
      await submitContact({ ...form, locale });
      setStatus("success");
      setForm(initialState);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="contact-form-wrapper">
      <form className="contact-form card" onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <label className="field">
            <span>{t("name")}</span>
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>{t("email")}</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
        </div>

        <div className="grid grid-2">
          <label className="field">
            <span>{t("phone")}</span>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label className="field">
            <span>{t("modality")}</span>
            <select name="modality" value={form.modality} onChange={handleChange}>
              <option value="online">{t("modalityOptions.online")}</option>
              <option value="presencial">{t("modalityOptions.presencial")}</option>
              <option value="no-se">{t("modalityOptions.no-se")}</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>{t("message")}</span>
          <textarea
            name="message"
            rows={5}
            value={form.message}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={status === "submitting"}>
          {status === "submitting" ? t("submitting") : t("submit")}
        </button>

        {status === "success" && <p className="contact-form__status is-success">{t("success")}</p>}
        {status === "error" && <p className="contact-form__status is-error">{t("error")}</p>}
      </form>

      <div className="contact-form__alt">
        <p>{t("whatsappAlt")}</p>
        <WhatsAppButton>WhatsApp</WhatsAppButton>
      </div>
    </div>
  );
}
