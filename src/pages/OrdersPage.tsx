
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderCard } from "@/components/orders/OrderCard";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export interface Order {
  id: string;
  clientName: string;
  phoneNumber: string;
  location: string;
  material: string;
  thickness: number;
  quantity: number;
  service: string;
  totalPrice: number;
  assignedStaff: string[];
  payments: Payment[];
  status: "lead" | "contacted" | "confirmed" | "progressing" | "completed" | "cancelled";
}

export interface Payment {
  id: string;
  method: "cash" | "card" | "upi" | "credit";
  amount: number;
  date: string;
}

const statusList = [
  { id: "lead", name: "Lead", color: "bg-purple-100 border-purple-300" },
  { id: "contacted", name: "Contacted", color: "bg-blue-100 border-blue-300" },
  { id: "confirmed", name: "Order Confirmed", color: "bg-cyan-100 border-cyan-300" },
  { id: "progressing", name: "In Production", color: "bg-yellow-100 border-yellow-300" },
  { id: "completed", name: "Completed", color: "bg-green-100 border-green-300" },
  { id: "cancelled", name: "Cancelled", color: "bg-red-100 border-red-300" },
];

const initialOrders: Order[] = [
  {
    id: "order-1",
    clientName: "Raj Industries",
    phoneNumber: "+91 9876543210",
    location: "Mumbai",
    material: "Steel Sheet",
    thickness: 2.0,
    quantity: 10,
    service: "CNC Cutting",
    totalPrice: 25000,
    assignedStaff: ["Rahul Sharma"],
    payments: [
      { id: "payment-1", method: "cash", amount: 15000, date: "2025-04-10" }
    ],
    status: "progressing"
  },
  {
    id: "order-2",
    clientName: "Sharma Enterprises",
    phoneNumber: "+91 8765432109",
    location: "Delhi",
    material: "Aluminum Plate",
    thickness: 1.5,
    quantity: 5,
    service: "Laser Engraving",
    totalPrice: 18000,
    assignedStaff: [],
    payments: [],
    status: "lead"
  },
  {
    id: "order-3",
    clientName: "Mehta Construction",
    phoneNumber: "+91 7654321098",
    location: "Bangalore",
    material: "Copper Sheet",
    thickness: 1.0,
    quantity: 8,
    service: "CNC Cutting",
    totalPrice: 32000,
    assignedStaff: ["Ankit Patel"],
    payments: [
      { id: "payment-2", method: "upi", amount: 32000, date: "2025-04-08" }
    ],
    status: "completed"
  }
];

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<Omit<Order, 'id' | 'payments' | 'assignedStaff'>>({
    clientName: "",
    phoneNumber: "",
    location: "",
    material: "",
    thickness: 0,
    quantity: 0,
    service: "",
    totalPrice: 0,
    status: "lead"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewOrder(prev => ({
      ...prev,
      [name]: ["thickness", "quantity", "totalPrice"].includes(name) 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleAddOrder = () => {
    const newId = `order-${Date.now()}`;
    setOrders([
      ...orders, 
      { 
        id: newId, 
        ...newOrder, 
        assignedStaff: [], 
        payments: [] 
      }
    ]);
    setNewOrder({
      clientName: "",
      phoneNumber: "",
      location: "",
      material: "",
      thickness: 0,
      quantity: 0,
      service: "",
      totalPrice: 0,
      status: "lead"
    });
    setIsNewOrderDialogOpen(false);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newOrders = [...orders];
    const [movedOrder] = newOrders.filter(order => order.id === result.draggableId);
    
    if (movedOrder) {
      movedOrder.status = result.destination.droppableId;
      setOrders(newOrders);
    }
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders & CRM</h1>
          <p className="text-gray-600">Track customer orders through the pipeline.</p>
        </div>
        <Button onClick={() => setIsNewOrderDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-6 gap-4">
          {statusList.map((status) => (
            <div key={status.id} className="flex flex-col">
              <div className={`flex items-center justify-between rounded-t-md p-3 ${status.color}`}>
                <h3 className="font-medium text-sm">{status.name}</h3>
                <Badge variant="outline" className="bg-white">
                  {getOrdersByStatus(status.id).length}
                </Badge>
              </div>
              <Droppable droppableId={status.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 min-h-[500px] bg-gray-50 rounded-b-md p-2 border border-t-0"
                  >
                    {getOrdersByStatus(status.id).map((order, index) => (
                      <Draggable key={order.id} draggableId={order.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <OrderCard order={order} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                name="clientName"
                value={newOrder.clientName}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={newOrder.phoneNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={newOrder.location}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                name="material"
                value={newOrder.material}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thickness">Thickness (mm)</Label>
                <Input
                  id="thickness"
                  name="thickness"
                  type="number"
                  value={newOrder.thickness || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={newOrder.quantity || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Input
                id="service"
                name="service"
                value={newOrder.service}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Total Price (₹)</Label>
              <Input
                id="totalPrice"
                name="totalPrice"
                type="number"
                value={newOrder.totalPrice || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select 
                value={newOrder.status} 
                onValueChange={(val) => setNewOrder({...newOrder, status: val as any})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusList.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddOrder}>Save Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
