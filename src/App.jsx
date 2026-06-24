import Auth from './componnets/Auth'
import AdminLayout from './componnets/admin/AdminLayout'
import Overview from './componnets/admin/Overview'
import Products from './componnets/admin/Products'
import Categories from './componnets/admin/Categories'
import Collections from './componnets/admin/Collections'
import Orders from './componnets/admin/Orders'
import Users from './componnets/admin/Users'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="collections" element={<Collections />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
