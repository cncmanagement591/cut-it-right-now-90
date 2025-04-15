
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Expense {
  id: number;
  type: string;
  description: string;
  amount: number;
  expense_date: string;
  supplier_id?: number;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: number;
  name: string;
  contact_info: string;
  outstanding_payment: number;
  created_at: string;
  updated_at: string;
}

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState("expenses");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [isDeleteExpenseOpen, setIsDeleteExpenseOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [isDeleteSupplierOpen, setIsDeleteSupplierOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [currentExpense, setCurrentExpense] = useState<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>({
    type: "bill",
    description: "",
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
  });

  const [currentSupplier, setCurrentSupplier] = useState<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>({
    name: "",
    contact_info: "",
    outstanding_payment: 0
  });

  useEffect(() => {
    fetchExpenses();
    fetchSuppliers();
  }, []);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Error",
        description: "Failed to load suppliers data",
        variant: "destructive",
      });
    }
  }

  const handleExpenseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentExpense(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSupplierInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSupplier(prev => ({
      ...prev,
      [name]: name === 'outstanding_payment' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddExpense = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([currentExpense])
        .select();
      
      if (error) throw error;
      
      // If this is a supplier payment, update the supplier's outstanding payment
      if (currentExpense.type === 'supplier_payment' && currentExpense.supplier_id) {
        const supplier = suppliers.find(s => s.id === currentExpense.supplier_id);
        if (supplier) {
          const newOutstanding = Math.max(0, supplier.outstanding_payment - currentExpense.amount);
          await supabase
            .from('suppliers')
            .update({ outstanding_payment: newOutstanding })
            .eq('id', currentExpense.supplier_id);
            
          // Update the suppliers list in state
          setSuppliers(suppliers.map(s => 
            s.id === currentExpense.supplier_id 
              ? { ...s, outstanding_payment: newOutstanding } 
              : s
          ));
        }
      }
      
      setExpenses([data[0], ...expenses]);
      resetExpenseForm();
      setIsAddExpenseOpen(false);
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = async () => {
    try {
      const id = currentExpense.id;
      if (!id) return;
      
      const { error } = await supabase
        .from('expenses')
        .update({ 
          type: currentExpense.type,
          description: currentExpense.description,
          amount: currentExpense.amount,
          expense_date: currentExpense.expense_date,
          supplier_id: currentExpense.supplier_id
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setExpenses(expenses.map(e => e.id === id ? { ...e, ...currentExpense } : e));
      resetExpenseForm();
      setIsEditExpenseOpen(false);
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async () => {
    try {
      const id = currentExpense.id;
      if (!id) return;
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setExpenses(expenses.filter(e => e.id !== id));
      resetExpenseForm();
      setIsDeleteExpenseOpen(false);
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleAddSupplier = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([currentSupplier])
        .select();
      
      if (error) throw error;
      
      setSuppliers([...suppliers, data[0]]);
      resetSupplierForm();
      setIsAddSupplierOpen(false);
      toast({
        title: "Success",
        description: "Supplier added successfully",
      });
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast({
        title: "Error",
        description: "Failed to add supplier",
        variant: "destructive",
      });
    }
  };

  const handleEditSupplier = async () => {
    try {
      const id = currentSupplier.id;
      if (!id) return;
      
      const { error } = await supabase
        .from('suppliers')
        .update({ 
          name: currentSupplier.name,
          contact_info: currentSupplier.contact_info,
          outstanding_payment: currentSupplier.outstanding_payment
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setSuppliers(suppliers.map(s => s.id === id ? { ...s, ...currentSupplier } : s));
      resetSupplierForm();
      setIsEditSupplierOpen(false);
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "Error",
        description: "Failed to update supplier",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSupplier = async () => {
    try {
      const id = currentSupplier.id;
      if (!id) return;
      
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSuppliers(suppliers.filter(s => s.id !== id));
      resetSupplierForm();
      setIsDeleteSupplierOpen(false);
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    }
  };

  const resetExpenseForm = () => {
    setCurrentExpense({
      type: "bill",
      description: "",
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      supplier_id: undefined
    });
  };

  const resetSupplierForm = () => {
    setCurrentSupplier({
      name: "",
      contact_info: "",
      outstanding_payment: 0
    });
  };

  const openEditExpenseDialog = (expense: Expense) => {
    setCurrentExpense(expense);
    setIsEditExpenseOpen(true);
  };

  const openDeleteExpenseDialog = (expense: Expense) => {
    setCurrentExpense(expense);
    setIsDeleteExpenseOpen(true);
  };

  const openEditSupplierDialog = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setIsEditSupplierOpen(true);
  };

  const openDeleteSupplierDialog = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setIsDeleteSupplierOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Expenses & Suppliers</h1>
        <p className="text-gray-600">Manage expenses, bills, and supplier payments.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl">Expense Management</CardTitle>
              <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetExpenseForm(); setIsAddExpenseOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh]">
                  <ScrollArea className="max-h-[80vh] pr-4">
                    <DialogHeader>
                      <DialogTitle>Add New Expense</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <Select 
                          name="type"
                          value={currentExpense.type} 
                          onValueChange={(value) => setCurrentExpense({...currentExpense, type: value})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bill">Bill</SelectItem>
                            <SelectItem value="material_purchase">Material Purchase</SelectItem>
                            <SelectItem value="supplier_payment">Supplier Payment</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          className="col-span-3"
                          value={currentExpense.description}
                          onChange={handleExpenseInputChange}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Amount (₹)</Label>
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          className="col-span-3"
                          value={currentExpense.amount || ''}
                          onChange={handleExpenseInputChange}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expense_date" className="text-right">Date</Label>
                        <Input
                          id="expense_date"
                          name="expense_date"
                          type="date"
                          className="col-span-3"
                          value={currentExpense.expense_date}
                          onChange={handleExpenseInputChange}
                        />
                      </div>
                      {(currentExpense.type === "material_purchase" || currentExpense.type === "supplier_payment") && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="supplier_id" className="text-right">Supplier</Label>
                          <Select 
                            name="supplier_id"
                            value={currentExpense.supplier_id?.toString() || ''} 
                            onValueChange={(value) => setCurrentExpense({...currentExpense, supplier_id: value ? parseInt(value) : undefined})}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers.map(supplier => (
                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                  {supplier.name} {supplier.outstanding_payment > 0 ? `(₹${supplier.outstanding_payment} due)` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddExpense}>Save Expense</Button>
                    </DialogFooter>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading expenses data...</div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-4 flex flex-col items-center gap-2">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  <p>No expenses found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount (₹)</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="capitalize">{expense.type.replace('_', ' ')}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>₹ {expense.amount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {expense.supplier_id ? 
                            suppliers.find(s => s.id === expense.supplier_id)?.name || 'Unknown' : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openEditExpenseDialog(expense)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openDeleteExpenseDialog(expense)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suppliers" className="w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl">Supplier Management</CardTitle>
              <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetSupplierForm(); setIsAddSupplierOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh]">
                  <ScrollArea className="max-h-[80vh] pr-4">
                    <DialogHeader>
                      <DialogTitle>Add New Supplier</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          className="col-span-3"
                          value={currentSupplier.name}
                          onChange={handleSupplierInputChange}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contact_info" className="text-right">Contact Info</Label>
                        <Input
                          id="contact_info"
                          name="contact_info"
                          className="col-span-3"
                          value={currentSupplier.contact_info}
                          onChange={handleSupplierInputChange}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="outstanding_payment" className="text-right">Outstanding Payment (₹)</Label>
                        <Input
                          id="outstanding_payment"
                          name="outstanding_payment"
                          type="number"
                          className="col-span-3"
                          value={currentSupplier.outstanding_payment || ''}
                          onChange={handleSupplierInputChange}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddSupplierOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddSupplier}>Save Supplier</Button>
                    </DialogFooter>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading suppliers data...</div>
              ) : suppliers.length === 0 ? (
                <div className="text-center py-4 flex flex-col items-center gap-2">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  <p>No suppliers found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Outstanding Payment (₹)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contact_info}</TableCell>
                        <TableCell className={supplier.outstanding_payment > 0 ? "text-red-500 font-bold" : ""}>
                          ₹ {supplier.outstanding_payment.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openEditSupplierDialog(supplier)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openDeleteSupplierDialog(supplier)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="max-h-[90vh]">
          <ScrollArea className="max-h-[80vh] pr-4">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">Type</Label>
                <Select 
                  name="type"
                  value={currentExpense.type} 
                  onValueChange={(value) => setCurrentExpense({...currentExpense, type: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bill">Bill</SelectItem>
                    <SelectItem value="material_purchase">Material Purchase</SelectItem>
                    <SelectItem value="supplier_payment">Supplier Payment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  className="col-span-3"
                  value={currentExpense.description}
                  onChange={handleExpenseInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount" className="text-right">Amount (₹)</Label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="number"
                  className="col-span-3"
                  value={currentExpense.amount || ''}
                  onChange={handleExpenseInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-expense_date" className="text-right">Date</Label>
                <Input
                  id="edit-expense_date"
                  name="expense_date"
                  type="date"
                  className="col-span-3"
                  value={currentExpense.expense_date}
                  onChange={handleExpenseInputChange}
                />
              </div>
              {(currentExpense.type === "material_purchase" || currentExpense.type === "supplier_payment") && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-supplier_id" className="text-right">Supplier</Label>
                  <Select 
                    name="supplier_id"
                    value={currentExpense.supplier_id?.toString() || ''} 
                    onValueChange={(value) => setCurrentExpense({...currentExpense, supplier_id: value ? parseInt(value) : undefined})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name} {supplier.outstanding_payment > 0 ? `(₹${supplier.outstanding_payment} due)` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditExpenseOpen(false)}>Cancel</Button>
              <Button onClick={handleEditExpense}>Update Expense</Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Dialog */}
      <Dialog open={isDeleteExpenseOpen} onOpenChange={setIsDeleteExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteExpenseOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteExpense}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditSupplierOpen} onOpenChange={setIsEditSupplierOpen}>
        <DialogContent className="max-h-[90vh]">
          <ScrollArea className="max-h-[80vh] pr-4">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-supplier-name" className="text-right">Name</Label>
                <Input
                  id="edit-supplier-name"
                  name="name"
                  className="col-span-3"
                  value={currentSupplier.name}
                  onChange={handleSupplierInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-supplier-contact_info" className="text-right">Contact Info</Label>
                <Input
                  id="edit-supplier-contact_info"
                  name="contact_info"
                  className="col-span-3"
                  value={currentSupplier.contact_info}
                  onChange={handleSupplierInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-supplier-outstanding_payment" className="text-right">Outstanding Payment (₹)</Label>
                <Input
                  id="edit-supplier-outstanding_payment"
                  name="outstanding_payment"
                  type="number"
                  className="col-span-3"
                  value={currentSupplier.outstanding_payment || ''}
                  onChange={handleSupplierInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditSupplierOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSupplier}>Update Supplier</Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Supplier Dialog */}
      <Dialog open={isDeleteSupplierOpen} onOpenChange={setIsDeleteSupplierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete this supplier? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteSupplierOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSupplier}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
