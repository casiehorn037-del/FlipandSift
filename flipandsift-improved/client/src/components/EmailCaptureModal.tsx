import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Gift, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface EmailCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  analysisCount?: number;
}

export function EmailCaptureModal({ open, onClose, onSubmit, analysisCount = 0 }: EmailCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    onSubmit(email);
    
    toast.success("Welcome! Check your email for bonus credits.");
    
    // Auto close after success
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setEmail("");
    }, 2000);
  };

  const remainingFree = Math.max(0, 3 - analysisCount);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Gift className="w-6 h-6 text-indigo-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {isSubmitted ? "You're In! 🎉" : "Get 3 Bonus Credits"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSubmitted ? (
              "Check your email for your bonus credits and exclusive domain flipping tips."
            ) : (
              <>
                You have <strong>{remainingFree} free analyses</strong> remaining.
                <br />
                Enter your email to get <strong>3 bonus credits</strong> + weekly domain opportunities.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    Claim Bonus Credits <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                className="text-sm text-gray-500"
              >
                Maybe later
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              No spam. Unsubscribe anytime. We respect your privacy.
            </p>
          </form>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Your bonus credits have been added to your account!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
