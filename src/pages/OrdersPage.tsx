
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderCard } from "@/components/orders/OrderCard";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface Order {
  id: string;
  client_name: string;
  phone: string;
  location: string;
  material_id: number | null;
  material_qty: number | null;
  service_id: number | null;
  machine_id: number | null;
  base_price: number | null;
  additional_charges: number | null;
  final_price: number | null;
  order_status: "lead" | "contacted" | "confirmed" | "progressing" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  // Frontend-only properties
  material_name?: string;
  service_name?: string;
  assignedStaff?: { id: number; name: string }[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  order_id: string;
  payment_mode: "cash" | "card" | "upi" | "credit";
  amount: number;
  payment_date: string;
}

export interface Staff {
  id: number;
  name: string;
}

export interface Material {
  id: number;
  name: string;
}

export interface Service {
  id: number;
  name: string;
  price: number;
}

export interface Machine {
  id: number;
  name: string;
}

const statusList = [
  { id: "lead", name: "Lead", color: "bg-purple-100 border-purple-300" },
  { id: "contacted", name: "Contacted", color: "bg-blue-100 border-blue-300" },
  { id: "confirmed", name: "Order Confirmed", color: "bg-cyan-100 border-cyan-300" },
  { id: "progressing", name: "In Production", color: "bg-yellow-100 border-yellow-300" },
  { id: "completed", name: "Completed", color: "bg-green-100 border-green-300" },
  { id: "cancelled", name: "Cancelled", color: "bg-red-100 border-red-300" },
];

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [newOrder, setNewOrder] = useState<Omit<Order, 'id' | 'created_at' | 'updated_at'>>({
    client_name: "",
    phone: "",
    location: "",
    material_id: null,
    material_qty: null,
    service_id: null,
    machine_id: null,
    base_price: null,
    additional_charges: null,
    final_price: null,
    order_status: "lead"
  });

  useEffect(() => {
    fetchOrders();
    fetchMaterials();
    fetchServices();
    fetchMachines();
    fetchStaff();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Fetch additional information for orders
      const ordersWithDetails = await Promise.all(data.map(async (order) => {
        // Get material details if available
        let materialName = "";
        if (order.material_id) {
          const { data: materialData } = await supabase
            .from('materials')
            .select('name')
            .eq('id', order.material_id)
            .single();
          if (materialData) {
            materialName = materialData.name;
          }
        }
        
        // Get service details if available
        let serviceName = "";
        if (order.service_id) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('name')
            .eq('id', order.service_id)
            .single();
          if (serviceData) {
            serviceName = serviceData.name;
          }
        }
        
        // Get assigned staff for this order
        const { data: staffData } = await supabase
          .from('order_staff')
          .select('staff_id, staff(id, name)')
          .eq('order_id', order.id);
        
        const assignedStaff = staffData?.map(s => ({
          id: s.staff.id,
          name: s.staff.name
        })) || [];
        
        // Get payments for this order
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', order.id)
          .order('payment_date', { ascending: false });
        
        return {
          ...order,
          material_name: materialName,
          service_name: serviceName,
          assignedStaff,
          payments: paymentsData || []
        };
      }));
      
      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchMaterials() {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  }

  async function fetchServices() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }

  async function fetchMachines() {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('id, name')
        .eq('status', 'available')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setMachines(data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  }

  async function fetchStaff() {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name')
        .eq('is_available', true)
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewOrder(prev => ({
      ...prev,
      [name]: ["material_qty", "base_price", "additional_charges", "final_price"].includes(name) 
        ? parseFloat(value) || null 
        : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'material_id' || name === 'service_id' || name === 'machine_id') {
      setNewOrder(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : null
      }));

      // If service is selected, update the base price
      if (name === 'service_id' && value) {
        const serviceId = parseInt(value);
        const selectedService = services.find(s => s.id === serviceId);
        if (selectedService) {
          setNewOrder(prev => ({
            ...prev,
            base_price: selectedService.price
          }));
        }
      }
    } else {
      setNewOrder(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddOrder = async () => {
    try {
      const finalPrice = calculateFinalPrice();
      
      const { data, error } = await supabase
        .from('orders')
        .insert([
          { 
            client_name: newOrder.client_name,
            phone: newOrder.phone,
            location: newOrder.location,
            material_id: newOrder.material_id,
            material_qty: newOrder.material_qty,
            service_id: newOrder.service_id,
            machine_id: newOrder.machine_id,
            base_price: newOrder.base_price,
            additional_charges: newOrder.additional_charges || 0,
            final_price: finalPrice,
            order_status: newOrder.order_status
          }
        ])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Order added successfully",
      });
      
      resetForm();
      setIsNewOrderDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error adding order:', error);
      toast({
        title: "Error",
        description: "Failed to add order",
        variant: "destructive",
      });
    }
  };

  const calculateFinalPrice = () => {
    const basePrice = newOrder.base_price || 0;
    const additionalCharges = newOrder.additional_charges || 0;
    return basePrice + additionalCharges;
  };

  const resetForm = () => {
    setNewOrder({
      client_name: "",
      phone: "",
      location: "",
      material_id: null,
      material_qty: null,
      service_id: null,
      machine_id: null,
      base_price: null,
      additional_charges: null,
      final_price: null,
      order_status: "lead"
    });
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    try {
      // Update the status in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', draggableId);
      
      if (error) throw error;
      
      // Update local state
      const updatedOrders = orders.map(order => {
        if (order.id === draggableId) {
          return { ...order, order_status: newStatus as Order['order_status'] };
        }
        return order;
      });
      
      setOrders(updatedOrders);
      
      toast({
        title: "Status Updated",
        description: `Order moved to ${statusList.find(s => s.id === newStatus)?.name}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.order_status === status);
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

      {loading ? (
        <div className="text-center py-4 flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p>Loading orders...</p>
        </div>
      ) : (
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
                      {getOrdersByStatus(status.id).length === 0 ? (
                        <div className="text-center py-4 flex flex-col items-center justify-center h-full opacity-50">
                          <AlertCircle className="h-6 w-6 mb-2" />
                          <p className="text-xs">No orders</p>
                        </div>
                      ) : (
                        getOrdersByStatus(status.id).map((order, index) => (
                          <Draggable key={order.id} draggableId={order.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <OrderCard order={order} fetchOrders={fetchOrders} />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="max-h-[90vh]">
          <ScrollArea className="max-h-[80vh] pr-4">
            <DialogHeader>
              <DialogTitle>Add New Order</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  value={newOrder.client_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newOrder.phone}
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
                <Label htmlFor="material_id">Material</Label>
                <Select 
                  value={newOrder.material_id?.toString() || ''} 
                  onValueChange={(value) => handleSelectChange('material_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id.toString()}>
                        {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material_qty">Quantity</Label>
                  <Input
                    id="material_qty"
                    name="material_qty"
                    type="number"
                    value={newOrder.material_qty || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_id">Service</Label>
                <Select 
                  value={newOrder.service_id?.toString() || ''} 
                  onValueChange={(value) => handleSelectChange('service_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} - ₹{service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price (₹)</Label>
                  <Input
                    id="base_price"
                    name="base_price"
                    type="number"
                    value={newOrder.base_price || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional_charges">Additional Charges (₹)</Label>
                  <Input
                    id="additional_charges"
                    name="additional_charges"
                    type="number"
                    value={newOrder.additional_charges || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total Price (₹)</Label>
                <div className="text-xl font-bold">₹ {calculateFinalPrice().toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_status">Initial Status</Label>
                <Select 
                  value={newOrder.order_status} 
                  onValueChange={(val) => handleSelectChange('order_status', val)}
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
              <Button variant="outline" onClick={() => setIsNewOrderDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddOrder}>Save Order</Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
