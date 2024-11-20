import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AnimatedBackground } from '../components/AnimatedBackground';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }
      const result = await register(email, password);
      if (!result.success && result.error) {
        setError(result.error);
      }
    } else {
      const result = await login(email, password);
      if (!result.success && result.error) {
        setError(result.error);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <AnimatedBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <motion.div 
            className="mx-auto h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <LogIn className="h-6 w-6 text-white" />
          </motion.div>
          <h2 className="mt-6 text-center text-3xl font-extrabold gradient-text">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your tasks
          </p>
        </div>
        
        <motion.form 
          className="mt-8 space-y-6 glass-card p-8 rounded-2xl"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="input-icon hidden sm:block">
                  <Mail className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field input-field-with-icon"
                  placeholder="Email address"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="input-icon hidden sm:block">
                  <Lock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field input-field-with-icon"
                  placeholder="Password"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="input-icon hidden sm:block">
                    <Lock className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field input-field-with-icon"
                    placeholder="Confirm Password"
                  />
                </div>
              </div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white btn-primary"
            >
              {isRegister ? 'Register' : 'Sign in'}
            </motion.button>

            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-indigo-600 hover:text-indigo-500 text-center"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}