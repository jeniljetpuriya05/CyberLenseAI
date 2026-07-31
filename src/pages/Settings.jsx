import { useState } from 'react';
import {
  User,
  Bell,
  Sun,
  Info,
  Camera,
  Save,
  Shield,
  BookOpen,
  Users,
  Code,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Sun },
  { id: 'about', label: 'About', icon: Info },
];

const teamMembers = [
  { name: 'Jenil Jetpuriya', role: 'Frontend & UI', avatar: 'JJ' },
  { name: 'Priya Sharma', role: 'Backend & ML', avatar: 'PS' },
  { name: 'Arjun Mehta', role: 'Network Forensics', avatar: 'AM' },
  { name: 'Sara Khan', role: 'Research & Docs', avatar: 'SK' },
  { name: 'Ravi Patel', role: 'Data Analysis', avatar: 'RP' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Jenil Jetpuriya',
    email: 'jenil.jetpuriya@cyberlens.ai',
    role: 'Senior Forensic Analyst',
    department: 'Digital Forensics Unit',
    bio: 'Final-year B.Tech student specializing in cybersecurity and digital forensics.',
  });
  const [notifications, setNotifications] = useState({
    threatAlerts: true,
    caseUpdates: true,
    analysisComplete: true,
    reportReady: false,
    weeklyDigest: true,
    email: true,
    inApp: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputClass = 'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 transition-all';

  return (
    <div className="max-w-4xl space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and application preferences</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="sm:w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${activeTab === id
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Profile Information" subtitle="Update your personal details" />

                {/* Avatar */}
                <div className="flex items-center gap-5 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    JJ
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Profile Photo</p>
                    <p className="text-xs text-gray-500 mt-0.5 mb-2">JPG, PNG or GIF up to 5MB</p>
                    <Button variant="outline" size="xs" icon={Camera}>Change Photo</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <input
                      value={profile.role}
                      onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                    <input
                      value={profile.department}
                      onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <Button variant="outline" size="sm">Reset</Button>
                  <Button size="sm" icon={saved ? undefined : Save} onClick={handleSave}>
                    {saved ? '✓ Saved' : 'Save Changes'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader title="Notification Preferences" subtitle="Control when and how you receive alerts" />

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Alert Types</p>
                {[
                  { key: 'threatAlerts', label: 'Threat Alerts', desc: 'Get notified when a new threat is detected' },
                  { key: 'caseUpdates', label: 'Case Updates', desc: 'Notifications when investigation status changes' },
                  { key: 'analysisComplete', label: 'Analysis Complete', desc: 'When PCAP analysis finishes' },
                  { key: 'reportReady', label: 'Report Ready', desc: 'When a forensic report is generated' },
                  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of weekly activity' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between py-3.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications((p) => ({ ...p, [key]: !p[key] }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ml-4 mt-0.5
                        ${notifications[key] ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform
                          ${notifications[key] ? 'translate-x-4.5' : 'translate-x-0.5'}`}
                        style={{ transform: notifications[key] ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Delivery Method</p>
                <div className="flex gap-3">
                  {['email', 'inApp'].map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[key]}
                        onChange={() => setNotifications((p) => ({ ...p, [key]: !p[key] }))}
                        className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">{key === 'inApp' ? 'In-App' : 'Email'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <Button size="sm" icon={Save} onClick={handleSave}>
                  {saved ? '✓ Saved' : 'Save Preferences'}
                </Button>
              </div>
            </Card>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader title="Appearance" subtitle="Customize how CyberLens AI looks" />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Theme</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'light', label: 'Light Mode', desc: 'Clean professional light theme', active: true },
                    { id: 'dark', label: 'Dark Mode', desc: 'Coming soon', active: false, disabled: true },
                  ].map((t) => (
                    <div
                      key={t.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${t.active && !t.disabled ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                        {t.active && !t.disabled && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        )}
                        {t.disabled && (
                          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm font-medium text-blue-700">Light mode only</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    CyberLens AI is designed around a clean, professional light theme optimized for forensic analysis environments.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* About */}
          {activeTab === 'about' && (
            <div className="space-y-5">
              <Card>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">CyberLens AI</h2>
                    <p className="text-sm text-gray-500">Version 1.0.0 · Academic Build</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  CyberLens AI is an AI-Based Network &amp; Packet Forensics System for Cyber Crime Investigation, developed as a final-year Software Engineering group project.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: BookOpen, label: 'Program', value: 'B.Tech – CSE' },
                    { icon: Users, label: 'Institution', value: 'University of Technology' },
                    { icon: Code, label: 'Tech Stack', value: 'React · Vite · Tailwind' },
                    { icon: Shield, label: 'Year', value: '2024–25' },
                  ].map((item) => (
                    <div key={item.label} className="p-3.5 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <item.icon className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{item.label}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="Project Team" subtitle="Software Engineering Group Project" />
                <div className="space-y-3">
                  {teamMembers.map((m) => (
                    <div key={m.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {m.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.role}</p>
                      </div>
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
