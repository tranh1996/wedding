import assets from "@/lib/assets.json";
import { content } from "@/lib/content";

const DOWS = {
  vi: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  en: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
};
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parseDate(str) {
  const m = str.match(/^([\d,\s]+)[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (!m) return null;
  const days = m[1].split(",").map((x) => parseInt(x.trim(), 10)).filter((x) => !isNaN(x));
  return { days, month: parseInt(m[2], 10), year: parseInt(m[3], 10) };
}

// Port of the original html box: date column on the left, month grid on the right.
export default function Calendar() {
  const lang = content.calendarLang;
  const parsed = parseDate(content.calendarDate);
  if (!parsed) return null;
  const { days, month, year } = parsed;

  const first = new Date(year, month - 1, 1);
  const total = new Date(year, month, 0).getDate();
  const en = lang === "en";
  const offset = en ? first.getDay() : (first.getDay() + 6) % 7; // en: Sunday first, vi: Monday first
  const isSunday = (col) => (en ? col === 0 : col === 6);
  const title = en ? `${MONTHS_EN[month - 1]} ${year}` : `Tháng ${month} ${year}`;

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} className="wc-cal-day wc-cal-empty" />);
  for (let d = 1; d <= total; d++) {
    const selected = days.includes(d);
    const cls = ["wc-cal-day", isSunday((offset + d - 1) % 7) && "wc-cal-day--sun", selected && "wc-cal-day--selected"].filter(Boolean).join(" ");
    cells.push(
      <div key={d} className={cls}>
        <span className="wc-cal-day-span">{d}</span>
        {selected && <img src={assets.heart} className="wc-cal-heart" alt="" />}
      </div>,
    );
  }

  return (
    <div className="wc-wrap">
      <div id="wc-date-left" className="wc-date-left">{`${days.join(", ")}\n${month}\n${String(year).slice(-2)}`}</div>
      <div className="wc-cal-outer">
        <div id="wc-cal-title" className="wc-cal-title">{title}</div>
        <div className="wc-cal" id="wc-cal-target">
          <div className="wc-cal-frame">
            <div className="wc-cal-dow-row">{DOWS[lang].map((d) => <div key={d}>{d}</div>)}</div>
            <div className="wc-cal-grid">{cells}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
