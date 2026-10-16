"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  const [insumos, setInsumos] = useState<any[]>([]);
  const [procesos, setProcesos] = useState<any[]>([]);
  const [clientesDb, setClientesDb] = useState<any[]>([]);
  const [productosCat, setProductosCat] = useState<any[]>([]);
  const [listaCotizaciones, setListaCotizaciones] = useState<any[]>([]);

  const [vistaActual, setVistaActual] = useState<'cotizador' | 'historial_cotizaciones' | 'admin_clientes' | 'lista_clientes' | 'admin_productos' | 'lista_productos' | 'admin_insumos_procesos' | 'lista_insumos' | 'lista_procesos'>('cotizador');

  // Filtros
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');

  // Datos del Cliente (Cotizador)
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [rutNit, setRutNit] = useState('');
  const [contacto, setContacto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');

  // Carrito de Cotización y Condiciones de Pago
  const [itemsCotizacion, setItemsCotizacion] = useState<any[]>([]);
  const [porcentajeDescuentoGlobal, setPorcentajeDescuentoGlobal] = useState(0);
  const [aplicarIva, setAplicarIva] = useState(true);
  const [condicionPago, setCondicionPago] = useState<'Contado' | 'Crédito'>('Contado');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cotizacionCreada, setCotizacionCreada] = useState<any>(null);

  // Cotizar desde Catálogo con Medidas
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
  const [productoActualObj, setProductoActualObj] = useState<any>(null);
  const [altoMts, setAltoMts] = useState<number>(1);
  const [anchoMts, setAnchoMts] = useState<number>(1);
  const [cantidadCatalogo, setCantidadCatalogo] = useState<number>(1);
  const [descuentoItemPct, setDescuentoItemPct] = useState<number>(0);
  const [calculoItemResultado, setCalculoItemResultado] = useState<any>(null);

  // CREADOR / EDICION DE PRODUCTOS
  const [productoEditandoId, setProductoEditandoId] = useState<string | null>(null);
  const [nombreProdNuevo, setNombreProdNuevo] = useState('');
  const [descProdNuevo, setDescProdNuevo] = useState('');
  const [utilidadProdNuevo, setUtilidadProdNuevo] = useState(50);
  const [bomInsumos, setBomInsumos] = useState<{ insumo_id: string; cantidad: number }[]>([{ insumo_id: '', cantidad: 1 }]);
  const [rutaProcesos, setRutaProcesos] = useState<{ proceso_id: string; horas: number }[]>([{ proceso_id: '', horas: 0.5 }]);
  const [analisisResultado, setAnalisisResultado] = useState<any>(null);

  // EDICIÓN / CREACIÓN DE INSUMOS
  const [insumoEditandoId, setInsumoEditandoId] = useState<string | null>(null);
  const [insumoNombre, setInsumoNombre] = useState('');
  const [insumoPresentacion, setInsumoPresentacion] = useState('Rollo');
  const [insumoAncho, setInsumoAncho] = useState(1.52);
  const [insumoLargo, setInsumoLargo] = useState(50);
  const [insumoGramaje, setInsumoGramaje] = useState('13oz');
  const [insumoCostoNeto, setInsumoCostoNeto] = useState(150000);
  const [insumoUnidadMedida, setInsumoUnidadMedida] = useState('m2');

  // EDICIÓN / CREACIÓN DE PROCESOS
  const [procesoEditandoId, setProcesoEditandoId] = useState<string | null>(null);
  const [nuevoProcesoNombre, setNuevoProcesoNombre] = useState('');
  const [nuevoProcesoTipo, setNuevoProcesoTipo] = useState('Operativo');
  const [nuevoProcesoCostoHora, setNuevoProcesoCostoHora] = useState(5000);

  // CREACIÓN / EDICIÓN DE CLIENTES
  const [clienteEditandoId, setClienteEditandoId] = useState<string | null>(null);
  const [cliRazonSocial, setCliRazonSocial] = useState('');
  const [cliRut, setCliRut] = useState('');
  const [cliContacto, setCliContacto] = useState('');
  const [cliCorreo, setCliCorreo] = useState('');
  const [cliTelefono, setCliTelefono] = useState('');

  useEffect(() => {
    setIsMounted(true);
    cargarDatosGlobales();
  }, []);

  async function cargarDatosGlobales() {
    const { data: insData } = await supabase.from('insumos').select('*');
    if (insData) setInsumos(insData);

    const { data: procData } = await supabase.from('procesos').select('*');
    if (procData) setProcesos(procData);

    const { data: cliData } = await supabase.from('clientes').select('*').order('razon_social', { ascending: true });
    if (cliData) setClientesDb(cliData);

    const { data: prodData } = await supabase.from('productos').select('*');
    if (prodData) setProductosCat(prodData);

    const { data: cotData, error: cotErr } = await supabase.from('cotizaciones').select(`
      *,
      clientes ( id, razon_social, rut_nit, contacto_nombre, correo, telefono )
    `).order('created_at', { ascending: false });

    if (cotErr) {
      console.error("Error al cargar cotizaciones:", cotErr.message);
    } else if (cotData) {
      setListaCotizaciones(cotData);
    }
  }

  if (!isMounted) return null;

  const redondearComercial = (valor: number, multiplo: number = 100) => {
    if (!valor || isNaN(valor)) return 0;
    return Math.round(Math.ceil(valor / multiplo) * multiplo);
  };

  const handleSeleccionarClienteExistente = (id: string) => {
    setClienteSeleccionadoId(id);
    const cli = clientesDb.find(c => c.id === id);
    if (cli) {
      setRazonSocial(cli.razon_social || '');
      setRutNit(cli.rut_nit || '');
      setContacto(cli.contacto_nombre || '');
      setCorreo(cli.correo || '');
      setTelefono(cli.telefono || '');
    }
  };

  const handleSeleccionarProductoCatalogo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setProductoSeleccionadoId(id);
    const prod = productosCat.find(p => p.id === id);
    setProductoActualObj(prod || null);
    setCalculoItemResultado(null);
  };

  const calcularPrecioPorMedidas = () => {
    if (!productoActualObj) {
      alert("Seleccione un producto primero.");
      return;
    }

    const precioUnitarioBase = Number(productoActualObj.precio_venta_fijo || 0);
    const costoUnitarioBase = Number(productoActualObj.costo_base || 0);

    const areaM2 = Number((altoMts * anchoMts).toFixed(4));
    const factorArea = areaM2 > 0 ? areaM2 : 1;

    const subtotalBrutoLinea = precioUnitarioBase * factorArea * cantidadCatalogo;
    const montoDescuentoItem = subtotalBrutoLinea * (descuentoItemPct / 100);
    const totalNetoLineaCalculado = subtotalBrutoLinea - montoDescuentoItem;

    const totalNetoRedondeado = redondearComercial(totalNetoLineaCalculado, 100);
    const costoTotalLinea = costoUnitarioBase * factorArea * cantidadCatalogo;

    setCalculoItemResultado({
      areaM2,
      precioUnitarioBase,
      subtotalBruto: redondearComercial(subtotalBrutoLinea, 100),
      descuentoMonto: Math.round(montoDescuentoItem),
      totalNeto: totalNetoRedondeado,
      costoTotal: Math.round(costoTotalLinea)
    });
  };

  const agregarItemCalculadoAlPedido = () => {
    if (!calculoItemResultado || !productoActualObj) return;

    const descripcionMedidas = `[Medidas: ${altoMts}m x ${anchoMts}m | Área: ${calculoItemResultado.areaM2} m²]`;
    const nuevoItem = {
      descripcion_item: `${productoActualObj.nombre} - ${productoActualObj.descripcion || ''} ${descripcionMedidas}`,
      cantidad: cantidadCatalogo,
      costo_unitario: calculoItemResultado.costoTotal / cantidadCatalogo,
      precio_unitario: calculoItemResultado.totalNeto / cantidadCatalogo,
      costo_total_linea: calculoItemResultado.costoTotal,
      precio_total_linea: calculoItemResultado.totalNeto,
      metadatos: { producto_id: productoActualObj.id, alto: altoMts, ancho: anchoMts, area: calculoItemResultado.areaM2 }
    };

    setItemsCotizacion([...itemsCotizacion, nuevoItem]);
    setProductoSeleccionadoId('');
    setProductoActualObj(null);
    setCalculoItemResultado(null);
    setAltoMts(1);
    setAnchoMts(1);
    setCantidadCatalogo(1);
    setDescuentoItemPct(0);
  };

  const agregarFilaInsumo = () => setBomInsumos([...bomInsumos, { insumo_id: '', cantidad: 1 }]);
  const eliminarFilaInsumo = (idx: number) => setBomInsumos(bomInsumos.filter((_, i) => i !== idx));

  const agregarFilaProceso = () => setRutaProcesos([...rutaProcesos, { proceso_id: '', horas: 0.5 }]);
  const eliminarFilaProceso = (idx: number) => setRutaProcesos(rutaProcesos.filter((_, i) => i !== idx));

  const ejecutarAnalisisCompuesto = () => {
    let costoTotalMateriales = 0;
    for (const item of bomInsumos) {
      const ins = insumos.find(i => i.id === item.insumo_id);
      if (ins) {
        const ancho = Number(ins.ancho_mts || 0);
        const largo = Number(ins.largo_mts || 0);
        const costoNetoTotal = Number(ins.costo_neto || 0);
        const cantidadConsumida = Number(item.cantidad || 0);

        if (ins.unidad_medida === 'm2' && ancho > 0 && largo > 0) {
          const areaTotalPresentacion = ancho * largo;
          const costoPorM2 = costoNetoTotal / areaTotalPresentacion;
          costoTotalMateriales += costoPorM2 * cantidadConsumida;
        } else {
          const costoUnitarioRef = costoNetoTotal / (largo > 0 ? largo : 1);
          costoTotalMateriales += costoUnitarioRef * cantidadConsumida;
        }
      }
    }

    let costoTotalProcesos = 0;
    for (const proc of rutaProcesos) {
      const p = procesos.find(x => x.id === proc.proceso_id);
      if (p) {
        costoTotalProcesos += Number(p.costo_operativo_hora || 0) * Number(proc.horas || 0);
      }
    }

    const costoBaseTotal = costoTotalMateriales + costoTotalProcesos;
    const factorUtilidad = 1 - (utilidadProdNuevo / 100);
    const precioVentaSugeridoBruto = factorUtilidad > 0 ? costoBaseTotal / factorUtilidad : costoBaseTotal * 2;
    const precioVentaRedondeado = redondearComercial(precioVentaSugeridoBruto, 100);

    setAnalisisResultado({
      costoMateriales: Math.round(costoTotalMateriales),
      costoProcesos: Math.round(costoTotalProcesos),
      costoBase: redondearComercial(costoBaseTotal, 100),
      precioVenta: precioVentaRedondeado
    });
  };

  const guardarOActualizarInsumo = async () => {
    if (!insumoNombre) {
      alert("El nombre del insumo es obligatorio.");
      return;
    }
    const datosInsumo = {
      nombre: insumoNombre,
      tipo_presentacion: insumoPresentacion,
      ancho_mts: insumoAncho,
      largo_mts: insumoLargo,
      gramaje_oz: insumoGramaje,
      costo_neto: insumoCostoNeto,
      unidad_medida: insumoUnidadMedida
    };

    if (insumoEditandoId) {
      await supabase.from('insumos').update(datosInsumo).eq('id', insumoEditandoId);
    } else {
      await supabase.from('insumos').insert([datosInsumo]);
    }
    setInsumoEditandoId(null);
    setInsumoNombre('');
    await cargarDatosGlobales();
    setVistaActual('lista_insumos');
  };

  const prepararEdicionInsumo = (ins: any) => {
    setInsumoEditandoId(ins.id);
    setInsumoNombre(ins.nombre);
    setInsumoPresentacion(ins.tipo_presentacion || 'Rollo');
    setInsumoAncho(ins.ancho_mts || 1.52);
    setInsumoLargo(ins.largo_mts || 50);
    setInsumoGramaje(ins.gramaje_oz || '13oz');
    setInsumoCostoNeto(ins.costo_neto || 0);
    setInsumoUnidadMedida(ins.unidad_medida || 'm2');
    setVistaActual('admin_insumos_procesos');
  };

  const eliminarInsumo = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este insumo?")) return;
    await supabase.from('insumos').delete().eq('id', id);
    await cargarDatosGlobales();
  };

  const guardarOActualizarProceso = async () => {
    if (!nuevoProcesoNombre) {
      alert("El nombre del proceso es obligatorio.");
      return;
    }
    const datosProceso = {
      nombre: nuevoProcesoNombre,
      tipo: nuevoProcesoTipo,
      costo_operativo_hora: nuevoProcesoCostoHora
    };

    if (procesoEditandoId) {
      await supabase.from('procesos').update(datosProceso).eq('id', procesoEditandoId);
    } else {
      await supabase.from('procesos').insert([datosProceso]);
    }
    setProcesoEditandoId(null);
    setNuevoProcesoNombre('');
    await cargarDatosGlobales();
    setVistaActual('lista_procesos');
  };

  const prepararEdicionProceso = (proc: any) => {
    setProcesoEditandoId(proc.id);
    setNuevoProcesoNombre(proc.nombre);
    setNuevoProcesoTipo(proc.tipo || 'Operativo');
    setNuevoProcesoCostoHora(proc.costo_operativo_hora || 5000);
    setVistaActual('admin_insumos_procesos');
  };

  const eliminarProceso = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este proceso?")) return;
    await supabase.from('procesos').delete().eq('id', id);
    await cargarDatosGlobales();
  };

  const guardarOActualizarProducto = async () => {
    if (!nombreProdNuevo || !analisisResultado) {
      alert("Ingrese un nombre y ejecute el análisis de costos antes de guardar.");
      return;
    }

    const datosProd = {
      nombre: nombreProdNuevo,
      descripcion: descProdNuevo || 'Producto compuesto estandarizado',
      costo_base: analisisResultado.costoBase,
      porcentaje_utilidad: utilidadProdNuevo,
      precio_venta_fijo: analisisResultado.precioVenta
    };

    if (productoEditandoId) {
      await supabase.from('productos').update(datosProd).eq('id', productoEditandoId);
      await supabase.from('producto_insumos_bom').delete().eq('producto_id', productoEditandoId);
      await supabase.from('producto_procesos_ruta').delete().eq('producto_id', productoEditandoId);

      for (const item of bomInsumos) {
        if (item.insumo_id) {
          await supabase.from('producto_insumos_bom').insert([{
            producto_id: productoEditandoId,
            insumo_id: item.insumo_id,
            cantidad_teorica_consumo: item.cantidad
          }]);
        }
      }

      for (const proc of rutaProcesos) {
        if (proc.proceso_id) {
          await supabase.from('producto_procesos_ruta').insert([{
            producto_id: productoEditandoId,
            proceso_id: proc.proceso_id,
            horas_estimadas: proc.horas
          }]);
        }
      }
    } else {
      const { data: prodIns, error: prodErr } = await supabase.from('productos').insert([datosProd]).select().single();
      if (prodErr) {
        alert('Error al guardar producto: ' + prodErr.message);
        return;
      }
      const productoId = prodIns.id;

      for (const item of bomInsumos) {
        if (item.insumo_id) {
          await supabase.from('producto_insumos_bom').insert([{
            producto_id: productoId,
            insumo_id: item.insumo_id,
            cantidad_teorica_consumo: item.cantidad
          }]);
        }
      }

      for (const proc of rutaProcesos) {
        if (proc.proceso_id) {
          await supabase.from('producto_procesos_ruta').insert([{
            producto_id: productoId,
            proceso_id: proc.proceso_id,
            horas_estimadas: proc.horas
          }]);
        }
      }
    }

    setNombreProdNuevo('');
    setDescProdNuevo('');
    setProductoEditandoId(null);
    setAnalisisResultado(null);
    await cargarDatosGlobales();
    setVistaActual('lista_productos');
  };

  const prepararEdicionProducto = async (prod: any) => {
    setProductoEditandoId(prod.id);
    setNombreProdNuevo(prod.nombre);
    setDescProdNuevo(prod.descripcion || '');
    setUtilidadProdNuevo(prod.porcentaje_utilidad || 50);

    const { data: bomData } = await supabase.from('producto_insumos_bom').select('*').eq('producto_id', prod.id);
    if (bomData && bomData.length > 0) {
      setBomInsumos(bomData.map(b => ({ insumo_id: b.insumo_id, cantidad: b.cantidad_teorica_consumo })));
    } else {
      setBomInsumos([{ insumo_id: '', cantidad: 1 }]);
    }

    const { data: rutaData } = await supabase.from('producto_procesos_ruta').select('*').eq('producto_id', prod.id);
    if (rutaData && rutaData.length > 0) {
      setRutaProcesos(rutaData.map(r => ({ proceso_id: r.proceso_id, horas: r.horas_estimadas })));
    } else {
      setRutaProcesos([{ proceso_id: '', horas: 0.5 }]);
    }

    setAnalisisResultado({
      costoBase: prod.costo_base,
      precioVenta: prod.precio_venta_fijo,
      costoMateriales: 0,
      costoProcesos: 0
    });

    setVistaActual('admin_productos');
  };

  const eliminarProducto = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    await supabase.from('productos').delete().eq('id', id);
    await cargarDatosGlobales();
  };

  const guardarOActualizarCliente = async () => {
    if (!cliRazonSocial) {
      alert("La Razón Social es obligatoria.");
      return;
    }

    const datosCliente = {
      razon_social: cliRazonSocial,
      rut_nit: cliRut,
      contacto_nombre: cliContacto,
      correo: cliCorreo,
      telefono: cliTelefono
    };

    if (clienteEditandoId) {
      await supabase.from('clientes').update(datosCliente).eq('id', clienteEditandoId);
      alert("¡Cliente actualizado con éxito!");
    } else {
      await supabase.from('clientes').insert([datosCliente]);
      alert("¡Cliente registrado con éxito!");
    }

    setClienteEditandoId(null);
    setCliRazonSocial('');
    setCliRut('');
    setCliContacto('');
    setCliCorreo('');
    setCliTelefono('');
    await cargarDatosGlobales();
    setVistaActual('lista_clientes');
  };

  const prepararEdicionCliente = (cli: any) => {
    setClienteEditandoId(cli.id);
    setCliRazonSocial(cli.razon_social || '');
    setCliRut(cli.rut_nit || '');
    setCliContacto(cli.contacto_nombre || '');
    setCliCorreo(cli.correo || '');
    setCliTelefono(cli.telefono || '');
    setVistaActual('admin_clientes');
  };

  const eliminarCliente = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;
    await supabase.from('clientes').delete().eq('id', id);
    await cargarDatosGlobales();
  };

  const eliminarItem = (index: number) => {
    setItemsCotizacion(itemsCotizacion.filter((_, i) => i !== index));
  };

  const subtotalItems = itemsCotizacion.reduce((acc, item) => acc + (item.precio_total_linea || 0), 0);
  const montoDescuentoGlobal = subtotalItems * (porcentajeDescuentoGlobal / 100);
  const subtotalConDescuento = subtotalItems - montoDescuentoGlobal;
  const montoIva = aplicarIva ? subtotalConDescuento * 0.19 : 0;
  const totalGlobalFinal = subtotalConDescuento + montoIva;

  const cerrarYGuardarCotizacion = async () => {
    if (!razonSocial || itemsCotizacion.length === 0) {
      alert("Ingrese el cliente y al menos un producto.");
      return;
    }

    setGuardando(true);
    try {
      let clienteId = clienteSeleccionadoId;
      if (!clienteId) {
        const { data: cliNuevo, error: errCli } = await supabase.from('clientes').insert([{
          razon_social: razonSocial, rut_nit: rutNit, contacto_nombre: contacto, correo, telefono
        }]).select().single();
        if (errCli) throw errCli;
        clienteId = cliNuevo.id;
      }

      const siguienteCorrelativo = 154 + listaCotizaciones.length + 1;
      const numeroCotizacionStr = `COT-${String(siguienteCorrelativo).padStart(4, '0')}`;

      const { data: cotCab, error: errCot } = await supabase.from('cotizaciones').insert([{
        cliente_id: clienteId,
        numero_cotizacion: numeroCotizacionStr,
        subtotal: subtotalConDescuento,
        impuestos: montoIva,
        total_general: totalGlobalFinal,
        observaciones,
        estado: 'BORRADOR'
      }]).select().single();

      if (errCot) throw errCot;

      const detalleRows = itemsCotizacion.map(item => ({
        cotizacion_id: cotCab.id,
        descripcion_item: item.descripcion_item,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
        precio_unitario: item.precio_unitario,
        costo_total_linea: item.costo_total_linea,
        precio_total_linea: item.precio_total_linea,
        metadatos_calculo: item.metadatos
      }));

      await supabase.from('cotizaciones_detalle').insert(detalleRows);

      setCotizacionCreada({
        id: cotCab.id,
        numero: numeroCotizacionStr,
        fecha: new Date().toLocaleDateString(),
        cliente: { razonSocial, rutNit, contacto, correo, telefono },
        items: [...itemsCotizacion],
        subtotalBruto: subtotalItems,
        porcentajeDescuentoGlobal: porcentajeDescuentoGlobal,
        montoDescuentoGlobal: montoDescuentoGlobal,
        subtotal: subtotalConDescuento,
        iva: montoIva,
        total: totalGlobalFinal,
        condicionPago,
        observaciones,
        estado: 'BORRADOR'
      });

      setItemsCotizacion([]);
      await cargarDatosGlobales();
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const actualizarEstadoCotizacion = async (cotId: string, nuevoEstado: string) => {
    await supabase.from('cotizaciones').update({ estado: nuevoEstado }).eq('id', cotId);
    if (cotizacionCreada && cotizacionCreada.id === cotId) {
      setCotizacionCreada({ ...cotizacionCreada, estado: nuevoEstado });
    }
    await cargarDatosGlobales();
    alert(`Estado actualizado a: ${nuevoEstado}`);
  };

  const verCotizacionDesdeHistorial = async (cot: any) => {
    const { data: detalles } = await supabase
      .from('cotizaciones_detalle')
      .select('*')
      .eq('cotizacion_id', cot.id);

    const subBruto = (detalles || []).reduce((acc: number, it: any) => acc + (it.precio_total_linea || 0), 0);

    setCotizacionCreada({
      id: cot.id,
      numero: cot.numero_cotizacion || `COT-${cot.id.slice(0, 4)}`,
      fecha: new Date(cot.created_at).toLocaleDateString(),
      cliente: {
        razonSocial: cot.clientes?.razon_social || 'N/A',
        rutNit: cot.clientes?.rut_nit || '',
        contacto: cot.clientes?.contacto_nombre || '',
        correo: cot.clientes?.correo || '',
        telefono: cot.clientes?.telefono || ''
      },
      items: detalles || [],
      subtotalBruto: subBruto,
      porcentajeDescuentoGlobal: 0,
      montoDescuentoGlobal: 0,
      subtotal: cot.subtotal,
      iva: cot.impuestos,
      total: cot.total_general,
      condicionPago: 'Contado',
      observaciones: cot.observaciones,
      estado: cot.estado
    });
  };

  const clonarCotizacionParaEditar = async (cot: any) => {
    const { data: detalles } = await supabase
      .from('cotizaciones_detalle')
      .select('*')
      .eq('cotizacion_id', cot.id);

    setRazonSocial(cot.clientes?.razon_social || '');
    setRutNit(cot.clientes?.rut_nit || '');
    setContacto(cot.clientes?.contacto_nombre || '');
    setCorreo(cot.clientes?.correo || '');
    setTelefono(cot.clientes?.telefono || '');
    setObservaciones(cot.observaciones || '');

    const itemsClonados = (detalles || []).map((it: any) => ({
      descripcion_item: it.descripcion_item,
      cantidad: it.cantidad,
      costo_unitario: it.costo_unitario,
      precio_unitario: it.precio_unitario,
      costo_total_linea: it.costo_total_linea,
      precio_total_linea: it.precio_total_linea,
      metadatos: it.metadatos_calculo
    }));

    setItemsCotizacion(itemsClonados);
    setCotizacionCreada(null);
    setVistaActual('cotizador');
  };

  const cotizacionesFiltradas = listaCotizaciones.filter(cot => {
    const q = busquedaHistorial.toLowerCase();
    const clienteNombre = (cot.clientes?.razon_social || '').toLowerCase();
    const numeroStr = String(cot.numero_cotizacion || cot.id).toLowerCase();
    const coincideTexto = clienteNombre.includes(q) || numeroStr.includes(q);

    let coincideFecha = true;
    if (filtroFecha && cot.created_at) {
      const fechaCotizacionStr = cot.created_at.split('T')[0];
      coincideFecha = fechaCotizacionStr === filtroFecha;
    }

    return coincideTexto && coincideFecha;
  });

  const clientesFiltrados = clientesDb.filter(c => 
    (c.razon_social || '').toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    (c.rut_nit || '').toLowerCase().includes(busquedaCliente.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef2f6', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* BARRA LATERAL OSCURA */}
      <aside className="no-print" style={{ width: '260px', background: '#121824', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 16px', borderRight: '1px solid #1e293b' }}>
        <div>
          <div style={{ marginBottom: '35px', paddingLeft: '8px' }}>
            <img src="/logo-global-fondo-blanco.png" alt="Global Graph" style={{ height: '42px', objectFit: 'contain', display: 'block', marginBottom: '6px' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
            <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Gráfica Industrial / Publicitaria</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={() => { setCotizacionCreada(null); setVistaActual('cotizador'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: vistaActual === 'cotizador' && !cotizacionCreada ? '#ff6600' : 'transparent', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', textAlign: 'left', transition: 'background 0.2s' }}>
              <span>📋</span> Cotizador
            </button>
            <button onClick={() => setVistaActual('historial_cotizaciones')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: vistaActual === 'historial_cotizaciones' ? '#ff6600' : 'transparent', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', textAlign: 'left' }}>
              <span>📂</span> Historial
            </button>
            <button onClick={() => setVistaActual('lista_clientes')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: vistaActual === 'lista_clientes' || vistaActual === 'admin_clientes' ? '#ff6600' : 'transparent', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', textAlign: 'left' }}>
              <span>👤</span> Clientes
            </button>
            <button onClick={() => setVistaActual('lista_insumos')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: vistaActual === 'lista_insumos' || vistaActual === 'admin_insumos_procesos' ? '#ff6600' : 'transparent', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', textAlign: 'left' }}>
              <span>🧱</span> Insumos
            </button>
            <button onClick={() => setVistaActual('lista_procesos')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: vistaActual === 'lista_procesos' ? '#ff6600' : 'transparent', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', textAlign: 'left' }}>
              <span>⚙️</span> Procesos
            </button>
            <button onClick={() => setVistaActual('lista_productos')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: vistaActual === 'lista_productos' || vistaActual === 'admin_productos' ? '#ff6600' : 'transparent', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', textAlign: 'left' }}>
              <span>📦</span> Catálogo
            </button>
          </nav>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4', paddingLeft: '8px', borderTop: '1px solid #1e293b', paddingTop: '15px' }}>
          Tu aliado <span style={{ color: '#ff6600', fontWeight: 'bold' }}>Global</span> para la Comunicación Visual
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* BARRA SUPERIOR */}
        <header className="no-print" style={{ background: '#121824', color: '#fff', padding: '18px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.3px' }}>Cotizador</h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ cursor: 'pointer', fontSize: '18px' }}>🎛️</span>
            <span style={{ cursor: 'pointer', fontSize: '18px' }}>👤</span>
          </div>
        </header>

        <main style={{ padding: '30px', maxWidth: '1000px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          
          {cotizacionCreada ? (
            <div className="pdf-container" style={{ background: '#fff', padding: '40px', border: '1px solid #e0e0e0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', fontSize: '13px', color: '#333' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                  <img src="/logo-global.png" alt="Global Graph" style={{ height: '42px', objectFit: 'contain', marginBottom: '8px', display: 'block' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  <h2 style={{ margin: '0 0 3px 0', fontSize: '15px', fontWeight: 'bold', color: '#333' }}>GLOBAL GRAPH SpA</h2>
                  <p style={{ margin: '0 0 2px 0', color: '#555', fontSize: '12px' }}>RUT: 78.307.118-5</p>
                  <p style={{ margin: '0 0 2px 0', color: '#555', fontSize: '12px' }}>J.Santos Ossa 2545; 201, Antofagasta</p>
                  <p style={{ margin: '0', color: '#555', fontSize: '12px' }}>globalgraphchile@gmail.com | +56 9 3898 3905</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ fontSize: '26px', margin: '0 0 8px 0', color: '#ff6600', letterSpacing: '0.5px', fontWeight: 'bold' }}>COTIZACIÓN</h1>
                  <p style={{ margin: '0 0 3px 0', fontSize: '13px', color: '#333' }}>Nº <strong>{cotizacionCreada.numero}</strong></p>
                  <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#666' }}>Fecha: {cotizacionCreada.fecha}</p>
                  <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#666' }}>Vigencia: 15 días</p>
                  <p style={{ margin: '0', fontSize: '12px', color: cotizacionCreada.estado === 'APROBADA' ? '#28a745' : '#ff6600', fontWeight: 'bold' }}>Estado: {cotizacionCreada.estado}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '25px', background: '#fafafa', padding: '15px 20px', borderRadius: '8px', border: '1px solid #eee' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#ff6600', letterSpacing: '0.5px' }}>Cotizado Para</h4>
                  <p style={{ margin: '0 0 3px 0', fontWeight: 'bold', color: '#222' }}>{cotizacionCreada.cliente.razonSocial}</p>
                  <p style={{ margin: '0 0 3px 0', color: '#555' }}>RUT / NIT: {cotizacionCreada.cliente.rutNit || 'N/A'}</p>
                  <p style={{ margin: '0 0 3px 0', color: '#555' }}>Contacto: {cotizacionCreada.cliente.contacto || 'N/A'}</p>
                  <p style={{ margin: '0 0 3px 0', color: '#555' }}>{cotizacionCreada.cliente.correo || 'N/A'}</p>
                  <p style={{ margin: '0', color: '#555' }}>{cotizacionCreada.cliente.telefono || 'N/A'}</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#ff6600', letterSpacing: '0.5px' }}>Condiciones de Pago</h4>
                  <p style={{ margin: '0 0 3px 0', color: '#444' }}>Anticipo: 50% para iniciar</p>
                  <p style={{ margin: '0 0 3px 0', color: '#444' }}>Saldo: contra entrega</p>
                  <p style={{ margin: '0 0 3px 0', color: '#444' }}>Forma de pago: transferencia bancaria</p>
                  <p style={{ margin: '0', color: '#444' }}>Modalidad: <strong>{cotizacionCreada.condicionPago}</strong></p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#121824', color: '#fff' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 'bold' }}>DESCRIPCIÓN</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', width: '70px' }}>CANT.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', width: '110px' }}>PRECIO UNIT.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', width: '110px' }}>IMPORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacionCreada.items.map((it: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 12px', color: '#333' }}>{it.descripcion_item}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#555' }}>{it.cantidad}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>${Math.round(it.precio_unitario).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: '#222' }}>${Math.round(it.precio_total_linea).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
                <div style={{ width: '280px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
                    <span>Subtotal</span>
                    <span>${Math.round(cotizacionCreada.subtotalBruto || cotizacionCreada.subtotal).toLocaleString()}</span>
                  </div>
                  {cotizacionCreada.porcentajeDescuentoGlobal > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#d9534f' }}>
                        <span>Descuento Global ({cotizacionCreada.porcentajeDescuentoGlobal}%)</span>
                        <span>-${Math.round(cotizacionCreada.montoDescuentoGlobal || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
                        <span>Subtotal Neto</span>
                        <span>${Math.round(cotizacionCreada.subtotal).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
                    <span>IVA (19%)</span>
                    <span>${Math.round(cotizacionCreada.iva).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#fff5ec', borderRadius: '6px', marginTop: '8px', fontSize: '15px', color: '#ff6600', fontWeight: 'bold', border: '1px solid #ffe0cc' }}>
                    <span>TOTAL</span>
                    <span>${Math.round(cotizacionCreada.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#555', background: '#f9f9f9', padding: '12px 15px', borderRadius: '6px', border: '1px solid #eee', marginBottom: '25px', lineHeight: '1.4' }}>
                <strong style={{ color: '#333' }}>Datos para Transferencia Electrónica:</strong><br />
                Empresa: Global Graph SpA | RUT: 78.307.118-5<br />
                Banco: BCI | Cuenta Corriente N°: 14507652 | Correo: globalgraphchile@gmail.com
              </div>

              <div style={{ marginBottom: '40px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '11px', textTransform: 'uppercase', color: '#333', letterSpacing: '0.5px' }}>Notas y Términos</h4>
                <p style={{ margin: 0, fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                  Esta cotización tiene una vigencia de 15 días naturales a partir de la fecha de emisión. Los precios incluyen únicamente los conceptos descritos. Cualquier trabajo adicional se cotizará por separado. {cotizacionCreada.observaciones && <span><strong>Obs:</strong> {cotizacionCreada.observaciones}</span>}
                </p>
              </div>

              <div style={{ width: '250px', borderTop: '1px solid #999', marginTop: '40px', paddingTop: '8px', fontSize: '11px', color: '#666', textAlign: 'center' }}>
                Nombre y firma de aceptación
              </div>

              <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '35px', paddingTop: '15px', borderTop: '1px dashed #ccc', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => window.print()} style={{ background: '#28a745', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Imprimir / Descargar PDF</button>
                {cotizacionCreada.estado === 'BORRADOR' && (
                  <button onClick={() => actualizarEstadoCotizacion(cotizacionCreada.id, 'APROBADA')} style={{ background: '#ff6600', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✔️ Aprobar</button>
                )}
                <button onClick={() => clonarCotizacionParaEditar(cotizacionCreada)} style={{ background: '#007bff', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Clonar / Editar Ítems</button>
                <button onClick={() => { setCotizacionCreada(null); setVistaActual('historial_cotizaciones'); }} style={{ background: '#6c757d', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📁 Volver al Historial</button>
              </div>
            </div>
          ) : vistaActual === 'lista_clientes' ? (
            <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '25px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #ff6600', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>👤 Listado de Clientes</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar cliente..." 
                    value={busquedaCliente} 
                    onChange={e => setBusquedaCliente(e.target.value)} 
                    style={{ padding: '8px 12px', width: '220px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} 
                  />
                  <button onClick={() => { setClienteEditandoId(null); setCliRazonSocial(''); setCliRut(''); setCliContacto(''); setCliCorreo(''); setCliTelefono(''); setVistaActual('admin_clientes'); }} style={{ background: '#ff6600', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Registrar Cliente</button>
                </div>
              </div>

              {clientesFiltrados.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No hay clientes registrados.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#fff' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Razón Social</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>RUT / NIT</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Contacto</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Teléfono</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Correo</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px' }}><strong>{c.razon_social}</strong></td>
                        <td style={{ padding: '10px' }}>{c.rut_nit || 'N/A'}</td>
                        <td style={{ padding: '10px' }}>{c.contacto_nombre || 'N/A'}</td>
                        <td style={{ padding: '10px' }}>{c.telefono || 'N/A'}</td>
                        <td style={{ padding: '10px' }}>{c.correo || 'N/A'}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button onClick={() => prepararEdicionCliente(c)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Editar</button>
                          <button onClick={() => eliminarCliente(c.id)} style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : vistaActual === 'admin_clientes' ? (
            <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '25px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ff6600', paddingBottom: '10px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>{clienteEditandoId ? '✏️ Editar Cliente' : '👤 Registrar Nuevo Cliente'}</h3>
                <button onClick={() => setVistaActual('lista_clientes')} style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>← Volver al Listado</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="Razón Social *" value={cliRazonSocial} onChange={e => setCliRazonSocial(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                <input type="text" placeholder="RUT / NIT" value={cliRut} onChange={e => setCliRut(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                <input type="text" placeholder="Contacto" value={cliContacto} onChange={e => setCliContacto(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                <input type="email" placeholder="Correo" value={cliCorreo} onChange={e => setCliCorreo(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                <input type="text" placeholder="Teléfono" value={cliTelefono} onChange={e => setCliTelefono(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
              </div>
              <button onClick={guardarOActualizarCliente} style={{ background: '#ff6600', color: '#fff', padding: '12px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{clienteEditandoId ? '💾 Actualizar Cliente' : '💾 Guardar Cliente'}</button>
            </section>
          ) : vistaActual === 'historial_cotizaciones' ? (
            <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '25px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #ff6600', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>📂 Historial de Cotizaciones</h3>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input 
                    type="date" 
                    value={filtroFecha} 
                    onChange={e => setFiltroFecha(e.target.value)} 
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} 
                  />
                  {filtroFecha && (
                    <button onClick={() => setFiltroFecha('')} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Limpiar Fecha</button>
                  )}
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar por cliente o N°..." 
                    value={busquedaHistorial} 
                    onChange={e => setBusquedaHistorial(e.target.value)} 
                    style={{ padding: '8px 12px', width: '240px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} 
                  />
                </div>
              </div>

              {cotizacionesFiltradas.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No se encontraron cotizaciones registradas.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#fff' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>N° / Nombre Archivo</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Cliente</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total Final</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Estado</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cotizacionesFiltradas.map((cot) => (
                      <tr key={cot.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px' }}><strong>{cot.numero_cotizacion || 'COT-0155'}</strong></td>
                        <td style={{ padding: '10px' }}>{new Date(cot.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '10px' }}>{cot.clientes?.razon_social || 'Cliente General'}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>${Math.round(cot.total_general || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            background: cot.estado === 'APROBADA' ? '#137333' : '#b06000', 
                            color: '#fff' 
                          }}>
                            {cot.estado || 'BORRADOR'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button onClick={() => verCotizacionDesdeHistorial(cot)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }} title="Ver Cotización">👁️</button>
                          <button onClick={() => clonarCotizacionParaEditar(cot)} style={{ background: '#007bff', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }} title="Clonar / Modificar Ítems">🔄</button>
                          {cot.estado === 'BORRADOR' && (
                            <button onClick={() => actualizarEstadoCotizacion(cot.id, 'APROBADA')} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }} title="Aprobar">✔️</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : vistaActual === 'lista_insumos' ? (
            <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '25px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #ff6600', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Listado de Insumos Industriales</h3>
                <button onClick={() => { setInsumoEditandoId(null); setInsumoNombre(''); setVistaActual('admin_insumos_procesos'); }} style={{ background: '#ff6600', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Registrar Insumo</button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Presentación</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Dimensiones</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Costo Neto Total</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px' }}><strong>{i.nombre}</strong></td>
                      <td style={{ padding: '10px' }}>{i.tipo_presentacion}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{i.ancho_mts}m x {i.largo_mts}m</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>${Number(i.costo_neto || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button onClick={() => prepararEdicionInsumo(i)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Editar</button>
                        <button onClick={() => eliminarInsumo(i.id)} style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : vistaActual === 'lista_procesos' ? (
            <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '25px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #ff6600', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Listado de Procesos Operativos</h3>
                <button onClick={() => { setProcesoEditandoId(null); setNuevoProcesoNombre(''); setVistaActual('admin_insumos_procesos'); }} style={{ background: '#ff6600', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Registrar Proceso</button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Tipo</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Costo por Hora</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {procesos.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px' }}><strong>{p.nombre}</strong></td>
                      <td style={{ padding: '10px' }}>{p.tipo}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>${Number(p.costo_operativo_hora || 0).toLocaleString()} /hr</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button onClick={() => prepararEdicionProceso(p)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Editar</button>
                        <button onClick={() => eliminarProceso(p.id)} style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : vistaActual === 'admin_insumos_procesos' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <h3 style={{ borderBottom: '2px solid #ff6600', paddingBottom: '10px', marginTop: 0 }}>{insumoEditandoId ? '✏️ Editar Insumo' : '🧱 Registrar Insumo'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" placeholder="Nombre" value={insumoNombre} onChange={e => setInsumoNombre(e.target.value)} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                  <select value={insumoPresentacion} onChange={e => setInsumoPresentacion(e.target.value)} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }}>
                    <option value="Rollo">Rollo</option>
                    <option value="Plancha">Plancha</option>
                    <option value="Unidad">Unidad</option>
                  </select>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input type="number" step="0.01" placeholder="Ancho (m)" value={insumoAncho} onChange={e => setInsumoAncho(Number(e.target.value))} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                    <input type="number" step="0.01" placeholder="Largo (m)" value={insumoLargo} onChange={e => setInsumoLargo(Number(e.target.value))} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                  </div>
                  <input type="number" placeholder="Costo Neto Total ($)" value={insumoCostoNeto} onChange={e => setInsumoCostoNeto(Number(e.target.value))} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                  <button onClick={guardarOActualizarInsumo} style={{ background: '#ff6600', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{insumoEditandoId ? 'Actualizar Insumo' : 'Guardar Insumo'}</button>
                </div>
              </section>

              <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <h3 style={{ borderBottom: '2px solid #ff6600', paddingBottom: '10px', marginTop: 0 }}>{procesoEditandoId ? '✏️ Editar Proceso' : '⚙️ Registrar Proceso'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" placeholder="Nombre Proceso" value={nuevoProcesoNombre} onChange={e => setNuevoProcesoNombre(e.target.value)} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                  <input type="number" placeholder="Costo Hora ($)" value={nuevoProcesoCostoHora} onChange={e => setNuevoProcesoCostoHora(Number(e.target.value))} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                  <button onClick={guardarOActualizarProceso} style={{ background: '#ff6600', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{procesoEditandoId ? 'Actualizar Proceso' : 'Guardar Proceso'}</button>
                </div>
              </section>
            </div>
          ) : vistaActual === 'lista_productos' ? (
            <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '25px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #ff6600', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Catálogo Maestro de Productos</h3>
                <button onClick={() => { setProductoEditandoId(null); setNombreProdNuevo(''); setVistaActual('admin_productos'); }} style={{ background: '#ff6600', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Crear Nuevo Producto</button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Costo Base</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Utilidad</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Precio Base / m²</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosCat.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px' }}><strong>{p.nombre}</strong></td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>${Number(p.costo_base || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{p.porcentaje_utilidad}%</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#ff6600', fontWeight: 'bold' }}>${Number(p.precio_venta_fijo || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button onClick={() => prepararEdicionProducto(p)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Editar</button>
                        <button onClick={() => eliminarProducto(p.id)} style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : vistaActual === 'admin_productos' ? (
            <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '25px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <h3 style={{ borderBottom: '2px solid #ff6600', paddingBottom: '10px', marginTop: 0 }}>{productoEditandoId ? '✏️ Editar Producto' : '⚙️ Configurador de Producto (BOM)'}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="Nombre del Producto" value={nombreProdNuevo} onChange={e => setNombreProdNuevo(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
                <input type="text" placeholder="Descripción" value={descProdNuevo} onChange={e => setDescProdNuevo(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }} />
              </div>

              <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #334155' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>1. Materiales Involucrados (BOM)</h4>
                {bomInsumos.map((fila, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '10px', marginBottom: '10px' }}>
                    <select value={fila.insumo_id} onChange={e => {
                      const nuevo = [...bomInsumos];
                      nuevo[idx].insumo_id = e.target.value;
                      setBomInsumos(nuevo);
                    }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#121824', color: '#fff' }}>
                      <option value="">-- Seleccionar Insumo --</option>
                      {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                    </select>
                    <input type="number" step="0.01" placeholder="Cant." value={fila.cantidad} onChange={e => {
                      const nuevo = [...bomInsumos];
                      nuevo[idx].cantidad = Number(e.target.value);
                      setBomInsumos(nuevo);
                    }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#121824', color: '#fff' }} />
                    <button onClick={() => eliminarFilaInsumo(idx)} style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                  </div>
                ))}
                <button onClick={agregarFilaInsumo} style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>+ Agregar Insumo</button>
              </div>

              <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #334155' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>2. Procesos Operativos</h4>
                {rutaProcesos.map((fila, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '10px', marginBottom: '10px' }}>
                    <select value={fila.proceso_id} onChange={e => {
                      const nuevo = [...rutaProcesos];
                      nuevo[idx].proceso_id = e.target.value;
                      setRutaProcesos(nuevo);
                    }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#121824', color: '#fff' }}>
                      <option value="">-- Seleccionar Proceso --</option>
                      {procesos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <input type="number" step="0.1" placeholder="Horas" value={fila.horas} onChange={e => {
                      const nuevo = [...rutaProcesos];
                      nuevo[idx].horas = Number(e.target.value);
                      setRutaProcesos(nuevo);
                    }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#121824', color: '#fff' }} />
                    <button onClick={() => eliminarFilaProceso(idx)} style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                  </div>
                ))}
                <button onClick={agregarFilaProceso} style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>+ Agregar Proceso</button>
              </div>

              <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontWeight: 'bold', color: '#fff' }}>Margen de Utilidad (%):</label>
                <input 
                  type="number" 
                  value={utilidadProdNuevo} 
                  onChange={e => setUtilidadProdNuevo(Number(e.target.value))} 
                  style={{ padding: '8px 12px', width: '120px', borderRadius: '6px', border: '1px solid #334155', background: '#121824', color: '#fff', fontWeight: 'bold', fontSize: '15px', textAlign: 'right' }} 
                />
              </div>

              <button onClick={ejecutarAnalisisCompuesto} style={{ background: '#ff6600', color: '#fff', padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginBottom: '15px' }}>📊 Simular Costo Total y Precio Redondeado</button>

              {analisisResultado && (
                <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ff6600' }}>
                  <p style={{ color: '#fff' }}>Costo Base Total: <strong>${analisisResultado.costoBase.toLocaleString()}</strong></p>
                  <h3 style={{ color: '#ff6600' }}>Precio Venta Sugerido (Aprox.): ${analisisResultado.precioVenta.toLocaleString()}</h3>
                  <button onClick={guardarOActualizarProducto} style={{ background: '#28a745', color: '#fff', padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '10px' }}>💾 Guardar Producto</button>
                </div>
              )}
            </section>
          ) : (
            <>
              {/* TARJETA 1: DATOS DEL CLIENTE */}
              <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '24px', borderRadius: '12px', marginBottom: '24px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ff6600', paddingBottom: '12px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: '#ff6600', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>1</span>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Datos del Cliente</h3>
                  </div>
                  <select onChange={e => handleSeleccionarClienteExistente(e.target.value)} value={clienteSeleccionadoId} style={{ padding: '8px 12px', minWidth: '220px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '13px' }}>
                    <option value="">👤 Cliente de prueba</option>
                    {clientesDb.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input type="text" placeholder="Razón Social *" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '14px' }} />
                  <input type="text" placeholder="RUT / NIT" value={rutNit} onChange={e => setRutNit(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '14px' }} />
                  <input type="text" placeholder="Contacto" value={contacto} onChange={e => setContacto(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '14px' }} />
                  <input type="text" placeholder="Correo" value={correo} onChange={e => setCorreo(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '14px' }} />
                  <input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '14px', gridColumn: 'span 2' }} />
                </div>
              </section>

              {/* TARJETA 2: SELECCIÓN DE PRODUCTO Y MEDIDAS */}
              <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '24px', borderRadius: '12px', marginBottom: '24px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #ff6600', paddingBottom: '12px', marginBottom: '18px' }}>
                  <span style={{ background: '#ff6600', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>2</span>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Seleccionar Producto y Medidas (Alto x Ancho)</h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end', marginBottom: '15px' }}>
                  <div>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Producto del Catálogo</label>
                    <select onChange={handleSeleccionarProductoCatalogo} value={productoSeleccionadoId} style={{ padding: '10px 12px', width: '100%', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '13px' }}>
                      <option value="">-- Seleccionar producto --</option>
                      {productosCat.map(p => <option key={p.id} value={p.id}>{p.nombre} (${p.precio_venta_fijo}/m²)</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Alto (m)</label>
                    <input type="number" step="0.01" min="0.01" value={altoMts} onChange={e => setAltoMts(Number(e.target.value))} style={{ padding: '10px 12px', width: '100%', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '13px' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Ancho (m)</label>
                    <input type="number" step="0.01" min="0.01" value={anchoMts} onChange={e => setAnchoMts(Number(e.target.value))} style={{ padding: '10px 12px', width: '100%', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '13px' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Cantidad</label>
                    <input type="number" min="1" value={cantidadCatalogo} onChange={e => setCantidadCatalogo(Number(e.target.value))} style={{ padding: '10px 12px', width: '100%', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '13px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '15px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Descuento Ítem (%)</label>
                    <input type="number" min="0" max="100" value={descuentoItemPct} onChange={e => setDescuentoItemPct(Number(e.target.value))} style={{ padding: '10px 12px', width: '200px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '13px' }} />
                  </div>
                  
                  <button onClick={calcularPrecioPorMedidas} disabled={!productoActualObj} style={{ background: '#1e293b', color: '#fff', padding: '11px 20px', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>🧮 Calcular Precio (Aprox.)</button>
                </div>

                {calculoItemResultado && (
                  <div style={{ background: '#1e293b', padding: '18px', borderRadius: '10px', marginTop: '18px', border: '1px solid #334155' }}>
                    <p style={{ margin: '4px 0', color: '#cbd5e1' }}>Área calculada: <strong>{calculoItemResultado.areaM2} m²</strong> (Alto {altoMts}m x Ancho {anchoMts}m)</p>
                    <p style={{ margin: '4px 0', color: '#cbd5e1' }}>Precio Unitario Base: ${calculoItemResultado.precioUnitarioBase.toLocaleString()} /m²</p>
                    <p style={{ margin: '4px 0', color: '#cbd5e1' }}>Subtotal Bruto ({cantidadCatalogo} un.): ${calculoItemResultado.subtotalBruto.toLocaleString()}</p>
                    {calculoItemResultado.descuentoMonto > 0 && (
                      <p style={{ margin: '4px 0', color: '#f87171' }}>Descuento ({descuentoItemPct}%): -${calculoItemResultado.descuentoMonto.toLocaleString()}</p>
                    )}
                    <h3 style={{ color: '#ff6600', margin: '10px 0 14px 0', fontSize: '18px' }}>Total Neto Ítem (Redondeado): ${calculoItemResultado.totalNeto.toLocaleString()}</h3>
                    
                    <button onClick={agregarItemCalculadoAlPedido} style={{ background: '#ff6600', color: '#fff', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold', fontSize: '14px' }}>+ Agregar al Pedido</button>
                  </div>
                )}
              </section>

              {/* TARJETA 3: DETALLE Y CIERRE DEL PEDIDO */}
              <section style={{ background: '#121824', border: '1px solid #1e293b', padding: '24px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #ff6600', paddingBottom: '12px', marginBottom: '18px' }}>
                  <span style={{ background: '#ff6600', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>3</span>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Detalle y Cierre del Pedido</h3>
                </div>

                {itemsCotizacion.length === 0 ? <p style={{ color: '#94a3b8', fontStyle: 'italic', padding: '10px 0' }}>📄 No hay ítems agregados.</p> : (
                  <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#fff' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Descripción</th>
                        <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>Cant.</th>
                        <th style={{ padding: '10px', textAlign: 'right', width: '110px' }}>Total</th>
                        <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsCotizacion.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>{it.descripcion_item}</td>
                          <td style={{ padding: '10px', textAlign: 'center', color: '#cbd5e1' }}>{it.cantidad}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>${(it.precio_total_linea || 0).toLocaleString()}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}><button onClick={() => eliminarItem(idx)} style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '20px', gap: '8px', borderTop: '1px solid #1e293b', paddingTop: '15px' }}>
                  <p style={{ margin: 0, color: '#cbd5e1' }}>Subtotal ítems: <strong>${subtotalItems.toLocaleString()}</strong></p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '13px' }}>Descuento Global (%):</label>
                    <input type="number" min="0" max="100" value={porcentajeDescuentoGlobal} onChange={e => setPorcentajeDescuentoGlobal(Number(e.target.value))} style={{ padding: '6px 10px', width: '80px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff', textAlign: 'center' }} />
                    <span style={{ color: '#f87171' }}>(-${montoDescuentoGlobal.toLocaleString()})</span>
                  </div>

                  <p style={{ margin: 0, color: '#cbd5e1' }}>IVA (19%): <strong>+${montoIva.toLocaleString()}</strong></p>
                  <h2 style={{ color: '#ff6600', margin: '5px 0 0 0', fontSize: '20px' }}>TOTAL FINAL (Exacto Fiscal): ${totalGlobalFinal.toLocaleString()}</h2>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <label style={{ color: '#cbd5e1', fontSize: '13px' }}><strong>Condición de Pago:</strong></label>
                  <select value={condicionPago} onChange={e => setCondicionPago(e.target.value as any)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
                    <option value="Contado">Contado</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>

                <div style={{ marginTop: '15px' }}>
                  <textarea placeholder="Observaciones de la cotización (opcional)..." value={observaciones} onChange={e => setObservaciones(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '13px', boxSizing: 'border-box', minHeight: '80px' }} />
                </div>

                <button onClick={cerrarYGuardarCotizacion} disabled={guardando || itemsCotizacion.length === 0} style={{ marginTop: '20px', background: '#ff6600', color: '#fff', padding: '14px 28px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '16px', boxShadow: '0 4px 12px rgba(255,102,0,0.3)' }}>{guardando ? 'Guardando...' : 'Cerrar y Guardar Cotización'}</button>
              </section>
            </>
          )}

        </main>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background: #eef2f6;
        }
        @media print {
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .pdf-container {
            border: none !important;
            box-shadow: none !important;
            padding: 10px 15px !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          @page {
            size: portrait;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
}