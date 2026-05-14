import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, ArrowRight, Clock, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ExitIntentModalProps {
  userCount?: number;
}

export function ExitIntentModal({ userCount = 0 }: ExitIntentModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (hasTriggered) return;
    
    // Check if mouse is leaving through the top of the page
    if (e.clientY <= 0) {
      setHasTriggered(true);
      setOpen(true);
    }
  }, [hasTriggered]);

  useEffect(() => {
    // Only trigger on desktop
    if (window.innerWidth > 768) {
      document.addEventListener("mouseleave", handleMouseLeave);
      return () => document.removeEventListener("mouseleave", handleMouseLeave);
    }
  }, [handleMouseLeave]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSubmitted(true);

    toast.success("Your discount code has been sent!");

    setTimeout(() => {
      setOpen(false);
      setIsSubmitted(false);
      setEmail("");
    }, 2500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-indigo-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {isSubmitted ? "Check Your Email! 📧" : "Wait! Don't Miss Out"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSubmitted ? (
              "Your exclusive 20% discount code is on its way!"
            ) : (
              <>
                Join <strong>{userCount.toLocaleString()}+ domain flippers</strong> who are already finding hidden gems.
                <br /><br />
                Get <strong>20% off your first month</strong> + exclusive weekly domain opportunities.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="bg-indigo-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>20% off Pro subscription</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Weekly hidden gem alerts</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Private community access</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit-email">Email Address</Label>
              <Input
                id="exit-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1 h-12 text-lg bg-indigo-600 hover:bg-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    Get 20% Off <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setOpen(false)}
                className="h-12 px-4"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Limited time offer - expires in 24 hours</span>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              You're on the list!
            </p>
            <p className="text-gray-600">
              Check your inbox for your 20% discount code.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
