import { Routes, Route } from 'react-router-dom';
import { MainEditor } from '../components/editor';

const AppRouter = () => {
  return (
    <Routes>
      {}
      <Route path="/" element={<MainEditor />} />

      {}
      <Route path="/editor" element={<MainEditor />} />

      {}
      <Route path="*" element={<MainEditor />} />
    </Routes>
  );
};

export default AppRouter;
