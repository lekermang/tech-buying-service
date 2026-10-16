const URL_RE = /(https?:\/\/[^\s]+)/g;

export const isNextStep = (text: string) => /^дальше\s*:/i.test(text.trim());
export const stripNext = (text: string) => text.trim().replace(/^дальше\s*:\s*/i, "");

export default function NoteText({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline underline-offset-2">{p}</a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}
