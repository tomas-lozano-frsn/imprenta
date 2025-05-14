const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Página principal con formulario
router.get('/', (req, res) => {
  try {
    const productos = db.prepare('SELECT * FROM productos').all();
    res.render('index', { productos });
  } catch (err) {
    console.log("Error al obtener productos:", err);
    res.send('Error al cargar productos');
  }
});

// Registrar una venta
router.post('/vender', (req, res) => {
  try {
    const { cliente, cantidad } = req.body;
    const fecha = new Date().toISOString().split('T')[0];

    const insertVenta = db.prepare(`INSERT INTO ventas (fecha, cliente) VALUES (?, ?)`);
    const result = insertVenta.run(fecha, cliente);
    const ventaId = result.lastInsertRowid;

    const getProducto = db.prepare(`SELECT id FROM productos WHERE color = ?`);
    const insertDetalle = db.prepare(`INSERT INTO detalle_venta (venta_id, producto_id, cantidad) VALUES (?, ?, ?)`);
    const updateStock = db.prepare(`UPDATE productos SET stock = stock - ? WHERE id = ?`);

    for (const color of Object.keys(cantidad)) {
      const cant = parseInt(cantidad[color]);
      if (cant > 0) {
        const producto = getProducto.get(color);
        if (producto) {
          insertDetalle.run(ventaId, producto.id, cant);
          updateStock.run(cant, producto.id);
        }
      }
    }

    res.redirect('/');
  } catch (err) {
    console.error("Error al registrar venta:", err);
    res.send("Error al registrar venta");
  }
});

// Ruta para mostrar los resúmenes de ventas
router.get('/resumen', (req, res) => {
  try {
    const { cliente } = req.query;
    const filtroCliente = cliente ? `AND ventas.cliente = ?` : '';
    const params = cliente ? [cliente] : [];

    const ventasMensuales = db.prepare(`
      SELECT strftime('%Y-%m', fecha) AS mes, color, SUM(cantidad) AS total
      FROM ventas
      JOIN detalle_venta ON ventas.id = detalle_venta.venta_id
      JOIN productos ON detalle_venta.producto_id = productos.id
      WHERE fecha >= date('now', 'start of year') ${filtroCliente}
      GROUP BY mes, color
      ORDER BY mes DESC
    `).all(...params);

    const ventasAnuales = db.prepare(`
      SELECT strftime('%Y', fecha) AS anio, color, SUM(cantidad) AS total
      FROM ventas
      JOIN detalle_venta ON ventas.id = detalle_venta.venta_id
      JOIN productos ON detalle_venta.producto_id = productos.id
      ${cliente ? 'WHERE ventas.cliente = ?' : ''}
      GROUP BY anio, color
      ORDER BY anio DESC
    `).all(...params);

    res.render('resumen', { ventasMensuales, ventasAnuales, cliente });
  } catch (err) {
    console.error("Error al cargar resumen:", err);
    res.send("Error al cargar resumen");
  }
});
// Ruta para agregar stock
router.post('/agregar-stock', (req, res) => {
  try {
    const { color, cantidad } = req.body;
    const update = db.prepare(`UPDATE productos SET stock = stock + ? WHERE color = ?`);
    update.run(cantidad, color);
    res.redirect('/');
  } catch (err) {
    console.error("Error al actualizar stock:", err);
    res.send('Error al actualizar stock');
  }
});
module.exports = router;
