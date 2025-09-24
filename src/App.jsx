import './App.css'
import {BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./Sidebar"
import Homepage from './homepage';
import Browse from './browse';
import Radio from './Radio';

export default function App() {
  return (
    <BrowserRouter>
    <div className='layout'>
        <Sidebar/>
      <div className='main'>
        <Routes>
          <Route path="/" element={<Homepage />}/>
          <Route path="/Browse" element={<Browse />}/>
          <Route path="/Radio" element={<Radio/>}/>
        </Routes>
       </div>
    </div>
    </BrowserRouter>
  )
}

