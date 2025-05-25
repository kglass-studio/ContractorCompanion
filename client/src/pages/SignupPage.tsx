import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRightIcon, Loader2Icon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Account details, 2: Plan selection
  const [selectedPlan, setSelectedPlan] = useState<"free" | "unlimited">("free");

  // Initialize form
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false
    }
  });

  // Handle form submission
  const onSubmit = async (values: SignupFormValues) => {
    if (step === 1) {
      // Move to plan selection step
      setStep(2);
      return;
    }

    try {
      setIsSubmitting(true);

      // In a real implementation, this would call your signup API
      // For now, we'll simulate the API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Show success message
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });

      // Navigate to the appropriate page based on the selected plan
      if (selectedPlan === "unlimited") {
        navigate("/payment");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicators
  const passwordValue = form.watch("password");
  const passwordStrength = {
    length: passwordValue?.length >= 8,
    uppercase: /[A-Z]/.test(passwordValue || ""),
    lowercase: /[a-z]/.test(passwordValue || ""),
    number: /[0-9]/.test(passwordValue || ""),
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate("/")}>
                <span className="text-xl font-bold text-primary">Solo CRM</span>
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Already have an account?</span>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Log in
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Steps indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                step >= 1 ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
              }`}>
                1
              </div>
              <div className={`h-1 w-12 ${
                step >= 2 ? "bg-primary" : "bg-gray-200"
              }`}></div>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                step >= 2 ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
              }`}>
                2
              </div>
            </div>
          </div>

          <motion.div
            key={step}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.3 }}
          >
            {step === 1 ? (
              <>
                <div className="text-center">
                  <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                    Create your account
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Start managing your clients more effectively
                  </p>
                </div>

                <div className="mt-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className={`text-xs flex items-center ${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordStrength.length ? <CheckIcon className="h-3 w-3 mr-1" /> : null}
                                <span>8+ characters</span>
                              </div>
                              <div className={`text-xs flex items-center ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordStrength.uppercase ? <CheckIcon className="h-3 w-3 mr-1" /> : null}
                                <span>Uppercase letter</span>
                              </div>
                              <div className={`text-xs flex items-center ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordStrength.lowercase ? <CheckIcon className="h-3 w-3 mr-1" /> : null}
                                <span>Lowercase letter</span>
                              </div>
                              <div className={`text-xs flex items-center ${passwordStrength.number ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordStrength.number ? <CheckIcon className="h-3 w-3 mr-1" /> : null}
                                <span>Number</span>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-1">
                            <FormControl>
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                I agree to the <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <div>
                        <Button
                          type="submit"
                          className="w-full flex justify-center py-6"
                          disabled={!form.formState.isValid}
                        >
                          Continue
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                    Choose your plan
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Select the plan that works best for you
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  {/* Free Plan */}
                  <div 
                    className={`p-6 border rounded-lg cursor-pointer transition-all ${
                      selectedPlan === "free" 
                        ? "border-2 border-primary bg-primary/5" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPlan("free")}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Free</h3>
                        <p className="text-sm text-gray-500">Up to 5 clients</p>
                      </div>
                      <div>
                        <span className="text-2xl font-bold">$0</span>
                        <span className="text-gray-500 ml-1 text-sm">/month</span>
                      </div>
                    </div>
                  </div>

                  {/* Unlimited Plan */}
                  <div 
                    className={`p-6 border rounded-lg cursor-pointer transition-all ${
                      selectedPlan === "unlimited" 
                        ? "border-2 border-primary bg-primary/5" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPlan("unlimited")}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Unlimited</h3>
                        <p className="text-sm text-gray-500">Unlimited clients & features</p>
                      </div>
                      <div>
                        <span className="text-2xl font-bold">$15</span>
                        <span className="text-gray-500 ml-1 text-sm">/month</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="button"
                      className="w-full flex justify-center py-6"
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {selectedPlan === "free" ? "Get Started" : "Continue to Payment"}
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Solo CRM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}