import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderCard } from "@/components/orders/OrderCard";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertCircle, List, LayoutGrid } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Order {
  id: string;
  client_name: string;
  phone: string | null;
  location: string | null;
  material_id: number | null;
  material_qty: number | null;
  service_id: number | null;
  machine_id: number | null;
  base_price: number | null;
  additional_charges: number | null;
  final_price: number | null;
  order_status: "lead" | "contacted" | "confirmed" | "progressing" | "completed" | "cancelled";
  created_at: string | null;
  updated_at: string | null;
  material_name?: string;
  service_name?: string;
  machine_name?: string;
  assignedStaff?: { id: number; name: string }[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  order_id: string;
  payment_mode: "cash" | "card" | "upi" | "credit";
  amount: number;
  payment_date: string | null;
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
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchTerm, setSearchTerm] = useState<string>("");
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
      
      const ordersWithDetails = await Promise.all(data.map(async (order) => {
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
        
        let machineName = "";
        if (order.machine_id) {
          const { data: machineData } = await supabase
            .from('machines')
            .select('name')
            .eq('id', order.machine_id)
            .single();
          if (machineData) {
            machineName = machineData.name;
          }
        }
        
        const { data: staffData } = await supabase
          .from('order_staff')
          .select('staff_id, staff(id, name)')
          .eq('order_id', order.id);
        
        const assignedStaff = staffData?.map(s => ({
          id: s.staff.id,
          name: s.staff.name
        })) || [];
        
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', order.id)
          .order('payment_date', { ascending: false });
        
        const validOrderStatus = (status: string): Order['order_status'] => {
          const validStatuses: Order['order_status'][] = [
            "lead", "contacted", "confirmed", "progressing", "completed", "cancelled"
          ];
          return validStatuses.includes(status as Order['order_status']) 
            ? (status as Order['order_status']) 
            : "lead";
        };
        
        const validPaymentMode = (mode: string): Payment['payment_mode'] => {
          const validModes: Payment['payment_mode'][] = ["cash", "card", "upi", "credit"];
          return validModes.includes(mode as Payment['payment_mode'])
            ? (mode as Payment['payment_mode'])
            : "cash";
        };
        
        return {
          ...order,
          id: order.id.toString(),
          order_status: validOrderStatus(order.order_status),
          material_name: materialName,
          service_name: serviceName,
          machine_name: machineName,
          assignedStaff,
          payments: paymentsData ? paymentsData.map(p => ({
            ...p, 
            id: p.id.toString(), 
            order_id: p.order_id.toString(),
            payment_mode: validPaymentMode(p.payment_mode)
          })) : []
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

  const handleEditClick = (order: Order) => {
    setSelectedOrderForEdit(order);
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', parseInt(draggableId));
      
      if (error) throw error;
      
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
    return orders.filter(order => {
      const statusMatch = order.order_status === status;
      
      if (searchTerm.trim()) {
        const nameMatch = order.client_name.toLowerCase().includes(searchTerm.toLowerCase());
        const phoneMatch = order.phone && order.phone.includes(searchTerm);
        return statusMatch && (nameMatch || phoneMatch);
      }
      
      return statusMatch;
    });
  };

  const getTotalPaymentsForOrder = (order: Order) => {
    return order.payments?.reduce((total, payment) => total + payment.amount, 0) || 0;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders & CRM</h1>
          <p className="text-gray-600">Track customer orders through the pipeline.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="max-w-xs">
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex items-center space-x-1 border rounded-md">
            <Button 
              variant={viewMode === "kanban" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4 mr-1" /> List
            </Button>
          </div>
          <Button onClick={() => setIsNewOrderDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p>Loading orders...</p>
        </div>
      ) : (
        <>
          {viewMode === "kanban" ? (
            <div className="overflow-x-auto pb-4">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-6 gap-4 min-w-[1200px]">
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
                                      data-order-id={order.id}
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
            </div>
          ) : (
            <div className="bg-white rounded-md shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.filter(order => {
                      if (searchTerm.trim()) {
                        const nameMatch = order.client_name.toLowerCase().includes(searchTerm.toLowerCase());
                        const phoneMatch = order.phone && order.phone.includes(searchTerm);
                        return nameMatch || phoneMatch;
                      }
                      return true;
                    }).map((order) => {
                      const totalPaid = getTotalPaymentsForOrder(order);
                      const outstanding = (order.final_price || 0) - totalPaid;
                      const status = statusList.find(s => s.id === order.order_status);
                      
                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="font-medium">{order.client_name}</div>
                            <div className="text-sm text-muted-foreground">{order.location}</div>
                          </TableCell>
                          <TableCell>{order.phone}</TableCell>
                          <TableCell>
                            {order.material_name ? (
                              <div>
                                {order.material_name}
                                <div className="text-xs text-muted-foreground">
                                  Qty: {order.material_qty}
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{order.service_name || "-"}</TableCell>
                          <TableCell>
                            {(() => {
                              if (order.machine_id) {
                                const machine = machines.find(m => m.id === order.machine_id);
                                return machine ? machine.name : "-";
                              }
                              return "-";
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                order.order_status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-200" : 
                                order.order_status === "cancelled" ? "bg-red-100 text-red-800 hover:bg-red-200" : 
                                order.order_status === "progressing" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                                order.order_status === "confirmed" ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-200" :
                                order.order_status === "contacted" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                                "bg-purple-100 text-purple-800 hover:bg-purple-200"
                              }
                            >
                              {status?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>₹{order.final_price?.toLocaleString() || 0}</TableCell>
                          <TableCell>₹{totalPaid.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={outstanding > 0 ? "text-red-600" : "text-green-600"}>
                              ₹{outstanding.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedOrderForEdit({...order});
                                setIsEditOrderDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {selectedOrderForEdit && (
        <Dialog open={isEditOrderDialogOpen} onOpenChange={setIsEditOrderDialogOpen}>
          <DialogContent className="max-h-[90vh]">
            <ScrollArea className="max-h-[80vh] pr-4">
              <DialogHeader>
                <DialogTitle>Edit Order</DialogTitle>
                <DialogDescription>Update order details and status</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_client_name">Client Name</Label>
                  <Input
                    id="edit_client_name"
                    value={selectedOrderForEdit.client_name}
                    onChange={(e) => setSelectedOrderForEdit({...selectedOrderForEdit, client_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">Phone Number</Label>
                  <Input
                    id="edit_phone"
                    value={selectedOrderForEdit.phone || ''}
                    onChange={(e) => setSelectedOrderForEdit({...selectedOrderForEdit, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_location">Location</Label>
                  <Input
                    id="edit_location"
                    value={selectedOrderForEdit.location || ''}
                    onChange={(e) => setSelectedOrderForEdit({...selectedOrderForEdit, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_order_status">Status</Label>
                  <Select 
                    value={selectedOrderForEdit.order_status} 
                    onValueChange={(val: Order['order_status']) => setSelectedOrderForEdit({...selectedOrderForEdit, order_status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusList.map((status) => (
                        <SelectItem key={status.id} value={status.id as Order['order_status']}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_material_id">Material</Label>
                  <Select 
                    value={selectedOrderForEdit.material_id?.toString() || ''} 
                    onValueChange={(value) => {
                      setSelectedOrderForEdit({
                        ...selectedOrderForEdit, 
                        material_id: value ? parseInt(value) : null
                      });
                    }}
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
                <div className="space-y-2">
                  <Label htmlFor="edit_material_qty">Quantity</Label>
                  <Input
                    id="edit_material_qty"
                    type="number"
                    value={selectedOrderForEdit.material_qty || ''}
                    onChange={(e) => setSelectedOrderForEdit({
                      ...selectedOrderForEdit,
                      material_qty: e.target.value ? parseFloat(e.target.value) : null
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_service_id">Service</Label>
                  <Select 
                    value={selectedOrderForEdit.service_id?.toString() || ''} 
                    onValueChange={(value) => {
                      const serviceId = value ? parseInt(value) : null;
                      const selectedService = services.find(s => s.id === serviceId);
                      
                      setSelectedOrderForEdit({
                        ...selectedOrderForEdit, 
                        service_id: serviceId,
                        base_price: selectedService ? selectedService.price : selectedOrderForEdit.base_price
                      });
                    }}
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
                <div className="space-y-2">
                  <Label htmlFor="edit_machine_id">Machine</Label>
                  <Select 
                    value={selectedOrderForEdit.machine_id?.toString() || ''} 
                    onValueChange={(value) => {
                      setSelectedOrderForEdit({
                        ...selectedOrderForEdit, 
                        machine_id: value ? parseInt(value) : null
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id.toString()}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_base_price">Base Price (₹)</Label>
                    <Input
                      id="edit_base_price"
                      type="number"
                      value={selectedOrderForEdit.base_price || ''}
                      onChange={(e) => setSelectedOrderForEdit({
                        ...selectedOrderForEdit,
                        base_price: e.target.value ? parseFloat(e.target.value) : null
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_additional_charges">Additional Charges (₹)</Label>
                    <Input
                      id="edit_additional_charges"
                      type="number"
                      value={selectedOrderForEdit.additional_charges || ''}
                      onChange={(e) => setSelectedOrderForEdit({
                        ...selectedOrderForEdit,
                        additional_charges: e.target.value ? parseFloat(e.target.value) : null
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Price (₹)</Label>
                  <div className="text-xl font-bold">
                    ₹ {((selectedOrderForEdit.base_price || 0) + (selectedOrderForEdit.additional_charges || 0)).toLocaleString()}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOrderDialogOpen(false)}>Cancel</Button>
                <Button onClick={async () => {
                  try {
                    const finalPrice = (selectedOrderForEdit.base_price || 0) + (selectedOrderForEdit.additional_charges || 0);
                    
                    const { error } = await supabase
                      .from('orders')
                      .update({ 
                        client_name: selectedOrderForEdit.client_name,
                        phone: selectedOrderForEdit.phone,
                        location: selectedOrderForEdit.location,
                        material_id: selectedOrderForEdit.material_id,
                        material_qty: selectedOrderForEdit.material_qty,
                        service_id: selectedOrderForEdit.service_id,
                        machine_id: selectedOrderForEdit.machine_id,
                        base_price: selectedOrderForEdit.base_price,
                        additional_charges: selectedOrderForEdit.additional_charges,
                        final_price: finalPrice,
                        order_status: selectedOrderForEdit.order_status
                      })
                      .eq('id', parseInt(selectedOrderForEdit.id));
                    
                    if (error) throw error;
                    
                    toast({
                      title: "Success",
                      description: "Order updated successfully",
                    });
                    
                    setIsEditOrderDialogOpen(false);
                    fetchOrders();
                  } catch (error) {
                    console.error('Error updating order:', error);
                    toast({
                      title: "Error",
                      description: "Failed to update order",
                      variant: "destructive",
                    });
                  }
                }}>
                  Save Changes
                </Button>
              </DialogFooter>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
      
      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="max-h-[90vh]">
          <ScrollArea className="max-h-[80vh] pr-4">
            <DialogHeader>
              <DialogTitle>Add New Order</DialogTitle>
              <DialogDescription>Create a new customer order or lead</DialogDescription>
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
                  value={newOrder.phone || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={newOrder.location || ''}
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
              <div className="space-y-2">
                <Label htmlFor="machine_id">Machine</Label>
                <Select 
                  value={newOrder.machine_id?.toString() || ''} 
                  onValueChange={(value) => handleSelectChange('machine_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id.toString()}>
                        {machine.name}
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
