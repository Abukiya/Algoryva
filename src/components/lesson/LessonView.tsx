import type { ReactNode } from "react";
import type { LessonV2, Section } from "@/content/lesson-types";
import { vizById } from "@/lib/viz";
import { LazyViz } from "@/components/viz/LazyViz";
import { CodeBlock } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { Inline } from "./Inline";

const P = ({ t }: { t: string }) => <p><Inline text={t} /></p>;

function Head({ icon, label, tone = "brand", children }: { icon: IconName; label: string; tone?: "brand" | "warn" | "ok" | "muted"; children: ReactNode }) {
  const c = { brand: "text-brand", warn: "text-warn", ok: "text-ok", muted: "text-muted" }[tone];
  return (
    <>
      <p className={`flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide ${c}`}><Icon name={icon} size={14} />{label}</p>
      <h2 className="mt-1 text-2xl font-extrabold">{children}</h2>
    </>
  );
}

function Block({ s }: { s: Section }) {
  switch (s.kind) {
    case "intuition":
      return <section id={s.id} className="scroll-mt-24 rounded-2xl border border-brand/25 bg-brand/[.05] p-5"><Head icon="bolt" label="Intuition">{s.title}</Head><div className="prose-lesson mt-3">{s.paras.map((t, i) => <P key={i} t={t} />)}</div></section>;
    case "concept":
      return <section id={s.id} className="scroll-mt-24"><Head icon="book" label="The concept">{s.title}</Head><div className="prose-lesson mt-3">{s.paras.map((t, i) => <P key={i} t={t} />)}</div>{s.bullets && <ul className="prose-lesson mt-3 list-disc space-y-1.5 pl-6">{s.bullets.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ul>}</section>;
    case "naive":
      return (
        <section id={s.id} className="scroll-mt-24 rounded-2xl border border-line-strong bg-sunken/50 p-5">
          <Head icon="clock" label="First, the naive way" tone="muted">{s.title}</Head>
          <div className="prose-lesson mt-3">{s.paras.map((t, i) => <P key={i} t={t} />)}</div>
          {s.code && <CodeBlock code={s.code} />}
          <p className="mt-2 inline-flex items-center gap-2 rounded-lg bg-bad/10 px-3 py-1.5 text-sm font-bold text-bad"><Icon name="alert" size={14} />Cost: {s.cost}</p>
        </section>
      );
    case "observation":
      return <section id={s.id} className="scroll-mt-24 rounded-2xl border border-ok/30 bg-ok/[.06] p-5"><Head icon="sparkle" label="The observation" tone="ok">{s.title}</Head><div className="prose-lesson mt-3">{s.paras.map((t, i) => <P key={i} t={t} />)}</div></section>;
    case "viz": {
      const viz = vizById(s.viz);
      return (
        <section id={s.id} className="scroll-mt-24">
          <Head icon="play" label="See it move">{s.title}</Head>
          <div className="prose-lesson mt-3">{s.paras.map((t, i) => <P key={i} t={t} />)}</div>
          {viz ? <LazyViz viz={viz} /> : <p className="mt-3 text-sm text-muted">This visualization is unavailable.</p>}
        </section>
      );
    }
    case "example":
      return (
        <section id={s.id} className="scroll-mt-24">
          <Head icon="target" label="Worked by hand">{s.title}</Head>
          <div className="prose-lesson mt-3">{s.paras.map((t, i) => <P key={i} t={t} />)}</div>
          {s.table && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-line"><table className="table-clean min-w-full text-sm"><thead><tr>{s.table.head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{s.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="tnum px-3 py-2 font-mono"><Inline text={c} /></td>)}</tr>)}</tbody></table></div>
          )}
          {s.steps && <ol className="mt-4 space-y-3">{s.steps.map((st, i) => <li key={i} className="flex gap-3"><span className="tnum mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-extrabold text-brand-fg">{i + 1}</span><div className="prose-lesson min-w-0 text-[15.5px]"><strong><Inline text={st.title} /></strong><p className="!mt-0.5"><Inline text={st.body} /></p></div></li>)}</ol>}
        </section>
      );
    case "code":
      return (
        <section id={s.id} className="scroll-mt-24">
          <Head icon="note" label="Implementation">{s.title}</Head>
          <div className="prose-lesson mt-3">{s.paras.map((t, i) => <P key={i} t={t} />)}</div>
          {s.pseudocode && <><p className="mt-4 text-sm font-bold text-muted">Plan in plain steps</p><CodeBlock code={s.pseudocode} label="pseudocode" /></>}
          <CodeBlock code={s.code} />
          <h3 className="mt-5 text-base font-extrabold">Reading the code</h3>
          <ol className="mt-2 space-y-2 text-[15.5px]">{s.walkthrough.map((w, i) => <li key={i} className="flex gap-3"><span className="mt-0.5 text-muted">›</span><span className="min-w-0 text-soft"><Inline text={w} /></span></li>)}</ol>
        </section>
      );
    case "complexity":
      return (
        <section id={s.id} className="scroll-mt-24">
          <Head icon="chart" label="Complexity">{s.title}</Head>
          {s.paras && <div className="prose-lesson mt-3">{s.paras.map((t, i) => <P key={i} t={t} />)}</div>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {s.rows.map((r, i) => (
              <div key={i} className="card p-4">
                <p className="font-bold"><Inline text={r.what} /></p>
                <p className="mt-2 flex flex-wrap gap-2"><span className="chip chip-brand tnum font-mono">time {r.time}</span><span className="chip tnum font-mono">space {r.space}</span></p>
                <p className="mt-2 text-sm text-soft"><Inline text={r.why} /></p>
              </div>
            ))}
          </div>
        </section>
      );
    case "edge":
      return (
        <section id={s.id} className="scroll-mt-24">
          <Head icon="alert" label="Edge cases" tone="warn">{s.title}</Head>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">{s.items.map((it, i) => <li key={i} className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4"><span className="font-bold"><Inline text={it.case} /></span><span className="text-soft"><Inline text={it.handle} /></span></li>)}</ul>
        </section>
      );
    case "mistakes":
      return (
        <section id={s.id} className="scroll-mt-24 rounded-2xl border border-warn/30 bg-warn/[.06] p-5">
          <Head icon="alert" label="Common mistakes" tone="warn">{s.title}</Head>
          <ul className="mt-4 space-y-4">{s.items.map((it, i) => <li key={i}><p className="flex gap-2 font-bold"><span className="text-bad" aria-hidden="true">×</span><Inline text={it.mistake} /></p><p className="mt-1 flex gap-2 text-soft"><Icon name="check" size={16} className="mt-1 shrink-0 text-ok" strokeWidth={2.6} /><span><Inline text={it.fix} /></span></p></li>)}</ul>
        </section>
      );
    case "recognize":
      return (
        <section id={s.id} className="scroll-mt-24 rounded-2xl border border-brand/25 bg-brand/[.05] p-5">
          <Head icon="search" label="Recognize it in a contest">{s.title}</Head>
          {s.paras && <div className="prose-lesson mt-3">{s.paras.map((t, i) => <P key={i} t={t} />)}</div>}
          <p className="mt-4 text-sm font-extrabold">Reach for it when the problem says or implies</p>
          <ul className="mt-2 space-y-2">{s.signals.map((t, i) => <li key={i} className="flex gap-2.5"><Icon name="check" size={16} className="mt-1 shrink-0 text-ok" strokeWidth={2.6} /><span className="text-[15.5px]"><Inline text={t} /></span></li>)}</ul>
          {s.notThis && s.notThis.length > 0 && <><p className="mt-5 text-sm font-extrabold">Look elsewhere when</p><ul className="mt-2 space-y-2">{s.notThis.map((t, i) => <li key={i} className="flex gap-2.5"><Icon name="x" size={16} className="mt-1 shrink-0 text-bad" strokeWidth={2.6} /><span className="text-[15.5px]"><Inline text={t} /></span></li>)}</ul></>}
        </section>
      );
    case "worked":
      return (
        <section id={s.id} className="scroll-mt-24">
          <Head icon="flag" label="Worked problem">{s.title}</Head>
          <div className="well mt-3 p-4 text-[15.5px]"><p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-muted">The problem</p><Inline text={s.problem} /></div>
          <ol className="prose-lesson mt-4 list-decimal space-y-1.5 pl-6 text-[15.5px]">{s.approach.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ol>
          <CodeBlock code={s.code} />
          <p className="mt-2 flex gap-2 rounded-xl bg-ok/[.08] p-3 text-[15px]"><Icon name="bolt" size={16} className="mt-0.5 shrink-0 text-ok" /><span><strong>Takeaway. </strong><Inline text={s.takeaway} /></span></p>
        </section>
      );
  }
}

