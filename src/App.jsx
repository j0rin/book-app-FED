import { Route, Routes } from 'react-router';
import BookDetails from './pages/BookDetails';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
