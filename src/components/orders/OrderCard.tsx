
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Package, Phone, DollarSign, FileEdit } from "lucide-react";
import { useState } from "react";
import { Order } from "@/pages/OrdersPage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function OrderCard({ order }: { order: Order }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "lead":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "contacted":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "confirmed":
        return "bg-cyan-100 text-cyan-800 border-cyan-300";
      case "progressing":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPaymentStatus = () => {
    const totalPaid = order.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = order.totalPrice - totalPaid;
    
    if (remaining <= 0) return { label: "Fully Paid", color: "bg-green-100 text-green-800" };
    if (totalPaid > 0) return { label: "Partially Paid", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Not Paid", color: "bg-red-100 text-red-800" };
  };

  const paymentStatus = getPaymentStatus();

  return (
    <Card className="mb-3 border-l-4 shadow-sm hover:shadow-md transition-shadow animate-fade-in" style={{ borderLeftColor: order.status === 'lead' ? '#9333ea' : order.status === 'contacted' ? '#3b82f6' : order.status === 'confirmed' ? '#06b6d4' : order.status === 'progressing' ? '#facc15' : order.status === 'completed' ? '#22c55e' : '#ef4444' }}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-gray-800">{order.clientName}</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <FileEdit className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>{order.phoneNumber}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{order.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span>
              {order.material} ({order.thickness}mm) - {order.quantity} units
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span>₹ {order.totalPrice.toLocaleString()}</span>
            <Badge variant="outline" className={paymentStatus.color}>
              {paymentStatus.label}
            </Badge>
          </div>
        </div>
        
        {order.assignedStaff.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Assigned to:</p>
            <div className="flex flex-wrap gap-1">
              {order.assignedStaff.map((staff, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {staff}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {order.payments.length > 0 && (
          <div className="mt-3">
            <Accordion type="single" collapsible>
              <AccordionItem value="payments">
                <AccordionTrigger className="text-xs py-1">
                  Payment Details
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 text-xs">
                    {order.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center">
                        <span className="capitalize">
                          {payment.method} ({new Date(payment.date).toLocaleDateString()})
                        </span>
                        <span>₹ {payment.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order: {order.clientName}</DialogTitle>
          </DialogHeader>
          {/* Here you would implement form for editing the order details */}
          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
