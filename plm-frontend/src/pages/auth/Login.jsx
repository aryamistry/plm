import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { login as loginApi } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await loginApi(data);
      const { accessToken, refreshToken, user } = res.data.data;
      login({ user, accessToken, refreshToken });
      toast.success(`Welcome back, ${user.name}`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError('root', { message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-bg-border rounded-card p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-1">Sign In</h2>
      <p className="text-sm text-text-secondary mb-6">Enter your credentials to access the PLM system</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-input px-3 py-2 text-sm text-accent-red">
            {errors.root.message}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase font-display">Email</label>
          <input {...register('email')} type="email" placeholder="engineer@company.com"
            className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted" />
          {errors.email && <p className="text-xs text-accent-red mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase font-display">Password</label>
          <div className="relative">
            <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••"
              className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-accent-red mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-accent-blue hover:bg-accent-blue-dim text-white font-medium py-2.5 rounded-input transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn size={16} />}
          Sign In
        </button>
      </form>

      <p className="text-sm text-text-secondary text-center mt-4">
        Don't have an account?{' '}
        <Link to="/signup" className="text-accent-blue hover:underline">Sign Up</Link>
      </p>
    </div>
  );
}
