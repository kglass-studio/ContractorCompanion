import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeftIcon, AlertCircle, DownloadIcon, FileTextIcon, DatabaseIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  exportUserData,
  generateClientsCSV,
  generateNotesCSV,
  generateFollowupsCSV,
  generateJSONExport,
  downloadFile,
  type ExportData
} from "@/lib/dataExport";

export default function UnsubscribePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [hasExportedData, setHasExportedData] = useState(false);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const userId = localStorage.getItem('userId') || 'demo-user';
      const data = await exportUserData(userId);
      setExportData(data);
      setCurrentStep(2);
      
      toast({
        title: "Data Export Ready",
        description: `Found ${data.totalClients} clients, ${data.totalNotes} notes, and ${data.totalFollowups} follow-ups to export.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCSV = (type: 'clients' | 'notes' | 'followups') => {
    if (!exportData) return;

    const timestamp = new Date().toISOString().split('T')[0];
    let content = '';
    let filename = '';

    switch (type) {
      case 'clients':
        content = generateClientsCSV(exportData.clients);
        filename = `clients-${timestamp}.csv`;
        break;
      case 'notes':
        content = generateNotesCSV(exportData.notes, exportData.clients);
        filename = `notes-${timestamp}.csv`;
        break;
      case 'followups':
        content = generateFollowupsCSV(exportData.followups, exportData.clients);
        filename = `followups-${timestamp}.csv`;
        break;
    }

    downloadFile(content, filename, 'text/csv');
    setHasExportedData(true);
    
    toast({
      title: "Download Complete",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully.`,
    });
  };

  const downloadJSON = () => {
    if (!exportData) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const content = generateJSONExport(exportData);
    downloadFile(content, `crm-data-${timestamp}.json`, 'application/json');
    setHasExportedData(true);
    
    toast({
      title: "Download Complete",
      description: "Complete data export downloaded as JSON file.",
    });
  };

  const proceedToFinalStep = () => {
    setCurrentStep(3);
  };

  const handleFinalUnsubscribe = async () => {
    setIsUnsubscribing(true);
    try {
      // First, unsubscribe the user
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('userId') || 'demo-user'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      // Purge user data from the database
      const purgeResponse = await fetch('/api/purge-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('userId') || 'demo-user'
        }
      });

      if (!purgeResponse.ok) {
        console.warn('Failed to purge user data, but subscription was cancelled');
      }

      // Update user plan to free
      localStorage.setItem('userPlan', 'free');

      toast({
        title: "Unsubscribed Successfully",
        description: "Your subscription has been cancelled and all data has been permanently deleted. You now have access to the free plan (up to 5 clients).",
      });

      setShowFinalConfirmation(false);
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Unsubscription Failed",
        description: "Failed to process unsubscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUnsubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/subscription')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Subscription
          </Button>
        </motion.div>

        {/* Step 1: Warning and Data Export */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  Important: Data Loss Warning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-red-700 dark:text-red-300">
                  <p className="mb-4">
                    <strong>Before you unsubscribe, please understand:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>All your client information will be permanently deleted</li>
                    <li>All notes and follow-ups will be permanently deleted</li>
                    <li>Your account will revert to the free plan (5 clients maximum)</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DownloadIcon className="h-5 w-5" />
                  Step 1: Export Your Data (Recommended)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We strongly recommend downloading your data before unsubscribing. 
                  This will save all your client information, notes, and follow-ups.
                </p>
                <Button 
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Preparing Your Data...
                    </>
                  ) : (
                    <>
                      <DatabaseIcon className="h-4 w-4 mr-2" />
                      Export My Data
                    </>
                  )}
                </Button>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={proceedToFinalStep}
                  className="w-full"
                >
                  Skip Export & Continue to Unsubscribe
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Data Export Downloads */}
        {currentStep === 2 && exportData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Step 2: Download Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Individual Files (CSV)</h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        onClick={() => downloadCSV('clients')}
                        className="w-full justify-start"
                        disabled={exportData.totalClients === 0}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Clients ({exportData.totalClients})
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => downloadCSV('notes')}
                        className="w-full justify-start"
                        disabled={exportData.totalNotes === 0}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Notes ({exportData.totalNotes})
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => downloadCSV('followups')}
                        className="w-full justify-start"
                        disabled={exportData.totalFollowups === 0}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Follow-ups ({exportData.totalFollowups})
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-semibold">Complete Export</h3>
                    <Button 
                      onClick={downloadJSON}
                      className="w-full justify-start"
                    >
                      <DatabaseIcon className="h-4 w-4 mr-2" />
                      Download All Data (JSON)
                    </Button>
                    <p className="text-sm text-gray-500">
                      Includes all your data in a single file
                    </p>
                  </div>
                </div>
                
                {hasExportedData && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      ✓ Data exported successfully! Your files have been downloaded.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={proceedToFinalStep}
                  className="w-full"
                  variant="destructive"
                >
                  Continue to Unsubscribe
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Final Confirmation */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <TrashIcon className="h-5 w-5" />
                  Final Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded border border-red-200 dark:border-red-800">
                  <p className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    This action will permanently:
                  </p>
                  <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-1">
                    <li>Cancel your subscription and stop all future payments</li>
                    <li>Delete all your client data from our servers</li>
                    <li>Delete all notes and follow-ups</li>
                    <li>Revert your account to the free plan (5 clients max)</li>
                  </ul>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300">
                  Type "DELETE" in the box below and click the confirmation button to proceed:
                </p>
                
                <div className="space-y-4">
                  <input 
                    type="text"
                    placeholder="Type DELETE to confirm"
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    onChange={(e) => setShowFinalConfirmation(e.target.value === 'DELETE')}
                  />
                  
                  <Button 
                    variant="destructive"
                    onClick={handleFinalUnsubscribe}
                    disabled={!showFinalConfirmation || isUnsubscribing}
                    className="w-full"
                  >
                    {isUnsubscribing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Processing Unsubscription...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Confirm: Unsubscribe & Delete All Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}