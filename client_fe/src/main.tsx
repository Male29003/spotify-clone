import ReactDom from 'react-dom/client'
import App from './App.js'
import './index.css';

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDom.createRoot(rootElement).render(
    <App />
  );
} else {
  console.error("Root element not found");
}
