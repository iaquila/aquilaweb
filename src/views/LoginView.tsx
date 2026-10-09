import React, { useState } from 'react';
import { useAppStore } from '../store';
import {
  Lock,
  Mail,
  CheckCircle2,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithAccount } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    loginWithAccount({
      name: email.split('@')[0]!.toUpperCase(),
      email: email.trim(),
      role: 'FIELD_AGENT',
      roleTitle: 'Field Agent (Cluster Supervisor)',
      description: 'Connected via station credentials.',
      assignedPus: ['pu-s25-lga-1-1', 'pu-s25-lga-1-2', 'pu-s25-lga-1-3'],
      organizationId: 'org-default',
      organizationName: 'iAquila Observer Network',
    });
  };

  const launchDemo = (role: 'agent' | 'polling' | 'officer') => {
    let demoEmail = 'agent@iaquila.com.ng';

    if (role === 'polling') {
      demoEmail = 'polling@iaquila.com.ng';
      loginWithAccount({
        name: 'Chinedu Eze',
        email: demoEmail,
        role: 'POLLING_AGENT',
        roleTitle: 'Polling Unit Agent',
        description: 'Stationed exclusively at PU 001 Ikeja Grammar School.',
        assignedPus: ['pu-s25-lga-1-1'],
        organizationId: 'org-default',
        organizationName: 'iAquila Observer Network',
      });
    } else if (role === 'officer') {
      demoEmail = 'officer@iaquila.com.ng';
      loginWithAccount({
        name: 'Dr. Adebayo Adeleke',
        email: demoEmail,
        role: 'ELECTION_OFFICER',
        roleTitle: 'Election Officer (Supervisory)',
        description: 'National election situation room supervisor with collation audit access.',
        assignedPus: [],
        organizationId: 'org-default',
        organizationName: 'iAquila Observer Network',
      });
    } else {
      loginWithAccount({
        name: 'Ibrahim Danladi',
        email: demoEmail,
        role: 'FIELD_AGENT',
        roleTitle: 'Field Agent (Cluster Supervisor)',
        description: 'Assigned to 3 Polling Units in Ikeja cluster for parallel vote tabulation.',
        assignedPus: ['pu-s25-lga-1-1', 'pu-s25-lga-1-2', 'pu-s25-lga-1-3'],
        organizationId: 'org-default',
        organizationName: 'iAquila Observer Network',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#070C09] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070C09] via-[#0D2619] to-[#0D6338]/30 pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Header / Brand Identity */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#0D6338] to-[#10B981] p-3 shadow-2xl flex items-center justify-center">
            <img
              src="/assets/eagle-head.png"
              alt="iAquila"
              className="w-14 h-14 object-contain drop-shadow"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-black tracking-widest text-white">iAQUILA</h1>
          <p className="text-xs font-semibold tracking-wider text-[#34D399]">
            trusted election intelligence in real time
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-[#0E1712] border border-[#1C2E24] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Sign In</h2>
            <p className="text-xs text-[#718579]">
              Enter credentials to connect to your assigned situation room.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#718579] uppercase">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#718579] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@iaquila.com.ng"
                  className="w-full pl-9 pr-3 py-2 bg-[#070C09] border border-[#1C2E24] rounded-xl text-xs text-white placeholder-[#718579] focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#718579] uppercase">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718579] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security passkey"
                  className="w-full pl-9 pr-3 py-2 bg-[#070C09] border border-[#1C2E24] rounded-xl text-xs text-white placeholder-[#718579] focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 p-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0D6338] to-[#10B981] hover:from-[#15803D] hover:to-[#34D399] text-white font-bold text-xs transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Access Situation Room</span>
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-3 border-t border-[#1C2E24] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#718579] block text-center">
              ONE-TAP DEMO ROLES
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => launchDemo('agent')}
                className="py-2 px-2.5 rounded-xl bg-[#070C09] border border-[#1C2E24] hover:border-[#10B981] hover:bg-[#121F18] text-xs font-semibold text-white transition text-center"
              >
                Field Agent
              </button>
              <button
                type="button"
                onClick={() => launchDemo('polling')}
                className="py-2 px-2.5 rounded-xl bg-[#070C09] border border-[#1C2E24] hover:border-[#10B981] hover:bg-[#121F18] text-xs font-semibold text-white transition text-center"
              >
                Polling Agent
              </button>
              <button
                type="button"
                onClick={() => launchDemo('officer')}
                className="py-2 px-2.5 rounded-xl bg-[#070C09] border border-[#10B981]/50 bg-[#10B981]/10 text-xs font-bold text-[#10B981] hover:bg-[#10B981]/20 transition text-center"
              >
                Election Officer
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-center">
          <p className="text-[11px] text-[#718579]">
            Independent Observer Intelligence System · Real Time
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px] text-[#718579]">
            <a href="https://iaquila.com.ng/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition underline">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="https://iaquila.com.ng/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition underline">
              Terms of Service
            </a>
            <span>•</span>
            <a href="https://iaquila.com.ng/deletion.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition underline">
              Data Deletion
            </a>
            <span>•</span>
            <a href="https://iaquila.com.ng/support.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition underline">
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};











// import React, { useState, useMemo } from 'react';
// import { useAppStore } from '../store';
// import {
//   Lock,
//   Mail,
//   Building,
//   CheckCircle2,
//   ChevronDown,
//   ChevronUp,
//   Search,
//   Check,
// } from 'lucide-react';

// const ORG_PRESETS = [
//   // { id: 'org-iaquila', code: 'IAQ-HQ', name: 'iAQUILA Situation Room', tag: 'HQ' },
//   // { id: 'org-cdd', code: 'CDD-WA', name: 'CDD West Africa', tag: 'CSO' },
//   // { id: 'org-yiaga', code: 'YIAGA-WTV', name: 'YIAGA Africa Watching The Vote', tag: 'CSO' },
//   // { id: 'org-inec', code: 'INEC-OBS', name: 'INEC Observer Mission', tag: 'OBSERVER' },
//   // { id: 'org-tmg', code: 'TMG-NG', name: 'Transition Monitoring Group', tag: 'OBSERVER' },
//   // { id: 'org-party-apc', code: 'APC-WAR', name: 'APC National Situation Room', tag: 'PARTY' },
//   // { id: 'org-party-pdp', code: 'PDP-CMD', name: 'PDP Central Command Desk', tag: 'PARTY' },
//   { id: 'org-party-lp', code: 'LP-SIT', name: 'LP Situation Room', tag: 'PARTY' },
// ];

// export const LoginView: React.FC = () => {
//   const { loginWithAccount } = useAppStore();

//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [selectedOrg, setSelectedOrg] = useState(ORG_PRESETS[0]!);
//   const [customOrg, setCustomOrg] = useState('');
//   const [isCustomOrg, setIsCustomOrg] = useState(false);
//   const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
//   const [orgSearch, setOrgSearch] = useState('');
//   const [error, setError] = useState('');

//   const filteredOrgs = useMemo(() => {
//     const q = orgSearch.trim().toLowerCase();
//     if (!q) return ORG_PRESETS;
//     return ORG_PRESETS.filter(
//       (org) =>
//         org.code.toLowerCase().includes(q) ||
//         org.name.toLowerCase().includes(q) ||
//         org.tag.toLowerCase().includes(q)
//     );
//   }, [orgSearch]);

//   const handleLogin = (e: React.FormEvent) => {
//     e.preventDefault();
//     const orgName = isCustomOrg ? customOrg.trim() : selectedOrg.name;
//     const orgId = isCustomOrg
//       ? `org-${customOrg.toLowerCase().replace(/\s+/g, '-')}`
//       : selectedOrg.id;

//     if (!email.trim() || !password.trim()) {
//       setError('Please enter both email and password');
//       return;
//     }
//     if (isCustomOrg && !customOrg.trim()) {
//       setError('Please specify your organization name');
//       return;
//     }

//     loginWithAccount({
//       name: email.split('@')[0]!.toUpperCase(),
//       email: email.trim(),
//       role: 'FIELD_AGENT',
//       roleTitle: 'Field Agent (Cluster Supervisor)',
//       organizationId: orgId,
//       organizationName: orgName,
//       description: 'Connected via station credentials.',
//       assignedPus: ['pu-s25-lga-1-1', 'pu-s25-lga-1-2', 'pu-s25-lga-1-3'],
//     });
//   };

//   const launchDemo = (role: 'agent' | 'polling' | 'officer') => {
//     let demoEmail = 'agent@iaquila.com.ng';
//     let org = ORG_PRESETS.find((o) => o.id === 'org-iaquila') ?? ORG_PRESETS[0]!;

//     if (role === 'polling') {
//       demoEmail = 'polling@iaquila.com.ng';
//       org = ORG_PRESETS.find((o) => o.id === 'org-yiaga') ?? ORG_PRESETS[2]!;
//       loginWithAccount({
//         name: 'Chinedu Eze',
//         email: demoEmail,
//         role: 'POLLING_AGENT',
//         roleTitle: 'Polling Unit Agent',
//         organizationId: org.id,
//         organizationName: org.name,
//         description: 'Stationed exclusively at PU 001 Ikeja Grammar School.',
//         assignedPus: ['pu-s25-lga-1-1'],
//       });
//     } else if (role === 'officer') {
//       demoEmail = 'officer@iaquila.com.ng';
//       org = ORG_PRESETS.find((o) => o.id === 'org-iaquila') ?? ORG_PRESETS[0]!;
//       loginWithAccount({
//         name: 'Dr. Adebayo Adeleke',
//         email: demoEmail,
//         role: 'ELECTION_OFFICER',
//         roleTitle: 'Election Officer (Supervisory)',
//         organizationId: org.id,
//         organizationName: org.name,
//         description: 'National election situation room supervisor with collation audit access.',
//         assignedPus: [],
//       });
//     } else {
//       loginWithAccount({
//         name: 'Ibrahim Danladi',
//         email: demoEmail,
//         role: 'FIELD_AGENT',
//         roleTitle: 'Field Agent (Cluster Supervisor)',
//         organizationId: org.id,
//         organizationName: org.name,
//         description: 'Assigned to 3 Polling Units in Ikeja cluster for parallel vote tabulation.',
//         assignedPus: ['pu-s25-lga-1-1', 'pu-s25-lga-1-2', 'pu-s25-lga-1-3'],
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#070C09] flex flex-col justify-center items-center p-4 relative overflow-hidden">
//       {/* Background Radial Glow */}
//       <div className="absolute inset-0 bg-gradient-to-b from-[#070C09] via-[#0D2619] to-[#0D6338]/30 pointer-events-none" />

//       <div className="max-w-md w-full relative z-10 space-y-6">
//         {/* Header / Brand Identity */}
//         <div className="text-center space-y-2">
//           <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#0D6338] to-[#10B981] p-3 shadow-2xl flex items-center justify-center">
//             <img
//               src="/assets/eagle-head.png"
//               alt="iAquila"
//               className="w-14 h-14 object-contain drop-shadow"
//               onError={(e) => {
//                 (e.target as HTMLElement).style.display = 'none';
//               }}
//             />
//           </div>
//           <h1 className="text-3xl font-black tracking-widest text-white">iAQUILA</h1>
//           <p className="text-xs font-semibold tracking-wider text-[#34D399]">
//             trusted election intelligence in real time
//           </p>
//         </div>

//         {/* Auth Form Card */}
//         <div className="bg-[#0E1712] border border-[#1C2E24] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
//           <div>
//             <h2 className="text-lg font-bold text-white">Sign In</h2>
//             <p className="text-xs text-[#718579]">
//               Enter credentials to connect to your assigned situation room.
//             </p>
//           </div>

//           <form onSubmit={handleLogin} className="space-y-4">
//             {/* Searchable Organization Tenant Selector */}
//             <div className="space-y-1.5">
//               <label className="text-[11px] font-bold text-[#718579] uppercase flex items-center gap-1.5">
//                 <Building className="w-3.5 h-3.5 text-[#10B981]" />
//                 ORGANIZATION / TENANT
//               </label>

//               {/* Selector Trigger Button */}
//               <button
//                 type="button"
//                 onClick={() => setOrgDropdownOpen((prev) => !prev)}
//                 className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition ${
//                   orgDropdownOpen
//                     ? 'bg-[#12231A] border-[#10B981]'
//                     : 'bg-[#070C09] border-[#1C2E24] hover:border-[#2A4435]'
//                 }`}
//               >
//                 <div className="min-w-0 flex-1">
//                   <div className="flex items-center gap-2">
//                     <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-mono text-[10px] font-bold">
//                       {isCustomOrg ? 'CUSTOM' : selectedOrg.code}
//                     </span>
//                     <span className="text-xs font-bold text-white truncate">
//                       {isCustomOrg
//                         ? customOrg.trim() || 'Custom Organization'
//                         : selectedOrg.name}
//                     </span>
//                   </div>
//                   {!isCustomOrg && (
//                     <span className="text-[10px] text-[#718579] block mt-0.5">
//                       {/* Category: {selectedOrg.tag} */}
//                     </span>
//                   )}
//                 </div>
//                 {orgDropdownOpen ? (
//                   <ChevronUp className="w-4 h-4 text-[#718579] shrink-0 ml-2" />
//                 ) : (
//                   <ChevronDown className="w-4 h-4 text-[#718579] shrink-0 ml-2" />
//                 )}
//               </button>

//               {/* Dropdown Menu with Search Input */}
//               {orgDropdownOpen && (
//                 <div className="rounded-xl border border-[#1C2E24] bg-[#070C09] p-2 space-y-2 shadow-xl animate-in fade-in duration-150">
//                   {/* Search Input */}
//                   <div className="relative">
//                     <Search className="w-3.5 h-3.5 text-[#718579] absolute left-2.5 top-1/2 -translate-y-1/2" />
//                     <input
//                       type="text"
//                       // placeholder="Search code or name (e.g. IAQ-HQ)..."
//                       value={orgSearch}
//                       onChange={(e) => setOrgSearch(e.target.value)}
//                       className="w-full pl-8 pr-3 py-1.5 bg-[#0E1712] border border-[#1C2E24] rounded-lg text-xs text-white placeholder-[#718579] focus:outline-none focus:border-[#10B981]"
//                     />
//                   </div>

//                   {/* Preset Options List */}
//                   <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
//                     {filteredOrgs.map((org) => {
//                       const active = !isCustomOrg && selectedOrg.id === org.id;
//                       return (
//                         <div
//                           key={org.id}
//                           onClick={() => {
//                             setIsCustomOrg(false);
//                             setSelectedOrg(org);
//                             setOrgDropdownOpen(false);
//                             setOrgSearch('');
//                           }}
//                           className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
//                             active
//                               ? 'bg-[#10B981]/15 text-[#10B981]'
//                               : 'hover:bg-[#121F18] text-[#94A89D] hover:text-white'
//                           }`}
//                         >
//                           <div className="flex items-center gap-2 min-w-0">
//                             <span className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-mono text-[10px] font-bold shrink-0">
//                               {org.code}
//                             </span>
//                             <div className="truncate">
//                               <p className="font-semibold truncate">{org.name}</p>
//                               <p className="text-[10px] text-[#718579]">{org.tag}</p>
//                             </div>
//                           </div>
//                           {active && <Check className="w-4 h-4 text-[#10B981] shrink-0 ml-2" />}
//                         </div>
//                       );
//                     })}

//                     {filteredOrgs.length === 0 && (
//                       <p className="text-xs text-[#718579] text-center py-2">
//                         No organization matches “{orgSearch.trim()}”.
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Custom Org Toggle Link */}
//               <button
//                 type="button"
//                 onClick={() => {
//                   setIsCustomOrg((prev) => !prev);
//                   setOrgDropdownOpen(false);
//                 }}
//                 className="text-[11px] font-medium text-[#10B981] hover:underline pt-1 inline-block"
//               >
//                 {isCustomOrg ? '✓ Using custom organization' : '+ Use custom organization code'}
//               </button>

//               {isCustomOrg && (
//                 <input
//                   type="text"
//                   placeholder="Enter custom organization name (e.g. EU Observer Mission)"
//                   value={customOrg}
//                   onChange={(e) => setCustomOrg(e.target.value)}
//                   className="w-full mt-1.5 bg-[#070C09] border border-[#1C2E24] rounded-xl px-3 py-2 text-xs text-white placeholder-[#718579] focus:outline-none focus:border-[#10B981]"
//                 />
//               )}
//             </div>

//             {/* Email */}
//             <div className="space-y-1">
//               <label className="text-[11px] font-bold text-[#718579] uppercase">Email</label>
//               <div className="relative">
//                 <Mail className="w-4 h-4 text-[#718579] absolute left-3 top-1/2 -translate-y-1/2" />
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="agent@iaquila.com.ng"
//                   className="w-full pl-9 pr-3 py-2 bg-[#070C09] border border-[#1C2E24] rounded-xl text-xs text-white placeholder-[#718579] focus:outline-none focus:border-[#10B981]"
//                 />
//               </div>
//             </div>

//             {/* Password */}
//             <div className="space-y-1">
//               <label className="text-[11px] font-bold text-[#718579] uppercase">Password</label>
//               <div className="relative">
//                 <Lock className="w-4 h-4 text-[#718579] absolute left-3 top-1/2 -translate-y-1/2" />
//                 <input
//                   type="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Enter your security passkey"
//                   className="w-full pl-9 pr-3 py-2 bg-[#070C09] border border-[#1C2E24] rounded-xl text-xs text-white placeholder-[#718579] focus:outline-none focus:border-[#10B981]"
//                 />
//               </div>
//             </div>

//             {error && (
//               <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 p-2.5 rounded-xl">
//                 {error}
//               </p>
//             )}

//             <button
//               type="submit"
//               className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0D6338] to-[#10B981] hover:from-[#15803D] hover:to-[#34D399] text-white font-bold text-xs transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
//             >
//               <CheckCircle2 className="w-4 h-4" />
//               <span>Access Situation Room</span>
//             </button>
//           </form>

//           {/* Quick Demo Access Buttons */}
//           <div className="pt-3 border-t border-[#1C2E24] space-y-2">
//             <span className="text-[10px] font-bold uppercase tracking-wider text-[#718579] block text-center">
//               ONE-TAP DEMO ROLES
//             </span>
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
//               <button
//                 type="button"
//                 onClick={() => launchDemo('agent')}
//                 className="py-2 px-2.5 rounded-xl bg-[#070C09] border border-[#1C2E24] hover:border-[#10B981] hover:bg-[#121F18] text-xs font-semibold text-white transition text-center"
//               >
//                 Field Agent
//               </button>
//               <button
//                 type="button"
//                 onClick={() => launchDemo('polling')}
//                 className="py-2 px-2.5 rounded-xl bg-[#070C09] border border-[#1C2E24] hover:border-[#10B981] hover:bg-[#121F18] text-xs font-semibold text-white transition text-center"
//               >
//                 Polling Agent
//               </button>
//               <button
//                 type="button"
//                 onClick={() => launchDemo('officer')}
//                 className="py-2 px-2.5 rounded-xl bg-[#070C09] border border-[#10B981]/50 bg-[#10B981]/10 text-xs font-bold text-[#10B981] hover:bg-[#10B981]/20 transition text-center"
//               >
//                 Election Officer
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="space-y-1.5 text-center">
//           <p className="text-[11px] text-[#718579]">
//             Independent Observer Intelligence System · Real Time
//           </p>
//           <div className="flex items-center justify-center gap-3 text-[11px] text-[#718579]">
//             <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition underline">
//               Privacy Policy
//             </a>
//             <span>•</span>
//             <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition underline">
//               Terms of Service
//             </a>
//             <span>•</span>
//             <a href="/deletion.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition underline">
//               Data Deletion
//             </a>
//             <span>•</span>
//             <a href="/support.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition underline">
//               Support
//             </a>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
