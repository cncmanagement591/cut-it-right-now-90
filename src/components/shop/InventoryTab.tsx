
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface Material {
  id: number;
  name: string;
  thickness: number;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minQuantity: number;
}

// Mock data
const initialMaterials: Material[] = [
  { id: 1, name: "Steel Sheet", thickness: 2.0, purchasePrice: 1500, sellingPrice: 2000, currentStock: 50, minQuantity: 10 },
  { id: 2, name: "Aluminum Plate", thickness: 1.5, purchasePrice: 2000, sellingPrice: 2800, currentStock: 30, minQuantity: 15 },
  { id: 3, name: "Copper Sheet", thickness: 1.0, purchasePrice: 3500, sellingPrice: 4200, currentStock: 5, minQuantity: 8 },
];

const InventoryTab = () => {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  
  const [newMaterial, setNewMaterial] = useState<Omit<Material, 'id'>>({
    name: "",
    thickness: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    minQuantity: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({
      ...prev,
      [name]: name === 'name' ? value : parseFloat(value) || 0
    }));
  };

  const handleAddMaterial = () => {
    const newId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
    setMaterials([...materials, { id: newId, ...newMaterial }]);
    setNewMaterial({
      name: "",
      thickness: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      minQuantity: 0
    });
    setIsAddDialogOpen(false);
  };

  const filteredMaterials = showLowStock
    ? materials.filter(m => m.currentStock < m.minQuantity)
    : materials;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">Inventory Management</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input 
                type="text" 
                placeholder="Search materials..."
                className="w-[200px]" 
              />
              <Button variant="outline" onClick={() => setShowLowStock(!showLowStock)}>
                {showLowStock ? "Show All" : "Show Low Stock"}
              </Button>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Material</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      className="col-span-3"
                      value={newMaterial.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="thickness" className="text-right">Thickness (mm)</Label>
                    <Input
                      id="thickness"
                      name="thickness"
                      type="number"
                      className="col-span-3"
                      value={newMaterial.thickness || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="purchasePrice" className="text-right">Purchase Price</Label>
                    <Input
                      id="purchasePrice"
                      name="purchasePrice"
                      type="number"
                      className="col-span-3"
                      value={newMaterial.purchasePrice || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sellingPrice" className="text-right">Selling Price</Label>
                    <Input
                      id="sellingPrice"
                      name="sellingPrice"
                      type="number"
                      className="col-span-3"
                      value={newMaterial.sellingPrice || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currentStock" className="text-right">Current Stock</Label>
                    <Input
                      id="currentStock"
                      name="currentStock"
                      type="number"
                      className="col-span-3"
                      value={newMaterial.currentStock || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="minQuantity" className="text-right">Min. Quantity</Label>
                    <Input
                      id="minQuantity"
                      name="minQuantity"
                      type="number"
                      className="col-span-3"
                      value={newMaterial.minQuantity || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddMaterial}>Save Material</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Thickness (mm)</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min. Quantity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>{material.name}</TableCell>
                  <TableCell>{material.thickness}</TableCell>
                  <TableCell>₹ {material.purchasePrice}</TableCell>
                  <TableCell>₹ {material.sellingPrice}</TableCell>
                  <TableCell className={material.currentStock < material.minQuantity ? "text-red-500 font-bold" : ""}>
                    {material.currentStock}
                  </TableCell>
                  <TableCell>{material.minQuantity}</TableCell>
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

export default InventoryTab;
