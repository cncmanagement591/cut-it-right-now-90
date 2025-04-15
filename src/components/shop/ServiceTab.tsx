
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface Service {
  id: number;
  name: string;
  price: number;
  description: string;
}

// Mock data
const initialServices: Service[] = [
  { id: 1, name: "CNC Cutting", price: 2500, description: "Standard precision cutting for 15 minutes" },
  { id: 2, name: "Laser Engraving", price: 3500, description: "High precision laser engraving for detailed work" },
  { id: 3, name: "Design Services", price: 1500, description: "Custom design services per hour" },
];

const ServiceTab = () => {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({
    name: "",
    price: 0,
    description: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewService(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddService = () => {
    const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
    setServices([...services, { id: newId, ...newService }]);
    setNewService({
      name: "",
      price: 0,
      description: ""
    });
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">Services Management</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Service Name</Label>
                  <Input
                    id="name"
                    name="name"
                    className="col-span-3"
                    value={newService.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Price (₹)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    className="col-span-3"
                    value={newService.price || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    className="col-span-3"
                    value={newService.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddService}>Save Service</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Price (₹)</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>₹ {service.price}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Edit</Button>
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

export default ServiceTab;
