
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Machine {
  id: number;
  name: string;
  model: string;
  status: "available" | "maintenance" | "unavailable";
}

const MachinesTab = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [currentMachine, setCurrentMachine] = useState<Machine>({
    id: 0,
    name: "",
    model: "",
    status: "available"
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  async function fetchMachines() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setMachines(data);
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast({
        title: "Error",
        description: "Failed to load machines data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentMachine(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (status: "available" | "maintenance" | "unavailable") => {
    setCurrentMachine(prev => ({
      ...prev,
      status
    }));
  };

  const handleAddMachine = async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .insert([{ 
          name: currentMachine.name,
          model: currentMachine.model,
          status: currentMachine.status
        }])
        .select();
      
      if (error) throw error;
      
      setMachines([...machines, data[0]]);
      resetForm();
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Machine added successfully",
      });
    } catch (error) {
      console.error('Error adding machine:', error);
      toast({
        title: "Error",
        description: "Failed to add machine",
        variant: "destructive",
      });
    }
  };

  const handleEditMachine = async () => {
    try {
      const { error } = await supabase
        .from('machines')
        .update({ 
          name: currentMachine.name,
          model: currentMachine.model,
          status: currentMachine.status
        })
        .eq('id', currentMachine.id);
      
      if (error) throw error;
      
      setMachines(machines.map(m => m.id === currentMachine.id ? currentMachine : m));
      resetForm();
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Machine updated successfully",
      });
    } catch (error) {
      console.error('Error updating machine:', error);
      toast({
        title: "Error",
        description: "Failed to update machine",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMachine = async () => {
    try {
      const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', currentMachine.id);
      
      if (error) throw error;
      
      setMachines(machines.filter(m => m.id !== currentMachine.id));
      resetForm();
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Machine deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting machine:', error);
      toast({
        title: "Error",
        description: "Failed to delete machine",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCurrentMachine({
      id: 0,
      name: "",
      model: "",
      status: "available"
    });
  };

  const openEditDialog = (machine: Machine) => {
    setCurrentMachine(machine);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (machine: Machine) => {
    setCurrentMachine(machine);
    setIsDeleteDialogOpen(true);
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
              <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Machine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh]">
              <ScrollArea className="max-h-[80vh] pr-4">
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
                      value={currentMachine.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="model" className="text-right">Model</Label>
                    <Input
                      id="model"
                      name="model"
                      className="col-span-3"
                      value={currentMachine.model}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Status</Label>
                    <Select 
                      value={currentMachine.status} 
                      onValueChange={(value: "available" | "maintenance" | "unavailable") => handleStatusChange(value)}
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
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddMachine}>Save Machine</Button>
                </DialogFooter>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading machines data...</div>
          ) : machines.length === 0 ? (
            <div className="text-center py-4 flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p>No machines found</p>
            </div>
          ) : (
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
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(machine)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog(machine)}>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh]">
          <ScrollArea className="max-h-[80vh] pr-4">
            <DialogHeader>
              <DialogTitle>Edit Machine</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Machine Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  className="col-span-3"
                  value={currentMachine.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-model" className="text-right">Model</Label>
                <Input
                  id="edit-model"
                  name="model"
                  className="col-span-3"
                  value={currentMachine.model}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">Status</Label>
                <Select 
                  value={currentMachine.status} 
                  onValueChange={(value: "available" | "maintenance" | "unavailable") => handleStatusChange(value)}
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
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditMachine}>Update Machine</Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Machine</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete <strong>{currentMachine.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteMachine}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MachinesTab;
