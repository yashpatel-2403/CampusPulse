import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { PageHeader } from '../../components/ui/index';
import CampusMapPicker from '../../components/ui/CampusMapPicker';
import { getCachedBoundary, loadBoundary } from '../../services/boundary';
import { BUILDING_NAMES } from '../../constants/campus';

const CATEGORIES = ['Electrical','Plumbing','WiFi','Hostel','Cleanliness','Furniture','Security','Classroom','Laboratory','Other'];
const CATEGORY_ICONS = {
  Electrical:'⚡', Plumbing:'🚿', WiFi:'📶', Hostel:'🏠',
  Cleanliness:'🧹', Furniture:'🪑', Security:'🔒',
  Classroom:'📚', Laboratory:'🔬', Other:'📌',
};

export default function NewComplaint() {
  const navigate  = useNavigate();
  const [boundary, setBoundary] = useState(getCachedBoundary());
  const [loading,   setLoading]   = useState(false);
  const [preview,   setPreview]   = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [pinData,   setPinData]   = useState(null);
  const [step,      setStep]      = useState(1);

  const { register, handleSubmit, formState:{ errors }, watch, setValue, trigger } = useForm();
  const selectedCategory = watch('category');

  useEffect(() => {
    loadBoundary().then(setBoundary);
  }, []);

  const onSubmit = async (data) => {
    if (!pinData && !data.building) {
      toast.error('Please pin a location or select a building');
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title',       data.title);
      form.append('description', data.description);
      form.append('category',    data.category);
      form.append('building',    pinData?.building || data.building);
      if (pinData?.lat != null) form.append('lat', pinData.lat);
      if (pinData?.lng != null) form.append('lng', pinData.lng);
      if (imageFile)    form.append('image', imageFile);
      await api.post('/complaints', form, { headers:{ 'Content-Type':'multipart/form-data' } });
      toast.success('Complaint submitted!');
      navigate('/dashboard/complaints');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setLoading(false); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { toast.error('Image must be < 5MB'); e.target.value=''; return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const steps = [
    { n:1, label:'Details'  },
    { n:2, label:'Location' },
    { n:3, label:'Photo'    },
  ];

  return (
    <div className="max-w-2xl page-enter">
      <PageHeader title="Submit a Complaint" subtitle="Report an issue on your campus" />

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <button type="button" onClick={() => setStep(s.n)} className="flex items-center gap-2 group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                step===s.n ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : step>s.n  ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-400'
              }`}>{step>s.n ? '✓' : s.n}</div>
              <span className={`text-sm font-medium hidden sm:block transition-colors ${
                step===s.n ? 'text-blue-700' : step>s.n ? 'text-emerald-600' : 'text-slate-400'
              }`}>{s.label}</span>
            </button>
            {i < steps.length-1 && (
              <div className={`flex-1 h-0.5 mx-3 transition-colors duration-300 ${step>s.n ? 'bg-emerald-400' : 'bg-slate-100'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={e => e.preventDefault()}>
        <AnimatePresence mode="wait">

          {/* Step 1: Details */}
          {step===1 && (
            <motion.div key="s1"
              initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
              transition={{duration:0.22}} className="card space-y-5">
              <div>
                <label className="label">Title <span className="text-red-500">*</span></label>
                <input className={`input ${errors.title?'input-error':''}`}
                  placeholder="e.g. Broken light in corridor"
                  {...register('title',{required:'Title is required',maxLength:{value:120,message:'Max 120 characters'}})} />
                {errors.title && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.title.message}</p>}
              </div>

              <div>
                <label className="label">Category <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="cursor-pointer">
                      <input type="radio" value={cat} className="sr-only"
                        {...register('category',{required:'Please select a category'})} />
                      <div className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all duration-150 ${
                        selectedCategory===cat
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-100 bg-white hover:border-slate-200 text-slate-600'
                      }`}>
                        <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                        <span className="text-[10px] font-semibold leading-tight">{cat}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.category && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.category.message}</p>}
              </div>

              <div>
                <label className="label">Description <span className="text-red-500">*</span></label>
                <textarea className={`input min-h-[110px] resize-none ${errors.description?'input-error':''}`}
                  placeholder="Describe the issue in detail…"
                  {...register('description',{required:'Description is required',maxLength:{value:1000,message:'Max 1000 characters'}})} />
                {errors.description && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.description.message}</p>}
              </div>

              <div className="flex justify-end pt-2">
                <button type="button" onClick={async () => {
                  if (await trigger(['title', 'category', 'description'])) setStep(2);
                }} className="btn-primary px-6">
                  Next: Location →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location (Map) */}
          {step===2 && (
            <motion.div key="s2"
              initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
              transition={{duration:0.22}} className="card space-y-4">
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Pin the location</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Click inside the blue campus boundary to mark where the issue is.
                  The nearest building is auto-detected.
                </p>
                {/* Pass admin-configured boundary to map picker */}
                <CampusMapPicker
                  boundary={boundary}
                  onSelect={(info) => {
                    setPinData(info);
                    if (info) setValue('building', info.building);
                  }}
                  initialLat={pinData?.lat}
                  initialLng={pinData?.lng}
                />
              </div>

              {!pinData && (
                <div>
                  <label className="label">
                    Or select building manually
                    <span className="text-slate-400 text-xs font-normal ml-1">(if map unavailable)</span>
                  </label>
                  <select className="input" {...register('building')}>
                    <option value="">Select building…</option>
                    {BUILDING_NAMES.map(b=>(
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setStep(1)} className="btn-secondary flex-1 justify-center">← Back</button>
                <button type="button" onClick={()=>setStep(3)} className="btn-primary flex-1 justify-center">Next: Photo →</button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Photo + Submit */}
          {step===3 && (
            <motion.div key="s3"
              initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
              transition={{duration:0.22}} className="card space-y-5">
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Attach a photo</h3>
                <p className="text-sm text-slate-500 mb-4">
                  A photo helps the admin understand the issue faster.{' '}
                  <span className="text-slate-400">(optional)</span>
                </p>
                {preview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={preview} alt="preview" className="w-full max-h-56 object-cover" />
                    <button type="button"
                      onClick={() => { setPreview(null); setImageFile(null); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-sm transition-colors backdrop-blur-sm">✕</button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent p-3">
                      <p className="text-white text-xs font-medium">{imageFile?.name}</p>
                    </div>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-8 text-center cursor-pointer transition-colors group">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">📷</div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">Click to upload a photo</p>
                    <p className="text-xs text-slate-400">JPG, PNG, WebP · Max 5MB</p>
                    <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} />
                  </label>
                )}
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-sm space-y-2">
                <p className="font-semibold text-slate-700 mb-2">📋 Summary</p>
                {[
                  ['Title',       watch('title')    || '—'],
                  ['Category',    watch('category') || '—'],
                  ['Location',    pinData?.building || watch('building') || '—'],
                  ...(pinData ? [['Coordinates', `${pinData.lat}, ${pinData.lng}`]] : []),
                ].map(([k,v])=>(
                  <div key={k} className="flex gap-2">
                    <span className="text-slate-400 w-24 flex-shrink-0">{k}</span>
                    <span className="text-slate-700 font-medium truncate">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setStep(2)} className="btn-secondary flex-1 justify-center">← Back</button>
                <button type="button" onClick={handleSubmit(onSubmit)} disabled={loading} className="btn-primary flex-1 justify-center">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                      </svg>
                      Submitting…
                    </span>
                  ) : '📤 Submit Complaint'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
