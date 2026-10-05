import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { api } from '../services/api';

const categories = [
  'Network Intrusion',
  'Phishing',
  'Data Leak',
  'Malware',
  'DDoS',
  'Web Attack',
  'Exploit',
  'Ransomware',
  'Insider Threat',
  'Other',
];

const investigators = [
  'Manthan Chavda',
  'Jenil Jetpuriya',
];

export default function CreateInvestigation() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    investigator: 'Manthan Chavda',
    priority: 'Medium',
    category: 'Network Intrusion',
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field, val) => {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Case name is required';
    else if (form.name.length < 5) errs.name = 'Must be at least 5 characters';
    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.length < 20) errs.description = 'Must be at least 20 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const created = await api.createCase({ title: form.name, description: form.description });
      localStorage.setItem('cyberlens_selected_case', String(created.id));
      setShowSuccess(true);
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setLoading(false);
    }
  };

  const FieldLabel = ({ label, required }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  const inputClass = (field) =>
    `w-full px-3.5 py-2.5 text-sm border rounded-xl bg-white text-gray-900 placeholder:text-gray-400 transition-all
     focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
     ${errors[field] ? 'border-red-400 bg-red-50/20' : 'border-gray-200 hover:border-gray-300'}`;

  return (
    <div className="max-w-3xl animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/investigations')}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Investigation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Open a new forensic investigation case</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-card divide-y divide-gray-100">
          {/* Section: Basic Info */}
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5 uppercase tracking-wide text-[11px] text-gray-500">
              Case Information
            </h2>
            <div className="space-y-5">
              <div>
                <FieldLabel label="Case Name" required />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Operation Dark Harbor"
                  className={inputClass('name')}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
              </div>

              <div>
                <FieldLabel label="Description" required />
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={4}
                  placeholder="Describe the nature of the investigation, suspected threat vectors, and initial findings…"
                  className={`${inputClass('description')} resize-none`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.description
                    ? <p className="text-xs text-red-500">{errors.description}</p>
                    : <span />}
                  <span className="text-[10px] text-gray-400">{form.description.length} chars</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Classification */}
          <div className="p-6">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-5">
              Classification
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <FieldLabel label="Investigator" required />
                <select
                  value={form.investigator}
                  onChange={(e) => set('investigator', e.target.value)}
                  className={inputClass('investigator')}
                >
                  {investigators.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <FieldLabel label="Priority" required />
                <select
                  value={form.priority}
                  onChange={(e) => set('priority', e.target.value)}
                  className={inputClass('priority')}
                >
                  {['Critical', 'High', 'Medium', 'Low'].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel label="Category" required />
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className={inputClass('category')}
                >
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Priority indicator */}
          <div className="px-6 py-4 bg-gray-50/60">
            <div className="flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  form.priority === 'Critical' ? 'bg-red-500' :
                  form.priority === 'High' ? 'bg-orange-400' :
                  form.priority === 'Medium' ? 'bg-yellow-400' : 'bg-gray-400'
                }`}
              />
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-700">Priority: {form.priority}</span> –{' '}
                {form.priority === 'Critical' && 'Requires immediate attention. Notify team leads and escalate within 1 hour.'}
                {form.priority === 'High' && 'Should be addressed within 4 hours. Assign dedicated analyst immediately.'}
                {form.priority === 'Medium' && 'Address within 24 hours during standard working hours.'}
                {form.priority === 'Low' && 'Can be addressed during regular sprint. Low urgency.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => navigate('/investigations')}
            >
              Cancel
            </Button>
            <Button type="submit" icon={CheckCircle}>
              {loading ? 'Creating...' : 'Create Investigation'}
            </Button>
          </div>
          {errors.form && (
            <p className="px-6 pb-4 text-sm text-red-600">{errors.form}</p>
          )}
        </div>
      </form>

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={() => { setShowSuccess(false); navigate('/investigations'); }} title="Investigation Created">
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Case Created Successfully</h3>
          <p className="text-sm text-gray-500 mb-6">
            "<span className="font-medium text-gray-700">{form.name || 'New Investigation'}</span>" has been opened and assigned to{' '}
            <span className="font-medium text-gray-700">{form.investigator}</span>.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setShowSuccess(false); navigate('/investigations'); }}>
              Back to Cases
            </Button>
            <Button onClick={() => { setShowSuccess(false); navigate('/upload'); }}>
              Upload PCAP
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

