'use client';

import { collection, addDoc, getDocs, getDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Grid,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import * as XLSX from 'xlsx'; // Import XLSX library

const PantryTracker = () => {
  // State to store pantry items
  const [pantryItems, setPantryItems] = useState([]); // sets elmenent data type to list/array
  // State for new item input
  const [newItemName, setNewItemName] = useState(''); // sets elmenent data type to string/array of char's
  const [newItemQuantity, setNewItemQuantity] = useState(''); // sets elmenent data type to string/array of char's
  const [searchTerm, setSearchTerm] = useState(''); // State for search term
  const [editingItemId, setEditingItemId] = useState(null); // State to track which item is being edited
  const [editingQuantity, setEditingQuantity] = useState(''); // State to track the input value

  // Fetch pantry items from Firestore on component mount
  useEffect(() => {
    fetchPantryItems();
  }, []);

  // Function to fetch pantry items from Firestore
  const fetchPantryItems = async () => {
    const pantryCollection = collection(db, 'pantryItems'); // gets a reference to the 'pantryItems' collection
    const pantrySnapshot = await getDocs(pantryCollection); // retrieves all documents in the collection
    const pantryList = pantrySnapshot.docs.map(doc => ({ // transforms each document into an object with its ID and data
      id: doc.id,
      ...doc.data()
    }));
    setPantryItems(pantryList);  // updates the state
  };

  // Function to add a new item to the pantry
  const addPantryItem = async (event) => {
    event.preventDefault();
    if (newItemName && newItemQuantity) {
      const pantryCollection = collection(db, 'pantryItems');
      const pantrySnapshot = await getDocs(pantryCollection);
      const existingItem = pantrySnapshot.docs.find(doc => doc.data().name === newItemName);

      if (existingItem) {
        const existingItemData = existingItem.data();
        const updatedQuantity = existingItemData.quantity + parseInt(newItemQuantity, 10);
        await updateDoc(doc(db, 'pantryItems', existingItem.id), { quantity: updatedQuantity });
      } else {
        const newItem = {
          name: newItemName,
          quantity: parseInt(newItemQuantity, 10)
        };
        await addDoc(collection(db, 'pantryItems'), newItem);
      }

      setNewItemName('');
      setNewItemQuantity('');
      fetchPantryItems(); // Refresh the list
    }
  };

  // Function to delete an item from the pantry
  const deletePantryItem = async (itemId) => {
    await deleteDoc(doc(db, 'pantryItems', itemId));
    fetchPantryItems(); // Refresh the list
  };

  const updateItemQuantity = async (itemId, change) => {
    const itemDoc = doc(db, 'pantryItems', itemId);
    const itemSnapshot = await getDoc(itemDoc);
    const itemData = itemSnapshot.data();
    const updatedQuantity = itemData.quantity + change;

    if (updatedQuantity >= 0) {
      await updateDoc(itemDoc, { quantity: updatedQuantity });
      fetchPantryItems(); // Refresh the list
    }
  };

  // Function to handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter pantry items based on search term
  const filteredItems = pantryItems
    .sort((a, b) => {
      if (a.name.toLowerCase() === searchTerm.toLowerCase()) return -1; // Exact match first
      if (b.name.toLowerCase() === searchTerm.toLowerCase()) return 1;
      return a.name.toLowerCase().includes(searchTerm.toLowerCase()) ? -1 : 1; // Contains search term
    })
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())); // Filter by search term

  // Function to handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Process the XLSX file and add items to the pantry
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data); // Use XLSX library to read the file
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const items = XLSX.utils.sheet_to_json(worksheet); // Convert sheet to JSON

      // Add items to the pantry
      for (const item of items) {
        await addPantryItemFromXLSX(item); // Function to add item from XLSX
      }
      fetchPantryItems(); // Refresh the list
    }
  };

  // Function to add item from XLSX
  const addPantryItemFromXLSX = async (item) => {
    const { name, quantity } = item; // Assuming the XLSX has 'name' and 'quantity' columns

    // Validate name and quantity
    if (!name || quantity === undefined) {
      console.error('Invalid item data:', item);
      return; // Skip this item if validation fails
    }

    const pantryCollection = collection(db, 'pantryItems');
    const existingItem = await getDocs(pantryCollection).then(snapshot =>
      snapshot.docs.find(doc => doc.data().name === name)
    );

    if (existingItem) {
      const existingItemData = existingItem.data();
      const updatedQuantity = existingItemData.quantity + parseInt(quantity, 10);
      await updateDoc(doc(db, 'pantryItems', existingItem.id), { quantity: updatedQuantity });
    } else {
      const newItem = {
        name,
        quantity: parseInt(quantity, 10)
      };
      await addDoc(collection(db, 'pantryItems'), newItem);
    }
  };

  // Function to handle quantity change
  const handleQuantityChange = async (itemId, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);
    if (quantity >= 0) {
      await updateItemQuantity(itemId, quantity - pantryItems.find(item => item.id === itemId).quantity);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom align="center">Pantry Tracker</Typography>      
      {/* Input form */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Item name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Quantity"
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <Button fullWidth variant="contained" color="primary" onClick={addPantryItem}>
            Stock
          </Button>
        </Grid>
        <Grid item xs={6}>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload} // Handle file upload
            style={{ display: 'none' }} // Hide the default file input
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button fullWidth variant="outlined" color="primary" component="span">
              Upload XLSX
            </Button>
          </label>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Search item"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange} // Update search term on change
          />
        </Grid>
      </Grid>
      
      {/* List of pantry items */}
      <List>
        {filteredItems.map((item) => (
          <ListItem key={item.id}>
            <ListItemText primary={item.name} />
            {editingItemId === item.id ? (
              <Box>
                <TextField
                  variant="outlined"
                  size="small"
                  type="number"
                  value={editingQuantity}
                  onChange={(e) => setEditingQuantity(e.target.value)}
                  inputProps={{ min: 0 }} // Ensure non-negative input
                  sx={{ width: '60px', mr: 1 }} // Adjust width as needed
                />
                <Button
                  onClick={async () => {
                    const quantity = parseInt(editingQuantity, 10);
                    if (quantity >= 0) {
                      await updateItemQuantity(item.id, quantity - item.quantity);
                    }
                    setEditingItemId(null); // Exit editing mode
                  }}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Submit
                </Button>
                <Button
                  onClick={() => {
                    setEditingItemId(null); // Exit editing mode without changes
                    setEditingQuantity(''); // Reset input value
                  }}
                  variant="outlined"
                  size="small"
                >
                  Exit
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography
                  variant="body1"
                  onClick={() => {
                    setEditingItemId(item.id); // Set the item to edit
                    setEditingQuantity(item.quantity); // Set the current quantity in the input
                  }}
                  sx={{ cursor: 'pointer', mr: 2 }}
                >
                  {item.quantity}
                </Typography>
                <Button
                  onClick={() => updateItemQuantity(item.id, 1)}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  ADD
                </Button>
                <Button
                  onClick={() => updateItemQuantity(item.id, -1)}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Remove
                </Button>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => deletePantryItem(item.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default PantryTracker;