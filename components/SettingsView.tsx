import React from 'react';
import { ArrowLeft, RefreshCw, Image as ImageIcon, Edit3 } from 'lucide-react';
import { Occupation } from '../types';
import { RIASEC_COLORS, BRAND_COLORS, SELECTABLE_PACKS, resolvePackImageUrl, defaultImageUrl } from '../constants';
import { useT } from '../i18n';

interface SettingsViewProps {
  occupations: Occupation[];
  onUpdate: (id: string, updates: Partial<Occupation>) => void;
  onReset: () => void;
  onBack: () => void;
  imagePack: string;
  onPackChange: (packId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ occupations, onUpdate, onReset, onBack, imagePack, onPackChange }) => {
  const { t } = useT();
  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
         <button
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
         >
            <ArrowLeft className="w-6 h-6" />
         </button>
         <h2 className="text-xl font-bold text-gray-800">{t('admin.title')}</h2>
         <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
         <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
             <div className="flex items-start">
                 <Edit3 className="w-5 h-5 text-blue-600 mt-0.5 mr-2 shrink-0" />
                 <p className="text-sm text-blue-800">
                     {t('admin.intro')}
                 </p>
             </div>
         </div>

         {/* Art Pack selector */}
         <div className="bg-white p-4 rounded-xl mb-4 border border-gray-100 shadow-sm">
             <div className="flex items-center mb-3">
                 <ImageIcon className="w-5 h-5 mr-2" style={{ color: BRAND_COLORS.blue }} />
                 <p className="text-sm font-bold text-gray-700">{t('admin.artPack')}</p>
             </div>
             <div className="flex flex-wrap gap-2">
                 {SELECTABLE_PACKS.map(pack => {
                     const active = imagePack === pack.id;
                     return (
                         <button
                            key={pack.id}
                            onClick={() => onPackChange(pack.id)}
                            className={`min-h-11 px-3 py-2 rounded-full text-sm font-semibold border transition-colors ${active ? 'text-white' : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                            style={active ? { backgroundColor: BRAND_COLORS.blue, borderColor: BRAND_COLORS.blue } : undefined}
                         >
                            {pack.label}
                         </button>
                     );
                 })}
             </div>
             <p className="text-xs text-gray-400 mt-2">
                 {t('admin.fallbackNote')}
             </p>
         </div>

         {occupations.map(occ => (
             <div key={occ.id} className="flex items-start p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                 <div className="relative w-20 h-20 shrink-0 mt-1">
                     <img
                        key={`${occ.id}-${imagePack}`}
                        src={resolvePackImageUrl(occ.imageUrl, imagePack)}
                        alt=""
                        onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.fallback) { t.dataset.fallback = '1'; t.src = defaultImageUrl(occ.imageUrl); } }}
                        className="w-full h-full object-cover rounded-xl bg-gray-200"
                     />
                 </div>

                 <div className="ml-4 flex-1 min-w-0">
                     <div className="flex items-center mb-1">
                        <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: RIASEC_COLORS[occ.category] }}
                        />
                        <span className="text-xs font-bold text-gray-400 uppercase">{t('riasec.label.' + occ.category)}</span>
                     </div>

                     <input
                        type="text"
                        value={occ.title}
                        onChange={(e) => onUpdate(occ.id, { title: e.target.value })}
                        className="w-full font-bold text-gray-900 bg-transparent border-b border-gray-200 focus:border-blue-500 focus:bg-gray-50 focus:outline-none transition-all py-1 rounded-t-sm"
                        placeholder={t('admin.jobTitle')}
                     />

                     <input
                        type="text"
                        value={occ.description}
                        onChange={(e) => onUpdate(occ.id, { description: e.target.value })}
                        className="mt-1 min-h-10 w-full rounded-b-sm border-b border-gray-200 bg-transparent py-2 text-base text-gray-500 transition-all focus:border-blue-500 focus:bg-gray-50 focus:outline-none"
                        placeholder={t('admin.description')}
                     />
                 </div>
             </div>
         ))}

         <div className="pt-4 pb-8">
            <button
                onClick={() => {
                    if (confirm(t('admin.resetConfirm'))) {
                        onReset();
                    }
                }}
                className="w-full py-4 text-red-500 font-medium flex items-center justify-center bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
            >
                <RefreshCw className="w-4 h-4 mr-2" /> {t('admin.reset')}
            </button>
         </div>
      </div>
    </div>
  );
};
