import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CmsLayout from '@/components/layout/CmsLayout'
import ContactsLayout from '@/components/layout/ContactsLayout'
import PendingVerificationLayout from '@/components/layout/PendingVerificationLayout'
import MessagesLayout from '@/components/layout/MessagesLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CmsLayout />} />
        <Route path="/contacts" element={<ContactsLayout />} />
        <Route path="/pending-verification" element={<PendingVerificationLayout />} />
        <Route path="/messages" element={<MessagesLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
