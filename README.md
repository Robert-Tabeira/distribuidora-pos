# Distribuidora POS

Sistema de punto de venta para distribuidoras. Permite que los empleados del mostrador armen pedidos y los envíen a la caja en tiempo real.

## Características

- 📱 PWA - Se puede instalar como app en celulares
- ⚡ Tiempo real - Los pedidos llegan instantáneamente a la caja
- 👥 Multi-usuario - Varios empleados pueden trabajar simultáneamente
- 🔐 Login con PIN - Simple y rápido

## Tech Stack

- Next.js 15 (App Router)
- Supabase (Base de datos + Realtime)
- Tailwind CSS
- TypeScript

## Setup

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd distribuidora-pos
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Configurar Supabase

Ejecutar en el SQL Editor de Supabase:

```sql
-- Categorías
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit TEXT CHECK (unit IN ('unidad', 'kg', 'litro')) DEFAULT 'unidad',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Empleados
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT CHECK (role IN ('mostrador', 'caja', 'admin')) DEFAULT 'mostrador',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  employee_id UUID REFERENCES employees(id),
  status TEXT CHECK (status IN ('draft', 'sent', 'completed')) DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items del pedido
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  weight DECIMAL(10,3),
  volume DECIMAL(10,3),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- ⚠️ SOLO PARA PRUEBAS LOCALES. Estas policies permiten que cualquier
-- visitante lea, modifique o borre datos usando la clave pública.
-- No las uses en producción. El despliegue necesita políticas RLS por rol
-- y autenticación real; el login de la interfaz no protege la Data API.
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true);
CREATE POLICY "Allow all" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all" ON order_items FOR ALL USING (true);

-- Datos iniciales
INSERT INTO categories (name, order_position) VALUES
  ('Lácteos', 1),
  ('Quesos', 2),
  ('Panificados', 3),
  ('Bebidas', 4),
  ('Bebidas Alcohólicas', 5),
  ('Repostería', 6),
  ('Carnes', 7),
  ('Fiambres', 8),
  ('Limpieza', 9),
  ('Mascotas', 10),
  ('Comestibles', 11),
  ('Copetín', 12),
  ('Promos', 99);

-- Empleado de prueba
INSERT INTO employees (name, pin, role) VALUES
  ('Admin', '1234', 'admin'),
  ('Mostrador', '1111', 'mostrador'),
  ('Cajero', '0000', 'caja');
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Deploy en Vercel

1. Subir el proyecto a GitHub
2. Ir a [vercel.com](https://vercel.com) y crear nuevo proyecto
3. Importar el repo de GitHub
4. Agregar las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

## Uso

### Roles

- **Admin** (`/admin`): Puede agregar/eliminar productos
- **Mostrador** (`/mostrador`): Arma pedidos y los envía a caja
- **Caja** (`/caja`): Ve los pedidos en tiempo real y los finaliza

### Flujo

1. El empleado de mostrador ingresa con su PIN
2. Pide el nombre del cliente
3. Agrega productos al pedido (cantidad, peso si aplica)
4. Envía el pedido a caja
5. El cajero ve el pedido aparecer en tiempo real
6. El cajero lo pasa a su sistema de facturación y marca como finalizado

## Estructura

```
src/
├── app/
│   ├── admin/       # ABM de productos
│   ├── caja/        # Vista del cajero
│   ├── login/       # Selección de empleado + PIN
│   ├── mostrador/   # Armado de pedidos
│   ├── globals.css  # Estilos globales
│   └── layout.tsx   # Layout principal
├── lib/
│   └── supabase.ts  # Cliente de Supabase
└── types/
    └── database.ts  # Tipos TypeScript
```
