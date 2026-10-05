import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  Camera,
  CheckCircle,
  Code,
  Database,
  Download,
  Info,
  Lock,
  Mail,
  Monitor,
  RotateCcw,
  Save,
  Shield,
  Sun,
  User,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { getStoredUser } from '../services/api';

const SETTINGS_KEY = 'cyberlens_settings';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Sun },
  { id: 'about', label: 'About', icon: Info },
];

const teamMembers = [
  {
    name: 'Manthan Chavda',
    role: 'Developer & Investigator',
    avatar: 'MC',
    focus: 'Backend, ML workflow, and investigation logic',
  },
  {
    name: 'Jenil Jetpuriya',
    role: 'Developer & Investigator',
    avatar: 'JJ',
    focus: 'Frontend, reporting workflow, and case experience',
  },
];

const defaultSettings = {
  profile: {
    name: 'Jenil Jetpuriya',
    email: 'jenil.jetpuriya@cyberlens.ai',
    role: 'Developer & Investigator',
    department: 'CyberLens AI Forensics Unit',
    bio: 'Cybersecurity investigator working on packet forensics, ML-assisted triage, and professional case reporting.',
  },
  notifications: {
    threatAlerts: true,
    caseUpdates: true,
    analysisComplete: true,
    reportReady: true,
    weeklyDigest: false,
    email: true,
    inApp: true,
  },
  appearance: {
    theme: 'light',
    density: 'comfortable',
    accent: 'blue',
  },
};

const notificationOptions = [
  { key: 'threatAlerts', label: 'Threat Alerts', desc: 'Notify when high-risk packet behavior is detected' },
  { key: 'caseUpdates', label: 'Case Updates', desc: 'Notify when investigation status or metadata changes' },
  { key: 'analysisComplete', label: 'Analysis Complete', desc: 'Notify after PCAP parsing and ML scanning completes' },
  { key: 'reportReady', label: 'Report Ready', desc: 'Notify when a professional PDF report is available' },
  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Send a weekly case and threat summary' },
];

const accentOptions = [
  { id: 'blue', label: 'Blue', swatch: 'bg-blue-600' },
  { id: 'emerald', label: 'Emerald', swatch: 'bg-emerald-600' },
  { id: 'slate', label: 'Slate', swatch: 'bg-slate-700' },
];

