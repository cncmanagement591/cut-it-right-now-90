
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface Expense {
  id: number;
  type: string;
  description: string;
  amount: number;
  date: string;
  supplierId?: number;
}

interface Supplier {
  id: number;
  name: string;
  contactInfo: string;
  outstandingPayment: number;
}

// Mock data for expenses and suppliers
const initialExpenses: Expense[] = [
  { id: 1, type: "bill", description: "Electricity Bill", amount: 5000, date: "2025-04-01" },
  { id: 2, type: "material_purchase", description: "Steel Sheets", amount: 15000, date: "2025-04-05", supplierId: 1 },
  { id: 3, type: "supplier_payment", description: "Payment to Metal Works", amount: 25000, date: "2025-04-10", supplierId: 2 },
];

const initialSuppliers: Supplier[] = [
  { id: 1, name: "Steel Dynamics", contactInfo: "+91 9876543210", outstandingPayment: 25000 },
  { id: 2, name: "Metal Works Ltd", contactInfo: "+91 8765432109", outstandingPayment: 10000 },
];

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [activeTab, setActiveTab] = useState("expenses");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>({
    type: "bill",
    description: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  });
  const [newSupplier, setNewSupplier] = useState<Omit<Supplier, 'id'>>({
    name: "",
    contactInfo: "",
    outstandingPayment: 0
  });

  const handleExpenseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSupplierInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({
      ...prev,
      [name]: name === 'outstandingPayment' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddExpense = () => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    setExpenses([...expenses, { id: newId, ...newExpense }]);
    setNewExpense({
      type: "bill",
      description: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    });
    setIsAddExpenseOpen(false);
  };

  const handleAddSupplier = () => {
    const newId = suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
    setSuppliers([...suppliers, { id: newId, ...newSupplier }]);
    setNewSupplier({
      name: "",
      contactInfo: "",
      outstandingPayment: 0
    });
    setIsAddSupplierOpen(false);
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
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="type" className="text-right">Type</Label>
                      <Select 
                        name="type"
                        value={newExpense.type} 
                        onValueChange={(value) => setNewExpense({...newExpense, type: value})}
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
                        value={newExpense.description}
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
                        value={newExpense.amount || ''}
                        onChange={handleExpenseInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="date" className="text-right">Date</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        className="col-span-3"
                        value={newExpense.date}
                        onChange={handleExpenseInputChange}
                      />
                    </div>
                    {(newExpense.type === "material_purchase" || newExpense.type === "supplier_payment") && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="supplierId" className="text-right">Supplier</Label>
                        <Select 
                          name="supplierId"
                          value={newExpense.supplierId?.toString() || ''} 
                          onValueChange={(value) => setNewExpense({...newExpense, supplierId: parseInt(value)})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map(supplier => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddExpense}>Save Expense</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
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
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {expense.supplierId ? 
                          suppliers.find(s => s.id === expense.supplierId)?.name : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suppliers" className="w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl">Supplier Management</CardTitle>
              <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent>
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
                        value={newSupplier.name}
                        onChange={handleSupplierInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="contactInfo" className="text-right">Contact Info</Label>
                      <Input
                        id="contactInfo"
                        name="contactInfo"
                        className="col-span-3"
                        value={newSupplier.contactInfo}
                        onChange={handleSupplierInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="outstandingPayment" className="text-right">Outstanding Payment (₹)</Label>
                      <Input
                        id="outstandingPayment"
                        name="outstandingPayment"
                        type="number"
                        className="col-span-3"
                        value={newSupplier.outstandingPayment || ''}
                        onChange={handleSupplierInputChange}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddSupplier}>Save Supplier</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
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
                      <TableCell>{supplier.contactInfo}</TableCell>
                      <TableCell className={supplier.outstandingPayment > 0 ? "text-red-500 font-bold" : ""}>
                        ₹ {supplier.outstandingPayment.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpensesPage;
