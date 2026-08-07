import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  Eye,
  ChevronsUpDown,
  Filter,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { investigations } from '../data/dummyData';
import { api } from '../services/api';

const ITEMS_PER_PAGE = 5;

export default function Investigations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortField, setSortField] = useState('created');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [cases, setCases] = useState(investigations);
  const [apiError, setApiError] = useState('');

  const statuses = ['All', 'Active', 'Under Review', 'Closed'];
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  useEffect(() => {
    api.listCases()
      .then((items) => {
        setCases(items.map((item) => ({
          id: String(item.id),
          name: item.title,
          description: item.description || '',
          investigator: 'Current User',
          category: 'Network Forensics',
          status: item.status === 'open' ? 'Active' : 'Closed',
          priority: 'Medium',
          created: item.created_at,
        })));
        setApiError('');
      })
      .catch((error) => setApiError(error.message));
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const filtered = cases
    .filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.investigator.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || c.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'created') {
        valA = new Date(valA);
        valB = new Date(valB);
      } else {
        valA = valA?.toString().toLowerCase() ?? '';
        valB = valB?.toString().toLowerCase() ?? '';
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investigations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cases.length} total cases - {cases.filter((c) => c.status === 'Active').length} active
          </p>
          {apiError && <p className="text-xs text-amber-600 mt-1">{apiError}</p>}
        </div>
        <Button icon={Plus} onClick={() => navigate('/investigations/create')}>
          New Investigation
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-card">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, name, investigator…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Status filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-1 py-1">
              <Filter className="w-3.5 h-3.5 text-gray-400 ml-2" />
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all
                    ${statusFilter === s ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {priorities.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {[
                  { label: 'Case ID', field: 'id' },
                  { label: 'Case Name', field: 'name' },
                  { label: 'Investigator', field: 'investigator' },
                  { label: 'Category', field: 'category' },
                  { label: 'Status', field: 'status' },
                  { label: 'Priority', field: 'priority' },
                  { label: 'Created', field: 'created' },
                  { label: '', field: null },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={() => field && handleSort(field)}
                    className={`text-left text-xs font-semibold text-gray-500 px-5 py-3 whitespace-nowrap
                      ${field ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-sm text-gray-400">
                    No investigations match your filters.
                  </td>
                </tr>
              ) : (
                paged.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                        {c.id}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 max-w-[220px] truncate">{c.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold flex-shrink-0">
                          {c.investigator.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-sm text-gray-700 whitespace-nowrap">{c.investigator}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">{c.category}</span>
                    </td>
                    <td className="px-5 py-4"><Badge label={c.status} /></td>
                    <td className="px-5 py-4"><Badge label={c.priority} /></td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">{c.created}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Button
                        variant="outline"
                        size="xs"
                        icon={Eye}
                        onClick={() => navigate(`/investigations/${c.id}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} results
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
