import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signup } from '../../api/auth.api';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
});

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = 'Sign Up — PLM'; }, []);

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signup(data);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed';
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach(e => {
          if (e.field) setError(e.field, { message: e.message });
        });
      }
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
          <input {...register('password')} type="password" placeholder="Min 8 chars, uppercase, number, special"
            className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted" />
          {errors.password && <p className="text-xs text-accent-red mt-1">{errors.password.message}</p>}
        </div>

        <p className="text-xs text-text-muted">
          All new accounts are assigned the{' '}
          <span className="text-accent-cyan font-display">Operations</span> role.
          Admins can update your role after registration.{' '}
          <span className="text-accent-amber font-display">
            The very first account created becomes Admin automatically.
          </span>
        </p>

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
