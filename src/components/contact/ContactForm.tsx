'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import emailjs from '@emailjs/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// EmailJS Configuration - Replace these with your actual values
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

interface ContactFormData {
  email: string;
  message: string;
}

interface FormErrors {
  email?: string;
  message?: string;
}

export function ContactForm() {
  const t = useTranslations('contact');
  const [formData, setFormData] = useState<ContactFormData>({
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = t('validation.messageRequired');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('validation.messageMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email using EmailJS
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_email: formData.email,
          message: formData.message,
          to_email: 'contact@dualaihub.com', // Your receiving email
        },
        EMAILJS_PUBLIC_KEY
      );

      if (response.status === 200) {
        setSubmitted(true);
        toast.success(t('form.success'));
        setFormData({ email: '', message: '' });
      } else {
        throw new Error('Failed to send email');
      }
    } catch {
      toast.error(t('form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setFormData({ email: '', message: '' });
    setErrors({});
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#0066ff]/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-[#00d4ff]" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {t('form.success')}
        </h3>
        <p className="text-white/60 mb-6">
          {t('info.response')}
        </p>
        <Button variant="outline" onClick={resetForm}>
          {t('form.submit')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-white/70 mb-2"
        >
          {t('form.email')}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder={t('form.emailPlaceholder')}
          error={!!errors.email}
          className="bg-[#1a1a2e] border-white/10 focus:border-[#0066ff] focus:ring-[#0066ff]/20"
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Message Field */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-white/70 mb-2"
        >
          {t('form.message')}
        </label>
        <Textarea
          id="message"
          name="message"
          required
          value={formData.message}
          onChange={handleChange}
          placeholder={t('form.messagePlaceholder')}
          rows={6}
          className="bg-[#1a1a2e] border-white/10 focus:border-[#0066ff] focus:ring-[#0066ff]/20 resize-none"
        />
        {errors.message && (
          <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            {t('form.sending')}
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            {t('form.submit')}
          </>
        )}
      </Button>
    </form>
  );
}