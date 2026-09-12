import ReactMarkdown from "react-markdown";

export default function MarkdownContent({ content }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
