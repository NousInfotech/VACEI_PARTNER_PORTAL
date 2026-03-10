import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { apiPost } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import type { Client } from '../../../types/client';
import PageHeader from '../../common/PageHeader';
import { ShadowCard } from '../../../ui/ShadowCard';
import { toast } from 'sonner';
import { useAuth } from '../../../context/auth-context-core';

const CreateClient: React.FC = () => {
  const navigate = useNavigate();
  const { organizationMember } = useAuth();
  const orgId = organizationMember?.organizationId;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName || !password) {
      toast.error('First name, last name, email, and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (!orgId) {
        toast.error('Organization context is missing. Please re-login and try again.');
        setSubmitting(false);
        return;
      }

      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        password,
        type: 'ORG_ONBOARDED_CLIENT',
        organizationId: orgId,
      };
      if (email) payload.email = email;
      if (phone) payload.phone = phone;

      await apiPost<{ data: Client }>(endPoints.ONBOARDING.CREATE_CLIENT_FOR_ORG, payload);
      toast.success('Client created successfully');
      navigate('/dashboard/clients');
    } catch (err) {
      console.error('Failed to create client', err);
      toast.error('Failed to create client. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mx-auto">
      <PageHeader 
        title="New Client" 
        icon={Users}
        actions={
          <Button
            variant="header"
            onClick={() => navigate('/dashboard/clients')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        }
      />

      <ShadowCard className="p-8 border border-gray-100 shadow-sm rounded-2xl bg-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                placeholder="client@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                placeholder="+356 ..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                placeholder="Minimum 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl px-6"
              onClick={() => navigate('/dashboard/clients')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl px-8"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create client'}
            </Button>
          </div>
        </form>
      </ShadowCard>
    </div>
  );
};

export default CreateClient;
