import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DialogRoot } from "./components/common/Modal.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DialogRoot />
    <App />
  </StrictMode>,
);
