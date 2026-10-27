const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SECTION_ID = /^[a-z][a-z0-9-]{0,39}$/;
const THEME_IDS = ["cedar", "blueprint", "clay"];

function object(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validateProposal(value) {
  const errors = [];
  const text = (path, candidate, max, required = false) => {
    if (typeof candidate !== "string") {
      errors.push(`${path} must be a string`);
      return;
    }
    if (required && !candidate.trim()) errors.push(`${path} is required`);
    if (candidate.length > max) errors.push(`${path} must be ${max} characters or fewer`);
  };

  if (!object(value)) return { success: false, errors: ["proposal must be an object"] };
  if (value.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  text("slug", value.slug, 80, true);
  if (typeof value.slug === "string" && !SLUG.test(value.slug)) errors.push("slug has an invalid format");
  text("updatedAt", value.updatedAt, 40);

  if (!object(value.meta)) {
    errors.push("meta must be an object");
  } else {
    text("meta.title", value.meta.title, 140, true);
    text("meta.description", value.meta.description, 300, true);
    text("meta.theme", value.meta.theme, 30, true);
    if (!THEME_IDS.includes(value.meta.theme)) errors.push("meta.theme is not registered");
  }

  if (!object(value.hero)) {
    errors.push("hero must be an object");
  } else {
    text("hero.eyebrow", value.hero.eyebrow, 100);
    text("hero.title", value.hero.title, 180, true);
    text("hero.summary", value.hero.summary, 1200, true);
    text("hero.preparedFor", value.hero.preparedFor, 120, true);
  }

  if (!Array.isArray(value.sections)) {
    errors.push("sections must be an array");
  } else {
    if (value.sections.length < 1 || value.sections.length > 20) errors.push("sections must contain 1 to 20 items");
    const ids = new Set();
    value.sections.forEach((section, index) => {
      const base = `sections[${index}]`;
      if (!object(section)) {
        errors.push(`${base} must be an object`);
        return;
      }
      text(`${base}.id`, section.id, 40, true);
      if (typeof section.id === "string") {
        if (!SECTION_ID.test(section.id)) errors.push(`${base}.id has an invalid format`);
        if (ids.has(section.id)) errors.push(`${base}.id must be unique`);
        ids.add(section.id);
      }
      text(`${base}.eyebrow`, section.eyebrow, 100);
      text(`${base}.heading`, section.heading, 180, true);
      text(`${base}.body`, section.body, 4000, true);
      if (!Array.isArray(section.bullets)) {
        errors.push(`${base}.bullets must be an array`);
      } else {
        if (section.bullets.length > 12) errors.push(`${base}.bullets must contain 12 items or fewer`);
        section.bullets.forEach((bullet, bulletIndex) => text(`${base}.bullets[${bulletIndex}]`, bullet, 500, true));
      }
    });
  }

  if (!object(value.cta)) {
    errors.push("cta must be an object");
  } else {
    text("cta.heading", value.cta.heading, 180, true);
    text("cta.body", value.cta.body, 1000, true);
  }

  if (!object(value.acceptance)) {
    errors.push("acceptance must be an object");
  } else {
    if (typeof value.acceptance.enabled !== "boolean") errors.push("acceptance.enabled must be a boolean");
    text("acceptance.heading", value.acceptance.heading, 180, true);
    text("acceptance.statement", value.acceptance.statement, 1200, true);
    text("acceptance.checkboxLabel", value.acceptance.checkboxLabel, 300, true);
    text("acceptance.buttonLabel", value.acceptance.buttonLabel, 80, true);
  }

  return { success: errors.length === 0, errors };
}

function assertProposal(value) {
  const result = validateProposal(value);
  if (!result.success) throw new Error(result.errors.join("; "));
  return value;
}

module.exports = { SLUG, THEME_IDS, validateProposal, assertProposal };
