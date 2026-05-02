import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { system } from './theme'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider value={system}>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
)