function loadSettings() {
  const storedUser = getStoredUser();
  const storedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
  return {
    ...defaultSettings,
    ...storedSettings,
    profile: {
      ...defaultSettings.profile,
      ...(storedSettings?.profile || {}),
      ...(storedUser || {}),
      role: storedSettings?.profile?.role || storedUser?.role || defaultSettings.profile.role,
    },
    notifications: {
      ...defaultSettings.notifications,
      ...(storedSettings?.notifications || {}),
    },
    appearance: {
      ...defaultSettings.appearance,
      ...(storedSettings?.appearance || {}),
    },
  };
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(loadSettings);
  const [savedAt, setSavedAt] = useState(localStorage.getItem('cyberlens_settings_saved_at') || '');
  const [saved, setSaved] = useState(false);

  const initials = useMemo(() => (
    settings.profile.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  ), [settings.profile.name]);

  const enabledAlerts = useMemo(() => (
    notificationOptions.filter((item) => settings.notifications[item.key]).length
  ), [settings.notifications]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.appearance.theme;
    document.documentElement.dataset.density = settings.appearance.density;
    document.documentElement.dataset.accent = settings.appearance.accent;
  }, [settings.appearance]);

  const updateProfile = (key, value) => {
    setSettings((current) => ({
      ...current,
      profile: { ...current.profile, [key]: value },
    }));
  };

  const updateNotifications = (key) => {
    setSettings((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: !current.notifications[key] },
    }));
  };

  const updateAppearance = (key, value) => {
    setSettings((current) => ({
      ...current,
      appearance: { ...current.appearance, [key]: value },
    }));
  };

  const handleSave = () => {
    const savedTime = new Date().toLocaleString();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem('cyberlens_settings_saved_at', savedTime);
    localStorage.setItem('cyberlens_user', JSON.stringify(settings.profile));
    setSavedAt(savedTime);
    setSaved(true);
    window.dispatchEvent(new Event('storage'));
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem('cyberlens_settings_saved_at');
    setSavedAt('');
    setSaved(false);
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cyberlens-settings.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const inputClass = 'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 transition-all';

  return (
    <div className="max-w-5xl space-y-6 animate-slide-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Live workspace preferences for the CyberLens AI investigation console.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={exportSettings}>Export</Button>
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={handleReset}>Reset</Button>
          <Button size="sm" icon={saved ? CheckCircle : Save} onClick={handleSave}>
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Shield, label: 'Active role', value: settings.profile.role },
          { icon: Bell, label: 'Enabled alerts', value: `${enabledAlerts}/${notificationOptions.length}` },
          { icon: Monitor, label: 'Display mode', value: `${settings.appearance.theme} / ${settings.appearance.density}` },
        ].map((item) => (
          <Card key={item.label} className="rounded-xl" hover>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
                <p className="truncate text-sm font-semibold text-gray-900 capitalize">{item.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === id
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
          <p className="mt-4 text-xs text-gray-400">
            {savedAt ? `Last saved: ${savedAt}` : 'Changes are live in this session until saved.'}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
              <Card>
                <CardHeader title="Profile Information" subtitle="Update the signed-in investigator profile." />

                <div className="mb-6 flex items-center gap-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Live Profile Preview</p>
                    <p className="mt-0.5 text-xs text-gray-500">{settings.profile.email}</p>
                    <div className="mt-2">
                      <Button variant="outline" size="xs" icon={Camera}>Photo Placeholder</Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                    <select
                      value={settings.profile.name}
                      onChange={(e) => updateProfile('name', e.target.value)}
                      className={inputClass}
                    >
                      {teamMembers.map((member) => <option key={member.name}>{member.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      value={settings.profile.email}
                      onChange={(e) => updateProfile('email', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={settings.profile.role}
                      onChange={(e) => updateProfile('role', e.target.value)}
                      className={inputClass}
                    >
                      <option>Developer & Investigator</option>
                      <option>Lead Investigator</option>
                      <option>ML Analyst</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Department</label>
                    <input
                      value={settings.profile.department}
                      onChange={(e) => updateProfile('department', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      value={settings.profile.bio}
                      onChange={(e) => updateProfile('bio', e.target.value)}
                      rows={4}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </Card>

              <Card className="rounded-xl">
                <CardHeader title="Current Identity" subtitle="Updates while you type." />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{settings.profile.name}</p>
                      <p className="truncate text-xs text-gray-500">{settings.profile.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {settings.profile.email}</p>
                    <p className="flex items-center gap-2"><Lock className="h-4 w-4 text-gray-400" /> Local session settings</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader title="Notification Preferences" subtitle="Control what CyberLens AI should surface during investigations." />
              <div className="space-y-1">
                {notificationOptions.map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between border-b border-gray-50 py-3.5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
                    </div>
                    <button
                      onClick={() => updateNotifications(key)}
                      className={`relative ml-4 mt-0.5 inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                        settings.notifications[key] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                        style={{ transform: settings.notifications[key] ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Delivery Method</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'email', label: 'Email', icon: Mail },
                    { key: 'inApp', label: 'In-app', icon: Activity },
                  ].map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={settings.notifications[key]}
                        onChange={() => updateNotifications(key)}
                        className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                      />
                      <Icon className="h-4 w-4 text-gray-400" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader title="Appearance" subtitle="Tune display density and visual emphasis for the current browser." />
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-700">Theme</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { id: 'light', label: 'Light Mode', desc: 'Bright forensic workspace' },
                      { id: 'system', label: 'System Mode', desc: 'Follow operating system preference' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => updateAppearance('theme', theme.id)}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${
                          settings.appearance.theme === theme.id ? 'border-blue-600 bg-blue-50/40' : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{theme.label}</p>
                          {settings.appearance.theme === theme.id && <CheckCircle className="h-4 w-4 text-blue-600" />}
                        </div>
                        <p className="text-xs text-gray-500">{theme.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-gray-700">Density</p>
                  <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                    {['compact', 'comfortable', 'spacious'].map((density) => (
                      <button
                        key={density}
                        onClick={() => updateAppearance('density', density)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                          settings.appearance.density === density ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {density}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-gray-700">Accent</p>
                  <div className="flex flex-wrap gap-3">
                    {accentOptions.map((accent) => (
                      <button
                        key={accent.id}
                        onClick={() => updateAppearance('accent', accent.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                          settings.appearance.accent === accent.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`h-4 w-4 rounded-full ${accent.swatch}`} />
                        {accent.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'about' && (
            <div className="space-y-5">
              <Card>
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">CyberLens AI</h2>
                    <p className="text-sm text-gray-500">Version 1.0.0 - Professional Build</p>
                  </div>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  CyberLens AI is an AI-based network and packet forensics platform for case-driven PCAP analysis,
                  threat triage, ML-assisted detection, and professional PDF reporting.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { icon: BookOpen, label: 'Domain', value: 'Network Forensics' },
                    { icon: Database, label: 'Evidence', value: 'PCAP and scan records' },
                    { icon: Code, label: 'Tech Stack', value: 'React, Flask, ML' },
                    { icon: Shield, label: 'Mode', value: 'Investigation Console' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-gray-50 p-3.5">
                      <div className="mb-1 flex items-center gap-2">
                        <item.icon className="h-3.5 w-3.5 text-gray-400" />
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="Project Team" subtitle="Developers and investigators for this build." />
                <div className="grid gap-3 sm:grid-cols-2">
                  {teamMembers.map((member) => (
                    <div key={member.name} className="rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-gray-500">{member.focus}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
