# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Categoria(models.Model):
    idcategoria = models.AutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=50)
    descripcion = models.CharField(max_length=256, blank=True, null=True)
    estado = models.TextField(blank=True, null=True)  # This field type is a guess.

    class Meta:
        managed = False
        db_table = 'categoria'


class DetalleIngreso(models.Model):
    iddetalle_ingreso = models.AutoField(primary_key=True)
    idingreso = models.ForeignKey('Ingreso', models.DO_NOTHING, db_column='idingreso')
    idproducto = models.ForeignKey('Producto', models.DO_NOTHING, db_column='idproducto')
    cantidad = models.IntegerField()
    precio = models.DecimalField(max_digits=11, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'detalle_ingreso'


class DetalleVenta(models.Model):
    iddetalle_venta = models.AutoField(primary_key=True)
    idventa = models.ForeignKey('Venta', models.DO_NOTHING, db_column='idventa')
    idproducto = models.ForeignKey('Producto', models.DO_NOTHING, db_column='idproducto')
    cantidad = models.IntegerField()
    precio = models.DecimalField(max_digits=11, decimal_places=2)
    descuento = models.DecimalField(max_digits=11, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'detalle_venta'


class Ingreso(models.Model):
    idingreso = models.AutoField(primary_key=True)
    idproveedor = models.ForeignKey('Persona', models.DO_NOTHING, db_column='idproveedor')
    idusuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='idusuario')
    tipo_comprobante = models.CharField(max_length=20)
    serie_comprobante = models.CharField(max_length=7, blank=True, null=True)
    num_comprobante = models.CharField(max_length=10)
    fecha = models.DateTimeField()
    impuesto = models.DecimalField(max_digits=4, decimal_places=2)
    total = models.DecimalField(max_digits=11, decimal_places=2)
    estado = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'ingreso'


class Persona(models.Model):
    idpersona = models.AutoField(primary_key=True)
    tipo_persona = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    tipo_documento = models.CharField(max_length=20, blank=True, null=True)
    num_documento = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.CharField(max_length=70, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'persona'


class Producto(models.Model):
    idproducto = models.AutoField(primary_key=True)
    idcategoria = models.ForeignKey(Categoria, models.DO_NOTHING, db_column='idcategoria')
    codigo = models.CharField(max_length=50, blank=True, null=True)
    nombre = models.CharField(unique=True, max_length=100)
    precio_venta = models.DecimalField(max_digits=11, decimal_places=2)
    stock = models.IntegerField()
    descripcion = models.CharField(max_length=256, blank=True, null=True)
    estado = models.TextField(blank=True, null=True)  # This field type is a guess.

    class Meta:
        managed = False
        db_table = 'producto'


class Rol(models.Model):
    idrol = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=30)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    estado = models.TextField(blank=True, null=True)  # This field type is a guess.

    class Meta:
        managed = False
        db_table = 'rol'


class Usuario(models.Model):
    idusuario = models.AutoField(primary_key=True)
    idrol = models.ForeignKey(Rol, models.DO_NOTHING, db_column='idrol')
    nombre = models.CharField(max_length=100)
    tipo_documento = models.CharField(max_length=20, blank=True, null=True)
    num_documento = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.CharField(max_length=70, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.CharField(unique=True, max_length=50)
    password = models.CharField(max_length=256)
    estado = models.TextField(blank=True, null=True)  # This field type is a guess.

    class Meta:
        managed = False
        db_table = 'usuario'


class Venta(models.Model):
    idventa = models.AutoField(primary_key=True)
    idcliente = models.ForeignKey(Persona, models.DO_NOTHING, db_column='idcliente')
    idusuario = models.ForeignKey(Usuario, models.DO_NOTHING, db_column='idusuario')
    tipo_comprobante = models.CharField(max_length=20)
    serie_comprobante = models.CharField(max_length=7, blank=True, null=True)
    num_comprobante = models.CharField(max_length=10)
    fecha_hora = models.DateTimeField()
    impuesto = models.DecimalField(max_digits=4, decimal_places=2)
    total = models.DecimalField(max_digits=11, decimal_places=2)
    estado = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'venta'
