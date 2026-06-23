import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { PageHeader, Spinner } from '../../components/ui/index';
import { BUILDING_NAMES } from '../../constants/campus';

const CATEGORIES = ['Electrical','Plumbing','WiFi','Hostel','Cleanliness','Furniture','Security','Classroom','Laboratory','Other'];

export default function EditComplaint() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [preview, setPreview]     = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
    api.get(`/complaints/${id}`)
      .then(({ data }) => {
        const c = data.complaint;
        if (c.status !== 'Pending') {
          toast.error('Only Pending complaints can be edited');
          navigate(`/dashboard/complaints/${id}`);
          return;
        }
        reset({
          title:       c.title,
          description: c.description,
          category:    c.category,
          building:    c.building,
          lat:         c.coordinates?.lat || '',
          lng:         c.coordinates?.lng || '',
        });
        if (c.imageUrl) setExistingImage(c.imageUrl);
      })
      .catch(() => {
        toast.error('Could not load complaint');
        navigate('/dashboard/complaints');
      })
      .finally(() => setFetching(false));
  }, [id, navigate, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title',       data.title);
      form.append('description', data.description);
      form.append('category',    data.category);
      form.append('building',    data.building);
      form.append('lat', data.lat ?? '');
      form.append('lng', data.lng ?? '');
      if (imageFile) form.append('image', imageFile);
      if (removeImage && !imageFile) form.append('removeImage', 'true');

      await api.put(`/complaints/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Complaint updated!');
      navigate(`/dashboard/complaints/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be < 5MB'); return; }
    setImageFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  if (fetching) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Complaint" subtitle="Update your complaint details" />
      <motion.form onSubmit={handleSubmit(onSubmit)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="card space-y-5">

        <div>
          <label className="label">Title <span className="text-red-500">*</span></label>
          <input className="input" {...register('title', { required: 'Title is required', maxLength: { value: 120, message: 'Max 120 chars' } })} />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category <span className="text-red-500">*</span></label>
            <select className="input" {...register('category', { required: 'Required' })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Building <span className="text-red-500">*</span></label>
            <select className="input" {...register('building', { required: 'Required' })}>
              {BUILDING_NAMES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description <span className="text-red-500">*</span></label>
          <textarea className="input min-h-[120px] resize-y"
            {...register('description', { required: 'Required', maxLength: { value: 1000, message: 'Max 1000 chars' } })} />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="label">Coordinates <span className="text-slate-400 text-xs">(optional)</span></label>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Latitude" type="number" step="any" {...register('lat')} />
            <input className="input" placeholder="Longitude" type="number" step="any" {...register('lng')} />
          </div>
        </div>

        <div>
          <label className="label">Photo</label>
          {(preview || existingImage) && (
            <div className="relative mb-3">
              <img src={preview || existingImage} alt="preview" className="w-full max-h-48 object-cover rounded-xl" />
              <button type="button"
                onClick={() => { setPreview(null); setImageFile(null); setExistingImage(null); setRemoveImage(true); }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 flex items-center justify-center">
                ✕
              </button>
            </div>
          )}
          {!preview && !existingImage && (
            <label className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 text-slate-400 cursor-pointer hover:border-brand-300 transition-colors">
              <span className="text-2xl">📷</span>
              <span className="text-sm">Click to upload new photo</span>
              <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} />
            </label>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(`/dashboard/complaints/${id}`)} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : '💾 Save Changes'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
