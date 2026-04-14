import { Icon } from "@/components/ui/Icon";

interface Document {
  name: string;
  size: string;
  status: string;
  icon: string;
  accent: string;
}

const documents: Document[] = [
  {
    name: "Signed Agreement PDF",
    size: "1.2 MB",
    status: "Updated Today",
    icon: "description",
    accent: "border-red-900/50",
  },
  {
    name: "Rules & Guidelines PDF",
    size: "840 KB",
    status: "Static Doc",
    icon: "policy",
    accent: "border-slate-700/50",
  },
];

export function DocumentList() {
  return (
    <section aria-labelledby="documents-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon name="folder_open" filled className="text-primary-container" />
        <h2 id="documents-heading" className="text-sm font-bold tracking-widest text-white uppercase">
          My Documents
        </h2>
      </div>
      <ul className="space-y-3 list-none p-0 m-0">
        {documents.map((doc) => (
          <li
            key={doc.name}
            className={`bg-surface-container rounded-lg p-4 flex items-center justify-between border-l-4 ${doc.accent}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-surface-container-highest rounded text-primary-container">
                <Icon name={doc.icon} />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">{doc.name}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">
                  Size: {doc.size} &bull; {doc.status}
                </p>
              </div>
            </div>
            <button
              aria-label={`Download ${doc.name}`}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Icon name="download" className="text-xl" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
