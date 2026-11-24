import React from 'react';
import ReactDOM from 'react-dom/client';
import {HashRouter} from 'react-router-dom';
import {App} from './App';
import {Workspace} from './store/Workspace';
import './styles.css';
import './engineering.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode><HashRouter><Workspace><App/></Workspace></HashRouter></React.StrictMode>,
);
