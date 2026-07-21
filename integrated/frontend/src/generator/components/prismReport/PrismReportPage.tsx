import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as echarts from "echarts";
import { ArrowLeft } from "lucide-react";
import type { NatalChart } from "../../services/astrologyEngine";
import {
  parsePrismReportJson,
  type PrismPrecomputed,
  type PrismReportContent,
} from "../../services/prismPrecompute";
import { SECTION_NAV_EN, SECTION_TITLES_EN } from "../../services/prismLabelsEn";
import { getPlanetAvatarSrc } from "../../utils/planetAvatar";
import "./prismReport.css";

type MarkdownBlock =
  | { kind: "paragraph" | "subheading" | "quote"; text: string }
  | { kind: "list"; items: string[]; ordered: boolean };

type MarkdownSection = { id: string; title: string; blocks: MarkdownBlock[] };

function cleanMarkdownText(value: string): string {
  return value.replace(/^#+\s*/, "").replace(/^\*\*|\*\*$/g, "").trim();
}

function parseMarkdownSections(text: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  let title = "Overview";
  let blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let sawPrimaryTitle = false;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join(" ").trim() });
    paragraph = [];
  };
  const flushList = () => {
    if (listItems.length) blocks.push({ kind: "list", items: listItems, ordered: listOrdered });
    listItems = [];
  };
  const flushSection = () => {
    flushParagraph();
    flushList();
    if (blocks.length) sections.push({ id: `md-${sections.length + 1}`, title, blocks });
    blocks = [];
  };

  for (const rawLine of text.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (/^#\s+/.test(line) && !sawPrimaryTitle) {
      sawPrimaryTitle = true;
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushSection();
      title = cleanMarkdownText(line);
      continue;
    }
    if (/^###\s+/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "subheading", text: cleanMarkdownText(line) });
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "quote", text: line.replace(/^>\s?/, "") });
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.+)/);
    const numbered = line.match(/^\d+[.)]\s+(.+)/);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (listItems.length && listOrdered !== ordered) flushList();
      listOrdered = ordered;
      listItems.push((bullet?.[1] || numbered?.[1] || "").trim());
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushSection();
  return sections;
}

function inlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("_") && part.endsWith("_")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function MarkdownSectionBody({ section, index }: { section: MarkdownSection; index: number }) {
  return (
    <>
      <h2>{section.title}</h2>
      {index === 0 && <div className="prism-chart-box" data-chart="radar" />}
      {section.blocks.map((block, blockIndex) => {
        if (block.kind === "subheading") return <h3 key={blockIndex}>{inlineMarkdown(block.text)}</h3>;
        if (block.kind === "quote") return <div key={blockIndex} className="prism-quote">{inlineMarkdown(block.text)}</div>;
        if (block.kind === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return <Tag key={blockIndex}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item)}</li>)}</Tag>;
        }
        return <p key={blockIndex}>{inlineMarkdown(block.text)}</p>;
      })}
      {index === 2 && <div className="prism-chart-box" data-chart="bars" />}
    </>
  );
}

export interface PrismReportPageProps {
  chart: NatalChart;
  pre: PrismPrecomputed;
  /** Raw AI JSON or markdown; when parseable, fills section copy */
  reportText?: string;
  /** Preview mode: only banner/hero/scores + s1; rest locked */
  previewOnly?: boolean;
  isUnlocked?: boolean;
  onBack?: () => void;
  paywallSlot?: ReactNode;
}

