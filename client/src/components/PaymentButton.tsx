import { useEffect, useState } from 'react';
import PayPalButton from './PayPalButton';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface PaymentButtonProps {
  amount: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
}

export default function PaymentButton({ amount, onSuccess, onError }: PaymentButtonProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on component mount
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    setUserId(currentUserId);
    
    // Check if we have a valid user ID before allowing payment
    if (!currentUserId) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in before making a payment.',
        variant: 'destructive'
      });
      navigate('/login');
    }
  }, []);

  // Override the fetch method to include user ID and provide better logging
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Only modify payment-related requests
    if (typeof input === 'string' && 
        (input.includes('/order') || input.includes('/setup'))) {
      
      console.log(`Processing PayPal request to: ${input}`);
      
      // Add the user ID header to the request
      const headers = new Headers(init?.headers || {});
      if (userId) {
        headers.set('x-user-id', userId);
        console.log(`Including user ID in request: ${userId}`);
      } else {
        console.log('Warning: No user ID available for payment request');
      }
      
      // Create new init object with updated headers
      const newInit = {
        ...init,
        headers
      };
      
      // Log the request for debugging
      if (init?.body) {
        try {
          const bodyData = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
          console.log('Payment request data:', bodyData);
        } catch (e) {
          console.log('Could not parse request body for logging');
        }
      }
      
      try {
        const response = await originalFetch(input, newInit);
        
        // Clone the response so we can log it without consuming it
        const clonedResponse = response.clone();
        try {
          const responseData = await clonedResponse.json();
          console.log('Payment API response:', responseData);
        } catch (e) {
          console.log('Could not parse response for logging');
        }
        
        return response;
      } catch (error) {
        console.error('Payment API error:', error);
        throw error;
      }
    }
    
    // For all other requests, use the original fetch
    return originalFetch(input, init);
  };
  
  // Clean up our fetch override when component unmounts
  useEffect(() => {
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  const handleSuccess = (details: any) => {
    console.log('Payment successful!', details);
    
    // Update local storage to indicate this user has a paid account
    localStorage.setItem('userPlan', 'paid');
    
    // Call the onSuccess callback if provided
    if (onSuccess) {
      onSuccess(details);
    } else {
      // Default success behavior
      toast({
        title: 'Payment Successful!',
        description: 'Your account has been upgraded to the Unlimited plan.',
      });
      navigate('/dashboard');
    }
  };
  
  const handleError = (error: any) => {
    console.error('Payment failed:', error);
    
    // Call the onError callback if provided
    if (onError) {
      onError(error);
    } else {
      // Default error behavior
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="payment-button-wrapper">
      <PayPalButton
        amount={amount}
        currency="USD"
        intent="CAPTURE"
      />
      <div className="mt-4 text-sm text-gray-500 text-center">
        You will be charged ${amount} today and on the same day each month.
      </div>
    </div>
  );
}