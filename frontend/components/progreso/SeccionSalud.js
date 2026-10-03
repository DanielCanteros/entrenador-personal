import { fmt } from "../../lib/formato.js";

function clasificarFfmi(ffmi, sexo) {
  if (ffmi === null || !sexo) return null;
  const base = sexo === "M" ? [18, 20, 22] : [15, 17, 19];
  if (ffmi < base[0]) return { label: "En desarrollo", nivel: "neutral" };
  if (ffmi < base[1]) return { label: "Promedio", nivel: "neutral" };
  if (ffmi < base[2]) return { label: "Bueno", nivel: "good" };
  return { label: "Excelente", nivel: "good" };
}

const ICONO = { good: "✓", warn: "!", bad: "!", neutral: "•" };

export default function SeccionSalud({ c, sexo }) {
  const items = [
    {
      id: "imc",
      label: "Índice de masa corporal",
      valor: fmt(c.imc, 1),
      clase: c.clasificacionImc,
      texto: "Relación entre peso y altura. No distingue músculo de grasa: miralo junto a tu % de grasa.",
    },
    {
      id: "ica",
      label: "Cintura / estatura",
      valor: fmt(c.ica, 2),
      clase: c.clasificacionIca,
      texto: "Tu cintura debería medir menos de la mitad de tu altura. Es un gran indicador de salud metabólica.",
    },
    {
      id: "rcc",
      label: "Cintura / cadera",
      valor: fmt(c.rcc, 2),
      clase: c.clasificacionRcc,
      texto: "Muestra cómo se distribuye la grasa. La grasa abdominal es la que más impacta en la salud.",
    },
    {
      id: "tmb",
      label: "Metabolismo basal",
      valor: fmt(c.tmb, 0),
      unidad: "kcal",
      clase: c.tmb !== null ? { label: "Por día, en reposo", nivel: "neutral" } : null,
      texto: "Energía que tu cuerpo gasta sin moverte. Cada kilo de músculo que ganás lo hace subir.",
    },
    {
      id: "ffmi",
      label: "Índice de masa libre de grasa",
      valor: fmt(c.ffmi, 1),
      clase: clasificarFfmi(c.ffmi, sexo),
      texto: "Tu desarrollo muscular en relación a tu altura. Sube a medida que construís músculo.",
    },
  ].filter((item) => item.valor !== "–");

  if (!items.length) return null;

  return (
    <section className="prog-section" aria-labelledby="prog-salud">
      <header className="prog-section__head">
        <div>
          <p className="eyebrow">Indicadores de salud</p>
          <h2 id="prog-salud" className="prog-section__title">
            Más allá de la balanza
          </h2>
        </div>
      </header>
      <ul className="prog-salud">
        {items.map((item) => (
          <li key={item.id} className="prog-salud__item card">
            <p className="prog-salud__label">{item.label}</p>
            <p className="prog-salud__valor">
              {item.valor}
              {item.unidad && <small>{item.unidad}</small>}
            </p>
            {item.clase && (
              <span className={`prog-chip prog-chip--${item.clase.nivel}`}>
                <span aria-hidden="true">{ICONO[item.clase.nivel]}</span> {item.clase.label}
              </span>
            )}
            <p className="prog-salud__texto">{item.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
