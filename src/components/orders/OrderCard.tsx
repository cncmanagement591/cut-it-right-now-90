import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, DollarSign, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Order, Payment, Staff, Material, Service, Machine } from "@/pages/OrdersPage";

interface OrderCardProps {
  order: Order;
  fetchOrders: () => void;
  listView?: boolean;
  triggerEdit?: boolean;
  onEditProcessed?: () => void;
}

export const OrderCard = ({ order, fetchOrders, listView, triggerEdit, onEditProcessed }: OrderCardProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  useEffect(() => {
    if (triggerEdit) {
      setIsEditDialogOpen(true);
      if (onEditProcessed) {
        onEditProcessed();
      }
    }
  }, [triggerEdit, onEditProcessed]);

  useEffect(() => {
    fetchMachines();
  }, []);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isAssignStaffDialogOpen, setIsAssignStaffDialogOpen] = useState(false);
  const [isAssignMachineDialogOpen, setIsAssignMachineDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Order>({ ...order });
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number[]>(order.assignedStaff?.map(s => s.id) || []);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(order.machine_id);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [payment, setPayment] = useState<Omit<Payment, 'id'>>({
    order_id: order.id,
    payment_mode: 'cash',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  const totalPaid = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingAmount = (order.final_price || 0) - totalPaid;

  const getMachineName = (machineId: number | null) => {
    if (!machineId) return "";
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : "";
  };

  const handleEditOrder = async () => {
    try {
      setLoading(true);
      
      const finalPrice = (editedOrder.base_price || 0) + (editedOrder.additional_charges || 0);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          client_name: editedOrder.client_name,
          phone: editedOrder.phone,
          location: editedOrder.location,
          material_id: editedOrder.material_id,
          material_qty: editedOrder.material_qty,
          service_id: editedOrder.service_id,
          machine_id: editedOrder.machine_id,
          base_price: editedOrder.base_price,
          additional_charges: editedOrder.additional_charges,
          final_price: finalPrice,
          order_status: editedOrder.order_status
        })
        .eq('id', parseInt(order.id));
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      
      setIsEditDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', parseInt(order.id));
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('payments')
        .insert([{
          order_id: parseInt(order.id),
          payment_mode: payment.payment_mode,
          amount: payment.amount,
          payment_date: payment.payment_date
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Payment added successfully",
      });
      
      setIsPaymentDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to add payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price')
        .order('name');
      
      if (error) throw error;
      
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setMachines(data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const handleAssignStaff = async () => {
    try {
      setLoading(true);
      
      await supabase
        .from('order_staff')
        .delete()
        .eq('order_id', parseInt(order.id));
      
      if (selectedStaff.length > 0) {
        const staffAssignments = selectedStaff.map(staffId => ({
          order_id: parseInt(order.id),
          staff_id: staffId
        }));
        
        const { error } = await supabase
          .from('order_staff')
          .insert(staffAssignments);
        
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: "Staff assignments updated successfully",
      });
      
      setIsAssignStaffDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error updating staff assignments:', error);
      toast({
        title: "Error",
        description: "Failed to update staff assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedOrder(prev => ({
      ...prev,
      [name]: ["material_qty", "base_price", "additional_charges", "final_price"].includes(name) 
        ? parseFloat(value) || null 
        : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'material_id' || name === 'service_id' || name === 'machine_id') {
      setEditedOrder(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : null
      }));

      if (name === 'service_id' && value) {
        const serviceId = parseInt(value);
        const selectedService = services.find(s => s.id === serviceId);
        if (selectedService) {
          setEditedOrder(prev => ({
            ...prev,
            base_price: selectedService.price
          }));
        }
      }
    } else {
      setEditedOrder(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPayment(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleStaffSelect = (staffId: number) => {
    setSelectedStaff(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  const handleAssignMachine = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          machine_id: selectedMachine
        })
        .eq('id', parseInt(order.id));
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Machine assigned successfully",
      });
      
      setIsAssignMachineDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error assigning machine:', error);
      toast({
        title: "Error",
        description: "Failed to assign machine",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-3 shadow-sm hover:shadow transition-shadow">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-sm">{order.client_name}</h3>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => {
                setIsEditDialogOpen(true);
                fetchMaterials();
                fetchServices();
                fetchMachines();
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mb-2">
          <div>Phone: {order.phone}</div>
          <div>Location: {order.location}</div>
        </div>
        
        {(order.material_name || order.service_name || order.machine_id) && (
          <div className="text-xs text-gray-700 mb-2">
            {order.material_name && (
              <div>
                Material: {order.material_name} (Qty: {order.material_qty})
              </div>
            )}
            {order.service_name && (
              <div>Service: {order.service_name}</div>
            )}
            {order.machine_name && (
              <div>
                Machine: {order.machine_name}
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center text-xs mb-2">
          <div>
            <span className="font-semibold">Total:</span> ₹{order.final_price?.toLocaleString() || 0}
          </div>
          <div className={remainingAmount > 0 ? "text-red-500" : "text-green-500"}>
            <span className="font-semibold">Paid:</span> ₹{totalPaid.toLocaleString()} 
            {remainingAmount > 0 ? ` (₹${remainingAmount.toLocaleString()} due)` : ""}
          </div>
        </div>
        
        {order.assignedStaff && order.assignedStaff.length > 0 && (
          <div className="text-xs mb-2">
            <span className="font-semibold">Assigned to:</span> {order.assignedStaff.map(s => s.name).join(', ')}
          </div>
        )}
        
        {order.machine_id && (
          <div className="text-xs mb-2">
            <span className="font-semibold">Machine:</span> {getMachineName(order.machine_id)}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs flex-1"
            onClick={() => {
              setPayment({
                order_id: order.id,
                payment_mode: 'cash',
                amount: remainingAmount > 0 ? remainingAmount : 0,
                payment_date: new Date().toISOString().split('T')[0]
              });
              setIsPaymentDialogOpen(true);
            }}
          >
            <DollarSign className="h-3 w-3 mr-1" /> Add Payment
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs flex-1"
            onClick={() => {
              fetchStaff();
              setIsAssignStaffDialogOpen(true);
            }}
          >
            <Users className="h-3 w-3 mr-1" /> Assign Staff
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs w-full mt-2"
            onClick={() => {
              fetchMachines();
              setIsAssignMachineDialogOpen(true);
            }}
          >
            <span className="h-3 w-3 mr-1">🔧</span> Assign Machine
          </Button>
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh]">
          <ScrollArea className="max-h-[80vh] pr-4">
            <DialogHeader>
              <DialogTitle>Edit Order</DialogTitle>
              <DialogDescription>Update order details and status</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  value={editedOrder.client_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={editedOrder.phone || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={editedOrder.location || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_status">Status</Label>
                <Select 
                  value={editedOrder.order_status} 
                  onValueChange={(val) => handleSelectChange('order_status', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="confirmed">Order Confirmed</SelectItem>
                    <SelectItem value="progressing">In Production</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material_id">Material</Label>
                <Select 
                  value={editedOrder.material_id?.toString() || ''} 
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
              <div className="space-y-2">
                <Label htmlFor="material_qty">Quantity</Label>
                <Input
                  id="material_qty"
                  name="material_qty"
                  type="number"
                  value={editedOrder.material_qty || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_id">Service</Label>
                <Select 
                  value={editedOrder.service_id?.toString() || ''} 
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
                    value={editedOrder.base_price || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional_charges">Additional Charges (₹)</Label>
                  <Input
                    id="additional_charges"
                    name="additional_charges"
                    type="number"
                    value={editedOrder.additional_charges || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total Price (₹)</Label>
                <div className="text-xl font-bold">
                  ₹ {((editedOrder.base_price || 0) + (editedOrder.additional_charges || 0)).toLocaleString()}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditOrder} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete this order for <strong>{order.client_name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={loading}>
              {loading ? "Deleting..." : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment_mode">Payment Method</Label>
              <Select 
                value={payment.payment_mode} 
                onValueChange={(value: "cash" | "card" | "upi" | "credit") => 
                  setPayment({...payment, payment_mode: value})
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={payment.amount || ''}
                onChange={handlePaymentInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                value={payment.payment_date}
                onChange={handlePaymentInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} disabled={loading || payment.amount <= 0}>
              {loading ? "Adding..." : "Add Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignStaffDialogOpen} onOpenChange={setIsAssignStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff to Order</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Select Staff Members</Label>
            {staffList.length === 0 ? (
              <p className="text-center py-4 text-sm text-gray-500">No staff members found</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {staffList.map(staff => (
                  <div key={staff.id} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`staff-${staff.id}`} 
                      checked={selectedStaff.includes(staff.id)}
                      onChange={() => handleStaffSelect(staff.id)}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`staff-${staff.id}`}>{staff.name}</label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignStaffDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignStaff} disabled={loading}>
              {loading ? "Saving..." : "Save Assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignMachineDialogOpen} onOpenChange={setIsAssignMachineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Machine to Order</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Select Machine</Label>
            {machines.length === 0 ? (
              <p className="text-center py-4 text-sm text-gray-500">No machines found</p>
            ) : (
              <div className="space-y-2">
                <Select 
                  value={selectedMachine?.toString() || ''} 
                  onValueChange={(value) => setSelectedMachine(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a machine" />
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignMachineDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignMachine} disabled={loading}>
              {loading ? "Saving..." : "Save Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
