import { Fragment, type ReactNode } from 'react';

// Renderizador minimalista de Markdown (blocos de código, inline code, listas,
// negrito e parágrafos). Suficiente para as respostas do Copilot, sem dependências.
export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/```/);
  return (
    <div className="prose-chat text-sm text-slate-700 leading-relaxed">
      {blocks.map((block, i) => {
        const isCode = i % 2 === 1;
        if (isCode) {
          const firstNewline = block.indexOf('\n');
          const body = firstNewline >= 0 ? block.slice(firstNewline + 1) : block;
          return (
            <pre key={i}>
              <code>{body.replace(/\n$/, '')}</code>
            </pre>
          );
        }
        return <Fragment key={i}>{renderInlineBlock(block)}</Fragment>;
      })}
    </div>
  );
}

function renderInlineBlock(text: string): ReactNode {
  const lines = text.split('\n');
  const out: ReactNode[] = [];
  let list: ReactNode[] = [];

  const flushList = (key: string) => {
    if (list.length) {
      out.push(
        <ul key={key} className="list-disc pl-5 my-1 space-y-0.5">
          {list}
        </ul>,
      );
      list = [];
    }
  };

  lines.forEach((line, idx) => {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (bullet) {
      list.push(<li key={`li-${idx}`}>{renderInline(bullet[1])}</li>);
      return;
    }
    flushList(`ul-${idx}`);
    if (heading) {
      out.push(
        <p key={idx} className="font-semibold text-slate-800 mt-2">
          {renderInline(heading[1])}
        </p>,
      );
    } else if (line.trim() === '') {
      out.push(<div key={idx} className="h-2" />);
    } else {
      out.push(
        <p key={idx} className="my-0.5">
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList('ul-end');
  return <>{out}</>;
}

function renderInline(text: string): ReactNode {
  // divide por `code` e **negrito**
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
