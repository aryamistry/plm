import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signup } from '../../api/auth.api';
import { ROLE_OPTIONS } from '../../utils/constants';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role_id: z.number({ required_error: 'Role is required' }).int().min(1).max(3),
});

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role_id: 1 },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signup(data);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed';
      setError('root', { message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-bg-border rounded-card p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-1">Create Account</h2>
      <p className="text-sm text-text-secondary mb-6">Register for PLM system access</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-input px-3 py-2 text-sm text-accent-red">
            {errors.root.message}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase font-display">Full Name</label>
          <input {...register('name')} placeholder="John Doe"
            className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted" />
          {errors.name && <p className="text-xs text-accent-red mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase font-display">Email</label>
          <input {...register('email')} type="email" placeholder="engineer@company.com"
            className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted" />
          {errors.email && <p className="text-xs text-accent-red mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase font-display">Password</label>
          <input {...register('password')} type="password" placeholder="Min 8 characters"
            className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted" />
          {errors.password && <p className="text-xs text-accent-red mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase font-display">Role</label>
          <select {...register('role_id', { valueAsNumber: true })}
            className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2.5 text-sm text-text-primary">
            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {errors.role_id && <p className="text-xs text-accent-red mt-1">{errors.role_id.message}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-accent-blue hover:bg-accent-blue-dim text-white font-medium py-2.5 rounded-input transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus size={16} />}
          Create Account
        </button>
      </form>

      <p className="text-sm text-text-secondary text-center mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-accent-blue hover:underline">Sign In</Link>
      </p>
    </div>
  );
}
