import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import { ProductPage } from './pages/ProductPage'
import { ProductForm } from './pages/ProductForm'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to='/product' />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/product-create" element={<ProductForm />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
