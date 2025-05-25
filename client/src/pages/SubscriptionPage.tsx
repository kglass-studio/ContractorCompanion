import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeftIcon, CheckIcon, CreditCardIcon, Crown, AlertCircle, ShieldCheck, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

export default function SubscriptionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [userPlan, setUserPlan] = useState<'free' | 'paid'>('free');
  const [subscriptionDate, setSubscriptionDate] = useState<string>('');
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Load subscription info from localStorage
  useEffect(() => {
    const storedPlan = localStorage.getItem('userPlan');
    if (storedPlan === 'paid') {
      setUserPlan('paid');
      
      // In a real app, we would fetch this from the server
      // For now, we'll set mock data if none exists
      const storedDate = localStorage.getItem('subscriptionDate');
      if (storedDate) {
        setSubscriptionDate(storedDate);
      } else {
        // Set to today's date if not found
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('subscriptionDate', today);
        setSubscriptionDate(today);
      }
      
      // Set subscription ID
      const storedId = localStorage.getItem('subscriptionId');
      if (storedId) {
        setSubscriptionId(storedId);
      } else {
        // Generate mock ID
        const mockId = `sub_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('subscriptionId', mockId);
        setSubscriptionId(mockId);
      }
    }
  }, []);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate next billing date (1 month from subscription date)
  const getNextBillingDate = () => {
    if (!subscriptionDate) return '';
    const date = new Date(subscriptionDate);
    date.setMonth(date.getMonth() + 1);
    return formatDate(date.toISOString().split('T')[0]);
  };
  
  // Handle subscription cancel
  const handleCancelSubscription = () => {
    // In a real app, we would call the server to cancel the subscription
    // For now, we'll just update localStorage
    
    // Show loading toast
    toast({
      title: "Processing...",
      description: "Cancelling your subscription",
    });
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem('userPlan', 'free');
      localStorage.removeItem('subscriptionDate');
      localStorage.removeItem('subscriptionId');
      
      setUserPlan('free');
      setSubscriptionDate('');
      setSubscriptionId('');
      
      // Close dialog
      setShowCancelDialog(false);
      
      // Show success toast
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You can continue using the free plan.",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex items-center gap-2">
          <button 
            className="p-1" 
            onClick={() => navigate("/profile")}
          >
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="text-xl font-bold">Subscription Management</h1>
        </div>
      </header>

      <motion.div 
        className="p-4 max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Current Plan */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Current Plan</span>
                <Badge className={userPlan === 'paid' ? 'bg-amber-500' : 'bg-blue-500'}>
                  {userPlan === 'paid' ? 'UNLIMITED' : 'FREE'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userPlan === 'paid' ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
                    <Crown className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800">Unlimited Plan Active</h3>
                      <p className="text-amber-700 text-sm mt-1">
                        You're on the Unlimited plan with access to all premium features.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subscription Date:</span>
                      <span className="font-medium">{formatDate(subscriptionDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Next Billing Date:</span>
                      <span className="font-medium">{getNextBillingDate()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subscription ID:</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{subscriptionId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-medium">$15.00 / month</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className="font-medium text-green-600 flex items-center">
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-800">Free Plan Active</h3>
                      <p className="text-blue-700 text-sm mt-1">
                        You're on the Free plan with limited features. Upgrade to Unlimited for full access.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-medium">$0.00 / month</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Client Limit:</span>
                      <span className="font-medium">5 clients</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {userPlan === 'paid' ? (
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-red-500">
                      Cancel Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Subscription</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel your Unlimited subscription?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                        <h4 className="font-medium text-amber-800 text-sm mb-1">What happens when you cancel:</h4>
                        <ul className="text-amber-700 text-sm space-y-1">
                          <li className="flex items-start gap-2">
                            <XIcon className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                            <span>You'll lose access to unlimited clients</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <XIcon className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                            <span>You'll lose access to premium features</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckIcon className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span>You can keep using the free plan with up to 5 clients</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Keep Subscription
                      </Button>
                      <Button variant="destructive" onClick={handleCancelSubscription}>
                        Yes, Cancel Subscription
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  onClick={() => navigate("/payment")}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Unlimited
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>

        {/* Plan Comparison */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Plan Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1"></div>
                <div className="text-center font-medium">Free</div>
                <div className="text-center font-medium">Unlimited</div>
                
                <Separator className="col-span-3 my-2" />
                
                {/* Price */}
                <div className="text-gray-600">Price</div>
                <div className="text-center">$0</div>
                <div className="text-center">$15/month</div>
                
                {/* Clients */}
                <div className="text-gray-600">Client Limit</div>
                <div className="text-center">5</div>
                <div className="text-center">Unlimited</div>
                
                {/* Job Status Tracking */}
                <div className="text-gray-600">Job Status Tracking</div>
                <div className="text-center">Basic</div>
                <div className="text-center">Advanced</div>
                
                {/* Photo Uploads */}
                <div className="text-gray-600">Photo Uploads</div>
                <div className="text-center">
                  <XIcon className="h-4 w-4 mx-auto text-gray-400" />
                </div>
                <div className="text-center">
                  <CheckIcon className="h-4 w-4 mx-auto text-green-500" />
                </div>
                
                {/* Follow-up Reminders */}
                <div className="text-gray-600">Follow-up Reminders</div>
                <div className="text-center">
                  <XIcon className="h-4 w-4 mx-auto text-gray-400" />
                </div>
                <div className="text-center">
                  <CheckIcon className="h-4 w-4 mx-auto text-green-500" />
                </div>
                
                {/* Calendar Integration */}
                <div className="text-gray-600">Calendar Integration</div>
                <div className="text-center">
                  <XIcon className="h-4 w-4 mx-auto text-gray-400" />
                </div>
                <div className="text-center">
                  <CheckIcon className="h-4 w-4 mx-auto text-green-500" />
                </div>
                
                {/* Notifications */}
                <div className="text-gray-600">Notifications</div>
                <div className="text-center">
                  <XIcon className="h-4 w-4 mx-auto text-gray-400" />
                </div>
                <div className="text-center">
                  <CheckIcon className="h-4 w-4 mx-auto text-green-500" />
                </div>
                
                {/* Location Integration */}
                <div className="text-gray-600">Location Integration</div>
                <div className="text-center">
                  <XIcon className="h-4 w-4 mx-auto text-gray-400" />
                </div>
                <div className="text-center">
                  <CheckIcon className="h-4 w-4 mx-auto text-green-500" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-center pt-4 pb-2">
              {userPlan === 'free' ? (
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  onClick={() => navigate("/payment")}
                >
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              ) : (
                <span className="text-green-600 flex items-center">
                  <CheckIcon className="h-4 w-4 mr-1" />
                  You have the Unlimited plan
                </span>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}