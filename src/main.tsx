
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Find the root element and render the app
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  const root = createRoot(rootElement);
  root.render(<App />);
}
