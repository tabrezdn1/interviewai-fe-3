import React, { useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import { Button } from '../ui/button';

interface EmailSignUpFormProps {
  onSubmit: (data: { email: string; password: string; name: string }) => Promise<void>;
  isLoading: boolean;
}

const EmailSignUpForm: React.FC<EmailSignUpFormProps> = ({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    let isValid = true;

    // Validate email
    if (!email || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate password
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Validate name
    if (name.length < 2) {
      newErrors.name = 'Please enter your name (at least 2 characters)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      try {
        await onSubmit({ email, password, name });
      } catch (error) {
        console.error('Signup error:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background ${
            errors.name ? 'border-red-300 bg-red-50/50' : 'border-input'
          }`}
          placeholder="Your name"
          required
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background ${
            errors.email ? 'border-red-300 bg-red-50/50' : 'border-input'
          }`}
          placeholder="you@example.com"
          required
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10 bg-background ${
              errors.password ? 'border-red-300 bg-red-50/50' : 'border-input'
            }`}
            placeholder="••••••••"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password ? (
          <p className="mt-1 text-xs text-red-500">{errors.password}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Password must be at least 6 characters long
          </p>
        )}
      </div>
      
      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Creating account...</span>
            </div>
          ) : 'Create account'}
        </Button>
      </div>
    </form>
  );
};

export default EmailSignUpForm;