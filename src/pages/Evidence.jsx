import { useState } from 'react';
import {
  Search,
  Download,
  Eye,
  File,
  FileText,
  Archive,
  HardDrive,
  Tag,
  Plus,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { evidence } from '../data/dummyData';

const typeIconMap = {
  PCAP: { icon: HardDrive, color: 'bg-blue-50 text-blue-600' },
  'Memory Dump': { icon: HardDrive, color: 'bg-purple-50 text-purple-600' },
  Text: { icon: FileText, color: 'bg-green-50 text-green-600' },
  Archive: { icon: Archive, color: 'bg-amber-50 text-amber-600' },
  'Log File': { icon: File, color: 'bg-slate-50 text-slate-600' },
  Executable: { icon: File, color: 'bg-red-50 text-red-600' },
};

export default function Evidence() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const allTags = ['All', ...new Set(evidence.flatMap((e) => e.tags))];

  const filtered = evidence.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.caseName.toLowerCase().includes(q) ||
      e.tags.some((t) => t.includes(q));
    const matchTag = selectedTag === 'All' || e.tags.includes(selectedTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evidence Locker</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {evidence.length} items across {new Set(evidence.map((e) => e.caseId)).size} cases
          </p>
        </div>
        <Button icon={Plus} size="sm">Add Evidence</Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search evidence…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-gray-400" />
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                ${selectedTag === tag
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center shadow-card">
          <File className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No evidence found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const cfg = typeIconMap[item.type] || typeIconMap.Text;
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                {/* Top row */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate font-mono" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.size} · {item.type}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-4 flex-1">
                  {item.description}
                </p>

                {/* Case reference */}
                <div className="text-xs text-gray-500 mb-3">
                  <span className="font-medium text-blue-600">{item.caseId}</span>
                  {' · '}{item.caseName}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className="text-[10px] bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 px-2 py-0.5 rounded-full font-medium transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                {/* Meta */}
                <div className="text-[10px] text-gray-400 mb-4">
                  Uploaded {item.uploaded} by {item.uploadedBy}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="xs" icon={Eye} fullWidth>Preview</Button>
                  <Button variant="secondary" size="xs" icon={Download} fullWidth>Download</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
