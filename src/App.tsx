import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { Toaster } from './components/ui/toaster'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import ReportIssue from './pages/ReportIssue'
import Confirmation from './pages/Confirmation'
import Dashboard from './pages/Dashboard'
import AgentLogin from './pages/AgentLogin'
import AgentDashboard from './pages/AgentDashboard'
import AgentResolve from './pages/AgentResolve'

export default function App() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Routes>
        <Route path="/"                  element={<Landing />} />
        <Route path="/report"            element={<ReportIssue />} />
        <Route path="/confirmation/:id"  element={<Confirmation />} />
        <Route path="/dashboard"         element={<Dashboard />} />
        <Route path="/agent"             element={<AgentLogin />} />
        <Route path="/agent/dashboard"   element={<AgentDashboard />} />
        <Route path="/agent/resolve/:id" element={<AgentResolve />} />
      </Routes>
      <Toaster />
    </Box>
  )
}
