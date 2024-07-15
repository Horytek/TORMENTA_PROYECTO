import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, MenuItem, Menu, Container, CssBaseline, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, TextField, Grid, Box
} from '@mui/material';
import { Search, Notifications, AccountCircle } from '@mui/icons-material';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';
import './App.css'; // Importar el archivo CSS

const data = Array.from({ length: 249 }, (_, i) => ({
  fecha: '09/06/2024',
  documento: '68 / 400-000' + (i + 6245),
  nombre: 'CLIENTE VARIOS',
  entra: 1,
  sale: 1,
  stock: 108 - i,
  mon: 'S',
  precio: 30.00,
  cpu: 0.00,
  total: 0.00,
  glosa: 'VENTA DE PRODUCTOS',
}));

const warehouses = ['ALM CENTRAL ESCALERA', 'ALM SUCURSAL NORTE', 'ALM SUCURSAL SUR'];

function App() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [startDate, setStartDate] = useState(new Date('2024-06-09'));
  const [endDate, setEndDate] = useState(new Date('2024-07-09'));
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleWarehouseChange = (event) => {
    setSelectedWarehouse(event.target.value);
  };

  return (
    <Router>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" noWrap>
            TORMENTA
          </Typography>
          <div className="flex-grow" />
          <div>
            <IconButton size="large" aria-label="search" color="inherit">
              <Search />
            </IconButton>
            <IconButton size="large" aria-label="show 4 new mails" color="inherit">
              <Notifications />
            </IconButton>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem onClick={handleClose}>My account</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <Container>
        <Box className="header-box">
          <Typography variant="h6">TORMENTA JEANS - 20610968801</Typography>
          <Typography variant="body1">
            Almacén: {selectedWarehouse} / 3 BOTONES JEANS - TORMENTA<br />
            COD: 010010001 / Stock Actual: 48.00 UND / Stock Separado: 0.00 UND / Stock Transito: 30.00 UND / Marca: TORMENTA JEANS
          </Typography>
          <Grid container spacing={2} alignItems="center" className="header-grid">
            <Grid item>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Desde"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Hasta"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item>
            </Grid>
            <Grid item>
              <Button variant="contained" color="primary">
                Exportar
              </Button>
            </Grid>
            <Grid item>
              <Select
                value={selectedWarehouse}
                onChange={handleWarehouseChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Without label' }}
              >
                {warehouses.map((warehouse, index) => (
                  <MenuItem key={index} value={warehouse}>
                    {warehouse}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </Grid>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper>
              <Typography variant="h6" className="table-title">
                Transacciones Anteriores
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Documento</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Entra</TableCell>
                      <TableCell>Sale</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Mon</TableCell>
                      <TableCell>Precio</TableCell>
                      <TableCell>C.P.U.</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Glosa</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.fecha}</TableCell>
                        <TableCell>{row.documento}</TableCell>
                        <TableCell>{row.nombre}</TableCell>
                        <TableCell>{row.entra}</TableCell>
                        <TableCell>{row.sale}</TableCell>
                        <TableCell>{row.stock}</TableCell>
                        <TableCell>{row.mon}</TableCell>
                        <TableCell>{row.precio}</TableCell>
                        <TableCell>{row.cpu}</TableCell>
                        <TableCell>{row.total}</TableCell>
                        <TableCell>{row.glosa}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Router>
  );
}

export default App;
