
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

interface Machine {
  id: number;
  name: string;
  model: string;
  status: "available" | "maintenance" | "unavailable";
}

// Mock data
const initialMachines: Machine[] = [
  { id: 1, name: "CNC Plasma", model: "XYZ-1000", status: "available" },
  { id: 2, name: "Laser Cutter", model: "LC-2500", status: "maintenance" },
  { id: 3, name: "Water Jet", model: "HydroMax 3000", status: "unavailable" },
];

const MachinesTab = () => {
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMachine, setNewMachine] = useState<Omit<Machine, 'id'>>({
    name: "",
    model: "",
    status: "available"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMachine(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (status: "available" | "maintenance" | "unavailable") => {
    setNewMachine(prev => ({
      ...prev,
      status
    }));
  };

  const handleAddMachine = () => {
    const newId = machines.length > 0 ? Math.max(...machines.map(m => m.id)) + 1 : 1;
    setMachines([...machines, { id: newId, ...newMachine }]);
    setNewMachine({
      name: "",
      model: "",
      status: "available"
    });
    setIsAddDialogOpen(false);
  };

  const getStatusBadge = (status: Machine["status"]) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500">Available</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-500">Maintenance</Badge>;
      case "unavailable":
        return <Badge className="bg-red-500">Unavailable</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">Machines Management</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Machine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Machine</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Machine Name</Label>
                  <Input
                    id="name"
                    name="name"
                    className="col-span-3"
                    value={newMachine.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="model" className="text-right">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    className="col-span-3"
                    value={newMachine.model}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">Status</Label>
                  <Select 
                    value={newMachine.status} 
                    onValueChange={(value) => handleStatusChange(value as any)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddMachine}>Save Machine</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell>{machine.name}</TableCell>
                  <TableCell>{machine.model}</TableCell>
                  <TableCell>{getStatusBadge(machine.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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

export default MachinesTab;
