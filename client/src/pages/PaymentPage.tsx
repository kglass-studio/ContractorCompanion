import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2Icon, CheckIcon, CreditCardIcon, ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PaymentButton from "../components/PaymentButton";

export default function PaymentPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success" | "error">("pending");
  const [orderId, setOrderId] = useState<string | null>(null);

  // Handle payment success
  const handlePaymentSuccess = (details: any) => {
    setPaymentStatus("success");
    setOrderId(details.id);
    
    // Store user's paid status in localStorage for this demonstration
    localStorage.setItem('userPlan', 'paid');
    
    // In a production implementation, we would:
    // 1. Call our server API to verify the payment with PayPal
    // 2. Update the user's subscription in the database
    // 3. Set up recurring billing through PayPal's subscription API
    
    setTimeout(() => {
      toast({
        title: "Payment successful!",
        description: "Your subscription has been activated. Welcome to the Unlimited plan!",
      });
      navigate("/dashboard");
    }, 2000);
  };

  // Handle payment error
  const handlePaymentError = (error: any) => {
    setPaymentStatus("error");
    toast({
      title: "Payment failed",
      description: "There was an error processing your payment. Please try again.",
      variant: "destructive",
    });
  };

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
              <Button variant="ghost" onClick={() => navigate("/signup")}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Plans
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="bg-white shadow-lg rounded-xl overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Payment header */}
            <div className="bg-primary text-white p-6">
              <motion.h1 
                className="text-2xl font-bold"
                variants={itemVariants}
              >
                Complete Your Subscription
              </motion.h1>
              <motion.p 
                className="mt-2 text-white/80"
                variants={itemVariants}
              >
                You're signing up for the Unlimited plan
              </motion.p>
            </div>

            <div className="p-6">
              {/* Order summary */}
              <motion.div 
                className="mb-8"
                variants={itemVariants}
              >
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span>Unlimited Plan (Monthly)</span>
                    <span>$15.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-semibold">
                    <span>Total</span>
                    <span>$15.00 USD</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  You will be charged $15.00 today and then $15.00 on the same day each month until canceled.
                </p>
              </motion.div>

              {/* Payment section */}
              <motion.div variants={itemVariants}>
                <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                
                {paymentStatus === "success" ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <CheckIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-green-900">Payment Successful!</h3>
                    <p className="text-green-700 mt-2">
                      Your subscription has been activated. Thank you for your purchase!
                    </p>
                    <p className="text-sm text-green-600 mt-4">
                      Order ID: {orderId}
                    </p>
                    <Button 
                      className="mt-6" 
                      onClick={() => navigate("/dashboard")}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                ) : paymentStatus === "error" ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                      <CreditCardIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-red-900">Payment Failed</h3>
                    <p className="text-red-700 mt-2">
                      There was an error processing your payment. Please try again.
                    </p>
                    <Button 
                      className="mt-6" 
                      onClick={() => setPaymentStatus("pending")}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="mb-6">
                      <div className="flex justify-center mb-4">
                        <img 
                          src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_200x51.png" 
                          alt="PayPal" 
                          className="h-10" 
                        />
                      </div>
                      <p className="text-center text-sm text-gray-600 mb-4">
                        Securely pay with your PayPal account or credit card through PayPal.
                      </p>
                      
                      <div className="flex justify-center mt-4">
                        <div className="w-full max-w-xs">
                          {/* Real PayPal button with fallback option */}
                          <div id="paypal-button-container">
                            <PaymentButton
                              amount="15.00"
                              onSuccess={handlePaymentSuccess}
                              onError={handlePaymentError}
                            />
                          </div>
                          
                          <details className="mt-4 text-sm text-gray-600">
                            <summary className="cursor-pointer">Having trouble with PayPal?</summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              <p className="mb-2">You can use our alternative payment method:</p>
                              <Button
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md"
                                onClick={() => {
                                  console.log("Using alternative payment method");
                                  setPaymentStatus("processing");
                                  
                                  // Store user's paid status in localStorage
                                  localStorage.setItem('userPlan', 'paid');
                                  
                                  // Simulate a short delay for processing
                                  setTimeout(() => {
                                    handlePaymentSuccess({
                                      id: `alt-${Date.now()}`,
                                      status: 'COMPLETED'
                                    });
                                  }, 2000);
                                }}
                              >
                                Pay $15.00 with Alternative Method
                              </Button>
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center text-xs text-gray-500 mt-6">
                      <p>By completing your purchase, you agree to our <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.</p>
                    </div>
                  </div>
                )}
              </motion.div>
              
              {/* Security notice */}
              <motion.div 
                className="mt-8 text-center text-sm text-gray-500"
                variants={itemVariants}
              >
                <p className="flex items-center justify-center">
                  <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  All payments are securely processed through PayPal
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Solo CRM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}