import { useEffect } from 'react'
import { Box } from '@chakra-ui/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import AgentDashboard from './pages/AgentDashboard'
import AgentLogin from './pages/AgentLogin'
import AgentResolve from './pages/AgentResolve'
import AgentConfirmed from './pages/AgentConfirmed'
import Confirmation from './pages/Confirmation'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import ReportIssue from './pages/ReportIssue'
import { checkAndSendFridayReminders } from './lib/friday'

function App() {
  useEffect(() => {
    // Fire-and-forget — sends accountability emails every Friday automatically
    checkAndSendFridayReminders().catch(console.error)
  }, [])

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/confirmation/:issueId" element={<Confirmation />} />
        <Route path="/agent/login" element={<AgentLogin />} />
        <Route path="/agent/dashboard" element={<AgentDashboard />} />
        <Route path="/agent/resolve/:id" element={<AgentResolve />} />
        <Route path="/agent/confirmed/:id" element={<AgentConfirmed />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  )
}

export default App
