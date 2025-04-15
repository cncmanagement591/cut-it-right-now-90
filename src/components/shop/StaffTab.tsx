
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Staff {
  id: number;
  name: string;
  role: string;
  contactInfo: string;
  isAvailable: boolean;
}

// Mock data
const initialStaff: Staff[] = [
  { id: 1, name: "Rahul Sharma", role: "Machine Operator", contactInfo: "+91 9876543210", isAvailable: true },
  { id: 2, name: "Priya Singh", role: "Designer", contactInfo: "+91 8765432109", isAvailable: false },
  { id: 3, name: "Ankit Patel", role: "Manager", contactInfo: "+91 7654321098", isAvailable: true },
];

const StaffTab = () => {
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<Omit<Staff, 'id'>>({
    name: "",
    role: "",
    contactInfo: "",
    isAvailable: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvailabilityChange = (value: string) => {
    setNewStaff(prev => ({
      ...prev,
      isAvailable: value === "available"
    }));
  };

  const handleAddStaff = () => {
    const newId = staff.length > 0 ? Math.max(...staff.map(s => s.id)) + 1 : 1;
    setStaff([...staff, { id: newId, ...newStaff }]);
    setNewStaff({
      name: "",
      role: "",
      contactInfo: "",
      isAvailable: true
    });
    setIsAddDialogOpen(false);
  };

  const toggleAvailability = (id: number) => {
    setStaff(staff.map(s => 
      s.id === id ? { ...s, isAvailable: !s.isAvailable } : s
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">Staff Management</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    className="col-span-3"
                    value={newStaff.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role</Label>
                  <Input
                    id="role"
                    name="role"
                    className="col-span-3"
                    value={newStaff.role}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contactInfo" className="text-right">Contact Info</Label>
                  <Input
                    id="contactInfo"
                    name="contactInfo"
                    className="col-span-3"
                    value={newStaff.contactInfo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isAvailable" className="text-right">Availability</Label>
                  <Select 
                    value={newStaff.isAvailable ? "available" : "unavailable"} 
                    onValueChange={handleAvailabilityChange}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddStaff}>Save Staff</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell>{s.contactInfo}</TableCell>
                  <TableCell>
                    {s.isAvailable ? 
                      <Badge className="bg-green-500">Available</Badge> : 
                      <Badge className="bg-red-500">Unavailable</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleAvailability(s.id)}
                      >
                        {s.isAvailable ? "Mark Unavailable" : "Mark Available"}
                      </Button>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffTab;
