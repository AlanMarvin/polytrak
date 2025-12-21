import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageSquare, Github, Twitter } from 'lucide-react';

const Contact = () => {
  return (
    <Layout>
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

            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <Input id="name" placeholder="Your name" />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <Input id="subject" placeholder="What's this about?" />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Tell us how we can help..."
                  rows={5}
                />
              </div>

              <Button type="submit" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
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
