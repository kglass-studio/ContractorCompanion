import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  CheckIcon, 
  XIcon,
  ArrowRightIcon,
  InfoIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PricingPage() {
  const [, navigate] = useLocation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  // Features for comparison
  const features = [
    {
      name: "Client Management",
      free: true,
      unlimited: true,
      tooltip: "Add and manage client information"
    },
    {
      name: "Number of clients",
      free: "Up to 5",
      unlimited: "Unlimited",
      tooltip: "Maximum number of clients you can manage"
    },
    {
      name: "Job Status Tracking",
      free: true,
      unlimited: true,
      tooltip: "Track the status of jobs from lead to paid"
    },
    {
      name: "Notes & Documentation",
      free: "Basic",
      unlimited: "Advanced",
      tooltip: "Add notes to client profiles and jobs"
    },
    {
      name: "Photo Attachments",
      free: true,
      unlimited: true,
      tooltip: "Attach photos to jobs and client records"
    },
    {
      name: "Follow-up Reminders",
      free: true,
      unlimited: true,
      tooltip: "Schedule reminders for follow-ups with clients"
    },
    {
      name: "Mobile Access",
      free: true,
      unlimited: true,
      tooltip: "Access your CRM from any mobile device"
    },
    {
      name: "Calendar Integration",
      free: false,
      unlimited: "Coming Soon",
      tooltip: "Sync with your calendar for appointments (coming soon)"
    },
    {
      name: "Email & SMS Notifications",
      free: true,
      unlimited: true,
      tooltip: "Receive notifications for important events"
    },
    {
      name: "Location Integration",
      free: false,
      unlimited: "Coming Soon",
      tooltip: "Google Maps integration for client locations (coming soon)"
    },
    {
      name: "Priority Support",
      free: false,
      unlimited: true,
      tooltip: "Get priority assistance when you need help"
    }
  ];

  // FAQ items
  const faqs = [
    {
      question: "Can I try the CRM before subscribing?",
      answer: "Yes! You can use our Free plan indefinitely with up to 5 clients. This gives you a chance to experience the core functionality before deciding to upgrade."
    },
    {
      question: "How does the payment process work?",
      answer: "We use PayPal to process all payments securely. You can pay with any major credit card or through your PayPal account."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. Your plan will remain active until the end of your current billing period."
    },
    {
      question: "What happens to my data if I downgrade to the Free plan?",
      answer: "If you downgrade to the Free plan and have more than 5 clients, you'll still be able to access all your client data, but you won't be able to add new clients until you're below the 5-client limit."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take data security very seriously. All data is encrypted both in transit and at rest, and we follow industry best practices for security."
    },
    {
      question: "Do you offer refunds?",
      answer: "If you're unsatisfied with your subscription, contact us within 14 days of payment for a full refund."
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="pt-20 pb-10 px-4 md:px-8 lg:px-16 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p 
            className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Pay only for what you need. Start free and upgrade as your business grows.
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-10 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Billing toggle */}
          <div className="flex justify-center mb-10">
            <div className="bg-white rounded-full p-1 inline-flex shadow-sm">
              <button
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "annual"
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setBillingCycle("annual")}
              >
                Annual <span className="text-green-600 font-bold">-20%</span>
              </button>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">Free</h3>
                  <p className="mt-2 text-gray-600">Perfect for getting started</p>
                </div>
                <span className="inline-block px-4 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                  LIMITED
                </span>
              </div>
              <div className="mt-6">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-600 ml-2">forever</span>
              </div>
              <div className="mt-6 border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-600 mb-6">Everything you need to manage up to 5 clients:</p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Up to 5 clients</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Basic client management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Job status tracking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Mobile friendly</span>
                  </li>
                  <li className="flex items-start">
                    <XIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-500">Photo attachments</span>
                  </li>
                  <li className="flex items-start">
                    <XIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-500">Follow-up reminders</span>
                  </li>
                </ul>
              </div>
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                MOST POPULAR
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">Unlimited</h3>
                  <p className="mt-2 text-gray-600">For growing businesses</p>
                </div>
                <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  BEST VALUE
                </span>
              </div>
              <div className="mt-6">
                <span className="text-5xl font-bold">${billingCycle === "monthly" ? "15" : "144"}</span>
                <span className="text-gray-600 ml-2">
                  per {billingCycle === "monthly" ? "month" : "year"}
                </span>
                {billingCycle === "annual" && (
                  <span className="ml-2 text-green-600 font-medium">Save $36</span>
                )}
              </div>
              <div className="mt-6 border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-600 mb-6">Everything in Free, plus:</p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Unlimited clients</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Advanced client management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Follow-up reminders</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Photo attachments</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Calendar integration</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Button 
                  className="w-full py-6 bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/signup")}
                >
                  Upgrade Now
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-4 md:px-8 lg:px-16 bg-white mt-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Compare Plans</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Features</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-600">Free</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-600">Unlimited</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-4 flex items-center">
                      {feature.name}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-gray-400 ml-2 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-sm">{feature.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="text-center py-4 px-4">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XIcon className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span>{feature.free}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {typeof feature.unlimited === 'boolean' ? (
                        feature.unlimited ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XIcon className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className={`font-medium ${feature.unlimited === 'Coming Soon' ? 'text-amber-600 text-sm' : ''}`}>
                          {feature.unlimited}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 md:px-8 lg:px-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {faqs.map((faq, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">Have more questions?</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/contact")}
            >
              Contact Support
            </Button>
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
    </div>
  );
}