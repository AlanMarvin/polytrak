import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageSquare, Github, Twitter, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/seo/SEOHead';
import { StructuredData } from '@/components/seo/StructuredData';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Call the Supabase function to send email
      const { data, error } = await supabase.functions.invoke('contact-form', {
        body: formData
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to send message');
      }

      console.log('Contact form submitted successfully:', data);

      // Success
      setSubmitStatus({
        type: 'success',
        message: 'Thank you for your message! We will get back to you soon.'
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to send message. Please try again or contact us directly at polytrak@mail.com.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Layout>
      <SEOHead
        title="Contact Us - PolyTrak | Polymarket Trader Analysis Support"
        description="Get in touch with the PolyTrak team. Questions about Polymarket trader analysis or copy trading optimization? We're here to help."
        canonicalUrl="/contact"
      />
      <StructuredData
        schema={{
          type: 'FAQPage',
          questions: [
            {
              question: 'How does the AI analysis work?',
              answer: 'Our AI analyzes trading patterns, win rates, and risk metrics to provide optimized copy trading settings.',
            },
            {
              question: 'Is PolyTrak free to use?',
              answer: 'Yes, basic trader analysis is completely free. Premium features may be added in the future.',
            },
            {
              question: 'How do I integrate with TheTradeFox?',
              answer: 'Use the optimized settings provided by our analysis when setting up copy trading on TheTradeFox platform.',
            },
          ],
        }}
      />
      <div className="container py-16 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about Polytrak.io or need help with copy trading analysis?
            We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Send us a message</h2>
              <p className="text-muted-foreground">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
            </div>

            {submitStatus.type && (
              <div className={`p-4 rounded-lg mb-4 ${
                submitStatus.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  {submitStatus.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{submitStatus.message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="What's this about?"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us how we can help..."
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Get in touch</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href="mailto:polytrak@mail.com"
                      className="text-sm text-primary hover:underline"
                    >
                      Contact us
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Github className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">GitHub</p>
                    <a
                      href="https://github.com/AlanMarvin/polytrak"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View source code
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Twitter className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Twitter</p>
                    <a
                      href="https://twitter.com/alanmarv"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      @alanmarv
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">How does the AI analysis work?</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes trading patterns, win rates, and risk metrics to provide optimized copy trading settings.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Is Polytrak.io free to use?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, basic trader analysis is completely free. Premium features may be added in the future.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">How do I integrate with TheTradeFox?</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the optimized settings provided by our analysis when setting up copy trading on TheTradeFox platform.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