function SectionBody({
  id,
  content,
  pre,
}: {
  id: string;
  content?: PrismReportContent["sections"] extends Record<string, infer S> ? S : never;
  pre: PrismPrecomputed;
}) {
  const title = content?.title || SECTION_TITLES_EN[id] || id;
  const lead = content?.lead;

  if (id === "s2") {
    return (
      <>
        <h2>{title}</h2>
        {lead && <p className="prism-lead">{lead}</p>}
        {content?.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
        <div className="prism-chart-box" data-chart="bars" />
        <table className="prism-table">
          <thead>
            <tr>
              <th>Ability</th>
              <th>Score</th>
              <th>Percentile</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            {pre.ability_scores.map((a) => (
              <tr key={a.ability}>
                <td>{a.ability}</td>
                <td>{a.score}</td>
                <td>{a.percentile}</td>
                <td>{a.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  if (id === "s3") {
    return (
      <>
        <h2>{title}</h2>
        {lead && <p className="prism-lead">{lead}</p>}
        <div className="prism-chart-box" data-chart="radar" />
        {content?.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
        <table className="prism-table">
          <thead>
            <tr>
              <th>Ability</th>
              <th>Score</th>
              <th>Percentile</th>
            </tr>
          </thead>
          <tbody>
            {pre.top_abilities.map((a) => (
              <tr key={a.ability}>
                <td>{a.ability}</td>
                <td>{a.score}</td>
                <td>{a.percentile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  if (id === "s19") {
    return (
      <>
        <h2>{title}</h2>
        <div className="prism-final">{content?.final || pre.tagline}</div>
      </>
    );
  }

  return (
    <>
      <h2>{title}</h2>
      {lead && <p className="prism-lead">{lead}</p>}
      {content?.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
      {content?.quote && <div className="prism-quote">{content.quote}</div>}
      {content?.items && content.items.length > 0 && (
        <ul>
          {content.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
      {content?.cards && content.cards.length > 0 && (
        <div className="prism-grid2">
          {content.cards.map((c, i) => (
            <div className="prism-mini-card" key={i}>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      )}
      {!content?.paragraphs?.length && !content?.cards?.length && !content?.items?.length && (
        <FallbackSection id={id} pre={pre} />
      )}
    </>
  );
}

function FallbackSection({ id, pre }: { id: string; pre: PrismPrecomputed }) {
  if (id === "s1") {
    return (
      <>
        <p className="prism-lead">
          {pre.name}, here is the verdict: you are built as a {pre.identity_sub_label}.
        </p>
        <p>{pre.definition}</p>
        <p>
          Your lead strength is {pre.top_abilities[0]?.ability} ({pre.top1_score}). Support comes from{" "}
          {pre.top_abilities[1]?.ability} ({pre.top2_score}).
        </p>
        <div className="prism-quote">{pre.tagline}</div>
      </>
    );
  }
  if (id === "s5") {
    return (
      <>
        <p className="prism-lead">{pre.identity_display}</p>
        <p>{pre.definition}</p>
        <div className="prism-quote">Stay on this identity. Do not dilute it into a generic role.</div>
      </>
    );
  }
  if (id === "s6") {
    return (
      <div className="prism-grid2">
        {pre.career_matches.slice(0, 4).map((c) => (
          <div className="prism-mini-card" key={c.profession}>
            <h3>
              {c.profession} · {c.role} ({c.score})
            </h3>
            <p>
              {c.industry}. {c.reason}
            </p>
          </div>
        ))}
      </div>
    );
  }
  if (id === "s7") {
    return (
      <div className="prism-grid2">
        {pre.industry_map.map((m, i) => (
          <div className="prism-mini-card" key={i}>
            <h3>
              {m.industry} · {m.role}
            </h3>
            <p>Match score {m.score}</p>
          </div>
        ))}
      </div>
    );
  }
  if (id === "s8") {
    return (
      <>
        <p className="prism-lead">
          Luck index {pre.lucky_score} — {pre.lucky_level_desc}
        </p>
        <ul>
          {pre.luck_entry.map((e, i) => (
            <li key={i}>
              <strong>{e.title}</strong>: {e.detail}
            </li>
          ))}
        </ul>
      </>
    );
  }
  if (id === "s9") {
    return (
      <div className="prism-grid2">
        {pre.wealth_modes.map((w, i) => (
          <div className="prism-mini-card" key={i}>
            <h3>
              {w.mode} ({w.score})
            </h3>
            <p>{w.note}</p>
          </div>
        ))}
      </div>
    );
  }
  if (id === "s10") {
    return (
      <div className="prism-grid2">
        {pre.partner_profile.map((p, i) => (
          <div className="prism-mini-card" key={i}>
            <h3>
              {p.type} · {p.role} ({p.score})
            </h3>
            <p>{p.reason}</p>
          </div>
        ))}
      </div>
    );
  }
  if (id === "s11") {
    return (
      <ul>
        {pre.luck_entry.map((e, i) => (
          <li key={i}>
            <strong>{e.title}</strong>: {e.detail}
          </li>
        ))}
      </ul>
    );
  }
  if (id === "s12") {
    return (
      <ul>
        {pre.energy_leaks.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    );
  }
  if (id === "s13") {
    return (
      <ul>
        {pre.block_people.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    );
  }
  if (id === "s14") {
    return (
      <ul>
        {pre.boost_people.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    );
  }
  if (id === "s15") {
    return (
      <div className="prism-grid2">
        {pre.risk_redlines.map((r, i) => (
          <div className="prism-mini-card" key={i}>
            <h3>
              {r.area} · {r.severity}
            </h3>
            <p>{r.detail}</p>
          </div>
        ))}
      </div>
    );
  }
  if (id === "s16") {
    return (
      <ol>
        <li>Your visibility rises when {pre.top_abilities[0]?.ability} is packaged, not just used privately.</li>
        <li>Your money path is strongest through {pre.wealth_modes[0]?.mode}.</li>
        <li>Your relationship luck improves with clear rules, not more sacrifice.</li>
        <li>Your timing allies look like: {pre.boost_people[0]}.</li>
        <li>Your fastest luck entry: {pre.luck_entry[0]?.title}.</li>
      </ol>
    );
  }
  if (id === "s17") {
    return (
      <div className="prism-grid2">
        {pre.ninety_day_plan.map((p) => (
          <div className="prism-mini-card" key={p.phase}>
            <h3>{p.phase}</h3>
            <p>
              <strong>{p.focus}</strong>
            </p>
            <ul>
              {p.actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  if (id === "s18") {
    const card = pre.execution_card;
    return (
      <div className="prism-grid2">
        <div className="prism-mini-card">
          <h3>Identity</h3>
          <p>{card.identity}</p>
        </div>
        <div className="prism-mini-card">
          <h3>Top abilities</h3>
          <p>{card.top_abilities.join(" · ")}</p>
        </div>
        <div className="prism-mini-card">
          <h3>Do now</h3>
          <ul>
            {card.do_now.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="prism-mini-card">
          <h3>Avoid</h3>
          <ul>
            {card.avoid.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  if (id === "s4") {
    return (
      <p>
        Classic figures who share your operating pattern around {pre.top_abilities.slice(0, 2).map((a) => a.ability).join(" + ")}{" "}
        will be expanded in the full script. For now, treat them as pattern mirrors — not identity copies.
      </p>
    );
  }
  return <p>{SECTION_TITLES_EN[id]}</p>;
}

export default function PrismReportPage({
  chart,
  pre,
  reportText,
  previewOnly = false,
  isUnlocked = false,
  onBack,
  paywallSlot,
}: PrismReportPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const parsed = useMemo(() => (reportText ? parsePrismReportJson(reportText) : null), [reportText]);
  const markdownSections = useMemo(
    () => reportText && !parsed ? parseMarkdownSections(reportText) : [],
    [reportText, parsed],
  );

  const banner = {
    name: parsed?.banner?.name || pre.name,
    identity: parsed?.banner?.identity || pre.identity_display,
    tagline: parsed?.banner?.tagline || pre.tagline,
    version_line: (
      parsed?.banner?.version_line ||
      `Luck index ${pre.lucky_score} (${pre.lucky_level_desc})`
    ).replace(/^V\d+(?:\.\d+)?\s*[·•]\s*/i, ""),
  };
  const hero = {
    identity: parsed?.hero?.identity || pre.identity_display,
    definition: parsed?.hero?.definition || pre.definition,
  };
  const scoreStrip = (parsed?.score_strip?.length ? parsed.score_strip : pre.score_strip).slice(0, 4);
  const avatarSrc = getPlanetAvatarSrc(pre.top1, chart.birthData);
  const showFull = !previewOnly || isUnlocked;

  useEffect(() => {
    if (!rootRef.current || !showFull) return;
    const charts: echarts.ECharts[] = [];

    const radarEl = rootRef.current.querySelector<HTMLElement>('[data-chart="radar"]');
    if (radarEl) {
      const chartInst = echarts.init(radarEl);
      const labels = pre.top_abilities.map((a) => a.ability);
      const values = pre.top_abilities.map((a) => a.score);
      chartInst.setOption({
        radar: {
          indicator: labels.map((name) => ({ name, max: 100 })),
          splitArea: { areaStyle: { color: ["rgba(0,0,0,0)", "rgba(0,0,0,0.02)"] } },
        },
        series: [
          {
            type: "radar",
            data: [{ value: values, name: "Abilities", areaStyle: { opacity: 0.25 } }],
            lineStyle: { width: 2 },
          },
        ],
        color: ["#B88746"],
      });
      charts.push(chartInst);
    }

    const barEl = rootRef.current.querySelector<HTMLElement>('[data-chart="bars"]');
    if (barEl) {
      const chartInst = echarts.init(barEl);
      const ranked = [...pre.ability_scores].sort((a, b) => a.score - b.score);
      chartInst.setOption({
        grid: { left: 90, right: 24, top: 12, bottom: 24 },
        xAxis: { type: "value", max: 100, splitLine: { lineStyle: { color: "#E8D7C0" } } },
        yAxis: {
          type: "category",
          data: ranked.map((a) => a.ability),
          axisLabel: { color: "#4B2E18" },
        },
        series: [
          {
            type: "bar",
            data: ranked.map((a) => a.score),
            barWidth: 14,
            itemStyle: { color: "#B88746", borderRadius: [0, 8, 8, 0] },
            label: { show: true, position: "right", color: "#766454" },
          },
        ],
      });
      charts.push(chartInst);
    }

    const onResize = () => charts.forEach((c) => c.resize());
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      charts.forEach((c) => c.dispose());
    };
  }, [pre, showFull, parsed, previewOnly]);

  return (
    <div className="prism-report" data-planet={pre.theme_planet} ref={rootRef}>
      {onBack && (
        <button type="button" className="prism-back-floating" onClick={onBack} aria-label="Back" title="Back">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      )}

      <header className="prism-banner">
        <div className="prism-wrap prism-banner-inner">
          <div className="prism-eyebrow">PRISM Life Script</div>
          <h1>{banner.name}</h1>
          <div className="prism-identity">{banner.identity}</div>
          <div className="prism-tagline">{banner.tagline}</div>
          <div className="prism-version">{banner.version_line}</div>
        </div>
      </header>

      <section className="prism-hero prism-wrap">
        <div className="prism-hero-card">
          {avatarSrc ? (
            <img className="prism-avatar" src={avatarSrc} alt={pre.planet_person} />
          ) : (
            <div className="prism-avatar prism-avatar-fallback">{(banner.name || "P").slice(0, 1)}</div>
          )}
          <div>
            <h2>{hero.identity}</h2>
            <p>{hero.definition}</p>
          </div>
        </div>
      </section>

      <section className="prism-score-strip prism-wrap">
        <div className="prism-scores">
          {scoreStrip.map((s, i) => (
            <div className="prism-score" key={s.rank || i}>
              <div className="prism-rank">{s.rank || `TOP${i + 1}`}</div>
              <div className="prism-num">{s.score}</div>
              <div className="prism-ability">{s.ability}</div>
              <div className="prism-note">{s.note}</div>
            </div>
          ))}
        </div>
      </section>

      {showFull && (
        <nav className="prism-nav" aria-label="Report sections">
          <div className="prism-wrap prism-nav-inner">
            {(markdownSections.length ? markdownSections.map((section) => ({ id: section.id, label: section.title })) : SECTION_NAV_EN).map((s) => (
              <a key={s.id} href={`#${s.id}`} title={`Go to ${s.label}`}>
                {s.label}
              </a>
            ))}
          </div>
        </nav>
      )}

      <main className="prism-wrap">
        {showFull && markdownSections.length > 0
          ? markdownSections.map((section, index) => (
              <section key={section.id} id={section.id} className="prism-section prism-markdown-section">
                <MarkdownSectionBody section={section} index={index} />
              </section>
            ))
          : showFull && SECTION_NAV_EN.map((s) => (
              <section key={s.id} id={s.id} className="prism-section">
                <SectionBody id={s.id} content={parsed?.sections?.[s.id]} pre={pre} />
              </section>
            ))}

        {previewOnly && !isUnlocked && paywallSlot}

        {showFull && (
          <footer className="prism-footer">PRISM Life Script · Program scores · Human language</footer>
        )}
      </main>
    </div>
  );
}