export function LessonBody({ lesson }: { lesson: LessonV2 }) {
  return <div className="space-y-12">{lesson.sections.map((s) => <Block key={s.id} s={s} />)}</div>;
}

export function lessonToc(lesson: LessonV2) {
  return lesson.sections.map((s) => ({ id: s.id, title: s.title }));
}

export function Objectives({ lesson }: { lesson: LessonV2 }) {
  return (
    <section aria-labelledby="obj-h" className="card card-pad">
      <p className="text-base font-extrabold text-soft"><Inline text={lesson.hook} /></p>
      <h2 id="obj-h" className="mt-4 flex items-center gap-2 text-lg font-extrabold"><Icon name="target" size={18} className="text-brand" />After this lesson you will be able to</h2>
      <ul className="mt-3 space-y-2">{lesson.objectives.map((o, i) => <li key={i} className="flex gap-2.5"><Icon name="check" size={16} className="mt-1 shrink-0 text-brand" strokeWidth={2.6} /><span><Inline text={o} /></span></li>)}</ul>
      {lesson.prereqNote && <p className="mt-4 border-t border-line pt-3 text-sm text-soft"><strong>Before you start. </strong><Inline text={lesson.prereqNote} /></p>}
    </section>
  );
}

export function WrapUp({ lesson }: { lesson: LessonV2 }) {
  const mistakes = lesson.sections.find((s) => s.kind === "mistakes");
  return (
    <section id="summary" aria-labelledby="sum-h" className="scroll-mt-24 space-y-5">
      <div className="card card-pad">
        <h2 id="sum-h" className="flex items-center gap-2 text-2xl font-extrabold"><Icon name="flag" className="text-brand" />Wrap-up</h2>
        <h3 className="mt-4 text-sm font-extrabold uppercase tracking-wide text-muted">Remember this</h3>
        <ul className="mt-2 space-y-2">{lesson.summary.map((t, i) => <li key={i} className="flex gap-2.5"><Icon name="bolt" size={15} className="mt-1 shrink-0 text-brand" /><span><Inline text={t} /></span></li>)}</ul>
        <h3 className="mt-5 text-sm font-extrabold uppercase tracking-wide text-muted">Cheat sheet</h3>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">{lesson.cheatSheet.map((c) => <div key={c.label} className="well p-3"><dt className="text-xs font-bold text-muted">{c.label}</dt><dd className="mt-0.5 font-mono text-sm font-bold"><Inline text={c.value} /></dd></div>)}</dl>
        {mistakes?.kind === "mistakes" && <><h3 className="mt-5 text-sm font-extrabold uppercase tracking-wide text-muted">Top traps to avoid</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-soft">{mistakes.items.slice(0, 3).map((m, i) => <li key={i}><Inline text={m.mistake} /></li>)}</ul></>}
      </div>
    </section>
  );
}
