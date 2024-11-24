import { BrowserRouter, Route, Routes } from "react-router";

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<>/</>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
