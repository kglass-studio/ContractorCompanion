import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  UsersIcon, 
  CalendarIcon, 
  ClipboardListIcon, 
  CreditCardIcon, 
  CheckIcon,
  ArrowRightIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: "Client Management",
      description: "Keep all your client information organized in one place. Add detailed profiles, contact info, and job histories.",
      icon: <UsersIcon className="h-12 w-12 text-primary" />,
      image: "/screenshot-clients.jpg"
    },
    {
      title: "Job Scheduling",
      description: "Schedule jobs with automatic reminders. Never miss an appointment or deadline again.",
      icon: <CalendarIcon className="h-12 w-12 text-primary" />,
      image: "/screenshot-schedule.jpg"
    },
    {
      title: "Task Tracking",
      description: "Track your work from lead to payment. Custom job statuses keep you on top of your business.",
      icon: <ClipboardListIcon className="h-12 w-12 text-primary" />,
      image: "/screenshot-tasks.jpg"
    },
    {
      title: "Simple Pricing",
      description: "Affordable plans for independent contractors. Start free and upgrade only when you need to.",
      icon: <CreditCardIcon className="h-12 w-12 text-primary" />,
      image: "/screenshot-pricing.jpg"
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-4 md:px-8 lg:px-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center md:text-left md:max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              <span className="block text-primary">Simple CRM</span>
              <span className="block">Built for Solo Contractors</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600">
              The easiest way to manage clients, schedule jobs, and grow your business - all from your phone.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate("/signup")}
              >
                Get Started Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6"
                onClick={() => navigate("/pricing")}
              >
                View Pricing
              </Button>
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-8 py-6 bg-blue-600 text-white hover:bg-blue-700 mt-4 sm:mt-0"
                onClick={() => {
                  localStorage.setItem('isLoggedIn', 'true');
                  window.location.href = '/clients';
                }}
              >
                Demo Login (No Password)
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute top-20 right-0 -z-10 hidden lg:block">
          <div className="w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
        </div>
        <div className="absolute bottom-10 left-10 -z-10 hidden lg:block">
          <div className="w-96 h-96 rounded-full bg-blue-500/5 blur-3xl"></div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              All the tools you need, none of the complexity
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Designed specifically for independent contractors and small service businesses
            </p>
          </div>

          <motion.div 
            className="grid md:grid-cols-2 gap-16 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Feature Tabs */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className={`p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                    activeFeature === index 
                      ? "bg-primary/10 border-l-4 border-primary" 
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start">
                    <div className="mr-4 p-2 bg-white rounded-lg shadow-sm">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature Image */}
            <motion.div 
              className="bg-gray-200 rounded-xl overflow-hidden shadow-xl h-[500px] hidden md:block"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                <span className="text-lg">App Screenshot</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Start for free, pay only when your business grows
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold">Free</h3>
              <p className="mt-2 text-gray-600">Perfect for getting started</p>
              <div className="mt-6">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-600 ml-2">forever</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Up to 5 clients</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Basic client management</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Job status tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Mobile friendly</span>
                </li>
              </ul>
              <div className="mt-8">
                <Button 
                  className="w-full py-6"
                  onClick={() => navigate("/signup")}
                >
                  Get Started
                </Button>
              </div>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-lg border-2 border-primary relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold">Unlimited</h3>
              <p className="mt-2 text-gray-600">For growing businesses</p>
              <div className="mt-6">
                <span className="text-5xl font-bold">$15</span>
                <span className="text-gray-600 ml-2">per month</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Advanced client management</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Job status tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Follow-up reminders</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Photo attachments</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Mobile friendly</span>
                </li>
              </ul>
              <div className="mt-8">
                <Button 
                  className="w-full py-6 bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/pricing")}
                >
                  Upgrade to Pro
                </Button>
              </div>
            </motion.div>
          </div>

          <div className="text-center mt-10">
            <Button 
              variant="link" 
              className="text-lg"
              onClick={() => navigate("/pricing")}
            >
              View full pricing details
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section (Placeholder) */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Trusted by contractors everywhere
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              See what other contractors are saying about our CRM
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((_, i) => (
              <motion.div 
                key={i}
                className="bg-gray-50 p-6 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                  <div className="ml-4">
                    <h4 className="font-semibold">Contractor Name</h4>
                    <p className="text-sm text-gray-600">Service Business</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "This CRM has completely transformed how I manage my clients and jobs. Everything is in one place and so easy to use."
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Ready to simplify your client management?
          </motion.h2>
          <motion.p 
            className="mt-4 text-xl text-white/80"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Start for free today, no credit card required
          </motion.p>
          <motion.div 
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90"
              onClick={() => navigate("/signup")}
            >
              Get Started Free
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 md:px-8 lg:px-16 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">Features</Button></li>
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">Pricing</Button></li>
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">FAQ</Button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">About</Button></li>
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">Contact</Button></li>
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">Blog</Button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">Privacy</Button></li>
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">Terms</Button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">Twitter</Button></li>
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">LinkedIn</Button></li>
                <li><Button variant="link" className="text-white/70 hover:text-white p-0 h-auto">Facebook</Button></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 text-center text-white/60 text-sm">
            © {new Date().getFullYear()} Solo CRM. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}